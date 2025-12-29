import { useEffect, useMemo, useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import sql from '../../lib/neon'
import { canModify } from '../../lib/permissions'
import { useSettings } from '../../context/SettingsContext'
import { useDataTable } from '../../hooks/useDataTable'
import DataTable from '../../components/ui/DataTable'
import PageHeader from '../../components/layout/PageHeader'
import SearchBar from '../../components/ui/SearchBar'
import MobileCardView from '../../components/ui/MobileCardView'
import TransactionsOverview from '../../components/ui/TransactionsOverview'

const directionStyles = {
  income: 'text-emerald-700 bg-emerald-50 border-emerald-100',
  expense: 'text-rose-700 bg-rose-50 border-rose-100',
  transfer: 'text-slate-600 bg-slate-50 border-slate-100'
}

function Transactions({ refreshKey = 0, onAddTransaction = () => {}, onViewTransaction = () => {}, user = null }) {
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const { formatCurrency, formatDateTime, formatDate, formatTime } = useSettings()
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
        const transactionsResult = await sql`
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
        `

        setTransactions(transactionsResult || [])
        setTableData(transactionsResult || [])
      } catch (err) {
        console.error('Failed to load transactions:', err)
        setError(t('transactions.error.load', 'Unable to load transactions. Please try again later.'))
      } finally {
        setLoading(false)
      }
    }

    fetchTransactions()
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  const columns = useMemo(
    () => [
      { key: 'occurred_at', label: t('transactions.table.date', 'Date') },
      { key: 'type_label', label: t('transactions.table.type', 'Type') },
      { key: 'source', label: t('transactions.table.source', 'Source') },
      { key: 'destination', label: t('transactions.table.destination', 'Destination') },
      { key: 'payment_method_name', label: t('transactions.table.payment', 'Payment') },
      { key: 'amount', label: t('transactions.table.amount', 'Amount'), align: 'right' },
      { key: 'reference', label: t('transactions.table.reference', 'Reference') },
    ],
    [t],
  )

  // Custom filter function that searches across all columns
  const customFilterFn = useCallback((data, searchTerm) => {
    if (!data || !Array.isArray(data)) return []
    
    // If no search term, return all data
    if (!searchTerm || !searchTerm.trim()) return data
    
    const query = searchTerm.toLowerCase()
    
    return data.filter((transaction) => {
      if (!transaction) return false
      
      // Format date for searching
      const formattedDate = transaction.occurred_at 
        ? formatDateTime(transaction.occurred_at, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
        : null
      
      // Search across all columns
      const searchableFields = [
        transaction.reference,
        transaction.type_label,
        transaction.type_code,
        transaction.type_direction,
        transaction.payment_method_name,
        formatEntityName(transaction, 'source'),
        formatEntityName(transaction, 'destination'),
        transaction.source_entity_type,
        transaction.destination_entity_type,
        transaction.amount?.toString(),
        transaction.currency,
        formattedDate
      ]
      
      return searchableFields
        .filter(Boolean)
        .some((value) => value.toString().toLowerCase().includes(query))
    })
  }, [formatEntityName, formatDateTime])

  // Custom sort function
  const customSortFn = useCallback((sorted, sortConfig) => {
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
        default:
          aValue = ''
          bValue = ''
      }

      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1
      return 0
    })
    return sorted
  }, [formatEntityName])

  const {
    data: tableData,
    setData: setTableData,
    searchTerm,
    sortConfig,
    filteredData,
    handleSort,
    handleSearchChange
  } = useDataTable(transactions, {
    defaultSortKey: 'occurred_at',
    defaultSortDirection: 'desc',
    customFilterFn,
    customSortFn
  })

  // Calculate totals from ALL transactions, independent of filters/search
  const totals = useMemo(() => {
    return transactions.reduce(
      (acc, txn) => {
        if (txn && txn.type_direction === 'income') {
          acc.income += Number(txn.amount) || 0
        } else if (txn && txn.type_direction === 'expense') {
          acc.expense += Number(txn.amount) || 0
        }
        return acc
      },
      { income: 0, expense: 0 }
    )
  }, [transactions])

  const formatAmount = (amount, options) =>
    formatCurrency(Number(amount || 0), { minimumFractionDigits: 2, maximumFractionDigits: 2, ...options })

  const formatDateLabel = (value) =>
    formatDateTime(value, { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })

  const renderCell = (key, row) => {
    if (!row) return '—'
    
    switch (key) {
      case 'occurred_at':
        return (
          <div className="flex flex-col">
            <span className="font-medium text-gray-900">{formatDate(row.occurred_at)}</span>
            <span className="text-sm text-gray-500 font-normal">{formatTime(row.occurred_at)}</span>
          </div>
        )
      case 'type_label':
        return (
          <span
            className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-semibold ${
              directionStyles[row.type_direction]
            }`}
          >
            {row.type_label}
          </span>
        )
      case 'source':
        return (
          <>
            <p className="font-medium text-gray-900">{formatEntityName(row, 'source')}</p>
            <p className="text-xs text-gray-500 uppercase tracking-wide">
              {entityTypeLabels[row.source_entity_type] || row.source_entity_type}
            </p>
          </>
        )
      case 'destination':
        return (
          <>
            <p className="font-medium text-gray-900">{formatEntityName(row, 'destination')}</p>
            <p className="text-xs text-gray-500 uppercase tracking-wide">
              {entityTypeLabels[row.destination_entity_type] || row.destination_entity_type}
            </p>
          </>
        )
      case 'amount':
        return (
          <div className="text-right">
            <span
              className={`font-semibold ${
                row.type_direction === 'income'
                  ? 'text-emerald-600'
                  : row.type_direction === 'expense'
                  ? 'text-rose-600'
                  : 'text-slate-600'
              }`}
            >
              {formatAmount(row.amount)}
            </span>
          </div>
        )
      default:
        return row[key] ?? '—'
    }
  }

  return (
    <div className="px-4 py-6 sm:p-6 lg:p-8">
      <div className="flex flex-col gap-6 bg-white rounded-xl shadow-sm p-4 sm:p-6">
        <PageHeader
          title={t('transactions.title', 'Transactions')}
          description={t('transactions.description', 'Track all incoming and outgoing cash movement, including internal transfers.')}
          onAdd={onAddTransaction}
          addLabel={t('transactions.add', 'Add transaction')}
          user={user}
          canModifyFn={canModify}
        />

        <TransactionsOverview 
          income={totals.income} 
          expense={totals.expense}
          formatAmount={formatAmount}
        />

        <div className="flex flex-col gap-4">
          {/* Search */}
          <SearchBar
            value={searchTerm}
            onChange={handleSearchChange}
            placeholder={t('transactions.search', 'Search all columns...')}
          />

          {loading && <div className="text-gray-600 text-sm">{t('transactions.loading', 'Loading transactions...')}</div>}
          {error && <div className="text-red-600 text-sm">{error}</div>}
          
          {!loading && !error && (
            <>
              {/* Desktop Table View */}
              <div className="hidden md:block">
                <DataTable
                  columns={columns}
                  data={filteredData}
                  sortConfig={sortConfig}
                  onSort={handleSort}
                  onRowClick={onViewTransaction}
                  renderCell={renderCell}
                  emptyMessage={t('transactions.empty', 'No transactions found. Try adjusting your filters.')}
                />
              </div>

              {/* Mobile Card View */}
              <MobileCardView
                data={filteredData}
                emptyMessage={t('transactions.empty', 'No transactions found. Try adjusting your filters.')}
                onItemClick={onViewTransaction}
                renderCard={(transaction) => (
                  <>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-base font-semibold text-gray-900">{transaction.type_label}</p>
                        <div className="flex flex-col">
                          <span className="text-xs font-medium text-gray-900">{formatDate(transaction.occurred_at)}</span>
                          <span className="text-xs text-gray-500 font-normal">{formatTime(transaction.occurred_at)}</span>
                        </div>
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
                    </div>
                  </>
                )}
              />
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default Transactions

