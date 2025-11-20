import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import sql from '../lib/neon'
import { useSettings } from '../context/SettingsContext'

function DailyLessons({ onEditOrder = () => {}, onViewCustomer = () => {} }) {
  const [lessons, setLessons] = useState([])
  const [instructors, setInstructors] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date()
    return today.toISOString().split('T')[0] // Format: YYYY-MM-DD
  })
  const [currentTime, setCurrentTime] = useState(new Date())
  const { formatTime } = useSettings()
  const { t } = useTranslation()

  // Update current time every minute and on mount/date change
  useEffect(() => {
    setCurrentTime(new Date()) // Update immediately on mount/date change
    
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 60000) // Update every minute

    return () => clearInterval(timer)
  }, [selectedDate])

  useEffect(() => {
    const fetchLessons = async () => {
      try {
        setLoading(true)
        setError(null)

        // Parse selected date
        const [year, month, day] = selectedDate.split('-').map(Number)
        const selectedDateObj = new Date(year, month - 1, day)

        // Create start and end timestamps for the entire day (00:00 to 23:59:59)
        const startOfDay = new Date(year, month - 1, day, 0, 0, 0)
        const endOfDay = new Date(year, month - 1, day, 23, 59, 59)

        // Convert to ISO strings for database query (database stores UTC)
        const startISO = startOfDay.toISOString()
        const endISO = endOfDay.toISOString()

        // Fetch lessons for the selected date
        const rows = await sql`
          SELECT
            ol.order_id,
            ol.instructor_id,
            i.fullname AS instructor_name,
            ol.student_id,
            c.fullname AS student_name,
            ol.starting,
            ol.ending,
            s.name AS service_name,
            o.cancelled
          FROM orders_lessons ol
          JOIN orders o ON o.id = ol.order_id
          JOIN services s ON s.id = o.service_id
          LEFT JOIN instructors i ON i.id = ol.instructor_id
          LEFT JOIN customers c ON c.id = ol.student_id
          WHERE ol.starting >= ${startISO}
            AND ol.starting < ${endISO}
            AND ol.instructor_id IS NOT NULL
          ORDER BY ol.starting ASC, i.fullname ASC
        `

        setLessons(rows || [])

        // Get unique instructors from the lessons
        const uniqueInstructors = [...new Set((rows || []).map((r) => r.instructor_id).filter(Boolean))]
          .map((id) => {
            const row = rows.find((r) => r.instructor_id === id)
            return {
              id: id,
              name: row?.instructor_name || t('dashboard.dailyLessons.unknown')
            }
          })
          .filter((inst) => inst.id) // Ensure we have a valid ID
          .sort((a, b) => a.name.localeCompare(b.name))

        setInstructors(uniqueInstructors)
      } catch (err) {
        console.error('Failed to load lessons:', err)
        setError(t('dashboard.dailyLessons.error.load'))
      } finally {
        setLoading(false)
      }
    }

    fetchLessons()
  }, [selectedDate])

  // Total minutes in the day (6am to 7pm = 13 hours = 780 minutes)
  const TOTAL_MINUTES = 13 * 60 // 780 minutes

  // Generate hour labels for the timeline
  const generateHourLabels = () => {
    const labels = []
    for (let hour = 6; hour <= 19; hour++) {
      const displayHour = hour < 12 ? hour : hour === 12 ? 12 : hour - 12
      // Use locale-aware time formatting
      const date = new Date()
      date.setHours(hour, 0, 0, 0)
      const timeStr = formatTime(date, { hour: 'numeric', minute: '2-digit' })
      labels.push({
        hour,
        label: timeStr,
        position: ((hour - 6) / 13) * 100 // Percentage position
      })
    }
    return labels
  }

  const hourLabels = generateHourLabels()

  // Determine lesson status
  const determineLessonStatus = (lesson) => {
    if (lesson.cancelled) return 'cancelled'
    const now = new Date()
    const start = new Date(lesson.starting)
    const end = new Date(lesson.ending)
    
    if (now < start) return 'pending'
    if (now >= start && now <= end) return 'in_progress'
    if (now > end) return 'completed'
    return 'pending'
  }

  // Get status styling (matching Orders page colors)
  const getStatusStyles = (status) => {
    switch (status) {
      case 'cancelled':
        return {
          bg: 'bg-red-100',
          border: 'border-red-300',
          text: 'text-red-800',
          textSecondary: 'text-red-600'
        }
      case 'completed':
        return {
          bg: 'bg-green-100',
          border: 'border-green-300',
          text: 'text-green-800',
          textSecondary: 'text-green-600'
        }
      case 'in_progress':
        return {
          bg: 'bg-blue-100',
          border: 'border-blue-300',
          text: 'text-blue-800',
          textSecondary: 'text-blue-600'
        }
      case 'pending':
      default:
        return {
          bg: 'bg-yellow-100',
          border: 'border-yellow-300',
          text: 'text-yellow-800',
          textSecondary: 'text-yellow-600'
        }
    }
  }

  // Date navigation functions
  const goToPreviousDay = () => {
    const date = new Date(selectedDate)
    date.setDate(date.getDate() - 1)
    setSelectedDate(date.toISOString().split('T')[0])
  }

  const goToNextDay = () => {
    const date = new Date(selectedDate)
    date.setDate(date.getDate() + 1)
    setSelectedDate(date.toISOString().split('T')[0])
  }

  const goToToday = () => {
    const today = new Date()
    setSelectedDate(today.toISOString().split('T')[0])
  }

  // Check if selected date is today
  const isToday = () => {
    const today = new Date()
    const todayYear = today.getFullYear()
    const todayMonth = today.getMonth() + 1
    const todayDay = today.getDate()
    const todayStr = `${todayYear}-${String(todayMonth).padStart(2, '0')}-${String(todayDay).padStart(2, '0')}`
    return selectedDate === todayStr
  }

  // Calculate current time position for today
  const getCurrentTimePosition = () => {
    if (!isToday()) return null

    const now = currentTime
    const [year, month, day] = selectedDate.split('-').map(Number)
    const dayStart = new Date(year, month - 1, day, 6, 0, 0) // 6am
    
    // Calculate minutes from start of day (6am = 0)
    const currentMinutes = (now - dayStart) / (1000 * 60)
    
    // Only show if within the visible window (6am-7pm)
    if (currentMinutes < 0 || currentMinutes > TOTAL_MINUTES) return null
    
    // Calculate percentage position (0% = 6am, 100% = 7pm)
    const positionPercent = (currentMinutes / TOTAL_MINUTES) * 100
    
    return Math.max(0, Math.min(100, positionPercent))
  }

  // Get lessons for an instructor and calculate their precise positions
  const getInstructorLessons = (instructorId) => {
    const [year, month, day] = selectedDate.split('-').map(Number)
    const dayStart = new Date(year, month - 1, day, 6, 0, 0) // 6am on selected date
    
    return lessons
      .filter((lesson) => lesson.instructor_id === instructorId)
      .map((lesson) => {
        const lessonStart = new Date(lesson.starting)
        const lessonEnd = new Date(lesson.ending)
        
        // Calculate minutes from start of day (6am = 0)
        // Clip to the visible window (6am-7pm)
        const startMinutes = Math.max(0, Math.min(TOTAL_MINUTES, (lessonStart - dayStart) / (1000 * 60)))
        const endMinutes = Math.max(0, Math.min(TOTAL_MINUTES, (lessonEnd - dayStart) / (1000 * 60)))
        const duration = Math.max(0, endMinutes - startMinutes)
        
        // Calculate percentage positions (0% = 6am, 100% = 7pm)
        const leftPercent = (startMinutes / TOTAL_MINUTES) * 100
        const widthPercent = (duration / TOTAL_MINUTES) * 100
        
        // Format time for display
        const startStr = formatTime(lesson.starting, {
          hour: 'numeric',
          minute: '2-digit',
        })
        const endStr = formatTime(lesson.ending, {
          hour: 'numeric',
          minute: '2-digit',
        })
        
        // Determine status
        const status = determineLessonStatus(lesson)
        const statusStyles = getStatusStyles(status)
        
        return {
          ...lesson,
          leftPercent: Math.max(0, Math.min(100, leftPercent)),
          widthPercent: Math.max(0.5, Math.min(100, widthPercent)), // Minimum 0.5% width
          startMinutes,
          endMinutes,
          startStr,
          endStr,
          status,
          statusStyles
        }
      })
      .sort((a, b) => a.startMinutes - b.startMinutes)
  }

  if (loading) {
    return (
      <div className="rounded-xl bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">{t('dashboard.dailyLessons.title')}</h2>
        <div className="text-gray-600">{t('common.loading')}</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-xl bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">{t('dashboard.dailyLessons.title')}</h2>
        <div className="text-red-600">{error}</div>
      </div>
    )
  }

  return (
    <div className="rounded-xl bg-white p-2 sm:p-4 md:p-6 shadow-sm w-full">
      <div className="sticky top-0 z-20 bg-white w-full flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3 md:gap-4 mb-2 sm:mb-3 md:mb-4 pb-2 sm:pb-3 md:pb-4 border-b border-gray-200">
        <h2 className="w-full sm:w-auto text-lg sm:text-xl font-semibold text-gray-800">{t('dashboard.dailyLessons.title')}</h2>
        
        {/* Date navigation */}
        <div className="w-full sm:w-auto flex items-center gap-1.5 sm:gap-2">
          <button
            onClick={goToPreviousDay}
            className="p-1.5 sm:p-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 transition-colors"
            aria-label={t('dashboard.dailyLessons.previousDay')}
          >
            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-2 sm:px-3 py-1.5 sm:py-2 rounded-lg border border-gray-300 bg-white text-xs sm:text-sm font-medium text-gray-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
          />
          
          <button
            onClick={goToToday}
            disabled={isToday()}
            className="p-1.5 sm:p-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white"
            aria-label={t('dashboard.dailyLessons.goToToday')}
          >
            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </button>
          
          <button
            onClick={goToNextDay}
            className="p-1.5 sm:p-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 transition-colors"
            aria-label={t('dashboard.dailyLessons.nextDay')}
          >
            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {instructors.length === 0 ? (
        <div className="text-gray-600">{t('common.empty')}</div>
      ) : (
        <div className="overflow-x-auto w-full">
          {/* Instructor rows with lessons */}
          <div className="space-y-3 md:space-y-2" style={{ minWidth: '800px' }}>
            {instructors.map((instructor) => {
              const instructorLessons = getInstructorLessons(instructor.id)
              const lessonCount = instructorLessons.length
              
              return (
                <div key={instructor.id} className="flex items-center gap-2 sm:gap-4">
                  {/* Instructor name */}
                  <div className="sticky left-0 w-20 sm:w-32 flex-shrink-0 text-xs sm:text-sm font-medium text-gray-800 bg-white z-20 pr-2 py-1">
                    {instructor.name}
                    <span className="text-gray-500 font-normal ml-1">({lessonCount})</span>
                  </div>
                  
                  {/* Timeline row */}
                  <div className="flex-1 relative h-14 sm:h-12 bg-gray-50 rounded" style={{ minWidth: '800px' }}>
                    {/* Current time indicator line - only for today */}
                    {(() => {
                      const timePosition = getCurrentTimePosition()
                      if (timePosition === null) return null
                      
                      return (
                        <div
                          className="absolute top-0 bottom-0 z-30 pointer-events-none"
                          style={{
                            left: `${timePosition}%`,
                            width: '2px',
                            transform: 'translateX(-50%)'
                          }}
                        >
                          <div className="w-full h-full bg-indigo-500"></div>
                        </div>
                      )
                    })()}
                    {instructorLessons.map((lesson, idx) => (
                      <div
                        key={lesson.order_id || idx}
                        onClick={() =>
                          lesson.student_id
                            ? onViewCustomer({ id: lesson.student_id })
                            : onEditOrder({ id: lesson.order_id })
                        }
                        className={`absolute top-1 bottom-1 ${lesson.statusStyles.bg} ${lesson.statusStyles.border} rounded px-2 py-1.5 sm:py-1 flex flex-col justify-center overflow-hidden cursor-pointer hover:shadow-md transition-shadow ${lesson.status === 'cancelled' ? 'opacity-60' : ''}`}
                        style={{
                          left: `${lesson.leftPercent}%`,
                          width: `${lesson.widthPercent}%`,
                          minWidth: '60px'
                        }}
                        title={`${lesson.student_name || t('dashboard.dailyLessons.unknown')}: ${lesson.startStr} - ${lesson.endStr} (${t(`common.status.${lesson.status}`, lesson.status)}) - ${t('dashboard.dailyLessons.tooltip.clickToEdit')}`}
                      >
                        <div className={`text-xs sm:text-xs font-semibold ${lesson.statusStyles.text} truncate leading-tight`}>
                          {lesson.student_name || t('dashboard.dailyLessons.unknown')}
                        </div>
                        <div className={`text-[10px] sm:text-xs ${lesson.statusStyles.textSecondary} opacity-75 truncate leading-tight mt-0.5`}>
                          {lesson.startStr} - {lesson.endStr}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

export default DailyLessons

