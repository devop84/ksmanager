import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'

/**
 * CustomersOverview - Component for displaying customer statistics by business channel
 * @param {Array} customers - Array of customer objects
 */
function CustomersOverview({ customers = [] }) {
  const { t } = useTranslation()

  const stats = useMemo(() => {
    if (!customers || !Array.isArray(customers)) {
      return {
        total: 0,
        direct: 0,
        agency: 0
      }
    }

    let direct = 0
    let agency = 0

    customers.forEach((customer) => {
      if (!customer) return
      
      // Check if customer has agency_id
      if (customer.agency_id) {
        agency++
      }
      // Otherwise, it's a direct customer
      else {
        direct++
      }
    })

    return {
      total: customers.length,
      direct,
      agency
    }
  }, [customers])

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {/* Total Customers */}
      <div className="rounded-xl border border-indigo-100 bg-indigo-50/70 p-4">
        <p className="text-sm font-medium text-indigo-700">
          {t('customers.overview.total', 'Total Customers')}
        </p>
        <p className="mt-2 text-2xl font-semibold text-indigo-800">
          {stats.total}
        </p>
      </div>

      {/* Direct Customers */}
      <div className="rounded-xl border border-emerald-100 bg-emerald-50/70 p-4">
        <p className="text-sm font-medium text-emerald-700">
          {t('customers.overview.direct', 'Direct')}
        </p>
        <p className="mt-2 text-2xl font-semibold text-emerald-800">
          {stats.direct}
        </p>
      </div>

      {/* Agency Customers */}
      <div className="rounded-xl border border-blue-100 bg-blue-50/70 p-4">
        <p className="text-sm font-medium text-blue-700">
          {t('customers.overview.agency', 'Agency')}
        </p>
        <p className="mt-2 text-2xl font-semibold text-blue-800">
          {stats.agency}
        </p>
      </div>
    </div>
  )
}

export default CustomersOverview

