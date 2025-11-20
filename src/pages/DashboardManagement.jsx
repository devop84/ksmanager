import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import sql from '../lib/neon'
import { useSettings } from '../context/SettingsContext'

function DashboardManagement({ onEditOrder = () => {}, onViewCustomer = () => {}, onNavigate = () => {} }) {
  const { t } = useTranslation()
  const { formatCurrency, formatDate, formatDateTime } = useSettings()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [metrics, setMetrics] = useState({
    totalRevenue: { current: 0, previous: 0 },
    activeOrders: 0,
    totalCustomers: 0,
    outstandingPayments: 0,
    todayActivities: 0,
    revenueByCategory: { lessons: 0, rentals: 0, storage: 0 },
    activeRentals: 0,
    activeStorage: 0,
    upcomingLessons: 0,
  })
  const [recentTransactions, setRecentTransactions] = useState([])
  const [topCustomers, setTopCustomers] = useState([])
  const [upcomingActivities, setUpcomingActivities] = useState([])

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true)
        setError(null)

        const now = new Date()
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
        const startOfPreviousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0)
        const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59)
        const tomorrow = new Date(now)
        tomorrow.setDate(tomorrow.getDate() + 1)
        const endOfTomorrow = new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate(), 23, 59, 59)

        // Total Revenue (this month and previous month)
        const revenueRows = await sql`
          SELECT 
            SUM(CASE WHEN t.occurred_at >= ${startOfMonth.toISOString()} AND tt.direction = 'income' THEN t.amount ELSE 0 END) AS current_month,
            SUM(CASE WHEN t.occurred_at >= ${startOfPreviousMonth.toISOString()} AND t.occurred_at < ${startOfMonth.toISOString()} AND tt.direction = 'income' THEN t.amount ELSE 0 END) AS previous_month
          FROM transactions t
          JOIN transaction_types tt ON tt.id = t.type_id
        `
        const revenue = revenueRows[0] || { current_month: 0, previous_month: 0 }

        // Revenue by category (this month) - simplified
        const revenueByCategoryRows = await sql`
          SELECT 
            COALESCE(sc.name, 'other') AS category,
            SUM(CASE WHEN tt.direction = 'income' THEN t.amount ELSE 0 END) AS revenue
          FROM transactions t
          JOIN transaction_types tt ON tt.id = t.type_id
          LEFT JOIN orders o ON (
            (t.source_entity_type = 'order' AND t.source_entity_id = o.id) OR
            (t.destination_entity_type = 'order' AND t.destination_entity_id = o.id)
          )
          LEFT JOIN services s ON s.id = o.service_id
          LEFT JOIN service_categories sc ON sc.id = s.category_id
          WHERE t.occurred_at >= ${startOfMonth.toISOString()}
            AND tt.direction = 'income'
          GROUP BY sc.name
        `
        const revenueByCategory = { lessons: 0, rentals: 0, storage: 0 }
        if (revenueByCategoryRows && revenueByCategoryRows.length > 0) {
          revenueByCategoryRows.forEach((row) => {
            if (row.category) {
              const categoryKey = row.category.toLowerCase()
              if (revenueByCategory.hasOwnProperty(categoryKey)) {
                revenueByCategory[categoryKey] = Number(row.revenue || 0)
              }
            }
          })
        }

        // Active Orders (in progress) - fixed query
        const activeOrdersRows = await sql`
          SELECT COUNT(DISTINCT o.id) AS count
          FROM orders o
          WHERE o.cancelled = FALSE
            AND (
              EXISTS (
                SELECT 1 FROM orders_lessons ol 
                WHERE ol.order_id = o.id 
                  AND ol.starting <= CURRENT_TIMESTAMP 
                  AND ol.ending >= CURRENT_TIMESTAMP
              )
              OR EXISTS (
                SELECT 1 FROM orders_rentals orent 
                WHERE orent.order_id = o.id 
                  AND orent.starting <= CURRENT_TIMESTAMP 
                  AND orent.ending >= CURRENT_TIMESTAMP
              )
              OR EXISTS (
                SELECT 1 FROM orders_storage ost 
                WHERE ost.order_id = o.id 
                  AND ost.starting <= CURRENT_TIMESTAMP 
                  AND ost.ending >= CURRENT_TIMESTAMP
              )
            )
        `
        const activeOrders = Number(activeOrdersRows[0]?.count || 0)

        // Total Customers
        const customersRows = await sql`SELECT COUNT(*) AS count FROM customers`
        const totalCustomers = Number(customersRows[0]?.count || 0)

        // Outstanding Payments - simplified calculation
        const outstandingPayments = 0

        // Today's Activities
        const todayActivitiesRows = await sql`
          SELECT COUNT(*) AS count
          FROM (
            SELECT o.id FROM orders o
            LEFT JOIN orders_lessons ol ON ol.order_id = o.id
            LEFT JOIN orders_rentals orent ON orent.order_id = o.id
            LEFT JOIN orders_storage ost ON ost.order_id = o.id
            WHERE o.cancelled = FALSE
              AND (
                (ol.starting >= ${startOfToday.toISOString()} AND ol.starting < ${endOfToday.toISOString()}) OR
                (orent.starting >= ${startOfToday.toISOString()} AND orent.starting < ${endOfToday.toISOString()}) OR
                (ost.starting >= ${startOfToday.toISOString()} AND ost.starting < ${endOfToday.toISOString()})
              )
          ) sub
        `
        const todayActivities = Number(todayActivitiesRows[0]?.count || 0)

        // Active Rentals and Storage
        const activeRentalsRows = await sql`
          SELECT COUNT(*) AS count
          FROM orders_rentals orent
          JOIN orders o ON o.id = orent.order_id
          WHERE o.cancelled = FALSE
            AND orent.starting <= CURRENT_TIMESTAMP
            AND orent.ending >= CURRENT_TIMESTAMP
        `
        const activeRentals = Number(activeRentalsRows[0]?.count || 0)

        const activeStorageRows = await sql`
          SELECT COUNT(*) AS count
          FROM orders_storage ost
          JOIN orders o ON o.id = ost.order_id
          WHERE o.cancelled = FALSE
            AND ost.starting <= CURRENT_TIMESTAMP
            AND ost.ending >= CURRENT_TIMESTAMP
        `
        const activeStorage = Number(activeStorageRows[0]?.count || 0)

        // Upcoming Lessons (next 24 hours)
        const upcomingLessonsRows = await sql`
          SELECT COUNT(*) AS count
          FROM orders_lessons ol
          JOIN orders o ON o.id = ol.order_id
          WHERE o.cancelled = FALSE
            AND ol.starting > CURRENT_TIMESTAMP
            AND ol.starting <= ${endOfTomorrow.toISOString()}
        `
        const upcomingLessons = Number(upcomingLessonsRows[0]?.count || 0)

        // Recent Transactions (last 5)
        const recentTxnRows = await sql`
          SELECT
            t.id,
            t.occurred_at,
            t.amount,
            tt.label AS type_label,
            tt.direction,
            c.fullname AS customer_name,
            t.source_entity_type,
            t.destination_entity_type
          FROM transactions t
          JOIN transaction_types tt ON tt.id = t.type_id
          LEFT JOIN customers c ON (
            (t.source_entity_type = 'customer' AND t.source_entity_id = c.id) OR
            (t.destination_entity_type = 'customer' AND t.destination_entity_id = c.id)
          )
          ORDER BY t.occurred_at DESC
          LIMIT 5
        `

        // Top Customers by Revenue (this month) - fixed query
        const topCustomersRows = await sql`
          SELECT
            c.id,
            c.fullname,
            COALESCE(SUM(CASE WHEN tt.direction = 'income' AND t.source_entity_type = 'customer' AND t.occurred_at >= ${startOfMonth.toISOString()} THEN t.amount ELSE 0 END), 0) AS revenue
          FROM customers c
          LEFT JOIN transactions t ON t.source_entity_type = 'customer' AND t.source_entity_id = c.id
          LEFT JOIN transaction_types tt ON tt.id = t.type_id
          GROUP BY c.id, c.fullname
          HAVING COALESCE(SUM(CASE WHEN tt.direction = 'income' AND t.source_entity_type = 'customer' AND t.occurred_at >= ${startOfMonth.toISOString()} THEN t.amount ELSE 0 END), 0) > 0
          ORDER BY revenue DESC
          LIMIT 5
        `

        // Upcoming Activities (next 48 hours)
        const upcomingRows = await sql`
          SELECT
            o.id AS order_id,
            c.fullname AS customer_name,
            s.name AS service_name,
            sc.name AS category_name,
            COALESCE(ol.starting, orent.starting, ost.starting) AS starting,
            CASE
              WHEN ol.order_id IS NOT NULL THEN 'lessons'
              WHEN orent.order_id IS NOT NULL THEN 'rentals'
              WHEN ost.order_id IS NOT NULL THEN 'storage'
              ELSE 'other'
            END AS type
          FROM orders o
          JOIN customers c ON c.id = o.customer_id
          JOIN services s ON s.id = o.service_id
          JOIN service_categories sc ON sc.id = s.category_id
          LEFT JOIN orders_lessons ol ON ol.order_id = o.id
          LEFT JOIN orders_rentals orent ON orent.order_id = o.id
          LEFT JOIN orders_storage ost ON ost.order_id = o.id
          WHERE o.cancelled = FALSE
            AND COALESCE(ol.starting, orent.starting, ost.starting) > CURRENT_TIMESTAMP
            AND COALESCE(ol.starting, orent.starting, ost.starting) <= ${endOfTomorrow.toISOString()}
          ORDER BY COALESCE(ol.starting, orent.starting, ost.starting) ASC
          LIMIT 10
        `

        setMetrics({
          totalRevenue: {
            current: Number(revenue.current_month || 0),
            previous: Number(revenue.previous_month || 0),
          },
          activeOrders,
          totalCustomers,
          outstandingPayments,
          todayActivities,
          revenueByCategory,
          activeRentals,
          activeStorage,
          upcomingLessons,
        })
        setRecentTransactions(recentTxnRows || [])
        setTopCustomers(topCustomersRows || [])
        setUpcomingActivities(upcomingRows || [])
      } catch (err) {
        console.error('Failed to load dashboard data:', err)
        console.error('Error details:', err.message, err.stack)
        setError(`${t('dashboardManagement.error.load')}: ${err.message || 'Unknown error'}`)
      } finally {
        setLoading(false)
      }
    }

    fetchDashboardData()
  }, [t])

  const revenueChange = metrics.totalRevenue.previous > 0
    ? ((metrics.totalRevenue.current - metrics.totalRevenue.previous) / metrics.totalRevenue.previous) * 100
    : 0

  const formatAmount = (amount, direction) => {
    const formatted = formatCurrency(Math.abs(Number(amount || 0)))
    if (direction === 'income') return `+${formatted}`
    if (direction === 'expense') return `-${formatted}`
    return formatted
  }

  if (loading) {
    return (
      <div className="px-4 py-6 sm:p-6 lg:p-8">
        <div className="text-gray-600">{t('common.loading')}</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="px-4 py-6 sm:p-6 lg:p-8">
        <div className="text-red-600">{error}</div>
      </div>
    )
  }

  return (
    <div className="px-4 py-6 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
        <h1 className="text-3xl font-bold text-gray-900">{t('dashboardManagement.title')}</h1>
        <p className="text-gray-500 text-sm mt-1">{t('dashboardManagement.description')}</p>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-5 border border-blue-200">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-blue-700">{t('dashboardManagement.metrics.revenue')}</p>
            <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-2xl font-bold text-blue-900">{formatCurrency(metrics.totalRevenue.current)}</p>
          {metrics.totalRevenue.previous > 0 && (
            <p className={`text-xs mt-1 ${revenueChange >= 0 ? 'text-green-700' : 'text-red-700'}`}>
              {revenueChange >= 0 ? '↑' : '↓'} {Math.abs(revenueChange).toFixed(1)}% {t('dashboardManagement.metrics.vsLastMonth')}
            </p>
          )}
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-5 border border-green-200">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-green-700">{t('dashboardManagement.metrics.activeOrders')}</p>
            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          </div>
          <p className="text-2xl font-bold text-green-900">{metrics.activeOrders}</p>
          <p className="text-xs text-green-700 mt-1">{t('dashboardManagement.metrics.inProgress')}</p>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-5 border border-purple-200">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-purple-700">{t('dashboardManagement.metrics.customers')}</p>
            <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <p className="text-2xl font-bold text-purple-900">{metrics.totalCustomers}</p>
          <button
            onClick={() => onNavigate('customers')}
            className="text-xs text-purple-700 hover:text-purple-900 mt-1 underline"
          >
            {t('dashboardManagement.metrics.viewAll')}
          </button>
        </div>

        <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl p-5 border border-amber-200">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-amber-700">{t('dashboardManagement.metrics.outstanding')}</p>
            <svg className="w-5 h-5 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-2xl font-bold text-amber-900">{formatCurrency(metrics.outstandingPayments)}</p>
          <button
            onClick={() => onNavigate('transactions')}
            className="text-xs text-amber-700 hover:text-amber-900 mt-1 underline"
          >
            {t('dashboardManagement.metrics.viewPayments')}
          </button>
        </div>

        <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-xl p-5 border border-indigo-200">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium text-indigo-700">{t('dashboardManagement.metrics.todayActivities')}</p>
            <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </div>
          <p className="text-2xl font-bold text-indigo-900">{metrics.todayActivities}</p>
          <p className="text-xs text-indigo-700 mt-1">{t('dashboardManagement.metrics.scheduled')}</p>
        </div>
      </div>

      {/* Revenue Breakdown and Operational Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue by Category */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('dashboardManagement.revenue.title')}</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span className="text-sm font-medium text-gray-700">{t('dashboardManagement.revenue.lessons')}</span>
              </div>
              <span className="text-sm font-semibold text-gray-900">{formatCurrency(metrics.revenueByCategory.lessons)}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm font-medium text-gray-700">{t('dashboardManagement.revenue.rentals')}</span>
              </div>
              <span className="text-sm font-semibold text-gray-900">{formatCurrency(metrics.revenueByCategory.rentals)}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                <span className="text-sm font-medium text-gray-700">{t('dashboardManagement.revenue.storage')}</span>
              </div>
              <span className="text-sm font-semibold text-gray-900">{formatCurrency(metrics.revenueByCategory.storage)}</span>
            </div>
          </div>
        </div>

        {/* Operational Status */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('dashboardManagement.operational.title')}</h2>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-700 mb-1">{t('dashboardManagement.operational.activeRentals')}</p>
              <p className="text-2xl font-bold text-blue-900">{metrics.activeRentals}</p>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
              <p className="text-sm text-purple-700 mb-1">{t('dashboardManagement.operational.activeStorage')}</p>
              <p className="text-2xl font-bold text-purple-900">{metrics.activeStorage}</p>
            </div>
            <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200 col-span-2">
              <p className="text-sm text-yellow-700 mb-1">{t('dashboardManagement.operational.upcomingLessons')}</p>
              <p className="text-2xl font-bold text-yellow-900">{metrics.upcomingLessons}</p>
              <p className="text-xs text-yellow-600 mt-1">{t('dashboardManagement.operational.next24Hours')}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Transactions and Upcoming Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Transactions */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">{t('dashboardManagement.transactions.title')}</h2>
            <button
              onClick={() => onNavigate('transactions')}
              className="text-sm text-indigo-600 hover:text-indigo-800"
            >
              {t('dashboardManagement.transactions.viewAll')}
            </button>
          </div>
          {recentTransactions.length === 0 ? (
            <p className="text-sm text-gray-500">{t('dashboardManagement.transactions.empty')}</p>
          ) : (
            <div className="space-y-3">
              {recentTransactions.map((txn) => (
                <div key={txn.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{txn.type_label}</p>
                    <p className="text-xs text-gray-500">{formatDateTime(txn.occurred_at)}</p>
                    {txn.customer_name && (
                      <p className="text-xs text-indigo-600 mt-1">{txn.customer_name}</p>
                    )}
                  </div>
                  <p
                    className={`text-sm font-semibold ml-4 ${
                      txn.direction === 'income' ? 'text-green-600' : txn.direction === 'expense' ? 'text-red-600' : 'text-gray-900'
                    }`}
                  >
                    {formatAmount(txn.amount, txn.direction)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upcoming Activities */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">{t('dashboardManagement.upcoming.title')}</h2>
            <button
              onClick={() => onNavigate('orders')}
              className="text-sm text-indigo-600 hover:text-indigo-800"
            >
              {t('dashboardManagement.upcoming.viewAll')}
            </button>
          </div>
          {upcomingActivities.length === 0 ? (
            <p className="text-sm text-gray-500">{t('dashboardManagement.upcoming.empty')}</p>
          ) : (
            <div className="space-y-3">
              {upcomingActivities.map((activity) => (
                <div
                  key={activity.order_id}
                  onClick={() => onEditOrder({ id: activity.order_id })}
                  className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{activity.customer_name}</p>
                    <p className="text-xs text-gray-500">
                      {activity.service_name} • {t(`dashboardManagement.upcoming.${activity.type}`)}
                    </p>
                    <p className="text-xs text-indigo-600 mt-1">{formatDateTime(activity.starting)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Top Customers */}
      {topCustomers.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">{t('dashboardManagement.topCustomers.title')}</h2>
            <button
              onClick={() => onNavigate('customers')}
              className="text-sm text-indigo-600 hover:text-indigo-800"
            >
              {t('dashboardManagement.topCustomers.viewAll')}
            </button>
          </div>
          <div className="space-y-3">
            {topCustomers.map((customer, index) => (
              <div
                key={customer.id}
                onClick={() => onViewCustomer({ id: customer.id })}
                className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-sm font-semibold text-indigo-700">
                    {index + 1}
                  </div>
                  <p className="text-sm font-medium text-gray-900">{customer.fullname}</p>
                </div>
                <p className="text-sm font-semibold text-gray-900">{formatCurrency(customer.revenue)}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default DashboardManagement

