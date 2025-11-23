import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import sql from '../../lib/neon'
import { canModify } from '../../lib/permissions'
import { useSettings } from '../../context/SettingsContext'
import DetailInfoPanel from '../../components/ui/DetailInfoPanel'

const directionStyles = {
  income: {
    pill: 'text-emerald-700 bg-emerald-50 border-emerald-100',
    amount: 'text-emerald-700'
  },
  expense: {
    pill: 'text-rose-700 bg-rose-50 border-rose-100',
    amount: 'text-rose-700'
  },
  transfer: {
    pill: 'text-slate-700 bg-slate-50 border-slate-200',
    amount: 'text-slate-700'
  }
}

function TransactionDetail({ transactionId, onBack, onEdit, onDelete, user = null }) {
  const [transaction, setTransaction] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const { formatCurrency, formatDateTime } = useSettings()
  const { t } = useTranslation()
  const entityTypeLabels = useMemo(
    () => ({
      company_account: t('transactions.entity.company_account', 'Company Account'),
      customer: t('transactions.entity.customer', 'Customer'),
      agency: t('transactions.entity.agency', 'Agency'),
      instructor: t('transactions.entity.instructor', 'Instructor'),
      third_party: t('transactions.entity.third_party', 'Third Party'),
      order: t('transactions.entity.order', 'Order'),
    }),
    [t],
  )

  useEffect(() => {
    if (!transactionId) return

    const fetchTransaction = async () => {
      try {
        setLoading(true)
        setError(null)
        const rows =
          (await sql`
            SELECT
              t.id,
              t.type_id,
              t.payment_method_id,
              t.occurred_at,
              t.amount,
              t.currency,
              t.reference,
              t.note,
              t.source_entity_type,
              t.source_entity_id,
              t.destination_entity_type,
              t.destination_entity_id,
              t.created_at,
              t.updated_at,
              t.created_by,
              tt.label AS type_label,
              tt.code AS type_code,
              tt.direction AS type_direction,
              pm.name AS payment_method_name,
              sca.name AS source_company_account_name,
              dca.name AS destination_company_account_name,
              sc.fullname AS source_customer_name,
              dc.fullname AS destination_customer_name,
              sa.name AS source_agency_name,
              da.name AS destination_agency_name,
              si.fullname AS source_instructor_name,
              di.fullname AS destination_instructor_name,
              stp.name AS source_third_party_name,
              dtp.name AS destination_third_party_name,
              u.name AS created_by_name
            FROM transactions t
            JOIN transaction_types tt ON tt.id = t.type_id
            LEFT JOIN payment_methods pm ON pm.id = t.payment_method_id
            LEFT JOIN company_accounts sca ON t.source_entity_type = 'company_account' AND sca.id = t.source_entity_id
            LEFT JOIN company_accounts dca ON t.destination_entity_type = 'company_account' AND dca.id = t.destination_entity_id
            LEFT JOIN customers sc ON t.source_entity_type = 'customer' AND sc.id = t.source_entity_id
            LEFT JOIN customers dc ON t.destination_entity_type = 'customer' AND dc.id = t.destination_entity_id
            LEFT JOIN agencies sa ON t.source_entity_type = 'agency' AND sa.id = t.source_entity_id
            LEFT JOIN agencies da ON t.destination_entity_type = 'agency' AND da.id = t.destination_entity_id
            LEFT JOIN instructors si ON t.source_entity_type = 'instructor' AND si.id = t.source_entity_id
            LEFT JOIN instructors di ON t.destination_entity_type = 'instructor' AND di.id = t.destination_entity_id
            LEFT JOIN third_parties stp ON t.source_entity_type = 'third_party' AND stp.id = t.source_entity_id
            LEFT JOIN third_parties dtp ON t.destination_entity_type = 'third_party' AND dtp.id = t.destination_entity_id
            LEFT JOIN users u ON u.id = t.created_by
            WHERE t.id = ${transactionId}
            LIMIT 1
          `) || []

        if (!rows.length) {
          setError(t('transactionDetail.notFound', 'Transaction not found'))
          setTransaction(null)
          return
        }

        setTransaction(rows[0])
      } catch (err) {
        console.error('Failed to load transaction details:', err)
        setError(t('transactionDetail.error.load', 'Unable to load transaction details. Please try again later.'))
      } finally {
        setLoading(false)
      }
    }

    fetchTransaction()
  }, [transactionId, t])

  const formatAmount = (value, options) =>
    formatCurrency(Number(value || 0), { minimumFractionDigits: 2, maximumFractionDigits: 2, ...options })

  const formatEntityName = (txn, role = 'source') => {
    if (!txn) return '—'
    const typeKey = role === 'source' ? txn.source_entity_type : txn.destination_entity_type
    const idKey = role === 'source' ? txn.source_entity_id : txn.destination_entity_id
    const fallback = typeKey ? `${entityTypeLabels[typeKey] || typeKey} #${idKey ?? '—'}` : '—'

    switch (typeKey) {
      case 'company_account':
        return role === 'source'
          ? txn.source_company_account_name || fallback
          : txn.destination_company_account_name || fallback
      case 'customer':
        return role === 'source' ? txn.source_customer_name || fallback : txn.destination_customer_name || fallback
      case 'agency':
        return role === 'source' ? txn.source_agency_name || fallback : txn.destination_agency_name || fallback
      case 'instructor':
        return role === 'source'
          ? txn.source_instructor_name || fallback
          : txn.destination_instructor_name || fallback
      case 'third_party':
        return role === 'source' ? txn.source_third_party_name || fallback : txn.destination_third_party_name || fallback
      default:
        return fallback
    }
  }

  const handleDelete = async () => {
    if (!transactionId) return
    if (!window.confirm(t('transactionDetail.confirm.delete', 'Are you sure you want to delete this transaction? This action cannot be undone.'))) {
      return
    }
    try {
      setDeleting(true)
      await sql`DELETE FROM transactions WHERE id = ${transactionId}`
      onDelete?.()
    } catch (err) {
      console.error('Failed to delete transaction:', err)
      alert(t('transactionDetail.error.delete', 'Unable to delete transaction. Please try again.'))
    } finally {
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="px-4 py-6 sm:p-6 lg:p-8">
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <div className="text-gray-600">{t('transactionDetail.loading', 'Loading transaction details...')}</div>
        </div>
      </div>
    )
  }

  if (error || !transaction) {
    return (
      <div className="px-4 py-6 sm:p-6 lg:p-8">
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <div className="text-red-600">{error || t('transactionDetail.notFound', 'Transaction not found')}</div>
          {onBack && (
            <button
              onClick={onBack}
              className="mt-4 rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
            >
              {t('transactionDetail.backToList', 'Back to Transactions')}
            </button>
          )}
        </div>
      </div>
    )
  }

  const directionStyle = directionStyles[transaction.type_direction] || directionStyles.transfer
  const amountValue = formatAmount(Math.abs(transaction.amount), { signDisplay: 'never' })
  const amountPrefix = transaction.amount < 0 ? '-' : ''

  return (
    <div className="px-4 py-6 sm:p-6 lg:p-8">
      <div className="rounded-xl bg-white p-4 sm:p-6 shadow-sm">
        <div className="mb-6 pb-6 border-b border-gray-200">
          <button
            onClick={onBack}
            className="mb-2 flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            {t('transactionDetail.backToList', 'Back to Transactions')}
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {t('transactionDetail.title', 'Transaction #{{id}}', { id: transaction.id })}
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              {t('transactionDetail.subtitle', 'Full audit trail for this transaction entry.')}
            </p>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-4">
          <div className="xl:col-span-3 space-y-6">
            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-center gap-4">
                <div>
                  <p className="text-xs font-semibold uppercase text-gray-500">
                    {t('transactionDetail.amount', 'Amount')}
                  </p>
                  <p className={`text-3xl font-bold ${directionStyle.amount}`}>
                    {amountPrefix}
                    {amountValue}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase text-gray-500">
                    {t('transactionDetail.type', 'Type')}
                  </p>
                  <span className={`mt-1 inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${directionStyle.pill}`}>
                    {transaction.type_label}
                  </span>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase text-gray-500">
                    {t('transactionDetail.paymentMethod', 'Payment Method')}
                  </p>
                  <p className="text-base font-medium text-gray-900">{transaction.payment_method_name || '—'}</p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase text-gray-500">
                    {t('transactionDetail.occurredAt', 'Occurred at')}
                  </p>
                  <p className="text-base font-medium text-gray-900">
                    {formatDateTime(transaction.occurred_at, {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-xl border border-emerald-100 bg-emerald-50/50 p-4">
                <p className="text-xs font-semibold uppercase text-emerald-600">
                  {t('transactionDetail.source', 'Source')}
                </p>
                <p className="mt-2 text-lg font-semibold text-gray-900">{formatEntityName(transaction, 'source')}</p>
                <p className="text-xs uppercase text-gray-500">
                  {entityTypeLabels[transaction.source_entity_type] || transaction.source_entity_type || '—'} • ID #
                  {transaction.source_entity_id ?? '—'}
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                <p className="text-xs font-semibold uppercase text-slate-600">
                  {t('transactionDetail.destination', 'Destination')}
                </p>
                <p className="mt-2 text-lg font-semibold text-gray-900">{formatEntityName(transaction, 'destination')}</p>
                <p className="text-xs uppercase text-gray-500">
                  {entityTypeLabels[transaction.destination_entity_type] || transaction.destination_entity_type || '—'} • ID #
                  {transaction.destination_entity_id ?? '—'}
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                {t('transactionDetail.details.title', 'Details')}
              </h2>
              <dl className="grid gap-4 md:grid-cols-2">
                <div>
                  <dt className="text-xs font-semibold uppercase text-gray-500">
                    {t('transactionDetail.details.reference', 'Reference')}
                  </dt>
                  <dd className="mt-1 text-gray-900">{transaction.reference || '—'}</dd>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase text-gray-500">
                    {t('transactionDetail.details.createdBy', 'Created By')}
                  </dt>
                  <dd className="mt-1 text-gray-900">{transaction.created_by_name || '—'}</dd>
                </div>
                <div className="md:col-span-2">
                  <dt className="text-xs font-semibold uppercase text-gray-500">
                    {t('transactionDetail.details.note', 'Note')}
                  </dt>
                  <dd className="mt-1 whitespace-pre-wrap text-gray-900">{transaction.note || '—'}</dd>
                </div>
              </dl>
            </div>
          </div>

          <div className="xl:col-span-1">
            <DetailInfoPanel
              title={t('transactionDetail.info.title', 'Transaction Information')}
              onEdit={() => onEdit?.(transaction)}
              onDelete={handleDelete}
              user={user}
              deleting={deleting}
            >
              <dl className="space-y-4 text-sm">
                <div>
                  <dt className="text-xs font-medium text-gray-500 uppercase">{t('transactionDetail.info.id', 'ID')}</dt>
                  <dd className="mt-1 text-gray-900 font-mono">#{transaction.id}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-gray-500 uppercase">{t('transactionDetail.info.occurredAt', 'Occurred At')}</dt>
                  <dd className="mt-1 text-gray-900">{formatDateTime(transaction.occurred_at)}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-gray-500 uppercase">{t('transactionDetail.info.amount', 'Amount')}</dt>
                  <dd className="mt-1 text-gray-900 font-semibold">{formatAmount(transaction.amount)}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-gray-500 uppercase">{t('transactionDetail.info.currency', 'Currency')}</dt>
                  <dd className="mt-1 text-gray-900">{transaction.currency || 'USD'}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-gray-500 uppercase">{t('transactionDetail.info.type', 'Type')}</dt>
                  <dd className="mt-1 text-gray-900">{transaction.type_label || '—'}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-gray-500 uppercase">{t('transactionDetail.info.typeCode', 'Type Code')}</dt>
                  <dd className="mt-1 text-gray-900 uppercase tracking-wide">{transaction.type_code || '—'}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-gray-500 uppercase">{t('transactionDetail.info.paymentMethod', 'Payment Method')}</dt>
                  <dd className="mt-1 text-gray-900">{transaction.payment_method_name || '—'}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-gray-500 uppercase">{t('transactionDetail.info.sourceEntityType', 'Source Entity Type')}</dt>
                  <dd className="mt-1 text-gray-900">{entityTypeLabels[transaction.source_entity_type] || transaction.source_entity_type || '—'}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-gray-500 uppercase">{t('transactionDetail.info.sourceEntity', 'Source Entity')}</dt>
                  <dd className="mt-1 text-gray-900">{formatEntityName(transaction, 'source')}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-gray-500 uppercase">{t('transactionDetail.info.destinationEntityType', 'Destination Entity Type')}</dt>
                  <dd className="mt-1 text-gray-900">{entityTypeLabels[transaction.destination_entity_type] || transaction.destination_entity_type || '—'}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-gray-500 uppercase">{t('transactionDetail.info.destinationEntity', 'Destination Entity')}</dt>
                  <dd className="mt-1 text-gray-900">{formatEntityName(transaction, 'destination')}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-gray-500 uppercase">{t('transactionDetail.info.reference', 'Reference')}</dt>
                  <dd className="mt-1 text-gray-900">{transaction.reference || '—'}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-gray-500 uppercase">{t('transactionDetail.info.note', 'Note')}</dt>
                  <dd className="mt-1 text-gray-900 whitespace-pre-wrap">{transaction.note || '—'}</dd>
                </div>
                {transaction.created_by_name && (
                  <div>
                    <dt className="text-xs font-medium text-gray-500 uppercase">{t('transactionDetail.info.createdBy', 'Created By')}</dt>
                    <dd className="mt-1 text-gray-900">{transaction.created_by_name}</dd>
                  </div>
                )}
                <div>
                  <dt className="text-xs font-medium text-gray-500 uppercase">{t('transactionDetail.info.createdAt', 'Created At')}</dt>
                  <dd className="mt-1 text-gray-900">{formatDateTime(transaction.created_at)}</dd>
                </div>
                {transaction.updated_at && (
                  <div>
                    <dt className="text-xs font-medium text-gray-500 uppercase">{t('transactionDetail.info.updatedAt', 'Updated At')}</dt>
                    <dd className="mt-1 text-gray-900">{formatDateTime(transaction.updated_at)}</dd>
                  </div>
                )}
              </dl>
            </DetailInfoPanel>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TransactionDetail

