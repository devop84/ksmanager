import { useTranslation } from 'react-i18next'
import { useSettings } from '../../context/SettingsContext'

function CalendarMonthView({ currentDate, appointments, statusColors, onViewAppointment, onDateClick }) {
  const { t } = useTranslation()
  const { formatDate, formatTime } = useSettings()

  // Get first day of month and number of days
  const getMonthDays = () => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()
    
    const days = []
    
    // Add empty cells for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null)
    }
    
    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day))
    }
    
    return days
  }

  // Get appointments for a specific date
  const getAppointmentsForDate = (date) => {
    if (!date) return []
    
    const dateStr = date.toDateString()
    return appointments.filter(apt => {
      const aptDate = new Date(apt.scheduled_start)
      return aptDate.toDateString() === dateStr
    })
  }

  const days = getMonthDays()
  const today = new Date()
  const isCurrentMonth = currentDate.getMonth() === today.getMonth() && 
                         currentDate.getFullYear() === today.getFullYear()

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      {/* Week day headers */}
      <div className="grid grid-cols-7 border-b border-gray-200">
        {weekDays.map((day, index) => (
          <div
            key={index}
            className="p-3 text-center text-xs font-semibold text-gray-700 bg-gray-50 border-r border-gray-200 last:border-r-0"
          >
            {t(`calendar.weekday.${day.toLowerCase()}`, day)}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7">
        {days.map((date, index) => {
          const dayAppointments = getAppointmentsForDate(date)
          const isToday = date && 
                         date.toDateString() === today.toDateString() &&
                         isCurrentMonth
          const isOtherMonth = !date || date.getMonth() !== currentDate.getMonth()

          return (
            <div
              key={index}
              className={`min-h-[100px] border-r border-b border-gray-200 p-2 ${
                isOtherMonth ? 'bg-gray-50' : 'bg-white'
              } ${isToday ? 'bg-blue-50' : ''} hover:bg-gray-50 transition-colors cursor-pointer`}
              onClick={() => date && onDateClick(date)}
            >
              {date && (
                <>
                  <div className={`text-sm font-medium mb-1 ${
                    isToday ? 'text-blue-600 font-bold' : 
                    isOtherMonth ? 'text-gray-400' : 'text-gray-900'
                  }`}>
                    {date.getDate()}
                  </div>
                  <div className="space-y-1">
                    {dayAppointments.slice(0, 3).map((apt) => {
                      const status = apt.status || 'scheduled'
                      const statusColor = statusColors[status] || statusColors.scheduled
                      const startTime = new Date(apt.scheduled_start)
                      
                      return (
                        <div
                          key={apt.id}
                          onClick={(e) => {
                            e.stopPropagation()
                            onViewAppointment?.({ id: apt.id })
                          }}
                          className={`text-xs p-1 rounded truncate ${statusColor} cursor-pointer hover:opacity-80`}
                          title={`${apt.customer_name || '—'} - ${formatTime(startTime)}`}
                        >
                          <div className="font-medium truncate">{apt.customer_name || '—'}</div>
                          <div className="text-xs opacity-75">{formatTime(startTime)}</div>
                        </div>
                      )
                    })}
                    {dayAppointments.length > 3 && (
                      <div className="text-xs text-gray-500 font-medium px-1">
                        +{dayAppointments.length - 3} {t('calendar.more', 'more')}
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default CalendarMonthView

