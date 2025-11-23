import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'

/**
 * AppointmentsOverview - Component for displaying appointment status counts
 * @param {Array} appointments - Array of appointment objects
 * @param {Function} getDisplayStatus - Function to get the display status of an appointment (handles in_progress logic)
 */
function AppointmentsOverview({ appointments = [], getDisplayStatus = null }) {
  const { t } = useTranslation()

  const statusCounts = useMemo(() => {
    if (!appointments || !Array.isArray(appointments)) {
      return {
        scheduled: 0,
        in_progress: 0,
        completed: 0,
        no_show: 0,
        cancelled: 0
      }
    }

    const counts = {
      scheduled: 0,
      in_progress: 0,
      completed: 0,
      no_show: 0,
      cancelled: 0
    }

    appointments.forEach((appointment) => {
      if (!appointment) return
      
      // Use getDisplayStatus if provided, otherwise use appointment.status
      const displayStatus = getDisplayStatus 
        ? getDisplayStatus(appointment) 
        : (appointment.status || 'scheduled')
      
      switch (displayStatus) {
        case 'scheduled':
          counts.scheduled++
          break
        case 'in_progress':
          counts.in_progress++
          break
        case 'completed':
          counts.completed++
          break
        case 'no_show':
          counts.no_show++
          break
        case 'cancelled':
          counts.cancelled++
          break
        default:
          // For other statuses like 'rescheduled', don't count them
          break
      }
    })

    return counts
  }, [appointments, getDisplayStatus])

  return (
    <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-5">
      <div className="rounded-xl border border-blue-100 bg-blue-50/70 p-4">
        <p className="text-sm font-medium text-blue-700">
          {t('appointments.overview.scheduled', 'Scheduled')}
        </p>
        <p className="mt-2 text-2xl font-semibold text-blue-800">
          {statusCounts.scheduled}
        </p>
      </div>
      <div className="rounded-xl border border-indigo-100 bg-indigo-50/70 p-4">
        <p className="text-sm font-medium text-indigo-700">
          {t('appointments.overview.inProgress', 'In Progress')}
        </p>
        <p className="mt-2 text-2xl font-semibold text-indigo-800">
          {statusCounts.in_progress}
        </p>
      </div>
      <div className="rounded-xl border border-emerald-100 bg-emerald-50/70 p-4">
        <p className="text-sm font-medium text-emerald-700">
          {t('appointments.overview.completed', 'Completed')}
        </p>
        <p className="mt-2 text-2xl font-semibold text-emerald-800">
          {statusCounts.completed}
        </p>
      </div>
      <div className="rounded-xl border border-amber-100 bg-amber-50/70 p-4">
        <p className="text-sm font-medium text-amber-700">
          {t('appointments.overview.noShow', 'No Show')}
        </p>
        <p className="mt-2 text-2xl font-semibold text-amber-800">
          {statusCounts.no_show}
        </p>
      </div>
      <div className="rounded-xl border border-rose-100 bg-rose-50/70 p-4">
        <p className="text-sm font-medium text-rose-700">
          {t('appointments.overview.cancelled', 'Cancelled')}
        </p>
        <p className="mt-2 text-2xl font-semibold text-rose-800">
          {statusCounts.cancelled}
        </p>
      </div>
    </div>
  )
}

export default AppointmentsOverview

