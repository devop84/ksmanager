import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import sql from '../../lib/neon'
import { canModify } from '../../lib/permissions'
import { useDataTable } from '../../hooks/useDataTable'
import DataTable from '../../components/ui/DataTable'
import PageHeader from '../../components/layout/PageHeader'
import SearchBar from '../../components/ui/SearchBar'
import MobileCardView from '../../components/ui/MobileCardView'

function ThirdParties({ refreshKey = 0, onAddThirdParty = () => {}, onEditThirdParty = () => {}, onViewThirdParty = () => {}, user = null }) {
  const { t } = useTranslation()
  const [thirdParties, setThirdParties] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const columns = useMemo(
    () => [
      { key: 'name', label: t('thirdParties.table.name') },
      { key: 'category_name', label: t('thirdParties.table.category') },
      { key: 'phone', label: t('thirdParties.table.phone') },
      { key: 'email', label: t('thirdParties.table.email') },
      { key: 'note', label: t('thirdParties.table.note') }
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
  } = useDataTable(thirdParties, {
    defaultSortKey: 'name'
  })

  useEffect(() => {
    const fetchThirdParties = async () => {
      try {
        setLoading(true)
        setError(null)
        const result = await sql`
          SELECT tp.id,
                 tp.name,
                 tp.phone,
                 tp.email,
                 tp.note,
                 tp.category_id,
                 c.name AS category_name
          FROM third_parties tp
          LEFT JOIN third_parties_categories c ON c.id = tp.category_id
          ORDER BY tp.name ASC
        `
        setThirdParties(result || [])
        setTableData(result || [])
      } catch (err) {
        console.error('Failed to load third parties:', err)
        setError(t('thirdParties.error.load'))
      } finally {
        setLoading(false)
      }
    }

    fetchThirdParties()
  }, [refreshKey, t, setTableData])

  return (
    <div className="px-4 py-6 sm:p-6 lg:p-8">
      <div className="flex flex-col gap-6 bg-white rounded-xl shadow-sm p-4 sm:p-6">
        <PageHeader
          title={t('thirdParties.title')}
          description={t('thirdParties.description')}
          onAdd={onAddThirdParty}
          addLabel={t('thirdParties.add')}
          user={user}
          canModifyFn={canModify}
        />

        <div className="flex flex-col gap-4">
          <SearchBar
            value={searchTerm}
            onChange={handleSearchChange}
            placeholder={t('thirdParties.search')}
          />

          {loading && <div className="text-gray-600 text-sm">{t('thirdParties.loading')}</div>}
          {error && <div className="text-red-600 text-sm">{error}</div>}
          {!loading && !error && (
            <>
              <div className="hidden md:block">
                <DataTable
                  columns={columns}
                  data={filteredData}
                  sortConfig={sortConfig}
                  onSort={handleSort}
                  onRowClick={onViewThirdParty}
                  emptyMessage={t('thirdParties.table.empty')}
                />
              </div>

              <MobileCardView
                data={filteredData}
                emptyMessage={t('thirdParties.table.empty')}
                onItemClick={onViewThirdParty}
                renderCard={(tp) => (
                  <>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-base font-semibold text-gray-900">{tp.name || '—'}</p>
                        <p className="text-sm text-gray-500">{tp.category_name || '—'}</p>
                      </div>
                    </div>
                    <dl className="mt-4 grid grid-cols-2 gap-3 text-sm text-gray-600">
                      <div>
                        <dt className="text-gray-400 text-xs uppercase">{t('thirdParties.mobile.phone')}</dt>
                        <dd>{tp.phone || '—'}</dd>
                      </div>
                      <div>
                        <dt className="text-gray-400 text-xs uppercase">{t('thirdParties.mobile.email')}</dt>
                        <dd>{tp.email || '—'}</dd>
                      </div>
                      <div className="md:col-span-2">
                        <dt className="text-gray-400 text-xs uppercase">{t('thirdParties.mobile.note')}</dt>
                        <dd>{tp.note || '—'}</dd>
                      </div>
                    </dl>
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

export default ThirdParties

