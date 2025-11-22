import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import sql from '../lib/neon'
import { useSettings } from '../context/SettingsContext'
import PageHeader from '../components/PageHeader'

function Dashboard({ user, onNavigate, onViewOrder, onViewTransaction, onViewAppointment, onViewCustomer }) {
  const { t } = useTranslation()
  const { formatCurrency, formatDate } = useSettings()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [stats, setStats] = useState({
    totalCustomers: 0,
    totalOrders: 0,
    openOrders: 0,
    closedOrders: 0,
    totalRevenue: 0,
    monthlyRevenue: 0,
    outstandingPayments: 0,
    totalAppointments: 0,
    upcomingAppointments: 0,
    totalInstructors: 0,
    totalStaff: 0,
    totalAgencies: 0,
    totalHotels: 0
  })
  const [recentOrders, setRecentOrders] = useState([])
  const [recentTransactions, setRecentTransactions] = useState([])
  const [upcomingAppointments, setUpcomingAppointments] = useState([])

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      setLoading(true)
      setError(null)

      // Get current date ranges
      const now = new Date()
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
      const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59)
      const next7Days = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)

      // Fetch all stats in parallel
      const [
        customersCount,
        ordersCount,
        openOrdersCount,
        closedOrdersCount,
        monthlyRevenue,
        outstandingPayments,
        appointmentsCount,
        upcomingAppointmentsData,
        instructorsCount,
        staffCount,
        agenciesCount,
        hotelsCount,
        recentOrdersData,
        recentTransactionsData
      ] = await Promise.all([
        // Total customers
        sql`SELECT COUNT(*) as count FROM customers`,
        
        // Total orders
        sql`SELECT COUNT(*) as count FROM orders`,
        
        // Open orders
        sql`SELECT COUNT(*) as count FROM orders WHERE status = 'open'`,
        
        // Closed orders
        sql`SELECT COUNT(*) as count FROM orders WHERE status = 'closed'`,
        
        // Monthly revenue (from order_payments)
        sql`
          SELECT COALESCE(SUM(amount), 0) as total
          FROM order_payments
          WHERE occurred_at >= ${startOfMonth.toISOString()}
        `,
        
        // Outstanding payments (orders with balance_due > 0)
        sql`
          SELECT COALESCE(SUM(balance_due), 0) as total
          FROM orders
          WHERE status = 'open' AND balance_due > 0
        `,
        
        // Total appointments
        sql`SELECT COUNT(*) as count FROM scheduled_appointments`,
        
        // Upcoming appointments (next 7 days)
        sql`
          SELECT 
            sa.id,
            sa.scheduled_start,
            sa.scheduled_end,
            sa.status,
            c.fullname as customer_name,
            s.name as service_name,
            i.fullname as instructor_name
          FROM scheduled_appointments sa
          JOIN customers c ON sa.customer_id = c.id
          JOIN services s ON sa.service_id = s.id
          LEFT JOIN instructors i ON sa.instructor_id = i.id
          WHERE sa.scheduled_start >= ${startOfToday.toISOString()}
            AND sa.scheduled_start <= ${next7Days.toISOString()}
            AND sa.status IN ('scheduled', 'in_progress')
            AND sa.cancelled_at IS NULL
          ORDER BY sa.scheduled_start ASC
          LIMIT 10
        `,
        
        // Total instructors
        sql`SELECT COUNT(*) as count FROM instructors`,
        
        // Total staff
        sql`SELECT COUNT(*) as count FROM staff`,
        
        // Total agencies
        sql`SELECT COUNT(*) as count FROM agencies`,
        
        // Total hotels
        sql`SELECT COUNT(*) as count FROM hotels`,
        
        // Recent orders (last 10)
        sql`
          SELECT 
            o.id,
            o.order_number,
            o.status,
            o.total_amount,
            o.currency,
            o.created_at,
            c.fullname as customer_name
          FROM orders o
          JOIN customers c ON o.customer_id = c.id
          ORDER BY o.created_at DESC
          LIMIT 10
        `,
        
        // Recent transactions (last 10)
        sql`
          SELECT 
            t.id,
            t.occurred_at,
            t.amount,
            t.currency,
            tt.label as type_label,
            tt.direction,
            pm.name as payment_method,
            t.reference
          FROM transactions t
          JOIN transaction_types tt ON t.type_id = tt.id
          LEFT JOIN payment_methods pm ON t.payment_method_id = pm.id
          ORDER BY t.occurred_at DESC
          LIMIT 10
        `
      ])

      setStats({
        totalCustomers: parseInt(customersCount[0]?.count || 0),
        totalOrders: parseInt(ordersCount[0]?.count || 0),
        openOrders: parseInt(openOrdersCount[0]?.count || 0),
        closedOrders: parseInt(closedOrdersCount[0]?.count || 0),
        totalRevenue: 0, // Could calculate from all transactions
        monthlyRevenue: parseFloat(monthlyRevenue[0]?.total || 0),
        outstandingPayments: parseFloat(outstandingPayments[0]?.total || 0),
        totalAppointments: parseInt(appointmentsCount[0]?.count || 0),
        upcomingAppointments: upcomingAppointmentsData.length,
        totalInstructors: parseInt(instructorsCount[0]?.count || 0),
        totalStaff: parseInt(staffCount[0]?.count || 0),
        totalAgencies: parseInt(agenciesCount[0]?.count || 0),
        totalHotels: parseInt(hotelsCount[0]?.count || 0)
      })

      setRecentOrders(recentOrdersData)
      setRecentTransactions(recentTransactionsData)
      setUpcomingAppointments(upcomingAppointmentsData)
    } catch (err) {
      console.error('Dashboard data fetch error:', err)
      setError(t('dashboard.error.load', 'Unable to load dashboard data. Please try again later.'))
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <PageHeader
          title={t('dashboard.title', 'Dashboard')}
          description={t('dashboard.description', 'Overview of your business metrics and recent activity')}
        />
        <div className="flex items-center justify-center py-12">
          <div className="text-gray-600">{t('common.loading', 'Loading...')}</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-6">
        <PageHeader
          title={t('dashboard.title', 'Dashboard')}
          description={t('dashboard.description', 'Overview of your business metrics and recent activity')}
        />
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
          {error}
        </div>
      </div>
    )
  }

  const statCards = [
    {
      title: t('dashboard.stats.customers', 'Total Customers'),
      value: stats.totalCustomers,
      icon: '👥',
      color: 'blue',
      onClick: () => onNavigate('customers')
    },
    {
      title: t('dashboard.stats.orders', 'Total Orders'),
      value: stats.totalOrders,
      icon: '📦',
      color: 'indigo',
      subtitle: `${stats.openOrders} ${t('dashboard.stats.open', 'open')}`,
      onClick: () => onNavigate('orders')
    },
    {
      title: t('dashboard.stats.revenue', 'Monthly Revenue'),
      value: formatCurrency(stats.monthlyRevenue),
      icon: '💰',
      color: 'green',
      onClick: () => onNavigate('transactions')
    },
    {
      title: t('dashboard.stats.outstanding', 'Outstanding Payments'),
      value: formatCurrency(stats.outstandingPayments),
      icon: '⚠️',
      color: stats.outstandingPayments > 0 ? 'red' : 'gray',
      onClick: () => onNavigate('orders')
    },
    {
      title: t('dashboard.stats.appointments', 'Upcoming Appointments'),
      value: stats.upcomingAppointments,
      icon: '📅',
      color: 'purple',
      subtitle: t('dashboard.stats.next7Days', 'next 7 days'),
      onClick: () => onNavigate('appointments')
    },
    {
      title: t('dashboard.stats.instructors', 'Instructors'),
      value: stats.totalInstructors,
      icon: '🏄',
      color: 'teal',
      onClick: () => onNavigate('instructors')
    }
  ]

  const colorClasses = {
    blue: 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100',
    indigo: 'bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100',
    green: 'bg-green-50 border-green-200 text-green-700 hover:bg-green-100',
    red: 'bg-red-50 border-red-200 text-red-700 hover:bg-red-100',
    purple: 'bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100',
    teal: 'bg-teal-50 border-teal-200 text-teal-700 hover:bg-teal-100',
    gray: 'bg-gray-50 border-gray-200 text-gray-700 hover:bg-gray-100'
  }

  return (
    <div className="p-4 md:p-6">
      <PageHeader
        title={t('dashboard.title', 'Dashboard')}
        description={t('dashboard.description', 'Overview of your business metrics and recent activity')}
      />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {statCards.map((card, index) => (
          <button
            key={index}
            onClick={card.onClick}
            className={`${colorClasses[card.color]} border-2 rounded-lg p-6 text-left transition-all cursor-pointer transform hover:scale-105 shadow-sm`}
          >
            <div className="flex items-start justify-between mb-2">
              <div className="text-3xl">{card.icon}</div>
              <div className="text-right">
                <div className="text-2xl font-bold">{card.value}</div>
                {card.subtitle && (
                  <div className="text-sm opacity-75 mt-1">{card.subtitle}</div>
                )}
              </div>
            </div>
            <div className="text-sm font-medium opacity-90">{card.title}</div>
          </button>
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              {t('dashboard.recentOrders.title', 'Recent Orders')}
            </h2>
            <button
              onClick={() => onNavigate('orders')}
              className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
            >
              {t('dashboard.recentOrders.viewAll', 'View all')}
            </button>
          </div>
          {recentOrders.length === 0 ? (
            <div className="text-gray-500 text-center py-8">
              {t('dashboard.recentOrders.empty', 'No recent orders')}
            </div>
          ) : (
            <div className="space-y-3">
              {recentOrders.map((order) => (
                <div
                  key={order.id}
                  onClick={() => onViewOrder && onViewOrder({ id: order.id })}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 cursor-pointer border border-gray-100"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-gray-900">{order.order_number}</span>
                      <span className={`px-2 py-0.5 text-xs rounded-full ${
                        order.status === 'open' 
                          ? 'bg-yellow-100 text-yellow-800'
                          : order.status === 'closed'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {order.status}
                      </span>
                    </div>
                    <div className="text-sm text-gray-600 mt-1">{order.customer_name}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      {formatDate(new Date(order.created_at))}
                    </div>
                  </div>
                  <div className="text-right ml-4">
                    <div className="font-semibold text-gray-900">
                      {formatCurrency(order.total_amount, order.currency)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Transactions */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              {t('dashboard.recentTransactions.title', 'Recent Transactions')}
            </h2>
            <button
              onClick={() => onNavigate('transactions')}
              className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
            >
              {t('dashboard.recentTransactions.viewAll', 'View all')}
            </button>
          </div>
          {recentTransactions.length === 0 ? (
            <div className="text-gray-500 text-center py-8">
              {t('dashboard.recentTransactions.empty', 'No recent transactions')}
            </div>
          ) : (
            <div className="space-y-3">
              {recentTransactions.map((transaction) => (
                <div
                  key={transaction.id}
                  onClick={() => onViewTransaction && onViewTransaction({ id: transaction.id })}
                  className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50 cursor-pointer border border-gray-100"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`text-lg ${
                        transaction.direction === 'income' 
                          ? 'text-green-600'
                          : transaction.direction === 'expense'
                          ? 'text-red-600'
                          : 'text-gray-600'
                      }`}>
                        {transaction.direction === 'income' ? '↑' : transaction.direction === 'expense' ? '↓' : '↔'}
                      </span>
                      <span className="font-medium text-gray-900">{transaction.type_label}</span>
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      {transaction.payment_method || t('dashboard.recentTransactions.noMethod', 'No method')}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      {formatDate(new Date(transaction.occurred_at))}
                    </div>
                  </div>
                  <div className="text-right ml-4">
                    <div className={`font-semibold ${
                      transaction.direction === 'income' 
                        ? 'text-green-600'
                        : transaction.direction === 'expense'
                        ? 'text-red-600'
                        : 'text-gray-900'
                    }`}>
                      {transaction.direction === 'expense' ? '-' : transaction.direction === 'income' ? '+' : ''}
                      {formatCurrency(Math.abs(transaction.amount), transaction.currency)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upcoming Appointments */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              {t('dashboard.upcomingAppointments.title', 'Upcoming Appointments')}
            </h2>
            <button
              onClick={() => onNavigate('appointments')}
              className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
            >
              {t('dashboard.upcomingAppointments.viewAll', 'View all')}
            </button>
          </div>
          {upcomingAppointments.length === 0 ? (
            <div className="text-gray-500 text-center py-8">
              {t('dashboard.upcomingAppointments.empty', 'No upcoming appointments')}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {upcomingAppointments.map((appointment) => {
                const startDate = new Date(appointment.scheduled_start)
                const endDate = new Date(appointment.scheduled_end)
                const duration = Math.round((endDate - startDate) / (1000 * 60)) // minutes
                
                return (
                  <div
                    key={appointment.id}
                    onClick={() => onViewAppointment && onViewAppointment({ id: appointment.id })}
                    className="p-4 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <div className="font-medium text-gray-900">{appointment.customer_name}</div>
                        <div className="text-sm text-gray-600 mt-1">{appointment.service_name}</div>
                      </div>
                      <span className={`px-2 py-1 text-xs rounded-full ${
                        appointment.status === 'scheduled'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {appointment.status}
                      </span>
                    </div>
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span>{formatDate(startDate)}</span>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>
                          {startDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - 
                          {endDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} 
                          ({duration} {t('dashboard.upcomingAppointments.minutes', 'min')})
                        </span>
                      </div>
                      {appointment.instructor_name && (
                        <div className="flex items-center gap-2 text-sm text-gray-600 mt-1">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                          </svg>
                          <span>{appointment.instructor_name}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="mt-6 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          {t('dashboard.quickActions.title', 'Quick Actions')}
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          <button
            onClick={() => onNavigate('customers')}
            className="p-4 rounded-lg border-2 border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 transition-colors text-center"
          >
            <div className="text-2xl mb-2">👥</div>
            <div className="text-sm font-medium text-gray-700">{t('dashboard.quickActions.viewCustomers', 'View Customers')}</div>
          </button>
          <button
            onClick={() => onNavigate('orders')}
            className="p-4 rounded-lg border-2 border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 transition-colors text-center"
          >
            <div className="text-2xl mb-2">📦</div>
            <div className="text-sm font-medium text-gray-700">{t('dashboard.quickActions.viewOrders', 'View Orders')}</div>
          </button>
          <button
            onClick={() => onNavigate('appointments')}
            className="p-4 rounded-lg border-2 border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 transition-colors text-center"
          >
            <div className="text-2xl mb-2">📅</div>
            <div className="text-sm font-medium text-gray-700">{t('dashboard.quickActions.viewAppointments', 'View Appointments')}</div>
          </button>
          <button
            onClick={() => onNavigate('transactions')}
            className="p-4 rounded-lg border-2 border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 transition-colors text-center"
          >
            <div className="text-2xl mb-2">💰</div>
            <div className="text-sm font-medium text-gray-700">{t('dashboard.quickActions.viewTransactions', 'View Transactions')}</div>
          </button>
          <button
            onClick={() => onNavigate('services')}
            className="p-4 rounded-lg border-2 border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 transition-colors text-center"
          >
            <div className="text-2xl mb-2">🏄</div>
            <div className="text-sm font-medium text-gray-700">{t('dashboard.quickActions.viewServices', 'View Services')}</div>
          </button>
          <button
            onClick={() => onNavigate('products')}
            className="p-4 rounded-lg border-2 border-gray-200 hover:border-indigo-300 hover:bg-indigo-50 transition-colors text-center"
          >
            <div className="text-2xl mb-2">🛍️</div>
            <div className="text-sm font-medium text-gray-700">{t('dashboard.quickActions.viewProducts', 'View Products')}</div>
          </button>
        </div>
      </div>
    </div>
  )
}

export default Dashboard

