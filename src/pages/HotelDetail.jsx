import { useEffect, useMemo, useState } from 'react'
import sql from '../lib/neon'
import { canModify } from '../lib/permissions'

const statusStyles = {
  pending: 'bg-yellow-100 text-yellow-800',
  in_progress: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800'
}

function HotelDetail({ hotelId, onBack, onEdit, onDelete, user = null }) {
  const [hotel, setHotel] = useState(null)
  const [customers, setCustomers] = useState([])
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (!hotelId) return

    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)

        const [hotelRows, customerRows, orderRows] = await Promise.all([
          sql`
            SELECT
              id,
              name,
              phone,
              address,
              note,
              created_at,
              updated_at
            FROM hotels
            WHERE id = ${hotelId}
            LIMIT 1
          `,
          sql`
            SELECT
              c.id,
              c.fullname,
              c.phone,
              c.email,
              c.country,
              c.created_at,
              COUNT(o.id) AS order_count,
              MAX(o.created_at) AS last_order_at
            FROM customers c
            LEFT JOIN orders o ON o.customer_id = c.id
            WHERE c.hotel_id = ${hotelId}
            GROUP BY c.id, c.fullname, c.phone, c.email, c.country, c.created_at
            ORDER BY c.fullname ASC
          `,
          sql`
            SELECT
              o.id,
              o.cancelled,
              o.created_at,
              s.name AS service_name,
              sc.name AS category_name,
              c.fullname AS customer_name,
              COALESCE(ol.starting, orent.starting, ost.starting) AS starting,
              COALESCE(ol.ending, orent.ending, ost.ending) AS ending,
              CASE
                WHEN ol.order_id IS NOT NULL THEN 'lessons'
                WHEN orent.order_id IS NOT NULL THEN 'rentals'
                WHEN ost.order_id IS NOT NULL THEN 'storage'
                ELSE 'other'
              END AS order_type
            FROM orders o
            JOIN customers c ON c.id = o.customer_id
            JOIN services s ON s.id = o.service_id
            JOIN service_categories sc ON sc.id = s.category_id
            LEFT JOIN orders_lessons ol ON ol.order_id = o.id
            LEFT JOIN orders_rentals orent ON orent.order_id = o.id
            LEFT JOIN orders_storage ost ON ost.order_id = o.id
            WHERE c.hotel_id = ${hotelId}
            ORDER BY o.created_at DESC
            LIMIT 50
          `
        ])

        if (!hotelRows?.length) {
          setError('Hotel not found')
          setHotel(null)
          setCustomers([])
          setOrders([])
          return
        }

        const preparedCustomers =
          customerRows?.map((row) => ({
            ...row,
            order_count: Number(row.order_count) || 0
          })) || []

        const preparedOrders =
          orderRows?.map((row) => ({
            ...row,
            status: determineStatus(row)
          })) || []

        setHotel(hotelRows[0])
        setCustomers(preparedCustomers)
        setOrders(preparedOrders)
      } catch (err) {
        console.error('Failed to load hotel details:', err)
        setError('Unable to load hotel details. Please try again later.')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [hotelId])

  const summary = useMemo(() => {
    const totalCustomers = customers.length
    const totalOrders = orders.length
    const activeOrders = orders.filter((order) => order.status === 'pending' || order.status === 'in_progress').length

    return {
      totalCustomers,
      totalOrders,
      activeOrders
    }
  }, [customers, orders])

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this hotel? This action cannot be undone.')) {
      return
    }
    try {
      setDeleting(true)
      await sql`DELETE FROM hotels WHERE id = ${hotelId}`
      if (onDelete) {
        onDelete()
      } else if (onBack) {
        onBack()
      }
    } catch (err) {
      console.error('Failed to delete hotel:', err)
      alert('Unable to delete hotel. Please try again.')
    } finally {
      setDeleting(false)
    }
  }

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

  const formatDate = (value) => {
    if (!value) return '—'
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return '—'
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatDateTime = (value) => {
    if (!value) return '—'
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return '—'
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    })
  }

  const formatDateRange = (start, end) => {
    if (!start && !end) return '—'
    const startDate = start ? new Date(start) : null
    const endDate = end ? new Date(end) : null

    const formatter = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' })

    if (startDate && endDate) {
      return `${formatter.format(startDate)} → ${formatter.format(endDate)}`
    }

    if (startDate) return formatter.format(startDate)
    if (endDate) return formatter.format(endDate)
    return '—'
  }

  if (loading) {
    return (
      <div className="px-4 py-6 sm:p-6 lg:p-8">
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <div className="text-gray-600">Loading hotel details...</div>
        </div>
      </div>
    )
  }

  if (error || !hotel) {
    return (
      <div className="px-4 py-6 sm:p-6 lg:p-8">
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <div className="text-red-600">{error || 'Hotel not found'}</div>
          {onBack && (
            <button
              onClick={onBack}
              className="mt-4 rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Back to Hotels
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="px-4 py-6 sm:p-6 lg:p-8">
      <div className="rounded-xl bg-white p-4 sm:p-6 shadow-sm">
        <div className="mb-6 pb-6 border-b border-gray-200">
          <button
            onClick={onBack}
            className="mb-2 flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            Back to Hotels
          </button>
          <h1 className="text-3xl font-bold text-gray-900">{hotel.name}</h1>
          <p className="text-gray-500 text-sm mt-1">Hotel information, guest customers, and booking history.</p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          <div className="xl:col-span-3 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="rounded-lg border border-gray-200 bg-gradient-to-br from-indigo-50 to-indigo-100 p-4">
                <div className="text-sm font-medium text-indigo-700 mb-1">Customers</div>
                <div className="text-2xl font-bold text-indigo-900">{summary.totalCustomers}</div>
              </div>
              <div className="rounded-lg border border-gray-200 bg-gradient-to-br from-emerald-50 to-emerald-100 p-4">
                <div className="text-sm font-medium text-emerald-700 mb-1">Orders Linked</div>
                <div className="text-2xl font-bold text-emerald-900">{summary.totalOrders}</div>
              </div>
              <div className="rounded-lg border border-gray-200 bg-gradient-to-br from-yellow-50 to-yellow-100 p-4">
                <div className="text-sm font-medium text-yellow-700 mb-1">Active / Upcoming</div>
                <div className="text-2xl font-bold text-yellow-900">{summary.activeOrders}</div>
              </div>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Customers from this hotel</h2>
                <p className="text-sm text-gray-500">{customers.length} active</p>
              </div>
              {customers.length === 0 ? (
                <div className="text-gray-600">No customers assigned to this hotel yet.</div>
              ) : (
                <>
                  <div className="hidden md:block overflow-x-auto border border-gray-200 rounded-xl">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            Customer
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            Contact
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            Country
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            Orders
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            Last booking
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-100">
                        {customers.map((customer) => (
                          <tr key={customer.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm text-gray-900 font-medium">{customer.fullname || '—'}</td>
                            <td className="px-4 py-3 text-sm text-gray-600">{customer.email || customer.phone || '—'}</td>
                            <td className="px-4 py-3 text-sm text-gray-600">{customer.country || '—'}</td>
                            <td className="px-4 py-3 text-sm text-gray-600">{customer.order_count}</td>
                            <td className="px-4 py-3 text-sm text-gray-600">
                              {customer.last_order_at ? formatDate(customer.last_order_at) : '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="md:hidden space-y-3">
                    {customers.map((customer) => (
                      <div key={customer.id} className="rounded-lg border border-gray-200 p-4">
                        <p className="text-sm font-semibold text-gray-900">{customer.fullname || '—'}</p>
                        <p className="text-sm text-gray-500">{customer.email || customer.phone || '—'}</p>
                        <dl className="mt-3 grid grid-cols-2 gap-3 text-xs text-gray-500">
                          <div>
                            <dt className="uppercase">Country</dt>
                            <dd className="text-gray-900 text-sm">{customer.country || '—'}</dd>
                          </div>
                          <div>
                            <dt className="uppercase">Orders</dt>
                            <dd className="text-gray-900 text-sm">{customer.order_count}</dd>
                          </div>
                          <div className="col-span-2">
                            <dt className="uppercase">Last booking</dt>
                            <dd className="text-gray-900 text-sm">
                              {customer.last_order_at ? formatDate(customer.last_order_at) : '—'}
                            </dd>
                          </div>
                        </dl>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Recent Orders</h2>
                <p className="text-sm text-gray-500">{orders.length} recent</p>
              </div>
              {orders.length === 0 ? (
                <div className="text-gray-600">No orders recorded for customers from this hotel.</div>
              ) : (
                <>
                  <div className="hidden md:block overflow-x-auto border border-gray-200 rounded-xl">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            Order
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            Customer
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            Service
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            Type
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            Date Range
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            Status
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-100">
                        {orders.map((order) => (
                          <tr key={order.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm text-gray-900 font-medium">#{order.id}</td>
                            <td className="px-4 py-3 text-sm text-gray-700">{order.customer_name || '—'}</td>
                            <td className="px-4 py-3 text-sm text-gray-700">{order.service_name || '—'}</td>
                            <td className="px-4 py-3 text-sm text-gray-600 capitalize">{order.order_type || '—'}</td>
                            <td className="px-4 py-3 text-sm text-gray-600">{formatDateRange(order.starting, order.ending)}</td>
                            <td className="px-4 py-3 text-sm">{renderStatusBadge(order.status)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="md:hidden space-y-3">
                    {orders.map((order) => (
                      <div key={order.id} className="rounded-lg border border-gray-200 p-4">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <p className="text-sm font-semibold text-gray-900">#{order.id} · {order.service_name}</p>
                            <p className="text-xs text-gray-500">{order.customer_name}</p>
                          </div>
                          {renderStatusBadge(order.status)}
                        </div>
                        <dl className="mt-3 grid grid-cols-2 gap-3 text-xs text-gray-500">
                          <div>
                            <dt className="uppercase">Type</dt>
                            <dd className="text-gray-900 text-sm capitalize">{order.order_type || '—'}</dd>
                          </div>
                          <div>
                            <dt className="uppercase">Date Range</dt>
                            <dd className="text-gray-900 text-sm">{formatDateRange(order.starting, order.ending)}</dd>
                          </div>
                        </dl>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="xl:col-span-1">
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-5 shadow-sm sticky top-6 space-y-6">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">Hotel Info</h2>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onEdit?.(hotel)}
                      disabled={!canModify(user)}
                      className="inline-flex items-center justify-center p-2 rounded-lg border border-gray-300 bg-white text-gray-700 shadow-sm hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white"
                      title="Edit hotel"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536M16.732 3.732a2.5 2.5 0 113.536 3.536L7.5 20.036H4v-3.572L16.732 3.732z" />
                      </svg>
                    </button>
                    <button
                      onClick={handleDelete}
                      disabled={deleting || !canModify(user)}
                      className="inline-flex items-center justify-center p-2 rounded-lg border border-red-300 bg-white text-red-700 shadow-sm hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white"
                      title="Delete hotel"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
                <dl className="space-y-4 text-sm">
                  <div>
                    <dt className="text-xs font-medium text-gray-500 uppercase">Phone</dt>
                    <dd className="mt-1 text-gray-900">{hotel.phone || '—'}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-gray-500 uppercase">Address</dt>
                    <dd className="mt-1 text-gray-900 whitespace-pre-wrap">{hotel.address || '—'}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-gray-500 uppercase">Note</dt>
                    <dd className="mt-1 text-gray-900 whitespace-pre-wrap">{hotel.note || '—'}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-gray-500 uppercase">Created</dt>
                    <dd className="mt-1 text-gray-900">{formatDateTime(hotel.created_at)}</dd>
                  </div>
                  {hotel.updated_at && (
                    <div>
                      <dt className="text-xs font-medium text-gray-500 uppercase">Last Update</dt>
                      <dd className="mt-1 text-gray-900">{formatDateTime(hotel.updated_at)}</dd>
                    </div>
                  )}
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default HotelDetail

