import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import sql from '../../lib/neon'
import { canModify } from '../../lib/permissions'
import { useSettings } from '../../context/SettingsContext'
import DetailInfoPanel from '../../components/ui/DetailInfoPanel'
import OpenOrder from '../../components/customers/OpenOrder'

const statusStyles = {
  scheduled: {
    pill: 'text-blue-700 bg-blue-50 border-blue-100',
    bg: 'bg-blue-50'
  },
  in_progress: {
    pill: 'text-indigo-700 bg-indigo-50 border-indigo-100',
    bg: 'bg-indigo-50'
  },
  completed: {
    pill: 'text-emerald-700 bg-emerald-50 border-emerald-100',
    bg: 'bg-emerald-50'
  },
  cancelled: {
    pill: 'text-rose-700 bg-rose-50 border-rose-100',
    bg: 'bg-rose-50'
  },
  no_show: {
    pill: 'text-amber-700 bg-amber-50 border-amber-100',
    bg: 'bg-amber-50'
  },
  rescheduled: {
    pill: 'text-purple-700 bg-purple-50 border-purple-100',
    bg: 'bg-purple-50'
  }
}

function CustomerDetail({ customerId, onEdit, onDelete, onBack, onAddTransaction = () => {}, onViewOrder = () => {}, onAddOrder = () => {}, onViewAppointment = () => {}, onAddAppointment = () => {}, user = null }) {
  const { t } = useTranslation()
  const { formatCurrency, formatDate, formatDateTime } = useSettings()
  const [customer, setCustomer] = useState(null)
  const [orders, setOrders] = useState([])
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingOrders, setLoadingOrders] = useState(true)
  const [loadingAppointments, setLoadingAppointments] = useState(true)
  const [error, setError] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [currentTime, setCurrentTime] = useState(new Date())
  const [hasOpenOrder, setHasOpenOrder] = useState(false)
  const [openOrder, setOpenOrder] = useState(null)
  const [orphanedAppointments, setOrphanedAppointments] = useState([])
  const [negativeCredits, setNegativeCredits] = useState([])

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

  // Function to reload orders
  const reloadOrders = async () => {
    try {
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
      const foundOpenOrder = result?.find(order => order.status === 'open')
      setHasOpenOrder(!!foundOpenOrder)
      setOpenOrder(foundOpenOrder || null)
    } catch (err) {
      console.error('Failed to reload orders:', err)
    }
  }

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
        
        // Check if customer has an open order
        const foundOpenOrder = result?.find(order => order.status === 'open')
        setHasOpenOrder(!!foundOpenOrder)
        setOpenOrder(foundOpenOrder || null)
      } catch (err) {
        console.error('Failed to load customer orders:', err)
        setHasOpenOrder(false)
        setOpenOrder(null)
      } finally {
        setLoadingOrders(false)
      }
    }

    if (customerId) {
      fetchOrders()
    }
  }, [customerId])

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
            i.fullname AS instructor_name
          FROM scheduled_appointments sa
          LEFT JOIN services s ON sa.service_id = s.id
          LEFT JOIN service_packages sp ON sa.service_package_id = sp.id
          LEFT JOIN instructors i ON sa.instructor_id = i.id
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

  // Load orphaned appointments and negative credits (for notification in schedule section)
  useEffect(() => {
    const fetchNotifications = async () => {
      if (!customerId) {
        setOrphanedAppointments([])
        setNegativeCredits([])
        return
      }
      
      try {
        // Fetch orphaned appointments
        const orphanedResult = await sql`
          SELECT 
            sa.service_id,
            s.name as service_name,
            s.duration_unit,
            CASE 
              WHEN s.duration_unit = 'hours' THEN COALESCE(SUM(sa.duration_hours), 0)
              WHEN s.duration_unit = 'days' THEN COALESCE(SUM(sa.duration_days), 0)
              WHEN s.duration_unit = 'months' THEN COALESCE(SUM(sa.duration_months), 0)::NUMERIC
              ELSE 0
            END as total_used,
            COUNT(*)::INTEGER as appointment_count
          FROM scheduled_appointments sa
          JOIN services s ON sa.service_id = s.id
          WHERE sa.customer_id = ${customerId}
            AND sa.credit_id IS NULL
            AND sa.status IN ('scheduled', 'completed')
            AND sa.cancelled_at IS NULL
          GROUP BY sa.service_id, s.name, s.duration_unit
        `
        setOrphanedAppointments(orphanedResult || [])
        
        // Fetch negative credits
        const negativeCreditsResult = await sql`
          SELECT 
            csc.id as credit_id,
            csc.service_id,
            s.name as service_name,
            COALESCE(sp.name, 'Direct Service') as package_name,
            s.duration_unit,
            CASE 
              WHEN s.duration_unit = 'hours' THEN COALESCE(csc.total_hours, 0) - COALESCE(SUM(sa.duration_hours) FILTER (WHERE sa.status IN ('scheduled', 'completed') AND sa.cancelled_at IS NULL), 0)
              WHEN s.duration_unit = 'days' THEN COALESCE(csc.total_days, 0) - COALESCE(SUM(sa.duration_days) FILTER (WHERE sa.status IN ('scheduled', 'completed') AND sa.cancelled_at IS NULL), 0)
              WHEN s.duration_unit = 'months' THEN (COALESCE(csc.total_months, 0)::NUMERIC - COALESCE(SUM(sa.duration_months) FILTER (WHERE sa.status IN ('scheduled', 'completed') AND sa.cancelled_at IS NULL), 0)::NUMERIC)
              ELSE 0
            END as available
          FROM customer_service_credits csc
          JOIN services s ON csc.service_id = s.id
          LEFT JOIN service_packages sp ON csc.service_package_id = sp.id
          LEFT JOIN scheduled_appointments sa ON sa.credit_id = csc.id
          WHERE csc.customer_id = ${customerId}
            AND csc.status = 'active'
          GROUP BY csc.id, csc.service_id, s.name, sp.name, s.duration_unit, csc.total_hours, csc.total_days, csc.total_months
          HAVING (
            CASE 
              WHEN s.duration_unit = 'hours' THEN COALESCE(csc.total_hours, 0) - COALESCE(SUM(sa.duration_hours) FILTER (WHERE sa.status IN ('scheduled', 'completed') AND sa.cancelled_at IS NULL), 0)
              WHEN s.duration_unit = 'days' THEN COALESCE(csc.total_days, 0) - COALESCE(SUM(sa.duration_days) FILTER (WHERE sa.status IN ('scheduled', 'completed') AND sa.cancelled_at IS NULL), 0)
              WHEN s.duration_unit = 'months' THEN (COALESCE(csc.total_months, 0)::NUMERIC - COALESCE(SUM(sa.duration_months) FILTER (WHERE sa.status IN ('scheduled', 'completed') AND sa.cancelled_at IS NULL), 0)::NUMERIC)
              ELSE 0
            END
          ) < 0
        `
        setNegativeCredits(negativeCreditsResult || [])
      } catch (err) {
        console.error('Failed to load notifications:', err)
        setOrphanedAppointments([])
        setNegativeCredits([])
      }
    }

    fetchNotifications()
  }, [customerId])

  // Update current time every minute to check for "In Progress" status
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date())
    }, 60000) // Update every minute
    
    return () => clearInterval(interval)
  }, [])

  // Helper function to get duration display
  const getDurationDisplay = (appointment) => {
    if (!appointment) return '—'
    if (appointment.duration_hours) {
      return `${appointment.duration_hours}h`
    }
    if (appointment.duration_days) {
      return `${appointment.duration_days}d`
    }
    if (appointment.duration_months) {
      return `${appointment.duration_months}mo`
    }
    if (!appointment.scheduled_start || !appointment.scheduled_end) {
      return '—'
    }
    try {
      const diff = new Date(appointment.scheduled_end) - new Date(appointment.scheduled_start)
      if (isNaN(diff)) return '—'
      const hours = Math.floor(diff / (1000 * 60 * 60))
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
      if (hours > 0) {
        return `${hours}h ${minutes}m`
      }
      return `${minutes}m`
    } catch (err) {
      console.error('Error calculating duration:', err)
      return '—'
    }
  }

  // Check if appointment is currently in progress
  const isInProgress = (appointment) => {
    if (!appointment || appointment.status !== 'scheduled') {
      return false
    }
    if (!appointment.scheduled_start || !appointment.scheduled_end) {
      return false
    }
    try {
      const now = currentTime.getTime()
      const start = new Date(appointment.scheduled_start).getTime()
      const end = new Date(appointment.scheduled_end).getTime()
      if (isNaN(start) || isNaN(end)) {
        return false
      }
      return now >= start && now <= end
    } catch (err) {
      console.error('Error checking if appointment is in progress:', err)
      return false
    }
  }

  // Format status for display
  const formatStatusDisplay = (status, appointment) => {
    if (!appointment) {
      return t('schedule.status.scheduled', 'SCHEDULED')
    }
    if (isInProgress(appointment)) {
      return t('schedule.status.inProgress', 'IN PROGRESS')
    }
    const statusKey = `schedule.status.${status || 'scheduled'}`
    return t(statusKey, status?.replace(/_/g, ' ').toUpperCase() || 'SCHEDULED')
  }

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
    <div className="px-4 py-6 sm:p-6 lg:p-8">
      <div className="rounded-xl bg-white shadow-sm">
        {/* Header */}
        <div className="p-6">
          <button
            onClick={onBack}
            className="mb-6 flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            {t('customerDetail.back')}
          </button>
          
          {/* Customer Name */}
          <h1 className="text-3xl font-bold text-gray-900 mb-6">{customer.fullname || t('customers.title')}</h1>
          
          {/* Main Content: Schedule, Orders (Left) and Info Card (Right) */}
          <div className="flex flex-col lg:flex-row lg:items-start gap-6">
            {/* Schedule and Orders Section - Left */}
            <div className="flex-1 space-y-6">
              {/* Schedule Section */}
              <div className="rounded-xl border border-gray-200 bg-white p-3 sm:p-6 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                  <h2 className="text-base sm:text-lg font-semibold text-gray-900">
                    {t('customerDetail.schedule.title', 'Schedule')}
                  </h2>
                  {canModify(user) && (
                    <button
                      onClick={() => onAddAppointment?.(customer)}
                      className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-2 sm:px-3 py-1.5 text-xs sm:text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 transition-colors"
                    >
                      <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      <span className="hidden sm:inline">{t('customerDetail.schedule.add', 'Add Appointment')}</span>
                      <span className="sm:hidden">{t('customerDetail.schedule.add', 'Add')}</span>
                    </button>
                  )}
                </div>
                {orphanedAppointments.length > 0 && (
                  <div className="mb-3 sm:mb-4 rounded-lg border border-amber-200 bg-amber-50 p-3 sm:p-4">
                    <div className="flex items-start gap-2">
                      <svg className="w-4 h-4 sm:w-5 sm:h-5 text-amber-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs sm:text-sm font-semibold text-amber-800 mb-1">
                          {t('customerDetail.schedule.orphanedWarning', 'Orphaned Appointments Detected')}
                        </p>
                        <p className="text-xs text-amber-700 mb-2">
                          {t('customerDetail.schedule.orphanedDescription', 'Some appointments are not linked to any credit. Add a package for the following service(s) to transfer usage:')}
                        </p>
                        <ul className="text-xs text-amber-700 space-y-1 break-words">
                          {orphanedAppointments.map((orphan, idx) => (
                            <li key={idx} className="break-words">
                              • {orphan.service_name}: {Number(orphan.total_used || 0).toFixed(2)} {orphan.duration_unit} ({orphan.appointment_count} {orphan.appointment_count === 1 ? t('customerDetail.schedule.appointment', 'appointment') : t('customerDetail.schedule.appointments', 'appointments')})
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}
                {negativeCredits.length > 0 && (
                  <div className="mb-3 sm:mb-4 rounded-lg border border-red-200 bg-red-50 p-3 sm:p-4">
                    <div className="flex items-start gap-2">
                      <svg className="w-4 h-4 sm:w-5 sm:h-5 text-red-600 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs sm:text-sm font-semibold text-red-800 mb-1">
                          {t('customerDetail.schedule.negativeCreditsWarning', 'Negative Credits Detected')}
                        </p>
                        <p className="text-xs text-red-700 mb-2">
                          {t('customerDetail.schedule.negativeCreditsDescription', 'Some credits have negative balances. This means more appointments have been scheduled than available credits:')}
                        </p>
                        <ul className="text-xs text-red-700 space-y-1 break-words">
                          {negativeCredits.map((credit, idx) => (
                            <li key={idx} className="break-words">
                              • {credit.service_name} {credit.package_name && `(${credit.package_name})`}: {Number(credit.available || 0).toFixed(2)} {credit.duration_unit}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                )}
                {loadingAppointments ? (
                  <div className="text-gray-600 text-xs sm:text-sm">{t('customerDetail.schedule.loading', 'Loading appointments...')}</div>
                ) : appointments.length === 0 ? (
                  <p className="text-gray-500 text-xs sm:text-sm">{t('customerDetail.schedule.empty', 'No appointments found for this customer.')}</p>
                ) : (
                  <div className="overflow-x-auto -mx-3 sm:mx-0">
                    <div className="inline-block min-w-full align-middle">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              {t('customerDetail.schedule.service', 'Service')}
                            </th>
                            <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                              {t('customerDetail.schedule.startTime', 'Start Time')}
                            </th>
                            <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                              {t('customerDetail.schedule.endTime', 'End Time')}
                            </th>
                            <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                              {t('customerDetail.schedule.duration', 'Duration')}
                            </th>
                            <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              {t('customerDetail.schedule.status', 'Status')}
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {appointments.map((appointment) => {
                            if (!appointment || !appointment.id) return null
                            const displayStatus = isInProgress(appointment) ? 'in_progress' : (appointment.status || 'scheduled')
                            const statusStyle = statusStyles[displayStatus] || statusStyles.scheduled
                            return (
                              <tr 
                                key={appointment.id}
                                onClick={() => onViewAppointment?.(appointment)}
                                className="hover:bg-gray-50 cursor-pointer transition-colors"
                              >
                                <td className="px-2 sm:px-4 py-2 sm:py-3">
                                  <div className="text-xs sm:text-sm font-medium text-gray-900 break-words">
                                    {appointment.service_name || '—'}
                                  </div>
                                  {appointment.attendee_name && (
                                    <div className="text-xs text-gray-500 mt-0.5">
                                      {t('customerDetail.schedule.attendee', 'Attendee: {{name}}', { name: appointment.attendee_name })}
                                    </div>
                                  )}
                                  <div className="text-xs text-gray-500 sm:hidden mt-1 space-y-0.5">
                                    {appointment.scheduled_start && (
                                      <div>Start: {formatDateTime(appointment.scheduled_start)}</div>
                                    )}
                                    {appointment.scheduled_end && (
                                      <div>End: {formatDateTime(appointment.scheduled_end)}</div>
                                    )}
                                    <div>Duration: {getDurationDisplay(appointment)}</div>
                                  </div>
                                </td>
                                <td className="px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-gray-900 hidden sm:table-cell">
                                  {appointment.scheduled_start ? formatDateTime(appointment.scheduled_start) : '—'}
                                </td>
                                <td className="px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-gray-900 hidden md:table-cell">
                                  {appointment.scheduled_end ? formatDateTime(appointment.scheduled_end) : '—'}
                                </td>
                                <td className="px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-gray-500 hidden lg:table-cell">
                                  {getDurationDisplay(appointment)}
                                </td>
                                <td className="px-2 sm:px-4 py-2 sm:py-3">
                                  <span className={`inline-flex items-center rounded-full border px-1.5 sm:px-2 py-0.5 sm:py-1 text-xs font-semibold ${statusStyle.pill}`}>
                                    {formatStatusDisplay(appointment.status, appointment)}
                                  </span>
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

              {/* Open Order Section */}
              {loadingOrders ? (
                <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                  <div className="text-gray-600 text-sm">{t('customerDetail.orders.loading', 'Loading orders...')}</div>
                </div>
              ) : openOrder ? (
                <OpenOrder
                  openOrder={openOrder}
                  user={user}
                  onViewOrder={onViewOrder}
                  onReload={reloadOrders}
                  formatCurrency={formatCurrency}
                  formatDateTime={formatDateTime}
                />
              ) : (
              <div className="rounded-xl border border-gray-200 bg-white p-3 sm:p-6 shadow-sm">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                  <h2 className="text-base sm:text-lg font-semibold text-gray-900">
                      {t('customerDetail.orders.title', 'Orders')}
                  </h2>
                  {canModify(user) && (
                    <button
                        onClick={() => onAddOrder?.(customer)}
                        className="inline-flex items-center justify-center gap-2 rounded-lg px-2 sm:px-3 py-1.5 text-xs sm:text-sm font-semibold shadow-sm transition-colors bg-indigo-600 text-white hover:bg-indigo-500"
                    >
                      <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                        <span className="hidden sm:inline">{t('customerDetail.orders.add', 'Add Order')}</span>
                        <span className="sm:hidden">{t('customerDetail.orders.add', 'Add')}</span>
                    </button>
                  )}
                </div>
                  {orders.filter(order => order.status !== 'open').length > 0 ? (
                  <div className="overflow-x-auto -mx-3 sm:mx-0">
                    <div className="inline-block min-w-full align-middle">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                {t('customerDetail.orders.orderNumber', 'Order Number')}
                            </th>
                            <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                {t('customerDetail.orders.status', 'Status')}
                            </th>
                              <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                                {t('customerDetail.orders.items', 'Items')}
                            </th>
                            <th className="px-2 sm:px-4 py-2 sm:py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                                {t('customerDetail.orders.total', 'Total')}
                            </th>
                            <th className="px-2 sm:px-4 py-2 sm:py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                                {t('customerDetail.orders.balance', 'Balance')}
                            </th>
                            <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                                {t('customerDetail.orders.date', 'Date')}
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {orders.filter(order => order.status !== 'open').map((order) => {
                              const statusStyle = order.status === 'closed'
                                ? 'text-emerald-700 bg-emerald-50 border-emerald-100'
                                : 'text-rose-700 bg-rose-50 border-rose-100'
                          return (
                              <tr 
                                key={order.id}
                                onClick={() => onViewOrder?.(order)}
                                className="hover:bg-gray-50 cursor-pointer transition-colors"
                              >
                              <td className="px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium text-gray-900">
                                  <div className="break-words">{order.order_number || `#${order.id}`}</div>
                                  <div className="text-xs text-gray-500 sm:hidden mt-0.5 space-y-0.5">
                                    <div>Items: {order.item_count || 0}</div>
                                    <div>Total: {formatCurrency(Number(order.total_amount || 0))}</div>
                                    <div>Date: {formatDateTime(order.created_at)}</div>
                                  </div>
                                </td>
                                <td className="px-2 sm:px-4 py-2 sm:py-3">
                                  <span className={`inline-flex items-center rounded-full border px-1.5 sm:px-2 py-0.5 sm:py-1 text-xs font-semibold ${statusStyle}`}>
                                    {t(`orders.status.${order.status || 'open'}`, order.status?.toUpperCase() || 'OPEN')}
                                  </span>
                              </td>
                              <td className="px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-gray-500 hidden sm:table-cell">
                                  {order.item_count || 0}
                              </td>
                              <td className="px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-gray-900 text-right hidden md:table-cell">
                                  {formatCurrency(Number(order.total_amount || 0))}
                              </td>
                              <td className={`px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-semibold text-right ${
                                  order.balance_due > 0 ? 'text-rose-700' : 'text-emerald-700'
                              }`}>
                                  {formatCurrency(Number(order.balance_due || 0))}
                              </td>
                                <td className="px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-gray-500 hidden lg:table-cell">
                                  {formatDateTime(order.created_at)}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                    </div>
                  </div>
                  ) : (
                    <p className="text-gray-500 text-xs sm:text-sm">{t('customerDetail.orders.empty', 'No orders found for this customer.')}</p>
                )}
              </div>
              )}

              {/* Other Orders (Closed and Cancelled) - Only show if there's an open order */}
              {openOrder && orders.filter(order => order.status !== 'open').length > 0 && (
              <div className="rounded-xl border border-gray-200 bg-white p-3 sm:p-6 shadow-sm">
                  <h2 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">
                    {t('customerDetail.orders.otherOrders', 'Other Orders')}
                  </h2>
                  <div className="overflow-x-auto -mx-3 sm:mx-0">
                    <div className="inline-block min-w-full align-middle">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              {t('customerDetail.orders.orderNumber', 'Order Number')}
                            </th>
                            <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              {t('customerDetail.orders.status', 'Status')}
                            </th>
                            <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                              {t('customerDetail.orders.items', 'Items')}
                            </th>
                            <th className="px-2 sm:px-4 py-2 sm:py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider hidden md:table-cell">
                              {t('customerDetail.orders.total', 'Total')}
                            </th>
                            <th className="px-2 sm:px-4 py-2 sm:py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                              {t('customerDetail.orders.balance', 'Balance')}
                            </th>
                            <th className="px-2 sm:px-4 py-2 sm:py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                              {t('customerDetail.orders.date', 'Date')}
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {orders.filter(order => order.status !== 'open').map((order) => {
                            const statusStyle = order.status === 'closed'
                              ? 'text-emerald-700 bg-emerald-50 border-emerald-100'
                              : 'text-rose-700 bg-rose-50 border-rose-100'
                            return (
                              <tr 
                                key={order.id}
                                onClick={() => onViewOrder?.(order)}
                                className="hover:bg-gray-50 cursor-pointer transition-colors"
                              >
                                <td className="px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-medium text-gray-900">
                                  <div className="break-words">{order.order_number || `#${order.id}`}</div>
                                  <div className="text-xs text-gray-500 sm:hidden mt-0.5 space-y-0.5">
                                    <div>Items: {order.item_count || 0}</div>
                                    <div>Total: {formatCurrency(Number(order.total_amount || 0))}</div>
                                    <div>Date: {formatDateTime(order.created_at)}</div>
                                  </div>
                                </td>
                                <td className="px-2 sm:px-4 py-2 sm:py-3">
                                  <span className={`inline-flex items-center rounded-full border px-1.5 sm:px-2 py-0.5 sm:py-1 text-xs font-semibold ${statusStyle}`}>
                                    {t(`orders.status.${order.status || 'open'}`, order.status?.toUpperCase() || 'OPEN')}
                                  </span>
                                </td>
                                <td className="px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-gray-500 hidden sm:table-cell">
                                  {order.item_count || 0}
                                </td>
                                <td className="px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-gray-900 text-right hidden md:table-cell">
                                  {formatCurrency(Number(order.total_amount || 0))}
                                </td>
                                <td className={`px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm font-semibold text-right ${
                                  order.balance_due > 0 ? 'text-rose-700' : 'text-emerald-700'
                                }`}>
                                  {formatCurrency(Number(order.balance_due || 0))}
                                </td>
                                <td className="px-2 sm:px-4 py-2 sm:py-3 text-xs sm:text-sm text-gray-500 hidden lg:table-cell">
                                  {formatDateTime(order.created_at)}
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
            </div>

            {/* Customer Info Card - Right */}
            <div className="w-full lg:w-80">
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

