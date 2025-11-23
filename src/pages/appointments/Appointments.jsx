import { useEffect, useState, useMemo, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import sql from '../../lib/neon'
import { useSettings } from '../../context/SettingsContext'
import { canModify } from '../../lib/permissions'
import { useDataTable } from '../../hooks/useDataTable'
import DataTable from '../../components/ui/DataTable'
import PageHeader from '../../components/layout/PageHeader'
import SearchBar from '../../components/ui/SearchBar'
import MobileCardView from '../../components/ui/MobileCardView'
import AppointmentsOverview from '../../components/ui/AppointmentsOverview'

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
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        setLoading(true)
        setError(null)
        
        // Fetch all appointments - filtering will be done client-side via search
        const result = await sql`
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
        
        setAppointments(result || [])
        setTableData(result || [])
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey, t])

  // Update current time every minute to check for "In Progress" appointments
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentTime(new Date())
    }, 60000) // Update every minute
    
    return () => clearInterval(interval)
  }, [])

  // Check if appointment is currently in progress
  const isInProgress = useCallback((appointment) => {
    // Only show "In Progress" for scheduled appointments
    if (!appointment || appointment.status !== 'scheduled') {
      return false
    }
    
    if (!appointment.scheduled_start || !appointment.scheduled_end) {
      return false
    }
    
    const now = currentTime.getTime()
    const start = new Date(appointment.scheduled_start).getTime()
    const end = new Date(appointment.scheduled_end).getTime()
    
    return now >= start && now <= end
  }, [currentTime])

  // Get display status (either "in_progress" or the stored status)
  const getDisplayStatus = useCallback((appointment) => {
    if (isInProgress(appointment)) {
      return 'in_progress'
    }
    return appointment.status || 'scheduled'
  }, [isInProgress])

  const columns = useMemo(
    () => [
      { key: 'scheduled_start', label: t('schedule.table.dateTime', 'Date & Time') },
      { key: 'customer_name', label: t('schedule.table.customer', 'Customer') },
      { key: 'service_name', label: t('schedule.table.service', 'Service') },
      { key: 'duration_hours', label: t('schedule.table.duration', 'Duration') },
      { key: 'status', label: t('schedule.table.status', 'Status') },
    ],
    [t],
  )

  // Custom filter function that searches all columns
  const customFilterFn = useCallback((data, searchTerm) => {
    if (!data || !Array.isArray(data)) return []
    
    // If no search term, return all data
    if (!searchTerm || !searchTerm.trim()) return data
    
    const query = searchTerm.toLowerCase()
    
    return data.filter((appointment) => {
      if (!appointment) return false
      
      // Search across all fields
      return Object.values(appointment)
        .filter(value => value != null && value !== undefined)
        .some(value => value.toString().toLowerCase().includes(query))
    })
  }, [])

  // Custom sort function
  const customSortFn = useCallback((sorted, sortConfig) => {
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

      // Handle string sorting (customer_name, service_name)
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
  }, [getDisplayStatus])

  const {
    data: tableData,
    setData: setTableData,
    searchTerm,
    sortConfig,
    filteredData,
    handleSort,
    handleSearchChange
  } = useDataTable(appointments, {
    defaultSortKey: 'scheduled_start',
    defaultSortDirection: 'asc',
    customFilterFn,
    customSortFn
  })

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

  const renderCell = (key, row) => {
    if (!row) return '—'
    
    const displayStatus = getDisplayStatus(row)
    const statusStyle = statusStyles[displayStatus] || statusStyles.scheduled
    
    switch (key) {
      case 'scheduled_start':
        if (!row.scheduled_start) return '—'
        return (
          <>
            <div className="font-medium text-gray-900">{formatDate(row.scheduled_start)}</div>
            <div className="text-gray-500">{formatTime(row.scheduled_start)}</div>
          </>
        )
      case 'service_name':
        return (
          <>
            <div>{row.service_name || '—'}</div>
            {row.service_package_name && (
              <div className="text-xs text-gray-500">{row.service_package_name}</div>
            )}
          </>
        )
      case 'duration_hours':
        return getDurationDisplay(row)
      case 'status':
        return (
          <span className={`inline-flex items-center rounded-full border px-2 py-1 text-xs font-semibold ${statusStyle.pill}`}>
            {displayStatus === 'in_progress' 
              ? 'IN PROGRESS'
              : (displayStatus?.replace(/_/g, ' ').toUpperCase() || 'SCHEDULED')}
          </span>
        )
      default:
        return row[key] ?? '—'
    }
  }

  return (
    <div className="px-4 py-6 sm:p-6 lg:p-8">
      <div className="flex flex-col gap-6 bg-white rounded-xl shadow-sm p-4 sm:p-6">
        <PageHeader
          title={t('schedule.title', 'Appointments')}
          description={t('schedule.subtitle', 'Manage scheduled appointments and sessions.')}
          onAdd={onAddAppointment}
          addLabel={t('schedule.buttons.addAppointment', 'Add Appointment')}
          user={user}
          canModifyFn={canModify}
        />

        <AppointmentsOverview 
          appointments={appointments}
          getDisplayStatus={getDisplayStatus}
        />

        <div className="flex flex-col gap-4">
          {/* Search and Filters */}
          <div className="flex flex-col gap-4">
            <SearchBar
              value={searchTerm}
              onChange={handleSearchChange}
              placeholder={t('schedule.filters.searchPlaceholder', 'Search all columns...')}
            />
          </div>

          {loading && <div className="text-gray-600 text-sm">{t('schedule.loading', 'Loading appointments...')}</div>}
          {error && <div className="text-red-600 text-sm">{error}</div>}
          
          {!loading && !error && (
            <>
              {/* Desktop Table View */}
              <div className="hidden md:block">
                <DataTable
                  columns={columns}
                  data={filteredData}
                  sortConfig={sortConfig}
                  onSort={handleSort}
                  onRowClick={onViewAppointment}
                  renderCell={renderCell}
                  emptyMessage={t('schedule.empty', 'No appointments found.')}
                />
              </div>

              {/* Mobile Card View */}
              <MobileCardView
                data={filteredData}
                emptyMessage={t('schedule.empty', 'No appointments found.')}
                onItemClick={onViewAppointment}
                renderCard={(appointment) => {
                  const displayStatus = getDisplayStatus(appointment)
                  const statusStyle = statusStyles[displayStatus] || statusStyles.scheduled
                  return (
                    <>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-base font-semibold text-gray-900">
                            {appointment.customer_name || '—'}
                          </p>
                          <p className="text-sm text-gray-500">
                            {formatDate(appointment.scheduled_start)} {formatTime(appointment.scheduled_start)}
                          </p>
                        </div>
                        <span className={`inline-flex items-center rounded-full border px-2 py-1 text-xs font-semibold ${statusStyle.pill}`}>
                          {displayStatus === 'in_progress' 
                            ? 'IN PROGRESS'
                            : (displayStatus?.replace(/_/g, ' ').toUpperCase() || 'SCHEDULED')}
                        </span>
                      </div>
                      <dl className="mt-4 grid grid-cols-2 gap-3 text-sm text-gray-600">
                        <div>
                          <dt className="text-gray-400 text-xs uppercase">{t('schedule.table.service', 'Service')}</dt>
                          <dd>
                            {appointment.service_name || '—'}
                            {appointment.service_package_name && (
                              <span className="block text-xs text-gray-500">{appointment.service_package_name}</span>
                            )}
                          </dd>
                        </div>
                        <div>
                          <dt className="text-gray-400 text-xs uppercase">{t('schedule.table.duration', 'Duration')}</dt>
                          <dd>{getDurationDisplay(appointment)}</dd>
                        </div>
                      </dl>
                    </>
                  )
                }}
              />
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default Appointments

