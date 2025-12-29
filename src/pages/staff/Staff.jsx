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

function Staff({ onAddStaff = () => {}, onEditStaff = () => {}, onViewStaff = () => {}, refreshKey = 0, user = null }) {
  const { t } = useTranslation()
  const { formatCurrency, formatNumber } = useSettings()
  const [staff, setStaff] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [deletingId, setDeletingId] = useState(null)

  const columns = useMemo(
    () => [
      { key: 'fullname', label: t('staff.table.fullname') },
      { key: 'role', label: t('staff.table.role') },
      { key: 'phone', label: t('staff.table.phone') },
      { key: 'email', label: t('staff.table.email') },
      { key: 'hourlyrate', label: t('staff.table.hourly') },
      { key: 'commission', label: t('staff.table.commission') },
      { key: 'monthlyfix', label: t('staff.table.monthly') }
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
  } = useDataTable(staff, {
    defaultSortKey: 'fullname'
  })

  useEffect(() => {
    const fetchStaff = async () => {
      try {
        setLoading(true)
        setError(null)
        const result = await sql`
          SELECT id, fullname, role, phone, email, bankdetail, hourlyrate, commission, monthlyfix, note
          FROM staff
          ORDER BY fullname ASC
        `
        setStaff(result || [])
        setTableData(result || [])
      } catch (err) {
        console.error('Failed to load staff:', err)
        setError(t('staff.error.load'))
      } finally {
        setLoading(false)
      }
    }

    fetchStaff()
  }, [refreshKey, t, setTableData])

  const handleDelete = async (staffId) => {
    if (!window.confirm(t('staff.confirm.delete'))) return
    try {
      setDeletingId(staffId)
      await sql`DELETE FROM staff WHERE id = ${staffId}`
      setStaff((prev) => prev.filter((member) => member.id !== staffId))
      setTableData((prev) => prev.filter((member) => member.id !== staffId))
    } catch (err) {
      console.error('Failed to delete staff:', err)
      alert(t('staff.error.delete'))
    } finally {
      setDeletingId(null)
    }
  }

  const displayCurrency = (value) => {
    if (value === null || value === undefined || value === '') return '—'
    return formatCurrency(value)
  }

  const formatPercent = (value) => {
    if (value === null || value === undefined || value === '') return '—'
    return `${formatNumber(Number(value), { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`
  }

  const getRoleLabel = (role) => {
    if (!role) return '—'
    return t(`staff.role.${role}`, role)
  }

  const renderCell = (key, row) => {
    switch (key) {
      case 'role':
        return getRoleLabel(row.role)
      case 'hourlyrate':
        return displayCurrency(row.hourlyrate)
      case 'commission':
        return formatPercent(row.commission)
      case 'monthlyfix':
        return displayCurrency(row.monthlyfix)
      default:
        return row[key] ?? '—'
    }
  }

  return (
    <div className="px-4 py-6 sm:p-6 lg:p-8">
      <div className="flex flex-col gap-6 bg-white rounded-xl shadow-sm p-4 sm:p-6">
        <PageHeader
          title={t('staff.title')}
          description={t('staff.description')}
          onAdd={onAddStaff}
          addLabel={t('staff.add')}
          user={user}
          canModifyFn={canModify}
        />

        <div className="flex flex-col gap-4">
          <SearchBar
            value={searchTerm}
            onChange={handleSearchChange}
            placeholder={t('staff.search')}
          />

          {loading && <div className="text-gray-600 text-sm">{t('staff.loading')}</div>}
          {error && <div className="text-red-600 text-sm">{error}</div>}
          {!loading && !error && (
            <>
              <div className="hidden md:block">
                <DataTable
                  columns={columns}
                  data={filteredData}
                  sortConfig={sortConfig}
                  onSort={handleSort}
                  onRowClick={onViewStaff}
                  renderCell={renderCell}
                  emptyMessage={t('staff.table.empty')}
                />
              </div>

              <MobileCardView
                data={filteredData}
                emptyMessage={t('staff.table.empty')}
                onItemClick={onViewStaff}
                renderCard={(member) => (
                  <>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-base font-semibold text-gray-900">{member.fullname || '—'}</p>
                        <p className="text-sm text-gray-500">{getRoleLabel(member.role)}</p>
                        <p className="text-sm text-gray-500">{member.email || member.phone || '—'}</p>
                      </div>
                      <span className="inline-flex items-center rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-medium text-indigo-800">
                        {displayCurrency(member.hourlyrate)}
                      </span>
                    </div>
                    <dl className="mt-4 grid grid-cols-2 gap-3 text-sm text-gray-600">
                      <div>
                        <dt className="text-gray-400 text-xs uppercase">{t('staff.mobile.phone')}</dt>
                        <dd>{member.phone || '—'}</dd>
                      </div>
                      <div>
                        <dt className="text-gray-400 text-xs uppercase">{t('staff.mobile.hourly')}</dt>
                        <dd>{displayCurrency(member.hourlyrate)}</dd>
                      </div>
                      <div>
                        <dt className="text-gray-400 text-xs uppercase">{t('staff.mobile.commission')}</dt>
                        <dd>{formatPercent(member.commission)}</dd>
                      </div>
                      <div>
                        <dt className="text-gray-400 text-xs uppercase">{t('staff.mobile.monthly')}</dt>
                        <dd>{displayCurrency(member.monthlyfix)}</dd>
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

export default Staff

