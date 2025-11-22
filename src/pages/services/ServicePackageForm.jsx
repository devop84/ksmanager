import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import sql from '../../lib/neon'

const initialFormState = {
  service_id: '',
  name: '',
  duration_hours: '',
  duration_days: '',
  duration_months: '',
  price: '',
  currency: 'BRL',
  description: '',
  is_active: true
}

function ServicePackageForm({ package: pkg, service, onCancel, onSaved }) {
  const isEditing = Boolean(pkg?.id)
  const { t } = useTranslation()
  const [formData, setFormData] = useState(initialFormState)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [services, setServices] = useState([])
  const [selectedService, setSelectedService] = useState(null)

  useEffect(() => {
    if (pkg) {
      setFormData({
        service_id: pkg.service_id ?? '',
        name: pkg.name || '',
        duration_hours: pkg.duration_hours ?? '',
        duration_days: pkg.duration_days ?? '',
        duration_months: pkg.duration_months ?? '',
        price: pkg.price ?? '',
        currency: pkg.currency || 'BRL',
        description: pkg.description || '',
        is_active: pkg.is_active !== false && pkg.is_active !== 'false'
      })
      // Load service to get duration_unit
      if (pkg.service_id) {
        fetchServiceDurationUnit(pkg.service_id)
      }
    } else if (service) {
      // Pre-fill service_id if coming from service detail page
      setFormData({
        ...initialFormState,
        service_id: service.id.toString()
      })
      setSelectedService(service)
    } else {
      setFormData(initialFormState)
      setSelectedService(null)
    }
  }, [pkg, service])

  const fetchServiceDurationUnit = async (serviceId) => {
    try {
      const result = await sql`
        SELECT id, duration_unit
        FROM services
        WHERE id = ${Number(serviceId)}
        LIMIT 1
      `
      if (result && result.length > 0) {
        setSelectedService(result[0])
      }
    } catch (err) {
      console.error('Failed to load service duration unit:', err)
    }
  }

  useEffect(() => {
    const fetchServices = async () => {
      try {
        const result = await sql`
          SELECT 
            s.id,
            s.name,
            s.duration_unit,
            sc.name AS category_name
          FROM services s
          LEFT JOIN service_categories sc ON s.category_id = sc.id
          ORDER BY s.name ASC
        `
        setServices(result || [])
      } catch (err) {
        console.error('Failed to load services:', err)
      }
    }

    fetchServices()
  }, [])

  const handleChange = async (event) => {
    const { name, value, type, checked } = event.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))

    // When service changes, fetch its duration_unit
    if (name === 'service_id' && value) {
      await fetchServiceDurationUnit(value)
    }
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSaving(true)
    setError(null)

    const priceValue = formData.price !== '' ? Number(formData.price) : null
    const serviceIdValue = formData.service_id ? Number(formData.service_id) : null
    
    // Get duration values based on service's duration_unit
    const durationUnit = selectedService?.duration_unit || 'none'
    let durationHours = null
    let durationDays = null
    let durationMonths = null
    
    if (durationUnit === 'hours') {
      durationHours = formData.duration_hours !== '' ? Number(formData.duration_hours) : null
    } else if (durationUnit === 'days') {
      durationDays = formData.duration_days !== '' ? Number(formData.duration_days) : null
    } else if (durationUnit === 'months') {
      durationMonths = formData.duration_months !== '' ? Number(formData.duration_months) : null
    }

    if (!formData.name.trim()) {
      setError(t('servicePackageForm.errors.nameRequired', 'Package name is required.'))
      setSaving(false)
      return
    }

    if (serviceIdValue === null) {
      setError(t('servicePackageForm.errors.serviceRequired', 'Service is required.'))
      setSaving(false)
      return
    }

    if (priceValue === null || priceValue < 0) {
      setError(t('servicePackageForm.errors.priceRequired', 'Valid price is required.'))
      setSaving(false)
      return
    }

    try {
      if (isEditing) {
        await sql`
          UPDATE service_packages
          SET service_id = ${serviceIdValue},
              name = ${formData.name},
              duration_hours = ${durationHours},
              duration_days = ${durationDays},
              duration_months = ${durationMonths},
              price = ${priceValue},
              currency = ${formData.currency},
              description = ${formData.description || null},
              is_active = ${formData.is_active},
              updated_at = CURRENT_TIMESTAMP
          WHERE id = ${pkg.id}
        `
      } else {
        await sql`
          INSERT INTO service_packages (service_id, name, duration_hours, duration_days, duration_months, price, currency, description, is_active)
          VALUES (${serviceIdValue}, ${formData.name}, ${durationHours}, ${durationDays}, ${durationMonths}, ${priceValue}, ${formData.currency}, ${formData.description || null}, ${formData.is_active})
        `
      }

      onSaved?.()
    } catch (err) {
      console.error('Failed to save service package:', err)
      setError(t('servicePackageForm.errors.save', 'Unable to save service package. Please try again.'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="px-4 py-6 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-3xl rounded-xl bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {isEditing ? t('servicePackageForm.title.edit', 'Edit Service Package') : t('servicePackageForm.title.new', 'Add Service Package')}
            </h1>
            <p className="text-gray-500 text-sm">
              {isEditing
                ? t('servicePackageForm.subtitle.edit', 'Update service package information and save changes.')
                : t('servicePackageForm.subtitle.new', 'Fill out the details to add a new service package.')}
            </p>
          </div>
          <button
            onClick={onCancel}
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
          >
            {t('servicePackageForm.buttons.cancel', 'Cancel')}
          </button>
        </div>

        {error && (
          <div className="mt-4 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="service_id">
              {t('servicePackageForm.fields.service', 'Service *')}
            </label>
            <select
              id="service_id"
              name="service_id"
              required
              value={formData.service_id}
              onChange={handleChange}
              disabled={!!service} // Disable if pre-selected from service detail
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 disabled:bg-gray-100 disabled:cursor-not-allowed"
            >
              <option value="">{t('servicePackageForm.fields.selectService', 'Select a service...')}</option>
              {services.map((svc) => (
                <option key={svc.id} value={svc.id}>
                  {svc.name} {svc.category_name ? `(${svc.category_name})` : ''}
                </option>
              ))}
            </select>
            {service && (
              <p className="mt-1 text-xs text-gray-500">{t('servicePackageForm.fields.serviceLocked', 'Service is locked from parent service.')}</p>
            )}
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="name">
              {t('servicePackageForm.fields.name', 'Package Name *')}
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              value={formData.name}
              onChange={handleChange}
              placeholder={t('servicePackageForm.fields.namePlaceholder', 'e.g., 2h Package, 4h Package')}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {(() => {
              const durationUnit = selectedService?.duration_unit || (formData.service_id ? services.find(s => s.id.toString() === formData.service_id)?.duration_unit : null) || 'none'
              
              if (durationUnit === 'none') {
                return null // Don't show duration input if service has no duration unit
              }
              
              if (durationUnit === 'hours') {
                return (
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="duration_hours">
                      {t('servicePackageForm.fields.durationHours', 'Duration (hours)')}
                    </label>
                    <input
                      id="duration_hours"
                      name="duration_hours"
                      type="number"
                      step="0.5"
                      min="0"
                      value={formData.duration_hours}
                      onChange={handleChange}
                      placeholder={t('servicePackageForm.fields.durationPlaceholder', 'e.g., 2, 4, 6.5')}
                      className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                    />
                  </div>
                )
              }
              
              if (durationUnit === 'days') {
                return (
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="duration_days">
                      {t('servicePackageForm.fields.durationDays', 'Duration (days)')}
                    </label>
                    <input
                      id="duration_days"
                      name="duration_days"
                      type="number"
                      step="1"
                      min="0"
                      value={formData.duration_days}
                      onChange={handleChange}
                      placeholder={t('servicePackageForm.fields.durationPlaceholder', 'e.g., 1, 7, 30')}
                      className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                    />
                  </div>
                )
              }
              
              if (durationUnit === 'months') {
                return (
                  <div>
                    <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="duration_months">
                      {t('servicePackageForm.fields.durationMonths', 'Duration (months)')}
                    </label>
                    <input
                      id="duration_months"
                      name="duration_months"
                      type="number"
                      step="1"
                      min="0"
                      value={formData.duration_months}
                      onChange={handleChange}
                      placeholder={t('servicePackageForm.fields.durationPlaceholder', 'e.g., 1, 3, 6')}
                      className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                    />
                  </div>
                )
              }
              
              return null
            })()}

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="price">
                {t('servicePackageForm.fields.price', 'Price *')}
              </label>
              <div className="flex">
                <input
                  id="price"
                  name="price"
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={formData.price}
                  onChange={handleChange}
                  className="w-full rounded-l-lg border border-gray-300 px-4 py-2 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                />
                <select
                  name="currency"
                  value={formData.currency}
                  onChange={handleChange}
                  className="rounded-r-lg border border-l-0 border-gray-300 bg-gray-50 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                >
                  <option value="BRL">BRL</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                </select>
              </div>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="description">
              {t('servicePackageForm.fields.description', 'Description')}
            </label>
            <textarea
              id="description"
              name="description"
              rows="4"
              value={formData.description}
              onChange={handleChange}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
            />
          </div>

          <div className="flex items-center">
            <input
              id="is_active"
              name="is_active"
              type="checkbox"
              checked={formData.is_active}
              onChange={handleChange}
              className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            <label htmlFor="is_active" className="ml-2 block text-sm text-gray-700">
              {t('servicePackageForm.fields.isActive', 'Package is active and available')}
            </label>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onCancel}
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
            >
              {t('servicePackageForm.buttons.cancel', 'Cancel')}
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving
                ? t('servicePackageForm.buttons.saving', 'Saving...')
                : isEditing
                ? t('servicePackageForm.buttons.update', 'Update Package')
                : t('servicePackageForm.buttons.create', 'Create Package')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ServicePackageForm

