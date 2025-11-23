import { useTranslation } from 'react-i18next'
import { useSettings } from '../../context/SettingsContext'

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

  // Get appointments for a specific date
  const getAppointmentsForDate = (date) => {
    const dateStr = date.toDateString()
    return appointments.filter(apt => {
      const aptDate = new Date(apt.scheduled_start)
      return aptDate.toDateString() === dateStr
    }).sort((a, b) => 
      new Date(a.scheduled_start) - new Date(b.scheduled_start)
    )
  }

  const weekDays = getWeekDays()
  const today = new Date()
  const hours = Array.from({ length: 24 }, (_, i) => i)

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
      <div className="overflow-y-auto max-h-[600px]">
        {hours.map((hour) => (
          <div key={hour} className="grid grid-cols-8 border-b border-gray-100">
            <div className="p-2 text-xs text-gray-500 bg-gray-50 border-r border-gray-200 text-right pr-3">
              {hour.toString().padStart(2, '0')}:00
            </div>
            {weekDays.map((date, dayIndex) => {
              const dayAppointments = getAppointmentsForDate(date)
              const hourAppointments = dayAppointments.filter(apt => {
                const aptHour = new Date(apt.scheduled_start).getHours()
                return aptHour === hour
              })
              const isToday = date.toDateString() === today.toDateString()

              return (
                <div
                  key={dayIndex}
                  className={`min-h-[60px] border-r border-gray-100 last:border-r-0 p-1 ${
                    isToday ? 'bg-blue-50/30' : 'bg-white'
                  } hover:bg-gray-50 transition-colors cursor-pointer`}
                  onClick={() => onDateClick(date)}
                >
                  {hourAppointments.map((apt) => {
                    const status = apt.status || 'scheduled'
                    const statusColor = statusColors[status] || statusColors.scheduled
                    const startTime = new Date(apt.scheduled_start)
                    const endTime = new Date(apt.scheduled_end)
                    const duration = (endTime - startTime) / (1000 * 60) // minutes
                    const height = Math.max(30, (duration / 60) * 60) // min 30px, scale by hours

                    return (
                      <div
                        key={apt.id}
                        onClick={(e) => {
                          e.stopPropagation()
                          onViewAppointment?.({ id: apt.id })
                        }}
                        className={`text-xs p-1.5 rounded mb-1 ${statusColor} cursor-pointer hover:opacity-80`}
                        style={{ minHeight: `${height}px` }}
                        title={`${apt.customer_name || '—'} - ${formatTime(startTime)} - ${formatTime(endTime)}`}
                      >
                        <div className="font-medium truncate">{apt.customer_name || '—'}</div>
                        <div className="text-xs opacity-75">
                          {formatTime(startTime)} - {formatTime(endTime)}
                        </div>
                        {apt.service_name && (
                          <div className="text-xs opacity-60 truncate">{apt.service_name}</div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )
            })}
          </div>
        ))}
      </div>
    </div>
  )
}

export default CalendarWeekView

