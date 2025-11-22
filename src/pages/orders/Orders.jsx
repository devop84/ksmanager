import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import sql from '../../lib/neon'
import { canModify } from '../../lib/permissions'
import { useSettings } from '../../context/SettingsContext'

const statusStyles = {
  open: 'text-blue-700 bg-blue-50 border-blue-100',
  closed: 'text-emerald-700 bg-emerald-50 border-emerald-100',
  cancelled: 'text-rose-700 bg-rose-50 border-rose-100'
}

function Orders({ onAddOrder = () => {}, onEditOrder = () => {}, onViewOrder = () => {}, refreshKey = 0, user = null }) {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [sortConfig, setSortConfig] = useState({ key: 'created_at', direction: 'desc' })
  const [deletingId, setDeletingId] = useState(null)
  const { formatCurrency, formatDateTime } = useSettings()
  const { t } = useTranslation()

  const columns = useMemo(
    () => [
      { key: 'order_number', label: t('orders.table.orderNumber', 'Order Number') },
      { key: 'customer_name', label: t('orders.table.customer', 'Customer') },
      { key: 'status', label: t('orders.table.status', 'Status') },
      { key: 'total_amount', label: t('orders.table.total', 'Total') },
      { key: 'total_paid', label: t('orders.table.paid', 'Paid') },
      { key: 'balance_due', label: t('orders.table.balance', 'Balance') },
      { key: 'created_at', label: t('orders.table.date', 'Date') },
    ],
    [t],
  )

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true)
        setError(null)
        const result = await sql`
          SELECT 
            o.id,
            o.order_number,
            o.status,
            o.total_amount,
            o.total_paid,
            o.balance_due,
            o.currency,
            o.created_at,
            o.closed_at,
            o.cancelled_at,
            c.fullname AS customer_name,
            c.id AS customer_id,
            COUNT(oi.id) AS item_count
          FROM orders o
          LEFT JOIN customers c ON o.customer_id = c.id
          LEFT JOIN order_items oi ON o.id = oi.order_id
          GROUP BY o.id, o.order_number, o.status, o.total_amount, o.total_paid, o.balance_due, o.currency, o.created_at, o.closed_at, o.cancelled_at, c.fullname, c.id
          ORDER BY o.created_at DESC
        `
        setOrders(result || [])
      } catch (err) {
        console.error('Failed to load orders:', err)
        setError(t('orders.error.load', 'Unable to load orders. Please try again later.'))
      } finally {
        setLoading(false)
      }
    }

    fetchOrders()
  }, [refreshKey, t])

  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      if (statusFilter !== 'all' && order.status !== statusFilter) return false
      if (!searchTerm.trim()) return true
      const query = searchTerm.toLowerCase()
      return [
        order.order_number,
        order.customer_name,
        order.id?.toString()
      ]
        .filter((value) => value !== null && value !== undefined)
        .some((value) => value.toString().toLowerCase().includes(query))
    })
  }, [orders, searchTerm, statusFilter])

  const sortedOrders = useMemo(() => {
    const sorted = [...filteredOrders]
    sorted.sort((a, b) => {
      let aValue = a[sortConfig.key] ?? ''
      let bValue = b[sortConfig.key] ?? ''

      // Handle numeric sorting for amounts
      if (sortConfig.key === 'total_amount' || sortConfig.key === 'total_paid' || sortConfig.key === 'balance_due') {
        aValue = Number(aValue) || 0
        bValue = Number(bValue) || 0
      }

      // Handle date sorting
      if (sortConfig.key === 'created_at' || sortConfig.key === 'closed_at' || sortConfig.key === 'cancelled_at') {
        aValue = aValue ? new Date(aValue).getTime() : 0
        bValue = bValue ? new Date(bValue).getTime() : 0
      }

      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1
      return 0
    })
    return sorted
  }, [filteredOrders, sortConfig])

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

  const handleDelete = async (orderId, event) => {
    event.stopPropagation()
    if (!window.confirm(t('orders.confirm.delete', 'Are you sure you want to delete this order? This action cannot be undone.'))) return
    try {
      setDeletingId(orderId)
      await sql`DELETE FROM orders WHERE id = ${orderId}`
      setOrders((prev) => prev.filter((order) => order.id !== orderId))
    } catch (err) {
      console.error('Failed to delete order:', err)
      alert(t('orders.error.delete', 'Unable to delete order. Please try again.'))
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="px-4 py-6 sm:p-6 lg:p-8">
      <div className="flex flex-col gap-6 bg-white rounded-xl shadow-sm p-4 sm:p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{t('orders.title', 'Orders')}</h1>
            <p className="text-gray-500 text-sm">
              {t('orders.description', 'View and manage all customer orders with status, payments, and balances.')}
            </p>
          </div>
          <button
            onClick={onAddOrder}
            disabled={!canModify(user)}
            className="inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-indigo-600 text-white hover:bg-indigo-500 disabled:bg-gray-400 disabled:hover:bg-gray-400"
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
            {t('orders.add', 'Add order')}
          </button>
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <input
              type="text"
              value={searchTerm}
              onChange={handleSearchChange}
              placeholder={t('orders.search', 'Search orders by order number, customer name, or ID...')}
              className="flex-1 rounded-lg border border-gray-300 px-4 py-2 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-shadow"
            />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
            >
              <option value="all">{t('orders.filters.allStatus', 'All Status')}</option>
              <option value="open">{t('orders.filters.open', 'Open')}</option>
              <option value="closed">{t('orders.filters.closed', 'Closed')}</option>
              <option value="cancelled">{t('orders.filters.cancelled', 'Cancelled')}</option>
            </select>
          </div>

          {loading && <div className="text-gray-600 text-sm">{t('orders.loading', 'Loading orders...')}</div>}
          {error && <div className="text-red-600 text-sm">{error}</div>}
          {!loading && !error && (
            <div className="flex flex-col gap-4">
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
                                <span className="text-gray-400">
                                  {direction === 'asc' ? '▲' : '▼'}
                                </span>
                              )}
                            </div>
                          </th>
                        )
                      })}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {sortedOrders.length === 0 ? (
                      <tr>
                        <td colSpan={columns.length} className="px-6 py-10 text-center text-sm text-gray-500">
                          {t('orders.empty', 'No orders found. Try adjusting your search or filters.')}
                        </td>
                      </tr>
                    ) : (
                      sortedOrders.map((order) => {
                        const statusStyle = statusStyles[order.status] || statusStyles.open
                        return (
                          <tr
                            key={order.id}
                            className="hover:bg-gray-50 cursor-pointer"
                            onClick={() => onViewOrder(order)}
                          >
                            <td className="px-4 py-3 text-sm font-medium text-gray-900">
                              {order.order_number || `#${order.id}`}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900">
                              {order.customer_name || '—'}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <span className={`inline-flex items-center rounded-full border px-2 py-1 text-xs font-semibold ${statusStyle}`}>
                                {order.status?.toUpperCase() || 'OPEN'}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900 text-right">
                              {formatCurrency(Number(order.total_amount || 0))}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600 text-right">
                              {formatCurrency(Number(order.total_paid || 0))}
                            </td>
                            <td className={`px-4 py-3 text-sm font-semibold text-right ${
                              Number(order.balance_due || 0) > 0 ? 'text-rose-700' : 'text-emerald-700'
                            }`}>
                              {formatCurrency(Number(order.balance_due || 0))}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                              {formatDateTime(order.created_at)}
                            </td>
                          </tr>
                        )
                      })
                    )}
                  </tbody>
                </table>
              </div>

              <div className="md:hidden space-y-3">
                {sortedOrders.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-gray-300 px-4 py-6 text-center text-sm text-gray-500">
                    {t('orders.empty', 'No orders found. Try adjusting your search or filters.')}
                  </div>
                ) : (
                  sortedOrders.map((order) => {
                    const statusStyle = statusStyles[order.status] || statusStyles.open
                    return (
                      <div
                        key={order.id}
                        className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                        onClick={() => onViewOrder(order)}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-base font-semibold text-gray-900">
                              {order.order_number || `#${order.id}`}
                            </p>
                            <p className="text-sm text-gray-500">{order.customer_name || '—'}</p>
                          </div>
                          <span className={`inline-flex items-center rounded-full border px-2 py-1 text-xs font-semibold ${statusStyle}`}>
                            {order.status?.toUpperCase() || 'OPEN'}
                          </span>
                        </div>
                        <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 text-sm text-gray-600">
                          <div>
                            <dt className="text-gray-400 text-xs uppercase">{t('orders.mobile.total', 'Total')}</dt>
                            <dd className="font-semibold">{formatCurrency(Number(order.total_amount || 0))}</dd>
                          </div>
                          <div>
                            <dt className="text-gray-400 text-xs uppercase">{t('orders.mobile.paid', 'Paid')}</dt>
                            <dd>{formatCurrency(Number(order.total_paid || 0))}</dd>
                          </div>
                          <div>
                            <dt className="text-gray-400 text-xs uppercase">{t('orders.mobile.balance', 'Balance')}</dt>
                            <dd className={`font-semibold ${
                              Number(order.balance_due || 0) > 0 ? 'text-rose-700' : 'text-emerald-700'
                            }`}>
                              {formatCurrency(Number(order.balance_due || 0))}
                            </dd>
                          </div>
                          <div>
                            <dt className="text-gray-400 text-xs uppercase">{t('orders.mobile.date', 'Date')}</dt>
                            <dd>{formatDateTime(order.created_at)}</dd>
                          </div>
                          {order.item_count > 0 && (
                            <div className="col-span-2">
                              <dt className="text-gray-400 text-xs uppercase">{t('orders.mobile.items', 'Items')}</dt>
                              <dd>{order.item_count} {order.item_count === 1 ? t('orders.item', 'item') : t('orders.items', 'items')}</dd>
                            </div>
                          )}
                        </dl>
                      </div>
                    )
                  })
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Orders

