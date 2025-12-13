import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import sql from '../../lib/neon'
import PageHeader from '../../components/layout/PageHeader'

function MonthlyReport({ user }) {
  const { t } = useTranslation()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedMonth, setSelectedMonth] = useState(() => {
    // Default to current month in YYYY-MM format
    const now = new Date()
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
  })
  
  const [reportData, setReportData] = useState({
    activities: {
      appointmentsCreated: 0,
      appointmentsCompleted: 0,
      appointmentsCancelled: 0,
      ordersCreated: 0,
      ordersClosed: 0,
      customersCreated: 0
    },
    sales: {
      totalOrders: 0,
      totalRevenue: 0,
      totalPayments: 0,
      averageOrderValue: 0,
      ordersCount: 0
    },
    incomes: {
      totalIncome: 0,
      transactionCount: 0,
      byType: []
    },
    expenses: {
      totalExpense: 0,
      transactionCount: 0,
      byType: []
    }
  })

  useEffect(() => {
    const fetchReportData = async () => {
      try {
        setLoading(true)
        setError(null)

        // Parse selected month
        const [year, month] = selectedMonth.split('-').map(Number)
        const startDate = new Date(year, month - 1, 1)
        const endDate = new Date(year, month, 0, 23, 59, 59, 999) // Last day of month

        // Fetch all data in parallel
        const [
          appointmentsResult,
          ordersResult,
          customersResult,
          salesOrdersResult,
          paymentsResult,
          incomesTotalResult,
          incomesByTypeResult,
          expensesTotalResult,
          expensesByTypeResult
        ] = await Promise.all([
          // Activities: Appointments
          sql`
            SELECT 
              COUNT(*) FILTER (WHERE status = 'completed') as completed_count,
              COUNT(*) FILTER (WHERE status = 'cancelled') as cancelled_count,
              COUNT(*) FILTER (WHERE DATE(created_at) >= ${startDate}::date AND DATE(created_at) <= ${endDate}::date) as created_count
            FROM scheduled_appointments
            WHERE DATE(scheduled_start) >= ${startDate}::date 
              AND DATE(scheduled_start) <= ${endDate}::date
          `,
          // Activities: Orders
          sql`
            SELECT 
              COUNT(*) FILTER (WHERE DATE(created_at) >= ${startDate}::date AND DATE(created_at) <= ${endDate}::date) as created_count,
              COUNT(*) FILTER (WHERE DATE(closed_at) >= ${startDate}::date AND DATE(closed_at) <= ${endDate}::date) as closed_count
            FROM orders
            WHERE (DATE(created_at) >= ${startDate}::date AND DATE(created_at) <= ${endDate}::date)
               OR (DATE(closed_at) >= ${startDate}::date AND DATE(closed_at) <= ${endDate}::date)
          `,
          // Activities: Customers
          sql`
            SELECT COUNT(*) as created_count
            FROM customers
            WHERE DATE(created_at) >= ${startDate}::date 
              AND DATE(created_at) <= ${endDate}::date
          `,
          // Sales: Orders
          sql`
            SELECT 
              COUNT(*) as orders_count,
              COALESCE(SUM(total_amount), 0) as total_revenue,
              COALESCE(AVG(total_amount), 0) as avg_order_value
            FROM orders
            WHERE DATE(created_at) >= ${startDate}::date 
              AND DATE(created_at) <= ${endDate}::date
          `,
          // Sales: Payments
          sql`
            SELECT 
              COALESCE(SUM(op.amount), 0) as total_payments
            FROM order_payments op
            JOIN orders o ON op.order_id = o.id
            WHERE DATE(op.occurred_at) >= ${startDate}::date 
              AND DATE(op.occurred_at) <= ${endDate}::date
          `,
          // Incomes: Total
          sql`
            SELECT 
              COALESCE(SUM(t.amount), 0) as total_income,
              COUNT(*) as transaction_count
            FROM transactions t
            JOIN transaction_types tt ON t.type_id = tt.id
            WHERE tt.direction = 'income'
              AND DATE(t.occurred_at) >= ${startDate}::date 
              AND DATE(t.occurred_at) <= ${endDate}::date
          `,
          // Incomes: By Type
          sql`
            SELECT 
              tt.label as type_label,
              tt.code as type_code,
              COALESCE(SUM(t.amount), 0) as amount,
              COUNT(*) as count
            FROM transactions t
            JOIN transaction_types tt ON t.type_id = tt.id
            WHERE tt.direction = 'income'
              AND DATE(t.occurred_at) >= ${startDate}::date 
              AND DATE(t.occurred_at) <= ${endDate}::date
            GROUP BY tt.id, tt.label, tt.code
            ORDER BY amount DESC
          `,
          // Expenses: Total
          sql`
            SELECT 
              COALESCE(SUM(t.amount), 0) as total_expense,
              COUNT(*) as transaction_count
            FROM transactions t
            JOIN transaction_types tt ON t.type_id = tt.id
            WHERE tt.direction = 'expense'
              AND DATE(t.occurred_at) >= ${startDate}::date 
              AND DATE(t.occurred_at) <= ${endDate}::date
          `,
          // Expenses: By Type
          sql`
            SELECT 
              tt.label as type_label,
              tt.code as type_code,
              COALESCE(SUM(t.amount), 0) as amount,
              COUNT(*) as count
            FROM transactions t
            JOIN transaction_types tt ON t.type_id = tt.id
            WHERE tt.direction = 'expense'
              AND DATE(t.occurred_at) >= ${startDate}::date 
              AND DATE(t.occurred_at) <= ${endDate}::date
            GROUP BY tt.id, tt.label, tt.code
            ORDER BY amount DESC
          `
        ])

        // Process activities
        const activities = {
          appointmentsCreated: Number(appointmentsResult[0]?.created_count || 0),
          appointmentsCompleted: Number(appointmentsResult[0]?.completed_count || 0),
          appointmentsCancelled: Number(appointmentsResult[0]?.cancelled_count || 0),
          ordersCreated: Number(ordersResult[0]?.created_count || 0),
          ordersClosed: Number(ordersResult[0]?.closed_count || 0),
          customersCreated: Number(customersResult[0]?.created_count || 0)
        }

        // Process sales
        const sales = {
          ordersCount: Number(salesOrdersResult[0]?.orders_count || 0),
          totalRevenue: Number(salesOrdersResult[0]?.total_revenue || 0),
          totalPayments: Number(paymentsResult[0]?.total_payments || 0),
          averageOrderValue: Number(salesOrdersResult[0]?.avg_order_value || 0)
        }

        // Process incomes
        const incomes = {
          totalIncome: Number(incomesTotalResult[0]?.total_income || 0),
          transactionCount: Number(incomesTotalResult[0]?.transaction_count || 0),
          byType: (incomesByTypeResult || []).map(row => ({
            label: row.type_label,
            code: row.type_code,
            amount: Number(row.amount || 0),
            count: Number(row.count || 0)
          }))
        }

        // Process expenses
        const expenses = {
          totalExpense: Number(expensesTotalResult[0]?.total_expense || 0),
          transactionCount: Number(expensesTotalResult[0]?.transaction_count || 0),
          byType: (expensesByTypeResult || []).map(row => ({
            label: row.type_label,
            code: row.type_code,
            amount: Number(row.amount || 0),
            count: Number(row.count || 0)
          }))
        }

        setReportData({
          activities,
          sales,
          incomes,
          expenses
        })
      } catch (err) {
        console.error('Failed to load monthly report:', err)
        setError(t('reports.error.load', 'Unable to load report data. Please try again later.'))
      } finally {
        setLoading(false)
      }
    }

    fetchReportData()
  }, [selectedMonth, t])

  const formatCurrency = (amount, currency = 'BRL') => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: currency
    }).format(amount)
  }

  const formatDate = (dateString) => {
    const [year, month] = dateString.split('-')
    const date = new Date(year, month - 1, 1)
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' })
  }

  if (loading) {
    return (
      <div className="p-4 md:p-6">
        <PageHeader
          title={t('reports.monthlyReport.title', 'Monthly Report')}
          description={t('reports.monthlyReport.description', 'Overview of activities, sales, incomes, and expenses for the selected month')}
        />
        <div className="mt-6 text-center text-gray-600">
          {t('common.loading', 'Loading...')}
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 md:p-6">
        <PageHeader
          title={t('reports.monthlyReport.title', 'Monthly Report')}
          description={t('reports.monthlyReport.description', 'Overview of activities, sales, incomes, and expenses for the selected month')}
        />
        <div className="mt-6 text-center text-red-600">
          {error}
        </div>
      </div>
    )
  }

  const netProfit = reportData.incomes.totalIncome - reportData.expenses.totalExpense

  return (
    <div className="p-4 md:p-6">
      <PageHeader
        title={t('reports.monthlyReport.title', 'Monthly Report')}
        description={t('reports.monthlyReport.description', 'Overview of activities, sales, incomes, and expenses for the selected month')}
      />

      {/* Month Selector */}
      <div className="mt-6 mb-6">
        <label htmlFor="month-selector" className="block text-sm font-medium text-gray-700 mb-2">
          {t('reports.monthlyReport.selectMonth', 'Select Month')}
        </label>
        <input
          id="month-selector"
          type="month"
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        />
      </div>

      {/* Selected Month Display */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900">
          {formatDate(selectedMonth)}
        </h2>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {/* Total Revenue */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                {t('reports.monthlyReport.totalRevenue', 'Total Revenue')}
              </p>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                {formatCurrency(reportData.sales.totalRevenue)}
              </p>
            </div>
            <div className="bg-green-100 rounded-full p-3">
              <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>

        {/* Total Income */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                {t('reports.monthlyReport.totalIncome', 'Total Income')}
              </p>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                {formatCurrency(reportData.incomes.totalIncome)}
              </p>
            </div>
            <div className="bg-blue-100 rounded-full p-3">
              <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
          </div>
        </div>

        {/* Total Expenses */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                {t('reports.monthlyReport.totalExpenses', 'Total Expenses')}
              </p>
              <p className="text-2xl font-bold text-gray-900 mt-2">
                {formatCurrency(reportData.expenses.totalExpense)}
              </p>
            </div>
            <div className="bg-red-100 rounded-full p-3">
              <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
              </svg>
            </div>
          </div>
        </div>

        {/* Net Profit */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">
                {t('reports.monthlyReport.netProfit', 'Net Profit')}
              </p>
              <p className={`text-2xl font-bold mt-2 ${netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatCurrency(netProfit)}
              </p>
            </div>
            <div className={`rounded-full p-3 ${netProfit >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
              <svg className={`w-6 h-6 ${netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      {/* Activities Section */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            {t('reports.monthlyReport.activities', 'Activities')}
          </h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
            <div>
              <p className="text-sm text-gray-600">{t('reports.monthlyReport.appointmentsCreated', 'Appointments Created')}</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{reportData.activities.appointmentsCreated}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">{t('reports.monthlyReport.appointmentsCompleted', 'Appointments Completed')}</p>
              <p className="text-2xl font-bold text-green-600 mt-1">{reportData.activities.appointmentsCompleted}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">{t('reports.monthlyReport.appointmentsCancelled', 'Appointments Cancelled')}</p>
              <p className="text-2xl font-bold text-red-600 mt-1">{reportData.activities.appointmentsCancelled}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">{t('reports.monthlyReport.ordersCreated', 'Orders Created')}</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{reportData.activities.ordersCreated}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">{t('reports.monthlyReport.ordersClosed', 'Orders Closed')}</p>
              <p className="text-2xl font-bold text-green-600 mt-1">{reportData.activities.ordersClosed}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">{t('reports.monthlyReport.customersCreated', 'Customers Created')}</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{reportData.activities.customersCreated}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Sales Section */}
      <div className="bg-white rounded-lg shadow mb-6">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">
            {t('reports.monthlyReport.sales', 'Sales')}
          </h3>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div>
              <p className="text-sm text-gray-600">{t('reports.monthlyReport.totalOrders', 'Total Orders')}</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{reportData.sales.ordersCount}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">{t('reports.monthlyReport.totalRevenue', 'Total Revenue')}</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(reportData.sales.totalRevenue)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">{t('reports.monthlyReport.totalPayments', 'Total Payments')}</p>
              <p className="text-2xl font-bold text-green-600 mt-1">{formatCurrency(reportData.sales.totalPayments)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">{t('reports.monthlyReport.averageOrderValue', 'Average Order Value')}</p>
              <p className="text-2xl font-bold text-gray-900 mt-1">{formatCurrency(reportData.sales.averageOrderValue)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Incomes and Expenses Side by Side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Incomes Section */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              {t('reports.monthlyReport.incomes', 'Incomes')}
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              {t('reports.monthlyReport.totalIncomes', 'Total')}: {formatCurrency(reportData.incomes.totalIncome)} ({reportData.incomes.transactionCount} {t('reports.monthlyReport.transactions', 'transactions')})
            </p>
          </div>
          <div className="p-6">
            {reportData.incomes.byType.length > 0 ? (
              <div className="space-y-4">
                {reportData.incomes.byType.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{item.label}</p>
                      <p className="text-sm text-gray-600">{item.count} {t('reports.monthlyReport.transactions', 'transactions')}</p>
                    </div>
                    <p className="text-lg font-bold text-blue-600">{formatCurrency(item.amount)}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">
                {t('reports.monthlyReport.noIncomes', 'No income transactions for this month')}
              </p>
            )}
          </div>
        </div>

        {/* Expenses Section */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              {t('reports.monthlyReport.expenses', 'Expenses')}
            </h3>
            <p className="text-sm text-gray-600 mt-1">
              {t('reports.monthlyReport.totalExpenses', 'Total')}: {formatCurrency(reportData.expenses.totalExpense)} ({reportData.expenses.transactionCount} {t('reports.monthlyReport.transactions', 'transactions')})
            </p>
          </div>
          <div className="p-6">
            {reportData.expenses.byType.length > 0 ? (
              <div className="space-y-4">
                {reportData.expenses.byType.map((item, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                    <div>
                      <p className="font-medium text-gray-900">{item.label}</p>
                      <p className="text-sm text-gray-600">{item.count} {t('reports.monthlyReport.transactions', 'transactions')}</p>
                    </div>
                    <p className="text-lg font-bold text-red-600">{formatCurrency(item.amount)}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">
                {t('reports.monthlyReport.noExpenses', 'No expense transactions for this month')}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default MonthlyReport

