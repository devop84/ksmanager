import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import sql from '../lib/neon'
import { useSettings } from '../context/SettingsContext'

function DailyServices({ onEditOrder = () => {}, onViewCustomer = () => {} }) {
  const [lessons, setLessons] = useState([])
  const [rentals, setRentals] = useState([])
  const [storages, setStorages] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date()
    return today.toISOString().split('T')[0] // Format: YYYY-MM-DD
  })
  const { formatTime, formatDateTime } = useSettings()
  const { t } = useTranslation()

  useEffect(() => {
    const fetchDailyServices = async () => {
      try {
        setLoading(true)
        setError(null)

        // Parse selected date
        const [year, month, day] = selectedDate.split('-').map(Number)
        
        // Create start and end timestamps for the entire day (00:00 to 23:59:59)
        const startOfDay = new Date(year, month - 1, day, 0, 0, 0)
        const endOfDay = new Date(year, month - 1, day, 23, 59, 59)
        
        // Convert to ISO strings for database query
        const startISO = startOfDay.toISOString()
        const endISO = endOfDay.toISOString()

        // Fetch lessons for the selected date
        const lessonRows = await sql`
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
          ORDER BY ol.starting ASC
        `

        // Fetch rentals that start or are active on the selected date
        const rentalRows = await sql`
          SELECT
            orent.order_id,
            orent.equipment_id,
            orent.starting,
            orent.ending,
            orent.note,
            o.cancelled,
            o.customer_id,
            c.fullname AS customer_name,
            e.name AS equipment_name,
            s.name AS service_name
          FROM orders_rentals orent
          JOIN orders o ON o.id = orent.order_id
          JOIN services s ON s.id = o.service_id
          JOIN customers c ON c.id = o.customer_id
          LEFT JOIN equipment e ON e.id = orent.equipment_id
          WHERE o.cancelled = FALSE
            AND (
              (orent.starting >= ${startISO} AND orent.starting < ${endISO})
              OR (orent.ending >= ${startISO} AND orent.ending < ${endISO})
              OR (orent.starting <= ${startISO} AND orent.ending >= ${endISO})
            )
          ORDER BY orent.starting ASC
        `

        // Fetch storage that starts or is active on the selected date
        const storageRows = await sql`
          SELECT
            ost.order_id,
            ost.storage_id,
            ost.starting,
            ost.ending,
            ost.note,
            o.cancelled,
            o.customer_id,
            c.fullname AS customer_name,
            s.name AS service_name
          FROM orders_storage ost
          JOIN orders o ON o.id = ost.order_id
          JOIN services s ON s.id = o.service_id
          JOIN customers c ON c.id = o.customer_id
          WHERE o.cancelled = FALSE
            AND (
              (ost.starting >= ${startISO} AND ost.starting < ${endISO})
              OR (ost.ending >= ${startISO} AND ost.ending < ${endISO})
              OR (ost.starting <= ${startISO} AND ost.ending >= ${endISO})
            )
          ORDER BY ost.starting ASC
        `

        // Determine status for each item
        const now = new Date()
        
        const lessonsWithStatus = (lessonRows || []).map((lesson) => {
          const status = determineStatus(lesson, now)
          return { ...lesson, status }
        })

        const rentalsWithStatus = (rentalRows || []).map((rental) => {
          const status = determineStatus(rental, now)
          return { ...rental, status }
        })

        const storagesWithStatus = (storageRows || []).map((storage) => {
          const status = determineStatus(storage, now)
          return { ...storage, status }
        })

        setLessons(lessonsWithStatus)
        setRentals(rentalsWithStatus)
        setStorages(storagesWithStatus)
      } catch (err) {
        console.error('Failed to load daily services:', err)
        setError(t('dashboard.dailyServices.error.load'))
      } finally {
        setLoading(false)
      }
    }

    fetchDailyServices()
  }, [selectedDate, t])

  const determineStatus = (item, now) => {
    if (item.cancelled) return 'cancelled'
    const start = item.starting ? new Date(item.starting) : null
    const end = item.ending ? new Date(item.ending) : null
    
    if (!start || !end) return 'pending'
    if (now < start) return 'pending'
    if (now >= start && now <= end) return 'in_progress'
    if (now > end) return 'completed'
    return 'pending'
  }

  const getStatusBadge = (status) => {
    const statusConfig = {
      pending: { bg: 'bg-yellow-100', text: 'text-yellow-800', label: t('dashboard.dailyServices.status.pending') },
      in_progress: { bg: 'bg-blue-100', text: 'text-blue-800', label: t('dashboard.dailyServices.status.inProgress') },
      completed: { bg: 'bg-green-100', text: 'text-green-800', label: t('dashboard.dailyServices.status.completed') },
      cancelled: { bg: 'bg-red-100', text: 'text-red-800', label: t('dashboard.dailyServices.status.cancelled') },
    }
    
    const config = statusConfig[status] || statusConfig.pending
    return (
      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${config.bg} ${config.text}`}>
        {config.label}
      </span>
    )
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

  const isToday = () => {
    const today = new Date()
    const todayYear = today.getFullYear()
    const todayMonth = today.getMonth() + 1
    const todayDay = today.getDate()
    const todayStr = `${todayYear}-${String(todayMonth).padStart(2, '0')}-${String(todayDay).padStart(2, '0')}`
    return selectedDate === todayStr
  }

  if (loading) {
    return (
      <div className="rounded-xl bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">{t('dashboard.dailyServices.title')}</h2>
        <div className="text-gray-600">{t('common.loading')}</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-xl bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">{t('dashboard.dailyServices.title')}</h2>
        <div className="text-red-600">{error}</div>
      </div>
    )
  }

  const hasActivities = lessons.length > 0 || rentals.length > 0 || storages.length > 0

  return (
    <div className="rounded-xl bg-white p-2 sm:p-4 md:p-6 shadow-sm w-full">
      <div className="sticky top-0 z-20 bg-white w-full flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-3 md:gap-4 mb-4 pb-4 border-b border-gray-200">
        <h2 className="w-full sm:w-auto text-lg sm:text-xl font-semibold text-gray-800">{t('dashboard.dailyServices.title')}</h2>
        
        {/* Date navigation */}
        <div className="w-full sm:w-auto flex items-center gap-1.5 sm:gap-2">
          <button
            onClick={goToPreviousDay}
            className="p-1.5 sm:p-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 transition-colors"
            aria-label={t('dashboard.dailyServices.previousDay')}
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
            aria-label={t('dashboard.dailyServices.goToToday')}
          >
            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
          </button>
          
          <button
            onClick={goToNextDay}
            className="p-1.5 sm:p-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 transition-colors"
            aria-label={t('dashboard.dailyServices.nextDay')}
          >
            <svg className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </div>
      </div>

      {!hasActivities ? (
        <div className="text-gray-600 text-center py-8">{t('dashboard.dailyServices.empty')}</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Lessons Section */}
          <div>
            <h3 className="text-base font-semibold text-gray-900 mb-3">{t('dashboard.dailyServices.section.lessons')}</h3>
            {lessons.length === 0 ? (
              <div className="text-sm text-gray-500">{t('dashboard.dailyServices.lessons.empty')}</div>
            ) : (
              <div className="space-y-2">
                {lessons.map((lesson) => (
                  <div
                    key={lesson.order_id}
                    onClick={() => lesson.student_id ? onViewCustomer({ id: lesson.student_id }) : onEditOrder({ id: lesson.order_id })}
                    className="rounded-lg border border-gray-200 bg-white p-3 hover:shadow-md transition-shadow cursor-pointer"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <p className="text-sm font-semibold text-gray-900 truncate">
                            {lesson.student_name || '—'}
                          </p>
                          {getStatusBadge(lesson.status)}
                        </div>
                        <p className="text-xs text-gray-600">
                          {lesson.instructor_name || '—'}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {formatTime(lesson.starting, { hour: 'numeric', minute: '2-digit' })} - {formatTime(lesson.ending, { hour: 'numeric', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Rentals Section */}
          <div>
            <h3 className="text-base font-semibold text-gray-900 mb-3">{t('dashboard.dailyServices.section.rentals')}</h3>
            {rentals.length === 0 ? (
              <div className="text-sm text-gray-500">{t('dashboard.dailyServices.rentals.empty')}</div>
            ) : (
              <div className="space-y-2">
                {rentals.map((rental) => (
                  <div
                    key={rental.order_id}
                    onClick={() => rental.customer_id ? onViewCustomer({ id: rental.customer_id }) : onEditOrder({ id: rental.order_id })}
                    className="rounded-lg border border-gray-200 bg-white p-3 hover:shadow-md transition-shadow cursor-pointer"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <p className="text-sm font-semibold text-gray-900 truncate">
                            {rental.customer_name || '—'}
                          </p>
                          {getStatusBadge(rental.status)}
                        </div>
                        <p className="text-xs text-gray-600">
                          {rental.service_name || '—'} {rental.equipment_name && `• ${rental.equipment_name}`}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {formatDateTime(rental.starting)} - {formatDateTime(rental.ending)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Storage Section */}
          <div>
            <h3 className="text-base font-semibold text-gray-900 mb-3">{t('dashboard.dailyServices.section.storage')}</h3>
            {storages.length === 0 ? (
              <div className="text-sm text-gray-500">{t('dashboard.dailyServices.storage.empty')}</div>
            ) : (
              <div className="space-y-2">
                {storages.map((storage) => (
                  <div
                    key={storage.order_id}
                    onClick={() => storage.customer_id ? onViewCustomer({ id: storage.customer_id }) : onEditOrder({ id: storage.order_id })}
                    className="rounded-lg border border-gray-200 bg-white p-3 hover:shadow-md transition-shadow cursor-pointer"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                          <p className="text-sm font-semibold text-gray-900 truncate">
                            {storage.customer_name || '—'}
                          </p>
                          {getStatusBadge(storage.status)}
                        </div>
                        <p className="text-xs text-gray-600">
                          {storage.service_name || '—'}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {formatDateTime(storage.starting)} - {formatDateTime(storage.ending)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default DailyServices

