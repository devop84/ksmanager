import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import sql from '../lib/neon'
import { useSettings } from '../context/SettingsContext'

function DashboardOperations({ onEditOrder = () => {}, onViewCustomer = () => {} }) {
  const { t } = useTranslation()
  const { formatTime, formatDateTime, formatDate } = useSettings()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date()
    return today.toISOString().split('T')[0]
  })
  
  const [todayStats, setTodayStats] = useState({
    lessons: 0,
    rentals: 0,
    storage: 0,
    activeRentals: 0,
    activeStorage: 0,
  })
  
  const [upcomingLessons, setUpcomingLessons] = useState([])
  const [instructorSchedule, setInstructorSchedule] = useState([])
  const [equipmentStatus, setEquipmentStatus] = useState([])
  const [upcomingActivities, setUpcomingActivities] = useState([])

  useEffect(() => {
    const fetchOperationsData = async () => {
      try {
        setLoading(true)
        setError(null)

        const [year, month, day] = selectedDate.split('-').map(Number)
        const startOfDay = new Date(year, month - 1, day, 0, 0, 0)
        const endOfDay = new Date(year, month - 1, day, 23, 59, 59)
        const now = new Date()
        const next7Days = new Date(now)
        next7Days.setDate(next7Days.getDate() + 7)
        const endOf7Days = new Date(next7Days.getFullYear(), next7Days.getMonth(), next7Days.getDate(), 23, 59, 59)

        // Today's statistics
        const todayStatsRows = await sql`
          SELECT 
            COUNT(DISTINCT CASE WHEN ol.order_id IS NOT NULL THEN o.id END) AS lessons,
            COUNT(DISTINCT CASE WHEN orent.order_id IS NOT NULL THEN o.id END) AS rentals,
            COUNT(DISTINCT CASE WHEN ost.order_id IS NOT NULL THEN o.id END) AS storage
          FROM orders o
          LEFT JOIN orders_lessons ol ON ol.order_id = o.id 
            AND ol.starting >= ${startOfDay.toISOString()} 
            AND ol.starting < ${endOfDay.toISOString()}
          LEFT JOIN orders_rentals orent ON orent.order_id = o.id 
            AND orent.starting >= ${startOfDay.toISOString()} 
            AND orent.starting < ${endOfDay.toISOString()}
          LEFT JOIN orders_storage ost ON ost.order_id = o.id 
            AND ost.starting >= ${startOfDay.toISOString()} 
            AND ost.starting < ${endOfDay.toISOString()}
          WHERE o.cancelled = FALSE
        `
        const stats = todayStatsRows[0] || { lessons: 0, rentals: 0, storage: 0 }

        // Active rentals and storage
        const activeRentalsRows = await sql`
          SELECT COUNT(*) AS count
          FROM orders_rentals orent
          JOIN orders o ON o.id = orent.order_id
          WHERE o.cancelled = FALSE
            AND orent.starting <= CURRENT_TIMESTAMP
            AND orent.ending >= CURRENT_TIMESTAMP
        `
        const activeStorageRows = await sql`
          SELECT COUNT(*) AS count
          FROM orders_storage ost
          JOIN orders o ON o.id = ost.order_id
          WHERE o.cancelled = FALSE
            AND ost.starting <= CURRENT_TIMESTAMP
            AND ost.ending >= CURRENT_TIMESTAMP
        `

        // Upcoming lessons (next 24 hours)
        const upcomingLessonsRows = await sql`
          SELECT
            ol.order_id,
            ol.starting,
            ol.ending,
            c.fullname AS student_name,
            i.fullname AS instructor_name,
            s.name AS service_name
          FROM orders_lessons ol
          JOIN orders o ON o.id = ol.order_id
          JOIN customers c ON c.id = ol.student_id
          LEFT JOIN instructors i ON i.id = ol.instructor_id
          JOIN services s ON s.id = o.service_id
          WHERE o.cancelled = FALSE
            AND ol.starting > CURRENT_TIMESTAMP
            AND ol.starting <= ${endOf7Days.toISOString()}
          ORDER BY ol.starting ASC
          LIMIT 20
        `

        // Instructor schedule for selected date
        const instructorScheduleRows = await sql`
          SELECT
            i.id,
            i.fullname AS instructor_name,
            COUNT(ol.order_id) AS lesson_count,
            MIN(ol.starting) AS first_lesson,
            MAX(ol.ending) AS last_lesson
          FROM instructors i
          LEFT JOIN orders_lessons ol ON ol.instructor_id = i.id
            AND ol.starting >= ${startOfDay.toISOString()}
            AND ol.starting < ${endOfDay.toISOString()}
          LEFT JOIN orders o ON o.id = ol.order_id AND o.cancelled = FALSE
          GROUP BY i.id, i.fullname
          HAVING COUNT(ol.order_id) > 0
          ORDER BY i.fullname ASC
        `

        // Equipment status (available vs rented)
        const equipmentStatusRows = await sql`
          SELECT
            e.id,
            e.name,
            ec.name AS category_name,
            COUNT(CASE WHEN orent.ending >= CURRENT_TIMESTAMP AND orent.starting <= CURRENT_TIMESTAMP THEN 1 END) AS active_rentals
          FROM equipment e
          LEFT JOIN equipment_categories ec ON ec.id = e.category_id
          LEFT JOIN orders_rentals orent ON orent.equipment_id = e.id
          LEFT JOIN orders o ON o.id = orent.order_id AND o.cancelled = FALSE
          GROUP BY e.id, e.name, ec.name
          ORDER BY e.name ASC
          LIMIT 20
        `

        // Upcoming activities (next 7 days)
        const upcomingActivitiesRows = await sql`
          SELECT
            o.id AS order_id,
            c.fullname AS customer_name,
            s.name AS service_name,
            sc.name AS category_name,
            COALESCE(ol.starting, orent.starting, ost.starting) AS starting,
            CASE
              WHEN ol.order_id IS NOT NULL THEN 'lessons'
              WHEN orent.order_id IS NOT NULL THEN 'rentals'
              WHEN ost.order_id IS NOT NULL THEN 'storage'
              ELSE 'other'
            END AS type
          FROM orders o
          JOIN customers c ON c.id = o.customer_id
          JOIN services s ON s.id = o.service_id
          JOIN service_categories sc ON sc.id = s.category_id
          LEFT JOIN orders_lessons ol ON ol.order_id = o.id
          LEFT JOIN orders_rentals orent ON orent.order_id = o.id
          LEFT JOIN orders_storage ost ON ost.order_id = o.id
          WHERE o.cancelled = FALSE
            AND COALESCE(ol.starting, orent.starting, ost.starting) > CURRENT_TIMESTAMP
            AND COALESCE(ol.starting, orent.starting, ost.starting) <= ${endOf7Days.toISOString()}
          ORDER BY COALESCE(ol.starting, orent.starting, ost.starting) ASC
          LIMIT 15
        `

        setTodayStats({
          lessons: Number(stats.lessons || 0),
          rentals: Number(stats.rentals || 0),
          storage: Number(stats.storage || 0),
          activeRentals: Number(activeRentalsRows[0]?.count || 0),
          activeStorage: Number(activeStorageRows[0]?.count || 0),
        })
        setUpcomingLessons(upcomingLessonsRows || [])
        setInstructorSchedule(instructorScheduleRows || [])
        setEquipmentStatus(equipmentStatusRows || [])
        setUpcomingActivities(upcomingActivitiesRows || [])
      } catch (err) {
        console.error('Failed to load operations data:', err)
        setError(t('dashboardOperations.error.load'))
      } finally {
        setLoading(false)
      }
    }

    fetchOperationsData()
  }, [selectedDate, t])

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
    const todayStr = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`
    return selectedDate === todayStr
  }

  if (loading) {
    return (
      <div className="px-4 py-6 sm:p-6 lg:p-8">
        <div className="text-gray-600">{t('common.loading')}</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="px-4 py-6 sm:p-6 lg:p-8">
        <div className="text-red-600">{error}</div>
      </div>
    )
  }

  return (
    <div className="px-4 py-6 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{t('dashboardOperations.title')}</h1>
            <p className="text-gray-500 text-sm mt-1">{t('dashboardOperations.description')}</p>
          </div>
          
          {/* Date selector */}
          <div className="flex items-center gap-2">
            <button
              onClick={goToPreviousDay}
              className="p-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 transition-colors"
              aria-label={t('dashboardOperations.previousDay')}
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-2 rounded-lg border border-gray-300 bg-white text-sm font-medium text-gray-700 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
            />
            <button
              onClick={goToToday}
              disabled={isToday()}
              className="p-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              aria-label={t('dashboardOperations.goToToday')}
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </button>
            <button
              onClick={goToNextDay}
              className="p-2 rounded-lg border border-gray-300 bg-white hover:bg-gray-50 transition-colors"
              aria-label={t('dashboardOperations.nextDay')}
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Today's Statistics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-5 border border-blue-200">
          <p className="text-sm font-medium text-blue-700 mb-1">{t('dashboardOperations.stats.lessons')}</p>
          <p className="text-2xl font-bold text-blue-900">{todayStats.lessons}</p>
          <p className="text-xs text-blue-600 mt-1">{t('dashboardOperations.stats.scheduled')}</p>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-5 border border-green-200">
          <p className="text-sm font-medium text-green-700 mb-1">{t('dashboardOperations.stats.rentals')}</p>
          <p className="text-2xl font-bold text-green-900">{todayStats.rentals}</p>
          <p className="text-xs text-green-600 mt-1">{t('dashboardOperations.stats.scheduled')}</p>
        </div>
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-5 border border-purple-200">
          <p className="text-sm font-medium text-purple-700 mb-1">{t('dashboardOperations.stats.storage')}</p>
          <p className="text-2xl font-bold text-purple-900">{todayStats.storage}</p>
          <p className="text-xs text-purple-600 mt-1">{t('dashboardOperations.stats.scheduled')}</p>
        </div>
        <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl p-5 border border-amber-200">
          <p className="text-sm font-medium text-amber-700 mb-1">{t('dashboardOperations.stats.activeRentals')}</p>
          <p className="text-2xl font-bold text-amber-900">{todayStats.activeRentals}</p>
          <p className="text-xs text-amber-600 mt-1">{t('dashboardOperations.stats.inProgress')}</p>
        </div>
        <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-xl p-5 border border-indigo-200">
          <p className="text-sm font-medium text-indigo-700 mb-1">{t('dashboardOperations.stats.activeStorage')}</p>
          <p className="text-2xl font-bold text-indigo-900">{todayStats.activeStorage}</p>
          <p className="text-xs text-indigo-600 mt-1">{t('dashboardOperations.stats.inProgress')}</p>
        </div>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Lessons */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('dashboardOperations.upcomingLessons.title')}</h2>
          {upcomingLessons.length === 0 ? (
            <p className="text-sm text-gray-500">{t('dashboardOperations.upcomingLessons.empty')}</p>
          ) : (
            <div className="space-y-3">
              {upcomingLessons.map((lesson) => (
                <div
                  key={lesson.order_id}
                  onClick={() => onEditOrder({ id: lesson.order_id })}
                  className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">
                        {lesson.student_name || '—'}
                      </p>
                      <p className="text-xs text-gray-600 mt-1">
                        {lesson.instructor_name || t('dashboardOperations.upcomingLessons.noInstructor')}
                      </p>
                      <p className="text-xs text-indigo-600 mt-1">
                        {formatDateTime(lesson.starting)} - {formatTime(lesson.ending, { hour: 'numeric', minute: '2-digit' })}
                      </p>
                    </div>
                    <span className="text-xs text-gray-500 whitespace-nowrap">
                      {lesson.service_name}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Instructor Schedule */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('dashboardOperations.instructorSchedule.title')}</h2>
          {instructorSchedule.length === 0 ? (
            <p className="text-sm text-gray-500">{t('dashboardOperations.instructorSchedule.empty')}</p>
          ) : (
            <div className="space-y-3">
              {instructorSchedule.map((instructor) => (
                <div key={instructor.id} className="p-3 border border-gray-200 rounded-lg">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{instructor.instructor_name}</p>
                      <p className="text-xs text-gray-600 mt-1">
                        {t('dashboardOperations.instructorSchedule.lessons', { count: instructor.lesson_count })}
                      </p>
                    </div>
                    {instructor.first_lesson && (
                      <div className="text-right">
                        <p className="text-xs text-gray-500">
                          {formatTime(instructor.first_lesson, { hour: 'numeric', minute: '2-digit' })}
                        </p>
                        <p className="text-xs text-gray-400">-</p>
                        <p className="text-xs text-gray-500">
                          {formatTime(instructor.last_lesson, { hour: 'numeric', minute: '2-digit' })}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Equipment Status and Upcoming Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Equipment Status */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('dashboardOperations.equipmentStatus.title')}</h2>
          {equipmentStatus.length === 0 ? (
            <p className="text-sm text-gray-500">{t('dashboardOperations.equipmentStatus.empty')}</p>
          ) : (
            <div className="space-y-2">
              {equipmentStatus.map((equipment) => (
                <div key={equipment.id} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{equipment.name}</p>
                    <p className="text-xs text-gray-500">{equipment.category_name || t('dashboardOperations.equipmentStatus.uncategorized')}</p>
                  </div>
                  <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                    equipment.active_rentals > 0 
                      ? 'bg-red-100 text-red-800' 
                      : 'bg-green-100 text-green-800'
                  }`}>
                    {equipment.active_rentals > 0 
                      ? t('dashboardOperations.equipmentStatus.rented', { count: equipment.active_rentals })
                      : t('dashboardOperations.equipmentStatus.available')
                    }
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Upcoming Activities (Next 7 Days) */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">{t('dashboardOperations.upcomingActivities.title')}</h2>
          {upcomingActivities.length === 0 ? (
            <p className="text-sm text-gray-500">{t('dashboardOperations.upcomingActivities.empty')}</p>
          ) : (
            <div className="space-y-2">
              {upcomingActivities.map((activity) => (
                <div
                  key={activity.order_id}
                  onClick={() => onEditOrder({ id: activity.order_id })}
                  className="p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-gray-900 truncate">{activity.customer_name}</p>
                      <p className="text-xs text-gray-600 mt-1">
                        {activity.service_name} • {t(`dashboardOperations.upcomingActivities.${activity.type}`)}
                      </p>
                      <p className="text-xs text-indigo-600 mt-1">{formatDateTime(activity.starting)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default DashboardOperations

