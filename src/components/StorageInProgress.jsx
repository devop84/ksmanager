import { useEffect, useState } from 'react'
import sql from '../lib/neon'

function StorageInProgress({ onEditOrder = () => {}, onViewCustomer = () => {} }) {
  const [storages, setStorages] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [currentTime, setCurrentTime] = useState(new Date())

  // Update current time every minute
  useEffect(() => {
    setCurrentTime(new Date()) // Update immediately on mount
    
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 60000) // Update every minute

    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    const fetchStorages = async () => {
      try {
        setLoading(true)
        setError(null)

        // Fetch storage orders that are currently in progress
        // A storage is in progress if: not cancelled, and current time is between starting and ending
        // Using direct timestamp comparison - PostgreSQL handles timezone conversion automatically
        const rows = await sql`
          SELECT
            ost.order_id,
            ost.storage_id,
            ost.daily,
            ost.weekly,
            ost.monthly,
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
            AND ost.starting <= CURRENT_TIMESTAMP
            AND ost.ending >= CURRENT_TIMESTAMP
          ORDER BY ost.ending ASC
        `

        setStorages(rows || [])
      } catch (err) {
        console.error('Failed to load storage:', err)
        setError('Unable to load storage. Please try again later.')
      } finally {
        setLoading(false)
      }
    }

    fetchStorages()
    
    // Refresh storage every minute
    const interval = setInterval(fetchStorages, 60000)
    return () => clearInterval(interval)
  }, [])

  // Format date/time for display
  const formatDateTime = (dateString) => {
    if (!dateString) return '—'
    const date = new Date(dateString)
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    })
  }

  // Get storage type (daily, weekly, monthly)
  const getStorageType = (storage) => {
    if (storage.monthly) return 'Monthly'
    if (storage.weekly) return 'Weekly'
    if (storage.daily) return 'Daily'
    return '—'
  }

  // Calculate time remaining
  const getTimeRemaining = (ending) => {
    if (!ending) return '—'
    const end = new Date(ending)
    const now = currentTime
    const diff = end - now
    
    if (diff < 0) return 'Overdue'
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
    
    if (days > 0) {
      return `${days}d ${hours}h`
    }
    if (hours > 0) {
      return `${hours}h ${minutes}m`
    }
    return `${minutes}m`
  }

  if (loading) {
    return (
      <div className="rounded-xl bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Storage In Progress</h2>
        <div className="text-gray-600">Loading...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-xl bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Storage In Progress</h2>
        <div className="text-red-600">{error}</div>
      </div>
    )
  }

  return (
    <div className="rounded-xl bg-white p-2 sm:p-4 md:p-6 shadow-sm w-full">
      <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-4">Storage In Progress</h2>

      {storages.length === 0 ? (
        <div className="text-gray-600">No storage currently in progress.</div>
      ) : (
        <div className="space-y-3">
          {/* Desktop view */}
          <div className="hidden md:block overflow-x-auto border border-gray-200 rounded-xl">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Service
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Started
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Ends
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Time Remaining
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {storages.map((storage) => (
                  <tr
                    key={storage.order_id}
                    onClick={() =>
                      storage.customer_id
                        ? onViewCustomer({ id: storage.customer_id })
                        : onEditOrder({ id: storage.order_id })
                    }
                    className="hover:bg-gray-50 cursor-pointer"
                  >
                    <td className="px-4 py-3 text-sm text-gray-900 font-medium">
                      {storage.customer_name || '—'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {storage.service_name || '—'}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {formatDateTime(storage.starting)}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-600">
                      {formatDateTime(storage.ending)}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-indigo-600">
                      {getTimeRemaining(storage.ending)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile view */}
          <div className="md:hidden space-y-3">
            {storages.map((storage) => (
              <div
                key={storage.order_id}
                onClick={() =>
                  storage.customer_id
                    ? onViewCustomer({ id: storage.customer_id })
                    : onEditOrder({ id: storage.order_id })
                }
                className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex-1">
                    <p className="text-base font-semibold text-gray-900">
                      {storage.customer_name || '—'}
                    </p>
                    <p className="text-sm text-gray-500">{storage.service_name || '—'}</p>
                  </div>
                  <div className="text-right">
                    <span className="inline-flex items-center rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-medium text-indigo-800">
                      {getTimeRemaining(storage.ending)}
                    </span>
                  </div>
                </div>
                <dl className="mt-3 grid grid-cols-1 gap-x-4 gap-y-2 text-sm text-gray-600">
                  <div>
                    <dt className="text-gray-400 text-xs uppercase">Ends</dt>
                    <dd className="font-medium">{formatDateTime(storage.ending)}</dd>
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

export default StorageInProgress

