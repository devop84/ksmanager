import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import sql from '../../lib/neon'
import { useSettings } from '../../context/SettingsContext'

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

function DailyAppointments({ user, onViewAppointment }) {
  const { t } = useTranslation()
  const { formatDate, formatTime } = useSettings()
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [currentTime, setCurrentTime] = useState(new Date())

  // Update current time every minute to check for "In Progress" status
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date())
    }, 60000) // Update every minute
    
    return () => clearInterval(interval)
  }, [])

  // Fetch appointments for selected date
  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        setLoading(true)
        setError(null)

        // Get start and end of selected date
        const startOfDay = new Date(selectedDate)
        startOfDay.setHours(0, 0, 0, 0)
        const endOfDay = new Date(selectedDate)
        endOfDay.setHours(23, 59, 59, 999)

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
            c.fullname AS customer_name,
            s.name AS service_name,
            sc.name AS service_category_name,
            sp.name AS service_package_name,
            i.fullname AS instructor_name,
            st.fullname AS staff_name
          FROM scheduled_appointments sa
          LEFT JOIN customers c ON sa.customer_id = c.id
          LEFT JOIN services s ON sa.service_id = s.id
          LEFT JOIN service_categories sc ON s.category_id = sc.id
          LEFT JOIN service_packages sp ON sa.service_package_id = sp.id
          LEFT JOIN instructors i ON sa.instructor_id = i.id
          LEFT JOIN staff st ON sa.staff_id = st.id
          WHERE sa.scheduled_start <= ${endOfDay.toISOString()}
            AND sa.scheduled_end >= ${startOfDay.toISOString()}
            AND sa.cancelled_at IS NULL
          ORDER BY sa.scheduled_start ASC
        `
        
        setAppointments(result || [])
      } catch (err) {
        console.error('Failed to load appointments:', err)
        setError(t('dashboard.dailyAppointments.error.load', 'Unable to load appointments. Please try again later.'))
      } finally {
        setLoading(false)
      }
    }

    fetchAppointments()
  }, [selectedDate, t])

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
      return false
    }
  }

  // Get display status
  const getDisplayStatus = (appointment) => {
    if (isInProgress(appointment)) {
      return 'in_progress'
    }
    return appointment.status || 'scheduled'
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

  // Get duration display
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
      return '—'
    }
  }

  // Date navigation functions
  const goToToday = () => {
    setSelectedDate(new Date())
  }

  const goToPreviousDay = () => {
    const newDate = new Date(selectedDate)
    newDate.setDate(newDate.getDate() - 1)
    setSelectedDate(newDate)
  }

  const goToNextDay = () => {
    const newDate = new Date(selectedDate)
    newDate.setDate(newDate.getDate() + 1)
    setSelectedDate(newDate)
  }

  const isToday = () => {
    const today = new Date()
    return selectedDate.toDateString() === today.toDateString()
  }

  // Group appointments by category
  const groupedAppointments = appointments.reduce((acc, appointment) => {
    if (!appointment || !appointment.id) return acc
    
    const category = appointment.service_category_name?.toLowerCase() || 'other'
    
    if (category === 'lessons') {
      // Group lessons by instructor
      const instructorKey = appointment.instructor_name || 'No Instructor'
      if (!acc.lessons) acc.lessons = {}
      if (!acc.lessons[instructorKey]) {
        acc.lessons[instructorKey] = []
      }
      acc.lessons[instructorKey].push(appointment)
    } else if (category === 'rental') {
      if (!acc.rentals) acc.rentals = []
      acc.rentals.push(appointment)
    } else if (category === 'storage') {
      if (!acc.storage) acc.storage = []
      acc.storage.push(appointment)
    } else {
      if (!acc.other) acc.other = []
      acc.other.push(appointment)
    }
    
    return acc
  }, {})

  // Render appointment card
  const renderAppointmentCard = (appointment) => {
    if (!appointment || !appointment.id) return null
    const displayStatus = getDisplayStatus(appointment)
    const statusStyle = statusStyles[displayStatus] || statusStyles.scheduled
    const startDate = new Date(appointment.scheduled_start)
    const endDate = new Date(appointment.scheduled_end)
    
    return (
      <div
        key={appointment.id}
        onClick={() => onViewAppointment && onViewAppointment({ id: appointment.id })}
        className="p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors mb-2"
      >
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1 min-w-0">
            <div className="font-medium text-gray-900 text-sm truncate">{appointment.customer_name || '—'}</div>
            <div className="text-xs text-gray-600 mt-0.5 truncate">{appointment.service_name || '—'}</div>
          </div>
          <span className={`inline-flex items-center rounded-full border px-1.5 py-0.5 text-xs font-semibold flex-shrink-0 ml-2 ${statusStyle.pill}`}>
            {formatStatusDisplay(appointment.status, appointment)}
          </span>
        </div>
        <div className="mt-2 pt-2 border-t border-gray-100 space-y-1">
          <div className="flex items-center gap-1.5 text-xs text-gray-600">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="truncate">
              {formatTime(startDate)} - {formatTime(endDate)}
            </span>
          </div>
          {appointment.attendee_name && (
            <div className="flex items-center gap-1.5 text-xs text-gray-500">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <span className="truncate">{appointment.attendee_name}</span>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      {/* Header with date navigation */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-semibold text-gray-900">
          {t('dashboard.dailyAppointments.title', 'Daily Appointments')}
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={goToPreviousDay}
            className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
            aria-label={t('dashboard.dailyAppointments.previousDay', 'Previous day')}
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={goToToday}
            disabled={isToday()}
            className={`px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium transition-colors ${
              isToday()
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            {t('dashboard.dailyAppointments.goToToday', 'Today')}
          </button>
          <button
            onClick={goToNextDay}
            className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 transition-colors"
            aria-label={t('dashboard.dailyAppointments.nextDay', 'Next day')}
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {/* Selected date display */}
      <div className="mb-4">
        <p className="text-sm font-medium text-gray-700">
          {formatDate(selectedDate)}
        </p>
      </div>

      {/* Appointments grouped by category */}
      {loading ? (
        <div className="text-gray-600 text-sm text-center py-8">
          {t('dashboard.dailyAppointments.loading', 'Loading appointments...')}
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800 text-sm">
          {error}
        </div>
      ) : appointments.length === 0 ? (
        <div className="text-gray-500 text-sm text-center py-8">
          {t('dashboard.dailyAppointments.empty', 'No appointments scheduled for this date.')}
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Lessons Column - Grouped by Instructor */}
          <div className="bg-gray-50 rounded-lg border border-gray-200 p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">
              {t('dashboard.dailyAppointments.category.lessons', 'Lessons')}
              {groupedAppointments.lessons && (
                <span className="ml-2 text-xs font-normal text-gray-500">
                  ({Object.values(groupedAppointments.lessons).reduce((sum, apps) => sum + apps.length, 0)})
                </span>
              )}
            </h3>
            {!groupedAppointments.lessons || Object.keys(groupedAppointments.lessons).length === 0 ? (
              <p className="text-xs text-gray-500 text-center py-4">
                {t('dashboard.dailyAppointments.category.empty', 'No appointments')}
              </p>
            ) : (
              <div className="space-y-4">
                {Object.entries(groupedAppointments.lessons)
                  .sort(([a], [b]) => {
                    // Sort "No Instructor" to the end
                    if (a === 'No Instructor') return 1
                    if (b === 'No Instructor') return -1
                    return a.localeCompare(b)
                  })
                  .map(([instructorName, instructorAppointments]) => (
                    <div key={instructorName} className="mb-4 last:mb-0">
                      <div className="flex items-center gap-2 mb-2 pb-2 border-b border-gray-300">
                        <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        <span className="text-sm font-semibold text-gray-900">{instructorName}</span>
                        <span className="text-xs text-gray-500">({instructorAppointments.length})</span>
                      </div>
                      <div className="space-y-2">
                        {instructorAppointments
                          .sort((a, b) => new Date(a.scheduled_start) - new Date(b.scheduled_start))
                          .map(renderAppointmentCard)}
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </div>

          {/* Rentals Column */}
          <div className="bg-gray-50 rounded-lg border border-gray-200 p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">
              {t('dashboard.dailyAppointments.category.rentals', 'Rentals')}
              {groupedAppointments.rentals && (
                <span className="ml-2 text-xs font-normal text-gray-500">
                  ({groupedAppointments.rentals.length})
                </span>
              )}
            </h3>
            {!groupedAppointments.rentals || groupedAppointments.rentals.length === 0 ? (
              <p className="text-xs text-gray-500 text-center py-4">
                {t('dashboard.dailyAppointments.category.empty', 'No appointments')}
              </p>
            ) : (
              <div className="space-y-2">
                {groupedAppointments.rentals
                  .sort((a, b) => new Date(a.scheduled_start) - new Date(b.scheduled_start))
                  .map(renderAppointmentCard)}
              </div>
            )}
          </div>

          {/* Storage Column */}
          <div className="bg-gray-50 rounded-lg border border-gray-200 p-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">
              {t('dashboard.dailyAppointments.category.storage', 'Storage')}
              {groupedAppointments.storage && (
                <span className="ml-2 text-xs font-normal text-gray-500">
                  ({groupedAppointments.storage.length})
                </span>
              )}
            </h3>
            {!groupedAppointments.storage || groupedAppointments.storage.length === 0 ? (
              <p className="text-xs text-gray-500 text-center py-4">
                {t('dashboard.dailyAppointments.category.empty', 'No appointments')}
              </p>
            ) : (
              <div className="space-y-2">
                {groupedAppointments.storage
                  .sort((a, b) => new Date(a.scheduled_start) - new Date(b.scheduled_start))
                  .map(renderAppointmentCard)}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default DailyAppointments

