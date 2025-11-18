import { useEffect, useState } from 'react'
import sql from '../lib/neon'

function CustomerDetail({ customerId, onEdit, onDelete, onBack, onEditOrder = () => {} }) {
  const [customer, setCustomer] = useState(null)
  const [orders, setOrders] = useState([])
  const [ordersLoading, setOrdersLoading] = useState(true)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    const fetchCustomer = async () => {
      try {
        setLoading(true)
        setError(null)
        const result = await sql`
          SELECT 
            c.id,
            c.fullname,
            c.phone,
            c.email,
            c.doctype,
            c.doc,
            c.country,
            c.birthdate,
            c.note,
            c.hotel_id,
            c.agency_id,
            c.created_at,
            c.updated_at,
            h.name AS hotel_name,
            a.name AS agency_name
          FROM customers c
          LEFT JOIN hotels h ON c.hotel_id = h.id
          LEFT JOIN agencies a ON c.agency_id = a.id
          WHERE c.id = ${customerId}
          LIMIT 1
        `
        
        if (result && result.length > 0) {
          setCustomer(result[0])
        } else {
          setError('Customer not found')
        }
      } catch (err) {
        console.error('Failed to load customer:', err)
        setError('Unable to load customer. Please try again later.')
      } finally {
        setLoading(false)
      }
    }

    if (customerId) {
      fetchCustomer()
    }
  }, [customerId])

  // Fetch customer orders
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setOrdersLoading(true)
        const rows =
          (await sql`
            SELECT
              o.id,
              o.cancelled,
              o.created_at,
              s.name AS service_name,
              sc.name AS category_name,
              COALESCE(ol.starting, orent.starting, ost.starting) AS starting,
              COALESCE(ol.ending, orent.ending, ost.ending) AS ending,
              CASE
                WHEN ol.order_id IS NOT NULL THEN 'lessons'
                WHEN orent.order_id IS NOT NULL THEN 'rentals'
                WHEN ost.order_id IS NOT NULL THEN 'storage'
                ELSE 'other'
              END AS type,
              ol.student_id,
              ol.instructor_id,
              i.fullname AS instructor_name,
              ol.note AS lesson_note,
              orent.equipment_id,
              e.name AS equipment_name,
              orent.hourly,
              orent.daily,
              orent.weekly,
              orent.note AS rental_note,
              ost.storage_id,
              ost.daily AS storage_daily,
              ost.weekly AS storage_weekly,
              ost.monthly AS storage_monthly,
              ost.note AS storage_note
            FROM orders o
            JOIN services s ON s.id = o.service_id
            JOIN service_categories sc ON sc.id = s.category_id
            LEFT JOIN orders_lessons ol ON ol.order_id = o.id
            LEFT JOIN orders_rentals orent ON orent.order_id = o.id
            LEFT JOIN orders_storage ost ON ost.order_id = o.id
            LEFT JOIN instructors i ON i.id = ol.instructor_id
            LEFT JOIN equipment e ON e.id = orent.equipment_id
            WHERE o.customer_id = ${customerId}
            ORDER BY o.created_at DESC
          `) || []
        
        const decorated = rows.map((row) => ({
          ...row,
          status: determineStatus(row)
        }))

        setOrders(decorated)
      } catch (err) {
        console.error('Failed to load orders:', err)
      } finally {
        setOrdersLoading(false)
      }
    }

    if (customerId) {
      fetchOrders()
    }
  }, [customerId])

  const determineStatus = (order) => {
    if (order.cancelled) return 'cancelled'
    const now = new Date()
    const start = order.starting ? new Date(order.starting) : null
    const end = order.ending ? new Date(order.ending) : null
    if (!start || !end) return 'pending'
    if (now < start) return 'pending'
    if (now >= start && now <= end) return 'in_progress'
    if (now > end) return 'completed'
    return 'pending'
  }

  const statusStyles = {
    pending: 'bg-yellow-100 text-yellow-800',
    in_progress: 'bg-blue-100 text-blue-800',
    completed: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800'
  }

  const renderStatusBadge = (status) => {
    const classes = statusStyles[status] || 'bg-gray-100 text-gray-700'
    const label =
      status === 'in_progress'
        ? 'In Progress'
        : status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')
    return (
      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${classes}`}>
        {label}
      </span>
    )
  }

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this customer? This action cannot be undone.')) {
      return
    }

    try {
      setDeleting(true)
      await sql`DELETE FROM customers WHERE id = ${customerId}`
      onDelete?.()
    } catch (err) {
      console.error('Failed to delete customer:', err)
      alert('Unable to delete customer. Please try again.')
    } finally {
      setDeleting(false)
    }
  }

  const formatDate = (value) => {
    if (!value) return '—'
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return value
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatDateTime = (value) => {
    if (!value) return '—'
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return value
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  const formatOrderDate = (value) => {
    if (!value) return '—'
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return value
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  if (loading) {
    return (
      <div className="px-4 py-6 sm:p-6 lg:p-8">
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <div className="text-gray-600">Loading customer details...</div>
        </div>
      </div>
    )
  }

  if (error || !customer) {
    return (
      <div className="px-4 py-6 sm:p-6 lg:p-8">
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <div className="text-red-600">{error || 'Customer not found'}</div>
          {onBack && (
            <button
              onClick={onBack}
              className="mt-4 rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Back to Customers
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="px-4 py-6 sm:p-6 lg:p-8">
      <div className="rounded-xl bg-white p-4 sm:p-6 shadow-sm">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6 pb-6 border-b border-gray-200">
          <div>
            <button
              onClick={onBack}
              className="mb-2 flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Customers
            </button>
            <h1 className="text-3xl font-bold text-gray-900">{customer.fullname || 'Customer'}</h1>
            <p className="text-gray-500 text-sm mt-1">Customer details and information</p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => onEdit?.(customer)}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50 transition-colors"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15.232 5.232l3.536 3.536M16.732 3.732a2.5 2.5 0 113.536 3.536L7.5 20.036H4v-3.572L16.732 3.732z"
                />
              </svg>
              Edit
            </button>
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-red-300 bg-white px-4 py-2 text-sm font-semibold text-red-700 shadow-sm hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
              {deleting ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </div>

        {/* Customer Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Personal Information */}
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h2>
              <dl className="space-y-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Full Name</dt>
                  <dd className="mt-1 text-sm text-gray-900">{customer.fullname || '—'}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Phone</dt>
                  <dd className="mt-1 text-sm text-gray-900">{customer.phone || '—'}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Email</dt>
                  <dd className="mt-1 text-sm text-gray-900">{customer.email || '—'}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Birthdate</dt>
                  <dd className="mt-1 text-sm text-gray-900">{formatDate(customer.birthdate)}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Country</dt>
                  <dd className="mt-1 text-sm text-gray-900">{customer.country || '—'}</dd>
                </div>
              </dl>
            </div>
          </div>

          {/* Document & Contact Information */}
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Document & Contact</h2>
              <dl className="space-y-4">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Document Type</dt>
                  <dd className="mt-1 text-sm text-gray-900">{customer.doctype || '—'}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Document Number</dt>
                  <dd className="mt-1 text-sm text-gray-900">{customer.doc || '—'}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Hotel</dt>
                  <dd className="mt-1 text-sm text-gray-900">{customer.hotel_name || '—'}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Agency</dt>
                  <dd className="mt-1 text-sm text-gray-900">{customer.agency_name || '—'}</dd>
                </div>
              </dl>
            </div>
          </div>
        </div>

        {/* Note */}
        {customer.note && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Note</h2>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{customer.note}</p>
          </div>
        )}

        {/* Metadata */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-gray-500">Customer ID</dt>
              <dd className="mt-1 text-gray-900 font-mono">#{customer.id}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Created At</dt>
              <dd className="mt-1 text-gray-900">{formatDateTime(customer.created_at)}</dd>
            </div>
            {customer.updated_at && (
              <div>
                <dt className="text-gray-500">Last Updated</dt>
                <dd className="mt-1 text-gray-900">{formatDateTime(customer.updated_at)}</dd>
              </div>
            )}
          </dl>
        </div>

        {/* Orders Section */}
        <div className="mt-8 pt-8 border-t border-gray-200">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Orders</h2>
              <p className="text-gray-500 text-sm mt-1">
                All orders for this customer ({orders.length} {orders.length === 1 ? 'order' : 'orders'})
              </p>
            </div>
          </div>

          {ordersLoading ? (
            <div className="text-gray-600 text-sm py-8">Loading orders...</div>
          ) : orders.length === 0 ? (
            <div className="text-gray-500 text-sm py-8 text-center border border-dashed border-gray-300 rounded-lg">
              No orders found for this customer.
            </div>
          ) : (
            <div className="space-y-4">
              {/* Desktop view */}
              <div className="hidden md:block overflow-x-auto border border-gray-200 rounded-xl">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Order #
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Type
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Service
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Category
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Starting
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Ending
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {orders.map((order) => (
                      <tr
                        key={order.id}
                        onClick={() => onEditOrder({ id: order.id })}
                        className="hover:bg-gray-50 cursor-pointer"
                      >
                        <td className="px-4 py-3 text-sm text-gray-900 font-medium">#{order.id}</td>
                        <td className="px-4 py-3 text-sm text-gray-600 capitalize">{order.type || '—'}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{order.service_name || '—'}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{order.category_name || '—'}</td>
                        <td className="px-4 py-3 text-sm">{renderStatusBadge(order.status)}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{formatOrderDate(order.starting)}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{formatOrderDate(order.ending)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile view */}
              <div className="md:hidden space-y-4">
                {orders.map((order) => (
                  <div
                    key={order.id}
                    onClick={() => onEditOrder({ id: order.id })}
                    className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between gap-3 mb-3">
                      <div className="flex-1">
                        <p className="text-base font-semibold text-gray-900">
                          Order #{order.id} · {order.type || 'other'}
                        </p>
                        <p className="text-sm text-gray-600">{order.service_name || '—'}</p>
                        <p className="text-xs text-gray-400">{order.category_name || '—'}</p>
                      </div>
                      <div>{renderStatusBadge(order.status)}</div>
                    </div>

                    {/* Order Details */}
                    <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm text-gray-600 mt-3 pt-3 border-t border-gray-100">
                      {order.type === 'lessons' && order.instructor_name && (
                        <div className="col-span-2">
                          <dt className="text-gray-400 text-xs uppercase">Instructor</dt>
                          <dd>{order.instructor_name}</dd>
                        </div>
                      )}
                      {order.type === 'rentals' && order.equipment_name && (
                        <div className="col-span-2">
                          <dt className="text-gray-400 text-xs uppercase">Equipment</dt>
                          <dd>{order.equipment_name}</dd>
                        </div>
                      )}
                      {order.starting && (
                        <div>
                          <dt className="text-gray-400 text-xs uppercase">Starting</dt>
                          <dd className="font-medium">{formatOrderDate(order.starting)}</dd>
                        </div>
                      )}
                      {order.ending && (
                        <div>
                          <dt className="text-gray-400 text-xs uppercase">Ending</dt>
                          <dd className="font-medium">{formatOrderDate(order.ending)}</dd>
                        </div>
                      )}
                      {(order.lesson_note || order.rental_note || order.storage_note) && (
                        <div className="col-span-2">
                          <dt className="text-gray-400 text-xs uppercase">Note</dt>
                          <dd className="mt-1">{order.lesson_note || order.rental_note || order.storage_note}</dd>
                        </div>
                      )}
                    </dl>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default CustomerDetail

