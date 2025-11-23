import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import sql from '../../lib/neon'
import { useSettings } from '../../context/SettingsContext'

const statusColors = {
  scheduled: 'text-blue-700 bg-blue-50 border-blue-100',
  in_progress: 'text-indigo-700 bg-indigo-50 border-indigo-100',
  completed: 'text-emerald-700 bg-emerald-50 border-emerald-100',
  cancelled: 'text-rose-700 bg-rose-50 border-rose-100',
  no_show: 'text-amber-700 bg-amber-50 border-amber-100',
  rescheduled: 'text-purple-700 bg-purple-50 border-purple-100'
}

function DailyAppointments({ onViewAppointment }) {
  const { t } = useTranslation()
  const { formatDate, formatTime } = useSettings()
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        setLoading(true)
        setError(null)

        const startOfDay = new Date(selectedDate)
        startOfDay.setHours(0, 0, 0, 0)
        const endOfDay = new Date(selectedDate)
        endOfDay.setHours(23, 59, 59, 999)

        const result = await sql`
          SELECT 
            sa.id,
            sa.scheduled_start,
            sa.scheduled_end,
            sa.status,
            sa.attendee_name,
            c.fullname AS customer_name,
            s.name AS service_name,
            sc.name AS service_category_name,
            i.fullname AS instructor_name
          FROM scheduled_appointments sa
          LEFT JOIN customers c ON sa.customer_id = c.id
          LEFT JOIN services s ON sa.service_id = s.id
          LEFT JOIN service_categories sc ON s.category_id = sc.id
          LEFT JOIN instructors i ON sa.instructor_id = i.id
          WHERE sa.scheduled_start <= ${endOfDay.toISOString()}
            AND sa.scheduled_end >= ${startOfDay.toISOString()}
            AND sa.cancelled_at IS NULL
          ORDER BY sa.scheduled_start ASC
        `
        
        setAppointments(result || [])
      } catch (err) {
        console.error('Failed to load appointments:', err)
        setError(t('dashboard.dailyAppointments.error.load', 'Unable to load appointments'))
      } finally {
        setLoading(false)
      }
    }

    fetchAppointments()
  }, [selectedDate, t])

  const changeDate = (days) => {
    const newDate = new Date(selectedDate)
    newDate.setDate(newDate.getDate() + days)
    setSelectedDate(newDate)
  }

  const isToday = selectedDate.toDateString() === new Date().toDateString()

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">
          {t('dashboard.dailyAppointments.title', 'Daily Appointments')}
        </h2>
        <div className="flex items-center gap-2">
          <button
            onClick={() => changeDate(-1)}
            className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50"
            aria-label={t('dashboard.dailyAppointments.previousDay', 'Previous day')}
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <button
            onClick={() => setSelectedDate(new Date())}
            disabled={isToday}
            className={`px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium ${
              isToday ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            {t('dashboard.dailyAppointments.goToToday', 'Today')}
          </button>
          <button
            onClick={() => changeDate(1)}
            className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50"
            aria-label={t('dashboard.dailyAppointments.nextDay', 'Next day')}
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      <p className="text-sm font-medium text-gray-700 mb-4">
        {formatDate(selectedDate)}
      </p>

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
        <div className="space-y-2">
          {appointments.map((appointment) => {
            const status = appointment.status || 'scheduled'
            const statusColor = statusColors[status] || statusColors.scheduled
            const startTime = new Date(appointment.scheduled_start)
            const endTime = new Date(appointment.scheduled_end)
            const isLesson = appointment.service_category_name?.toLowerCase() === 'lessons'

            return (
              <div
                key={appointment.id}
                onClick={() => onViewAppointment?.({ id: appointment.id })}
                className="p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-gray-900 text-sm">
                      {appointment.customer_name || '—'}
                      {isLesson && appointment.attendee_name && (
                        <span className="text-gray-600 font-normal"> ({appointment.attendee_name})</span>
                      )}
                    </div>
                    <div className="text-xs text-gray-600 mt-1">
                      {appointment.service_name || '—'}
                      {isLesson && appointment.instructor_name && (
                        <span className="text-gray-500 ml-2">• {appointment.instructor_name}</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500 mt-2">
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>{formatTime(startTime)} - {formatTime(endTime)}</span>
                    </div>
                    {!isLesson && appointment.attendee_name && (
                      <div className="text-xs text-gray-500 mt-1">
                        {appointment.attendee_name}
                      </div>
                    )}
                  </div>
                  <span className={`inline-flex items-center rounded-full border px-2 py-1 text-xs font-semibold ml-2 ${statusColor}`}>
                    {t(`schedule.status.${status}`, status.replace(/_/g, ' ').toUpperCase())}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default DailyAppointments

