import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import sql from '../lib/neon'
import { useSettings } from '../context/SettingsContext'

function RentalsInProgress({ onEditOrder = () => {}, onViewCustomer = () => {} }) {
  const [rentals, setRentals] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [currentTime, setCurrentTime] = useState(new Date())
  const { formatDateTime } = useSettings()
  const { t } = useTranslation()

  // Update current time every minute
  useEffect(() => {
    setCurrentTime(new Date()) // Update immediately on mount
    
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 60000) // Update every minute

    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    const fetchRentals = async () => {
      try {
        setLoading(true)
        setError(null)

        // Fetch all non-cancelled rentals and filter in JavaScript
        // This helps debug timezone issues
        const allRows = await sql`
          SELECT
            orent.order_id,
            orent.equipment_id,
            orent.hourly,
            orent.daily,
            orent.weekly,
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
          ORDER BY orent.ending ASC
        `

        // Filter in JavaScript to ensure proper timezone handling
        const now = new Date()
        const inProgressRentals = (allRows || []).filter((rental) => {
          if (!rental.starting || !rental.ending) return false
          
          const start = new Date(rental.starting)
          const end = new Date(rental.ending)
          
          // Debug logging for the first rental
          if (allRows && allRows.length > 0 && rental === allRows[0]) {
            console.log('Rental check:', {
              order_id: rental.order_id,
              starting: rental.starting,
              ending: rental.ending,
              startDate: start.toISOString(),
              endDate: end.toISOString(),
              now: now.toISOString(),
              startPassed: start <= now,
              endNotPassed: end >= now,
              isInProgress: start <= now && end >= now
            })
          }
          
          return start <= now && end >= now
        })

        console.log(`Found ${inProgressRentals.length} rentals in progress out of ${allRows?.length || 0} total rentals`)

        setRentals(inProgressRentals)
      } catch (err) {
        console.error('Failed to load rentals:', err)
        setError(t('dashboard.rentals.error.load'))
      } finally {
        setLoading(false)
      }
    }

    fetchRentals()
    
    // Refresh rentals every minute
    const interval = setInterval(fetchRentals, 60000)
    return () => clearInterval(interval)
  }, [])

  // Calculate time remaining
  const getTimeRemaining = (ending) => {
    if (!ending) return '—'
    const end = new Date(ending)
    const now = currentTime
    const diff = end - now
    
    if (diff < 0) return t('dashboard.rentals.time.overdue')
    
    const totalHours = Math.floor(diff / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    
    // If more than 24 hours, show in days
    if (totalHours >= 24) {
      const days = Math.floor(totalHours / 24)
      const remainingHours = totalHours % 24
      if (remainingHours > 0) {
        return `${days}d ${remainingHours}h`
      }
      return `${days}d`
    }
    
    // Less than 24 hours, show hours and minutes
    if (totalHours > 0) {
      return `${totalHours}h ${minutes}m`
    }
    return `${minutes}m`
  }

  if (loading) {
    return (
      <div className="rounded-xl bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">{t('dashboard.rentals.title')}</h2>
        <div className="text-gray-600">{t('common.loading')}</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-xl bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">{t('dashboard.rentals.title')}</h2>
        <div className="text-red-600">{error}</div>
      </div>
    )
  }

  return (
    <div className="rounded-xl bg-white p-2 sm:p-4 md:p-6 shadow-sm w-full">
      <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-4">{t('dashboard.rentals.title')}</h2>

      {rentals.length === 0 ? (
        <div className="text-gray-600">{t('common.empty')}</div>
      ) : (
        <div className="space-y-3">
          {/* Desktop view */}
          <div className="hidden md:block overflow-x-auto border border-gray-200 rounded-xl">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    {t('dashboard.rentals.table.customer')}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    {t('dashboard.rentals.table.service')}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    {t('dashboard.rentals.table.started')}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    {t('dashboard.rentals.table.ends')}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    {t('dashboard.rentals.table.timeRemaining')}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {rentals.map((rental) => (
                  <tr
                    key={rental.order_id}
                    onClick={() =>
                      rental.customer_id ? onViewCustomer({ id: rental.customer_id }) : onEditOrder({ id: rental.order_id })
                    }
                    className="hover:bg-gray-50 cursor-pointer"
                  >
                    <td className="px-4 py-3 text-sm text-gray-900 font-medium">
                      {rental.customer_name || '—'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {rental.service_name || '—'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {formatDateTime(rental.starting)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {formatDateTime(rental.ending)}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-indigo-600">
                      {getTimeRemaining(rental.ending)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile view */}
          <div className="md:hidden space-y-3">
            {rentals.map((rental) => (
              <div
                key={rental.order_id}
                onClick={() =>
                  rental.customer_id ? onViewCustomer({ id: rental.customer_id }) : onEditOrder({ id: rental.order_id })
                }
                className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex-1">
                    <p className="text-base font-semibold text-gray-900">
                      {rental.customer_name || '—'}
                    </p>
                    <p className="text-sm text-gray-500">{rental.service_name || '—'}</p>
                  </div>
                  <div className="text-right">
                    <span className="inline-flex items-center rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-medium text-indigo-800">
                      {getTimeRemaining(rental.ending)}
                    </span>
                  </div>
                </div>
                <dl className="mt-3 grid grid-cols-1 gap-x-4 gap-y-2 text-sm text-gray-600">
                  <div>
                    <dt className="text-gray-400 text-xs uppercase">{t('dashboard.rentals.mobile.ends')}</dt>
                    <dd className="font-medium">{formatDateTime(rental.ending)}</dd>
                  </div>
                </dl>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default RentalsInProgress

