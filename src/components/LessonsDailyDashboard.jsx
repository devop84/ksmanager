import { useEffect, useState } from 'react'
import sql from '../lib/neon'

function LessonsDailyDashboard({ onEditOrder = () => {} }) {
  const [lessons, setLessons] = useState([])
  const [instructors, setInstructors] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date()
    return today.toISOString().split('T')[0] // Format: YYYY-MM-DD
  })

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
              name: row?.instructor_name || 'Unknown'
            }
          })
          .filter((inst) => inst.id) // Ensure we have a valid ID
          .sort((a, b) => a.name.localeCompare(b.name))

        setInstructors(uniqueInstructors)
      } catch (err) {
        console.error('Failed to load lessons:', err)
        setError('Unable to load lessons. Please try again later.')
      } finally {
        setLoading(false)
      }
    }

    fetchLessons()
  }, [selectedDate])

  // Total minutes in the day (7am to 7pm = 12 hours = 720 minutes)
  const TOTAL_MINUTES = 12 * 60 // 720 minutes

  // Generate hour labels for the timeline
  const generateHourLabels = () => {
    const labels = []
    for (let hour = 7; hour <= 19; hour++) {
      const displayHour = hour < 12 ? hour : hour === 12 ? 12 : hour - 12
      const ampm = hour < 12 ? 'AM' : 'PM'
      labels.push({
        hour,
        label: `${displayHour}:00 ${ampm}`,
        position: ((hour - 7) / 12) * 100 // Percentage position
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

  // Get lessons for an instructor and calculate their precise positions
  const getInstructorLessons = (instructorId) => {
    const [year, month, day] = selectedDate.split('-').map(Number)
    const dayStart = new Date(year, month - 1, day, 7, 0, 0) // 7am on selected date
    
    return lessons
      .filter((lesson) => lesson.instructor_id === instructorId)
      .map((lesson) => {
        const lessonStart = new Date(lesson.starting)
        const lessonEnd = new Date(lesson.ending)
        
        // Calculate minutes from start of day (7am = 0)
        // Clip to the visible window (7am-7pm)
        const startMinutes = Math.max(0, Math.min(TOTAL_MINUTES, (lessonStart - dayStart) / (1000 * 60)))
        const endMinutes = Math.max(0, Math.min(TOTAL_MINUTES, (lessonEnd - dayStart) / (1000 * 60)))
        const duration = Math.max(0, endMinutes - startMinutes)
        
        // Calculate percentage positions (0% = 7am, 100% = 7pm)
        const leftPercent = (startMinutes / TOTAL_MINUTES) * 100
        const widthPercent = (duration / TOTAL_MINUTES) * 100
        
        // Format time for display
        const startStr = lessonStart.toLocaleTimeString('en-US', { 
          hour: 'numeric', 
          minute: '2-digit',
          hour12: true 
        })
        const endStr = lessonEnd.toLocaleTimeString('en-US', { 
          hour: 'numeric', 
          minute: '2-digit',
          hour12: true 
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
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Daily Lessons</h2>
        <div className="text-gray-600">Loading...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-xl bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Daily Lessons</h2>
        <div className="text-red-600">{error}</div>
      </div>
    )
  }

  return (
    <div className="rounded-xl bg-white p-4 sm:p-6 shadow-sm" style={{ width: '100%', minWidth: '800px' }}>
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-4 mb-3 sm:mb-4">
        <h2 className="text-lg sm:text-xl font-semibold text-gray-800">Daily Lessons</h2>
        
        {/* Date navigation */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            onClick={goToPreviousDay}
            className="p-1.5 sm:p-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 transition-colors"
            aria-label="Previous day"
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
            aria-label="Go to today"
          >
            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </button>
          
          <button
            onClick={goToNextDay}
            className="p-1.5 sm:p-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 transition-colors"
            aria-label="Next day"
          >
            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {instructors.length === 0 ? (
        <div className="text-gray-600">No lessons scheduled for this date.</div>
      ) : (
        <div>
          {/* Instructor rows with lessons */}
          <div className="space-y-3 md:space-y-2" style={{ minWidth: '1200px' }}>
            {instructors.map((instructor) => {
              const instructorLessons = getInstructorLessons(instructor.id)
              
              return (
                <div key={instructor.id} className="flex items-center gap-2 sm:gap-4">
                  {/* Instructor name */}
                  <div className="w-20 sm:w-32 flex-shrink-0 text-xs sm:text-sm font-medium text-gray-800 left-0 bg-white z-10 pr-2">
                    {instructor.name}
                  </div>
                  
                  {/* Timeline row */}
                  <div className="flex-1 relative h-14 sm:h-12 bg-gray-50 rounded" style={{ minWidth: '1200px' }}>
                    {instructorLessons.map((lesson, idx) => (
                      <div
                        key={lesson.order_id || idx}
                        onClick={() => onEditOrder({ id: lesson.order_id })}
                        className={`absolute top-1 bottom-1 ${lesson.statusStyles.bg} ${lesson.statusStyles.border} rounded px-2 py-1.5 sm:py-1 flex flex-col justify-center overflow-hidden cursor-pointer hover:shadow-md transition-shadow ${lesson.status === 'cancelled' ? 'opacity-60' : ''}`}
                        style={{
                          left: `${lesson.leftPercent}%`,
                          width: `${lesson.widthPercent}%`,
                          minWidth: '60px'
                        }}
                        title={`${lesson.student_name || 'Unknown'}: ${lesson.startStr} - ${lesson.endStr} (${lesson.status}) - Click to edit`}
                      >
                        <div className={`text-xs sm:text-xs font-semibold ${lesson.statusStyles.text} truncate leading-tight`}>
                          {lesson.student_name || 'Unknown'}
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

export default LessonsDailyDashboard

