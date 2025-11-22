import { useEffect, useState, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import sql from '../../lib/neon'
import { useSettings } from '../../context/SettingsContext'
import { canModify } from '../../lib/permissions'

const statusStyles = {
  scheduled: {
    pill: 'text-blue-700 bg-blue-50 border-blue-100',
    bg: 'bg-blue-50'
  },
  in_progress: {
    pill: 'text-indigo-700 bg-indigo-50 border-indigo-100',
    bg: 'bg-indigo-50'
  },
  completed: {
    pill: 'text-emerald-700 bg-emerald-50 border-emerald-100',
    bg: 'bg-emerald-50'
  },
  cancelled: {
    pill: 'text-rose-700 bg-rose-50 border-rose-100',
    bg: 'bg-rose-50'
  },
  no_show: {
    pill: 'text-amber-700 bg-amber-50 border-amber-100',
    bg: 'bg-amber-50'
  },
  rescheduled: {
    pill: 'text-purple-700 bg-purple-50 border-purple-100',
    bg: 'bg-purple-50'
  }
}

function Appointments({ refreshKey = 0, user = null, onAddAppointment, onViewAppointment, onEditAppointment }) {
  const { t } = useTranslation()
  const { formatDateTime, formatDate, formatTime } = useSettings()
  const [appointments, setAppointments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [dateFilter, setDateFilter] = useState('')
  const [view, setView] = useState('list') // 'list' or 'calendar'
  const [sortConfig, setSortConfig] = useState({ key: 'scheduled_start', direction: 'asc' })
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        setLoading(true)
        setError(null)
        
        // Simple unified query - handle filters with conditional WHERE clauses
        // Note: 'in_progress' is a virtual status computed client-side, so we fetch 'scheduled' appointments when filtering for it
        const dbStatusFilter = statusFilter === 'in_progress' ? 'scheduled' : statusFilter
        
        let result
        
        if (statusFilter !== 'all' && statusFilter !== 'in_progress' && dateFilter) {
          result = await sql`
            SELECT 
              sa.id,
              sa.customer_id,
              sa.service_id,
              sa.service_package_id,
              sa.credit_id,
              sa.scheduled_start,
              sa.scheduled_end,
              sa.duration_hours,
              sa.duration_days,
              sa.duration_months,
              sa.status,
              sa.instructor_id,
              sa.staff_id,
              sa.note,
              sa.created_at,
              sa.updated_at,
              sa.completed_at,
              sa.cancelled_at,
              c.fullname AS customer_name,
              s.name AS service_name,
              sp.name AS service_package_name,
              i.fullname AS instructor_name,
              st.fullname AS staff_name
            FROM scheduled_appointments sa
            LEFT JOIN customers c ON sa.customer_id = c.id
            LEFT JOIN services s ON sa.service_id = s.id
            LEFT JOIN service_packages sp ON sa.service_package_id = sp.id
            LEFT JOIN instructors i ON sa.instructor_id = i.id
            LEFT JOIN staff st ON sa.staff_id = st.id
            WHERE sa.status = ${statusFilter} AND DATE(sa.scheduled_start) = ${dateFilter}
            ORDER BY sa.scheduled_start ASC
          `
        } else if (statusFilter === 'in_progress' && dateFilter) {
          // For 'in_progress', fetch scheduled appointments and filter by date - client will filter by time
          result = await sql`
            SELECT 
              sa.id,
              sa.customer_id,
              sa.service_id,
              sa.service_package_id,
              sa.credit_id,
              sa.scheduled_start,
              sa.scheduled_end,
              sa.duration_hours,
              sa.duration_days,
              sa.duration_months,
              sa.status,
              sa.instructor_id,
              sa.staff_id,
              sa.note,
              sa.created_at,
              sa.updated_at,
              sa.completed_at,
              sa.cancelled_at,
              c.fullname AS customer_name,
              s.name AS service_name,
              sp.name AS service_package_name,
              i.fullname AS instructor_name,
              st.fullname AS staff_name
            FROM scheduled_appointments sa
            LEFT JOIN customers c ON sa.customer_id = c.id
            LEFT JOIN services s ON sa.service_id = s.id
            LEFT JOIN service_packages sp ON sa.service_package_id = sp.id
            LEFT JOIN instructors i ON sa.instructor_id = i.id
            LEFT JOIN staff st ON sa.staff_id = st.id
            WHERE sa.status = 'scheduled' AND DATE(sa.scheduled_start) = ${dateFilter}
            ORDER BY sa.scheduled_start ASC
          `
        } else if (statusFilter !== 'all' && statusFilter !== 'in_progress') {
          result = await sql`
            SELECT 
              sa.id,
              sa.customer_id,
              sa.service_id,
              sa.service_package_id,
              sa.credit_id,
              sa.scheduled_start,
              sa.scheduled_end,
              sa.duration_hours,
              sa.duration_days,
              sa.duration_months,
              sa.status,
              sa.instructor_id,
              sa.staff_id,
              sa.note,
              sa.created_at,
              sa.updated_at,
              sa.completed_at,
              sa.cancelled_at,
              c.fullname AS customer_name,
              s.name AS service_name,
              sp.name AS service_package_name,
              i.fullname AS instructor_name,
              st.fullname AS staff_name
            FROM scheduled_appointments sa
            LEFT JOIN customers c ON sa.customer_id = c.id
            LEFT JOIN services s ON sa.service_id = s.id
            LEFT JOIN service_packages sp ON sa.service_package_id = sp.id
            LEFT JOIN instructors i ON sa.instructor_id = i.id
            LEFT JOIN staff st ON sa.staff_id = st.id
            WHERE sa.status = ${statusFilter}
            ORDER BY sa.scheduled_start ASC
          `
        } else if (statusFilter === 'in_progress') {
          // For 'in_progress', fetch scheduled appointments - client will filter by time
          result = await sql`
            SELECT 
              sa.id,
              sa.customer_id,
              sa.service_id,
              sa.service_package_id,
              sa.credit_id,
              sa.scheduled_start,
              sa.scheduled_end,
              sa.duration_hours,
              sa.duration_days,
              sa.duration_months,
              sa.status,
              sa.instructor_id,
              sa.staff_id,
              sa.note,
              sa.created_at,
              sa.updated_at,
              sa.completed_at,
              sa.cancelled_at,
              c.fullname AS customer_name,
              s.name AS service_name,
              sp.name AS service_package_name,
              i.fullname AS instructor_name,
              st.fullname AS staff_name
            FROM scheduled_appointments sa
            LEFT JOIN customers c ON sa.customer_id = c.id
            LEFT JOIN services s ON sa.service_id = s.id
            LEFT JOIN service_packages sp ON sa.service_package_id = sp.id
            LEFT JOIN instructors i ON sa.instructor_id = i.id
            LEFT JOIN staff st ON sa.staff_id = st.id
            WHERE sa.status = 'scheduled'
            ORDER BY sa.scheduled_start ASC
          `
        } else if (dateFilter) {
          result = await sql`
            SELECT 
              sa.id,
              sa.customer_id,
              sa.service_id,
              sa.service_package_id,
              sa.credit_id,
              sa.scheduled_start,
              sa.scheduled_end,
              sa.duration_hours,
              sa.duration_days,
              sa.duration_months,
              sa.status,
              sa.instructor_id,
              sa.staff_id,
              sa.note,
              sa.created_at,
              sa.updated_at,
              sa.completed_at,
              sa.cancelled_at,
              c.fullname AS customer_name,
              s.name AS service_name,
              sp.name AS service_package_name,
              i.fullname AS instructor_name,
              st.fullname AS staff_name
            FROM scheduled_appointments sa
            LEFT JOIN customers c ON sa.customer_id = c.id
            LEFT JOIN services s ON sa.service_id = s.id
            LEFT JOIN service_packages sp ON sa.service_package_id = sp.id
            LEFT JOIN instructors i ON sa.instructor_id = i.id
            LEFT JOIN staff st ON sa.staff_id = st.id
            WHERE DATE(sa.scheduled_start) = ${dateFilter}
            ORDER BY sa.scheduled_start ASC
          `
        } else {
          result = await sql`
            SELECT 
              sa.id,
              sa.customer_id,
              sa.service_id,
              sa.service_package_id,
              sa.credit_id,
              sa.scheduled_start,
              sa.scheduled_end,
              sa.duration_hours,
              sa.duration_days,
              sa.duration_months,
              sa.status,
              sa.instructor_id,
              sa.staff_id,
              sa.note,
              sa.created_at,
              sa.updated_at,
              sa.completed_at,
              sa.cancelled_at,
              c.fullname AS customer_name,
              s.name AS service_name,
              sp.name AS service_package_name,
              i.fullname AS instructor_name,
              st.fullname AS staff_name
            FROM scheduled_appointments sa
            LEFT JOIN customers c ON sa.customer_id = c.id
            LEFT JOIN services s ON sa.service_id = s.id
            LEFT JOIN service_packages sp ON sa.service_package_id = sp.id
            LEFT JOIN instructors i ON sa.instructor_id = i.id
            LEFT JOIN staff st ON sa.staff_id = st.id
            ORDER BY sa.scheduled_start ASC
          `
        }
        
        // Reverse if descending order needed
        if (sortConfig.direction === 'desc') {
          result = result.reverse()
        }
        
        setAppointments(result || [])
      } catch (err) {
        console.error('Failed to load appointments:', err)
        // Show more detailed error for debugging
        const errorMessage = err.message || err.toString() || 'Unknown error'
        console.error('Error details:', errorMessage)
        setError(t('schedule.error.load', 'Unable to load appointments. Please try again later.') + ` (${errorMessage})`)
      } finally {
        setLoading(false)
      }
    }

    fetchAppointments()
  }, [refreshKey, statusFilter, dateFilter, sortConfig.direction, t])

  // Update current time every minute to check for "In Progress" appointments
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date())
    }, 60000) // Update every minute
    
    return () => clearInterval(interval)
  }, [])

  // Check if appointment is currently in progress
  const isInProgress = (appointment) => {
    // Only show "In Progress" for scheduled appointments
    if (appointment.status !== 'scheduled') {
      return false
    }
    
    const now = currentTime.getTime()
    const start = new Date(appointment.scheduled_start).getTime()
    const end = new Date(appointment.scheduled_end).getTime()
    
    return now >= start && now <= end
  }

  // Get display status (either "in_progress" or the stored status)
  const getDisplayStatus = (appointment) => {
    if (isInProgress(appointment)) {
      return 'in_progress'
    }
    return appointment.status || 'scheduled'
  }

  const filteredAppointments = useMemo(() => {
    return appointments.filter((appointment) => {
      // Filter by status (including "in_progress" as a virtual status)
      if (statusFilter !== 'all') {
        const displayStatus = getDisplayStatus(appointment)
        if (statusFilter !== displayStatus) {
          return false
        }
      }
      
      // Filter by search term
      if (!searchTerm.trim()) return true
      const query = searchTerm.toLowerCase()
      return [
        appointment.customer_name,
        appointment.service_name,
        appointment.service_package_name,
        appointment.id?.toString()
      ]
        .filter((value) => value !== null && value !== undefined)
        .some((value) => value.toString().toLowerCase().includes(query))
    })
  }, [appointments, searchTerm, statusFilter, currentTime])

  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }))
  }

  // Sort appointments based on sortConfig
  const sortedAppointments = useMemo(() => {
    const sorted = [...filteredAppointments]
    sorted.sort((a, b) => {
      let aValue = a[sortConfig.key] ?? ''
      let bValue = b[sortConfig.key] ?? ''

      // Handle date sorting
      if (sortConfig.key === 'scheduled_start' || sortConfig.key === 'scheduled_end' || 
          sortConfig.key === 'created_at' || sortConfig.key === 'updated_at' ||
          sortConfig.key === 'completed_at' || sortConfig.key === 'cancelled_at') {
        aValue = aValue ? new Date(aValue).getTime() : 0
        bValue = bValue ? new Date(bValue).getTime() : 0
      }

      // Handle numeric sorting for duration fields
      if (sortConfig.key === 'duration_hours' || sortConfig.key === 'duration_days' || 
          sortConfig.key === 'duration_months') {
        aValue = Number(aValue) || 0
        bValue = Number(bValue) || 0
      }

      // Handle string sorting (customer_name, service_name, status)
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        aValue = aValue.toLowerCase()
        bValue = bValue.toLowerCase()
      }

      // For status, use display status for sorting
      if (sortConfig.key === 'status') {
        aValue = getDisplayStatus(a).toLowerCase()
        bValue = getDisplayStatus(b).toLowerCase()
      }

      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1
      return 0
    })
    return sorted
  }, [filteredAppointments, sortConfig, currentTime])

  const getDurationDisplay = (appointment) => {
    if (appointment.duration_hours) {
      return `${appointment.duration_hours}h`
    }
    if (appointment.duration_days) {
      return `${appointment.duration_days}d`
    }
    if (appointment.duration_months) {
      return `${appointment.duration_months}mo`
    }
    const diff = new Date(appointment.scheduled_end) - new Date(appointment.scheduled_start)
    const hours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    if (hours > 0) {
      return `${hours}h ${minutes}m`
    }
    return `${minutes}m`
  }

  if (loading) {
    return (
      <div className="px-4 py-6 sm:p-6 lg:p-8">
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <div className="text-gray-600">{t('schedule.loading', 'Loading appointments...')}</div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="px-4 py-6 sm:p-6 lg:p-8">
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <div className="text-red-600">{error}</div>
        </div>
      </div>
    )
  }

  return (
    <div className="px-4 py-6 sm:p-6 lg:p-8">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">{t('schedule.title', 'Appointments')}</h1>
          <p className="text-gray-500 text-sm mt-1">{t('schedule.subtitle', 'Manage scheduled appointments and sessions.')}</p>
        </div>
        {canModify(user) && (
          <button
            onClick={() => onAddAppointment?.()}
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-indigo-600 bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            {t('schedule.buttons.addAppointment', 'Add Appointment')}
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="mb-6 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="grid gap-4 md:grid-cols-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700">
              {t('schedule.filters.search', 'Search')}
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder={t('schedule.filters.searchPlaceholder', 'Search by customer, service...')}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700">
              {t('schedule.filters.status', 'Status')}
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
            >
              <option value="all">{t('schedule.filters.allStatuses', 'All Statuses')}</option>
              <option value="scheduled">{t('schedule.status.scheduled', 'Scheduled')}</option>
              <option value="in_progress">{t('schedule.status.inProgress', 'In Progress')}</option>
              <option value="completed">{t('schedule.status.completed', 'Completed')}</option>
              <option value="cancelled">{t('schedule.status.cancelled', 'Cancelled')}</option>
              <option value="no_show">{t('schedule.status.noShow', 'No Show')}</option>
              <option value="rescheduled">{t('schedule.status.rescheduled', 'Rescheduled')}</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-700">
              {t('schedule.filters.date', 'Date')}
            </label>
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
            />
          </div>
          <div className="flex items-end">
            {dateFilter && (
              <button
                onClick={() => setDateFilter('')}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                {t('schedule.filters.clearDate', 'Clear Date')}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Appointments List */}
      {filteredAppointments.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-12 shadow-sm text-center">
          <p className="text-gray-500">{t('schedule.empty', 'No appointments found.')}</p>
          {canModify(user) && (
            <button
              onClick={() => onAddAppointment?.()}
              className="mt-4 inline-flex items-center gap-2 rounded-lg border border-indigo-600 bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              {t('schedule.buttons.addFirstAppointment', 'Add First Appointment')}
            </button>
          )}
        </div>
      ) : (
        <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th
                    onClick={() => handleSort('scheduled_start')}
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  >
                    <div className="flex items-center gap-1">
                      {t('schedule.table.dateTime', 'Date & Time')}
                      {sortConfig.key === 'scheduled_start' && (
                        <span className="text-gray-400">
                          {sortConfig.direction === 'asc' ? '▲' : '▼'}
                        </span>
                      )}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('customer_name')}
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  >
                    <div className="flex items-center gap-1">
                      {t('schedule.table.customer', 'Customer')}
                      {sortConfig.key === 'customer_name' && (
                        <span className="text-gray-400">
                          {sortConfig.direction === 'asc' ? '▲' : '▼'}
                        </span>
                      )}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('service_name')}
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  >
                    <div className="flex items-center gap-1">
                      {t('schedule.table.service', 'Service')}
                      {sortConfig.key === 'service_name' && (
                        <span className="text-gray-400">
                          {sortConfig.direction === 'asc' ? '▲' : '▼'}
                        </span>
                      )}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('duration_hours')}
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  >
                    <div className="flex items-center gap-1">
                      {t('schedule.table.duration', 'Duration')}
                      {sortConfig.key === 'duration_hours' && (
                        <span className="text-gray-400">
                          {sortConfig.direction === 'asc' ? '▲' : '▼'}
                        </span>
                      )}
                    </div>
                  </th>
                  <th
                    onClick={() => handleSort('status')}
                    className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                  >
                    <div className="flex items-center gap-1">
                      {t('schedule.table.status', 'Status')}
                      {sortConfig.key === 'status' && (
                        <span className="text-gray-400">
                          {sortConfig.direction === 'asc' ? '▲' : '▼'}
                        </span>
                      )}
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {sortedAppointments.map((appointment) => {
                  const displayStatus = getDisplayStatus(appointment)
                  const statusStyle = statusStyles[displayStatus] || statusStyles.scheduled
                  return (
                    <tr 
                      key={appointment.id} 
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() => onViewAppointment?.(appointment)}
                    >
                      <td className="px-4 py-3 whitespace-nowrap text-sm">
                        <div className="font-medium text-gray-900">{formatDate(appointment.scheduled_start)}</div>
                        <div className="text-gray-500">{formatTime(appointment.scheduled_start)}</div>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                        {appointment.customer_name || '—'}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                        <div>{appointment.service_name || '—'}</div>
                        {appointment.service_package_name && (
                          <div className="text-xs text-gray-500">{appointment.service_package_name}</div>
                        )}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                        {getDurationDisplay(appointment)}
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`inline-flex items-center rounded-full border px-2 py-1 text-xs font-semibold ${statusStyle.pill}`}>
                          {displayStatus === 'in_progress' 
                            ? t('schedule.status.inProgress', 'IN PROGRESS') 
                            : (displayStatus?.replace(/_/g, ' ').toUpperCase() || 'SCHEDULED')}
                        </span>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

export default Appointments

