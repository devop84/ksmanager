import { useTranslation } from 'react-i18next'
import { useSettings } from '../../context/SettingsContext'
import { useMemo } from 'react'

function CalendarWeekView({ currentDate, appointments, statusColors, onViewAppointment, onDateClick }) {
  const { t } = useTranslation()
  const { formatDate, formatTime } = useSettings()

  // Get week days (Sunday to Saturday)
  const getWeekDays = () => {
    const start = new Date(currentDate)
    const day = start.getDay()
    start.setDate(start.getDate() - day)
    start.setHours(0, 0, 0, 0)
    
    const days = []
    for (let i = 0; i < 7; i++) {
      const date = new Date(start)
      date.setDate(start.getDate() + i)
      days.push(date)
    }
    return days
  }

  const weekDays = getWeekDays()
  const today = new Date()
  const hours = Array.from({ length: 24 }, (_, i) => i)

  // Separate single-day and multi-day appointments
  const { singleDayAppointments, multiDayAppointments } = useMemo(() => {
    const singleDay = []
    const multiDay = []
    
    appointments.forEach(apt => {
      const aptStart = new Date(apt.scheduled_start)
      const aptEnd = new Date(apt.scheduled_end)
      const aptStartDate = new Date(aptStart)
      aptStartDate.setHours(0, 0, 0, 0)
      const aptEndDate = new Date(aptEnd)
      aptEndDate.setHours(0, 0, 0, 0)
      
      if (aptStartDate.getTime() === aptEndDate.getTime()) {
        singleDay.push(apt)
      } else {
        multiDay.push(apt)
      }
    })
    
    return { singleDayAppointments: singleDay, multiDayAppointments: multiDay }
  }, [appointments])

  // Get appointments for a specific date (single-day only)
  const getAppointmentsForDate = (date) => {
    const dateStart = new Date(date)
    dateStart.setHours(0, 0, 0, 0)
    const dateEnd = new Date(date)
    dateEnd.setHours(23, 59, 59, 999)
    
    return singleDayAppointments.filter(apt => {
      const aptStart = new Date(apt.scheduled_start)
      return aptStart >= dateStart && aptStart <= dateEnd
    })
  }

  // Process multi-day appointments
  const processedMultiDayAppointments = useMemo(() => {
    return multiDayAppointments.map(apt => {
      const aptStart = new Date(apt.scheduled_start)
      const aptEnd = new Date(apt.scheduled_end)
      const aptStartDate = new Date(aptStart)
      aptStartDate.setHours(0, 0, 0, 0)
      const aptEndDate = new Date(aptEnd)
      aptEndDate.setHours(0, 0, 0, 0)
      
      let startCol = -1
      let endCol = -1
      
      weekDays.forEach((date, index) => {
        const dateOnly = new Date(date)
        dateOnly.setHours(0, 0, 0, 0)
        
        if (dateOnly.getTime() === aptStartDate.getTime()) {
          startCol = index
        }
        if (dateOnly.getTime() === aptEndDate.getTime()) {
          endCol = index
        }
      })
      
      if (startCol === -1 && aptStartDate < weekDays[0]) {
        startCol = 0
      }
      if (endCol === -1 && aptEndDate > weekDays[6]) {
        endCol = 6
      }
      
      if (startCol === -1 || endCol === -1) return null
      
      const startHour = aptStart.getHours()
      const startMinutes = aptStart.getMinutes()
      
      return {
        ...apt,
        startCol,
        endCol,
        startHour,
        startMinutes
      }
    }).filter(apt => apt !== null)
  }, [multiDayAppointments, weekDays])

  // Group multi-day appointments by hour and assign lanes
  const multiDayByHour = useMemo(() => {
    const byHour = {}
    
    // Group by hour
    processedMultiDayAppointments.forEach(apt => {
      const hour = apt.startHour
      if (!byHour[hour]) byHour[hour] = []
      byHour[hour].push(apt)
    })
    
    // Assign lanes for each hour
    Object.keys(byHour).forEach(hourStr => {
      const hour = parseInt(hourStr)
      const hourApts = byHour[hour]
      
      // Sort by start column
      hourApts.sort((a, b) => {
        if (a.startCol !== b.startCol) return a.startCol - b.startCol
        return a.id - b.id
      })
      
      // Assign to lanes
      const lanes = []
      hourApts.forEach(apt => {
        let placed = false
        for (let lane = 0; lane < lanes.length; lane++) {
          const laneApts = lanes[lane]
          const overlaps = laneApts.some(laneApt => 
            !(apt.endCol < laneApt.startCol || apt.startCol > laneApt.endCol)
          )
          
          if (!overlaps) {
            laneApts.push(apt)
            apt.lane = lane
            placed = true
            break
          }
        }
        
        if (!placed) {
          apt.lane = lanes.length
          lanes.push([apt])
        }
      })
    })
    
    return byHour
  }, [processedMultiDayAppointments])

  // Calculate single-day appointment heights per hour and day
  const singleDayHeightsByHourDay = useMemo(() => {
    const heights = {}
    
    hours.forEach(hour => {
      heights[hour] = {}
      weekDays.forEach((date, dayIndex) => {
        const dayApts = getAppointmentsForDate(date)
        const hourApts = dayApts.filter(apt => {
          const aptHour = new Date(apt.scheduled_start).getHours()
          return aptHour === hour
        })
        
        const SINGLE_DAY_HEIGHT = 30
        const SINGLE_DAY_SPACING = 2
        
        let totalHeight = 0
        hourApts.forEach((apt, idx) => {
          if (idx > 0) totalHeight += SINGLE_DAY_SPACING
          const duration = (new Date(apt.scheduled_end) - new Date(apt.scheduled_start)) / (1000 * 60)
          totalHeight += Math.max(SINGLE_DAY_HEIGHT, (duration / 60) * 60)
        })
        
        heights[hour][dayIndex] = totalHeight
      })
    })
    
    return heights
  }, [hours, weekDays, singleDayAppointments])

  // Constants
  const HOUR_HEIGHT = 60
  const LANE_HEIGHT = 40
  const LANE_SPACING = 2
  const SINGLE_DAY_SPACING = 4

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      {/* Week day headers */}
      <div className="grid grid-cols-8 border-b border-gray-200">
        <div className="p-3 text-xs font-semibold text-gray-700 bg-gray-50 border-r border-gray-200">
          {t('calendar.time', 'Time')}
        </div>
        {weekDays.map((date, index) => {
          const isToday = date.toDateString() === today.toDateString()
          return (
            <div
              key={index}
              className={`p-3 text-center border-r border-gray-200 last:border-r-0 ${
                isToday ? 'bg-blue-50' : 'bg-gray-50'
              }`}
            >
              <div className={`text-xs font-semibold ${
                isToday ? 'text-blue-600' : 'text-gray-700'
              }`}>
                {t(`calendar.weekday.${['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'][index]}`, 
                    ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][index])}
              </div>
              <div className={`text-sm font-bold mt-1 ${
                isToday ? 'text-blue-600' : 'text-gray-900'
              }`}>
                {date.getDate()}
              </div>
            </div>
          )
        })}
      </div>

      {/* Time slots */}
      <div className="overflow-y-auto max-h-[600px] relative">
        {hours.map((hour) => {
          const hourMultiDay = multiDayByHour[hour] || []
          
          return (
            <div key={hour} className="grid grid-cols-8 border-b border-gray-100 relative">
              <div className="p-2 text-xs text-gray-500 bg-gray-50 border-r border-gray-200 text-right pr-3">
                {hour.toString().padStart(2, '0')}:00
              </div>
              {weekDays.map((date, dayIndex) => {
                const isToday = date.toDateString() === today.toDateString()
                const dayApts = getAppointmentsForDate(date)
                const hourApts = dayApts.filter(apt => {
                  const aptHour = new Date(apt.scheduled_start).getHours()
                  return aptHour === hour
                })

                return (
                  <div
                    key={dayIndex}
                    className={`min-h-[60px] border-r border-gray-100 last:border-r-0 p-1 relative ${
                      isToday ? 'bg-blue-50/30' : 'bg-white'
                    } hover:bg-gray-50 transition-colors cursor-pointer`}
                    onClick={() => onDateClick(date)}
                  >
                    {/* Single-day appointments */}
                    {hourApts.map((apt) => {
                      const status = apt.status || 'scheduled'
                      const statusColor = statusColors[status] || statusColors.scheduled
                      const startTime = new Date(apt.scheduled_start)
                      const endTime = new Date(apt.scheduled_end)
                      const duration = (endTime - startTime) / (1000 * 60)
                      const height = Math.max(30, (duration / 60) * 60)

                      return (
                        <div
                          key={apt.id}
                          onClick={(e) => {
                            e.stopPropagation()
                            onViewAppointment?.({ id: apt.id })
                          }}
                          className={`text-xs p-1.5 rounded mb-1 ${statusColor} cursor-pointer hover:opacity-80 relative z-30`}
                          style={{ minHeight: `${height}px` }}
                          title={`${apt.customer_name || '—'}${apt.service_name ? ` - ${apt.service_name}` : ''} - ${formatTime(startTime)} - ${formatTime(endTime)}`}
                        >
                          <div className="font-medium truncate">{apt.customer_name || '—'}</div>
                          {apt.service_name && (
                            <div className="text-xs opacity-70 truncate font-medium">{apt.service_name}</div>
                          )}
                          <div className="text-xs opacity-75">
                            {formatTime(startTime)} - {formatTime(endTime)}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                )
              })}
              
              {/* Multi-day appointments for this hour */}
              {hourMultiDay.map((aptData) => {
                const { startCol, endCol, lane = 0, startMinutes } = aptData
                const status = aptData.status || 'scheduled'
                const statusColor = statusColors[status] || statusColors.scheduled
                const startTime = new Date(aptData.scheduled_start)
                const endTime = new Date(aptData.scheduled_end)
                
                // Calculate max single-day height across all columns this appointment spans
                let maxSingleDayHeight = 0
                for (let col = startCol; col <= endCol; col++) {
                  maxSingleDayHeight = Math.max(maxSingleDayHeight, singleDayHeightsByHourDay[hour]?.[col] || 0)
                }
                
                // Calculate position
                const dayColumnWidth = 12.5
                const left = 12.5 + (startCol * dayColumnWidth)
                const width = (endCol - startCol + 1) * dayColumnWidth
                
                // Calculate top: hour offset + minutes offset + single-day height + lane offset
                const hourTop = hour * HOUR_HEIGHT
                const minutesOffset = (startMinutes / 60) * HOUR_HEIGHT
                const singleDayOffset = maxSingleDayHeight + (maxSingleDayHeight > 0 ? SINGLE_DAY_SPACING * 2 : 0)
                const laneOffset = lane * (LANE_HEIGHT + LANE_SPACING)
                const top = hourTop + minutesOffset + singleDayOffset + laneOffset
                
                const duration = (endTime - startTime) / (1000 * 60)
                const height = Math.max(LANE_HEIGHT, (duration / 60) * 60)
                
                let tooltip = `${aptData.customer_name || '—'}`
                if (aptData.service_name) {
                  tooltip += ` - ${aptData.service_name}`
                }
                tooltip += `\n${formatDate(startTime)} - ${formatDate(endTime)}`
                tooltip += `\n${formatTime(startTime)} - ${formatTime(endTime)}`
                
                return (
                  <div
                    key={`${aptData.id}-${hour}`}
                    onClick={(e) => {
                      e.stopPropagation()
                      onViewAppointment?.({ id: aptData.id })
                    }}
                    className={`absolute ${statusColor} rounded px-2 py-1 cursor-pointer hover:opacity-90 shadow-sm border border-current/20 z-10`}
                    style={{
                      left: `${left}%`,
                      width: `${width}%`,
                      top: `${top}px`,
                      minHeight: `${height}px`,
                      height: 'auto'
                    }}
                    title={tooltip}
                  >
                    <div className="flex items-center gap-1 text-xs h-full">
                      {startCol === 0 && (
                        <span className="text-[10px] font-bold flex-shrink-0">▶</span>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="font-medium truncate">{aptData.customer_name || '—'}</div>
                        {aptData.service_name && (
                          <div className="text-[10px] opacity-80 truncate">{aptData.service_name}</div>
                        )}
                        <div className="text-[10px] opacity-75">
                          {formatTime(startTime)} - {formatTime(endTime)}
                        </div>
                      </div>
                      {endCol === 6 && (
                        <span className="text-[10px] font-bold flex-shrink-0">◀</span>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default CalendarWeekView
