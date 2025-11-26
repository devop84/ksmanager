import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useSettings } from '../../context/SettingsContext'

/**
 * OrdersOverview - Component for displaying order statistics
 * @param {Array} orders - Array of order objects
 */
function OrdersOverview({ orders = [] }) {
  const { t } = useTranslation()
  const { formatCurrency } = useSettings()

  const stats = useMemo(() => {
    if (!orders || !Array.isArray(orders)) {
      return {
        total: 0,
        open: 0,
        closed: 0,
        cancelled: 0,
        totalRevenue: 0,
        pendingPayments: 0
      }
    }

    let open = 0
    let closed = 0
    let cancelled = 0
    let totalRevenue = 0
    let pendingPayments = 0

    orders.forEach((order) => {
      if (!order) return

      // Count by status
      switch (order.status) {
        case 'open':
          open++
          // Sum balance_due for pending payments
          pendingPayments += Number(order.balance_due) || 0
          break
        case 'closed':
          closed++
          // Sum total_amount for revenue
          totalRevenue += Number(order.total_amount) || 0
          break
        case 'cancelled':
          cancelled++
          break
      }
    })

    return {
      total: orders.length,
      open,
      closed,
      cancelled,
      totalRevenue,
      pendingPayments
    }
  }, [orders])

  const formatAmount = (amount) =>
    formatCurrency(Number(amount || 0), { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  return (
    <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-5">
      {/* Total Orders */}
      <div className="rounded-xl border border-indigo-100 bg-indigo-50/70 p-4">
        <p className="text-sm font-medium text-indigo-700">
          {t('orders.overview.total', 'Total Orders')}
        </p>
        <p className="mt-2 text-2xl font-semibold text-indigo-800">
          {stats.total}
        </p>
      </div>

      {/* Open Orders */}
      <div className="rounded-xl border border-blue-100 bg-blue-50/70 p-4">
        <p className="text-sm font-medium text-blue-700">
          {t('orders.overview.open', 'Open')}
        </p>
        <p className="mt-2 text-2xl font-semibold text-blue-800">
          {stats.open}
        </p>
      </div>

      {/* Closed Orders */}
      <div className="rounded-xl border border-emerald-100 bg-emerald-50/70 p-4">
        <p className="text-sm font-medium text-emerald-700">
          {t('orders.overview.closed', 'Closed')}
        </p>
        <p className="mt-2 text-2xl font-semibold text-emerald-800">
          {stats.closed}
        </p>
      </div>

      {/* Cancelled Orders */}
      <div className="rounded-xl border border-rose-100 bg-rose-50/70 p-4">
        <p className="text-sm font-medium text-rose-700">
          {t('orders.overview.cancelled', 'Cancelled')}
        </p>
        <p className="mt-2 text-2xl font-semibold text-rose-800">
          {stats.cancelled}
        </p>
      </div>

      {/* Total Revenue (from closed orders) */}
      <div className="rounded-xl border border-emerald-100 bg-emerald-50/70 p-4">
        <p className="text-sm font-medium text-emerald-700">
          {t('orders.overview.revenue', 'Total Revenue')}
        </p>
        <p className="mt-2 text-2xl font-semibold text-emerald-800">
          {formatAmount(stats.totalRevenue)}
        </p>
      </div>
    </div>
  )
}

export default OrdersOverview








