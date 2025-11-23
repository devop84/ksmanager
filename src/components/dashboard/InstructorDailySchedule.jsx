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

function InstructorDailySchedule({ onViewAppointment }) {
  const { t } = useTranslation()
  const { formatDate, formatTime } = useSettings()
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [instructors, setInstructors] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [openShareMenu, setOpenShareMenu] = useState(null)

  useEffect(() => {
    const fetchInstructorSchedules = async () => {
      try {
        setLoading(true)
        setError(null)

        const startOfDay = new Date(selectedDate)
        startOfDay.setHours(0, 0, 0, 0)
        const endOfDay = new Date(selectedDate)
        endOfDay.setHours(23, 59, 59, 999)

        // Fetch appointments with instructors for lessons only
        const result = await sql`
          SELECT 
            sa.id,
            sa.scheduled_start,
            sa.scheduled_end,
            sa.status,
            sa.attendee_name,
            c.fullname AS customer_name,
            s.name AS service_name,
            i.id AS instructor_id,
            i.fullname AS instructor_name,
            i.email AS instructor_email,
            i.phone AS instructor_phone
          FROM scheduled_appointments sa
          LEFT JOIN customers c ON sa.customer_id = c.id
          LEFT JOIN services s ON sa.service_id = s.id
          LEFT JOIN service_categories sc ON s.category_id = sc.id
          LEFT JOIN instructors i ON sa.instructor_id = i.id
          WHERE sa.scheduled_start <= ${endOfDay.toISOString()}
            AND sa.scheduled_end >= ${startOfDay.toISOString()}
            AND sa.cancelled_at IS NULL
            AND sa.instructor_id IS NOT NULL
            AND sc.name ILIKE 'lessons'
          ORDER BY i.fullname ASC, sa.scheduled_start ASC
        `
        
        // Group appointments by instructor
        const grouped = (result || []).reduce((acc, appointment) => {
          const instructorId = appointment.instructor_id
          const instructorName = appointment.instructor_name || t('dashboard.dailyLessons.unknown', 'Unknown')
          
          if (!acc[instructorId]) {
            acc[instructorId] = {
              id: instructorId,
              name: instructorName,
              email: appointment.instructor_email,
              phone: appointment.instructor_phone,
              appointments: []
            }
          }
          acc[instructorId].appointments.push(appointment)
          return acc
        }, {})
        
        setInstructors(Object.values(grouped))
      } catch (err) {
        console.error('Failed to load instructor schedules:', err)
        setError(t('dashboard.instructorSchedule.error.load', 'Unable to load instructor schedules'))
      } finally {
        setLoading(false)
      }
    }

    fetchInstructorSchedules()
  }, [selectedDate, t])

  const changeDate = (days) => {
    const newDate = new Date(selectedDate)
    newDate.setDate(newDate.getDate() + days)
    setSelectedDate(newDate)
  }

  const isToday = selectedDate.toDateString() === new Date().toDateString()

  const generateScheduleMessage = (instructor) => {
    const dateStr = formatDate(selectedDate)
    let message = t('dashboard.instructorSchedule.share.message.greeting', 'Hi {{name}},', { name: instructor.name })
    message += '\n\n'
    message += t('dashboard.instructorSchedule.share.message.scheduleFor', 'Your schedule for {{date}}:', { date: dateStr })
    message += '\n\n'
    
    instructor.appointments.forEach((appointment, index) => {
      const startTime = new Date(appointment.scheduled_start)
      const endTime = new Date(appointment.scheduled_end)
      const timeStr = `${formatTime(startTime)} - ${formatTime(endTime)}`
      
      message += `${index + 1}. ${timeStr}\n`
      message += `   ${t('dashboard.instructorSchedule.share.message.customer', 'Customer:')} ${appointment.customer_name || '—'}`
      if (appointment.attendee_name) {
        message += ` (${appointment.attendee_name})`
      }
      message += `\n   ${t('dashboard.instructorSchedule.share.message.service', 'Service:')} ${appointment.service_name || '—'}\n\n`
    })
    
    message += t('dashboard.instructorSchedule.share.message.total', 'Total: {{count}} lesson(s)', { count: instructor.appointments.length })
    message += '\n\n'
    message += t('dashboard.instructorSchedule.share.message.closing', 'Have a great day!')
    return message
  }

  const handleShare = async (instructor, method) => {
    const message = generateScheduleMessage(instructor)
    const encodedMessage = encodeURIComponent(message)
    
    try {
      if (method === 'whatsapp') {
        // Open WhatsApp with message pre-filled, user chooses contact
        window.open(`https://wa.me/?text=${encodedMessage}`, '_blank')
      } else if (method === 'copy') {
        await navigator.clipboard.writeText(message)
        alert(t('dashboard.instructorSchedule.share.copied', 'Schedule copied to clipboard!'))
      }
      setOpenShareMenu(null)
    } catch (err) {
      console.error('Failed to share:', err)
      if (method === 'copy') {
        // Fallback: show message in alert
        alert(message)
      }
      setOpenShareMenu(null)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 md:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <h2 className="text-base sm:text-lg font-semibold text-gray-900">
          {t('dashboard.instructorSchedule.title', 'Instructor Daily Schedule')}
        </h2>
        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            onClick={() => changeDate(-1)}
            className="p-1.5 sm:p-2 rounded-lg border border-gray-300 hover:bg-gray-50"
            aria-label={t('dashboard.instructorSchedule.previousDay', 'Previous day')}
          >
            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <span className="text-xs sm:text-sm font-medium text-gray-700 px-2 sm:px-3 min-w-[100px] sm:min-w-[120px] text-center">
            {formatDate(selectedDate)}
          </span>
          <button
            onClick={() => setSelectedDate(new Date())}
            disabled={isToday}
            className={`p-1.5 sm:p-2 rounded-lg border border-gray-300 ${
              isToday ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'hover:bg-gray-50 text-gray-600'
            }`}
            aria-label={t('dashboard.instructorSchedule.goToToday', 'Go to today')}
          >
            <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </button>
          <button
            onClick={() => changeDate(1)}
            className="p-1.5 sm:p-2 rounded-lg border border-gray-300 hover:bg-gray-50"
            aria-label={t('dashboard.instructorSchedule.nextDay', 'Next day')}
          >
            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-gray-600 text-sm text-center py-8">
          {t('dashboard.instructorSchedule.loading', 'Loading schedules...')}
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800 text-sm">
          {error}
        </div>
      ) : instructors.length === 0 ? (
        <div className="text-gray-500 text-sm text-center py-8">
          {t('dashboard.instructorSchedule.empty', 'No instructor schedules for this date.')}
        </div>
      ) : (
        <div className="space-y-4">
          {instructors.map((instructor) => (
            <div key={instructor.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-200">
                <div className="flex items-center gap-2">
                  <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  <h3 className="text-sm font-semibold text-gray-900">{instructor.name}</h3>
                  <span className="text-xs text-gray-500">({instructor.appointments.length})</span>
                </div>
                <div className="relative">
                  <button
                    onClick={() => setOpenShareMenu(openShareMenu === instructor.id ? null : instructor.id)}
                    className="p-1.5 rounded-lg border border-gray-300 hover:bg-gray-50 text-gray-600 hover:text-gray-900 transition-colors"
                    aria-label={t('dashboard.instructorSchedule.share.button', 'Share schedule with instructor')}
                    title={t('dashboard.instructorSchedule.share.button', 'Share schedule with instructor')}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                    </svg>
                  </button>
                  {openShareMenu === instructor.id && (
                    <>
                      <div 
                        className="fixed inset-0 z-10" 
                        onClick={() => setOpenShareMenu(null)}
                      />
                      <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-20 py-1">
                        <button
                          onClick={() => handleShare(instructor, 'whatsapp')}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                        >
                          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z"/>
                          </svg>
                          {t('dashboard.instructorSchedule.share.whatsapp', 'WhatsApp')}
                        </button>
                        <button
                          onClick={() => handleShare(instructor, 'copy')}
                          className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                          </svg>
                          {t('dashboard.instructorSchedule.share.copy', 'Copy to Clipboard')}
                        </button>
                      </div>
                    </>
                  )}
                </div>
              </div>
              <div className="space-y-2">
                {instructor.appointments.map((appointment) => {
                  const status = appointment.status || 'scheduled'
                  const statusColor = statusColors[status] || statusColors.scheduled
                  const startTime = new Date(appointment.scheduled_start)
                  const endTime = new Date(appointment.scheduled_end)

                  return (
                    <div
                      key={appointment.id}
                      onClick={() => onViewAppointment?.({ id: appointment.id })}
                      className="p-2 rounded border border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-gray-900 text-sm">
                            {appointment.customer_name || '—'}
                            {appointment.attendee_name && (
                              <span className="text-gray-600 font-normal"> ({appointment.attendee_name})</span>
                            )}
                          </div>
                          <div className="text-xs text-gray-600 mt-1">
                            {appointment.service_name || '—'}
                          </div>
                          <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            <span>{formatTime(startTime)} - {formatTime(endTime)}</span>
                          </div>
                        </div>
                        <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-semibold ml-2 ${statusColor}`}>
                          {t(`schedule.status.${status}`, status.replace(/_/g, ' ').toUpperCase())}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default InstructorDailySchedule

