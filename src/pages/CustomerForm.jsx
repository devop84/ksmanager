import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import sql from '../lib/neon'

const initialFormState = {
  fullname: '',
  phone: '',
  email: '',
  doctype: '',
  doc: '',
  country: '',
  birthdate: '',
  note: '',
  hotel_id: '',
  agency_id: ''
}

function CustomerForm({ customer, onCancel, onSaved }) {
  const isEditing = Boolean(customer?.id)
  const [formData, setFormData] = useState(initialFormState)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [hotels, setHotels] = useState([])
  const [agencies, setAgencies] = useState([])
  const { t } = useTranslation()

  useEffect(() => {
    if (customer) {
      const formattedBirthdate = customer.birthdate
        ? new Date(customer.birthdate).toISOString().split('T')[0]
        : ''

      setFormData({
        fullname: customer.fullname || '',
        phone: customer.phone || '',
        email: customer.email || '',
        doctype: customer.doctype || '',
        doc: customer.doc || '',
        country: customer.country || '',
        birthdate: formattedBirthdate,
        note: customer.note || '',
        hotel_id: customer.hotel_id ?? '',
        agency_id: customer.agency_id ?? ''
      })
    } else {
      setFormData(initialFormState)
    }
  }, [customer])

  useEffect(() => {
    const fetchHotels = async () => {
      try {
        const result = await sql`
          SELECT id, name
          FROM hotels
          ORDER BY name ASC
        `
        setHotels(result || [])
      } catch (err) {
        console.error('Failed to load hotels:', err)
      }
    }

    fetchHotels()
  }, [])

  useEffect(() => {
    const fetchAgencies = async () => {
      try {
        const result = await sql`
          SELECT id, name
          FROM agencies
          ORDER BY name ASC
        `
        setAgencies(result || [])
      } catch (err) {
        console.error('Failed to load agencies:', err)
      }
    }

    fetchAgencies()
  }, [])

  const handleChange = (event) => {
    const { name, value } = event.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSaving(true)
    setError(null)

    try {
      const payload = {
        ...formData,
        hotel_id: formData.hotel_id ? Number(formData.hotel_id) : null,
        agency_id: formData.agency_id ? Number(formData.agency_id) : null
      }

      if (isEditing) {
        await sql`
          UPDATE customers
          SET fullname = ${payload.fullname},
              phone = ${payload.phone},
              email = ${payload.email},
              doctype = ${payload.doctype},
              doc = ${payload.doc},
              country = ${payload.country},
              birthdate = ${payload.birthdate || null},
              note = ${payload.note},
              hotel_id = ${payload.hotel_id},
              agency_id = ${payload.agency_id},
              updated_at = NOW()
          WHERE id = ${customer.id}
        `
      } else {
        await sql`
          INSERT INTO customers (fullname, phone, email, doctype, doc, country, birthdate, note, hotel_id, agency_id)
          VALUES (
            ${payload.fullname},
            ${payload.phone},
            ${payload.email},
            ${payload.doctype},
            ${payload.doc},
            ${payload.country},
            ${payload.birthdate || null},
            ${payload.note},
            ${payload.hotel_id},
            ${payload.agency_id}
          )
        `
      }

      onSaved?.()
    } catch (err) {
      console.error('Failed to save customer:', err)
      setError(t('customerForm.errors.save', 'Unable to save customer. Please check the data and try again.'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-8">
      <div className="mx-auto max-w-4xl rounded-xl bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {isEditing ? t('customerForm.title.edit', 'Edit Customer') : t('customerForm.title.new', 'Add Customer')}
            </h1>
            <p className="text-gray-500 text-sm">
              {isEditing
                ? t('customerForm.subtitle.edit', 'Update customer details and save changes.')
                : t('customerForm.subtitle.new', 'Fill in the details to create a new customer.')}
            </p>
          </div>
          <button
            onClick={onCancel}
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
          >
            {t('customerForm.buttons.cancel', 'Cancel')}
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="fullname">
              {t('customerForm.fields.fullname', 'Full Name *')}
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
              {t('customerForm.fields.phone', 'Phone')}
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
              {t('customerForm.fields.email', 'Email')}
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
            <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="doctype">
              {t('customerForm.fields.doctype', 'Document Type')}
            </label>
            <input
              id="doctype"
              name="doctype"
              type="text"
              value={formData.doctype}
              onChange={handleChange}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="doc">
              {t('customerForm.fields.doc', 'Document Number')}
            </label>
            <input
              id="doc"
              name="doc"
              type="text"
              value={formData.doc}
              onChange={handleChange}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="country">
              {t('customerForm.fields.country', 'Country')}
            </label>
            <input
              id="country"
              name="country"
              type="text"
              value={formData.country}
              onChange={handleChange}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="birthdate">
              {t('customerForm.fields.birthdate', 'Birthdate')}
            </label>
            <input
              id="birthdate"
              name="birthdate"
              type="date"
              value={formData.birthdate}
              onChange={handleChange}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
            />
          </div>

          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="note">
              {t('customerForm.fields.note', 'Note')}
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

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="hotel_id">
              {t('customerForm.fields.hotel', 'Hotel')}
            </label>
            <select
              id="hotel_id"
              name="hotel_id"
              value={formData.hotel_id}
              onChange={handleChange}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
            >
              <option value="">{t('customerForm.fields.hotel.placeholder', 'Select a hotel')}</option>
              {hotels.map((hotel) => (
                <option key={hotel.id} value={hotel.id}>
                  {hotel.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="agency_id">
              {t('customerForm.fields.agency', 'Agency')}
            </label>
            <select
              id="agency_id"
              name="agency_id"
              value={formData.agency_id}
              onChange={handleChange}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
            >
              <option value="">{t('customerForm.fields.agency.placeholder', 'Select an agency')}</option>
              {agencies.map((agency) => (
                <option key={agency.id} value={agency.id}>
                  {agency.name}
                </option>
              ))}
            </select>
          </div>

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
              {t('customerForm.buttons.cancel', 'Cancel')}
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 transition-colors disabled:opacity-50"
            >
              {saving
                ? t('customerForm.buttons.saving', 'Saving...')
                : isEditing
                ? t('customerForm.buttons.saveChanges', 'Save changes')
                : t('customerForm.buttons.create', 'Create customer')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CustomerForm

