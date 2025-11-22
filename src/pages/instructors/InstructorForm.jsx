import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import sql from '../../lib/neon'
import { useSettings } from '../../context/SettingsContext'

const initialFormState = {
  fullname: '',
  phone: '',
  email: '',
  bankdetail: '',
  hourlyrate: '',
  commission: '',
  monthlyfix: '',
  note: ''
}

function InstructorForm({ instructor, onCancel, onSaved }) {
  const isEditing = Boolean(instructor?.id)
  const { t } = useTranslation()
  const { currency } = useSettings()
  const [formData, setFormData] = useState(initialFormState)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (instructor) {
      setFormData({
        fullname: instructor.fullname || '',
        phone: instructor.phone || '',
        email: instructor.email || '',
        bankdetail: instructor.bankdetail || '',
        hourlyrate: instructor.hourlyrate ?? '',
        commission: instructor.commission ?? '',
        monthlyfix: instructor.monthlyfix ?? '',
        note: instructor.note || ''
      })
    } else {
      setFormData(initialFormState)
    }
  }, [instructor])

  const handleChange = (event) => {
    const { name, value } = event.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSaving(true)
    setError(null)

    const payload = {
      ...formData,
      hourlyrate: formData.hourlyrate !== '' ? Number(formData.hourlyrate) : null,
      commission: formData.commission !== '' ? Number(formData.commission) : null,
      monthlyfix: formData.monthlyfix !== '' ? Number(formData.monthlyfix) : null,
      note: formData.note
    }

    try {
      if (isEditing) {
        await sql`
          UPDATE instructors
          SET fullname = ${payload.fullname},
              phone = ${payload.phone},
              email = ${payload.email},
              bankdetail = ${payload.bankdetail},
              hourlyrate = ${payload.hourlyrate},
              commission = ${payload.commission},
              monthlyfix = ${payload.monthlyfix},
              note = ${payload.note},
              updated_at = NOW()
          WHERE id = ${instructor.id}
        `
      } else {
        await sql`
          INSERT INTO instructors (fullname, phone, email, bankdetail, hourlyrate, commission, monthlyfix, note)
          VALUES (
            ${payload.fullname},
            ${payload.phone},
            ${payload.email},
            ${payload.bankdetail},
            ${payload.hourlyrate},
            ${payload.commission},
            ${payload.monthlyfix},
            ${payload.note}
          )
        `
      }

      onSaved?.()
    } catch (err) {
      console.error('Failed to save instructor:', err)
      setError(t('instructorForm.errors.save'))
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
              {isEditing ? t('instructorForm.title.edit') : t('instructorForm.title.new')}
            </h1>
            <p className="text-gray-500 text-sm">
              {isEditing ? t('instructorForm.subtitle.edit') : t('instructorForm.subtitle.new')}
            </p>
          </div>
          <button
            onClick={onCancel}
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
          >
            {t('instructorForm.buttons.cancel')}
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="fullname">
              {t('instructorForm.fields.fullname')}
            </label>
            <input
              id="fullname"
              name="fullname"
              type="text"
              required
              value={formData.fullname}
              onChange={handleChange}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="phone">
              {t('instructorForm.fields.phone')}
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
              {t('instructorForm.fields.email')}
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

          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="bankdetail">
              {t('instructorForm.fields.bankdetail')}
            </label>
            <textarea
              id="bankdetail"
              name="bankdetail"
              rows="3"
              value={formData.bankdetail}
              onChange={handleChange}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="hourlyrate">
              {t('instructorForm.fields.hourlyrate', { currency })}
            </label>
            <input
              id="hourlyrate"
              name="hourlyrate"
              type="number"
              min="0"
              step="0.5"
              value={formData.hourlyrate}
              onChange={handleChange}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="commission">
              {t('instructorForm.fields.commission')}
            </label>
            <input
              id="commission"
              name="commission"
              type="number"
              min="0"
              step="0.1"
              value={formData.commission}
              onChange={handleChange}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="monthlyfix">
              {t('instructorForm.fields.monthlyfix', { currency })}
            </label>
            <input
              id="monthlyfix"
              name="monthlyfix"
              type="number"
              min="0"
              step="1"
              value={formData.monthlyfix}
              onChange={handleChange}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
            />
          </div>

          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="note">
              {t('instructorForm.fields.note')}
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
            <div className="md:col-span-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="md:col-span-2 flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onCancel}
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
            >
              {t('instructorForm.buttons.cancel')}
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 transition-colors disabled:opacity-50"
            >
              {saving
                ? t('instructorForm.buttons.saving')
                : isEditing
                  ? t('instructorForm.buttons.saveChanges')
                  : t('instructorForm.buttons.create')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default InstructorForm

