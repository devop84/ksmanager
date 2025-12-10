import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import sql from '../../lib/neon'
import { canModify } from '../../lib/permissions'
import { useSettings } from '../../context/SettingsContext'
import DetailInfoPanel from '../../components/ui/DetailInfoPanel'

function CustomerDetail2({ 
  customerId, 
  onEdit, 
  onDelete, 
  onBack, 
  onViewAppointment = () => {}, 
  onViewOrder = () => {}, 
  onAddAppointment = () => {}, 
  onAddOrder = () => {},
  onAddPayment = () => {},
  user = null 
}) {
  const { t } = useTranslation()
  const { formatCurrency, formatDate, formatDateTime, formatTime } = useSettings()
  const [customer, setCustomer] = useState(null)
  const [appointments, setAppointments] = useState([])
  const [orders, setOrders] = useState([])
  const [openOrder, setOpenOrder] = useState(null)
  const [openOrderItems, setOpenOrderItems] = useState([])
  const [openOrderPayments, setOpenOrderPayments] = useState([])
  const [openOrderRefunds, setOpenOrderRefunds] = useState([])
  const [allPayments, setAllPayments] = useState([])
  const [allTransactions, setAllTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingAppointments, setLoadingAppointments] = useState(true)
  const [loadingOrders, setLoadingOrders] = useState(true)
  const [loadingOpenOrder, setLoadingOpenOrder] = useState(false)
  const [error, setError] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [closingOrder, setClosingOrder] = useState(false)
  const [appointmentView, setAppointmentView] = useState('list') // 'list' or 'calendar'
  const [calendarDate, setCalendarDate] = useState(new Date())

  // Load customer data
  useEffect(() => {
    const fetchCustomer = async () => {
      try {
        setLoading(true)
        setError(null)
        const result = await sql`
          SELECT 
            c.id,
            c.fullname,
            c.phone,
            c.email,
            c.doctype,
            c.doc,
            c.country,
            c.birthdate,
            c.note,
            c.created_at,
            c.updated_at,
            c.hotel_id,
            c.agency_id,
            h.name AS hotel_name,
            a.name AS agency_name
          FROM customers c
          LEFT JOIN hotels h ON c.hotel_id = h.id
          LEFT JOIN agencies a ON c.agency_id = a.id
          WHERE c.id = ${customerId}
          LIMIT 1
        `
        
        if (result && result.length > 0) {
          setCustomer(result[0])
        } else {
          setError(t('customerDetail.notFound'))
        }
      } catch (err) {
        console.error('Failed to load customer:', err)
        setError(t('customerDetail.error.load'))
      } finally {
        setLoading(false)
      }
    }

    if (customerId) {
      fetchCustomer()
    }
  }, [customerId, t])

  // Load customer appointments
  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        setLoadingAppointments(true)
        const result = await sql`
          SELECT 
            sa.id,
            sa.customer_id,
            sa.service_id,
            sa.service_package_id,
            sa.credit_id,
            sa.order_id,
            sa.scheduled_start,
            sa.scheduled_end,
            sa.duration_hours,
            sa.duration_days,
            sa.duration_months,
            sa.status,
            sa.instructor_id,
            sa.attendee_name,
            sa.note,
            sa.created_at,
            sa.completed_at,
            sa.cancelled_at,
            s.name AS service_name,
            sp.name AS service_package_name,
            i.fullname AS instructor_name,
            o.order_number,
            o.status AS order_status
          FROM scheduled_appointments sa
          LEFT JOIN services s ON sa.service_id = s.id
          LEFT JOIN service_packages sp ON sa.service_package_id = sp.id
          LEFT JOIN instructors i ON sa.instructor_id = i.id
          LEFT JOIN orders o ON sa.order_id = o.id
          WHERE sa.customer_id = ${customerId}
          ORDER BY sa.scheduled_start DESC
        `
        setAppointments(result || [])
      } catch (err) {
        console.error('Failed to load customer appointments:', err)
        setAppointments([])
      } finally {
        setLoadingAppointments(false)
      }
    }

    if (customerId) {
      fetchAppointments()
    }
  }, [customerId])

  // Load customer orders
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoadingOrders(true)
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
            COUNT(oi.id) AS item_count
          FROM orders o
          LEFT JOIN order_items oi ON o.id = oi.order_id
          WHERE o.customer_id = ${customerId}
          GROUP BY o.id, o.order_number, o.status, o.total_amount, o.total_paid, o.balance_due, o.currency, o.created_at, o.closed_at, o.cancelled_at
          ORDER BY o.created_at DESC
        `
        setOrders(result || [])
      } catch (err) {
        console.error('Failed to load customer orders:', err)
        setOrders([])
      } finally {
        setLoadingOrders(false)
      }
    }

    if (customerId) {
      fetchOrders()
    }
  }, [customerId])

  // Load open order details
  useEffect(() => {
    const fetchOpenOrder = async () => {
      if (!customerId) {
        setOpenOrder(null)
        setOpenOrderItems([])
        setOpenOrderPayments([])
        setOpenOrderRefunds([])
        return
      }

      try {
        setLoadingOpenOrder(true)
        
        // Find open order
        const openOrderResult = await sql`
          SELECT 
            o.id,
            o.order_number,
            o.status,
            o.subtotal,
            o.tax_amount,
            o.discount_amount,
            o.total_amount,
            o.total_paid,
            o.balance_due,
            o.currency,
            o.created_at
          FROM orders o
          WHERE o.customer_id = ${customerId}
            AND o.status = 'open'
          LIMIT 1
        `

        if (!openOrderResult || openOrderResult.length === 0) {
          setOpenOrder(null)
          setOpenOrderItems([])
          setOpenOrderPayments([])
          setOpenOrderRefunds([])
          return
        }

        const order = openOrderResult[0]
        setOpenOrder(order)

        // Fetch order items
        const itemsResult = await sql`
          SELECT 
            oi.id,
            oi.item_type,
            oi.item_id,
            oi.item_name,
            oi.quantity,
            oi.unit_price,
            oi.subtotal,
            CASE 
              WHEN oi.item_type = 'service_package' THEN s.name
              WHEN oi.item_type = 'service' THEN s2.name
              ELSE NULL
            END AS service_name,
            sp.name AS service_package_name
          FROM order_items oi
          LEFT JOIN service_packages sp ON oi.item_type = 'service_package' AND oi.item_id = sp.id
          LEFT JOIN services s ON (oi.item_type = 'service_package' AND sp.service_id = s.id) OR (oi.item_type = 'service' AND oi.item_id = s.id)
          LEFT JOIN services s2 ON oi.item_type = 'service' AND oi.item_id = s2.id
          WHERE oi.order_id = ${order.id}
          ORDER BY oi.created_at ASC
        `
        setOpenOrderItems(itemsResult || [])

        // Fetch payments
        const paymentsResult = await sql`
          SELECT 
            op.id,
            op.amount,
            op.currency,
            op.payment_method_id,
            op.occurred_at,
            op.note,
            pm.name AS payment_method_name,
            ca.name AS company_account_name
          FROM order_payments op
          LEFT JOIN payment_methods pm ON op.payment_method_id = pm.id
          LEFT JOIN company_accounts ca ON op.company_account_id = ca.id
          WHERE op.order_id = ${order.id}
          ORDER BY op.occurred_at DESC
        `
        setOpenOrderPayments(paymentsResult || [])

        // Fetch refunds
        const refundsResult = await sql`
          SELECT 
            orf.id,
            orf.amount,
            orf.currency,
            orf.payment_method_id,
            orf.occurred_at,
            orf.note,
            pm.name AS payment_method_name,
            ca.name AS company_account_name
          FROM order_refunds orf
          LEFT JOIN payment_methods pm ON orf.payment_method_id = pm.id
          LEFT JOIN company_accounts ca ON orf.company_account_id = ca.id
          WHERE orf.order_id = ${order.id}
          ORDER BY orf.occurred_at DESC
        `
        setOpenOrderRefunds(refundsResult || [])
      } catch (err) {
        console.error('Failed to load open order:', err)
        setOpenOrder(null)
        setOpenOrderItems([])
        setOpenOrderPayments([])
        setOpenOrderRefunds([])
      } finally {
        setLoadingOpenOrder(false)
      }
    }

    fetchOpenOrder()
  }, [customerId])

  // Load all payments history
  useEffect(() => {
    const fetchAllPayments = async () => {
      if (!customerId) return
      
      try {
        const result = await sql`
          SELECT 
            op.id,
            op.amount,
            op.currency,
            op.payment_method_id,
            op.occurred_at,
            op.note,
            op.order_id,
            pm.name AS payment_method_name,
            ca.name AS company_account_name,
            o.order_number
          FROM order_payments op
          LEFT JOIN payment_methods pm ON op.payment_method_id = pm.id
          LEFT JOIN company_accounts ca ON op.company_account_id = ca.id
          LEFT JOIN orders o ON op.order_id = o.id
          WHERE o.customer_id = ${customerId}
          ORDER BY op.occurred_at DESC
          LIMIT 50
        `
        setAllPayments(result || [])
      } catch (err) {
        console.error('Failed to load payment history:', err)
        setAllPayments([])
      }
    }

    fetchAllPayments()
  }, [customerId])

  // Load transactions history
  useEffect(() => {
    const fetchTransactions = async () => {
      if (!customerId) return
      
      try {
        const result = await sql`
          SELECT 
            t.id,
            t.transaction_type,
            t.amount,
            t.currency,
            t.occurred_at,
            t.note,
            t.order_id,
            pm.name AS payment_method_name,
            ca.name AS company_account_name,
            o.order_number
          FROM transactions t
          LEFT JOIN payment_methods pm ON t.payment_method_id = pm.id
          LEFT JOIN company_accounts ca ON t.company_account_id = ca.id
          LEFT JOIN orders o ON t.order_id = o.id
          WHERE o.customer_id = ${customerId}
          ORDER BY t.occurred_at DESC
          LIMIT 50
        `
        setAllTransactions(result || [])
      } catch (err) {
        console.error('Failed to load transactions:', err)
        setAllTransactions([])
      }
    }

    fetchTransactions()
  }, [customerId])

  const handleDelete = async () => {
    if (!window.confirm(t('customerDetail.confirm.delete'))) {
      return
    }

    try {
      setDeleting(true)
      await sql`DELETE FROM customers WHERE id = ${customerId}`
      onDelete?.()
    } catch (err) {
      console.error('Failed to delete customer:', err)
      alert(t('customerDetail.error.delete'))
    } finally {
      setDeleting(false)
    }
  }

  const handleCloseOrder = async () => {
    if (!openOrder) return
    
    // Calculate balance including refunds
    const totalRefunded = openOrderRefunds.reduce((sum, r) => sum + Number(r.amount || 0), 0)
    const calculatedBalance = Number(openOrder.total_amount || 0) - Number(openOrder.total_paid || 0) + totalRefunded
    
    if (Math.abs(calculatedBalance) > 0.01) {
      alert(t('orderDetail.error.cannotCloseWithBalance', 'Cannot close order. The balance due must be zero. Current balance: {{balance}}', { balance: formatCurrency(calculatedBalance) }))
      return
    }
    
    if (!window.confirm(t('orderDetail.confirm.close', 'Are you sure you want to close this order? This action cannot be undone.'))) {
      return
    }
    
    try {
      setClosingOrder(true)
      await sql`
        UPDATE orders 
        SET status = 'closed', closed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
        WHERE id = ${openOrder.id}
      `
      
      // Reload orders and open order
      const ordersResult = await sql`
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
          COUNT(oi.id) AS item_count
        FROM orders o
        LEFT JOIN order_items oi ON o.id = oi.order_id
        WHERE o.customer_id = ${customerId}
        GROUP BY o.id, o.order_number, o.status, o.total_amount, o.total_paid, o.balance_due, o.currency, o.created_at, o.closed_at, o.cancelled_at
        ORDER BY o.created_at DESC
      `
      setOrders(ordersResult || [])
      setOpenOrder(null)
      setOpenOrderItems([])
      setOpenOrderPayments([])
      setOpenOrderRefunds([])
    } catch (err) {
      console.error('Failed to close order:', err)
      alert(t('orderDetail.error.close', 'Unable to close order. Please try again.'))
    } finally {
      setClosingOrder(false)
    }
  }

  if (loading) {
    return (
      <div className="px-4 py-6 sm:p-6 lg:p-8">
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <div className="text-gray-600">{t('customerDetail.loading')}</div>
        </div>
      </div>
    )
  }

  if (error || !customer) {
    return (
      <div className="px-4 py-6 sm:p-6 lg:p-8">
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <div className="text-red-600">{error || t('customerDetail.notFound')}</div>
          {onBack && (
            <button
              onClick={onBack}
              className="mt-4 rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
            >
              {t('customerDetail.back')}
            </button>
          )}
        </div>
      </div>
    )
  }

  // Calculate statistics
  const now = new Date()
  const upcomingAppointments = appointments.filter(apt => {
    if (!apt.scheduled_start || apt.cancelled_at) return false
    const startTime = new Date(apt.scheduled_start)
    return startTime >= now && (apt.status === 'scheduled' || apt.status === 'rescheduled')
  })
  
  const pastAppointments = appointments.filter(apt => {
    if (!apt.scheduled_start || apt.cancelled_at) return false
    const startTime = new Date(apt.scheduled_start)
    return startTime < now || apt.status === 'completed'
  })

  const totalSpent = orders
    .filter(o => o.status === 'closed')
    .reduce((sum, o) => sum + Number(o.total_amount || 0), 0)
  
  const totalPaid = orders
    .filter(o => o.status === 'closed')
    .reduce((sum, o) => sum + Number(o.total_paid || 0), 0)

  const paymentDue = openOrder ? (() => {
    const totalRefunded = openOrderRefunds.reduce((sum, r) => sum + Number(r.amount || 0), 0)
    return Number(openOrder.total_amount || 0) - Number(openOrder.total_paid || 0) + totalRefunded
  })() : 0

  const canCloseOrder = openOrder && Math.abs(paymentDue) <= 0.01

  // Helper function to format duration
  // Calendar helper functions
  const getMonthDays = (date) => {
    const year = date.getFullYear()
    const month = date.getMonth()
    
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()
    
    const days = []
    
    // Add empty cells for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null)
    }
    
    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day))
    }
    
    return days
  }

  const getAppointmentsForDate = (date) => {
    if (!date) return []
    const dateStr = date.toDateString()
    return appointments.filter(apt => {
      if (!apt.scheduled_start) return false
      const aptDate = new Date(apt.scheduled_start)
      return aptDate.toDateString() === dateStr
    })
  }

  const navigateCalendarMonth = (direction) => {
    setCalendarDate(prev => {
      const newDate = new Date(prev)
      newDate.setMonth(prev.getMonth() + direction)
      return newDate
    })
  }

  const formatDuration = (appointment) => {
    if (appointment.duration_hours) {
      return `${Number(appointment.duration_hours).toFixed(2)} ${t('customerDetail2.appointments.hours', 'hours')}`
    } else if (appointment.duration_days) {
      return `${Number(appointment.duration_days).toFixed(2)} ${t('customerDetail2.appointments.days', 'days')}`
    } else if (appointment.duration_months) {
      return `${appointment.duration_months} ${t('customerDetail2.appointments.months', 'months')}`
    }
    return null
  }

  return (
    <div className="px-3 py-4 sm:px-4 sm:py-6 lg:px-6 lg:py-8">
      <div className="rounded-xl bg-white shadow-sm">
        {/* Header */}
        <div className="p-4 sm:p-6">
          <button
            onClick={onBack}
            className="mb-4 sm:mb-6 flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            {t('customerDetail.back')}
          </button>
          
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2 break-words">
                {customer.fullname || t('customers.title')}
              </h1>
              <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                {customer.email && (
                  <span className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    {customer.email}
                  </span>
                )}
                {customer.phone && (
                  <span className="flex items-center gap-1">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    {customer.phone}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="p-4 sm:p-6">
          <div className="flex flex-col lg:flex-row lg:items-start gap-6">
            {/* Left Column - Main Content */}
            <div className="flex-1 space-y-6 min-w-0">
              {/* Open Order Section */}
              <div className="rounded-xl border border-gray-200 bg-white p-4 sm:p-6 shadow-sm">
                {openOrder ? (
                  <>
                    <div className="flex items-center justify-between mb-4">
                      <h2 className="text-lg font-semibold text-gray-900">
                        {t('customerDetail2.openOrder.title', 'Current Bill')}: {openOrder.order_number || `#${openOrder.id}`}
                      </h2>
                      <button
                        onClick={() => onViewOrder?.(openOrder)}
                        className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-blue-600 text-white shadow-sm hover:bg-blue-500 transition-colors"
                        title={t('customerDetail2.openOrder.viewDetails', 'View Details')}
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      </button>
                    </div>

                    {loadingOpenOrder ? (
                      <div className="text-gray-600 text-sm">{t('customerDetail2.openOrder.loading', 'Loading...')}</div>
                    ) : (
                      <div className="space-y-4">
                        {/* Order Summary */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          <div>
                            <div className="text-xs font-medium text-gray-500 uppercase mb-1">
                              {t('customerDetail2.openOrder.total', 'Total')}
                            </div>
                            <div className="text-lg font-semibold text-gray-900">
                              {formatCurrency(Number(openOrder.total_amount || 0))}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs font-medium text-gray-500 uppercase mb-1">
                              {t('customerDetail2.openOrder.paid', 'Paid')}
                            </div>
                            <div className="text-lg font-semibold text-emerald-600">
                              {formatCurrency(Number(openOrder.total_paid || 0))}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs font-medium text-gray-500 uppercase mb-1">
                              {t('customerDetail2.openOrder.balance', 'Balance')}
                            </div>
                            <div className={`text-lg font-semibold ${paymentDue > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                              {formatCurrency(paymentDue)}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs font-medium text-gray-500 uppercase mb-1">
                              {t('customerDetail2.openOrder.items', 'Items')}
                            </div>
                            <div className="text-lg font-semibold text-gray-900">
                              {openOrderItems.length}
                            </div>
                          </div>
                        </div>

                        {/* Recent Payments */}
                        {openOrderPayments.length > 0 && (
                          <div>
                            <h3 className="text-sm font-semibold text-gray-700 mb-2">
                              {t('customerDetail2.openOrder.recentPayments', 'Recent Payments')}
                            </h3>
                            <div className="space-y-2">
                              {openOrderPayments.slice(0, 3).map((payment) => (
                                <div key={payment.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                                  <div className="text-sm">
                                    <span className="font-medium">{formatDateTime(payment.occurred_at)}</span>
                                    <span className="text-gray-500 ml-2">{payment.payment_method_name || '—'}</span>
                                  </div>
                                  <div className="text-sm font-semibold text-emerald-700">
                                    {formatCurrency(Number(payment.amount || 0))}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </>
                ) : (
                  <>
                    <h2 className="text-lg font-semibold text-gray-900 mb-4">
                      {t('customerDetail2.openOrder.title', 'Current Bill')}
                    </h2>
                    <div className="flex flex-col items-center justify-center py-8 text-center">
                      <p className="text-gray-500 text-sm mb-4">
                        {t('customerDetail2.openOrder.noOrder', 'No open order found')}
                      </p>
                      {canModify(user) && (
                        <button
                          onClick={() => onAddOrder?.(customer)}
                          className="inline-flex items-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-purple-500 transition-colors"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                          {t('customerDetail2.actions.addOrder', 'Add New Order')}
                        </button>
                      )}
                    </div>
                  </>
                )}
              </div>

              {/* Appointments Section */}
              <div className="rounded-xl border border-gray-200 bg-white p-4 sm:p-6 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">
                    {t('customerDetail2.appointments.title', 'Appointments')}
                  </h2>
                  <div className="flex items-center gap-2">
                    {/* View Toggle */}
                    <div className="inline-flex rounded-lg border border-gray-300 bg-white p-1">
                      <button
                        onClick={() => setAppointmentView('list')}
                        className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                          appointmentView === 'list'
                            ? 'bg-blue-600 text-white'
                            : 'text-gray-700 hover:bg-gray-50'
                        }`}
                        title={t('customerDetail2.appointments.viewList', 'List View')}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                      </button>
                      <button
                        onClick={() => setAppointmentView('calendar')}
                        className={`px-3 py-1.5 text-xs font-medium rounded transition-colors ${
                          appointmentView === 'calendar'
                            ? 'bg-blue-600 text-white'
                            : 'text-gray-700 hover:bg-gray-50'
                        }`}
                        title={t('customerDetail2.appointments.viewCalendar', 'Calendar View')}
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </button>
                    </div>
                    {canModify(user) && (
                      <button
                        onClick={() => onAddAppointment?.(customer)}
                        disabled={!openOrder}
                        className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-blue-600 text-white shadow-sm hover:bg-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                        title={!openOrder ? t('customerDetail2.actions.noOpenOrder', 'Customer must have an open order to create an appointment') : t('customerDetail2.actions.addAppointment', 'Add Appointment')}
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                      </button>
                    )}
                  </div>
                </div>
                
                {loadingAppointments ? (
                  <div className="text-gray-600 text-sm">{t('customerDetail2.appointments.loading', 'Loading...')}</div>
                ) : appointments.length === 0 ? (
                  <p className="text-gray-500 text-sm">{t('customerDetail2.appointments.empty', 'No appointments found.')}</p>
                ) : appointmentView === 'calendar' ? (
                  <div className="space-y-4">
                    {/* Calendar Navigation */}
                    <div className="flex items-center justify-between">
                      <button
                        onClick={() => navigateCalendarMonth(-1)}
                        className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50"
                        aria-label={t('customerDetail2.appointments.prevMonth', 'Previous month')}
                      >
                        <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                        </svg>
                      </button>
                      <h3 className="text-base font-semibold text-gray-900">
                        {calendarDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                      </h3>
                      <button
                        onClick={() => navigateCalendarMonth(1)}
                        className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50"
                        aria-label={t('customerDetail2.appointments.nextMonth', 'Next month')}
                      >
                        <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </button>
                    </div>

                    {/* Calendar Month View */}
                    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                      {/* Week day headers */}
                      <div className="grid grid-cols-7 border-b border-gray-200">
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                          <div
                            key={day}
                            className="p-2 text-center text-xs font-semibold text-gray-700 bg-gray-50 border-r border-gray-200 last:border-r-0"
                          >
                            {t(`calendar.weekday.${day.toLowerCase()}`, day)}
                          </div>
                        ))}
                      </div>

                      {/* Calendar grid */}
                      <div className="grid grid-cols-7">
                        {getMonthDays(calendarDate).map((date, dayIndex) => {
                          const isToday = date && 
                                         date.toDateString() === new Date().toDateString() &&
                                         date.getMonth() === new Date().getMonth()
                          const isOtherMonth = !date || date.getMonth() !== calendarDate.getMonth()
                          const dayAppointments = getAppointmentsForDate(date)
                          const statusColors = {
                            scheduled: 'bg-blue-100 text-blue-800 border-blue-200',
                            in_progress: 'bg-indigo-100 text-indigo-800 border-indigo-200',
                            completed: 'bg-emerald-100 text-emerald-800 border-emerald-200',
                            cancelled: 'bg-rose-100 text-rose-800 border-rose-200',
                            no_show: 'bg-amber-100 text-amber-800 border-amber-200',
                            rescheduled: 'bg-purple-100 text-purple-800 border-purple-200'
                          }

                          return (
                            <div
                              key={dayIndex}
                              className={`min-h-[100px] border-r border-b border-gray-200 p-1.5 ${
                                isOtherMonth ? 'bg-gray-50' : 'bg-white'
                              } ${isToday ? 'bg-blue-50' : ''}`}
                            >
                              {date && (
                                <>
                                  {/* Day number */}
                                  <div className={`text-xs font-medium mb-1 ${
                                    isToday ? 'text-blue-600 font-bold' : 
                                    isOtherMonth ? 'text-gray-400' : 'text-gray-900'
                                  }`}>
                                    {date.getDate()}
                                  </div>
                                  
                                  {/* Appointments for this day */}
                                  <div className="space-y-1">
                                    {dayAppointments.slice(0, 3).map((apt) => (
                                      <div
                                        key={apt.id}
                                        onClick={(e) => {
                                          e.stopPropagation()
                                          onViewAppointment?.(apt)
                                        }}
                                        className={`text-xs px-1.5 py-0.5 rounded border font-medium cursor-pointer hover:opacity-80 transition-opacity ${
                                          statusColors[apt.status] || statusColors.scheduled
                                        }`}
                                        title={`${apt.service_name || '—'} - ${apt.scheduled_start ? formatTime(apt.scheduled_start) : '—'}`}
                                      >
                                        <div className="truncate">{formatTime(apt.scheduled_start)}</div>
                                        <div className="truncate font-semibold">{apt.service_name || '—'}</div>
                                      </div>
                                    ))}
                                    {dayAppointments.length > 3 && (
                                      <div className="text-xs text-gray-500 px-1.5">
                                        +{dayAppointments.length - 3} {t('customerDetail2.appointments.more', 'more')}
                                      </div>
                                    )}
                                  </div>
                                </>
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Upcoming Appointments */}
                    {upcomingAppointments.length > 0 && (
                      <div>
                        <h3 className="text-sm font-semibold text-gray-700 mb-3">
                          {t('customerDetail2.appointments.upcoming', 'Upcoming')} ({upcomingAppointments.length})
                        </h3>
                        <div className="space-y-2">
                          {upcomingAppointments.map((apt) => (
                            <div
                              key={apt.id}
                              onClick={() => onViewAppointment?.(apt)}
                              className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="font-medium text-gray-900">{apt.service_name || '—'}</div>
                                  <div className="text-sm text-gray-600 mt-1">
                                    {apt.scheduled_start ? formatDateTime(apt.scheduled_start) : '—'}
                                    {formatDuration(apt) && ` • ${formatDuration(apt)}`}
                                    {apt.instructor_name && ` • ${apt.instructor_name}`}
                                  </div>
                                </div>
                                <span className="inline-flex items-center rounded-full border px-2 py-1 text-xs font-semibold text-blue-700 bg-blue-50 border-blue-100">
                                  {apt.status?.toUpperCase() || 'SCHEDULED'}
                                </span>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Past Appointments */}
                    {pastAppointments.length > 0 && (
                      <div>
                        <h3 className="text-sm font-semibold text-gray-700 mb-3">
                          {t('customerDetail2.appointments.past', 'Past')} ({pastAppointments.length})
                        </h3>
                        <div className="space-y-2">
                          {pastAppointments.slice(0, 5).map((apt) => (
                            <div
                              key={apt.id}
                              onClick={() => onViewAppointment?.(apt)}
                              className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                            >
                              <div className="flex items-start justify-between">
                                <div className="flex-1">
                                  <div className="font-medium text-gray-900">{apt.service_name || '—'}</div>
                                  <div className="text-sm text-gray-600 mt-1">
                                    {apt.scheduled_start ? formatDateTime(apt.scheduled_start) : '—'}
                                    {formatDuration(apt) && ` • ${formatDuration(apt)}`}
                                    {apt.instructor_name && ` • ${apt.instructor_name}`}
                                  </div>
                                </div>
                                <span className="inline-flex items-center rounded-full border px-2 py-1 text-xs font-semibold text-gray-700 bg-gray-50 border-gray-200">
                                  {apt.status?.toUpperCase() || 'COMPLETED'}
                                </span>
                              </div>
                            </div>
                          ))}
                          {pastAppointments.length > 5 && (
                            <div className="text-sm text-gray-500 text-center py-2">
                              {t('customerDetail2.appointments.morePast', '+ {{count}} more', { count: pastAppointments.length - 5 })}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Orders History */}
              <div className="rounded-xl border border-gray-200 bg-white p-4 sm:p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  {t('customerDetail2.orders.title', 'Order History')}
                </h2>
                
                {loadingOrders ? (
                  <div className="text-gray-600 text-sm">{t('customerDetail2.orders.loading', 'Loading...')}</div>
                ) : orders.length === 0 ? (
                  <p className="text-gray-500 text-sm">{t('customerDetail2.orders.empty', 'No orders found.')}</p>
                ) : (
                  <div className="space-y-2">
                    {orders.map((order) => {
                      const statusStyle = order.status === 'closed'
                        ? 'text-emerald-700 bg-emerald-50 border-emerald-100'
                        : order.status === 'cancelled'
                        ? 'text-rose-700 bg-rose-50 border-rose-100'
                        : 'text-blue-700 bg-blue-50 border-blue-100'
                      
                      return (
                        <div
                          key={order.id}
                          onClick={() => onViewOrder?.(order)}
                          className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex-1">
                              <div className="font-medium text-gray-900">
                                {order.order_number || `#${order.id}`}
                              </div>
                              <div className="text-sm text-gray-600 mt-1">
                                {formatDateTime(order.created_at)}
                                {order.closed_at && ` • Closed: ${formatDateTime(order.closed_at)}`}
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="text-right">
                                <div className="text-sm font-semibold text-gray-900">
                                  {formatCurrency(Number(order.total_amount || 0))}
                                </div>
                                {order.balance_due > 0 && (
                                  <div className="text-xs text-rose-600">
                                    {t('customerDetail2.orders.balance', 'Balance')}: {formatCurrency(Number(order.balance_due || 0))}
                                  </div>
                                )}
                              </div>
                              <span className={`inline-flex items-center rounded-full border px-2 py-1 text-xs font-semibold ${statusStyle}`}>
                                {order.status?.toUpperCase() || 'OPEN'}
                              </span>
                            </div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>

              {/* Payment History */}
              {allPayments.length > 0 && (
                <div className="rounded-xl border border-gray-200 bg-white p-4 sm:p-6 shadow-sm">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">
                    {t('customerDetail2.payments.title', 'Payment History')}
                  </h2>
                  <div className="space-y-2">
                    {allPayments.slice(0, 10).map((payment) => (
                      <div key={payment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                        <div className="flex-1">
                          <div className="text-sm font-medium text-gray-900">
                            {payment.order_number || `Order #${payment.order_id}`}
                          </div>
                          <div className="text-xs text-gray-600 mt-1">
                            {formatDateTime(payment.occurred_at)}
                            {payment.payment_method_name && ` • ${payment.payment_method_name}`}
                          </div>
                        </div>
                        <div className="text-sm font-semibold text-emerald-700">
                          {formatCurrency(Number(payment.amount || 0))}
                        </div>
                      </div>
                    ))}
                    {allPayments.length > 10 && (
                      <div className="text-sm text-gray-500 text-center py-2">
                        {t('customerDetail2.payments.more', '+ {{count}} more payments', { count: allPayments.length - 10 })}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Right Column - Customer Info */}
            <div className="w-full lg:w-80 lg:flex-shrink-0">
              <DetailInfoPanel
                title={t('customerDetail.info.title')}
                onEdit={() => onEdit?.(customer)}
                onDelete={handleDelete}
                user={user}
                deleting={deleting}
              >
                <dl className="space-y-4 text-sm">
                  <div>
                    <dt className="text-xs font-medium text-gray-500 uppercase">{t('customerDetail.info.id', 'ID')}</dt>
                    <dd className="mt-1 text-gray-900 font-mono">#{customer.id}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-gray-500 uppercase">{t('customerDetail.info.fullname')}</dt>
                    <dd className="mt-1 text-gray-900">{customer.fullname || '—'}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-gray-500 uppercase">{t('customerDetail.info.phone')}</dt>
                    <dd className="mt-1 text-gray-900">{customer.phone || '—'}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-gray-500 uppercase">{t('customerDetail.info.email')}</dt>
                    <dd className="mt-1 text-gray-900 break-all">{customer.email || '—'}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-gray-500 uppercase">{t('customerDetail.info.doctype', 'Document Type')}</dt>
                    <dd className="mt-1 text-gray-900">{customer.doctype || '—'}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-gray-500 uppercase">{t('customerDetail.info.doc', 'Document')}</dt>
                    <dd className="mt-1 text-gray-900">{customer.doc || '—'}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-gray-500 uppercase">{t('customerDetail.info.country')}</dt>
                    <dd className="mt-1 text-gray-900">{customer.country || '—'}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-gray-500 uppercase">{t('customerDetail.info.birthdate')}</dt>
                    <dd className="mt-1 text-gray-900">{customer.birthdate ? formatDate(customer.birthdate) : '—'}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-gray-500 uppercase">{t('customerDetail.info.hotel')}</dt>
                    <dd className="mt-1 text-gray-900">{customer.hotel_name || '—'}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-gray-500 uppercase">{t('customerDetail.info.agency')}</dt>
                    <dd className="mt-1 text-gray-900">{customer.agency_name || '—'}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-gray-500 uppercase">{t('customerDetail.info.note')}</dt>
                    <dd className="mt-1 text-gray-900 whitespace-pre-wrap">{customer.note || '—'}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-gray-500 uppercase">{t('customerDetail.info.created')}</dt>
                    <dd className="mt-1 text-gray-900">{formatDateTime(customer.created_at)}</dd>
                  </div>
                  {customer.updated_at && (
                    <div>
                      <dt className="text-xs font-medium text-gray-500 uppercase">{t('customerDetail.info.updated', 'Last update')}</dt>
                      <dd className="mt-1 text-gray-900">{formatDateTime(customer.updated_at)}</dd>
                    </div>
                  )}
                </dl>
              </DetailInfoPanel>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CustomerDetail2

