import { useEffect, useMemo, useState } from 'react'
import sql from '../lib/neon'

const statusStyles = {
  pending: 'bg-yellow-100 text-yellow-800',
  in_progress: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800'
}

function ServiceDetail({ serviceId, onBack, onEdit, onDelete }) {
  const [service, setService] = useState(null)
  const [lessonPackages, setLessonPackages] = useState([])
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    if (!serviceId) return

    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)

        const [serviceRows, packageRows, orderRows] = await Promise.all([
          sql`
            SELECT
              s.id,
              s.name,
              s.description,
              s.active,
              s.category_id,
              sc.name AS category_name,
              s.created_at,
              s.updated_at,
              sl.default_duration_hours,
              sl.base_price_per_hour,
              sl.requires_package_pricing,
              sr.gear_id,
              sr.hourly_rate,
              sr.daily_rate,
              sr.weekly_rate,
              ss.daily_rate AS storage_daily_rate,
              ss.weekly_rate AS storage_weekly_rate,
              ss.monthly_rate AS storage_monthly_rate
            FROM services s
            JOIN service_categories sc ON sc.id = s.category_id
            LEFT JOIN services_lessons sl ON sl.service_id = s.id
            LEFT JOIN services_rentals sr ON sr.service_id = s.id
            LEFT JOIN services_storage ss ON ss.service_id = s.id
            WHERE s.id = ${serviceId}
            LIMIT 1
          `,
          sql`
            SELECT id, min_total_hours, max_total_hours, price_per_hour
            FROM services_lessons_packages
            WHERE service_id = ${serviceId}
            ORDER BY min_total_hours
          `,
          sql`
            SELECT
              o.id,
              o.customer_id,
              c.fullname AS customer_name,
              o.cancelled,
              o.created_at,
              s.name AS service_name,
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
            LEFT JOIN orders_lessons ol ON ol.order_id = o.id
            LEFT JOIN orders_rentals orent ON orent.order_id = o.id
            LEFT JOIN orders_storage ost ON ost.order_id = o.id
            WHERE o.service_id = ${serviceId}
            ORDER BY o.created_at DESC
            LIMIT 50
          `
        ])

        if (!serviceRows?.length) {
          setError('Service not found')
          setService(null)
          setLessonPackages([])
          setOrders([])
          return
        }

        setService(serviceRows[0])
        setLessonPackages(packageRows || [])
        setOrders(orderRows || [])
      } catch (err) {
        console.error('Failed to load service detail:', err)
        console.error('Error details:', err.message, err.stack)
        setError(`Unable to load service details: ${err.message || 'Please try again later.'}`)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [serviceId])

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

  const summary = useMemo(() => {
    const totalOrders = orders.length
    const activeOrders = orders.filter((order) => {
      const status = determineStatus(order)
      return status === 'pending' || status === 'in_progress'
    }).length
    const uniqueCustomers = new Set(orders.map((order) => order.customer_id)).size
    const lastBooking = orders.length ? orders[0].created_at : null

    return {
      totalOrders,
      activeOrders,
      uniqueCustomers,
      lastBooking
    }
  }, [orders])

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this service? This action cannot be undone.')) {
      return
    }
    try {
      setDeleting(true)
      await sql`DELETE FROM services WHERE id = ${serviceId}`
      if (onDelete) {
        onDelete()
      } else if (onBack) {
        onBack()
      }
    } catch (err) {
      console.error('Failed to delete service:', err)
      alert('Unable to delete service. Please try again.')
    } finally {
      setDeleting(false)
    }
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

  const formatCurrency = (value) =>
    new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(value || 0))

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
          <div className="text-gray-600">Loading service details...</div>
        </div>
      </div>
    )
  }

  if (error || !service) {
    return (
      <div className="px-4 py-6 sm:p-6 lg:p-8">
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <div className="text-red-600">{error || 'Service not found'}</div>
          {onBack && (
            <button
              onClick={onBack}
              className="mt-4 rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Back to Services
            </button>
          )}
        </div>
      </div>
    )
  }

  const categorySlug = (service.category_name || '').toLowerCase()
  const isLessons = categorySlug === 'lessons'
  const isRentals = categorySlug === 'rentals'
  const isStorage = categorySlug === 'storage'

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
            Back to Services
          </button>
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-3xl font-bold text-gray-900">{service.name}</h1>
                <span
                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                    service.active
                      ? 'bg-green-100 text-green-700'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {service.active ? 'Active' : 'Inactive'}
                </span>
              </div>
              <p className="text-gray-500 text-sm mt-1">
                {service.category_name} • {service.description || 'No description provided.'}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => onEdit?.(service)}
                className="inline-flex items-center justify-center rounded-lg border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50 transition-colors"
              >
                Edit
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting}
                className="inline-flex items-center justify-center rounded-lg border border-red-300 px-3 py-2 text-sm font-semibold text-red-700 shadow-sm hover:bg-red-50 transition-colors disabled:opacity-60"
              >
                {deleting ? 'Deleting…' : 'Delete'}
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          <div className="xl:col-span-3 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="rounded-lg border border-indigo-100 bg-indigo-50/70 p-4">
                <p className="text-sm font-medium text-indigo-700">Unique Customers</p>
                <p className="text-2xl font-bold text-indigo-900 mt-1">{summary.uniqueCustomers}</p>
              </div>
              <div className="rounded-lg border border-emerald-100 bg-emerald-50/70 p-4">
                <p className="text-sm font-medium text-emerald-700">Total Orders</p>
                <p className="text-2xl font-bold text-emerald-900 mt-1">{summary.totalOrders}</p>
              </div>
              <div className="rounded-lg border border-yellow-100 bg-yellow-50/70 p-4">
                <p className="text-sm font-medium text-yellow-700">Active / Upcoming</p>
                <p className="text-2xl font-bold text-yellow-900 mt-1">{summary.activeOrders}</p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-medium text-slate-700">Last booking</p>
                <p className="text-lg font-semibold text-slate-900 mt-1">{formatDate(summary.lastBooking)}</p>
              </div>
            </div>

            {isLessons && (
              <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-semibold text-gray-900">Lesson Settings</h2>
                  <span className="text-xs font-semibold text-gray-500 uppercase">
                    {service.requires_package_pricing ? 'Package pricing enabled' : 'Base rate only'}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase">Default duration</p>
                    <p className="text-gray-900 text-lg font-semibold">
                      {service.default_duration_hours ? `${service.default_duration_hours}h` : '—'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase">Base price / hour</p>
                    <p className="text-gray-900 text-lg font-semibold">
                      {service.base_price_per_hour != null ? formatCurrency(service.base_price_per_hour) : '—'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase">Package pricing</p>
                    <p className="text-gray-900 text-lg font-semibold">
                      {service.requires_package_pricing ? 'Enabled' : 'Disabled'}
                    </p>
                  </div>
                </div>
                {service.requires_package_pricing && (
                  <div>
                    <h3 className="text-sm font-semibold text-gray-700 mb-2">Lesson packages</h3>
                    {lessonPackages.length === 0 ? (
                      <p className="text-sm text-gray-500">No package tiers configured.</p>
                    ) : (
                      <div className="overflow-x-auto rounded-lg border border-gray-200">
                        <table className="min-w-full divide-y divide-gray-200 text-sm">
                          <thead className="bg-gray-50">
                            <tr>
                              <th className="px-4 py-2 text-left font-semibold text-gray-600">Min hours</th>
                              <th className="px-4 py-2 text-left font-semibold text-gray-600">Max hours</th>
                              <th className="px-4 py-2 text-left font-semibold text-gray-600">Price / hour</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100">
                            {lessonPackages.map((pkg) => (
                              <tr key={pkg.id}>
                                <td className="px-4 py-2 text-gray-700">{pkg.min_total_hours ?? '—'}</td>
                                <td className="px-4 py-2 text-gray-700">{pkg.max_total_hours ?? '—'}</td>
                                <td className="px-4 py-2 text-gray-700">
                                  {pkg.price_per_hour != null ? formatCurrency(pkg.price_per_hour) : '—'}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {isRentals && (
              <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm space-y-4">
                <h2 className="text-lg font-semibold text-gray-900">Rental Settings</h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase">Gear ID</p>
                    <p className="text-gray-900 text-lg font-semibold">{service.gear_id || '—'}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase">Hourly rate</p>
                    <p className="text-gray-900 text-lg font-semibold">
                      {service.hourly_rate != null ? formatCurrency(service.hourly_rate) : '—'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase">Daily rate</p>
                    <p className="text-gray-900 text-lg font-semibold">
                      {service.daily_rate != null ? formatCurrency(service.daily_rate) : '—'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {isStorage && (
              <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm space-y-4">
                <h2 className="text-lg font-semibold text-gray-900">Storage Rates</h2>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm">
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase">Daily</p>
                    <p className="text-gray-900 text-lg font-semibold">
                      {service.storage_daily_rate != null ? formatCurrency(service.storage_daily_rate) : '—'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase">Weekly</p>
                    <p className="text-gray-900 text-lg font-semibold">
                      {service.storage_weekly_rate != null ? formatCurrency(service.storage_weekly_rate) : '—'}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase">Monthly</p>
                    <p className="text-gray-900 text-lg font-semibold">
                      {service.storage_monthly_rate != null ? formatCurrency(service.storage_monthly_rate) : '—'}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Recent Orders</h2>
                <p className="text-sm text-gray-500">{orders.length} records</p>
              </div>
              {orders.length === 0 ? (
                <div className="text-gray-600">No orders use this service yet.</div>
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
                            Type
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            Window
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
                            <td className="px-4 py-3 text-sm text-gray-600 capitalize">{order.order_type}</td>
                            <td className="px-4 py-3 text-sm text-gray-600">{formatDateRange(order.starting, order.ending)}</td>
                            <td className="px-4 py-3 text-sm">{renderStatusBadge(determineStatus(order))}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="md:hidden space-y-3">
                    {orders.map((order) => (
                      <div key={order.id} className="rounded-lg border border-gray-200 p-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="text-sm font-semibold text-gray-900">#{order.id}</p>
                            <p className="text-xs text-gray-500">{order.customer_name || '—'}</p>
                          </div>
                          {renderStatusBadge(determineStatus(order))}
                        </div>
                        <dl className="mt-3 grid grid-cols-2 gap-3 text-xs text-gray-500">
                          <div>
                            <dt className="uppercase">Type</dt>
                            <dd className="text-gray-900 text-sm capitalize">{order.order_type}</dd>
                          </div>
                          <div>
                            <dt className="uppercase">Window</dt>
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
                <p className="text-xs font-semibold uppercase text-gray-500">Category</p>
                <p className="mt-1 text-gray-900 text-lg font-semibold">{service.category_name}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase text-gray-500">Created</p>
                <p className="mt-1 text-gray-900">{formatDateTime(service.created_at)}</p>
              </div>
              {service.updated_at && (
                <div>
                  <p className="text-xs font-semibold uppercase text-gray-500">Last update</p>
                  <p className="mt-1 text-gray-900">{formatDateTime(service.updated_at)}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ServiceDetail


