import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import sql from '../../lib/neon'

/**
 * HotelsOverview - Component for displaying hotel statistics
 * @param {Array} hotels - Array of hotel objects
 */
function HotelsOverview({ hotels = [] }) {
  const { t } = useTranslation()
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)

        // Fetch all customers with hotel_id
        const customersResult = await sql`
          SELECT 
            c.hotel_id,
            c.id AS customer_id
          FROM customers c
          WHERE c.hotel_id IS NOT NULL
        `
        setCustomers(customersResult || [])
      } catch (err) {
        console.error('Failed to load hotel overview data:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const stats = useMemo(() => {
    if (!hotels || !Array.isArray(hotels)) {
      return {
        total: 0,
        topHotels: []
      }
    }

    // Calculate customer count per hotel
    const hotelCustomerCount = new Map()
    customers.forEach((customer) => {
      if (!customer || !customer.hotel_id) return
      const current = hotelCustomerCount.get(customer.hotel_id) || 0
      hotelCustomerCount.set(customer.hotel_id, current + 1)
    })

    // Get top 3 hotels by customer count
    const topHotelsArray = Array.from(hotelCustomerCount.entries())
      .map(([hotelId, count]) => {
        const hotel = hotels.find(h => h.id === hotelId)
        return {
          id: hotelId,
          name: hotel?.name || `Hotel ${hotelId}`,
          customerCount: count
        }
      })
      .filter(item => item.name) // Only include if hotel exists
      .sort((a, b) => b.customerCount - a.customerCount)
      .slice(0, 3)

    return {
      total: hotels.length,
      topHotels: topHotelsArray
    }
  }, [hotels, customers])

  if (loading) {
    return (
      <div className="text-gray-600 text-sm py-4">
        {t('hotels.overview.loading', 'Loading overview...')}
      </div>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {/* Total Hotels */}
      <div className="rounded-xl border border-indigo-100 bg-indigo-50/70 p-4">
        <p className="text-sm font-medium text-indigo-700">
          {t('hotels.overview.total', 'Hotel Count')}
        </p>
        <p className="mt-2 text-2xl font-semibold text-indigo-800">
          {stats.total}
        </p>
      </div>

      {/* Top 3 Hotels */}
      <div className="rounded-xl border border-blue-100 bg-blue-50/70 p-4">
        <p className="text-sm font-medium text-blue-700">
          {t('hotels.overview.topHotels', 'Top 3 Hotels')}
        </p>
        {stats.topHotels.length > 0 ? (
          <div className="mt-2 space-y-1">
            {stats.topHotels.map((hotel, index) => (
              <p key={hotel.id} className="text-sm text-blue-800">
                <span className="font-semibold">#{index + 1}</span> {hotel.name} ({hotel.customerCount})
              </p>
            ))}
          </div>
        ) : (
          <p className="mt-2 text-sm text-gray-500">
            {t('hotels.overview.noData', 'No data')}
          </p>
        )}
      </div>
    </div>
  )
}

export default HotelsOverview






