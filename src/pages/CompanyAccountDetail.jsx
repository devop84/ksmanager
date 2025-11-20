import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import sql from '../lib/neon'
import { canModify } from '../lib/permissions'
import { useSettings } from '../context/SettingsContext'

function CompanyAccountDetail({ accountId, onBack, onEdit, onDelete, user = null }) {
  const [account, setAccount] = useState(null)
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const { formatCurrency, formatDateTime } = useSettings()
  const { t } = useTranslation()

  useEffect(() => {
    if (!accountId) return

    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)

        const [accountRows, transactionRows] = await Promise.all([
          sql`
            SELECT
              id,
              name,
              details,
              note
            FROM company_accounts
            WHERE id = ${accountId}
            LIMIT 1
          `,
          sql`
            SELECT
              t.id,
              t.occurred_at,
              t.amount,
              tt.label AS type_label,
              tt.direction,
              pm.name AS payment_method,
              t.source_entity_type,
              t.source_entity_id,
              t.destination_entity_type,
              t.destination_entity_id,
              t.reference,
              t.note AS transaction_note,
              CASE
                WHEN t.source_entity_type = 'customer' THEN (SELECT fullname FROM customers WHERE id = t.source_entity_id)
                WHEN t.source_entity_type = 'agency' THEN (SELECT name FROM agencies WHERE id = t.source_entity_id)
                WHEN t.source_entity_type = 'instructor' THEN (SELECT fullname FROM instructors WHERE id = t.source_entity_id)
                WHEN t.source_entity_type = 'third_party' THEN (SELECT name FROM third_parties WHERE id = t.source_entity_id)
                WHEN t.source_entity_type = 'company_account' THEN (SELECT name FROM company_accounts WHERE id = t.source_entity_id)
                ELSE NULL
              END AS source_name,
              CASE
                WHEN t.destination_entity_type = 'customer' THEN (SELECT fullname FROM customers WHERE id = t.destination_entity_id)
                WHEN t.destination_entity_type = 'agency' THEN (SELECT name FROM agencies WHERE id = t.destination_entity_id)
                WHEN t.destination_entity_type = 'instructor' THEN (SELECT fullname FROM instructors WHERE id = t.destination_entity_id)
                WHEN t.destination_entity_type = 'third_party' THEN (SELECT name FROM third_parties WHERE id = t.destination_entity_id)
                WHEN t.destination_entity_type = 'company_account' THEN (SELECT name FROM company_accounts WHERE id = t.destination_entity_id)
                ELSE NULL
              END AS destination_name
            FROM transactions t
            JOIN transaction_types tt ON tt.id = t.type_id
            LEFT JOIN payment_methods pm ON pm.id = t.payment_method_id
            WHERE (t.source_entity_type = 'company_account' AND t.source_entity_id = ${accountId})
               OR (t.destination_entity_type = 'company_account' AND t.destination_entity_id = ${accountId})
            ORDER BY t.occurred_at DESC
            LIMIT 50
          `
        ])

        if (!accountRows?.length) {
          setError(t('companyAccountDetail.notFound'))
          setAccount(null)
          setTransactions([])
          return
        }

        const preparedTransactions =
          transactionRows?.map((row) => ({
            ...row,
            amount: Number(row.amount || 0),
            isAccountDestination: row.destination_entity_type === 'company_account' && Number(row.destination_entity_id) === Number(accountId),
            isAccountSource: row.source_entity_type === 'company_account' && Number(row.source_entity_id) === Number(accountId)
          })) || []

        setAccount(accountRows[0])
        setTransactions(preparedTransactions)
      } catch (err) {
        console.error('Failed to load company account details:', err)
        setError(t('companyAccountDetail.error.load'))
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [accountId, t])

  const summary = useMemo(() => {
    const totalTransactions = transactions.length
    const totalIncoming = transactions.reduce((sum, txn) => {
      const amount = Number(txn.amount || 0)
      const isAccountDestination = txn.isAccountDestination
      // Money coming in: account is destination (regardless of amount sign, includes transfers)
      if (isAccountDestination) {
        return sum + Math.abs(amount)
      }
      return sum
    }, 0)
    const totalOutgoing = transactions.reduce((sum, txn) => {
      const amount = Number(txn.amount || 0)
      const isAccountSource = txn.isAccountSource
      // Money going out: account is source (regardless of amount sign, includes transfers)
      if (isAccountSource) {
        return sum + Math.abs(amount)
      }
      return sum
    }, 0)
    const netBalance = transactions.reduce((sum, txn) => {
      const amount = Number(txn.amount || 0)
      const isAccountDestination = txn.isAccountDestination
      const isAccountSource = txn.isAccountSource
      // For net balance: if account is destination, add amount; if account is source, subtract absolute amount
      if (isAccountDestination) {
        return sum + amount
      } else if (isAccountSource) {
        return sum - Math.abs(amount)  // If source, subtract the absolute value (money going out)
      }
      return sum
    }, 0)

    return {
      totalTransactions,
      totalIncoming,
      totalOutgoing,
      netBalance
    }
  }, [transactions])

  const handleDelete = async () => {
    if (!window.confirm(t('companyAccountDetail.confirm.delete'))) {
      return
    }
    try {
      setDeleting(true)
      await sql`DELETE FROM company_accounts WHERE id = ${accountId}`
      if (onDelete) {
        onDelete()
      } else if (onBack) {
        onBack()
      }
    } catch (err) {
      console.error('Failed to delete company account:', err)
      alert(t('companyAccountDetail.error.delete'))
    } finally {
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="px-4 py-6 sm:p-6 lg:p-8">
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <div className="text-gray-600">{t('common.loading')}</div>
        </div>
      </div>
    )
  }

  if (error || !account) {
    return (
      <div className="px-4 py-6 sm:p-6 lg:p-8">
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <div className="text-red-600">{error || t('companyAccountDetail.notFound')}</div>
          {onBack && (
            <button
              onClick={onBack}
              className="mt-4 rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
            >
              {t('companyAccountDetail.back')}
            </button>
          )}
        </div>
      </div>
    )
  }

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
            {t('companyAccountDetail.back')}
          </button>
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{account.name}</h1>
              <p className="text-gray-500 text-sm mt-1">{t('companyAccountDetail.description')}</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => onEdit?.(account)}
                disabled={!canModify(user)}
                className="inline-flex items-center justify-center rounded-lg border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white"
              >
                {t('companyAccountDetail.buttons.edit')}
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting || !canModify(user)}
                className="inline-flex items-center justify-center rounded-lg border border-red-300 px-3 py-2 text-sm font-semibold text-red-700 shadow-sm hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white"
              >
                {deleting ? t('companyAccountDetail.buttons.deleting') : t('companyAccountDetail.buttons.delete')}
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          <div className="xl:col-span-3 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="rounded-lg border border-indigo-100 bg-indigo-50/70 p-4">
                <p className="text-sm font-medium text-indigo-700">{t('companyAccountDetail.summary.transactions')}</p>
                <p className="text-2xl font-bold text-indigo-900 mt-1">{summary.totalTransactions}</p>
              </div>
              <div className="rounded-lg border border-emerald-100 bg-emerald-50/70 p-4">
                <p className="text-sm font-medium text-emerald-700">{t('companyAccountDetail.summary.incoming')}</p>
                <p className="text-2xl font-bold text-emerald-900 mt-1">{formatCurrency(summary.totalIncoming)}</p>
              </div>
              <div className="rounded-lg border border-rose-100 bg-rose-50/70 p-4">
                <p className="text-sm font-medium text-rose-700">{t('companyAccountDetail.summary.outgoing')}</p>
                <p className="text-2xl font-bold text-rose-900 mt-1">{formatCurrency(summary.totalOutgoing)}</p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-medium text-slate-700">{t('companyAccountDetail.summary.net')}</p>
                <p className={`text-2xl font-bold mt-1 ${summary.netBalance >= 0 ? 'text-slate-900' : 'text-rose-600'}`}>
                  {formatCurrency(summary.netBalance)}
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">{t('companyAccountDetail.transactions.title')}</h2>
                <p className="text-sm text-gray-500">
                  {t('companyAccountDetail.transactions.count', { count: transactions.length })}
                </p>
              </div>
              {transactions.length === 0 ? (
                <div className="text-gray-600">{t('companyAccountDetail.transactions.empty')}</div>
              ) : (
                <>
                  <div className="hidden md:block overflow-x-auto border border-gray-200 rounded-xl">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            {t('companyAccountDetail.table.date')}
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            {t('companyAccountDetail.table.type')}
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            {t('companyAccountDetail.table.counterparty')}
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            {t('companyAccountDetail.table.payment')}
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            {t('companyAccountDetail.table.reference')}
                          </th>
                          <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            {t('companyAccountDetail.table.amount')}
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-100">
                        {transactions.map((txn) => {
                          const isAccountDestination = txn.isAccountDestination
                          const isAccountSource = txn.isAccountSource
                          // Show the other party (not the company account itself)
                          const otherParty = isAccountDestination ? txn.source_name : txn.destination_name
                          // Amount: positive if account receives, negative if account sends
                          const displayAmount = isAccountDestination ? Math.abs(txn.amount) : -Math.abs(txn.amount)
                          const isPositive = displayAmount > 0
                          return (
                            <tr key={txn.id} className="hover:bg-gray-50">
                              <td className="px-4 py-3 text-sm text-gray-600">{formatDateTime(txn.occurred_at)}</td>
                              <td className="px-4 py-3 text-sm text-gray-600">{txn.type_label}</td>
                              <td className="px-4 py-3 text-sm text-gray-600">{otherParty || '—'}</td>
                              <td className="px-4 py-3 text-sm text-gray-600">{txn.payment_method || '—'}</td>
                              <td className="px-4 py-3 text-sm text-gray-600">{txn.reference || '—'}</td>
                              <td
                                className={`px-4 py-3 text-sm font-semibold text-right ${
                                  isPositive ? 'text-emerald-600' : 'text-rose-600'
                                }`}
                              >
                                {formatCurrency(displayAmount)}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>

                  <div className="md:hidden space-y-3">
                    {transactions.map((txn) => {
                      const isAccountDestination = txn.isAccountDestination
                      const isAccountSource = txn.isAccountSource
                      // Show the other party (not the company account itself)
                      const otherParty = isAccountDestination ? txn.source_name : txn.destination_name
                      // Amount: positive if account receives, negative if account sends
                      const displayAmount = isAccountDestination ? Math.abs(txn.amount) : -Math.abs(txn.amount)
                      const isPositive = displayAmount > 0
                      return (
                        <div key={txn.id} className="rounded-lg border border-gray-200 p-4">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <p className="text-sm font-semibold text-gray-900">{txn.type_label}</p>
                              <p className="text-xs text-gray-500">{formatDateTime(txn.occurred_at)}</p>
                            </div>
                            <p className={`text-sm font-semibold ${isPositive ? 'text-emerald-600' : 'text-rose-600'}`}>
                              {formatCurrency(displayAmount)}
                            </p>
                          </div>
                          <dl className="mt-3 grid grid-cols-2 gap-3 text-xs text-gray-500">
                            <div>
                              <dt className="uppercase">{t('companyAccountDetail.mobile.counterparty')}</dt>
                              <dd className="text-gray-900 text-sm">{otherParty || '—'}</dd>
                            </div>
                            <div>
                              <dt className="uppercase">{t('companyAccountDetail.mobile.payment')}</dt>
                              <dd className="text-gray-900 text-sm">{txn.payment_method || '—'}</dd>
                            </div>
                            <div>
                              <dt className="uppercase">{t('companyAccountDetail.mobile.reference')}</dt>
                              <dd className="text-gray-900 text-sm">{txn.reference || '—'}</dd>
                            </div>
                            {txn.transaction_note && (
                              <div className="col-span-2">
                                <dt className="uppercase">{t('companyAccountDetail.mobile.note')}</dt>
                                <dd className="text-gray-900 text-sm">{txn.transaction_note}</dd>
                              </div>
                            )}
                          </dl>
                        </div>
                      )
                    })}
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="xl:col-span-1">
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-5 shadow-sm sticky top-6 space-y-6">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">{t('companyAccountDetail.info.title')}</h2>
                </div>
                <dl className="space-y-4 text-sm">
                  <div>
                    <dt className="text-xs font-medium text-gray-500 uppercase">{t('companyAccountDetail.info.details')}</dt>
                    <dd className="mt-1 text-gray-900 whitespace-pre-wrap">{account.details || '—'}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-gray-500 uppercase">{t('companyAccountDetail.info.note')}</dt>
                    <dd className="mt-1 text-gray-900 whitespace-pre-wrap">{account.note || '—'}</dd>
                  </div>
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CompanyAccountDetail

