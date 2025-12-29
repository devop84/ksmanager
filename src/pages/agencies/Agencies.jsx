import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import sql from '../../lib/neon'
import { canModify } from '../../lib/permissions'
import { useSettings } from '../../context/SettingsContext'
import { useDataTable } from '../../hooks/useDataTable'
import DataTable from '../../components/ui/DataTable'
import PageHeader from '../../components/layout/PageHeader'
import SearchBar from '../../components/ui/SearchBar'
import MobileCardView from '../../components/ui/MobileCardView'
import AgenciesOverview from '../../components/ui/AgenciesOverview'

function Agencies({ onAddAgency = () => {}, onEditAgency = () => {}, onViewAgency = () => {}, refreshKey = 0, user = null }) {
  const { t } = useTranslation()
  const { formatNumber } = useSettings()
  const [agencies, setAgencies] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [deletingId, setDeletingId] = useState(null)

  const columns = useMemo(
    () => [
      { key: 'name', label: t('agencies.table.name') },
      { key: 'phone', label: t('agencies.table.phone') },
      { key: 'email', label: t('agencies.table.email') },
      { key: 'commission', label: t('agencies.table.commission') }
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
  } = useDataTable(agencies, {
    defaultSortKey: 'name'
  })

  useEffect(() => {
    const fetchAgencies = async () => {
      try {
        setLoading(true)
        setError(null)
        const result = await sql`
          SELECT id, name, phone, email, commission, note
          FROM agencies
          ORDER BY name ASC
        `
        setAgencies(result || [])
        setTableData(result || [])
      } catch (err) {
        console.error('Failed to load agencies:', err)
        setError(t('agencies.error.load'))
      } finally {
        setLoading(false)
      }
    }

    fetchAgencies()
  }, [refreshKey, t, setTableData])

  const formatCommission = (value) => {
    if (value === null || value === undefined) return '—'
    const formatted = formatNumber(Number(value), { minimumFractionDigits: 1, maximumFractionDigits: 1 })
    return t('agencies.commission.value', { value: formatted })
  }

  const handleDelete = async (agency) => {
    if (!window.confirm(t('agencies.confirm.delete'))) return
    try {
      setDeletingId(agency.id)
      await sql`DELETE FROM agencies WHERE id = ${agency.id}`
      setAgencies(prev => prev.filter(a => a.id !== agency.id))
      setTableData(prev => prev.filter(a => a.id !== agency.id))
    } catch (err) {
      console.error('Failed to delete agency:', err)
      alert(t('agencies.error.delete'))
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="px-4 py-6 sm:p-6 lg:p-8">
      <div className="flex flex-col gap-6 bg-white rounded-xl shadow-sm p-4 sm:p-6">
        <PageHeader
          title={t('agencies.title')}
          description={t('agencies.description')}
          onAdd={onAddAgency}
          addLabel={t('agencies.add')}
          user={user}
          canModifyFn={canModify}
        />

        <AgenciesOverview agencies={agencies} />

        <div className="flex flex-col gap-4">
          <SearchBar
            value={searchTerm}
            onChange={handleSearchChange}
            placeholder={t('agencies.search')}
          />

          {loading && <div className="text-gray-600 text-sm">{t('agencies.loading')}</div>}
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
                  onRowClick={onViewAgency}
                  renderCell={(key, row) => {
                    if (key === 'commission') return formatCommission(row.commission)
                    return row[key] ?? '—'
                  }}
                  emptyMessage={t('agencies.table.empty')}
                />
              </div>

              {/* Mobile Card View */}
              <MobileCardView
                data={filteredData}
                emptyMessage={t('agencies.table.empty')}
                onItemClick={onViewAgency}
                renderCard={(agency) => (
                  <>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-base font-semibold text-gray-900">{agency.name || '—'}</p>
                        <p className="text-sm text-gray-500">{agency.email || agency.phone || '—'}</p>
                      </div>
                      <span className="inline-flex items-center rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-medium text-indigo-800">
                        {formatCommission(agency.commission)}
                      </span>
                    </div>
                    <dl className="mt-4 grid grid-cols-2 gap-3 text-sm text-gray-600">
                      <div>
                        <dt className="text-gray-400 text-xs uppercase">{t('agencies.mobile.phone')}</dt>
                        <dd>{agency.phone || '—'}</dd>
                      </div>
                      <div>
                        <dt className="text-gray-400 text-xs uppercase">{t('agencies.mobile.commission')}</dt>
                        <dd>{formatCommission(agency.commission)}</dd>
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

export default Agencies
