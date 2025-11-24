import { useTranslation } from 'react-i18next'
import { useSettings } from '../../context/SettingsContext'

function CalendarDayView({ currentDate, appointments, statusColors, onViewAppointment }) {
  const { t } = useTranslation()
  const { formatDate, formatTime } = useSettings()

  // Color mapping for service categories (same as month view)
  const categoryColors = {
    'Lesson': { bg: 'bg-purple-100', text: 'text-purple-900', border: 'border-purple-200', borderL: 'border-l-purple-200' },
    'Rental': { bg: 'bg-green-200', text: 'text-green-900', border: 'border-green-300', borderL: 'border-l-green-300' },
    'Storage': { bg: 'bg-yellow-100', text: 'text-yellow-900', border: 'border-yellow-200', borderL: 'border-l-yellow-200' },
    'Package': { bg: 'bg-orange-200', text: 'text-orange-900', border: 'border-orange-300', borderL: 'border-l-orange-300' },
    'Course': { bg: 'bg-indigo-200', text: 'text-indigo-900', border: 'border-indigo-300', borderL: 'border-l-indigo-300' },
    'Equipment': { bg: 'bg-red-200', text: 'text-red-900', border: 'border-red-300', borderL: 'border-l-red-300' },
    'Other': { bg: 'bg-gray-200', text: 'text-gray-900', border: 'border-gray-300', borderL: 'border-l-gray-300' },
  }

  // Get color for a category (with fallback for unknown categories)
  const getCategoryColor = (category) => {
    if (!category) return categoryColors['Other']
    
    // Try exact match first
    if (categoryColors[category]) {
      return categoryColors[category]
    }
    
    // Try case-insensitive match and handle plural forms
    const lowerCategory = category.toLowerCase().trim()
    for (const [key, value] of Object.entries(categoryColors)) {
      const lowerKey = key.toLowerCase()
      // Exact match
      if (lowerKey === lowerCategory) {
        return value
      }
      // Handle plural/singular variations (e.g., "Lessons" matches "Lesson")
      if (lowerCategory === lowerKey + 's' || lowerKey === lowerCategory + 's' || 
          lowerCategory.startsWith(lowerKey) || lowerKey.startsWith(lowerCategory)) {
        return value
      }
    }
    
    // Generate consistent color based on category name hash
    const colorPalette = [
      { bg: 'bg-cyan-100', text: 'text-cyan-800', border: 'border-cyan-200', borderL: 'border-l-cyan-200' },
      { bg: 'bg-teal-100', text: 'text-teal-800', border: 'border-teal-200', borderL: 'border-l-teal-200' },
      { bg: 'bg-emerald-100', text: 'text-emerald-800', border: 'border-emerald-200', borderL: 'border-l-emerald-200' },
      { bg: 'bg-lime-100', text: 'text-lime-800', border: 'border-lime-200', borderL: 'border-l-lime-200' },
      { bg: 'bg-amber-100', text: 'text-amber-800', border: 'border-amber-200', borderL: 'border-l-amber-200' },
      { bg: 'bg-rose-100', text: 'text-rose-800', border: 'border-rose-200', borderL: 'border-l-rose-200' },
      { bg: 'bg-violet-100', text: 'text-violet-800', border: 'border-violet-200', borderL: 'border-l-violet-200' },
      { bg: 'bg-fuchsia-100', text: 'text-fuchsia-800', border: 'border-fuchsia-200', borderL: 'border-l-fuchsia-200' },
    ]
    
    let hash = 0
    for (let i = 0; i < category.length; i++) {
      hash = category.charCodeAt(i) + ((hash << 5) - hash)
    }
    return colorPalette[Math.abs(hash) % colorPalette.length]
  }

  // Get appointments for the selected date (including multi-day appointments)
  const getAppointmentsForDate = () => {
    const dateStart = new Date(currentDate)
    dateStart.setHours(0, 0, 0, 0)
    const dateEnd = new Date(currentDate)
    dateEnd.setHours(23, 59, 59, 999)
    
    return appointments
      .filter(apt => {
        const aptStart = new Date(apt.scheduled_start)
        const aptEnd = new Date(apt.scheduled_end)
        // Check if appointment overlaps with this date
        return aptStart <= dateEnd && aptEnd >= dateStart
      })
      .sort((a, b) => new Date(a.scheduled_start) - new Date(b.scheduled_start))
  }

  const dayAppointments = getAppointmentsForDate()
  
  // Separate appointments by duration type
  // Multi-day appointments are those that span more than one day
  const multiDayAppointments = dayAppointments.filter(apt => {
    const aptStart = new Date(apt.scheduled_start)
    const aptEnd = new Date(apt.scheduled_end)
    aptStart.setHours(0, 0, 0, 0)
    aptEnd.setHours(0, 0, 0, 0)
    
    // Check if it spans multiple days
    const daysDiff = Math.ceil((aptEnd - aptStart) / (1000 * 60 * 60 * 24))
    
    // Also check if duration fields exist (if they're in the data)
    const hasDurationField = (apt.duration_days && apt.duration_days > 0) || 
                             (apt.duration_months && apt.duration_months > 0) ||
                             (apt.duration_weeks && apt.duration_weeks > 0)
    
    return daysDiff > 0 || hasDurationField
  })
  
  const hourlyAppointments = dayAppointments.filter(apt => {
    const aptStart = new Date(apt.scheduled_start)
    const aptEnd = new Date(apt.scheduled_end)
    aptStart.setHours(0, 0, 0, 0)
    aptEnd.setHours(0, 0, 0, 0)
    
    // Check if it spans multiple days
    const daysDiff = Math.ceil((aptEnd - aptStart) / (1000 * 60 * 60 * 24))
    
    // Also check if duration fields exist
    const hasDurationField = (apt.duration_days && apt.duration_days > 0) || 
                             (apt.duration_months && apt.duration_months > 0) ||
                             (apt.duration_weeks && apt.duration_weeks > 0)
    
    return daysDiff === 0 && !hasDurationField
  })
  
  // Show hours from 6am (6) to 8pm (20)
  const hours = Array.from({ length: 15 }, (_, i) => i + 6)
  const today = new Date()
  const isToday = currentDate.toDateString() === today.toDateString()

  // Assign appointments to lanes (columns) to handle overlaps
  const assignAppointmentsToLanes = () => {
    // Sort appointments by start time
    const sorted = [...hourlyAppointments].sort((a, b) => {
      return new Date(a.scheduled_start) - new Date(b.scheduled_start)
    })
    
    const lanes = [] // Array of arrays, each sub-array is a lane
    const appointmentLanes = {} // Map appointment ID to lane number
    
    sorted.forEach(apt => {
      const aptStart = new Date(apt.scheduled_start)
      const aptEnd = new Date(apt.scheduled_end)
      
      // Find the first lane where this appointment doesn't overlap
      let assignedLane = -1
      
      for (let laneIndex = 0; laneIndex < lanes.length; laneIndex++) {
        const lane = lanes[laneIndex]
        let hasOverlap = false
        
        // Check if this appointment overlaps with any appointment in this lane
        for (const existingAptId of lane) {
          const existingApt = hourlyAppointments.find(a => a.id === existingAptId)
          if (!existingApt) continue
          
          const existingStart = new Date(existingApt.scheduled_start)
          const existingEnd = new Date(existingApt.scheduled_end)
          
          // Check for overlap
          if (aptStart < existingEnd && aptEnd > existingStart) {
            hasOverlap = true
            break
          }
        }
        
        // If no overlap, assign to this lane
        if (!hasOverlap) {
          assignedLane = laneIndex
          break
        }
      }
      
      // If no available lane, create a new one
      if (assignedLane === -1) {
        assignedLane = lanes.length
        lanes.push([])
      }
      
      // Add appointment to the assigned lane
      lanes[assignedLane].push(apt.id)
      appointmentLanes[apt.id] = assignedLane
    })
    
    return {
      lanes: lanes.length,
      appointmentLanes
    }
  }
  
  const { lanes: maxLanes, appointmentLanes } = assignAppointmentsToLanes()

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden w-full">
      {/* Multi-day/week/month appointments row - Single line, stacked vertically */}
      {multiDayAppointments.length > 0 && (
        <div className="py-2 sm:py-3 border-b border-gray-200 bg-gray-50/50">
          <div className="flex flex-col gap-2">
            {multiDayAppointments.map((apt) => {
              const categoryColorObj = getCategoryColor(apt.service_category_name)
              const categoryColor = `${categoryColorObj.bg} ${categoryColorObj.text}`
              const startTime = new Date(apt.scheduled_start)
              const endTime = new Date(apt.scheduled_end)
              
              // Check if appointment starts/ends on the current day
              const currentDayStart = new Date(currentDate)
              currentDayStart.setHours(0, 0, 0, 0)
              const currentDayEnd = new Date(currentDate)
              currentDayEnd.setHours(23, 59, 59, 999)
              
              const aptStartDate = new Date(startTime)
              aptStartDate.setHours(0, 0, 0, 0)
              const aptEndDate = new Date(endTime)
              aptEndDate.setHours(0, 0, 0, 0)
              
              const startsOnDay = aptStartDate.getTime() === currentDayStart.getTime()
              const endsOnDay = aptEndDate.getTime() === currentDayStart.getTime()
              
              // Determine margins - responsive
              const leftMargin = startsOnDay ? 'ml-2 sm:ml-4' : 'ml-0'
              const rightMargin = endsOnDay ? 'mr-2 sm:mr-4' : 'mr-0'
              
              // Determine rounded corners
              const roundedLeft = startsOnDay ? 'rounded-l-lg' : 'rounded-l-none'
              const roundedRight = endsOnDay ? 'rounded-r-lg' : 'rounded-r-none'
              
              // Get border color for left border (only if starts today)
              const borderLColor = startsOnDay ? (categoryColorObj.borderL || 'border-l-gray-300') : ''
              const borderLWidth = startsOnDay ? 'border-l-4' : ''
              
              // Format duration
              let durationText = ''
              if (apt.duration_months && apt.duration_months > 0) {
                durationText = `${apt.duration_months} ${apt.duration_months === 1 ? 'month' : 'months'}`
              } else if (apt.duration_weeks && apt.duration_weeks > 0) {
                durationText = `${apt.duration_weeks} ${apt.duration_weeks === 1 ? 'week' : 'weeks'}`
              } else if (apt.duration_days && apt.duration_days > 0) {
                durationText = `${apt.duration_days} ${apt.duration_days === 1 ? 'day' : 'days'}`
              }
              
              return (
                <div
                  key={apt.id}
                  onClick={() => onViewAppointment?.({ id: apt.id })}
                  className={`py-2 px-2 sm:px-3 ${categoryColor} ${borderLColor} ${borderLWidth} ${roundedLeft} ${roundedRight} ${leftMargin} ${rightMargin} cursor-pointer hover:brightness-90 transition-all duration-200 shadow-sm`}
                >
                  <div className="flex flex-wrap items-center gap-2 sm:gap-3 text-xs sm:text-sm">
                    <span className="font-semibold">
                      {apt.customer_name || '—'}
                      {apt.attendee_name && (
                        <span className="font-normal text-gray-600 ml-1">({apt.attendee_name})</span>
                      )}
                    </span>
                    <span className="text-gray-600 hidden sm:inline">•</span>
                    <span className="break-words">{apt.service_name || '—'}</span>
                    {apt.service_category_name && (
                      <>
                        <span className="text-gray-600 hidden sm:inline">•</span>
                        <span className="text-gray-600">{apt.service_category_name}</span>
                      </>
                    )}
                    {apt.instructor_name && (
                      <>
                        <span className="text-gray-600 hidden sm:inline">•</span>
                        <span className="text-gray-600">{apt.instructor_name}</span>
                      </>
                    )}
                    <span className="text-gray-600 hidden sm:inline">•</span>
                    <span className="text-gray-600 text-xs">
                      {formatDate(startTime)} - {formatDate(endTime)}
                    </span>
                    {durationText && (
                      <>
                        <span className="text-gray-600 hidden sm:inline">•</span>
                        <span className="text-xs font-medium">{durationText}</span>
                      </>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Modern Time slots - continuous timeline */}
      <div className="overflow-y-auto max-h-[500px] sm:max-h-[700px]">
        <div className="flex relative">
          {/* Modern Time labels column - fixed width, responsive */}
          <div className="w-12 sm:w-16 md:w-20 bg-gradient-to-b from-gray-50 to-white border-r border-gray-200 sticky top-0 z-10 flex-shrink-0">
            {hours.map((hour) => (
              <div
                key={hour}
                className="h-[60px] flex items-start justify-end pr-1 sm:pr-2 md:pr-3 pt-2 text-[10px] sm:text-xs font-semibold text-gray-600 border-b border-gray-100"
              >
                {hour.toString().padStart(2, '0')}:00
              </div>
            ))}
          </div>
          
          {/* Appointments container - single continuous div with hour markers */}
          <div className="flex-1 relative bg-gray-50/30" style={{ height: `${hours.length * 60}px` }}>
            {/* Hour markers */}
            {hours.map((hour) => (
              <div
                key={hour}
                className="absolute left-0 right-0 border-b border-gray-200"
                style={{ top: `${(hour - 6) * 60}px` }}
              />
            ))}
            
            {hourlyAppointments.map((apt) => {
              const categoryColorObj = getCategoryColor(apt.service_category_name)
              const categoryColor = `${categoryColorObj.bg} ${categoryColorObj.text} ${categoryColorObj.border}`
              const borderLColor = categoryColorObj.borderL || 'border-l-gray-300'
              const startTime = new Date(apt.scheduled_start)
              const endTime = new Date(apt.scheduled_end)
              
              // Calculate position from 6am (hour 6)
              const startHour = startTime.getHours()
              const startMinutes = startTime.getMinutes()
              const endHour = endTime.getHours()
              const endMinutes = endTime.getMinutes()
              
              // Position from top: (hour - 6) * 60px + minutes
              const top = ((startHour - 6) * 60) + startMinutes
              
              // Calculate duration in minutes
              const duration = ((endHour - startHour) * 60) + (endMinutes - startMinutes)
              const height = Math.max(60, duration) // min 60px
              
              // Calculate width and left position based on lane assignment
              const lane = appointmentLanes[apt.id] || 0
              const margin = 6 // 6px margin on each side
              const widthPercent = 100 / maxLanes
              const leftPercent = lane * widthPercent
              const width = `calc(${widthPercent}% - ${margin * 2}px)`
              const left = `calc(${leftPercent}% + ${margin}px)`

              return (
                <div
                  key={apt.id}
                  onClick={() => onViewAppointment?.({ id: apt.id })}
                  className={`absolute rounded-lg shadow-md ${categoryColor} ${borderLColor} cursor-pointer hover:shadow-lg transition-all duration-200 hover:brightness-90 border-l-4 p-2 sm:p-3`}
                  style={{ 
                    top: `${top + margin}px`,
                    left: left,
                    width: width,
                    minHeight: `${height - (margin * 2)}px`
                  }}
                >
                  <div className="font-semibold text-xs sm:text-sm mb-1 sm:mb-1.5 text-gray-900">
                    {apt.customer_name || '—'}
                    {apt.attendee_name && (
                      <span className="text-gray-700 font-normal ml-1">({apt.attendee_name})</span>
                    )}
                  </div>
                  <div className="text-[10px] sm:text-xs text-gray-700 mb-1 sm:mb-1.5">
                    {apt.service_name || '—'}
                    {apt.instructor_name && (
                      <span className="text-gray-600 ml-1 sm:ml-2">• {apt.instructor_name}</span>
                    )}
                  </div>
                  <div className="text-[10px] sm:text-xs font-medium text-gray-600">
                    {formatTime(startTime)} - {formatTime(endTime)}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

export default CalendarDayView
