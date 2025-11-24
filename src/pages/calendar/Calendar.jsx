import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import sql from '../../lib/neon'
import { useSettings } from '../../context/SettingsContext'
import PageHeader from '../../components/layout/PageHeader'
import CalendarMonthView from './CalendarMonthView'
import CalendarDayView from './CalendarDayView'

const statusColors = {
  scheduled: 'text-blue-900 bg-blue-200 border-blue-300',
  in_progress: 'text-indigo-900 bg-indigo-200 border-indigo-300',
  completed: 'text-emerald-900 bg-emerald-200 border-emerald-300',
  cancelled: 'text-rose-900 bg-rose-200 border-rose-300',
  no_show: 'text-amber-900 bg-amber-200 border-amber-300',
  rescheduled: 'text-purple-900 bg-purple-200 border-purple-300'
}

function Calendar({ onViewAppointment, onAddAppointment, onNavigateToAppointments }) {
  const { t } = useTranslation()
  const { formatDate } = useSettings()
  const [view, setView] = useState('month') // 'month', 'day'
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
          <div className="flex items-center gap-1">
            <button
              onClick={() => navigateDate(-1)}
              className="h-8 px-2 flex items-center justify-center rounded-lg border border-gray-300 hover:bg-gray-50"
              aria-label={t('calendar.navigation.previous', 'Previous')}
            >
              <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <button
              onClick={goToToday}
              className="h-8 px-3 flex items-center justify-center rounded-lg border border-gray-300 text-sm font-medium hover:bg-gray-50"
            >
              {t('calendar.navigation.today', 'Today')}
            </button>
            <span className="text-sm font-medium text-gray-700 px-2 min-w-[150px] text-center">
              {getViewTitle()}
            </span>
            <button
              onClick={() => navigateDate(1)}
              className="h-8 px-2 flex items-center justify-center rounded-lg border border-gray-300 hover:bg-gray-50"
              aria-label={t('calendar.navigation.next', 'Next')}
            >
              <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
              onNavigateToAppointments={onNavigateToAppointments}
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

