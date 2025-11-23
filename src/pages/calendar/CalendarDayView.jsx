import { useTranslation } from 'react-i18next'
import { useSettings } from '../../context/SettingsContext'

function CalendarDayView({ currentDate, appointments, statusColors, onViewAppointment }) {
  const { t } = useTranslation()
  const { formatDate, formatTime } = useSettings()

  // Get appointments for the selected date
  const getAppointmentsForDate = () => {
    const dateStr = currentDate.toDateString()
    return appointments
      .filter(apt => {
        const aptDate = new Date(apt.scheduled_start)
        return aptDate.toDateString() === dateStr
      })
      .sort((a, b) => new Date(a.scheduled_start) - new Date(b.scheduled_start))
  }

  const dayAppointments = getAppointmentsForDate()
  const hours = Array.from({ length: 24 }, (_, i) => i)
  const today = new Date()
  const isToday = currentDate.toDateString() === today.toDateString()

  // Get appointments for a specific hour
  const getAppointmentsForHour = (hour) => {
    return dayAppointments.filter(apt => {
      const aptHour = new Date(apt.scheduled_start).getHours()
      return aptHour === hour
    })
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      {/* Day header */}
      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center justify-between">
          <div>
            <h3 className={`text-lg font-semibold ${isToday ? 'text-blue-600' : 'text-gray-900'}`}>
              {formatDate(currentDate)}
            </h3>
            <p className="text-sm text-gray-500 mt-1">
              {dayAppointments.length} {t('calendar.appointments', 'appointments')}
            </p>
          </div>
        </div>
      </div>

      {/* Time slots */}
      <div className="overflow-y-auto max-h-[700px]">
        {hours.map((hour) => {
          const hourAppointments = getAppointmentsForHour(hour)
          
          return (
            <div key={hour} className="grid grid-cols-12 border-b border-gray-100">
              <div className="col-span-2 p-3 text-sm text-gray-500 bg-gray-50 border-r border-gray-200 text-right pr-4">
                {hour.toString().padStart(2, '0')}:00
              </div>
              <div className="col-span-10 p-2">
                {hourAppointments.length > 0 ? (
                  <div className="space-y-2">
                    {hourAppointments.map((apt) => {
                      const status = apt.status || 'scheduled'
                      const statusColor = statusColors[status] || statusColors.scheduled
                      const startTime = new Date(apt.scheduled_start)
                      const endTime = new Date(apt.scheduled_end)
                      const startMinutes = startTime.getMinutes()
                      const endMinutes = endTime.getMinutes()
                      const duration = (endTime - startTime) / (1000 * 60) // minutes
                      const topOffset = (startMinutes / 60) * 60 // offset within the hour
                      const height = Math.max(50, (duration / 60) * 60) // min 50px

                      return (
                        <div
                          key={apt.id}
                          onClick={() => onViewAppointment?.({ id: apt.id })}
                          className={`p-3 rounded-lg border ${statusColor} cursor-pointer hover:opacity-80 transition-opacity`}
                          style={{ 
                            marginTop: `${topOffset}px`,
                            minHeight: `${height}px`
                          }}
                        >
                          <div className="font-medium text-sm mb-1">
                            {apt.customer_name || '—'}
                            {apt.attendee_name && (
                              <span className="text-gray-600 font-normal"> ({apt.attendee_name})</span>
                            )}
                          </div>
                          <div className="text-xs text-gray-600 mb-1">
                            {apt.service_name || '—'}
                            {apt.instructor_name && (
                              <span className="text-gray-500 ml-2">• {apt.instructor_name}</span>
                            )}
                          </div>
                          <div className="text-xs text-gray-500">
                            {formatTime(startTime)} - {formatTime(endTime)}
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <div className="h-16 flex items-center text-xs text-gray-400 pl-2">
                    {t('calendar.noAppointments', 'No appointments')}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default CalendarDayView

