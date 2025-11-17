import { useEffect, useMemo, useState } from 'react'
import sql from '../lib/neon'

const baseFormState = {
  id: null,
  name: '',
  description: '',
  category_id: null,
  active: true,
  default_duration_hours: 1,
  base_price_per_hour: 0,
  requires_package_pricing: false,
  gear_id: '',
  hourly_rate: '',
  daily_rate: '',
  weekly_rate: '',
  storage_daily_rate: '',
  storage_weekly_rate: '',
  storage_monthly_rate: ''
}

function ServicesForm({ service, onCancel, onSaved }) {
  const isEditing = Boolean(service?.id)
  const [formData, setFormData] = useState(baseFormState)
  const [packageRows, setPackageRows] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    const loadForm = async () => {
      try {
        setLoading(true)
        const categoryRows = await sql`SELECT id, name FROM service_categories ORDER BY name`
        setCategories(categoryRows || [])

        if (service?.id) {
          const rows =
            (await sql`
              SELECT
                s.id,
                s.name,
                s.description,
                s.category_id,
                s.active,
                sl.default_duration_hours,
                sl.base_price_per_hour,
                sl.requires_package_pricing AS lesson_requires_package_pricing,
                sr.gear_id,
                sr.hourly_rate,
                sr.daily_rate,
                sr.weekly_rate
              FROM services s
              LEFT JOIN services_lessons sl ON sl.service_id = s.id
              LEFT JOIN services_rentals sr ON sr.service_id = s.id
              WHERE s.id = ${service.id}
            `) || []

          if (rows.length) {
            const row = rows[0]
            const categoryName = categoryRows.find((cat) => cat.id === row.category_id)?.name
            const updatedForm = {
              ...baseFormState,
              id: row.id,
              name: row.name || '',
              description: row.description || '',
              category_id: row.category_id,
              active: row.active,
              gear_id: row.gear_id || '',
              hourly_rate: row.hourly_rate ?? '',
              daily_rate: row.daily_rate ?? '',
              weekly_rate: row.weekly_rate ?? ''
            }

            if (categoryName === 'lessons') {
              updatedForm.default_duration_hours = row.default_duration_hours ?? 1
              updatedForm.base_price_per_hour = row.base_price_per_hour ?? 0
              updatedForm.requires_package_pricing = row.lesson_requires_package_pricing ??
                updatedForm.requires_package_pricing

              const pkgRows =
                (await sql`
                  SELECT id, min_total_hours, max_total_hours, price_per_hour
                  FROM services_lessons_packages
                  WHERE service_id = ${row.id}
                  ORDER BY min_total_hours
                `) || []
              setPackageRows(
                pkgRows.map((pkg) => ({
                  id: pkg.id,
                  min_total_hours: pkg.min_total_hours ?? '',
                  max_total_hours: pkg.max_total_hours ?? '',
                  price_per_hour: pkg.price_per_hour ?? ''
                }))
              )
            } else {
              setPackageRows([])
              updatedForm.requires_package_pricing = false
            }

            if (categoryName !== 'rentals') {
              updatedForm.gear_id = ''
              updatedForm.hourly_rate = ''
              updatedForm.daily_rate = ''
              updatedForm.weekly_rate = ''
            }

            if (categoryName === 'storage') {
              const storageRow =
                (await sql`
                  SELECT daily_rate, weekly_rate, monthly_rate
                  FROM services_storage
                  WHERE service_id = ${row.id}
                  LIMIT 1
                `) || []
              const storageDetail = storageRow[0]
              updatedForm.storage_daily_rate = storageDetail?.daily_rate ?? ''
              updatedForm.storage_weekly_rate = storageDetail?.weekly_rate ?? ''
              updatedForm.storage_monthly_rate = storageDetail?.monthly_rate ?? ''
            } else {
              updatedForm.storage_daily_rate = ''
              updatedForm.storage_weekly_rate = ''
              updatedForm.storage_monthly_rate = ''
            }

            setFormData(updatedForm)
          }
        } else {
          const defaultCategoryId = categoryRows?.[0]?.id ?? null
            setFormData((prev) => ({
              ...prev,
              category_id: defaultCategoryId
            }))
            setPackageRows([])
          }
        } catch (err) {
          console.error('Failed to load service form data:', err)
          setError('Unable to load data. Please try again.')
        } finally {
          setLoading(false)
        }
      }

    loadForm()
  }, [service])

  const selectedCategory = useMemo(
    () => categories.find((category) => category.id === Number(formData.category_id)),
    [categories, formData.category_id]
  )

  const isLessonsCategory = selectedCategory?.name === 'lessons'
  const isRentalsCategory = selectedCategory?.name === 'rentals'
  const isStorageCategory = selectedCategory?.name === 'storage'

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handlePackageChange = (index, field, value) => {
    setPackageRows((prev) =>
      prev.map((row, rowIndex) => (rowIndex === index ? { ...row, [field]: value } : row))
    )
  }

  const addPackageRow = () => {
    setPackageRows((prev) => [
      ...prev,
      { id: null, min_total_hours: '', max_total_hours: '', price_per_hour: '' }
    ])
  }

  const removePackageRow = (index) => {
    setPackageRows((prev) => prev.filter((_, rowIndex) => rowIndex !== index))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (isLessonsCategory && formData.requires_package_pricing && packageRows.length === 0) {
      setError('Please add at least one lesson package tier or disable package pricing.')
      return
    }

    setSaving(true)
    setError(null)

    try {
      let serviceId = formData.id

      if (isEditing) {
        await sql`
          UPDATE services
          SET name = ${formData.name},
              description = ${formData.description},
              category_id = ${formData.category_id},
              active = ${formData.active},
              updated_at = NOW()
          WHERE id = ${formData.id}
        `
        serviceId = formData.id
      } else {
        const inserted =
          (await sql`
            INSERT INTO services (name, description, category_id, active)
            VALUES (${formData.name}, ${formData.description}, ${formData.category_id}, ${formData.active})
            RETURNING id
          `) || []
        serviceId = inserted[0].id
      }

      if (isLessonsCategory) {
        await sql`
          INSERT INTO services_lessons (service_id, default_duration_hours, base_price_per_hour, requires_package_pricing)
          VALUES (${serviceId}, ${formData.default_duration_hours}, ${formData.base_price_per_hour}, ${formData.requires_package_pricing})
          ON CONFLICT (service_id) DO UPDATE
          SET default_duration_hours = EXCLUDED.default_duration_hours,
              base_price_per_hour = EXCLUDED.base_price_per_hour,
              requires_package_pricing = EXCLUDED.requires_package_pricing
        `

        await sql`DELETE FROM services_lessons_packages WHERE service_id = ${serviceId}`
        if (formData.requires_package_pricing) {
          for (const pkg of packageRows) {
            await sql`
              INSERT INTO services_lessons_packages (service_id, min_total_hours, max_total_hours, price_per_hour)
              VALUES (
                ${serviceId},
                ${pkg.min_total_hours || null},
                ${pkg.max_total_hours || null},
                ${pkg.price_per_hour || null}
              )
            `
          }
        }
      } else {
        await sql`DELETE FROM services_lessons_packages WHERE service_id = ${serviceId}`
        await sql`DELETE FROM services_lessons WHERE service_id = ${serviceId}`
      }

      if (isRentalsCategory) {
        await sql`
          INSERT INTO services_rentals (service_id, gear_id, hourly_rate, daily_rate, weekly_rate)
          VALUES (${serviceId}, ${formData.gear_id}, ${formData.hourly_rate || null}, ${formData.daily_rate || null}, ${formData.weekly_rate || null})
          ON CONFLICT (service_id) DO UPDATE
          SET gear_id = EXCLUDED.gear_id,
              hourly_rate = EXCLUDED.hourly_rate,
              daily_rate = EXCLUDED.daily_rate,
              weekly_rate = EXCLUDED.weekly_rate
        `
      } else {
        await sql`DELETE FROM services_rentals WHERE service_id = ${serviceId}`
      }

      if (isStorageCategory) {
        await sql`
          INSERT INTO services_storage (service_id, daily_rate, weekly_rate, monthly_rate)
          VALUES (${serviceId}, ${formData.storage_daily_rate || null}, ${formData.storage_weekly_rate || null}, ${formData.storage_monthly_rate || null})
          ON CONFLICT (service_id) DO UPDATE
          SET daily_rate = EXCLUDED.daily_rate,
              weekly_rate = EXCLUDED.weekly_rate,
              monthly_rate = EXCLUDED.monthly_rate
        `
      } else {
        await sql`DELETE FROM services_storage WHERE service_id = ${serviceId}`
      }

      onSaved?.()
    } catch (err) {
      console.error('Failed to save service:', err)
      setError(err.message || 'Unable to save service. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="text-gray-600">Loading service data...</div>
      </div>
    )
  }

  return (
    <div className="px-4 py-6 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-4xl rounded-xl bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{isEditing ? 'Edit Service' : 'Add Service'}</h1>
            <p className="text-gray-500 text-sm">
              Define service details and category-specific settings.
            </p>
          </div>
          <button
            onClick={onCancel}
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="name">
              Service name *
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
              Category *
            </label>
            <select
              id="category_id"
              name="category_id"
              value={formData.category_id ?? ''}
              onChange={handleChange}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
            >
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="description">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              rows="3"
              value={formData.description}
              onChange={handleChange}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
            />
          </div>

          {isLessonsCategory && (
            <>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="default_duration_hours">
                  Default duration (hours)
                </label>
                <input
                  id="default_duration_hours"
                  name="default_duration_hours"
                  type="number"
                  min="0.5"
                  step="0.5"
                  value={formData.default_duration_hours}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="base_price_per_hour">
                  Base price per hour (USD)
                </label>
                <input
                  id="base_price_per_hour"
                  name="base_price_per_hour"
                  type="number"
                  min="0"
                  step="1"
                  value={formData.base_price_per_hour}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                />
              </div>

              <div className="md:col-span-2 flex items-center gap-3">
                <input
                  id="requires_package_pricing"
                  name="requires_package_pricing"
                  type="checkbox"
                  checked={formData.requires_package_pricing}
                  onChange={handleChange}
                  className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="requires_package_pricing" className="text-sm font-medium text-gray-700">
                  Enable package pricing tiers
                </label>
              </div>

              {formData.requires_package_pricing && (
                <div className="md:col-span-2">
                  <div className="flex items-center justify-between">
                    <h2 className="text-sm font-semibold text-gray-800">Package tiers</h2>
                    <button
                      type="button"
                      onClick={addPackageRow}
                      className="text-sm text-indigo-600 hover:text-indigo-800"
                    >
                      Add tier
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Define how price per hour changes based on total hours.
                  </p>

                  <div className="mt-3 space-y-3">
                    {packageRows.length === 0 && (
                      <div className="rounded-lg border border-dashed border-gray-300 px-4 py-3 text-sm text-gray-500">
                        No tiers defined yet. Add one above.
                      </div>
                    )}

                    {packageRows.map((pkg, index) => (
                      <div key={index} className="rounded-lg border border-gray-200 p-3 grid grid-cols-1 gap-3 md:grid-cols-4">
                        <div>
                          <label className="mb-1 block text-xs font-medium text-gray-600">Min hours</label>
                          <input
                            type="number"
                            step="0.5"
                            min="0"
                            value={pkg.min_total_hours}
                            onChange={(e) => handlePackageChange(index, 'min_total_hours', e.target.value)}
                            className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-xs font-medium text-gray-600">Max hours</label>
                          <input
                            type="number"
                            step="0.5"
                            min="0"
                            value={pkg.max_total_hours ?? ''}
                            onChange={(e) => handlePackageChange(index, 'max_total_hours', e.target.value)}
                            placeholder="Unlimited"
                            className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                          />
                        </div>
                        <div>
                          <label className="mb-1 block text-xs font-medium text-gray-600">Price per hour</label>
                          <input
                            type="number"
                            step="1"
                            min="0"
                            value={pkg.price_per_hour}
                            onChange={(e) => handlePackageChange(index, 'price_per_hour', e.target.value)}
                            className="w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                          />
                        </div>
                        <div className="flex items-end justify-end">
                          <button
                            type="button"
                            onClick={() => removePackageRow(index)}
                            className="text-sm text-red-600 hover:text-red-800"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {isRentalsCategory && (
            <div className="md:col-span-2 grid grid-cols-1 gap-4 md:grid-cols-3">
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="hourly_rate">
                    Hourly rate (USD)
                  </label>
                  <input
                    id="hourly_rate"
                    name="hourly_rate"
                    type="number"
                    min="0"
                    step="1"
                    value={formData.hourly_rate}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="daily_rate">
                    Daily rate (USD)
                  </label>
                  <input
                    id="daily_rate"
                    name="daily_rate"
                    type="number"
                    min="0"
                    step="1"
                    value={formData.daily_rate}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="weekly_rate">
                    Weekly rate (USD)
                  </label>
                  <input
                    id="weekly_rate"
                    name="weekly_rate"
                    type="number"
                    min="0"
                    step="1"
                    value={formData.weekly_rate}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                  />
                </div>
              </div>
          )}

          {isStorageCategory && (
            <div className="md:col-span-2 grid grid-cols-1 gap-4 md:grid-cols-3">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="storage_daily_rate">
                  Daily rate (USD)
                </label>
                <input
                  id="storage_daily_rate"
                  name="storage_daily_rate"
                  type="number"
                  min="0"
                  step="1"
                  value={formData.storage_daily_rate}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="storage_weekly_rate">
                  Weekly rate (USD)
                </label>
                <input
                  id="storage_weekly_rate"
                  name="storage_weekly_rate"
                  type="number"
                  min="0"
                  step="1"
                  value={formData.storage_weekly_rate}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="storage_monthly_rate">
                  Monthly rate (USD)
                </label>
                <input
                  id="storage_monthly_rate"
                  name="storage_monthly_rate"
                  type="number"
                  min="0"
                  step="1"
                  value={formData.storage_monthly_rate}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                />
              </div>
            </div>
          )}

          {error && (
            <div className="md:col-span-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="md:col-span-2 flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onCancel}
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 transition-colors disabled:opacity-50"
            >
              {saving ? 'Saving...' : isEditing ? 'Save changes' : 'Create service'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ServicesForm

