import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import sql from '../../lib/neon'
import { canModify } from '../../lib/permissions'
import { useSettings } from '../../context/SettingsContext'
import DetailInfoPanel from '../../components/ui/DetailInfoPanel'

function ServicePackageDetail({ packageId, onEdit, onDelete, onBack, onViewService = () => {}, user = null }) {
  const { t } = useTranslation()
  const { formatCurrency, formatDateTime } = useSettings()
  const [pkg, setPackage] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    const fetchPackage = async () => {
      try {
        setLoading(true)
        setError(null)
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
            sp.updated_at,
            sp.service_id,
            s.name AS service_name,
            s.base_price AS service_base_price,
            s.duration_unit,
            sc.id AS category_id,
            sc.name AS category_name
          FROM service_packages sp
          LEFT JOIN services s ON sp.service_id = s.id
          LEFT JOIN service_categories sc ON s.category_id = sc.id
          WHERE sp.id = ${packageId}
          LIMIT 1
        `
        
        if (result && result.length > 0) {
          setPackage(result[0])
        } else {
          setError(t('servicePackageDetail.notFound', 'Service package not found'))
        }
      } catch (err) {
        console.error('Failed to load service package:', err)
        setError(t('servicePackageDetail.error.load', 'Unable to load service package. Please try again later.'))
      } finally {
        setLoading(false)
      }
    }

    if (packageId) {
      fetchPackage()
    }
  }, [packageId, t])

  const handleDelete = async () => {
    if (!window.confirm(t('servicePackageDetail.confirm.delete', 'Are you sure you want to delete this service package? This action cannot be undone.'))) {
      return
    }

    try {
      setDeleting(true)
      await sql`DELETE FROM service_packages WHERE id = ${packageId}`
      onDelete?.()
    } catch (err) {
      console.error('Failed to delete service package:', err)
      alert(t('servicePackageDetail.error.delete', 'Unable to delete service package. Please try again.'))
    } finally {
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="px-4 py-6 sm:p-6 lg:p-8">
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <div className="text-gray-600">{t('servicePackageDetail.loading', 'Loading package details...')}</div>
        </div>
      </div>
    )
  }

  if (error || !pkg) {
    return (
      <div className="px-4 py-6 sm:p-6 lg:p-8">
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <div className="text-red-600">{error || t('servicePackageDetail.notFound', 'Service package not found')}</div>
          {onBack && (
            <button
              onClick={onBack}
              className="mt-4 rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
            >
              {t('servicePackageDetail.back', 'Back')}
            </button>
          )}
        </div>
      </div>
    )
  }

  const isActive = pkg.is_active === true || pkg.is_active === 'true'
  const formatAmount = (value) => formatCurrency(Number(value || 0), { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  
  // Helper function to format duration display based on service's duration_unit
  const formatDuration = (pkg) => {
    const durationUnit = pkg.duration_unit || 'none'
    
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
            {t('servicePackageDetail.back', 'Back')}
          </button>
          
          <div>
            <div className="flex items-center gap-4 mb-2">
              <h1 className="text-3xl font-bold text-gray-900">{pkg.name || t('servicePackages.title', 'Service Package')}</h1>
              <span
                className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${
                  isActive
                    ? 'text-emerald-700 bg-emerald-50 border-emerald-100'
                    : 'text-gray-700 bg-gray-50 border-gray-200'
                }`}
              >
                {isActive ? t('servicePackageDetail.status.active', 'Active') : t('servicePackageDetail.status.inactive', 'Inactive')}
              </span>
            </div>
            {pkg.service_name && (
              <button
                onClick={() => onViewService?.({ id: pkg.service_id, name: pkg.service_name })}
                className="text-indigo-600 hover:text-indigo-900 text-sm font-medium"
              >
                {t('servicePackageDetail.service', 'Service')}: <span className="underline">{pkg.service_name}</span>
              </button>
            )}
            {pkg.category_name && (
              <p className="text-gray-500 text-sm mt-1">
                {t('servicePackageDetail.category', 'Category')}: <span className="font-medium">{pkg.category_name}</span>
              </p>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className="px-6 pb-6">
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Left Column - Package Details */}
            <div className="lg:col-span-2 space-y-6">
              {/* Pricing */}
              <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  {t('servicePackageDetail.pricing.title', 'Pricing & Duration')}
                </h2>
                <dl className="grid gap-4 md:grid-cols-2">
                  <div>
                    <dt className="text-xs font-medium text-gray-500 uppercase">{t('servicePackageDetail.pricing.price', 'Package Price')}</dt>
                    <dd className="mt-1 text-2xl font-bold text-gray-900">
                      {formatAmount(pkg.price)}
                    </dd>
                    <dd className="mt-1 text-sm text-gray-500">{pkg.currency || 'BRL'}</dd>
                  </div>
                  {formatDuration(pkg) !== '—' && (
                    <div>
                      <dt className="text-xs font-medium text-gray-500 uppercase">{t('servicePackageDetail.pricing.duration', 'Duration')}</dt>
                      <dd className="mt-1 text-2xl font-bold text-gray-900">
                        {formatDuration(pkg)}
                      </dd>
                    </div>
                  )}
                  {pkg.service_base_price && formatDuration(pkg) !== '—' && (
                    <div className="md:col-span-2">
                      <dt className="text-xs font-medium text-gray-500 uppercase">{t('servicePackageDetail.pricing.comparison', 'Price Comparison')}</dt>
                      <dd className="mt-1 text-sm text-gray-600">
                        {(() => {
                          const durationUnit = pkg.duration_unit || 'none'
                          const duration = durationUnit === 'hours' ? pkg.duration_hours : 
                                           durationUnit === 'days' ? pkg.duration_days : 
                                           durationUnit === 'months' ? pkg.duration_months : null
                          const unitLabel = durationUnit === 'hours' ? '/h' : 
                                            durationUnit === 'days' ? '/d' : 
                                            durationUnit === 'months' ? '/mo' : ''
                          const calculatedPrice = duration ? Number(pkg.service_base_price) * Number(duration) : null
                          
                          if (!calculatedPrice) return null
                          
                          const durationDisplay = durationUnit === 'hours' ? `${duration}h` : 
                                                   durationUnit === 'days' ? `${duration}d` : 
                                                   durationUnit === 'months' ? `${duration}mo` : ''
                          
                          return (
                            <>
                              {t('servicePackageDetail.pricing.baseServicePrice', 'Base service price')}: {formatAmount(pkg.service_base_price)}{unitLabel} × {durationDisplay} = {formatAmount(calculatedPrice)}
                              {' '}
                              {Number(pkg.price) < calculatedPrice && (
                                <span className="text-emerald-600 font-semibold">
                                  ({t('servicePackageDetail.pricing.savings', 'You save')} {formatAmount(calculatedPrice - Number(pkg.price))})
                                </span>
                              )}
                            </>
                          )
                        })()}
                      </dd>
                    </div>
                  )}
                </dl>
              </div>

              {/* Description */}
              {pkg.description && (
                <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">
                    {t('servicePackageDetail.description.title', 'Description')}
                  </h2>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{pkg.description}</p>
                </div>
              )}
            </div>

            {/* Right Column - Metadata */}
            <div className="lg:col-span-1">
              <DetailInfoPanel
                title={t('servicePackageDetail.info.title', 'Package Information')}
                onEdit={() => onEdit?.(pkg)}
                onDelete={handleDelete}
                user={user}
                deleting={deleting}
              >
                <dl className="space-y-4 text-sm">
                  <div>
                    <dt className="text-xs font-medium text-gray-500 uppercase">{t('servicePackageDetail.info.id', 'ID')}</dt>
                    <dd className="mt-1 text-gray-900 font-mono">#{pkg.id}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-gray-500 uppercase">{t('servicePackageDetail.info.name', 'Name')}</dt>
                    <dd className="mt-1 text-gray-900">{pkg.name || '—'}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-gray-500 uppercase">{t('servicePackageDetail.info.service', 'Service')}</dt>
                    <dd className="mt-1 text-gray-900">
                      {pkg.service_name ? (
                        <button
                          onClick={() => onViewService?.({ id: pkg.service_id, name: pkg.service_name })}
                          className="text-indigo-600 hover:text-indigo-900 underline"
                        >
                          {pkg.service_name}
                        </button>
                      ) : '—'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-gray-500 uppercase">{t('servicePackageDetail.info.description', 'Description')}</dt>
                    <dd className="mt-1 text-gray-900 whitespace-pre-wrap">{pkg.description || '—'}</dd>
                  </div>
                  {pkg.duration_hours && (
                    <div>
                      <dt className="text-xs font-medium text-gray-500 uppercase">{t('servicePackageDetail.info.durationHours', 'Duration (Hours)')}</dt>
                      <dd className="mt-1 text-gray-900">{pkg.duration_hours}</dd>
                    </div>
                  )}
                  {pkg.duration_days && (
                    <div>
                      <dt className="text-xs font-medium text-gray-500 uppercase">{t('servicePackageDetail.info.durationDays', 'Duration (Days)')}</dt>
                      <dd className="mt-1 text-gray-900">{pkg.duration_days}</dd>
                    </div>
                  )}
                  {pkg.duration_months && (
                    <div>
                      <dt className="text-xs font-medium text-gray-500 uppercase">{t('servicePackageDetail.info.durationMonths', 'Duration (Months)')}</dt>
                      <dd className="mt-1 text-gray-900">{pkg.duration_months}</dd>
                    </div>
                  )}
                  <div>
                    <dt className="text-xs font-medium text-gray-500 uppercase">{t('servicePackageDetail.info.price', 'Price')}</dt>
                    <dd className="mt-1 text-gray-900">{formatAmount(pkg.price)}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-gray-500 uppercase">{t('servicePackageDetail.info.currency', 'Currency')}</dt>
                    <dd className="mt-1 text-gray-900">{pkg.currency || 'BRL'}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-gray-500 uppercase">{t('servicePackageDetail.info.active', 'Active')}</dt>
                    <dd className="mt-1 text-gray-900">{isActive ? t('servicePackageDetail.status.active', 'Active') : t('servicePackageDetail.status.inactive', 'Inactive')}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-gray-500 uppercase">{t('servicePackageDetail.info.created', 'Created')}</dt>
                    <dd className="mt-1 text-gray-900">{formatDateTime(pkg.created_at)}</dd>
                  </div>
                  {pkg.updated_at && (
                    <div>
                      <dt className="text-xs font-medium text-gray-500 uppercase">{t('servicePackageDetail.info.updated', 'Last update')}</dt>
                      <dd className="mt-1 text-gray-900">{formatDateTime(pkg.updated_at)}</dd>
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

export default ServicePackageDetail

