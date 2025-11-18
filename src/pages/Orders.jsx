import { useEffect, useMemo, useState } from 'react'
import sql from '../lib/neon'

const PAGE_SIZE = 25

const columns = [
  { key: 'id', label: 'Order #' },
  { key: 'service_name', label: 'Service' },
  { key: 'customer_name', label: 'Customer' },
  { key: 'category_name', label: 'Category' },
  { key: 'status', label: 'Status' },
  { key: 'starting', label: 'Starting' },
  { key: 'ending', label: 'Ending' }
]

function formatDate(value) {
  if (!value) return '—'
  return new Date(value).toLocaleString(undefined, {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
}

const statusStyles = {
  pending: 'bg-yellow-100 text-yellow-800',
  in_progress: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800'
}

function determineStatus(order) {
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

function renderStatusBadge(status) {
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

function Orders({ refreshKey = 0, onAddOrder = () => {}, onEditOrder = () => {}, onViewOrder = () => {} }) {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortConfig, setSortConfig] = useState({ key: 'id', direction: 'desc' })
  const [currentPage, setCurrentPage] = useState(1)
  const [deletingId, setDeletingId] = useState(null)

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true)
        setError(null)
        const rows =
          (await sql`
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
              END AS type
            FROM orders o
            JOIN services s ON s.id = o.service_id
            JOIN service_categories sc ON sc.id = s.category_id
            JOIN customers c ON c.id = o.customer_id
            LEFT JOIN orders_lessons ol ON ol.order_id = o.id
            LEFT JOIN orders_rentals orent ON orent.order_id = o.id
            LEFT JOIN orders_storage ost ON ost.order_id = o.id
            ORDER BY o.created_at DESC
          `) || []
        const decorated = rows.map((row) => ({
          ...row,
          status: determineStatus(row)
        }))

        setOrders(decorated)
      } catch (err) {
        console.error('Failed to load orders:', err)
        setError('Unable to load orders. Please try again later.')
      } finally {
        setLoading(false)
      }
    }

    fetchOrders()
  }, [refreshKey])

  const filteredOrders = useMemo(() => {
    if (!searchTerm.trim()) return orders
    const query = searchTerm.toLowerCase()
    return orders.filter((order) =>
      [
        order.service_name,
        order.customer_name,
        order.category_name,
        order.type,
        order.status,
        order.starting,
        order.ending,
        formatDate(order.starting),
        formatDate(order.ending)
      ]
        .filter(Boolean)
        .some((value) => value.toString().toLowerCase().includes(query))
    )
  }, [orders, searchTerm])

  const sortedOrders = useMemo(() => {
    const sorted = [...filteredOrders]
    sorted.sort((a, b) => {
      const aValue = a[sortConfig.key]
      const bValue = b[sortConfig.key]

      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1
      return 0
    })
    return sorted
  }, [filteredOrders, sortConfig])

  const totalPages = Math.max(1, Math.ceil(sortedOrders.length / PAGE_SIZE))
  const paginatedOrders = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE
    return sortedOrders.slice(start, start + PAGE_SIZE)
  }, [sortedOrders, currentPage])

  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm])

  const handleSort = (key) => {
    setSortConfig((prev) => {
      if (prev.key === key) {
        return { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' }
      }
      return { key, direction: 'asc' }
    })
  }

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value)
  }

  const handlePageChange = (newPage) => {
    setCurrentPage((prev) => Math.min(Math.max(newPage, 1), totalPages))
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this order? This action cannot be undone.')) return
    try {
      setDeletingId(id)
      await sql`DELETE FROM orders WHERE id = ${id}`
      setOrders((prev) => prev.filter((order) => order.id !== id))
    } catch (err) {
      console.error('Failed to delete order:', err)
      alert('Unable to delete order. Please try again.')
    } finally {
      setDeletingId(null)
    }
  }

  const renderPagination = () => (
    <div className="flex items-center justify-between text-sm text-gray-600">
      <span>
        Page {currentPage} of {totalPages} • Showing {paginatedOrders.length} of {sortedOrders.length} orders
      </span>
      <div className="space-x-2">
        <button
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-3 py-1 rounded-md border text-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Previous
        </button>
        <button
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="px-3 py-1 rounded-md border text-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next
        </button>
      </div>
    </div>
  )

  return (
    <div className="px-4 py-6 sm:p-6 lg:p-8">
      <div className="flex flex-col gap-6 bg-white rounded-xl shadow-sm p-4 sm:p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Orders</h1>
            <p className="text-gray-500 text-sm">Monitor lessons, rentals, and storage bookings.</p>
          </div>
          <button
            onClick={onAddOrder}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 transition-colors"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add order
          </button>
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <input
              type="text"
              value={searchTerm}
              onChange={handleSearchChange}
              placeholder="Search orders by service, customer, or type..."
              className="w-full md:w-1/2 rounded-lg border border-gray-300 px-4 py-2 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-shadow"
            />
          </div>

          {loading && <div className="text-gray-600 text-sm">Loading orders...</div>}
          {error && <div className="text-red-600 text-sm">{error}</div>}
          {!loading && !error && (
            <div className="flex flex-col gap-4">
              {renderPagination()}

              <div className="hidden md:block overflow-x-auto border border-gray-200 rounded-xl">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      {columns.map((column) => {
                        const isActive = sortConfig.key === column.key
                        const direction = isActive ? sortConfig.direction : null
                        return (
                          <th
                            key={column.key}
                            onClick={() => handleSort(column.key)}
                            className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer select-none hover:text-gray-900"
                          >
                            <div className="flex items-center gap-1">
                              {column.label}
                              {isActive && (
                                <span className="text-gray-400">{direction === 'asc' ? '▲' : '▼'}</span>
                              )}
                            </div>
                          </th>
                        )
                      })}
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {paginatedOrders.length === 0 ? (
                      <tr>
                        <td colSpan={columns.length + 1} className="px-6 py-10 text-center text-sm text-gray-500">
                          No orders found. Try adjusting your search.
                        </td>
                      </tr>
                    ) : (
                      paginatedOrders.map((order) => (
                        <tr key={order.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-gray-900 font-medium">
                            <button
                              onClick={() => onViewOrder(order)}
                              className="text-indigo-600 hover:text-indigo-800 hover:underline transition-colors"
                            >
                              #{order.id}
                            </button>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">{order.service_name}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{order.customer_name}</td>
                          <td className="px-4 py-3 text-sm capitalize text-gray-600">{order.category_name}</td>
                          <td className="px-4 py-3 text-sm">{renderStatusBadge(order.status)}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{formatDate(order.starting)}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{formatDate(order.ending)}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            <div className="flex items-center gap-3">
                              <button
                                onClick={() => onEditOrder(order)}
                                className="text-gray-500 hover:text-indigo-600 transition-colors"
                                aria-label="Edit order"
                              >
                                <svg
                                  className="w-5 h-5"
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
                              </button>
                              <button
                                onClick={() => handleDelete(order.id)}
                                disabled={deletingId === order.id}
                                className="text-gray-500 hover:text-red-600 transition-colors disabled:opacity-50"
                                aria-label="Delete order"
                              >
                                <svg
                                  className="w-5 h-5"
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
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <div className="md:hidden space-y-3">
      {paginatedOrders.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-gray-300 px-4 py-6 text-center text-sm text-gray-500">
                    No orders found. Try adjusting your search.
                  </div>
                ) : (
                  paginatedOrders.map((order) => (
                    <div key={order.id} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <button
                            onClick={() => onViewOrder(order)}
                            className="text-base font-semibold text-indigo-600 hover:text-indigo-800 hover:underline transition-colors text-left"
                          >
                            #{order.id} · {order.service_name}
                          </button>
                          <p className="text-sm text-gray-500">{order.customer_name}</p>
                          <p className="text-xs text-gray-400 capitalize">{order.category_name}</p>
                  <div className="mt-2 flex items-center gap-2">
                    {renderStatusBadge(order.status)}
                    <span className="text-xs text-gray-500">
                      {formatDate(order.starting)} → {formatDate(order.ending)}
                    </span>
                  </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => onEditOrder(order)}
                            className="text-gray-500 hover:text-indigo-600 transition-colors"
                            aria-label="Edit order"
                          >
                            <svg
                              className="w-5 h-5"
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
                          </button>
                          <button
                            onClick={() => handleDelete(order.id)}
                            disabled={deletingId === order.id}
                            className="text-gray-500 hover:text-red-600 transition-colors disabled:opacity-50"
                            aria-label="Delete order"
                          >
                            <svg
                              className="w-5 h-5"
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
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {renderPagination()}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Orders

