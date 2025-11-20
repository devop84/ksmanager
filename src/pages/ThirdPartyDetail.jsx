import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import sql from '../lib/neon'
import { canModify } from '../lib/permissions'
import { useSettings } from '../context/SettingsContext'

function ThirdPartyDetail({ thirdPartyId, onBack, onEdit, onDelete, user = null }) {
  const [thirdParty, setThirdParty] = useState(null)
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const { t } = useTranslation()
  const { formatCurrency, formatDateTime } = useSettings()

  useEffect(() => {
    if (!thirdPartyId) return

    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)

        const [thirdPartyRows, transactionRows] = await Promise.all([
          sql`
            SELECT
              tp.id,
              tp.name,
              tp.phone,
              tp.email,
              tp.note,
              tp.category_id,
              tp.created_at,
              tp.updated_at,
              c.name AS category_name,
              c.description AS category_description
            FROM third_parties tp
            LEFT JOIN third_parties_categories c ON c.id = tp.category_id
            WHERE tp.id = ${thirdPartyId}
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
              t.note AS transaction_note
            FROM transactions t
            JOIN transaction_types tt ON tt.id = t.type_id
            LEFT JOIN payment_methods pm ON pm.id = t.payment_method_id
            WHERE (t.source_entity_type = 'third_party' AND t.source_entity_id = ${thirdPartyId})
               OR (t.destination_entity_type = 'third_party' AND t.destination_entity_id = ${thirdPartyId})
            ORDER BY t.occurred_at DESC
            LIMIT 50
          `
        ])

        if (!thirdPartyRows?.length) {
          setError(t('thirdPartyDetail.notFound'))
          setThirdParty(null)
          setTransactions([])
          return
        }

        const preparedTransactions =
          transactionRows?.map((row) => ({
            ...row,
            amount: Number(row.amount || 0)
          })) || []

        setThirdParty(thirdPartyRows[0])
        setTransactions(preparedTransactions)
      } catch (err) {
        console.error('Failed to load third party details:', err)
        setError(t('thirdPartyDetail.error.load'))
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [thirdPartyId, t])

  const summary = useMemo(() => {
    const totalTransactions = transactions.length
    const totalPaid = transactions.reduce((sum, txn) => {
      const amount = Number(txn.amount || 0)
      const isDestination = txn.destination_entity_type === 'third_party'
      if (txn.direction === 'expense' && isDestination) {
        return sum + Math.abs(amount)
      }
      return sum
    }, 0)
    const totalReceived = transactions.reduce((sum, txn) => {
      const amount = Number(txn.amount || 0)
      const isSource = txn.source_entity_type === 'third_party'
      if (txn.direction === 'income' && isSource) {
        return sum + Math.abs(amount)
      }
      return sum
    }, 0)
    const netFlow = transactions.reduce((sum, txn) => {
      const amount = Number(txn.amount || 0)
      const isDestination = txn.destination_entity_type === 'third_party'
      const isSource = txn.source_entity_type === 'third_party'
      if (isDestination) {
        return sum + amount
      } else if (isSource) {
        return sum - amount
      }
      return sum
    }, 0)

    return {
      totalTransactions,
      totalPaid,
      totalReceived,
      netFlow
    }
  }, [transactions])

  const handleDelete = async () => {
    if (!window.confirm(t('thirdPartyDetail.confirm.delete'))) {
      return
    }
    try {
      setDeleting(true)
      await sql`DELETE FROM third_parties WHERE id = ${thirdPartyId}`
      if (onDelete) {
        onDelete()
      } else if (onBack) {
        onBack()
      }
    } catch (err) {
      console.error('Failed to delete third party:', err)
      alert(t('thirdPartyDetail.error.delete'))
    } finally {
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="px-4 py-6 sm:p-6 lg:p-8">
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <div className="text-gray-600">{t('thirdPartyDetail.loading')}</div>
        </div>
      </div>
    )
  }

  if (error || !thirdParty) {
    return (
      <div className="px-4 py-6 sm:p-6 lg:p-8">
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <div className="text-red-600">{error || t('thirdPartyDetail.notFound')}</div>
          {onBack && (
            <button
              onClick={onBack}
              className="mt-4 rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
            >
              {t('thirdPartyDetail.back')}
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
            {t('thirdPartyDetail.back')}
          </button>
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{thirdParty.name}</h1>
              <p className="text-gray-500 text-sm mt-1">
                {(thirdParty.category_name || t('thirdPartyDetail.category.uncategorized'))} •{' '}
                {t('thirdPartyDetail.description')}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => onEdit?.(thirdParty)}
                disabled={!canModify(user)}
                className="inline-flex items-center justify-center rounded-lg border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white"
              >
                {t('thirdPartyDetail.actions.edit')}
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting || !canModify(user)}
                className="inline-flex items-center justify-center rounded-lg border border-red-300 px-3 py-2 text-sm font-semibold text-red-700 shadow-sm hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white"
              >
                {deleting ? t('thirdPartyDetail.buttons.deleting') : t('thirdPartyDetail.buttons.delete')}
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          <div className="xl:col-span-3 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="rounded-lg border border-indigo-100 bg-indigo-50/70 p-4">
                <p className="text-sm font-medium text-indigo-700">{t('thirdPartyDetail.summary.transactions')}</p>
                <p className="text-2xl font-bold text-indigo-900 mt-1">{summary.totalTransactions}</p>
              </div>
              <div className="rounded-lg border border-emerald-100 bg-emerald-50/70 p-4">
                <p className="text-sm font-medium text-emerald-700">{t('thirdPartyDetail.summary.paid')}</p>
                <p className="text-2xl font-bold text-emerald-900 mt-1">{formatCurrency(summary.totalPaid)}</p>
              </div>
              <div className="rounded-lg border border-rose-100 bg-rose-50/70 p-4">
                <p className="text-sm font-medium text-rose-700">{t('thirdPartyDetail.summary.received')}</p>
                <p className="text-2xl font-bold text-rose-900 mt-1">{formatCurrency(summary.totalReceived)}</p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-medium text-slate-700">{t('thirdPartyDetail.summary.net')}</p>
                <p className={`text-2xl font-bold mt-1 ${summary.netFlow >= 0 ? 'text-slate-900' : 'text-rose-600'}`}>
                  {formatCurrency(summary.netFlow)}
                </p>
              </div>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">{t('thirdPartyDetail.transactions.title')}</h2>
                <p className="text-sm text-gray-500">
                  {t('thirdPartyDetail.transactions.count', { count: transactions.length })}
                </p>
              </div>
              {transactions.length === 0 ? (
                <div className="text-gray-600">{t('thirdPartyDetail.transactions.empty')}</div>
              ) : (
                <>
                  <div className="hidden md:block overflow-x-auto border border-gray-200 rounded-xl">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            {t('thirdPartyDetail.transactions.table.date')}
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            {t('thirdPartyDetail.transactions.table.type')}
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            {t('thirdPartyDetail.transactions.table.method')}
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            {t('thirdPartyDetail.transactions.table.reference')}
                          </th>
                          <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            {t('thirdPartyDetail.transactions.table.amount')}
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-100">
                        {transactions.map((txn) => {
                          const isIncoming = txn.destination_entity_type === 'third_party'
                          return (
                            <tr key={txn.id} className="hover:bg-gray-50">
                              <td className="px-4 py-3 text-sm text-gray-600">{formatDateTime(txn.occurred_at)}</td>
                              <td className="px-4 py-3 text-sm text-gray-600">{txn.type_label}</td>
                              <td className="px-4 py-3 text-sm text-gray-600">{txn.payment_method || '—'}</td>
                              <td className="px-4 py-3 text-sm text-gray-600">{txn.reference || '—'}</td>
                              <td
                                className={`px-4 py-3 text-sm font-semibold text-right ${
                                  isIncoming
                                    ? txn.direction === 'income'
                                      ? 'text-emerald-600'
                                      : 'text-rose-600'
                                    : txn.direction === 'expense'
                                    ? 'text-rose-600'
                                    : 'text-emerald-600'
                                }`}
                              >
                                {isIncoming ? '+' : '-'}
                                {formatCurrency(Math.abs(txn.amount))}
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>

                  <div className="md:hidden space-y-3">
                    {transactions.map((txn) => {
                      const isIncoming = txn.destination_entity_type === 'third_party'
                      return (
                        <div key={txn.id} className="rounded-lg border border-gray-200 p-4">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <p className="text-sm font-semibold text-gray-900">{txn.type_label}</p>
                              <p className="text-xs text-gray-500">{formatDateTime(txn.occurred_at)}</p>
                            </div>
                            <p
                              className={`text-sm font-semibold ${
                                isIncoming
                                  ? txn.direction === 'income'
                                    ? 'text-emerald-600'
                                    : 'text-rose-600'
                                  : txn.direction === 'expense'
                                  ? 'text-rose-600'
                                  : 'text-emerald-600'
                              }`}
                            >
                              {isIncoming ? '+' : '-'}
                              {formatCurrency(Math.abs(txn.amount))}
                            </p>
                          </div>
                          <dl className="mt-3 grid grid-cols-2 gap-3 text-xs text-gray-500">
                          <div>
                            <dt className="uppercase">{t('thirdPartyDetail.transactions.table.method')}</dt>
                            <dd className="text-gray-900 text-sm">{txn.payment_method || '—'}</dd>
                          </div>
                          <div>
                            <dt className="uppercase">{t('thirdPartyDetail.transactions.table.reference')}</dt>
                            <dd className="text-gray-900 text-sm">{txn.reference || '—'}</dd>
                          </div>
                          {txn.transaction_note && (
                            <div className="col-span-2">
                              <dt className="uppercase">{t('thirdPartyDetail.transactions.table.note')}</dt>
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
                  <h2 className="text-lg font-semibold text-gray-900">{t('thirdPartyDetail.info.title')}</h2>
                </div>
                <dl className="space-y-4 text-sm">
                  <div>
                    <dt className="text-xs font-medium text-gray-500 uppercase">{t('thirdPartyDetail.info.category')}</dt>
                    <dd className="mt-1 text-gray-900">
                      {thirdParty.category_name || t('thirdPartyDetail.category.uncategorized')}
                    </dd>
                    {thirdParty.category_description && (
                      <dd className="mt-1 text-xs text-gray-500">{thirdParty.category_description}</dd>
                    )}
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-gray-500 uppercase">{t('thirdPartyDetail.info.phone')}</dt>
                    <dd className="mt-1 text-gray-900">{thirdParty.phone || '—'}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-gray-500 uppercase">{t('thirdPartyDetail.info.email')}</dt>
                    <dd className="mt-1 text-gray-900">{thirdParty.email || '—'}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-gray-500 uppercase">{t('thirdPartyDetail.info.note')}</dt>
                    <dd className="mt-1 text-gray-900 whitespace-pre-wrap">{thirdParty.note || '—'}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-gray-500 uppercase">{t('thirdPartyDetail.info.created')}</dt>
                    <dd className="mt-1 text-gray-900">{formatDateTime(thirdParty.created_at)}</dd>
                  </div>
                  {thirdParty.updated_at && (
                    <div>
                      <dt className="text-xs font-medium text-gray-500 uppercase">{t('thirdPartyDetail.info.updated')}</dt>
                      <dd className="mt-1 text-gray-900">{formatDateTime(thirdParty.updated_at)}</dd>
                    </div>
                  )}
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ThirdPartyDetail

