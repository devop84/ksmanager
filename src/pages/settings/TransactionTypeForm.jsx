import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import sql from '../../lib/neon'

const initialFormState = {
  code: '',
  label: '',
  direction: 'income',
  description: ''
}

const TRANSACTION_DIRECTIONS = [
  { value: 'income', label: 'Income' },
  { value: 'expense', label: 'Expense' },
  { value: 'transfer', label: 'Transfer' }
]

function TransactionTypeForm({ type: typeToEdit, onCancel, onSaved }) {
  const isEditing = Boolean(typeToEdit?.id)
  const { t } = useTranslation()
  const [formData, setFormData] = useState(initialFormState)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (typeToEdit) {
      setFormData({
        code: typeToEdit.code || '',
        label: typeToEdit.label || '',
        direction: typeToEdit.direction || 'income',
        description: typeToEdit.description || ''
      })
    } else {
      setFormData(initialFormState)
    }
  }, [typeToEdit])

  const handleChange = (event) => {
    const { name, value } = event.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSaving(true)
    setError(null)

    try {
      // Validate code format (uppercase, alphanumeric and underscores)
      const codeRegex = /^[A-Z0-9_]+$/
      if (!codeRegex.test(formData.code)) {
        setError(t('transactionTypeForm.errors.invalidCode', 'Code must be uppercase letters, numbers, and underscores only'))
        setSaving(false)
        return
      }

      if (isEditing) {
        // Check if code is protected
        const isProtected = typeToEdit.code === 'CUSTOMER_PAYMENT' || typeToEdit.code === 'CUSTOMER_REFUND'
        if (isProtected && formData.code !== typeToEdit.code) {
          setError(t('transactionTypeForm.errors.cannotChangeProtectedCode', 'Cannot change code of protected transaction type'))
          setSaving(false)
          return
        }

        // Update existing transaction type
        await sql`
          UPDATE transaction_types
          SET code = ${formData.code},
              label = ${formData.label},
              direction = ${formData.direction},
              description = ${formData.description || null},
              updated_at = NOW()
          WHERE id = ${typeToEdit.id}
        `
      } else {
        // Create new transaction type
        await sql`
          INSERT INTO transaction_types (code, label, direction, description)
          VALUES (${formData.code}, ${formData.label}, ${formData.direction}, ${formData.description || null})
        `
      }

      onSaved?.()
    } catch (err) {
      console.error('Failed to save transaction type:', err)
      if (err.code === '23505') {
        // Unique violation (code already exists)
        setError(t('transactionTypeForm.errors.codeExists', 'Transaction type code already exists'))
      } else if (err.message?.includes('protected')) {
        setError(t('transactionTypeForm.errors.protected', 'Cannot modify protected transaction type'))
      } else {
        setError(t('transactionTypeForm.errors.save', 'Failed to save transaction type. Please try again.'))
      }
    } finally {
      setSaving(false)
    }
  }

  const isProtected = isEditing && (typeToEdit.code === 'CUSTOMER_PAYMENT' || typeToEdit.code === 'CUSTOMER_REFUND')

  return (
    <div className="px-4 py-6 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-3xl rounded-xl bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {isEditing ? t('transactionTypeForm.title.edit', 'Edit Transaction Type') : t('transactionTypeForm.title.new', 'New Transaction Type')}
            </h1>
            <p className="text-gray-500 text-sm">
              {isEditing
                ? t('transactionTypeForm.subtitle.edit', 'Update transaction type information')
                : t('transactionTypeForm.subtitle.new', 'Create a new transaction type')}
            </p>
            {isProtected && (
              <p className="text-amber-600 text-sm mt-1">
                {t('transactionTypeForm.warning.protected', 'This is a protected transaction type required by the system.')}
              </p>
            )}
          </div>
          <button
            onClick={onCancel}
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
          >
            {t('transactionTypeForm.buttons.cancel', 'Cancel')}
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="code">
              {t('transactionTypeForm.fields.code', 'Code')} *
            </label>
            <input
              id="code"
              name="code"
              type="text"
              required
              value={formData.code}
              onChange={handleChange}
              disabled={isProtected}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 disabled:bg-gray-100 disabled:cursor-not-allowed"
              placeholder="CUSTOMER_PAYMENT"
            />
            <p className="mt-1 text-xs text-gray-500">
              {t('transactionTypeForm.fields.code.help', 'Uppercase letters, numbers, and underscores only')}
            </p>
          </div>

          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="label">
              {t('transactionTypeForm.fields.label', 'Label')} *
            </label>
            <input
              id="label"
              name="label"
              type="text"
              required
              value={formData.label}
              onChange={handleChange}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
              placeholder="Customer Payment"
            />
          </div>

          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="direction">
              {t('transactionTypeForm.fields.direction', 'Direction')} *
            </label>
            <select
              id="direction"
              name="direction"
              required
              value={formData.direction}
              onChange={handleChange}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
            >
              {TRANSACTION_DIRECTIONS.map((dir) => (
                <option key={dir.value} value={dir.value}>
                  {t(`transactionTypeForm.directions.${dir.value}`, dir.label)}
                </option>
              ))}
            </select>
          </div>

          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="description">
              {t('transactionTypeForm.fields.description', 'Description')}
            </label>
            <textarea
              id="description"
              name="description"
              rows={3}
              value={formData.description}
              onChange={handleChange}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
              placeholder="Description of this transaction type..."
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
              {t('transactionTypeForm.buttons.cancel', 'Cancel')}
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 transition-colors disabled:opacity-50"
            >
              {saving
                ? t('transactionTypeForm.buttons.saving', 'Saving...')
                : isEditing
                  ? t('transactionTypeForm.buttons.saveChanges', 'Save Changes')
                  : t('transactionTypeForm.buttons.create', 'Create Transaction Type')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default TransactionTypeForm

