import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import sql from '../lib/neon'
import { useSettings } from '../context/SettingsContext'

const initialFormState = {
  fullname: '',
  role: '',
  phone: '',
  email: '',
  bankdetail: '',
  hourlyrate: '',
  commission: '',
  monthlyfix: '',
  note: ''
}

const STAFF_ROLES = [
  { value: 'receptionist', label: 'Receptionist' },
  { value: 'beachboy', label: 'Beachboy' },
  { value: 'administrator', label: 'Administrator' },
  { value: 'other', label: 'Other' }
]

function StaffForm({ staff, onCancel, onSaved }) {
  const isEditing = Boolean(staff?.id)
  const { t } = useTranslation()
  const { currency } = useSettings()
  const [formData, setFormData] = useState(initialFormState)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (staff) {
      setFormData({
        fullname: staff.fullname || '',
        role: staff.role || '',
        phone: staff.phone || '',
        email: staff.email || '',
        bankdetail: staff.bankdetail || '',
        hourlyrate: staff.hourlyrate ?? '',
        commission: staff.commission ?? '',
        monthlyfix: staff.monthlyfix ?? '',
        note: staff.note || ''
      })
    } else {
      setFormData(initialFormState)
    }
  }, [staff])

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
          UPDATE staff
          SET fullname = ${payload.fullname},
              role = ${payload.role},
              phone = ${payload.phone},
              email = ${payload.email},
              bankdetail = ${payload.bankdetail},
              hourlyrate = ${payload.hourlyrate},
              commission = ${payload.commission},
              monthlyfix = ${payload.monthlyfix},
              note = ${payload.note},
              updated_at = NOW()
          WHERE id = ${staff.id}
        `
      } else {
        await sql`
          INSERT INTO staff (fullname, role, phone, email, bankdetail, hourlyrate, commission, monthlyfix, note)
          VALUES (
            ${payload.fullname},
            ${payload.role},
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
      console.error('Failed to save staff:', err)
      setError(t('staffForm.errors.save'))
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
              {isEditing ? t('staffForm.title.edit') : t('staffForm.title.new')}
            </h1>
            <p className="text-gray-500 text-sm">
              {isEditing ? t('staffForm.subtitle.edit') : t('staffForm.subtitle.new')}
            </p>
          </div>
          <button
            onClick={onCancel}
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
          >
            {t('staffForm.buttons.cancel')}
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="fullname">
              {t('staffForm.fields.fullname')}
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

          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="role">
              {t('staffForm.fields.role')}
            </label>
            <select
              id="role"
              name="role"
              value={formData.role}
              onChange={handleChange}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
            >
              <option value="">{t('staffForm.fields.role.placeholder')}</option>
              {STAFF_ROLES.map((role) => (
                <option key={role.value} value={role.value}>
                  {t(`staff.role.${role.value}`, role.label)}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="phone">
              {t('staffForm.fields.phone')}
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
              {t('staffForm.fields.email')}
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
              {t('staffForm.fields.bankdetail')}
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
              {t('staffForm.fields.hourlyrate', { currency })}
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
              {t('staffForm.fields.commission')}
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
              {t('staffForm.fields.monthlyfix', { currency })}
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
              {t('staffForm.fields.note')}
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
              {t('staffForm.buttons.cancel')}
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 transition-colors disabled:opacity-50"
            >
              {saving
                ? t('staffForm.buttons.saving')
                : isEditing
                  ? t('staffForm.buttons.saveChanges')
                  : t('staffForm.buttons.create')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default StaffForm

