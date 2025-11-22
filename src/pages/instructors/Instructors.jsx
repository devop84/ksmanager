import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import sql from '../../lib/neon'
import { canModify } from '../../lib/permissions'
import { useSettings } from '../../context/SettingsContext'
import { useDataTable } from '../../hooks/useDataTable'
import DataTable from '../../components/DataTable'
import PageHeader from '../../components/PageHeader'
import SearchBar from '../../components/SearchBar'

function Instructors({ onAddInstructor = () => {}, onEditInstructor = () => {}, onViewInstructor = () => {}, refreshKey = 0, user = null }) {
  const { t } = useTranslation()
  const { formatCurrency, formatNumber } = useSettings()
  const [instructors, setInstructors] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [deletingId, setDeletingId] = useState(null)

  const columns = useMemo(
    () => [
      { key: 'fullname', label: t('instructors.table.fullname') },
      { key: 'phone', label: t('instructors.table.phone') },
      { key: 'email', label: t('instructors.table.email') },
      { key: 'bankdetail', label: t('instructors.table.bankdetail') },
      { key: 'hourlyrate', label: t('instructors.table.hourly') },
      { key: 'commission', label: t('instructors.table.commission') },
      { key: 'monthlyfix', label: t('instructors.table.monthly') },
      { key: 'note', label: t('instructors.table.note') }
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
  } = useDataTable(instructors, {
    searchFields: ['fullname', 'phone', 'email', 'bankdetail', 'hourlyrate', 'commission', 'monthlyfix', 'note'],
    defaultSortKey: 'fullname'
  })

  useEffect(() => {
    const fetchInstructors = async () => {
      try {
        setLoading(true)
        setError(null)
        const result = await sql`
          SELECT id, fullname, phone, email, bankdetail, hourlyrate, commission, monthlyfix, note
          FROM instructors
          ORDER BY fullname ASC
        `
        setInstructors(result || [])
        setTableData(result || [])
      } catch (err) {
        console.error('Failed to load instructors:', err)
        setError(t('instructors.error.load'))
      } finally {
        setLoading(false)
      }
    }

    fetchInstructors()
  }, [refreshKey, t, setTableData])

  const handleDelete = async (instructorId) => {
    if (!window.confirm(t('instructors.confirm.delete'))) return
    try {
      setDeletingId(instructorId)
      await sql`DELETE FROM instructors WHERE id = ${instructorId}`
      setInstructors((prev) => prev.filter((instructor) => instructor.id !== instructorId))
      setTableData((prev) => prev.filter((instructor) => instructor.id !== instructorId))
    } catch (err) {
      console.error('Failed to delete instructor:', err)
      alert(t('instructors.error.delete'))
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

  const renderCell = (key, row) => {
    switch (key) {
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
          title={t('instructors.title')}
          description={t('instructors.description')}
          onAdd={onAddInstructor}
          addLabel={t('instructors.add')}
          user={user}
          canModifyFn={canModify}
        />

        <div className="flex flex-col gap-4">
          <SearchBar
            value={searchTerm}
            onChange={handleSearchChange}
            placeholder={t('instructors.search')}
          />

          {loading && <div className="text-gray-600 text-sm">{t('instructors.loading')}</div>}
          {error && <div className="text-red-600 text-sm">{error}</div>}
          {!loading && !error && (
            <>
              <div className="hidden md:block">
                <DataTable
                  columns={columns}
                  data={filteredData}
                  sortConfig={sortConfig}
                  onSort={handleSort}
                  onRowClick={onViewInstructor}
                  renderCell={renderCell}
                  emptyMessage={t('instructors.table.empty')}
                />
              </div>

              <div className="md:hidden space-y-3">
                {filteredData.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-gray-300 px-4 py-6 text-center text-sm text-gray-500">
                    {t('instructors.table.empty')}
                  </div>
                ) : (
                  filteredData.map((instructor) => (
                    <div
                      key={instructor.id}
                      className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => onViewInstructor(instructor)}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-base font-semibold text-gray-900">{instructor.fullname || '—'}</p>
                          <p className="text-sm text-gray-500">{instructor.email || instructor.phone || '—'}</p>
                        </div>
                        <span className="inline-flex items-center rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-medium text-indigo-800">
                          {displayCurrency(instructor.hourlyrate)}
                        </span>
                      </div>
                      <dl className="mt-4 grid grid-cols-2 gap-3 text-sm text-gray-600">
                        <div>
                          <dt className="text-gray-400 text-xs uppercase">{t('instructors.mobile.phone')}</dt>
                          <dd>{instructor.phone || '—'}</dd>
                        </div>
                        <div>
                          <dt className="text-gray-400 text-xs uppercase">{t('instructors.mobile.bankdetail')}</dt>
                          <dd>{instructor.bankdetail || '—'}</dd>
                        </div>
                        <div>
                          <dt className="text-gray-400 text-xs uppercase">{t('instructors.mobile.hourly')}</dt>
                          <dd>{displayCurrency(instructor.hourlyrate)}</dd>
                        </div>
                        <div>
                          <dt className="text-gray-400 text-xs uppercase">{t('instructors.mobile.commission')}</dt>
                          <dd>{formatPercent(instructor.commission)}</dd>
                        </div>
                        <div>
                          <dt className="text-gray-400 text-xs uppercase">{t('instructors.mobile.monthly')}</dt>
                          <dd>{displayCurrency(instructor.monthlyfix)}</dd>
                        </div>
                        <div className="md:col-span-2">
                          <dt className="text-gray-400 text-xs uppercase">{t('instructors.mobile.note')}</dt>
                          <dd>{instructor.note || '—'}</dd>
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

export default Instructors

