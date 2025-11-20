import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import sql from '../lib/neon'

const initialFormState = {
  name: '',
  phone: '',
  address: '',
  note: ''
}

function HotelForm({ hotel, onCancel, onSaved }) {
  const isEditing = Boolean(hotel?.id)
  const [formData, setFormData] = useState(initialFormState)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const { t } = useTranslation()

  useEffect(() => {
    if (hotel) {
      setFormData({
        name: hotel.name || '',
        phone: hotel.phone || '',
        address: hotel.address || '',
        note: hotel.note || ''
      })
    } else {
      setFormData(initialFormState)
    }
  }, [hotel])

  const handleChange = (event) => {
    const { name, value } = event.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSaving(true)
    setError(null)

    try {
      if (isEditing) {
        await sql`
          UPDATE hotels
          SET name = ${formData.name},
              phone = ${formData.phone},
              address = ${formData.address},
              note = ${formData.note},
              updated_at = NOW()
          WHERE id = ${hotel.id}
        `
      } else {
        await sql`
          INSERT INTO hotels (name, phone, address, note)
          VALUES (${formData.name}, ${formData.phone}, ${formData.address}, ${formData.note})
        `
      }

      onSaved?.()
    } catch (err) {
      console.error('Failed to save hotel:', err)
      setError(t('hotelForm.error.save', 'Unable to save hotel. Please check the details and try again.'))
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
              {isEditing ? t('hotelForm.title.edit', 'Edit Hotel') : t('hotelForm.title.new', 'Add Hotel')}
            </h1>
            <p className="text-gray-500 text-sm">
              {isEditing
                ? t('hotelForm.subtitle.edit', 'Update hotel information and save changes.')
                : t('hotelForm.subtitle.new', 'Fill out the details to add a new hotel.')}
            </p>
          </div>
          <button
            onClick={onCancel}
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
          >
            {t('hotelForm.cancel', 'Cancel')}
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="name">
              {t('hotelForm.name', 'Hotel name *')}
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
              {t('hotelForm.phone', 'Phone')}
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
            <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="address">
              {t('hotelForm.address', 'Address')}
            </label>
            <textarea
              id="address"
              name="address"
              rows="3"
              value={formData.address}
              onChange={handleChange}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="note">
              {t('hotelForm.note', 'Note')}
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
              {t('hotelForm.cancel', 'Cancel')}
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 transition-colors disabled:opacity-50"
            >
              {saving
                ? t('hotelForm.saving', 'Saving...')
                : isEditing
                ? t('hotelForm.saveChanges', 'Save changes')
                : t('hotelForm.create', 'Create hotel')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default HotelForm

