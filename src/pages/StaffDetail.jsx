import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import sql from '../lib/neon'
import { canModify } from '../lib/permissions'
import { useSettings } from '../context/SettingsContext'

function StaffDetail({ staffId, onBack, onEdit, onDelete, user = null }) {
  const [staff, setStaff] = useState(null)
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [summary, setSummary] = useState({
    totalPaid: 0,
    totalReceived: 0
  })
  const { t } = useTranslation()
  const { formatCurrency, formatDateTime, formatNumber } = useSettings()

  useEffect(() => {
    const fetchStaff = async () => {
      try {
        setLoading(true)
        setError(null)

        const staffRows = await sql`
          SELECT
            s.id,
            s.fullname,
            s.role,
            s.phone,
            s.email,
            s.bankdetail,
            s.hourlyrate,
            s.commission,
            s.monthlyfix,
            s.note,
            s.created_at,
            s.updated_at
          FROM staff s
          WHERE s.id = ${staffId}
          LIMIT 1
        `

        if (!staffRows?.length) {
          setError(t('staffDetail.notFound'))
          setStaff(null)
          return
        }

        setStaff(staffRows[0])

        const transactionRows =
          (await sql`
            SELECT
              t.id,
              t.occurred_at,
              t.amount,
              tt.label AS type_label,
              tt.direction,
              pm.name AS payment_method
            FROM transactions t
            JOIN transaction_types tt ON tt.id = t.type_id
            LEFT JOIN payment_methods pm ON pm.id = t.payment_method_id
            WHERE t.destination_entity_type = 'staff' AND t.destination_entity_id = ${staffId}
               OR t.source_entity_type = 'staff' AND t.source_entity_id = ${staffId}
            ORDER BY t.occurred_at DESC
            LIMIT 25
          `) || []

        setTransactions(transactionRows)

        const totalPaid = transactionRows.reduce((sum, txn) => {
          const amount = Number(txn.amount || 0)
          if (txn.direction === 'expense' && txn.source_entity_type === 'staff') {
            return sum + Math.abs(amount)
          }
          return sum
        }, 0)

        const totalReceived = transactionRows.reduce((sum, txn) => {
          const amount = Number(txn.amount || 0)
          if (txn.direction === 'income' && txn.destination_entity_type === 'staff') {
            return sum + Math.abs(amount)
          }
          return sum
        }, 0)

        setSummary({
          totalPaid,
          totalReceived,
          net: totalReceived - totalPaid
        })
      } catch (err) {
        console.error('Failed to load staff detail:', err)
        setError(t('staffDetail.error.load'))
      } finally {
        setLoading(false)
      }
    }

    if (staffId) {
      fetchStaff()
    }
  }, [staffId, t])

  const displayCurrency = (value) => {
    if (value === null || value === undefined) return '—'
    return formatCurrency(value)
  }

  const displayPercent = (value) => {
    if (value === null || value === undefined) return '—'
    return `${formatNumber(Number(value), { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`
  }

  const getRoleLabel = (role) => {
    if (!role) return '—'
    return t(`staff.role.${role}`, role)
  }

  if (loading) {
    return (
      <div className="px-4 py-6 sm:p-6 lg:p-8">
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <div className="text-gray-600">{t('staffDetail.loading')}</div>
        </div>
      </div>
    )
  }

  if (error || !staff) {
    return (
      <div className="px-4 py-6 sm:p-6 lg:p-8">
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <div className="text-red-600">{error || t('staffDetail.notFound')}</div>
          {onBack && (
            <button
              onClick={onBack}
              className="mt-4 rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
            >
              {t('staffDetail.back')}
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
            {t('staffDetail.back')}
          </button>
          <h1 className="text-3xl font-bold text-gray-900">{staff.fullname}</h1>
          <p className="text-gray-500 text-sm mt-1">{getRoleLabel(staff.role)}</p>
          <p className="text-gray-500 text-sm mt-1">{t('staffDetail.description')}</p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          <div className="xl:col-span-3 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="rounded-lg border border-gray-200 bg-gradient-to-br from-green-50 to-green-100 p-4">
                <div className="text-sm font-medium text-green-700 mb-1">{t('staffDetail.summary.totalReceived')}</div>
                <div className="text-2xl font-bold text-green-900">{displayCurrency(summary.totalReceived)}</div>
              </div>
              <div className="rounded-lg border border-gray-200 bg-gradient-to-br from-purple-50 to-purple-100 p-4">
                <div className="text-sm font-medium text-purple-700 mb-1">{t('staffDetail.summary.totalPaid')}</div>
                <div className="text-2xl font-bold text-purple-900">{displayCurrency(summary.totalPaid)}</div>
              </div>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">{t('staffDetail.transactions.title')}</h2>
                <p className="text-sm text-gray-500">
                  {t('staffDetail.transactions.count', { count: transactions.length })}
                </p>
              </div>
              {transactions.length === 0 ? (
                <div className="text-gray-600">{t('staffDetail.transactions.empty')}</div>
              ) : (
                <div className="space-y-3">
                  <div className="hidden md:block overflow-x-auto border border-gray-200 rounded-xl">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            {t('staffDetail.transactions.table.date')}
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            {t('staffDetail.transactions.table.type')}
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            {t('staffDetail.transactions.table.method')}
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            {t('staffDetail.transactions.table.amount')}
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-100">
                        {transactions.map((txn) => (
                          <tr key={txn.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm text-gray-600">{formatDateTime(txn.occurred_at)}</td>
                            <td className="px-4 py-3 text-sm text-gray-600">{txn.type_label}</td>
                            <td className="px-4 py-3 text-sm text-gray-600">{txn.payment_method || '—'}</td>
                            <td
                              className={`px-4 py-3 text-sm font-semibold ${
                                txn.direction === 'income'
                                  ? 'text-emerald-600'
                                  : txn.direction === 'expense'
                                  ? 'text-rose-600'
                                  : 'text-gray-900'
                              }`}
                            >
                              {formatCurrency(txn.amount)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="xl:col-span-1">
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-5 shadow-sm sticky top-6 space-y-6">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">{t('staffDetail.info.title')}</h2>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onEdit?.(staff)}
                      disabled={!canModify(user)}
                      className="inline-flex items-center justify-center p-2 rounded-lg border border-gray-300 bg-white text-gray-700 shadow-sm hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white"
                      title={t('staffDetail.actions.edit')}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536M16.732 3.732a2.5 2.5 0 113.536 3.536L7.5 20.036H4v-3.572L16.732 3.732z" />
                      </svg>
                    </button>
                    <button
                      onClick={onDelete}
                      disabled={!canModify(user)}
                      className="inline-flex items-center justify-center p-2 rounded-lg border border-red-300 bg-white text-red-700 shadow-sm hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white"
                      title={t('staffDetail.actions.delete')}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
                <dl className="space-y-4 text-sm">
                  <div>
                    <dt className="text-xs font-medium text-gray-500 uppercase">{t('staffDetail.info.role')}</dt>
                    <dd className="mt-1 text-gray-900">{getRoleLabel(staff.role)}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-gray-500 uppercase">{t('staffDetail.info.phone')}</dt>
                    <dd className="mt-1 text-gray-900">{staff.phone || '—'}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-gray-500 uppercase">{t('staffDetail.info.email')}</dt>
                    <dd className="mt-1 text-gray-900">{staff.email || '—'}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-gray-500 uppercase">{t('staffDetail.info.hourly')}</dt>
                    <dd className="mt-1 text-gray-900">{displayCurrency(staff.hourlyrate)}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-gray-500 uppercase">
                      {t('staffDetail.info.commission')}
                    </dt>
                    <dd className="mt-1 text-gray-900">{displayPercent(staff.commission)}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-gray-500 uppercase">{t('staffDetail.info.monthly')}</dt>
                    <dd className="mt-1 text-gray-900">{displayCurrency(staff.monthlyfix)}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-gray-500 uppercase">{t('staffDetail.info.bank')}</dt>
                    <dd className="mt-1 text-gray-900">{staff.bankdetail || '—'}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-gray-500 uppercase">{t('staffDetail.info.note')}</dt>
                    <dd className="mt-1 text-gray-900 whitespace-pre-wrap">{staff.note || '—'}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-gray-500 uppercase">{t('staffDetail.info.joined')}</dt>
                    <dd className="mt-1 text-gray-900">{formatDateTime(staff.created_at)}</dd>
                  </div>
                  {staff.updated_at && (
                    <div>
                      <dt className="text-xs font-medium text-gray-500 uppercase">{t('staffDetail.info.updated')}</dt>
                      <dd className="mt-1 text-gray-900">{formatDateTime(staff.updated_at)}</dd>
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

export default StaffDetail

