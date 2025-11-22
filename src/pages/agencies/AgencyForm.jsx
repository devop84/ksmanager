import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import sql from '../../lib/neon'

const initialFormState = {
  name: '',
  phone: '',
  email: '',
  commission: '',
  note: ''
}

function AgencyForm({ agency, onCancel, onSaved }) {
  const isEditing = Boolean(agency?.id)
  const { t } = useTranslation()
  const [formData, setFormData] = useState(initialFormState)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (agency) {
      setFormData({
        name: agency.name || '',
        phone: agency.phone || '',
        email: agency.email || '',
        commission: agency.commission ?? '',
        note: agency.note || ''
      })
    } else {
      setFormData(initialFormState)
    }
  }, [agency])

  const handleChange = (event) => {
    const { name, value } = event.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSaving(true)
    setError(null)

    const commissionValue = formData.commission !== '' ? Number(formData.commission) : null

    try {
      if (isEditing) {
        await sql`
          UPDATE agencies
          SET name = ${formData.name},
              phone = ${formData.phone},
              email = ${formData.email},
              commission = ${commissionValue},
              note = ${formData.note},
              updated_at = NOW()
          WHERE id = ${agency.id}
        `
      } else {
        await sql`
          INSERT INTO agencies (name, phone, email, commission, note)
          VALUES (${formData.name}, ${formData.phone}, ${formData.email}, ${commissionValue}, ${formData.note})
        `
      }

      onSaved?.()
    } catch (err) {
      console.error('Failed to save agency:', err)
      setError(t('agencyForm.errors.save'))
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
              {isEditing ? t('agencyForm.title.edit') : t('agencyForm.title.new')}
            </h1>
            <p className="text-gray-500 text-sm">
              {isEditing ? t('agencyForm.subtitle.edit') : t('agencyForm.subtitle.new')}
            </p>
          </div>
          <button
            onClick={onCancel}
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
          >
            {t('agencyForm.buttons.cancel')}
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="name">
              {t('agencyForm.fields.name')}
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
            <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="phone">
              {t('agencyForm.fields.phone')}
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
              {t('agencyForm.fields.email')}
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
            <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="commission">
              {t('agencyForm.fields.commission')}
            </label>
            <input
              id="commission"
              name="commission"
              type="number"
              step="0.1"
              min="0"
              value={formData.commission}
              onChange={handleChange}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="note">
              {t('agencyForm.fields.note')}
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
              {t('agencyForm.buttons.cancel')}
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 transition-colors disabled:opacity-50"
            >
              {saving
                ? t('agencyForm.buttons.saving')
                : isEditing
                  ? t('agencyForm.buttons.saveChanges')
                  : t('agencyForm.buttons.create')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AgencyForm

