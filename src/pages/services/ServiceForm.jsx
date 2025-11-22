import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import sql from '../../lib/neon'

const initialFormState = {
  name: '',
  description: '',
  category_id: '',
  base_price: '',
  currency: 'BRL',
  duration_unit: 'none',
  is_active: true
}

function ServiceForm({ service, onCancel, onSaved }) {
  const isEditing = Boolean(service?.id)
  const { t } = useTranslation()
  const [formData, setFormData] = useState(initialFormState)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [categories, setCategories] = useState([])

  useEffect(() => {
    if (service) {
      setFormData({
        name: service.name || '',
        description: service.description || '',
        category_id: service.category_id ?? '',
        base_price: service.base_price ?? '',
        currency: service.currency || 'BRL',
        duration_unit: service.duration_unit || 'none',
        is_active: service.is_active !== false && service.is_active !== 'false'
      })
    } else {
      setFormData(initialFormState)
    }
  }, [service])

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const result = await sql`
          SELECT id, name
          FROM service_categories
          ORDER BY name ASC
        `
        setCategories(result || [])
      } catch (err) {
        console.error('Failed to load service categories:', err)
      }
    }

    fetchCategories()
  }, [])

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSaving(true)
    setError(null)

    const basePriceValue = formData.base_price !== '' ? Number(formData.base_price) : null
    const categoryIdValue = formData.category_id ? Number(formData.category_id) : null

    if (!formData.name.trim()) {
      setError(t('serviceForm.errors.nameRequired', 'Service name is required.'))
      setSaving(false)
      return
    }

    if (categoryIdValue === null) {
      setError(t('serviceForm.errors.categoryRequired', 'Service category is required.'))
      setSaving(false)
      return
    }

    if (basePriceValue === null || basePriceValue < 0) {
      setError(t('serviceForm.errors.priceRequired', 'Valid base price is required.'))
      setSaving(false)
      return
    }

    try {
      if (isEditing) {
        await sql`
          UPDATE services
          SET name = ${formData.name},
              description = ${formData.description || null},
              category_id = ${categoryIdValue},
              base_price = ${basePriceValue},
              currency = ${formData.currency},
              duration_unit = ${formData.duration_unit || 'none'},
              is_active = ${formData.is_active},
              updated_at = CURRENT_TIMESTAMP
          WHERE id = ${service.id}
        `
      } else {
        await sql`
          INSERT INTO services (name, description, category_id, base_price, currency, duration_unit, is_active)
          VALUES (${formData.name}, ${formData.description || null}, ${categoryIdValue}, ${basePriceValue}, ${formData.currency}, ${formData.duration_unit || 'none'}, ${formData.is_active})
        `
      }

      onSaved?.()
    } catch (err) {
      console.error('Failed to save service:', err)
      setError(t('serviceForm.errors.save', 'Unable to save service. Please try again.'))
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
              {isEditing ? t('serviceForm.title.edit', 'Edit Service') : t('serviceForm.title.new', 'Add Service')}
            </h1>
            <p className="text-gray-500 text-sm">
              {isEditing
                ? t('serviceForm.subtitle.edit', 'Update service information and save changes.')
                : t('serviceForm.subtitle.new', 'Fill out the details to add a new service.')}
            </p>
          </div>
          <button
            onClick={onCancel}
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
          >
            {t('serviceForm.buttons.cancel', 'Cancel')}
          </button>
        </div>

        {error && (
          <div className="mt-4 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="name">
              {t('serviceForm.fields.name', 'Service Name *')}
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              value={formData.name}
              onChange={handleChange}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="category_id">
              {t('serviceForm.fields.category', 'Category *')}
            </label>
            <select
              id="category_id"
              name="category_id"
              required
              value={formData.category_id}
              onChange={handleChange}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
            >
              <option value="">{t('serviceForm.fields.selectCategory', 'Select a category...')}</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="base_price">
                {t('serviceForm.fields.basePrice', 'Base Price *')}
              </label>
              <div className="flex">
                <input
                  id="base_price"
                  name="base_price"
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={formData.base_price}
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
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="duration_unit">
                {t('serviceForm.fields.durationUnit', 'Duration Unit')}
              </label>
              <select
                id="duration_unit"
                name="duration_unit"
                value={formData.duration_unit}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
              >
                <option value="none">{t('serviceForm.durationUnit.none', 'None')}</option>
                <option value="hours">{t('serviceForm.durationUnit.hours', 'Hours')}</option>
                <option value="days">{t('serviceForm.durationUnit.days', 'Days')}</option>
                <option value="months">{t('serviceForm.durationUnit.months', 'Months')}</option>
              </select>
              <p className="mt-1 text-xs text-gray-500">
                {t('serviceForm.fields.durationUnit.help', 'Select the unit for package durations (e.g., lessons in hours, storage in days)')}
              </p>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="description">
              {t('serviceForm.fields.description', 'Description')}
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
              {t('serviceForm.fields.isActive', 'Service is active and available')}
            </label>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onCancel}
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
            >
              {t('serviceForm.buttons.cancel', 'Cancel')}
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving
                ? t('serviceForm.buttons.saving', 'Saving...')
                : isEditing
                ? t('serviceForm.buttons.update', 'Update Service')
                : t('serviceForm.buttons.create', 'Create Service')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ServiceForm

