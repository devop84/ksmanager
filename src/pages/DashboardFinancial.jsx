import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import sql from '../lib/neon'
import { useSettings } from '../context/SettingsContext'

function DashboardFinancial({ onViewCustomer = () => {}, onNavigate = () => {} }) {
  const { t } = useTranslation()
  const { formatCurrency, formatDate, formatDateTime } = useSettings()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  const [revenueMetrics, setRevenueMetrics] = useState({
    today: 0,
    week: 0,
    month: 0,
    previousMonth: 0,
  })
  
  const [revenueByCategory, setRevenueByCategory] = useState({
    lessons: 0,
    rentals: 0,
    storage: 0,
    other: 0,
  })
  
  const [revenueByPaymentMethod, setRevenueByPaymentMethod] = useState([])
  const [outstandingPayments, setOutstandingPayments] = useState([])
  const [recentTransactions, setRecentTransactions] = useState([])
  const [topCustomers, setTopCustomers] = useState([])
  const [financialAlerts, setFinancialAlerts] = useState([])

  useEffect(() => {
    const fetchFinancialData = async () => {
      try {
        setLoading(true)
        setError(null)

        const now = new Date()
        const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0)
        const startOfWeek = new Date(now)
        startOfWeek.setDate(now.getDate() - now.getDay())
        startOfWeek.setHours(0, 0, 0, 0)
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
        const startOfPreviousMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
        const endOfPreviousMonth = new Date(now.getFullYear(), now.getMonth(), 0)

        // Revenue metrics
        const revenueRows = await sql`
          SELECT 
            SUM(CASE WHEN t.occurred_at >= ${startOfToday.toISOString()} AND tt.direction = 'income' THEN t.amount ELSE 0 END) AS today,
            SUM(CASE WHEN t.occurred_at >= ${startOfWeek.toISOString()} AND tt.direction = 'income' THEN t.amount ELSE 0 END) AS week,
            SUM(CASE WHEN t.occurred_at >= ${startOfMonth.toISOString()} AND tt.direction = 'income' THEN t.amount ELSE 0 END) AS month,
            SUM(CASE WHEN t.occurred_at >= ${startOfPreviousMonth.toISOString()} AND t.occurred_at < ${startOfMonth.toISOString()} AND tt.direction = 'income' THEN t.amount ELSE 0 END) AS previous_month
          FROM transactions t
          JOIN transaction_types tt ON tt.id = t.type_id
        `
        const revenue = revenueRows[0] || { today: 0, week: 0, month: 0, previous_month: 0 }

        // Revenue by category
        const categoryRows = await sql`
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
        const categoryRevenue = { lessons: 0, rentals: 0, storage: 0, other: 0 }
        if (categoryRows && categoryRows.length > 0) {
          categoryRows.forEach((row) => {
            const key = row.category?.toLowerCase() || 'other'
            if (categoryRevenue.hasOwnProperty(key)) {
              categoryRevenue[key] = Number(row.revenue || 0)
            } else {
              categoryRevenue.other += Number(row.revenue || 0)
            }
          })
        }

        // Revenue by payment method
        const paymentMethodRows = await sql`
          SELECT 
            COALESCE(pm.name, 'Unknown') AS method,
            SUM(CASE WHEN tt.direction = 'income' THEN t.amount ELSE 0 END) AS revenue,
            COUNT(*) AS transaction_count
          FROM transactions t
          JOIN transaction_types tt ON tt.id = t.type_id
          LEFT JOIN payment_methods pm ON pm.id = t.payment_method_id
          WHERE t.occurred_at >= ${startOfMonth.toISOString()}
            AND tt.direction = 'income'
          GROUP BY pm.name
          ORDER BY revenue DESC
        `

        // Outstanding payments (simplified - customers with orders but no recent payments)
        const outstandingRows = await sql`
          SELECT
            c.id,
            c.fullname,
            COUNT(DISTINCT o.id) AS order_count,
            MAX(o.created_at) AS last_order_date
          FROM customers c
          JOIN orders o ON o.customer_id = c.id
          WHERE o.cancelled = FALSE
            AND o.created_at >= ${startOfMonth.toISOString()}
            AND NOT EXISTS (
              SELECT 1 FROM transactions t
              WHERE (t.source_entity_type = 'customer' AND t.source_entity_id = c.id)
                 OR (t.destination_entity_type = 'customer' AND t.destination_entity_id = c.id)
            )
          GROUP BY c.id, c.fullname
          ORDER BY last_order_date DESC
          LIMIT 10
        `

        // Recent transactions
        const recentTxnRows = await sql`
          SELECT
            t.id,
            t.occurred_at,
            t.amount,
            tt.label AS type_label,
            tt.direction,
            pm.name AS payment_method,
            c.fullname AS customer_name
          FROM transactions t
          JOIN transaction_types tt ON tt.id = t.type_id
          LEFT JOIN payment_methods pm ON pm.id = t.payment_method_id
          LEFT JOIN customers c ON (
            (t.source_entity_type = 'customer' AND t.source_entity_id = c.id) OR
            (t.destination_entity_type = 'customer' AND t.destination_entity_id = c.id)
          )
          ORDER BY t.occurred_at DESC
          LIMIT 20
        `

        // Top customers by revenue (this month)
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
          LIMIT 10
        `

        // Financial alerts (large transactions, overdue indicators)
        const alertsRows = await sql`
          SELECT
            'large_transaction' AS alert_type,
            t.id,
            t.occurred_at,
            t.amount,
            tt.label AS type_label,
            c.fullname AS customer_name
          FROM transactions t
          JOIN transaction_types tt ON tt.id = t.type_id
          LEFT JOIN customers c ON (
            (t.source_entity_type = 'customer' AND t.source_entity_id = c.id) OR
            (t.destination_entity_type = 'customer' AND t.destination_entity_id = c.id)
          )
          WHERE t.occurred_at >= ${startOfMonth.toISOString()}
            AND ABS(t.amount) > 1000
          ORDER BY ABS(t.amount) DESC
          LIMIT 5
        `

        setRevenueMetrics({
          today: Number(revenue.today || 0),
          week: Number(revenue.week || 0),
          month: Number(revenue.month || 0),
          previousMonth: Number(revenue.previous_month || 0),
        })
        setRevenueByCategory(categoryRevenue)
        setRevenueByPaymentMethod(paymentMethodRows || [])
        setOutstandingPayments(outstandingRows || [])
        setRecentTransactions(recentTxnRows || [])
        setTopCustomers(topCustomersRows || [])
        setFinancialAlerts(alertsRows || [])
      } catch (err) {
        console.error('Failed to load financial data:', err)
        setError(t('dashboardFinancial.error.load'))
      } finally {
        setLoading(false)
      }
    }

    fetchFinancialData()
  }, [t])

  const revenueChange = revenueMetrics.previousMonth > 0
    ? ((revenueMetrics.month - revenueMetrics.previousMonth) / revenueMetrics.previousMonth) * 100
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
        <h1 className="text-3xl font-bold text-gray-900">{t('dashboardFinancial.title')}</h1>
        <p className="text-gray-500 text-sm mt-1">{t('dashboardFinancial.description')}</p>
      </div>

      {/* Revenue Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-5 border border-blue-200">
          <p className="text-sm font-medium text-blue-700 mb-1">{t('dashboardFinancial.revenue.today')}</p>
          <p className="text-2xl font-bold text-blue-900">{formatCurrency(revenueMetrics.today)}</p>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-5 border border-green-200">
          <p className="text-sm font-medium text-green-700 mb-1">{t('dashboardFinancial.revenue.week')}</p>
          <p className="text-2xl font-bold text-green-900">{formatCurrency(revenueMetrics.week)}</p>
        </div>
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-5 border border-purple-200">
          <p className="text-sm font-medium text-purple-700 mb-1">{t('dashboardFinancial.revenue.month')}</p>
          <p className="text-2xl font-bold text-purple-900">{formatCurrency(revenueMetrics.month)}</p>
          {revenueMetrics.previousMonth > 0 && (
            <p className={`text-xs mt-1 ${revenueChange >= 0 ? 'text-green-700' : 'text-red-700'}`}>
              {revenueChange >= 0 ? '↑' : '↓'} {Math.abs(revenueChange).toFixed(1)}% {t('dashboardFinancial.revenue.vsLastMonth')}
            </p>
          )}
        </div>
        <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl p-5 border border-amber-200">
          <p className="text-sm font-medium text-amber-700 mb-1">{t('dashboardFinancial.revenue.previousMonth')}</p>
          <p className="text-2xl font-bold text-amber-900">{formatCurrency(revenueMetrics.previousMonth)}</p>
        </div>
      </div>

      {/* Revenue Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue by Category */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('dashboardFinancial.revenueByCategory.title')}</h2>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                <span className="text-sm font-medium text-gray-700">{t('dashboardFinancial.revenueByCategory.lessons')}</span>
              </div>
              <span className="text-sm font-semibold text-gray-900">{formatCurrency(revenueByCategory.lessons)}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm font-medium text-gray-700">{t('dashboardFinancial.revenueByCategory.rentals')}</span>
              </div>
              <span className="text-sm font-semibold text-gray-900">{formatCurrency(revenueByCategory.rentals)}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-purple-50 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 bg-purple-500 rounded-full"></div>
                <span className="text-sm font-medium text-gray-700">{t('dashboardFinancial.revenueByCategory.storage')}</span>
              </div>
              <span className="text-sm font-semibold text-gray-900">{formatCurrency(revenueByCategory.storage)}</span>
            </div>
            {revenueByCategory.other > 0 && (
              <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-gray-500 rounded-full"></div>
                  <span className="text-sm font-medium text-gray-700">{t('dashboardFinancial.revenueByCategory.other')}</span>
                </div>
                <span className="text-sm font-semibold text-gray-900">{formatCurrency(revenueByCategory.other)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Revenue by Payment Method */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('dashboardFinancial.paymentMethods.title')}</h2>
          {revenueByPaymentMethod.length === 0 ? (
            <p className="text-sm text-gray-500">{t('dashboardFinancial.paymentMethods.empty')}</p>
          ) : (
            <div className="space-y-3">
              {revenueByPaymentMethod.map((method, index) => (
                <div key={index} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{method.method}</p>
                    <p className="text-xs text-gray-500">{t('dashboardFinancial.paymentMethods.transactions', { count: method.transaction_count })}</p>
                  </div>
                  <span className="text-sm font-semibold text-gray-900">{formatCurrency(method.revenue)}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Outstanding Payments and Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Outstanding Payments */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">{t('dashboardFinancial.outstanding.title')}</h2>
            <button
              onClick={() => onNavigate('transactions')}
              className="text-sm text-indigo-600 hover:text-indigo-800"
            >
              {t('dashboardFinancial.outstanding.viewAll')}
            </button>
          </div>
          {outstandingPayments.length === 0 ? (
            <p className="text-sm text-gray-500">{t('dashboardFinancial.outstanding.empty')}</p>
          ) : (
            <div className="space-y-3">
              {outstandingPayments.map((customer) => (
                <div
                  key={customer.id}
                  onClick={() => onViewCustomer({ id: customer.id })}
                  className="p-3 border border-amber-200 bg-amber-50 rounded-lg hover:bg-amber-100 cursor-pointer transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{customer.fullname}</p>
                      <p className="text-xs text-gray-600 mt-1">
                        {t('dashboardFinancial.outstanding.orders', { count: customer.order_count })}
                      </p>
                    </div>
                    <p className="text-xs text-gray-500">{formatDate(customer.last_order_date)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Transactions */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">{t('dashboardFinancial.recentTransactions.title')}</h2>
            <button
              onClick={() => onNavigate('transactions')}
              className="text-sm text-indigo-600 hover:text-indigo-800"
            >
              {t('dashboardFinancial.recentTransactions.viewAll')}
            </button>
          </div>
          {recentTransactions.length === 0 ? (
            <p className="text-sm text-gray-500">{t('dashboardFinancial.recentTransactions.empty')}</p>
          ) : (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {recentTransactions.map((txn) => (
                <div key={txn.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{txn.type_label}</p>
                    <p className="text-xs text-gray-500">{formatDateTime(txn.occurred_at)}</p>
                    {txn.customer_name && (
                      <p className="text-xs text-indigo-600 mt-1">{txn.customer_name}</p>
                    )}
                    {txn.payment_method && (
                      <p className="text-xs text-gray-400 mt-1">{txn.payment_method}</p>
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
      </div>

      {/* Top Customers and Financial Alerts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Customers */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">{t('dashboardFinancial.topCustomers.title')}</h2>
            <button
              onClick={() => onNavigate('customers')}
              className="text-sm text-indigo-600 hover:text-indigo-800"
            >
              {t('dashboardFinancial.topCustomers.viewAll')}
            </button>
          </div>
          {topCustomers.length === 0 ? (
            <p className="text-sm text-gray-500">{t('dashboardFinancial.topCustomers.empty')}</p>
          ) : (
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
          )}
        </div>

        {/* Financial Alerts */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('dashboardFinancial.alerts.title')}</h2>
          {financialAlerts.length === 0 ? (
            <p className="text-sm text-gray-500">{t('dashboardFinancial.alerts.empty')}</p>
          ) : (
            <div className="space-y-3">
              {financialAlerts.map((alert) => (
                <div key={alert.id} className="p-3 border border-yellow-200 bg-yellow-50 rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-gray-900">{t('dashboardFinancial.alerts.largeTransaction')}</p>
                      <p className="text-xs text-gray-600 mt-1">{alert.type_label}</p>
                      {alert.customer_name && (
                        <p className="text-xs text-indigo-600 mt-1">{alert.customer_name}</p>
                      )}
                      <p className="text-xs text-gray-500 mt-1">{formatDateTime(alert.occurred_at)}</p>
                    </div>
                    <p className="text-sm font-bold text-amber-700 ml-4">{formatCurrency(Math.abs(alert.amount))}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default DashboardFinancial

