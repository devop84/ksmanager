import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import sql from '../../lib/neon'
import { hashPassword } from '../../lib/password.js'

const initialFormState = {
  name: '',
  email: '',
  password: '',
  role: 'viewonly'
}

const USER_ROLES = [
  { value: 'admin', label: 'Admin' },
  { value: 'viewonly', label: 'View Only' }
]

function UserForm({ user: userToEdit, onCancel, onSaved }) {
  const isEditing = Boolean(userToEdit?.id)
  const { t } = useTranslation()
  const [formData, setFormData] = useState(initialFormState)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (userToEdit) {
      setFormData({
        name: userToEdit.name || '',
        email: userToEdit.email || '',
        password: '', // Don't pre-fill password
        role: userToEdit.role || 'viewonly'
      })
    } else {
      setFormData(initialFormState)
    }
  }, [userToEdit])

  const handleChange = (event) => {
    const { name, value } = event.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSaving(true)
    setError(null)

    try {
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if (!emailRegex.test(formData.email)) {
        setError(t('userForm.errors.invalidEmail', 'Invalid email format'))
        setSaving(false)
        return
      }

      // For new users, password is required
      if (!isEditing && !formData.password) {
        setError(t('userForm.errors.passwordRequired', 'Password is required'))
        setSaving(false)
        return
      }

      // For editing, only update password if provided
      if (isEditing) {
        if (formData.password) {
          // Hash the new password
          const passwordHash = await hashPassword(formData.password)
          await sql`
            UPDATE users
            SET name = ${formData.name},
                email = ${formData.email},
                role = ${formData.role},
                password_hash = ${passwordHash},
                updated_at = NOW()
            WHERE id = ${userToEdit.id}
          `
        } else {
          // Update without changing password
          await sql`
            UPDATE users
            SET name = ${formData.name},
                email = ${formData.email},
                role = ${formData.role},
                updated_at = NOW()
            WHERE id = ${userToEdit.id}
          `
        }
      } else {
        // Create new user
        const passwordHash = await hashPassword(formData.password)
        await sql`
          INSERT INTO users (name, email, password_hash, role)
          VALUES (${formData.name}, ${formData.email}, ${passwordHash}, ${formData.role})
        `
      }

      onSaved?.()
    } catch (err) {
      console.error('Failed to save user:', err)
      if (err.code === '23505') {
        // Unique violation (email already exists)
        setError(t('userForm.errors.emailExists', 'Email already exists'))
      } else {
        setError(t('userForm.errors.save', 'Failed to save user. Please try again.'))
      }
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
              {isEditing ? t('userForm.title.edit', 'Edit User') : t('userForm.title.new', 'New User')}
            </h1>
            <p className="text-gray-500 text-sm">
              {isEditing
                ? t('userForm.subtitle.edit', 'Update user information')
                : t('userForm.subtitle.new', 'Create a new user account')}
            </p>
          </div>
          <button
            onClick={onCancel}
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
          >
            {t('userForm.buttons.cancel', 'Cancel')}
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="name">
              {t('userForm.fields.name', 'Name')} *
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

          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="email">
              {t('userForm.fields.email', 'Email')} *
            </label>
            <input
              id="email"
              name="email"
              type="email"
              required
              value={formData.email}
              onChange={handleChange}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
            />
          </div>

          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="password">
              {isEditing
                ? t('userForm.fields.password.edit', 'New Password (leave blank to keep current)')
                : t('userForm.fields.password', 'Password')} *
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required={!isEditing}
              value={formData.password}
              onChange={handleChange}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
            />
          </div>

          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="role">
              {t('userForm.fields.role', 'Role')} *
            </label>
            <select
              id="role"
              name="role"
              required
              value={formData.role}
              onChange={handleChange}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
            >
              {USER_ROLES.map((role) => (
                <option key={role.value} value={role.value}>
                  {t(`userForm.roles.${role.value}`, role.label)}
                </option>
              ))}
            </select>
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
              {t('userForm.buttons.cancel', 'Cancel')}
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 transition-colors disabled:opacity-50"
            >
              {saving
                ? t('userForm.buttons.saving', 'Saving...')
                : isEditing
                  ? t('userForm.buttons.saveChanges', 'Save Changes')
                  : t('userForm.buttons.create', 'Create User')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default UserForm

