import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import sql from '../../lib/neon'
import { canModify } from '../../lib/permissions'
import { useDataTable } from '../../hooks/useDataTable'
import PageHeader from '../../components/layout/PageHeader'
import SearchBar from '../../components/ui/SearchBar'
import MobileCardView from '../../components/ui/MobileCardView'

const directionStyles = {
  income: 'text-emerald-700 bg-emerald-50 border-emerald-100',
  expense: 'text-rose-700 bg-rose-50 border-rose-100',
  transfer: 'text-slate-600 bg-slate-50 border-slate-100'
}

function TransactionTypes({ onAddType = () => {}, onEditType = () => {}, refreshKey = 0, user = null }) {
  const { t } = useTranslation()
  const [types, setTypes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [deletingId, setDeletingId] = useState(null)

  const columns = useMemo(
    () => [
      { key: 'code', label: t('transactionTypes.table.code', 'Code') },
      { key: 'label', label: t('transactionTypes.table.label', 'Label') },
      { key: 'direction', label: t('transactionTypes.table.direction', 'Direction') },
      { key: 'description', label: t('transactionTypes.table.description', 'Description') }
    ],
    [t]
  )

  const {
    data: tableData,
    setData: setTableData,
    searchTerm,
    sortConfig,
    filteredData,
    handleSort,
    handleSearchChange
  } = useDataTable(types, {
    defaultSortKey: 'code'
  })

  useEffect(() => {
    const fetchTypes = async () => {
      try {
        setLoading(true)
        setError(null)
        const result = await sql`
          SELECT id, code, label, direction, description, created_at, updated_at
          FROM transaction_types
          ORDER BY code ASC
        `
        setTypes(result || [])
        setTableData(result || [])
      } catch (err) {
        console.error('Failed to load transaction types:', err)
        setError(t('transactionTypes.error.load', 'Failed to load transaction types'))
      } finally {
        setLoading(false)
      }
    }

    fetchTypes()
  }, [refreshKey, t, setTableData])

  const handleDelete = async (typeId, code) => {
    // Check if it's a protected type
    if (code === 'CUSTOMER_PAYMENT' || code === 'CUSTOMER_REFUND') {
      alert(t('transactionTypes.error.cannotDeleteProtected', 'Cannot delete protected transaction type. This type is required by the system.'))
      return
    }

    if (!window.confirm(t('transactionTypes.confirm.delete', 'Are you sure you want to delete this transaction type?'))) return
    
    try {
      setDeletingId(typeId)
      await sql`DELETE FROM transaction_types WHERE id = ${typeId}`
      setTypes((prev) => prev.filter((t) => t.id !== typeId))
      setTableData((prev) => prev.filter((t) => t.id !== typeId))
    } catch (err) {
      console.error('Failed to delete transaction type:', err)
      if (err.message?.includes('protected')) {
        alert(t('transactionTypes.error.cannotDeleteProtected', 'Cannot delete protected transaction type. This type is required by the system.'))
      } else {
        alert(t('transactionTypes.error.delete', 'Failed to delete transaction type. It may be in use by existing transactions.'))
      }
    } finally {
      setDeletingId(null)
    }
  }

  const getDirectionLabel = (direction) => {
    if (!direction) return '—'
    return t(`transactionTypes.direction.${direction}`, 
      direction === 'income' ? 'Income' : 
      direction === 'expense' ? 'Expense' : 
      'Transfer')
  }

  const renderCell = (key, row) => {
    switch (key) {
      case 'direction':
        return (
          <span
            className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-semibold ${
              directionStyles[row.direction] || directionStyles.transfer
            }`}
          >
            {getDirectionLabel(row.direction)}
          </span>
        )
      case 'description':
        return row.description || '—'
      default:
        return row[key] ?? '—'
    }
  }

  const renderActions = (typeRow) => {
    if (!canModify(user)) return null
    const isProtected = typeRow.code === 'CUSTOMER_PAYMENT' || typeRow.code === 'CUSTOMER_REFUND'
    return (
      <div className="flex gap-2">
        <button
          onClick={(e) => {
            e.stopPropagation()
            onEditType(typeRow)
          }}
          className="rounded-lg border border-gray-300 px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          {t('transactionTypes.actions.edit', 'Edit')}
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation()
            handleDelete(typeRow.id, typeRow.code)
          }}
          disabled={deletingId === typeRow.id || isProtected}
          className="rounded-lg border border-red-300 px-3 py-1 text-xs font-medium text-red-700 hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          title={isProtected ? t('transactionTypes.tooltip.protected', 'This type is protected and cannot be deleted') : ''}
        >
          {deletingId === typeRow.id ? t('transactionTypes.actions.deleting', 'Deleting...') : t('transactionTypes.actions.delete', 'Delete')}
        </button>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl p-6 shadow-sm">
      <PageHeader
        title={t('transactionTypes.title', 'Transaction Types')}
        description={t('transactionTypes.description', 'Manage transaction types for categorizing financial transactions')}
        onAdd={onAddType}
        addLabel={t('transactionTypes.add', 'Add Transaction Type')}
        user={user}
        canModifyFn={canModify}
      />

      <div className="flex flex-col gap-4 mt-6">
        <SearchBar
          value={searchTerm}
          onChange={handleSearchChange}
          placeholder={t('transactionTypes.search', 'Search transaction types...')}
        />

        {loading && <div className="text-gray-600 text-sm">{t('transactionTypes.loading', 'Loading transaction types...')}</div>}
        {error && <div className="text-red-600 text-sm">{error}</div>}
        {!loading && !error && (
          <>
            <div className="hidden md:block">
              <div className="overflow-x-auto border border-gray-200 rounded-xl">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      {columns.map((column) => {
                        const isActive = sortConfig.key === column.key
                        return (
                          <th
                            key={column.key}
                            onClick={() => handleSort(column.key)}
                            className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer select-none hover:text-gray-900"
                          >
                            <div className="flex items-center gap-1">
                              {column.label}
                              {isActive && (
                                <span className="text-gray-400">
                                  {sortConfig.direction === 'asc' ? '▲' : '▼'}
                                </span>
                              )}
                            </div>
                          </th>
                        )
                      })}
                      {canModify(user) && (
                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                          {t('transactionTypes.table.actions', 'Actions')}
                        </th>
                      )}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {filteredData.length === 0 ? (
                      <tr>
                        <td
                          colSpan={canModify(user) ? columns.length + 1 : columns.length}
                          className="px-6 py-10 text-center text-sm text-gray-500"
                        >
                          {t('transactionTypes.table.empty', 'No transaction types found')}
                        </td>
                      </tr>
                    ) : (
                      filteredData.map((typeRow) => (
                        <tr
                          key={typeRow.id}
                          className="hover:bg-gray-50"
                        >
                          {columns.map((column) => (
                            <td key={column.key} className="px-4 py-3 text-sm text-gray-900">
                              {renderCell(column.key, typeRow)}
                            </td>
                          ))}
                          {canModify(user) && (
                            <td className="px-4 py-3 whitespace-nowrap text-sm">
                              {renderActions(typeRow)}
                            </td>
                          )}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <MobileCardView
              data={filteredData}
              emptyMessage={t('transactionTypes.table.empty', 'No transaction types found')}
              renderCard={(typeRow) => {
                const isProtected = typeRow.code === 'CUSTOMER_PAYMENT' || typeRow.code === 'CUSTOMER_REFUND'
                return (
                  <>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-base font-semibold text-gray-900">{typeRow.label || '—'}</p>
                        <p className="text-sm text-gray-500 font-mono">{typeRow.code || '—'}</p>
                        <div className="mt-1">
                          <span
                            className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-semibold ${
                              directionStyles[typeRow.direction] || directionStyles.transfer
                            }`}
                          >
                            {getDirectionLabel(typeRow.direction)}
                          </span>
                        </div>
                      </div>
                      {canModify(user) && (
                        <div className="flex gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              onEditType(typeRow)
                            }}
                            className="rounded-lg border border-gray-300 px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                          >
                            {t('transactionTypes.actions.edit', 'Edit')}
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              handleDelete(typeRow.id, typeRow.code)
                            }}
                            disabled={deletingId === typeRow.id || isProtected}
                            className="rounded-lg border border-red-300 px-3 py-1 text-xs font-medium text-red-700 hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            title={isProtected ? t('transactionTypes.tooltip.protected', 'This type is protected and cannot be deleted') : ''}
                          >
                            {deletingId === typeRow.id ? t('transactionTypes.actions.deleting', 'Deleting...') : t('transactionTypes.actions.delete', 'Delete')}
                          </button>
                        </div>
                      )}
                    </div>
                    {typeRow.description && (
                      <dl className="mt-4 text-sm text-gray-600">
                        <dt className="text-gray-400 text-xs uppercase">{t('transactionTypes.mobile.description', 'Description')}</dt>
                        <dd>{typeRow.description}</dd>
                      </dl>
                    )}
                  </>
                )
              }}
            />
          </>
        )}
      </div>
    </div>
  )
}

export default TransactionTypes

