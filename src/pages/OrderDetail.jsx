import { useEffect, useState } from 'react'
import sql from '../lib/neon'

function OrderDetail({ orderId, onEdit, onDelete, onBack }) {
  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        setLoading(true)
        setError(null)
        const rows = await sql`
          SELECT
            o.id,
            o.service_id,
            o.customer_id,
            o.cancelled,
            o.created_at,
            o.updated_at,
            s.name AS service_name,
            sc.name AS category_name,
            c.fullname AS customer_name,
            c.email AS customer_email,
            c.phone AS customer_phone,
            -- Lessons fields
            ol.student_id,
            ol.instructor_id,
            i.fullname AS instructor_name,
            ol.starting AS lesson_start,
            ol.ending AS lesson_end,
            ol.note AS lesson_note,
            cs.fullname AS student_name,
            -- Rentals fields
            orent.equipment_id,
            e.name AS equipment_name,
            orent.hourly AS rental_hourly,
            orent.daily AS rental_daily,
            orent.weekly AS rental_weekly,
            orent.starting AS rental_start,
            orent.ending AS rental_end,
            orent.note AS rental_note,
            -- Storage fields
            ost.storage_id,
            ost.daily AS storage_daily,
            ost.weekly AS storage_weekly,
            ost.monthly AS storage_monthly,
            ost.starting AS storage_start,
            ost.ending AS storage_end,
            ost.note AS storage_note,
            -- Determine type
            CASE
              WHEN ol.order_id IS NOT NULL THEN 'lessons'
              WHEN orent.order_id IS NOT NULL THEN 'rentals'
              WHEN ost.order_id IS NOT NULL THEN 'storage'
              ELSE 'other'
            END AS type
          FROM orders o
          JOIN services s ON s.id = o.service_id
          JOIN service_categories sc ON sc.id = s.category_id
          JOIN customers c ON c.id = o.customer_id
          LEFT JOIN orders_lessons ol ON ol.order_id = o.id
          LEFT JOIN orders_rentals orent ON orent.order_id = o.id
          LEFT JOIN orders_storage ost ON ost.order_id = o.id
          LEFT JOIN instructors i ON i.id = ol.instructor_id
          LEFT JOIN customers cs ON cs.id = ol.student_id
          LEFT JOIN equipment e ON e.id = orent.equipment_id
          WHERE o.id = ${orderId}
          LIMIT 1
        `
        
        if (rows && rows.length > 0) {
          const row = rows[0]
          const orderData = {
            ...row,
            status: determineStatus(row),
            starting: row.lesson_start || row.rental_start || row.storage_start,
            ending: row.lesson_end || row.rental_end || row.storage_end,
            note: row.lesson_note || row.rental_note || row.storage_note
          }
          setOrder(orderData)
        } else {
          setError('Order not found')
        }
      } catch (err) {
        console.error('Failed to load order:', err)
        setError('Unable to load order. Please try again later.')
      } finally {
        setLoading(false)
      }
    }

    if (orderId) {
      fetchOrder()
    }
  }, [orderId])

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
    if (!window.confirm('Are you sure you want to delete this order? This action cannot be undone.')) {
      return
    }

    try {
      setDeleting(true)
      await sql`DELETE FROM orders WHERE id = ${orderId}`
      onDelete?.()
    } catch (err) {
      console.error('Failed to delete order:', err)
      alert('Unable to delete order. Please try again.')
    } finally {
      setDeleting(false)
    }
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

  if (loading) {
    return (
      <div className="px-4 py-6 sm:p-6 lg:p-8">
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <div className="text-gray-600">Loading order details...</div>
        </div>
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="px-4 py-6 sm:p-6 lg:p-8">
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <div className="text-red-600">{error || 'Order not found'}</div>
          {onBack && (
            <button
              onClick={onBack}
              className="mt-4 rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Back to Orders
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
              Back to Orders
            </button>
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold text-gray-900">Order #{order.id}</h1>
              {renderStatusBadge(order.status)}
            </div>
            <p className="text-gray-500 text-sm mt-1">
              {order.type ? order.type.charAt(0).toUpperCase() + order.type.slice(1) : 'Order'} • {order.category_name}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => onEdit?.({ id: order.id })}
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

        {/* Order Details */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Customer Information */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Customer Information</h2>
            <dl className="space-y-4">
              <div>
                <dt className="text-sm font-medium text-gray-500">Customer</dt>
                <dd className="mt-1 text-sm text-gray-900">{order.customer_name || '—'}</dd>
              </div>
              {order.customer_email && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Email</dt>
                  <dd className="mt-1 text-sm text-gray-900">{order.customer_email}</dd>
                </div>
              )}
              {order.customer_phone && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Phone</dt>
                  <dd className="mt-1 text-sm text-gray-900">{order.customer_phone}</dd>
                </div>
              )}
            </dl>
          </div>

          {/* Service Information */}
          <div>
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Service Information</h2>
            <dl className="space-y-4">
              <div>
                <dt className="text-sm font-medium text-gray-500">Service</dt>
                <dd className="mt-1 text-sm text-gray-900">{order.service_name || '—'}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Category</dt>
                <dd className="mt-1 text-sm text-gray-900 capitalize">{order.category_name || '—'}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Type</dt>
                <dd className="mt-1 text-sm text-gray-900 capitalize">{order.type || 'other'}</dd>
              </div>
            </dl>
          </div>
        </div>

        {/* Type-specific Details */}
        {order.type === 'lessons' && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Lesson Details</h2>
            <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {order.instructor_name && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Instructor</dt>
                  <dd className="mt-1 text-sm text-gray-900">{order.instructor_name}</dd>
                </div>
              )}
              {order.student_name && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Student</dt>
                  <dd className="mt-1 text-sm text-gray-900">{order.student_name}</dd>
                </div>
              )}
              <div>
                <dt className="text-sm font-medium text-gray-500">Starting</dt>
                <dd className="mt-1 text-sm text-gray-900">{formatDateTime(order.starting)}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Ending</dt>
                <dd className="mt-1 text-sm text-gray-900">{formatDateTime(order.ending)}</dd>
              </div>
            </dl>
          </div>
        )}

        {order.type === 'rentals' && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Rental Details</h2>
            <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {order.equipment_name && (
                <div>
                  <dt className="text-sm font-medium text-gray-500">Equipment</dt>
                  <dd className="mt-1 text-sm text-gray-900">{order.equipment_name}</dd>
                </div>
              )}
              <div>
                <dt className="text-sm font-medium text-gray-500">Rental Type</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {order.rental_weekly ? 'Weekly' : order.rental_daily ? 'Daily' : order.rental_hourly ? 'Hourly' : '—'}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Starting</dt>
                <dd className="mt-1 text-sm text-gray-900">{formatDateTime(order.starting)}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Ending</dt>
                <dd className="mt-1 text-sm text-gray-900">{formatDateTime(order.ending)}</dd>
              </div>
            </dl>
          </div>
        )}

        {order.type === 'storage' && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Storage Details</h2>
            <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <dt className="text-sm font-medium text-gray-500">Storage Type</dt>
                <dd className="mt-1 text-sm text-gray-900">
                  {order.storage_monthly ? 'Monthly' : order.storage_weekly ? 'Weekly' : order.storage_daily ? 'Daily' : '—'}
                </dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Starting</dt>
                <dd className="mt-1 text-sm text-gray-900">{formatDateTime(order.starting)}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500">Ending</dt>
                <dd className="mt-1 text-sm text-gray-900">{formatDateTime(order.ending)}</dd>
              </div>
            </dl>
          </div>
        )}

        {/* Note */}
        {order.note && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Note</h2>
            <p className="text-sm text-gray-700 whitespace-pre-wrap">{order.note}</p>
          </div>
        )}

        {/* Metadata */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <dl className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-gray-500">Order ID</dt>
              <dd className="mt-1 text-gray-900 font-mono">#{order.id}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Created At</dt>
              <dd className="mt-1 text-gray-900">{formatDateTime(order.created_at)}</dd>
            </div>
            {order.updated_at && (
              <div>
                <dt className="text-gray-500">Last Updated</dt>
                <dd className="mt-1 text-gray-900">{formatDateTime(order.updated_at)}</dd>
              </div>
            )}
            <div>
              <dt className="text-gray-500">Cancelled</dt>
              <dd className="mt-1 text-gray-900">{order.cancelled ? 'Yes' : 'No'}</dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  )
}

export default OrderDetail

