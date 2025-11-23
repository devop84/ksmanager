import { useEffect, useMemo, useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import sql from '../../lib/neon'
import { canModify } from '../../lib/permissions'
import { useSettings } from '../../context/SettingsContext'

const directionStyles = {
  income: 'text-emerald-700 bg-emerald-50 border-emerald-100',
  expense: 'text-rose-700 bg-rose-50 border-rose-100',
  transfer: 'text-slate-600 bg-slate-50 border-slate-100'
}

function Transactions({ refreshKey = 0, onAddTransaction = () => {}, onViewTransaction = () => {}, user = null }) {
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [directionFilter, setDirectionFilter] = useState('all')
  const [paymentFilter, setPaymentFilter] = useState('all')
  const [typeOptions, setTypeOptions] = useState([])
  const [paymentOptions, setPaymentOptions] = useState([])
  const [sortConfig, setSortConfig] = useState({ key: 'occurred_at', direction: 'desc' })
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
    const fetchTransactions = async () => {
      try {
        setLoading(true)
        setError(null)
        const [transactionsResult, typesResult, paymentsResult] = await Promise.all([
          sql`
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
              dtp.name AS destination_third_party_name
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
            ORDER BY t.occurred_at DESC
          `,
          sql`SELECT id, code, label, direction FROM transaction_types ORDER BY label`,
          sql`SELECT id, name FROM payment_methods ORDER BY name`
        ])

        setTransactions(transactionsResult || [])
        setTypeOptions(typesResult || [])
        setPaymentOptions(paymentsResult || [])
      } catch (err) {
        console.error('Failed to load transactions:', err)
        setError(t('transactions.error.load', 'Unable to load transactions. Please try again later.'))
      } finally {
        setLoading(false)
      }
    }

    fetchTransactions()
  }, [refreshKey, t])

  const formatEntityName = useCallback((transaction, role = 'source') => {
    const typeKey = role === 'source' ? transaction.source_entity_type : transaction.destination_entity_type
    const idKey = role === 'source' ? transaction.source_entity_id : transaction.destination_entity_id

    const fallback = typeKey ? `${entityTypeLabels[typeKey] || typeKey} #${idKey ?? '—'}` : '—'

    switch (typeKey) {
      case 'company_account':
        return role === 'source'
          ? transaction.source_company_account_name || fallback
          : transaction.destination_company_account_name || fallback
      case 'customer':
        return role === 'source'
          ? transaction.source_customer_name || fallback
          : transaction.destination_customer_name || fallback
      case 'agency':
        return role === 'source'
          ? transaction.source_agency_name || fallback
          : transaction.destination_agency_name || fallback
      case 'instructor':
        return role === 'source'
          ? transaction.source_instructor_name || fallback
          : transaction.destination_instructor_name || fallback
      case 'third_party':
        return role === 'source'
          ? transaction.source_third_party_name || fallback
          : transaction.destination_third_party_name || fallback
      default:
        return fallback
    }
  }, [entityTypeLabels])

  const filteredTransactions = useMemo(() => {
    return transactions.filter((transaction) => {
      if (typeFilter !== 'all' && transaction.type_code !== typeFilter) return false
      if (directionFilter !== 'all' && transaction.type_direction !== directionFilter) return false
      if (paymentFilter !== 'all' && transaction.payment_method_name !== paymentFilter) return false

      if (!searchTerm.trim()) return true
      const query = searchTerm.toLowerCase()
      return [
        transaction.reference,
        transaction.note,
        transaction.type_label,
        formatEntityName(transaction, 'source'),
        formatEntityName(transaction, 'destination'),
        transaction.payment_method_name
      ]
        .filter(Boolean)
        .some((value) => value.toString().toLowerCase().includes(query))
    })
  }, [transactions, typeFilter, directionFilter, paymentFilter, searchTerm, formatEntityName])

  const sortedTransactions = useMemo(() => {
    const sorted = [...filteredTransactions]
    
    sorted.sort((a, b) => {
      let aValue, bValue

      // Handle different column types
      switch (sortConfig.key) {
        case 'occurred_at':
          aValue = a.occurred_at ? new Date(a.occurred_at).getTime() : 0
          bValue = b.occurred_at ? new Date(b.occurred_at).getTime() : 0
          break
        case 'amount':
          aValue = Number(a.amount) || 0
          bValue = Number(b.amount) || 0
          break
        case 'type_label':
          aValue = (a.type_label || '').toLowerCase()
          bValue = (b.type_label || '').toLowerCase()
          break
        case 'source':
          aValue = formatEntityName(a, 'source').toLowerCase()
          bValue = formatEntityName(b, 'source').toLowerCase()
          break
        case 'destination':
          aValue = formatEntityName(a, 'destination').toLowerCase()
          bValue = formatEntityName(b, 'destination').toLowerCase()
          break
        case 'payment_method_name':
          aValue = (a.payment_method_name || '').toLowerCase()
          bValue = (b.payment_method_name || '').toLowerCase()
          break
        case 'reference':
          aValue = (a.reference || '').toLowerCase()
          bValue = (b.reference || '').toLowerCase()
          break
        case 'note':
          aValue = (a.note || '').toLowerCase()
          bValue = (b.note || '').toLowerCase()
          break
        default:
          aValue = ''
          bValue = ''
      }

      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1
      return 0
    })

    return sorted
  }, [filteredTransactions, sortConfig, formatEntityName])

  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }))
  }

  const totals = useMemo(() => {
    return sortedTransactions.reduce(
      (acc, txn) => {
        if (txn.type_direction === 'income') {
          acc.income += Number(txn.amount)
        } else if (txn.type_direction === 'expense') {
          acc.expense += Number(txn.amount)
        }
        return acc
      },
      { income: 0, expense: 0 }
    )
  }, [sortedTransactions])

  const formatAmount = (amount, options) =>
    formatCurrency(Number(amount || 0), { minimumFractionDigits: 2, maximumFractionDigits: 2, ...options })

  const formatDateLabel = (value) =>
    formatDateTime(value, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })

  return (
    <div className="px-4 py-6 sm:p-6 lg:p-8">
      <div className="flex flex-col gap-6 bg-white rounded-xl shadow-sm p-4 sm:p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{t('transactions.title', 'Transactions')}</h1>
            <p className="text-gray-500 text-sm">
              {t(
                'transactions.description',
                'Track all incoming and outgoing cash movement, including internal transfers.',
              )}
            </p>
          </div>
          <button
            onClick={onAddTransaction}
            disabled={!canModify(user)}
            className="inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-indigo-600 text-white hover:bg-indigo-500 disabled:bg-gray-400 disabled:hover:bg-gray-400"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            {t('transactions.add', 'Add transaction')}
          </button>
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <div className="rounded-xl border border-emerald-100 bg-emerald-50/70 p-4">
            <p className="text-sm font-medium text-emerald-700">
              {t('transactions.summary.income', 'Total Income')}
            </p>
            <p className="mt-2 text-2xl font-semibold text-emerald-800">
              {formatAmount(Math.max(totals.income, 0), { signDisplay: 'never' })}
            </p>
          </div>
          <div className="rounded-xl border border-rose-100 bg-rose-50/70 p-4">
            <p className="text-sm font-medium text-rose-700">
              {t('transactions.summary.expense', 'Total Expense')}
            </p>
            <p className="mt-2 text-2xl font-semibold text-rose-800">
              {formatAmount(Math.abs(Math.min(totals.expense, 0)), { signDisplay: 'never' })}
            </p>
          </div>
          <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
            <p className="text-sm font-medium text-slate-700">{t('transactions.summary.net', 'Net Result')}</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">
              {formatAmount(totals.income + totals.expense)}
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
            <input
              type="text"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder={t('transactions.search', 'Search reference, note, or counterparty...')}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
            />
            <select
              value={typeFilter}
              onChange={(event) => setTypeFilter(event.target.value)}
              className="rounded-lg border border-gray-300 px-4 py-2 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
            >
              <option value="all">{t('transactions.filters.type.all', 'All types')}</option>
              {typeOptions.map((type) => (
                <option key={type.id} value={type.code}>
                  {type.label}
                </option>
              ))}
            </select>
            <select
              value={directionFilter}
              onChange={(event) => setDirectionFilter(event.target.value)}
              className="rounded-lg border border-gray-300 px-4 py-2 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
            >
              <option value="all">{t('transactions.filters.direction.all', 'All directions')}</option>
              <option value="income">{t('transactions.filters.direction.income', 'Income')}</option>
              <option value="expense">{t('transactions.filters.direction.expense', 'Expense')}</option>
              <option value="transfer">{t('transactions.filters.direction.transfer', 'Transfer')}</option>
            </select>
            <select
              value={paymentFilter}
              onChange={(event) => setPaymentFilter(event.target.value)}
              className="rounded-lg border border-gray-300 px-4 py-2 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
            >
              <option value="all">{t('transactions.filters.payment.all', 'All payment methods')}</option>
              {paymentOptions.map((method) => (
                <option key={method.id} value={method.name}>
                  {method.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {loading && <div className="text-gray-600 text-sm">{t('common.loading')}</div>}
        {error && <div className="text-red-600 text-sm">{error}</div>}
        {!loading && !error && (
          <div className="flex flex-col gap-4">
            <div className="hidden md:block overflow-x-auto border border-gray-200 rounded-xl">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th
                      onClick={() => handleSort('occurred_at')}
                      className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    >
                      <div className="flex items-center gap-1">
                        {t('transactions.table.date', 'Date')}
                        {sortConfig.key === 'occurred_at' && (
                          <span className="text-gray-400">
                            {sortConfig.direction === 'asc' ? '▲' : '▼'}
                          </span>
                        )}
                      </div>
                    </th>
                    <th
                      onClick={() => handleSort('type_label')}
                      className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    >
                      <div className="flex items-center gap-1">
                        {t('transactions.table.type', 'Type')}
                        {sortConfig.key === 'type_label' && (
                          <span className="text-gray-400">
                            {sortConfig.direction === 'asc' ? '▲' : '▼'}
                          </span>
                        )}
                      </div>
                    </th>
                    <th
                      onClick={() => handleSort('source')}
                      className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    >
                      <div className="flex items-center gap-1">
                        {t('transactions.table.source', 'Source')}
                        {sortConfig.key === 'source' && (
                          <span className="text-gray-400">
                            {sortConfig.direction === 'asc' ? '▲' : '▼'}
                          </span>
                        )}
                      </div>
                    </th>
                    <th
                      onClick={() => handleSort('destination')}
                      className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    >
                      <div className="flex items-center gap-1">
                        {t('transactions.table.destination', 'Destination')}
                        {sortConfig.key === 'destination' && (
                          <span className="text-gray-400">
                            {sortConfig.direction === 'asc' ? '▲' : '▼'}
                          </span>
                        )}
                      </div>
                    </th>
                    <th
                      onClick={() => handleSort('payment_method_name')}
                      className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    >
                      <div className="flex items-center gap-1">
                        {t('transactions.table.payment', 'Payment')}
                        {sortConfig.key === 'payment_method_name' && (
                          <span className="text-gray-400">
                            {sortConfig.direction === 'asc' ? '▲' : '▼'}
                          </span>
                        )}
                      </div>
                    </th>
                    <th
                      onClick={() => handleSort('amount')}
                      className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    >
                      <div className="flex items-center justify-end gap-1">
                        {t('transactions.table.amount', 'Amount')}
                        {sortConfig.key === 'amount' && (
                          <span className="text-gray-400">
                            {sortConfig.direction === 'asc' ? '▲' : '▼'}
                          </span>
                        )}
                      </div>
                    </th>
                    <th
                      onClick={() => handleSort('reference')}
                      className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    >
                      <div className="flex items-center gap-1">
                        {t('transactions.table.reference', 'Reference')}
                        {sortConfig.key === 'reference' && (
                          <span className="text-gray-400">
                            {sortConfig.direction === 'asc' ? '▲' : '▼'}
                          </span>
                        )}
                      </div>
                    </th>
                    <th
                      onClick={() => handleSort('note')}
                      className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                    >
                      <div className="flex items-center gap-1">
                        {t('transactions.table.note', 'Note')}
                        {sortConfig.key === 'note' && (
                          <span className="text-gray-400">
                            {sortConfig.direction === 'asc' ? '▲' : '▼'}
                          </span>
                        )}
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {sortedTransactions.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-10 text-center text-sm text-gray-500">
                        {t('transactions.empty', 'No transactions found. Try adjusting your filters.')}
                      </td>
                    </tr>
                  ) : (
                    sortedTransactions.map((transaction) => (
                      <tr
                        key={transaction.id}
                        className="hover:bg-gray-50 cursor-pointer"
                        onClick={() => onViewTransaction(transaction)}
                      >
                        <td className="px-4 py-3 text-sm text-gray-600">{formatDateLabel(transaction.occurred_at)}</td>
                        <td className="px-4 py-3 text-sm">
                          <span
                            className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-semibold ${
                              directionStyles[transaction.type_direction]
                            }`}
                          >
                            {transaction.type_label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          <p className="font-medium text-gray-900">{formatEntityName(transaction, 'source')}</p>
                          <p className="text-xs text-gray-500 uppercase tracking-wide">
                            {entityTypeLabels[transaction.source_entity_type] || transaction.source_entity_type}
                          </p>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          <p className="font-medium text-gray-900">{formatEntityName(transaction, 'destination')}</p>
                          <p className="text-xs text-gray-500 uppercase tracking-wide">
                            {entityTypeLabels[transaction.destination_entity_type] || transaction.destination_entity_type}
                          </p>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">{transaction.payment_method_name || '—'}</td>
                        <td
                          className={`px-4 py-3 text-sm font-semibold text-right ${
                            transaction.type_direction === 'income'
                              ? 'text-emerald-600'
                              : transaction.type_direction === 'expense'
                              ? 'text-rose-600'
                              : 'text-slate-600'
                          }`}
                        >
                          {formatAmount(transaction.amount)}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">{transaction.reference || '—'}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">{transaction.note || '—'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="md:hidden space-y-3">
                {sortedTransactions.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-gray-300 px-4 py-6 text-center text-sm text-gray-500">
                    {t('transactions.empty', 'No transactions found. Try adjusting your filters.')}
                  </div>
                ) : (
                sortedTransactions.map((transaction) => (
                  <div
                    key={transaction.id}
                    className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => onViewTransaction(transaction)}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-base font-semibold text-gray-900">{transaction.type_label}</p>
                        <p className="text-xs text-gray-500">{formatDateLabel(transaction.occurred_at)}</p>
                      </div>
                        <div
                        className={`text-sm font-semibold ${
                          transaction.type_direction === 'income'
                            ? 'text-emerald-600'
                            : transaction.type_direction === 'expense'
                            ? 'text-rose-600'
                            : 'text-slate-600'
                        }`}
                      >
                        {formatAmount(transaction.amount)}
                      </div>
                    </div>
                    <div className="mt-4 grid gap-3 text-sm text-gray-700">
                      <div>
                        <dt className="text-gray-400 text-xs uppercase">{t('transactions.mobile.source', 'Source')}</dt>
                        <dd>{formatEntityName(transaction, 'source')}</dd>
                      </div>
                      <div>
                        <dt className="text-gray-400 text-xs uppercase">{t('transactions.mobile.destination', 'Destination')}</dt>
                        <dd>{formatEntityName(transaction, 'destination')}</dd>
                      </div>
                      <div>
                        <dt className="text-gray-400 text-xs uppercase">{t('transactions.mobile.payment', 'Payment')}</dt>
                        <dd>{transaction.payment_method_name || '—'}</dd>
                      </div>
                      <div>
                        <dt className="text-gray-400 text-xs uppercase">{t('transactions.mobile.reference', 'Reference')}</dt>
                        <dd>{transaction.reference || '—'}</dd>
                      </div>
                      <div>
                        <dt className="text-gray-400 text-xs uppercase">{t('transactions.mobile.note', 'Note')}</dt>
                        <dd>{transaction.note || '—'}</dd>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default Transactions

