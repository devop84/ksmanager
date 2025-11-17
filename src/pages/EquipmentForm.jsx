import { useEffect, useMemo, useState } from 'react'
import sql from '../lib/neon'

const initialState = {
  id: null,
  name: '',
  category_id: '',
  description: ''
}

function EquipmentForm({ equipment = null, onCancel, onSaved }) {
  const isEditing = Boolean(equipment?.id)
  const [formData, setFormData] = useState(initialState)
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true)
        setError(null)
        const categoryRows =
          (await sql`SELECT id, name FROM equipment_categories ORDER BY name ASC`) || []
        setCategories(categoryRows)

        if (isEditing) {
          const rows =
            (await sql`
              SELECT id, name, description, category_id
              FROM equipment
              WHERE id = ${equipment.id}
              LIMIT 1
            `) || []
          if (rows.length) {
            const row = rows[0]
            setFormData({
              id: row.id,
              name: row.name || '',
              description: row.description || '',
              category_id: row.category_id || categoryRows?.[0]?.id || ''
            })
          }
        } else {
          setFormData((prev) => ({
            ...prev,
            category_id: categoryRows?.[0]?.id || ''
          }))
        }
      } catch (err) {
        console.error('Failed to load equipment form data:', err)
        setError('Unable to load equipment data. Please try again.')
      } finally {
        setLoading(false)
      }
    }

    loadData()
  }, [equipment, isEditing])

  const selectedCategory = useMemo(
    () => categories.find((category) => category.id === Number(formData.category_id)),
    [categories, formData.category_id]
  )

  const handleChange = (event) => {
    const { name, value } = event.target
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!formData.name.trim()) {
      setError('Equipment name is required.')
      return
    }

    setSaving(true)
    setError(null)

    try {
      if (isEditing) {
        await sql`
          UPDATE equipment
          SET name = ${formData.name},
              description = ${formData.description},
              category_id = ${formData.category_id || null},
              updated_at = NOW()
          WHERE id = ${formData.id}
        `
      } else {
        await sql`
          INSERT INTO equipment (name, description, category_id)
          VALUES (${formData.name}, ${formData.description}, ${formData.category_id || null})
        `
      }

      onSaved?.()
    } catch (err) {
      console.error('Failed to save equipment:', err)
      setError(err.message || 'Unable to save equipment. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="text-gray-600">Loading equipment data...</div>
      </div>
    )
  }

  return (
    <div className="px-4 py-6 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-3xl rounded-xl bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {isEditing ? 'Edit Equipment' : 'Add Equipment'}
            </h1>
            <p className="text-gray-500 text-sm">
              Assign a category and describe the equipment available for rentals or storage.
            </p>
          </div>
          <button
            onClick={onCancel}
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="name">
              Equipment name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g., Cabrinha Spectrum 138"
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="category_id">
              Category
            </label>
            <select
              id="category_id"
              name="category_id"
              value={formData.category_id}
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

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="description">
              Description
            </label>
            <textarea
              id="description"
              name="description"
              rows="3"
              value={formData.description}
              onChange={handleChange}
              placeholder="Add quick details such as size, condition, or model year."
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
            />
          </div>

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4">
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
              {saving ? 'Saving...' : isEditing ? 'Save changes' : 'Create equipment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default EquipmentForm

