import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import sql from '../../lib/neon'
import { canModify } from '../../lib/permissions'
import { useSettings } from '../../context/SettingsContext'
import DetailInfoPanel from '../../components/ui/DetailInfoPanel'

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

function AppointmentDetail({ appointmentId, onBack, onEdit, onDelete, onViewCustomer, onViewInstructor, user = null }) {
  const [appointment, setAppointment] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [currentTime, setCurrentTime] = useState(new Date())
  const { formatDateTime, formatDate, formatTime } = useSettings()
  const { t } = useTranslation()

  const getDurationDisplay = () => {
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
    const diff = new Date(appointment.scheduled_end) - new Date(appointment.scheduled_start)
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    if (hours > 0) {
      return `${hours}h ${minutes}m`
    }
    return `${minutes}m`
  }

  useEffect(() => {
    if (!appointmentId) return

    const fetchAppointment = async () => {
      try {
        setLoading(true)
        setError(null)
        
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
            sa.staff_id,
            sa.attendee_name,
            sa.note,
            sa.created_at,
            sa.updated_at,
            sa.completed_at,
            sa.cancelled_at,
            sa.created_by,
            c.fullname AS customer_name,
            c.phone AS customer_phone,
            c.email AS customer_email,
            s.name AS service_name,
            s.duration_unit AS service_duration_unit,
            sc.name AS service_category_name,
            sp.name AS service_package_name,
            i.fullname AS instructor_name,
            st.fullname AS staff_name,
            u.name AS created_by_name
          FROM scheduled_appointments sa
          LEFT JOIN customers c ON sa.customer_id = c.id
          LEFT JOIN services s ON sa.service_id = s.id
          LEFT JOIN service_categories sc ON s.category_id = sc.id
          LEFT JOIN service_packages sp ON sa.service_package_id = sp.id
          LEFT JOIN instructors i ON sa.instructor_id = i.id
          LEFT JOIN staff st ON sa.staff_id = st.id
          LEFT JOIN users u ON sa.created_by = u.id
          WHERE sa.id = ${appointmentId}
          LIMIT 1
        `
        
        if (!result || result.length === 0) {
          setError(t('appointmentDetail.notFound', 'Appointment not found'))
          setAppointment(null)
          return
        }

        setAppointment(result[0])
      } catch (err) {
        console.error('Failed to load appointment:', err)
        setError(t('appointmentDetail.error.load', 'Unable to load appointment. Please try again later.'))
      } finally {
        setLoading(false)
      }
    }

    fetchAppointment()
  }, [appointmentId, t])

  // Update current time every minute to check for "In Progress" status
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date())
    }, 60000) // Update every minute
    
    return () => clearInterval(interval)
  }, [])

  const handleCancel = async () => {
    if (!window.confirm(t('appointmentDetail.confirm.cancel', 'Are you sure you want to cancel this appointment?'))) {
      return
    }
    
    try {
      await sql`
        UPDATE scheduled_appointments
        SET status = 'cancelled', cancelled_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
        WHERE id = ${appointmentId}
      `
      // Reload appointment
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
          sa.staff_id,
          sa.attendee_name,
          sa.note,
          sa.created_at,
          sa.updated_at,
          sa.completed_at,
          sa.cancelled_at,
          sa.created_by,
          c.fullname AS customer_name,
          c.phone AS customer_phone,
          c.email AS customer_email,
          s.name AS service_name,
          s.duration_unit AS service_duration_unit,
          sc.name AS service_category_name,
          sp.name AS service_package_name,
          i.fullname AS instructor_name,
          st.fullname AS staff_name,
          u.name AS created_by_name
        FROM scheduled_appointments sa
        LEFT JOIN customers c ON sa.customer_id = c.id
        LEFT JOIN services s ON sa.service_id = s.id
        LEFT JOIN service_categories sc ON s.category_id = sc.id
        LEFT JOIN service_packages sp ON sa.service_package_id = sp.id
        LEFT JOIN instructors i ON sa.instructor_id = i.id
        LEFT JOIN staff st ON sa.staff_id = st.id
        LEFT JOIN users u ON sa.created_by = u.id
        WHERE sa.id = ${appointmentId}
        LIMIT 1
      `
      if (result && result.length > 0) {
        setAppointment(result[0])
      }
    } catch (err) {
      console.error('Failed to cancel appointment:', err)
      alert(t('appointmentDetail.error.cancel', 'Unable to cancel appointment. Please try again.'))
    }
  }

  const handleComplete = async () => {
    try {
      await sql`
        UPDATE scheduled_appointments
        SET status = 'completed', completed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
        WHERE id = ${appointmentId}
      `
      // Reload appointment
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
          sa.staff_id,
          sa.attendee_name,
          sa.note,
          sa.created_at,
          sa.updated_at,
          sa.completed_at,
          sa.cancelled_at,
          sa.created_by,
          c.fullname AS customer_name,
          c.phone AS customer_phone,
          c.email AS customer_email,
          s.name AS service_name,
          s.duration_unit AS service_duration_unit,
          sc.name AS service_category_name,
          sp.name AS service_package_name,
          i.fullname AS instructor_name,
          st.fullname AS staff_name,
          u.name AS created_by_name
        FROM scheduled_appointments sa
        LEFT JOIN customers c ON sa.customer_id = c.id
        LEFT JOIN services s ON sa.service_id = s.id
        LEFT JOIN service_categories sc ON s.category_id = sc.id
        LEFT JOIN service_packages sp ON sa.service_package_id = sp.id
        LEFT JOIN instructors i ON sa.instructor_id = i.id
        LEFT JOIN staff st ON sa.staff_id = st.id
        LEFT JOIN users u ON sa.created_by = u.id
        WHERE sa.id = ${appointmentId}
        LIMIT 1
      `
      if (result && result.length > 0) {
        setAppointment(result[0])
      }
    } catch (err) {
      console.error('Failed to complete appointment:', err)
      alert(t('appointmentDetail.error.complete', 'Unable to complete appointment. Please try again.'))
    }
  }

  const handleNoShow = async () => {
    if (!window.confirm(t('appointmentDetail.confirm.noShow', 'Mark this appointment as no show?'))) {
      return
    }
    
    try {
      await sql`
        UPDATE scheduled_appointments
        SET status = 'no_show', updated_at = CURRENT_TIMESTAMP
        WHERE id = ${appointmentId}
      `
      // Reload appointment
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
          sa.staff_id,
          sa.attendee_name,
          sa.note,
          sa.created_at,
          sa.updated_at,
          sa.completed_at,
          sa.cancelled_at,
          sa.created_by,
          c.fullname AS customer_name,
          c.phone AS customer_phone,
          c.email AS customer_email,
          s.name AS service_name,
          s.duration_unit AS service_duration_unit,
          sc.name AS service_category_name,
          sp.name AS service_package_name,
          i.fullname AS instructor_name,
          st.fullname AS staff_name,
          u.name AS created_by_name
        FROM scheduled_appointments sa
        LEFT JOIN customers c ON sa.customer_id = c.id
        LEFT JOIN services s ON sa.service_id = s.id
        LEFT JOIN service_categories sc ON s.category_id = sc.id
        LEFT JOIN service_packages sp ON sa.service_package_id = sp.id
        LEFT JOIN instructors i ON sa.instructor_id = i.id
        LEFT JOIN staff st ON sa.staff_id = st.id
        LEFT JOIN users u ON sa.created_by = u.id
        WHERE sa.id = ${appointmentId}
        LIMIT 1
      `
      if (result && result.length > 0) {
        setAppointment(result[0])
      }
    } catch (err) {
      console.error('Failed to mark appointment as no show:', err)
      alert(t('appointmentDetail.error.noShow', 'Unable to mark appointment as no show. Please try again.'))
    }
  }

  const handleDelete = async () => {
    if (!window.confirm(t('appointmentDetail.confirm.delete', 'Are you sure you want to delete this appointment? This action cannot be undone.'))) {
      return
    }

    try {
      setDeleting(true)
      await sql`
        DELETE FROM scheduled_appointments
        WHERE id = ${appointmentId}
      `
      onDelete?.()
    } catch (err) {
      console.error('Failed to delete appointment:', err)
      alert(t('appointmentDetail.error.delete', 'Unable to delete appointment. Please try again.'))
    } finally {
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="px-4 py-6 sm:p-6 lg:p-8">
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <div className="text-gray-600">{t('appointmentDetail.loading', 'Loading appointment...')}</div>
        </div>
      </div>
    )
  }

  if (error || !appointment) {
    return (
      <div className="px-4 py-6 sm:p-6 lg:p-8">
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <div className="text-red-600">{error || t('appointmentDetail.notFound', 'Appointment not found')}</div>
          {onBack && (
            <button
              onClick={onBack}
              className="mt-4 rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
            >
              {t('appointmentDetail.back', 'Back')}
            </button>
          )}
        </div>
      </div>
    )
  }

  // Check if appointment is currently in progress
  const isInProgress = () => {
    if (!appointment) return false
    // Only show "In Progress" for scheduled appointments
    if (appointment.status !== 'scheduled') {
      return false
    }
    
    const now = currentTime.getTime()
    const start = new Date(appointment.scheduled_start).getTime()
    const end = new Date(appointment.scheduled_end).getTime()
    
    return now >= start && now <= end
  }

  // Get display status (either "in_progress" or the stored status)
  const getDisplayStatus = () => {
    if (!appointment) return 'scheduled'
    if (isInProgress()) {
      return 'in_progress'
    }
    return appointment.status || 'scheduled'
  }

  const displayStatus = getDisplayStatus()
  const statusStyle = statusStyles[displayStatus] || statusStyles.scheduled

  // Format status for display (replace underscores with spaces)
  const formatStatusDisplay = (status) => {
    if (status === 'in_progress') {
      return t('appointmentDetail.status.inProgress', 'IN PROGRESS')
    }
    return status?.replace(/_/g, ' ').toUpperCase() || 'SCHEDULED'
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
            {t('appointmentDetail.back', 'Back')}
          </button>
          
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {t('appointmentDetail.title', 'Appointment #{{id}}', { id: appointment.id })}
              </h1>
            </div>
            
            {/* Action Buttons */}
            {(appointment.status === 'scheduled' || displayStatus === 'in_progress') && canModify(user) && (
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={handleComplete}
                  className="inline-flex items-center justify-center rounded-lg border border-emerald-300 px-3 py-2 text-sm font-semibold text-emerald-700 shadow-sm hover:bg-emerald-50 transition-colors"
                >
                  {t('appointmentDetail.buttons.complete', 'Complete')}
                </button>
                <button
                  onClick={handleNoShow}
                  className="inline-flex items-center justify-center rounded-lg border border-amber-300 px-3 py-2 text-sm font-semibold text-amber-700 shadow-sm hover:bg-amber-50 transition-colors"
                >
                  {t('appointmentDetail.buttons.noShow', 'No Show')}
                </button>
                <button
                  onClick={handleCancel}
                  className="inline-flex items-center justify-center rounded-lg border border-red-300 px-3 py-2 text-sm font-semibold text-red-700 shadow-sm hover:bg-red-50 transition-colors"
                >
                  {t('appointmentDetail.buttons.cancel', 'Cancel')}
                </button>
              </div>
            )}
          </div>
          
          {/* Main Content: Overview (Left) and Info Card (Right) */}
          <div className="flex flex-col lg:flex-row lg:items-start gap-6">
            {/* Overview Section - Left */}
            <div className="flex-1">
              <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  {t('appointmentDetail.overview.title', 'Overview')}
                </h2>
                <dl className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Customer name (attendee name) */}
                  <div>
                    <dt className="text-xs font-medium text-gray-500 uppercase mb-1">
                      {t('appointmentDetail.overview.customer', 'Customer')}
                    </dt>
                    <dd className="mt-1 text-sm font-semibold text-gray-900 flex items-center gap-2">
                      <span>{appointment.attendee_name || appointment.customer_name || '—'}</span>
                      {appointment.customer_id && onViewCustomer && (
                        <button
                          onClick={() => onViewCustomer({ id: appointment.customer_id, fullname: appointment.customer_name })}
                          className="inline-flex items-center justify-center p-1 rounded text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                          title={t('appointmentDetail.overview.viewCustomer', 'View Customer')}
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </button>
                      )}
                    </dd>
                  </div>

                  {/* Services type */}
                  <div>
                    <dt className="text-xs font-medium text-gray-500 uppercase mb-1">
                      {t('appointmentDetail.overview.serviceType', 'Service Type')}
                    </dt>
                    <dd className="mt-1 text-sm font-semibold text-gray-900">
                      {appointment.service_name || '—'}
                    </dd>
                  </div>

                  {/* Date and time / Start and end date based on duration unit */}
                  {appointment.service_duration_unit === 'hours' ? (
                    <>
                      <div>
                        <dt className="text-xs font-medium text-gray-500 uppercase mb-1">
                          {t('appointmentDetail.overview.startTime', 'Start Time')}
                        </dt>
                        <dd className="mt-1 text-sm font-semibold text-gray-900">
                          {appointment.scheduled_start ? formatDateTime(new Date(appointment.scheduled_start)) : '—'}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-xs font-medium text-gray-500 uppercase mb-1">
                          {t('appointmentDetail.overview.endTime', 'End Time')}
                        </dt>
                        <dd className="mt-1 text-sm font-semibold text-gray-900">
                          {appointment.scheduled_end ? formatDateTime(new Date(appointment.scheduled_end)) : '—'}
                        </dd>
                      </div>
                    </>
                  ) : (
                    <>
                      <div>
                        <dt className="text-xs font-medium text-gray-500 uppercase mb-1">
                          {t('appointmentDetail.overview.startDate', 'Start Date')}
                        </dt>
                        <dd className="mt-1 text-sm font-semibold text-gray-900">
                          {appointment.scheduled_start ? formatDate(new Date(appointment.scheduled_start)) : '—'}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-xs font-medium text-gray-500 uppercase mb-1">
                          {t('appointmentDetail.overview.endDate', 'End Date')}
                        </dt>
                        <dd className="mt-1 text-sm font-semibold text-gray-900">
                          {appointment.scheduled_end ? formatDate(new Date(appointment.scheduled_end)) : '—'}
                        </dd>
                      </div>
                    </>
                  )}

                  {/* Duration of appointment */}
                  <div>
                    <dt className="text-xs font-medium text-gray-500 uppercase mb-1">
                      {t('appointmentDetail.overview.duration', 'Duration')}
                    </dt>
                    <dd className="mt-1 text-sm font-semibold text-gray-900">
                      {getDurationDisplay()}
                    </dd>
                  </div>

                  {/* Instructor name (if lesson) */}
                  {appointment.instructor_name && appointment.service_category_name && appointment.service_category_name.toLowerCase() === 'lessons' && (
                    <div>
                      <dt className="text-xs font-medium text-gray-500 uppercase mb-1">
                        {t('appointmentDetail.overview.instructor', 'Instructor')}
                      </dt>
                      <dd className="mt-1 text-sm font-semibold text-gray-900 flex items-center gap-2">
                        <span>{appointment.instructor_name}</span>
                        {appointment.instructor_id && onViewInstructor && (
                          <button
                            onClick={() => onViewInstructor({ id: appointment.instructor_id, fullname: appointment.instructor_name })}
                            className="inline-flex items-center justify-center p-1 rounded text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                            title={t('appointmentDetail.overview.viewInstructor', 'View Instructor')}
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </button>
                        )}
                      </dd>
                    </div>
                  )}

                  {/* Status */}
                  <div>
                    <dt className="text-xs font-medium text-gray-500 uppercase mb-1">
                      {t('appointmentDetail.overview.status', 'Status')}
                    </dt>
                    <dd className="mt-1">
                      <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${statusStyle.pill}`}>
                        {formatStatusDisplay(displayStatus)}
                      </span>
                    </dd>
                  </div>
                </dl>
              </div>
            </div>

            {/* Appointment Info Card - Right */}
            <div className="w-full lg:w-80">
              <DetailInfoPanel
                title={t('appointmentDetail.appointmentInfo', 'Appointment Information')}
                onEdit={() => onEdit?.(appointment)}
                onDelete={handleDelete}
                user={user}
                deleting={deleting}
              >
                <dl className="space-y-4 text-sm">
                  <div>
                    <dt className="text-xs font-medium text-gray-500 uppercase">{t('appointmentDetail.info.id', 'ID')}</dt>
                    <dd className="mt-1 text-gray-900 font-mono">#{appointment.id}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-gray-500 uppercase">{t('appointmentDetail.info.customer', 'Customer')}</dt>
                    <dd className="mt-1 text-gray-900">{appointment.customer_name || '—'}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-gray-500 uppercase">{t('appointmentDetail.info.service', 'Service')}</dt>
                    <dd className="mt-1 text-gray-900">{appointment.service_name || '—'}</dd>
                  </div>
                  {appointment.service_package_name && (
                    <div>
                      <dt className="text-xs font-medium text-gray-500 uppercase">{t('appointmentDetail.info.servicePackage', 'Service Package')}</dt>
                      <dd className="mt-1 text-gray-900">{appointment.service_package_name}</dd>
                    </div>
                  )}
                  {appointment.credit_id && (
                    <div>
                      <dt className="text-xs font-medium text-gray-500 uppercase">{t('appointmentDetail.info.creditId', 'Credit ID')}</dt>
                      <dd className="mt-1 text-gray-900 font-mono">#{appointment.credit_id}</dd>
                    </div>
                  )}
                  <div>
                    <dt className="text-xs font-medium text-gray-500 uppercase">{t('appointmentDetail.info.scheduledStart', 'Scheduled Start')}</dt>
                    <dd className="mt-1 text-gray-900">{formatDateTime(appointment.scheduled_start)}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-gray-500 uppercase">{t('appointmentDetail.info.scheduledEnd', 'Scheduled End')}</dt>
                    <dd className="mt-1 text-gray-900">{formatDateTime(appointment.scheduled_end)}</dd>
                  </div>
                  {appointment.duration_hours && (
                    <div>
                      <dt className="text-xs font-medium text-gray-500 uppercase">{t('appointmentDetail.info.durationHours', 'Duration (Hours)')}</dt>
                      <dd className="mt-1 text-gray-900">{appointment.duration_hours}</dd>
                    </div>
                  )}
                  {appointment.duration_days && (
                    <div>
                      <dt className="text-xs font-medium text-gray-500 uppercase">{t('appointmentDetail.info.durationDays', 'Duration (Days)')}</dt>
                      <dd className="mt-1 text-gray-900">{appointment.duration_days}</dd>
                    </div>
                  )}
                  {appointment.duration_months && (
                    <div>
                      <dt className="text-xs font-medium text-gray-500 uppercase">{t('appointmentDetail.info.durationMonths', 'Duration (Months)')}</dt>
                      <dd className="mt-1 text-gray-900">{appointment.duration_months}</dd>
                    </div>
                  )}
                  <div>
                    <dt className="text-xs font-medium text-gray-500 uppercase">{t('appointmentDetail.info.status', 'Status')}</dt>
                    <dd className="mt-1 text-gray-900 capitalize">{appointment.status || '—'}</dd>
                  </div>
                  {appointment.instructor_name && (
                    <div>
                      <dt className="text-xs font-medium text-gray-500 uppercase">{t('appointmentDetail.info.instructor', 'Instructor')}</dt>
                      <dd className="mt-1 text-gray-900">{appointment.instructor_name}</dd>
                    </div>
                  )}
                  {appointment.staff_name && (
                    <div>
                      <dt className="text-xs font-medium text-gray-500 uppercase">{t('appointmentDetail.info.staff', 'Staff')}</dt>
                      <dd className="mt-1 text-gray-900">{appointment.staff_name}</dd>
                    </div>
                  )}
                  {appointment.attendee_name && (
                    <div>
                      <dt className="text-xs font-medium text-gray-500 uppercase">{t('appointmentDetail.info.attendee', 'Attendee Name')}</dt>
                      <dd className="mt-1 text-gray-900">{appointment.attendee_name}</dd>
                    </div>
                  )}
                  <div>
                    <dt className="text-xs font-medium text-gray-500 uppercase">{t('appointmentDetail.info.note', 'Note')}</dt>
                    <dd className="mt-1 text-gray-900 whitespace-pre-wrap">{appointment.note || '—'}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-gray-500 uppercase">{t('appointmentDetail.info.createdAt', 'Created At')}</dt>
                    <dd className="mt-1 text-gray-900">{formatDateTime(appointment.created_at)}</dd>
                  </div>
                  {appointment.updated_at && (
                    <div>
                      <dt className="text-xs font-medium text-gray-500 uppercase">{t('appointmentDetail.info.updatedAt', 'Updated At')}</dt>
                      <dd className="mt-1 text-gray-900">{formatDateTime(appointment.updated_at)}</dd>
                    </div>
                  )}
                  {appointment.completed_at && (
                    <div>
                      <dt className="text-xs font-medium text-gray-500 uppercase">{t('appointmentDetail.info.completedAt', 'Completed At')}</dt>
                      <dd className="mt-1 text-gray-900">{formatDateTime(appointment.completed_at)}</dd>
                    </div>
                  )}
                  {appointment.cancelled_at && (
                    <div>
                      <dt className="text-xs font-medium text-gray-500 uppercase">{t('appointmentDetail.info.cancelledAt', 'Cancelled At')}</dt>
                      <dd className="mt-1 text-gray-900">{formatDateTime(appointment.cancelled_at)}</dd>
                    </div>
                  )}
                  {appointment.created_by_name && (
                    <div>
                      <dt className="text-xs font-medium text-gray-500 uppercase">{t('appointmentDetail.info.createdBy', 'Created By')}</dt>
                      <dd className="mt-1 text-gray-900">{appointment.created_by_name}</dd>
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

export default AppointmentDetail

