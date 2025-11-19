import { useEffect, useState } from 'react'
import sql from '../lib/neon'

const initialFormState = {
  name: '',
  details: '',
  note: ''
}

function CompanyAccountForm({ account, onCancel, onSaved }) {
  const isEditing = Boolean(account?.id)
  const [formData, setFormData] = useState(initialFormState)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (account) {
      setFormData({
        name: account.name || '',
        details: account.details || '',
        note: account.note || ''
      })
    } else {
      setFormData(initialFormState)
    }
  }, [account])

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
          UPDATE company_accounts
          SET name = ${formData.name},
              details = ${formData.details},
              note = ${formData.note}
          WHERE id = ${account.id}
        `
      } else {
        await sql`
          INSERT INTO company_accounts (name, details, note)
          VALUES (${formData.name}, ${formData.details}, ${formData.note})
        `
      }

      onSaved?.()
    } catch (err) {
      console.error('Failed to save company account:', err)
      setError('Unable to save company account. Please check the details and try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="px-4 py-6 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-3xl rounded-xl bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{isEditing ? 'Edit Company Account' : 'Add Company Account'}</h1>
            <p className="text-gray-500 text-sm">
              {isEditing ? 'Update treasury details and notes.' : 'Provide the information to register a new account.'}
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
              Account name *
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
            <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="details">
              Details
            </label>
            <textarea
              id="details"
              name="details"
              rows="4"
              value={formData.details}
              onChange={handleChange}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="note">
              Note
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
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 transition-colors disabled:opacity-50"
            >
              {saving ? 'Saving...' : isEditing ? 'Save changes' : 'Create account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default CompanyAccountForm


