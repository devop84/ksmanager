import { useEffect, useMemo, useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import sql from '../../lib/neon'
import { canModify } from '../../lib/permissions'
import { useSettings } from '../../context/SettingsContext'
import { useDataTable } from '../../hooks/useDataTable'
import DataTable from '../../components/ui/DataTable'
import PageHeader from '../../components/layout/PageHeader'
import SearchBar from '../../components/ui/SearchBar'
import MobileCardView from '../../components/ui/MobileCardView'
import OrdersOverview from '../../components/ui/OrdersOverview'

const statusStyles = {
  open: 'text-blue-700 bg-blue-50 border-blue-100',
  closed: 'text-emerald-700 bg-emerald-50 border-emerald-100',
  cancelled: 'text-rose-700 bg-rose-50 border-rose-100'
}

function Orders({ onAddOrder = () => {}, onEditOrder = () => {}, onViewOrder = () => {}, refreshKey = 0, user = null }) {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
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
        setTableData(result || [])
      } catch (err) {
        console.error('Failed to load orders:', err)
        setError(t('orders.error.load', 'Unable to load orders. Please try again later.'))
      } finally {
        setLoading(false)
      }
    }

    fetchOrders()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey, t])

  // Custom filter function that searches all columns
  const customFilterFn = useCallback((data, searchTerm) => {
    if (!data || !Array.isArray(data)) return []
    
    // If no search term, return all data
    if (!searchTerm || !searchTerm.trim()) return data
    
    const query = searchTerm.toLowerCase()
    
    return data.filter((order) => {
      if (!order) return false
      
      // Search across all fields
      return Object.values(order)
        .filter(value => value != null && value !== undefined)
        .some(value => value.toString().toLowerCase().includes(query))
    })
  }, [])

  // Custom sort function
  const customSortFn = useCallback((sorted, sortConfig) => {
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
  }, [])

  const {
    data: tableData,
    setData: setTableData,
    searchTerm,
    sortConfig,
    filteredData,
    handleSort,
    handleSearchChange
  } = useDataTable(orders, {
    defaultSortKey: 'created_at',
    defaultSortDirection: 'desc',
    customFilterFn,
    customSortFn
  })

  const handleDelete = async (orderId, event) => {
    event.stopPropagation()
    
    // Count all appointments (including completed) that will be deleted
    const allAppointments = await sql`
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'completed') as completed,
        COUNT(*) FILTER (WHERE status IN ('scheduled', 'rescheduled', 'no_show')) as scheduled
      FROM scheduled_appointments
      WHERE order_id = ${orderId}
    `
    const totalCount = allAppointments?.[0]?.total || 0
    const completedCount = allAppointments?.[0]?.completed || 0
    const scheduledCount = allAppointments?.[0]?.scheduled || 0
    
    let confirmMessage
    if (totalCount > 0) {
      if (completedCount > 0) {
        confirmMessage = t('orders.confirm.deleteWithCompleted', 'WARNING: This order has {{total}} appointment(s) including {{completed}} completed appointment(s). Deleting will PERMANENTLY DELETE ALL appointments (including completed ones), remove credits, and delete the order. This action cannot be undone. Are you sure?', { 
          total: totalCount, 
          completed: completedCount 
        })
      } else {
        confirmMessage = t('orders.confirm.deleteWithAppointments', 'This order has {{count}} appointment(s). Deleting will PERMANENTLY DELETE ALL appointments, remove credits, and delete the order. This action cannot be undone. Are you sure?', { count: totalCount })
      }
    } else {
      confirmMessage = t('orders.confirm.delete', 'Are you sure you want to delete this order? This will remove all credits and delete the order. This action cannot be undone.')
    }
    
    if (!window.confirm(confirmMessage)) return
    try {
      setDeletingId(orderId)
      
      // No need to manually update appointments - they will be deleted via CASCADE
      // when the order is deleted
      
      // Delete credits associated with this order's items (before deleting order)
      // Note: Database CASCADE should handle this, but we're being explicit
      await sql`
        DELETE FROM customer_service_credits
        WHERE order_item_id IN (
          SELECT id FROM order_items WHERE order_id = ${orderId}
        )
      `
      
      // Delete the order (this will also CASCADE delete order_items)
      // Note: order_id in appointments is now NULL, so deletion will succeed
      await sql`DELETE FROM orders WHERE id = ${orderId}`
      setOrders((prev) => prev.filter((order) => order.id !== orderId))
      setTableData((prev) => prev.filter((order) => order.id !== orderId))
    } catch (err) {
      console.error('Failed to delete order:', err)
      alert(t('orders.error.delete', 'Unable to delete order. Please try again.'))
    } finally {
      setDeletingId(null)
    }
  }

  const renderCell = (key, row) => {
    if (!row) return '—'
    
    const statusStyle = statusStyles[row.status] || statusStyles.open
    
    switch (key) {
      case 'order_number':
        return row.order_number || `#${row.id}`
      case 'status':
        return (
          <span className={`inline-flex items-center rounded-full border px-2 py-1 text-xs font-semibold ${statusStyle}`}>
            {row.status?.toUpperCase() || 'OPEN'}
          </span>
        )
      case 'total_amount':
        return formatCurrency(Number(row.total_amount || 0))
      case 'total_paid':
        return formatCurrency(Number(row.total_paid || 0))
      case 'balance_due':
        return (
          <span className={`font-semibold ${
            Number(row.balance_due || 0) > 0 ? 'text-rose-700' : 'text-emerald-700'
          }`}>
            {formatCurrency(Number(row.balance_due || 0))}
          </span>
        )
      case 'created_at':
        return formatDateTime(row.created_at)
      default:
        return row[key] ?? '—'
    }
  }

  return (
    <div className="px-4 py-6 sm:p-6 lg:p-8">
      <div className="flex flex-col gap-6 bg-white rounded-xl shadow-sm p-4 sm:p-6">
        <PageHeader
          title={t('orders.title', 'Orders')}
          description={t('orders.description', 'View and manage all customer orders with status, payments, and balances.')}
          onAdd={onAddOrder}
          addLabel={t('orders.add', 'Add order')}
          user={user}
          canModifyFn={canModify}
        />

        <OrdersOverview orders={orders} />

        <div className="flex flex-col gap-4">
          {/* Search */}
          <SearchBar
            value={searchTerm}
            onChange={handleSearchChange}
            placeholder={t('orders.search', 'Search all columns...')}
          />

          {loading && <div className="text-gray-600 text-sm">{t('orders.loading', 'Loading orders...')}</div>}
          {error && <div className="text-red-600 text-sm">{error}</div>}
          
          {!loading && !error && (
            <>
              {/* Desktop Table View */}
              <div className="hidden md:block">
                <DataTable
                  columns={columns}
                  data={filteredData}
                  sortConfig={sortConfig}
                  onSort={handleSort}
                  onRowClick={onViewOrder}
                  renderCell={renderCell}
                  emptyMessage={t('orders.empty', 'No orders found. Try adjusting your search or filters.')}
                />
              </div>

              {/* Mobile Card View */}
              <MobileCardView
                data={filteredData}
                emptyMessage={t('orders.empty', 'No orders found. Try adjusting your search or filters.')}
                onItemClick={onViewOrder}
                renderCard={(order) => {
                  const statusStyle = statusStyles[order.status] || statusStyles.open
                  return (
                    <>
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
                    </>
                  )
                }}
              />
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default Orders

