import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import sql from '../../lib/neon'
import { canModify } from '../../lib/permissions'
import { useSettings } from '../../context/SettingsContext'
import DetailInfoPanel from '../../components/ui/DetailInfoPanel'

function CustomerDetail({ customerId, onEdit, onDelete, onBack, onViewAppointment = () => {}, onViewOrder = () => {}, onAddAppointment = () => {}, onAddOrder = () => {}, user = null }) {
  const { t } = useTranslation()
  const { formatCurrency, formatDate, formatDateTime } = useSettings()
  const [customer, setCustomer] = useState(null)
  const [appointments, setAppointments] = useState([])
  const [orders, setOrders] = useState([])
  const [openOrder, setOpenOrder] = useState(null)
  const [openOrderItems, setOpenOrderItems] = useState([])
  const [openOrderPayments, setOpenOrderPayments] = useState([])
  const [openOrderRefunds, setOpenOrderRefunds] = useState([])
  const [openOrderServiceCredits, setOpenOrderServiceCredits] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingAppointments, setLoadingAppointments] = useState(true)
  const [loadingOrders, setLoadingOrders] = useState(true)
  const [loadingOpenOrder, setLoadingOpenOrder] = useState(false)
  const [error, setError] = useState(null)
  const [deleting, setDeleting] = useState(false)

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
        setOpenOrderServiceCredits([])
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
          setOpenOrderServiceCredits([])
          return
        }

        const order = openOrderResult[0]
        setOpenOrder(order)

        // Fetch order items with service information and credits
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
            sp.name AS service_package_name,
            s.duration_unit,
            CASE 
              WHEN s.duration_unit = 'hours' THEN COALESCE(csc.total_hours, 0)
              WHEN s.duration_unit = 'days' THEN COALESCE(csc.total_days, 0)
              WHEN s.duration_unit = 'months' THEN COALESCE(csc.total_months, 0)::NUMERIC
              ELSE 0
            END as credit_total,
            CASE 
              WHEN s.duration_unit = 'hours' THEN COALESCE(SUM(sa.duration_hours) FILTER (WHERE sa.status IN ('scheduled', 'completed') AND sa.cancelled_at IS NULL), 0)
              WHEN s.duration_unit = 'days' THEN COALESCE(SUM(sa.duration_days) FILTER (WHERE sa.status IN ('scheduled', 'completed') AND sa.cancelled_at IS NULL), 0)
              WHEN s.duration_unit = 'months' THEN COALESCE(SUM(sa.duration_months) FILTER (WHERE sa.status IN ('scheduled', 'completed') AND sa.cancelled_at IS NULL), 0)::NUMERIC
              ELSE 0
            END as credit_used,
            CASE 
              WHEN s.duration_unit = 'hours' THEN COALESCE(csc.total_hours, 0) - COALESCE(SUM(sa.duration_hours) FILTER (WHERE sa.status IN ('scheduled', 'completed') AND sa.cancelled_at IS NULL), 0)
              WHEN s.duration_unit = 'days' THEN COALESCE(csc.total_days, 0) - COALESCE(SUM(sa.duration_days) FILTER (WHERE sa.status IN ('scheduled', 'completed') AND sa.cancelled_at IS NULL), 0)
              WHEN s.duration_unit = 'months' THEN (COALESCE(csc.total_months, 0)::NUMERIC - COALESCE(SUM(sa.duration_months) FILTER (WHERE sa.status IN ('scheduled', 'completed') AND sa.cancelled_at IS NULL), 0)::NUMERIC)
              ELSE 0
            END as credit_available
          FROM order_items oi
          LEFT JOIN service_packages sp ON oi.item_type = 'service_package' AND oi.item_id = sp.id
          LEFT JOIN services s ON (oi.item_type = 'service_package' AND sp.service_id = s.id) OR (oi.item_type = 'service' AND oi.item_id = s.id)
          LEFT JOIN services s2 ON oi.item_type = 'service' AND oi.item_id = s2.id
          LEFT JOIN customer_service_credits csc ON oi.id = csc.order_item_id
          LEFT JOIN scheduled_appointments sa ON sa.credit_id = csc.id
          WHERE oi.order_id = ${order.id}
          GROUP BY oi.id, oi.item_type, oi.item_id, oi.item_name, oi.quantity, oi.unit_price, oi.subtotal,
                   s.name, s2.name, sp.name, s.duration_unit, csc.id, csc.total_hours, csc.total_days, csc.total_months
          ORDER BY oi.created_at ASC
        `
        setOpenOrderItems(itemsResult || [])

        // Fetch service credits summary
        try {
          const creditsResult = await sql`
            SELECT * FROM get_order_all_service_credits(${order.id})
          `
          setOpenOrderServiceCredits(creditsResult || [])
        } catch (creditErr) {
          console.error('Failed to load service credits:', creditErr)
          setOpenOrderServiceCredits([])
        }

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
          ORDER BY op.occurred_at ASC
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
          ORDER BY orf.occurred_at ASC
        `
        setOpenOrderRefunds(refundsResult || [])
      } catch (err) {
        console.error('Failed to load open order:', err)
        setOpenOrder(null)
        setOpenOrderItems([])
        setOpenOrderPayments([])
        setOpenOrderRefunds([])
        setOpenOrderServiceCredits([])
      } finally {
        setLoadingOpenOrder(false)
      }
    }

    fetchOpenOrder()
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
          
          {/* Customer Name */}
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4 sm:mb-6 break-words">{customer.fullname || t('customers.title')}</h1>
          
          {/* Main Content: Appointments, Orders (Left) and Info Card (Right) */}
          <div className="flex flex-col lg:flex-row lg:items-start gap-4 sm:gap-6">
            {/* Appointments and Orders Section - Left */}
            <div className="flex-1 space-y-4 sm:space-y-6 min-w-0">
              {/* Appointments Section */}
              <div className="rounded-xl border border-gray-200 bg-white p-4 sm:p-6 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                  <h2 className="text-base sm:text-lg font-semibold text-gray-900">
                    {t('customerDetail.appointments.title', 'Appointments')}
                  </h2>
                  {canModify(user) && (
                    <button
                      onClick={() => onAddAppointment?.(customer)}
                      disabled={loadingOrders || !orders.some(order => order.status === 'open')}
                      className="inline-flex items-center justify-center gap-2 rounded-lg px-3 py-1.5 text-xs sm:text-sm font-semibold shadow-sm transition-colors bg-indigo-600 text-white hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-indigo-600 whitespace-nowrap"
                      title={loadingOrders ? t('customerDetail.appointments.loading', 'Loading...') : !orders.some(order => order.status === 'open') ? t('customerDetail.appointments.noOpenOrder', 'Customer must have an open order to create an appointment. Please create an order first.') : t('customerDetail.appointments.add', 'Add Appointment')}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      {t('customerDetail.appointments.add', 'Add Appointment')}
                    </button>
                  )}
                </div>
                {loadingAppointments ? (
                  <div className="text-gray-600 text-sm">{t('customerDetail.appointments.loading', 'Loading appointments...')}</div>
                ) : appointments.length === 0 ? (
                  <p className="text-gray-500 text-sm">{t('customerDetail.appointments.empty', 'No appointments found for this customer.')}</p>
                ) : (() => {
                  // Separate appointments into scheduled and others
                  const scheduledAppointments = appointments.filter(apt => 
                    apt.status?.toLowerCase() === 'scheduled'
                  )
                  const otherAppointments = appointments.filter(apt => 
                    apt.status?.toLowerCase() !== 'scheduled'
                  )

                  // Helper function to render appointment row
                  const renderAppointmentRow = (appointment) => {
                    // Format duration based on which field is populated
                    let durationText = '—'
                    if (appointment.duration_hours) {
                      durationText = `${Number(appointment.duration_hours).toFixed(2)} ${t('customerDetail.appointments.hours', 'hours')}`
                    } else if (appointment.duration_days) {
                      durationText = `${Number(appointment.duration_days).toFixed(2)} ${t('customerDetail.appointments.days', 'days')}`
                    } else if (appointment.duration_months) {
                      durationText = `${appointment.duration_months} ${t('customerDetail.appointments.months', 'months')}`
                    }
                    
                    return (
                      <tr 
                        key={appointment.id}
                        onClick={() => onViewAppointment?.(appointment)}
                        className="hover:bg-gray-50 cursor-pointer transition-colors"
                      >
                        <td className="px-3 sm:px-4 py-2 sm:py-3 text-sm font-medium text-gray-900">
                          <div className="flex flex-col">
                            <span>{appointment.service_name || '—'}</span>
                            <span className="text-xs text-gray-500 sm:hidden mt-0.5">
                              {appointment.scheduled_start ? formatDateTime(appointment.scheduled_start) : '—'}
                            </span>
                          </div>
                        </td>
                        <td className="px-3 sm:px-4 py-2 sm:py-3 text-sm text-gray-900 hidden sm:table-cell">
                          {appointment.scheduled_start ? formatDateTime(appointment.scheduled_start) : '—'}
                        </td>
                        <td className="px-3 sm:px-4 py-2 sm:py-3 text-sm text-gray-900 hidden md:table-cell">
                          {appointment.scheduled_end ? formatDateTime(appointment.scheduled_end) : '—'}
                        </td>
                        <td className="px-3 sm:px-4 py-2 sm:py-3 text-sm text-gray-700">
                          {durationText}
                        </td>
                        <td className="px-3 sm:px-4 py-2 sm:py-3">
                          <span className="inline-flex items-center rounded-full border px-2 py-1 text-xs font-semibold text-gray-700 bg-gray-50 border-gray-200">
                            {appointment.status?.replace(/_/g, ' ').toUpperCase() || 'SCHEDULED'}
                          </span>
                        </td>
                      </tr>
                    )
                  }

                  // Helper function to render table
                  const renderTable = (appointmentList, title) => {
                    if (appointmentList.length === 0) return null

                    return (
                      <div className="mb-6">
                        {title && (
                          <h3 className="text-sm font-semibold text-gray-700 mb-3">
                            {title}
                          </h3>
                        )}
                        <div className="overflow-x-auto -mx-4 sm:mx-0">
                          <div className="inline-block min-w-full align-middle sm:px-0">
                            <table className="min-w-full divide-y divide-gray-200">
                              <thead className="bg-gray-50">
                                <tr>
                                  <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    {t('customerDetail.appointments.service', 'Service')}
                                  </th>
                                  <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                                    {t('customerDetail.appointments.startTime', 'Start Time')}
                                  </th>
                                  <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                                    {t('customerDetail.appointments.endTime', 'End Time')}
                                  </th>
                                  <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    {t('customerDetail.appointments.duration', 'Duration')}
                                  </th>
                                  <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                    {t('customerDetail.appointments.status', 'Status')}
                                  </th>
                                </tr>
                              </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                              {appointmentList.map(renderAppointmentRow)}
                            </tbody>
                          </table>
                          </div>
                        </div>
                      </div>
                    )
                  }

                  return (
                    <div>
                      {renderTable(scheduledAppointments, scheduledAppointments.length > 0 ? t('customerDetail.appointments.scheduled', 'Scheduled Appointments') : null)}
                      {renderTable(otherAppointments, otherAppointments.length > 0 ? t('customerDetail.appointments.other', 'Other Appointments') : null)}
                    </div>
                  )
                })()}
              </div>

              {/* Open Order Section */}
              {openOrder && (
                <div className="rounded-xl border border-gray-200 bg-white p-4 sm:p-6 shadow-sm">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                    <h2 className="text-base sm:text-lg font-semibold text-gray-900 break-words">
                      {t('customerDetail.openOrder.title', 'Open Order')}: {openOrder.order_number || `#${openOrder.id}`}
                    </h2>
                    <button
                      onClick={() => onViewOrder?.(openOrder)}
                      className="inline-flex items-center justify-center gap-2 rounded-lg px-3 py-1.5 text-xs sm:text-sm font-semibold shadow-sm transition-colors bg-indigo-600 text-white hover:bg-indigo-500 whitespace-nowrap"
                    >
                      {t('customerDetail.openOrder.view', 'View Order')}
                    </button>
                  </div>

                  {loadingOpenOrder ? (
                    <div className="text-gray-600 text-sm">{t('customerDetail.openOrder.loading', 'Loading order details...')}</div>
                  ) : (
                    <div className="space-y-4">
                      {/* Order Items */}
                      {openOrderItems.length > 0 && (
                        <div>
                          <h3 className="text-sm font-semibold text-gray-700 mb-2">
                            {t('customerDetail.openOrder.items', 'Items')}
                          </h3>
                          <div className="overflow-x-auto -mx-4 sm:mx-0">
                            <div className="inline-block min-w-full align-middle sm:px-0">
                              <table className="min-w-full divide-y divide-gray-200 text-sm">
                                <thead className="bg-gray-50">
                                  <tr>
                                    <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Item</th>
                                    <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">Qty</th>
                                    <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase hidden sm:table-cell">Unit Price</th>
                                    <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                                  </tr>
                                </thead>
                              <tbody className="bg-white divide-y divide-gray-200">
                                {openOrderItems.map((item) => {
                                  // For service packages, show service name first, then package name below
                                  const displayName = item.item_type === 'service_package' && item.service_name
                                    ? (
                                        <div>
                                          <div className="font-medium">{item.service_name}</div>
                                          <div className="text-xs text-gray-500">{item.service_package_name || item.item_name}</div>
                                        </div>
                                      )
                                    : item.item_name
                                  return (
                                    <tr key={item.id}>
                                      <td className="px-3 py-2 text-gray-900">{displayName}</td>
                                      <td className="px-3 py-2 text-right text-gray-900">{item.quantity}</td>
                                      <td className="px-3 py-2 text-right text-gray-700 hidden sm:table-cell">
                                        {formatCurrency(Number(item.unit_price || 0))}
                                      </td>
                                      <td className="px-3 py-2 text-right font-medium text-gray-900">
                                        {formatCurrency(Number(item.subtotal || 0))}
                                      </td>
                                    </tr>
                                  )
                                })}
                              </tbody>
                            </table>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Payments */}
                      {openOrderPayments.length > 0 && (
                        <div>
                          <h3 className="text-sm font-semibold text-gray-700 mb-2">
                            {t('customerDetail.openOrder.payments', 'Payments')}
                          </h3>
                          <div className="overflow-x-auto -mx-4 sm:mx-0">
                            <div className="inline-block min-w-full align-middle sm:px-0">
                              <table className="min-w-full divide-y divide-gray-200 text-sm">
                              <thead className="bg-gray-50">
                                <tr>
                                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase hidden sm:table-cell">Method</th>
                                  <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
                                </tr>
                              </thead>
                              <tbody className="bg-white divide-y divide-gray-200">
                                {openOrderPayments.map((payment) => (
                                  <tr key={payment.id}>
                                    <td className="px-3 py-2 text-gray-900">{formatDateTime(payment.occurred_at)}</td>
                                    <td className="px-3 py-2 text-gray-700 hidden sm:table-cell">{payment.payment_method_name || '—'}</td>
                                    <td className="px-3 py-2 text-right font-semibold text-emerald-700">
                                      {formatCurrency(Number(payment.amount || 0))}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Refunds */}
                      {openOrderRefunds.length > 0 && (
                        <div>
                          <h3 className="text-sm font-semibold text-gray-700 mb-2">
                            {t('customerDetail.openOrder.refunds', 'Refunds')}
                          </h3>
                          <div className="overflow-x-auto -mx-4 sm:mx-0">
                            <div className="inline-block min-w-full align-middle sm:px-0">
                              <table className="min-w-full divide-y divide-gray-200 text-sm">
                              <thead className="bg-gray-50">
                                <tr>
                                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                                  <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase hidden sm:table-cell">Method</th>
                                  <th className="px-3 py-2 text-right text-xs font-medium text-gray-500 uppercase">Amount</th>
                                </tr>
                              </thead>
                              <tbody className="bg-white divide-y divide-gray-200">
                                {openOrderRefunds.map((refund) => (
                                  <tr key={refund.id}>
                                    <td className="px-3 py-2 text-gray-900">{formatDateTime(refund.occurred_at)}</td>
                                    <td className="px-3 py-2 text-gray-700 hidden sm:table-cell">{refund.payment_method_name || '—'}</td>
                                    <td className="px-3 py-2 text-right font-semibold text-rose-700">
                                      {formatCurrency(Number(refund.amount || 0))}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Totals */}
                      <div className="border-t border-gray-300 pt-3 mt-3">
                        <div className="flex flex-col sm:flex-row sm:justify-end gap-2 sm:gap-0 sm:space-x-8">
                          <div className="text-left sm:text-right">
                            <div className="text-sm font-semibold text-gray-900">
                              {t('customerDetail.openOrder.total', 'Total')}: {formatCurrency(Number(openOrder.total_amount || 0))}
                            </div>
                            <div className="text-sm font-semibold text-gray-900 mt-1">
                              {t('customerDetail.openOrder.totalPaid', 'Total Paid')}: {formatCurrency(Number(openOrder.total_paid || 0))}
                            </div>
                            {openOrderRefunds.length > 0 && (
                              <div className="text-sm font-semibold text-rose-700 mt-1">
                                {t('customerDetail.openOrder.totalRefunded', 'Total Refunded')}: {formatCurrency(openOrderRefunds.reduce((sum, r) => sum + Number(r.amount || 0), 0))}
                              </div>
                            )}
                            <div className={`text-sm font-semibold mt-1 ${
                              (() => {
                                const totalRefunded = openOrderRefunds.reduce((sum, r) => sum + Number(r.amount || 0), 0)
                                const calculatedBalance = Number(openOrder.total_amount || 0) - Number(openOrder.total_paid || 0) + totalRefunded
                                return calculatedBalance > 0 ? 'text-rose-700' : 'text-emerald-700'
                              })()
                            }`}>
                              {t('customerDetail.openOrder.balance', 'Balance Due')}: {(() => {
                                const totalRefunded = openOrderRefunds.reduce((sum, r) => sum + Number(r.amount || 0), 0)
                                const calculatedBalance = Number(openOrder.total_amount || 0) - Number(openOrder.total_paid || 0) + totalRefunded
                                return formatCurrency(calculatedBalance)
                              })()}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Orders Section */}
              <div className="rounded-xl border border-gray-200 bg-white p-4 sm:p-6 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                  <h2 className="text-base sm:text-lg font-semibold text-gray-900">
                    {t('customerDetail.orders.title', 'Orders')}
                  </h2>
                  {canModify(user) && (
                    <button
                      onClick={() => onAddOrder?.(customer)}
                      disabled={loadingOrders || orders.some(order => order.status === 'open')}
                      className="inline-flex items-center justify-center gap-2 rounded-lg px-3 py-1.5 text-xs sm:text-sm font-semibold shadow-sm transition-colors bg-indigo-600 text-white hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-indigo-600 whitespace-nowrap"
                      title={loadingOrders ? t('customerDetail.orders.loading', 'Loading...') : orders.some(order => order.status === 'open') ? t('customerDetail.orders.hasOpenOrder', 'Customer already has an open order. Please close the existing order before creating a new one.') : t('customerDetail.orders.add', 'Add Order')}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      {t('customerDetail.orders.add', 'Add Order')}
                    </button>
                  )}
                </div>
                {loadingOrders ? (
                  <div className="text-gray-600 text-sm">{t('customerDetail.orders.loading', 'Loading orders...')}</div>
                ) : orders.length === 0 ? (
                  <p className="text-gray-500 text-sm">{t('customerDetail.orders.empty', 'No orders found for this customer.')}</p>
                ) : (
                  <div className="overflow-x-auto -mx-4 sm:mx-0">
                    <div className="inline-block min-w-full align-middle sm:px-0">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              {t('customerDetail.orders.orderNumber', 'Order Number')}
                            </th>
                            <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              {t('customerDetail.orders.status', 'Status')}
                            </th>
                            <th className="px-3 sm:px-4 py-2 sm:py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                              {t('customerDetail.orders.total', 'Total')}
                            </th>
                            <th className="px-3 sm:px-4 py-2 sm:py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                              {t('customerDetail.orders.balance', 'Balance')}
                            </th>
                            <th className="px-3 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                              {t('customerDetail.orders.date', 'Date')}
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {orders.map((order) => {
                            const statusStyle = order.status === 'closed'
                              ? 'text-emerald-700 bg-emerald-50 border-emerald-100'
                              : order.status === 'cancelled'
                              ? 'text-rose-700 bg-rose-50 border-rose-100'
                              : 'text-blue-700 bg-blue-50 border-blue-100'
                            return (
                              <tr 
                                key={order.id}
                                onClick={() => onViewOrder?.(order)}
                                className="hover:bg-gray-50 cursor-pointer transition-colors"
                              >
                                <td className="px-3 sm:px-4 py-2 sm:py-3 text-sm font-medium text-gray-900">
                                  {order.order_number || `#${order.id}`}
                                </td>
                                <td className="px-3 sm:px-4 py-2 sm:py-3">
                                  <span className={`inline-flex items-center rounded-full border px-2 py-1 text-xs font-semibold ${statusStyle}`}>
                                    {order.status?.toUpperCase() || 'OPEN'}
                                  </span>
                                </td>
                                <td className="px-3 sm:px-4 py-2 sm:py-3 text-sm text-gray-900 text-right hidden sm:table-cell">
                                  {formatCurrency(Number(order.total_amount || 0))}
                                </td>
                                <td className={`px-3 sm:px-4 py-2 sm:py-3 text-sm font-semibold text-right ${
                                  order.balance_due > 0 ? 'text-rose-700' : 'text-emerald-700'
                                }`}>
                                  {formatCurrency(Number(order.balance_due || 0))}
                                </td>
                                <td className="px-3 sm:px-4 py-2 sm:py-3 text-sm text-gray-500 hidden md:table-cell">
                                  {formatDateTime(order.created_at)}
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Customer Info Card - Right */}
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

export default CustomerDetail

