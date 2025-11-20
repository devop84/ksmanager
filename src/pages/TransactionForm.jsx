import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import sql from '../lib/neon'

const ENTITY_TYPES_BLUEPRINT = [
  { value: 'company_account', labelKey: 'transactions.entity.company_account', fallback: 'Company Account' },
  { value: 'customer', labelKey: 'transactions.entity.customer', fallback: 'Customer' },
  { value: 'agency', labelKey: 'transactions.entity.agency', fallback: 'Agency' },
  { value: 'instructor', labelKey: 'transactions.entity.instructor', fallback: 'Instructor' },
  { value: 'third_party', labelKey: 'transactions.entity.third_party', fallback: 'Third Party' }
]

const initialFormState = {
  occurred_at: '',
  amount: '',
  currency: 'USD',
  type_id: '',
  payment_method_id: '',
  source_entity_type: 'company_account',
  source_entity_id: '',
  destination_entity_type: 'company_account',
  destination_entity_id: '',
  reference: '',
  note: ''
}

function TransactionForm({ transaction, onCancel, onSaved }) {
  const isEditing = Boolean(transaction?.id)
  const [formData, setFormData] = useState(initialFormState)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [loadingReferenceData, setLoadingReferenceData] = useState(true)
  const [referenceData, setReferenceData] = useState({
    transactionTypes: [],
    paymentMethods: [],
    companyAccounts: [],
    customers: [],
    agencies: [],
    instructors: [],
    thirdParties: []
  })
  const { t } = useTranslation()

  const entityTypeOptions = useMemo(
    () =>
      ENTITY_TYPES_BLUEPRINT.map((type) => ({
        ...type,
        label: t(type.labelKey, type.fallback)
      })),
    [t]
  )

  useEffect(() => {
    const fetchReferenceData = async () => {
      try {
        setLoadingReferenceData(true)
        const [
          transactionTypes,
          paymentMethods,
          companyAccounts,
          customers,
          agencies,
          instructors,
          thirdParties
        ] = await Promise.all([
          sql`SELECT id, label, code, direction FROM transaction_types ORDER BY label`,
          sql`SELECT id, name FROM payment_methods ORDER BY name`,
          sql`SELECT id, name FROM company_accounts ORDER BY name`,
          sql`SELECT id, fullname AS name FROM customers ORDER BY fullname LIMIT 500`,
          sql`SELECT id, name FROM agencies ORDER BY name LIMIT 200`,
          sql`SELECT id, fullname AS name FROM instructors ORDER BY fullname LIMIT 200`,
          sql`SELECT id, name FROM third_parties ORDER BY name LIMIT 200`
        ])

        setReferenceData({
          transactionTypes: transactionTypes || [],
          paymentMethods: paymentMethods || [],
          companyAccounts: companyAccounts || [],
          customers: customers || [],
          agencies: agencies || [],
          instructors: instructors || [],
          thirdParties: thirdParties || []
        })
      } catch (err) {
        console.error('Failed to load reference data:', err)
        setError(t('transactionForm.errors.referenceData', 'Unable to load reference data. Please refresh and try again.'))
      } finally {
        setLoadingReferenceData(false)
      }
    }

    fetchReferenceData()
  }, [t])

  useEffect(() => {
    if (transaction) {
      setFormData({
        occurred_at: transaction.occurred_at ? new Date(transaction.occurred_at).toISOString().slice(0, 16) : '',
        amount: transaction.amount?.toString() ?? '',
        currency: transaction.currency || 'USD',
        type_id: transaction.type_id ? String(transaction.type_id) : '',
        payment_method_id: transaction.payment_method_id ? String(transaction.payment_method_id) : '',
        source_entity_type: transaction.source_entity_type || 'company_account',
        source_entity_id: transaction.source_entity_id ? String(transaction.source_entity_id) : '',
        destination_entity_type: transaction.destination_entity_type || 'company_account',
        destination_entity_id: transaction.destination_entity_id ? String(transaction.destination_entity_id) : '',
        reference: transaction.reference || '',
        note: transaction.note || ''
      })
    } else {
      const now = new Date()
      const localIso = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
      setFormData((prev) => ({ ...initialFormState, occurred_at: localIso }))
    }
  }, [transaction])

  const entityOptionsMap = useMemo(
    () => ({
      company_account: referenceData.companyAccounts,
      customer: referenceData.customers,
      agency: referenceData.agencies,
      instructor: referenceData.instructors,
      third_party: referenceData.thirdParties
    }),
    [referenceData]
  )

  const handleChange = (event) => {
    const { name, value } = event.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSaving(true)
    setError(null)

    const selectedType = referenceData.transactionTypes.find((type) => String(type.id) === formData.type_id)

    if (!selectedType) {
      setError(t('transactionForm.validation.typeRequired', 'Transaction type is required.'))
      setSaving(false)
      return
    }

    const payload = {
      occurred_at: formData.occurred_at ? new Date(formData.occurred_at) : new Date(),
      amount: formData.amount ? Number(formData.amount) : 0,
      currency: formData.currency || 'USD',
      type_id: Number(selectedType.id),
      payment_method_id: formData.payment_method_id ? Number(formData.payment_method_id) : null,
      source_entity_type: formData.source_entity_type,
      source_entity_id: formData.source_entity_id ? Number(formData.source_entity_id) : null,
      destination_entity_type: formData.destination_entity_type,
      destination_entity_id: formData.destination_entity_id ? Number(formData.destination_entity_id) : null,
      reference: formData.reference || null,
      note: formData.note || null
    }

    if (!payload.amount || Number.isNaN(payload.amount) || payload.amount === 0) {
      setError(t('transactionForm.validation.amount', 'Amount must be a non-zero number.'))
      setSaving(false)
      return
    }

    if (selectedType.direction === 'income' && payload.amount < 0) {
      payload.amount = Math.abs(payload.amount)
    } else if (selectedType.direction === 'expense' && payload.amount > 0) {
      payload.amount = -payload.amount
    }

    try {
      if (isEditing) {
        await sql`
          UPDATE transactions
          SET occurred_at = ${payload.occurred_at},
              amount = ${payload.amount},
              currency = ${payload.currency},
              type_id = ${payload.type_id},
              payment_method_id = ${payload.payment_method_id},
              source_entity_type = ${payload.source_entity_type},
              source_entity_id = ${payload.source_entity_id},
              destination_entity_type = ${payload.destination_entity_type},
              destination_entity_id = ${payload.destination_entity_id},
              reference = ${payload.reference},
              note = ${payload.note},
              updated_at = NOW()
          WHERE id = ${transaction.id}
        `
      } else {
        await sql`
          INSERT INTO transactions (
            occurred_at,
            amount,
            currency,
            type_id,
            payment_method_id,
            source_entity_type,
            source_entity_id,
            destination_entity_type,
            destination_entity_id,
            reference,
            note
          ) VALUES (
            ${payload.occurred_at},
            ${payload.amount},
            ${payload.currency},
            ${payload.type_id},
            ${payload.payment_method_id},
            ${payload.source_entity_type},
            ${payload.source_entity_id},
            ${payload.destination_entity_type},
            ${payload.destination_entity_id},
            ${payload.reference},
            ${payload.note}
          )
        `
      }

      onSaved?.()
    } catch (err) {
      console.error('Failed to save transaction:', err)
      setError(t('transactionForm.errors.save', 'Unable to save transaction. Please check the details and try again.'))
    } finally {
      setSaving(false)
    }
  }

  const renderEntitySelect = (role) => {
    const typeKey = formData[`${role}_entity_type`]
    const options = entityOptionsMap[typeKey] || []
    const fieldName = `${role}_entity_id`
    const labelKey =
      role === 'source' ? 'transactionForm.section.sourceEntity' : 'transactionForm.section.destinationEntity'
    const placeholderKey =
      role === 'source' ? 'transactionForm.section.selectSource' : 'transactionForm.section.selectDestination'

    return (
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor={fieldName}>
          {t(labelKey, role === 'source' ? 'Source entity' : 'Destination entity')}
        </label>
        <select
          id={fieldName}
          name={fieldName}
          value={formData[fieldName]}
          onChange={handleChange}
          disabled={loadingReferenceData || options.length === 0}
          className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 disabled:bg-gray-100"
        >
          <option value="">{t(placeholderKey, role === 'source' ? 'Select source...' : 'Select destination...')}</option>
          {options.map((option) => (
            <option key={option.id} value={option.id}>
              {option.name}
            </option>
          ))}
        </select>
      </div>
    )
  }

  return (
    <div className="px-4 py-6 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-4xl rounded-xl bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {isEditing
                ? t('transactionForm.title.edit', 'Edit Transaction')
                : t('transactionForm.title.new', 'Add Transaction')}
            </h1>
            <p className="text-gray-500 text-sm">
              {isEditing
                ? t('transactionForm.subtitle.edit', 'Update the transaction details.')
                : t('transactionForm.subtitle.new', 'Record a new transaction entry.')}
            </p>
          </div>
          <button
            onClick={onCancel}
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
          >
            {t('transactionForm.buttons.cancel', 'Cancel')}
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="occurred_at">
                {t('transactionForm.fields.occurredAt', 'Date & time *')}
              </label>
              <input
                id="occurred_at"
                name="occurred_at"
                type="datetime-local"
                required
                value={formData.occurred_at}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="amount">
                {t('transactionForm.fields.amount', 'Amount *')}
              </label>
              <input
                id="amount"
                name="amount"
                type="number"
                step="0.01"
                required
                value={formData.amount}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="type_id">
                {t('transactionForm.fields.type', 'Transaction type *')}
              </label>
              <select
                id="type_id"
                name="type_id"
                required
                value={formData.type_id}
                onChange={handleChange}
                disabled={loadingReferenceData}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 disabled:bg-gray-100"
              >
                <option value="">{t('transactionForm.fields.type.placeholder', 'Select type...')}</option>
                {referenceData.transactionTypes.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="payment_method_id">
                {t('transactionForm.fields.paymentMethod', 'Payment method')}
              </label>
              <select
                id="payment_method_id"
                name="payment_method_id"
                value={formData.payment_method_id}
                onChange={handleChange}
                disabled={loadingReferenceData}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 disabled:bg-gray-100"
              >
                <option value="">{t('transactionForm.fields.paymentMethod.none', 'None')}</option>
                {referenceData.paymentMethods.map((method) => (
                  <option key={method.id} value={method.id}>
                    {method.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-3">
              <label className="text-sm font-semibold text-gray-800">
                {t('transactionForm.section.source', 'Source')}
              </label>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="source_entity_type">
                  {t('transactionForm.section.sourceType', 'Source type *')}
                </label>
                <select
                  id="source_entity_type"
                  name="source_entity_type"
                  value={formData.source_entity_type}
                  onChange={(event) => {
                    setFormData((prev) => ({ ...prev, source_entity_type: event.target.value, source_entity_id: '' }))
                  }}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                >
                  {entityTypeOptions.map((entity) => (
                    <option key={entity.value} value={entity.value}>
                      {entity.label}
                    </option>
                  ))}
                </select>
              </div>
              {renderEntitySelect('source')}
            </div>

            <div className="space-y-3">
              <label className="text-sm font-semibold text-gray-800">
                {t('transactionForm.section.destination', 'Destination')}
              </label>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="destination_entity_type">
                  {t('transactionForm.section.destinationType', 'Destination type *')}
                </label>
                <select
                  id="destination_entity_type"
                  name="destination_entity_type"
                  value={formData.destination_entity_type}
                  onChange={(event) => {
                    setFormData((prev) => ({ ...prev, destination_entity_type: event.target.value, destination_entity_id: '' }))
                  }}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                >
                  {entityTypeOptions.map((entity) => (
                    <option key={entity.value} value={entity.value}>
                      {entity.label}
                    </option>
                  ))}
                </select>
              </div>
              {renderEntitySelect('destination')}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="reference">
                {t('transactionForm.fields.reference', 'Reference')}
              </label>
              <input
                id="reference"
                name="reference"
                type="text"
                value={formData.reference}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="note">
                {t('transactionForm.fields.note', 'Note')}
              </label>
              <input
                id="note"
                name="note"
                type="text"
                value={formData.note}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
              />
            </div>
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
              {t('transactionForm.buttons.cancel', 'Cancel')}
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 transition-colors disabled:opacity-50"
            >
              {saving
                ? t('transactionForm.buttons.saving', 'Saving...')
                : isEditing
                ? t('transactionForm.buttons.saveChanges', 'Save changes')
                : t('transactionForm.buttons.create', 'Create transaction')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default TransactionForm


