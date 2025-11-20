import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import sql from '../lib/neon'

const initialFormState = {
  name: '',
  category_id: '',
  phone: '',
  email: '',
  note: ''
}

function ThirdPartyForm({ thirdParty, onCancel, onSaved }) {
  const isEditing = Boolean(thirdParty?.id)
  const { t } = useTranslation()
  const [formData, setFormData] = useState(initialFormState)
  const [categories, setCategories] = useState([])
  const [loadingCategories, setLoadingCategories] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoadingCategories(true)
        const result = await sql`
          SELECT id, name
          FROM third_parties_categories
          ORDER BY name ASC
        `
        setCategories(result || [])
      } catch (err) {
        console.error('Failed to load third party categories:', err)
        setError(t('thirdPartyForm.errors.categories'))
      } finally {
        setLoadingCategories(false)
      }
    }

    fetchCategories()
  }, [])

  useEffect(() => {
    if (thirdParty) {
      setFormData({
        name: thirdParty.name || '',
        category_id: thirdParty.category_id != null ? String(thirdParty.category_id) : '',
        phone: thirdParty.phone || '',
        email: thirdParty.email || '',
        note: thirdParty.note || ''
      })
    } else {
      setFormData(initialFormState)
    }
  }, [thirdParty])

  const handleChange = (event) => {
    const { name, value } = event.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSaving(true)
    setError(null)

    const categoryValue = formData.category_id !== '' ? Number(formData.category_id) : null

    try {
      if (isEditing) {
        await sql`
          UPDATE third_parties
          SET name = ${formData.name},
              category_id = ${categoryValue},
              phone = ${formData.phone},
              email = ${formData.email},
              note = ${formData.note},
              updated_at = NOW()
          WHERE id = ${thirdParty.id}
        `
      } else {
        await sql`
          INSERT INTO third_parties (name, category_id, phone, email, note)
          VALUES (${formData.name}, ${categoryValue}, ${formData.phone}, ${formData.email}, ${formData.note})
        `
      }

      onSaved?.()
    } catch (err) {
      console.error('Failed to save third party:', err)
      setError(t('thirdPartyForm.errors.save'))
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
              {isEditing ? t('thirdPartyForm.title.edit') : t('thirdPartyForm.title.new')}
            </h1>
            <p className="text-gray-500 text-sm">
              {isEditing ? t('thirdPartyForm.subtitle.edit') : t('thirdPartyForm.subtitle.new')}
            </p>
          </div>
          <button
            onClick={onCancel}
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
          >
            {t('thirdPartyForm.buttons.cancel')}
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="name">
              {t('thirdPartyForm.fields.name')}
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
              {t('thirdPartyForm.fields.category')}
            </label>
            <select
              id="category_id"
              name="category_id"
              value={formData.category_id}
              onChange={handleChange}
              disabled={loadingCategories}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 disabled:bg-gray-100"
            >
              <option value="">{t('thirdPartyForm.fields.category.uncategorized')}</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="phone">
              {t('thirdPartyForm.fields.phone')}
            </label>
            <input
              id="phone"
              name="phone"
              type="tel"
              value={formData.phone}
              onChange={handleChange}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="email">
              {t('thirdPartyForm.fields.email')}
            </label>
            <input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="note">
              {t('thirdPartyForm.fields.note')}
            </label>
            <textarea
              id="note"
              name="note"
              rows="3"
              value={formData.note}
              onChange={handleChange}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
            />
          </div>

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onCancel}
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
            >
              {t('thirdPartyForm.buttons.cancel')}
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 transition-colors disabled:opacity-50"
            >
              {saving
                ? t('thirdPartyForm.buttons.saving')
                : isEditing
                  ? t('thirdPartyForm.buttons.saveChanges')
                  : t('thirdPartyForm.buttons.create')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ThirdPartyForm


