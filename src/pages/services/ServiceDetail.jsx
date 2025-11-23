import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import sql from '../../lib/neon'
import { canModify } from '../../lib/permissions'
import { useSettings } from '../../context/SettingsContext'
import DetailInfoPanel from '../../components/ui/DetailInfoPanel'

function ServiceDetail({ serviceId, onEdit, onDelete, onBack, onAddPackage = () => {}, onViewPackage = () => {}, user = null }) {
  const { t } = useTranslation()
  const { formatCurrency, formatDateTime } = useSettings()
  const [service, setService] = useState(null)
  const [servicePackages, setServicePackages] = useState([])
  const [loading, setLoading] = useState(true)
  const [loadingPackages, setLoadingPackages] = useState(true)
  const [error, setError] = useState(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    const fetchService = async () => {
      try {
        setLoading(true)
        setError(null)
        const result = await sql`
          SELECT 
            s.id,
            s.name,
            s.description,
            s.base_price,
            s.currency,
            s.duration_unit,
            s.is_active,
            s.created_at,
            s.updated_at,
            sc.id AS category_id,
            sc.name AS category_name,
            sc.description AS category_description
          FROM services s
          LEFT JOIN service_categories sc ON s.category_id = sc.id
          WHERE s.id = ${serviceId}
          LIMIT 1
        `
        
        if (result && result.length > 0) {
          setService(result[0])
        } else {
          setError(t('serviceDetail.notFound', 'Service not found'))
        }
      } catch (err) {
        console.error('Failed to load service:', err)
        setError(t('serviceDetail.error.load', 'Unable to load service. Please try again later.'))
      } finally {
        setLoading(false)
      }
    }

    if (serviceId) {
      fetchService()
    }
  }, [serviceId, t])

  useEffect(() => {
    const fetchPackages = async () => {
      try {
        setLoadingPackages(true)
        const result = await sql`
          SELECT 
            sp.id,
            sp.name,
            sp.duration_hours,
            sp.duration_days,
            sp.duration_months,
            sp.price,
            sp.currency,
            sp.description,
            sp.is_active,
            sp.created_at,
            sp.updated_at
          FROM service_packages sp
          WHERE sp.service_id = ${serviceId}
          ORDER BY 
            CASE 
              WHEN sp.duration_hours IS NOT NULL THEN sp.duration_hours
              WHEN sp.duration_days IS NOT NULL THEN sp.duration_days
              WHEN sp.duration_months IS NOT NULL THEN sp.duration_months
              ELSE 0
            END ASC,
            sp.name ASC
        `
        setServicePackages(result || [])
      } catch (err) {
        console.error('Failed to load service packages:', err)
      } finally {
        setLoadingPackages(false)
      }
    }

    if (serviceId) {
      fetchPackages()
    }
  }, [serviceId])

  const handleDelete = async () => {
    if (!window.confirm(t('serviceDetail.confirm.delete', 'Are you sure you want to delete this service? This will also delete all associated packages.'))) {
      return
    }

    try {
      setDeleting(true)
      await sql`DELETE FROM services WHERE id = ${serviceId}`
      onDelete?.()
    } catch (err) {
      console.error('Failed to delete service:', err)
      alert(t('serviceDetail.error.delete', 'Unable to delete service. Please try again.'))
    } finally {
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="px-4 py-6 sm:p-6 lg:p-8">
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <div className="text-gray-600">{t('serviceDetail.loading', 'Loading service details...')}</div>
        </div>
      </div>
    )
  }

  if (error || !service) {
    return (
      <div className="px-4 py-6 sm:p-6 lg:p-8">
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <div className="text-red-600">{error || t('serviceDetail.notFound', 'Service not found')}</div>
          {onBack && (
            <button
              onClick={onBack}
              className="mt-4 rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
            >
              {t('serviceDetail.back', 'Back')}
            </button>
          )}
        </div>
      </div>
    )
  }

  const isActive = service.is_active === true || service.is_active === 'true'
  const formatAmount = (value) => formatCurrency(Number(value || 0), { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  
  // Helper function to format duration display based on service's duration_unit
  const formatDuration = (pkg) => {
    const durationUnit = service.duration_unit || 'none'
    
    if (durationUnit === 'none') {
      return '—'
    }
    
    if (durationUnit === 'hours' && pkg.duration_hours) {
      return `${pkg.duration_hours}h`
    }
    
    if (durationUnit === 'days' && pkg.duration_days) {
      return `${pkg.duration_days}d`
    }
    
    if (durationUnit === 'months' && pkg.duration_months) {
      return `${pkg.duration_months}mo`
    }
    
    return '—'
  }

  return (
    <div className="px-4 py-6 sm:p-6 lg:p-8">
      <div className="rounded-xl bg-white shadow-sm">
        {/* Header */}
        <div className="p-6">
          <button
            onClick={onBack}
            className="mb-6 flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            {t('serviceDetail.back', 'Back')}
          </button>
          
          <div>
            <div className="flex items-center gap-4 mb-2">
              <h1 className="text-3xl font-bold text-gray-900">{service.name || t('services.title', 'Service')}</h1>
              <span
                className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${
                  isActive
                    ? 'text-emerald-700 bg-emerald-50 border-emerald-100'
                    : 'text-gray-700 bg-gray-50 border-gray-200'
                }`}
              >
                {isActive ? t('serviceDetail.status.active', 'Active') : t('serviceDetail.status.inactive', 'Inactive')}
              </span>
            </div>
            {service.category_name && (
              <p className="text-gray-500 text-sm">
                {t('serviceDetail.category', 'Category')}: <span className="font-medium">{service.category_name}</span>
              </p>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="px-6 pb-6">
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Left Column - Service Details and Packages */}
            <div className="lg:col-span-2 space-y-6">
              {/* Pricing */}
              <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  {t('serviceDetail.pricing.title', 'Pricing')}
                </h2>
                <dl className="grid gap-4 md:grid-cols-2">
                  <div>
                    <dt className="text-xs font-medium text-gray-500 uppercase">{t('serviceDetail.pricing.basePrice', 'Base Price')}</dt>
                    <dd className="mt-1 text-2xl font-bold text-gray-900">
                      {formatAmount(service.base_price)}
                    </dd>
                    <dd className="mt-1 text-sm text-gray-500">{service.currency || 'BRL'}</dd>
                  </div>
                </dl>
              </div>

              {/* Description */}
              {service.description && (
                <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">
                    {t('serviceDetail.description.title', 'Description')}
                  </h2>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{service.description}</p>
                </div>
              )}

              {/* Category Details */}
              {service.category_description && (
                <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">
                    {t('serviceDetail.category.title', 'Category Information')}
                  </h2>
                  <p className="text-sm text-gray-700">{service.category_description}</p>
                </div>
              )}

              {/* Service Packages */}
              <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">
                    {t('serviceDetail.packages.title', 'Service Packages')}
                  </h2>
                  {canModify(user) && (
                    <button
                      onClick={() => onAddPackage?.(service)}
                      className="inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-semibold shadow-sm transition-colors bg-indigo-600 text-white hover:bg-indigo-500"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                      </svg>
                      {t('serviceDetail.packages.add', 'Add Package')}
                    </button>
                  )}
                </div>
                {loadingPackages ? (
                  <div className="text-gray-600 text-sm">{t('serviceDetail.packages.loading', 'Loading packages...')}</div>
                ) : servicePackages.length === 0 ? (
                  <p className="text-gray-500 text-sm">{t('serviceDetail.packages.empty', 'No packages found for this service.')}</p>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            {t('serviceDetail.packages.name', 'Package Name')}
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            {t('serviceDetail.packages.duration', 'Duration')}
                          </th>
                          <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            {t('serviceDetail.packages.price', 'Price')}
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            {t('serviceDetail.packages.status', 'Status')}
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {servicePackages.map((pkg) => {
                          const pkgActive = pkg.is_active === true || pkg.is_active === 'true'
                          return (
                            <tr
                              key={pkg.id}
                              onClick={() => onViewPackage?.(pkg)}
                              className="hover:bg-gray-50 cursor-pointer transition-colors"
                            >
                              <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                                {pkg.name}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                                {formatDuration(pkg)}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 text-right">
                                {formatAmount(pkg.price)}
                              </td>
                              <td className="px-4 py-3 whitespace-nowrap">
                                <span
                                  className={`inline-flex items-center rounded-full border px-2 py-1 text-xs font-semibold ${
                                    pkgActive
                                      ? 'text-emerald-700 bg-emerald-50 border-emerald-100'
                                      : 'text-gray-700 bg-gray-50 border-gray-200'
                                  }`}
                                >
                                  {pkgActive ? t('serviceDetail.packages.statusActive', 'Active') : t('serviceDetail.packages.statusInactive', 'Inactive')}
                                </span>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column - Metadata */}
            <div className="lg:col-span-1">
              <DetailInfoPanel
                title={t('serviceDetail.info.title', 'Service Information')}
                onEdit={() => onEdit?.(service)}
                onDelete={handleDelete}
                user={user}
                deleting={deleting}
              >
                <dl className="space-y-4 text-sm">
                  <div>
                    <dt className="text-xs font-medium text-gray-500 uppercase">{t('serviceDetail.info.id', 'ID')}</dt>
                    <dd className="mt-1 text-gray-900 font-mono">#{service.id}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-gray-500 uppercase">{t('serviceDetail.info.name', 'Name')}</dt>
                    <dd className="mt-1 text-gray-900">{service.name || '—'}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-gray-500 uppercase">{t('serviceDetail.info.category', 'Category')}</dt>
                    <dd className="mt-1 text-gray-900">{service.category_name || '—'}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-gray-500 uppercase">{t('serviceDetail.info.description', 'Description')}</dt>
                    <dd className="mt-1 text-gray-900 whitespace-pre-wrap">{service.description || '—'}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-gray-500 uppercase">{t('serviceDetail.info.basePrice', 'Base Price')}</dt>
                    <dd className="mt-1 text-gray-900">{formatAmount(service.base_price)}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-gray-500 uppercase">{t('serviceDetail.info.currency', 'Currency')}</dt>
                    <dd className="mt-1 text-gray-900">{service.currency || 'BRL'}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-gray-500 uppercase">{t('serviceDetail.info.durationUnit', 'Duration Unit')}</dt>
                    <dd className="mt-1 text-gray-900">{service.duration_unit || '—'}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-gray-500 uppercase">{t('serviceDetail.info.active', 'Active')}</dt>
                    <dd className="mt-1 text-gray-900">{isActive ? t('serviceDetail.status.active', 'Active') : t('serviceDetail.status.inactive', 'Inactive')}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-gray-500 uppercase">{t('serviceDetail.info.created', 'Created')}</dt>
                    <dd className="mt-1 text-gray-900">{formatDateTime(service.created_at)}</dd>
                  </div>
                  {service.updated_at && (
                    <div>
                      <dt className="text-xs font-medium text-gray-500 uppercase">{t('serviceDetail.info.updated', 'Last update')}</dt>
                      <dd className="mt-1 text-gray-900">{formatDateTime(service.updated_at)}</dd>
                    </div>
                  )}
                </dl>
              </DetailInfoPanel>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ServiceDetail

