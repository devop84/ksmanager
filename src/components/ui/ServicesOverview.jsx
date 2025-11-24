import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useSettings } from '../../context/SettingsContext'

/**
 * ServicesOverview - Component for displaying service statistics
 * @param {Array} services - Array of service objects
 */
function ServicesOverview({ services = [] }) {
  const { t } = useTranslation()
  const { formatCurrency } = useSettings()

  const stats = useMemo(() => {
    if (!services || !Array.isArray(services)) {
      return {
        total: 0,
        active: 0,
        inactive: 0,
        totalCategories: 0
      }
    }

    let active = 0
    let inactive = 0
    const categories = new Set()

    services.forEach((service) => {
      if (!service) return

      // Count active/inactive
      const isActive = service.is_active === true || service.is_active === 'true'
      if (isActive) {
        active++
      } else {
        inactive++
      }

      // Count unique categories
      if (service.category_name) {
        categories.add(service.category_name)
      }
    })

    return {
      total: services.length,
      active,
      inactive,
      totalCategories: categories.size
    }
  }, [services])

  return (
    <div className="grid gap-4 md:grid-cols-4">
      {/* Total Services */}
      <div className="rounded-xl border border-indigo-100 bg-indigo-50/70 p-4">
        <p className="text-sm font-medium text-indigo-700">
          {t('services.overview.total', 'Total Services')}
        </p>
        <p className="mt-2 text-2xl font-semibold text-indigo-800">
          {stats.total}
        </p>
      </div>

      {/* Active Services */}
      <div className="rounded-xl border border-emerald-100 bg-emerald-50/70 p-4">
        <p className="text-sm font-medium text-emerald-700">
          {t('services.overview.active', 'Active')}
        </p>
        <p className="mt-2 text-2xl font-semibold text-emerald-800">
          {stats.active}
        </p>
      </div>

      {/* Inactive Services */}
      <div className="rounded-xl border border-gray-100 bg-gray-50/70 p-4">
        <p className="text-sm font-medium text-gray-700">
          {t('services.overview.inactive', 'Inactive')}
        </p>
        <p className="mt-2 text-2xl font-semibold text-gray-800">
          {stats.inactive}
        </p>
      </div>

      {/* Total Categories */}
      <div className="rounded-xl border border-blue-100 bg-blue-50/70 p-4">
        <p className="text-sm font-medium text-blue-700">
          {t('services.overview.categories', 'Categories')}
        </p>
        <p className="mt-2 text-2xl font-semibold text-blue-800">
          {stats.totalCategories}
        </p>
      </div>
    </div>
  )
}

export default ServicesOverview





