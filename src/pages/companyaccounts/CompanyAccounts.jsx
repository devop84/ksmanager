import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import sql from '../../lib/neon'
import { canModify } from '../../lib/permissions'
import { useDataTable } from '../../hooks/useDataTable'
import DataTable from '../../components/DataTable'
import PageHeader from '../../components/PageHeader'
import SearchBar from '../../components/SearchBar'

function CompanyAccounts({ refreshKey = 0, onAddAccount = () => {}, onEditAccount = () => {}, onViewAccount = () => {}, user = null }) {
  const { t } = useTranslation()
  const [accounts, setAccounts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const columns = useMemo(
    () => [
      { key: 'name', label: t('companyAccounts.table.name') },
      { key: 'details', label: t('companyAccounts.table.details') },
      { key: 'note', label: t('companyAccounts.table.note') },
    ],
    [t],
  )

  const {
    data: tableData,
    setData: setTableData,
    searchTerm,
    sortConfig,
    filteredData,
    handleSort,
    handleSearchChange
  } = useDataTable(accounts, {
    searchFields: ['name', 'details', 'note'],
    defaultSortKey: 'name'
  })

  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        setLoading(true)
        setError(null)
        const result = await sql`
          SELECT id, name, details, note
          FROM company_accounts
          ORDER BY name ASC
        `
        setAccounts(result || [])
        setTableData(result || [])
      } catch (err) {
        console.error('Failed to load company accounts:', err)
        setError(t('companyAccounts.error.load'))
      } finally {
        setLoading(false)
      }
    }

    fetchAccounts()
  }, [refreshKey, t, setTableData])

  return (
    <div className="px-4 py-6 sm:p-6 lg:p-8">
      <div className="flex flex-col gap-6 bg-white rounded-xl shadow-sm p-4 sm:p-6">
        <PageHeader
          title={t('companyAccounts.title')}
          description={t('companyAccounts.description')}
          onAdd={onAddAccount}
          addLabel={t('companyAccounts.add')}
          user={user}
          canModifyFn={canModify}
        />

        <div className="flex flex-col gap-4">
          <SearchBar
            value={searchTerm}
            onChange={handleSearchChange}
            placeholder={t('companyAccounts.search')}
          />

          {loading && <div className="text-gray-600 text-sm">{t('companyAccounts.loading')}</div>}
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
                  onRowClick={onViewAccount}
                  emptyMessage={t('companyAccounts.table.empty')}
                />
              </div>

              {/* Mobile Card View */}
              <div className="md:hidden space-y-3">
                {filteredData.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-gray-300 px-4 py-6 text-center text-sm text-gray-500">
                    {t('companyAccounts.table.empty')}
                  </div>
                ) : (
                  filteredData.map((account) => (
                    <div
                      key={account.id}
                      className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => onViewAccount(account)}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-base font-semibold text-gray-900">{account.name || '—'}</p>
                          <p className="text-sm text-gray-500">{account.details?.slice(0, 80) || '—'}</p>
                        </div>
                      </div>
                      <dl className="mt-4 space-y-3 text-sm text-gray-600">
                        <div>
                          <dt className="text-gray-400 text-xs uppercase">{t('companyAccounts.mobile.details')}</dt>
                          <dd>{account.details || '—'}</dd>
                        </div>
                        <div>
                          <dt className="text-gray-400 text-xs uppercase">{t('companyAccounts.mobile.note')}</dt>
                          <dd>{account.note || '—'}</dd>
                        </div>
                      </dl>
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default CompanyAccounts
