import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import sql from '../lib/neon'
import { useSettings } from '../context/SettingsContext'

const MAX_ROWS = 5

function RecentTransactions({ onViewCustomer = () => {} }) {
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const { formatCurrency, formatDateTime } = useSettings()
  const { t } = useTranslation()

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        setLoading(true)
        setError(null)
        const rows =
          (await sql`
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
              CASE WHEN t.source_entity_type = 'customer' THEN t.source_entity_id END AS source_customer_id,
              CASE WHEN t.destination_entity_type = 'customer' THEN t.destination_entity_id END AS destination_customer_id,
              CASE
                WHEN t.source_entity_type = 'customer' THEN (SELECT fullname FROM customers WHERE id = t.source_entity_id)
                WHEN t.source_entity_type = 'agency' THEN (SELECT name FROM agencies WHERE id = t.source_entity_id)
                WHEN t.source_entity_type = 'instructor' THEN (SELECT fullname FROM instructors WHERE id = t.source_entity_id)
                WHEN t.source_entity_type = 'third_party' THEN (SELECT name FROM third_parties WHERE id = t.source_entity_id)
                WHEN t.source_entity_type = 'company_account' THEN (SELECT name FROM company_accounts WHERE id = t.source_entity_id)
                ELSE t.source_entity_type || ' #' || t.source_entity_id
              END AS source_name,
              CASE
                WHEN t.destination_entity_type = 'customer' THEN (SELECT fullname FROM customers WHERE id = t.destination_entity_id)
                WHEN t.destination_entity_type = 'agency' THEN (SELECT name FROM agencies WHERE id = t.destination_entity_id)
                WHEN t.destination_entity_type = 'instructor' THEN (SELECT fullname FROM instructors WHERE id = t.destination_entity_id)
                WHEN t.destination_entity_type = 'third_party' THEN (SELECT name FROM third_parties WHERE id = t.destination_entity_id)
                WHEN t.destination_entity_type = 'company_account' THEN (SELECT name FROM company_accounts WHERE id = t.destination_entity_id)
                ELSE t.destination_entity_type || ' #' || t.destination_entity_id
              END AS destination_name
            FROM transactions t
            JOIN transaction_types tt ON tt.id = t.type_id
            LEFT JOIN payment_methods pm ON pm.id = t.payment_method_id
            ORDER BY t.occurred_at DESC
            LIMIT ${MAX_ROWS}
          `) || []

        setTransactions(rows)
      } catch (err) {
        console.error('Failed to load recent transactions:', err)
        setError(t('dashboard.recentTransactions.error.load'))
      } finally {
        setLoading(false)
      }
    }

    fetchTransactions()
  }, [])

  const formatAmount = (amount, direction) => {
    const formatted = formatCurrency(Math.abs(Number(amount || 0)), {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
      signDisplay: 'never',
    })
    if (direction === 'income') return `+${formatted}`
    if (direction === 'expense') return `-${formatted}`
    return formatted
  }

  return (
    <div className="rounded-xl bg-white p-2 sm:p-4 md:p-6 shadow-sm w-full">
      <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-4">{t('dashboard.recentTransactions.title')}</h2>

      {loading && <div className="text-sm text-gray-600">{t('common.loading')}</div>}
      {error && <div className="text-sm text-red-600">{error}</div>}

      {!loading && !error && transactions.length === 0 && <div className="text-gray-600">{t('common.empty')}</div>}

      {!loading && !error && transactions.length > 0 && (
        <div className="hidden md:block overflow-x-auto border border-gray-200 rounded-xl">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">{t('dashboard.recentTransactions.table.date')}</th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">{t('dashboard.recentTransactions.table.type')}</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    {t('dashboard.recentTransactions.table.source')}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    {t('dashboard.recentTransactions.table.destination')}
                  </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  {t('dashboard.recentTransactions.table.method')}
                </th>
                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">{t('dashboard.recentTransactions.table.amount')}</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {transactions.map((txn) => (
                <tr key={txn.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 text-sm text-gray-600">
                    {formatDateTime(txn.occurred_at, {
                      month: 'short',
                      day: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit',
                    })}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{txn.type_label}</td>
                  <td
                    className={`px-4 py-3 text-sm ${
                      txn.source_customer_id ? 'text-indigo-600 cursor-pointer hover:underline' : 'text-gray-600'
                    }`}
                    onClick={() => txn.source_customer_id && onViewCustomer({ id: txn.source_customer_id })}
                  >
                    {txn.source_name || '—'}
                  </td>
                  <td
                    className={`px-4 py-3 text-sm ${
                      txn.destination_customer_id ? 'text-indigo-600 cursor-pointer hover:underline' : 'text-gray-600'
                    }`}
                    onClick={() => txn.destination_customer_id && onViewCustomer({ id: txn.destination_customer_id })}
                  >
                    {txn.destination_name || '—'}
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-600">{txn.payment_method || '—'}</td>
                  <td
                    className={`px-4 py-3 text-sm font-semibold ${
                      txn.direction === 'income' ? 'text-emerald-600' : txn.direction === 'expense' ? 'text-rose-600' : 'text-gray-900'
                    }`}
                  >
                    {formatAmount(txn.amount, txn.direction)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!loading && !error && transactions.length > 0 && (
        <div className="md:hidden space-y-3">
          {transactions.map((txn) => (
            <div
              key={txn.id}
              className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
              onClick={() => {
                if (txn.source_customer_id) {
                  onViewCustomer({ id: txn.source_customer_id })
                } else if (txn.destination_customer_id) {
                  onViewCustomer({ id: txn.destination_customer_id })
                }
              }}
            >
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex-1">
                  <p className="text-base font-semibold text-gray-900">{txn.type_label}</p>
                  <p className="text-sm text-gray-500">
                    {formatDateTime(txn.occurred_at, {
                      month: 'short',
                      day: 'numeric',
                      hour: 'numeric',
                      minute: '2-digit',
                    })}
                  </p>
                </div>
                <div
                  className={`text-sm font-semibold ${
                    txn.direction === 'income' ? 'text-emerald-600' : txn.direction === 'expense' ? 'text-rose-600' : 'text-gray-900'
                  }`}
                >
                  {formatAmount(txn.amount, txn.direction)}
                </div>
              </div>
              <p className="text-sm text-gray-600">
                {txn.source_name || '—'} → {txn.destination_name || '—'} • {txn.payment_method || '—'}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default RecentTransactions


