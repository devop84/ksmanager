import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import sql from '../../lib/neon'
import { useSettings } from '../../context/SettingsContext'
import PageHeader from '../../components/layout/PageHeader'
import CalendarMonthView from './CalendarMonthView'
import CalendarWeekView from './CalendarWeekView'
import CalendarDayView from './CalendarDayView'

const statusColors = {
  scheduled: 'text-blue-700 bg-blue-50 border-blue-100',
  in_progress: 'text-indigo-700 bg-indigo-50 border-indigo-100',
  completed: 'text-emerald-700 bg-emerald-50 border-emerald-100',
  cancelled: 'text-rose-700 bg-rose-50 border-rose-100',
  no_show: 'text-amber-700 bg-amber-50 border-amber-100',
  rescheduled: 'text-purple-700 bg-purple-50 border-purple-100'
}

function Calendar({ onViewAppointment, onAddAppointment }) {
  const { t } = useTranslation()
  const { formatDate } = useSettings()
  const [view, setView] = useState('month') // 'month', 'week', 'day'
  const [currentDate, setCurrentDate] = useState(new Date())
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  // Calculate date range based on view
  const getDateRange = () => {
    const start = new Date(currentDate)
    const end = new Date(currentDate)

    if (view === 'month') {
      // First day of month
      start.setDate(1)
      start.setHours(0, 0, 0, 0)
      // Last day of month
      end.setMonth(end.getMonth() + 1)
      end.setDate(0)
      end.setHours(23, 59, 59, 999)
    } else if (view === 'week') {
      // Start of week (Sunday)
      const day = start.getDay()
      start.setDate(start.getDate() - day)
      start.setHours(0, 0, 0, 0)
      // End of week (Saturday)
      end.setDate(start.getDate() + 6)
      end.setHours(23, 59, 59, 999)
    } else {
      // Day view
      start.setHours(0, 0, 0, 0)
      end.setHours(23, 59, 59, 999)
    }

    return { start, end }
  }

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        setLoading(true)
        setError(null)

        const { start, end } = getDateRange()

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
          WHERE sa.scheduled_start <= ${end.toISOString()}
            AND sa.scheduled_end >= ${start.toISOString()}
            AND sa.cancelled_at IS NULL
          ORDER BY sa.scheduled_start ASC
        `
        
        setAppointments(result || [])
      } catch (err) {
        console.error('Failed to load appointments:', err)
        setError(t('calendar.error.load', 'Unable to load appointments'))
      } finally {
        setLoading(false)
      }
    }

    fetchAppointments()
  }, [currentDate, view, t])

  const navigateDate = (direction) => {
    const newDate = new Date(currentDate)
    
    if (view === 'month') {
      newDate.setMonth(newDate.getMonth() + direction)
    } else if (view === 'week') {
      newDate.setDate(newDate.getDate() + (direction * 7))
    } else {
      newDate.setDate(newDate.getDate() + direction)
    }
    
    setCurrentDate(newDate)
  }

  const goToToday = () => {
    setCurrentDate(new Date())
  }

  const getViewTitle = () => {
    if (view === 'month') {
      return currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })
    } else if (view === 'week') {
      const { start } = getDateRange()
      const end = new Date(start)
      end.setDate(end.getDate() + 6)
      return `${formatDate(start)} - ${formatDate(end)}`
    } else {
      return formatDate(currentDate)
    }
  }

  return (
    <div className="p-4 md:p-6">
      <PageHeader
        title={t('calendar.title', 'Calendar')}
        description={t('calendar.description', 'View and manage your appointments')}
      />

      {/* View Controls */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          {/* View Toggle */}
          <div className="flex items-center gap-2 border border-gray-300 rounded-lg p-1">
            <button
              onClick={() => setView('month')}
              className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                view === 'month'
                  ? 'bg-indigo-600 text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              {t('calendar.view.month', 'Month')}
            </button>
            <button
              onClick={() => setView('week')}
              className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                view === 'week'
                  ? 'bg-indigo-600 text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              {t('calendar.view.week', 'Week')}
            </button>
            <button
              onClick={() => setView('day')}
              className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                view === 'day'
                  ? 'bg-indigo-600 text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              {t('calendar.view.day', 'Day')}
            </button>
          </div>

          {/* Date Navigation */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigateDate(-1)}
              className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50"
              aria-label={t('calendar.navigation.previous', 'Previous')}
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={goToToday}
              className="px-4 py-2 rounded-lg border border-gray-300 text-sm font-medium hover:bg-gray-50"
            >
              {t('calendar.navigation.today', 'Today')}
            </button>
            <span className="text-sm font-medium text-gray-700 px-3 min-w-[200px] text-center">
              {getViewTitle()}
            </span>
            <button
              onClick={() => navigateDate(1)}
              className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50"
              aria-label={t('calendar.navigation.next', 'Next')}
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Calendar View */}
      {loading ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
          <div className="text-gray-600">{t('calendar.loading', 'Loading appointments...')}</div>
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
          {error}
        </div>
      ) : (
        <>
          {view === 'month' && (
            <CalendarMonthView
              currentDate={currentDate}
              appointments={appointments}
              statusColors={statusColors}
              onViewAppointment={onViewAppointment}
              onDateClick={(date) => {
                setCurrentDate(date)
                setView('day')
              }}
            />
          )}
          {view === 'week' && (
            <CalendarWeekView
              currentDate={currentDate}
              appointments={appointments}
              statusColors={statusColors}
              onViewAppointment={onViewAppointment}
              onDateClick={(date) => {
                setCurrentDate(date)
                setView('day')
              }}
            />
          )}
          {view === 'day' && (
            <CalendarDayView
              currentDate={currentDate}
              appointments={appointments}
              statusColors={statusColors}
              onViewAppointment={onViewAppointment}
            />
          )}
        </>
      )}
    </div>
  )
}

export default Calendar

