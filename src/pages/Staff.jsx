import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import sql from '../lib/neon'
import { canModify } from '../lib/permissions'
import { useSettings } from '../context/SettingsContext'
import Pagination from '../components/Pagination'

const PAGE_SIZE = 25

function Staff({ onAddStaff = () => {}, onEditStaff = () => {}, onViewStaff = () => {}, refreshKey = 0, user = null }) {
  const { t } = useTranslation()
  const { formatCurrency, formatNumber } = useSettings()
  const [staff, setStaff] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortConfig, setSortConfig] = useState({ key: 'fullname', direction: 'asc' })
  const [currentPage, setCurrentPage] = useState(1)
  const [deletingId, setDeletingId] = useState(null)

  const columns = useMemo(
    () => [
      { key: 'fullname', label: t('staff.table.fullname') },
      { key: 'role', label: t('staff.table.role') },
      { key: 'phone', label: t('staff.table.phone') },
      { key: 'email', label: t('staff.table.email') },
      { key: 'bankdetail', label: t('staff.table.bankdetail') },
      { key: 'hourlyrate', label: t('staff.table.hourly') },
      { key: 'commission', label: t('staff.table.commission') },
      { key: 'monthlyfix', label: t('staff.table.monthly') },
      { key: 'note', label: t('staff.table.note') }
    ],
    [t]
  )

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
      } catch (err) {
        console.error('Failed to load staff:', err)
        setError(t('staff.error.load'))
      } finally {
        setLoading(false)
      }
    }

    fetchStaff()
  }, [refreshKey, t])

  const filteredStaff = useMemo(() => {
    if (!searchTerm.trim()) return staff
    const query = searchTerm.toLowerCase()
    return staff.filter((member) =>
      [
        member.fullname,
        member.role,
        member.phone,
        member.email,
        member.bankdetail,
        member.hourlyrate,
        member.commission,
        member.monthlyfix,
        member.note
      ]
        .filter((value) => value !== null && value !== undefined)
        .some((value) => value.toString().toLowerCase().includes(query))
    )
  }, [staff, searchTerm])

  const sortedStaff = useMemo(() => {
    const sorted = [...filteredStaff]
    sorted.sort((a, b) => {
      const aValue = a[sortConfig.key] ?? ''
      const bValue = b[sortConfig.key] ?? ''

      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1
      return 0
    })
    return sorted
  }, [filteredStaff, sortConfig])

  const totalPages = Math.max(1, Math.ceil(sortedStaff.length / PAGE_SIZE))
  const paginatedStaff = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE
    return sortedStaff.slice(start, start + PAGE_SIZE)
  }, [sortedStaff, currentPage])

  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm])

  const handleSort = (key) => {
    setSortConfig((prev) => {
      if (prev.key === key) {
        return { key, direction: prev.direction === 'asc' ? 'desc' : 'asc' }
      }
      return { key, direction: 'asc' }
    })
  }

  const handleSearchChange = (event) => {
    setSearchTerm(event.target.value)
  }

  const handlePageChange = (newPage) => {
    setCurrentPage(newPage)
  }

  const handleDelete = async (staffId) => {
    if (!window.confirm(t('staff.confirm.delete'))) return
    try {
      setDeletingId(staffId)
      await sql`DELETE FROM staff WHERE id = ${staffId}`
      setStaff((prev) => prev.filter((member) => member.id !== staffId))
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

  return (
    <div className="px-4 py-6 sm:p-6 lg:p-8">
      <div className="flex flex-col gap-6 bg-white rounded-xl shadow-sm p-4 sm:p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{t('staff.title')}</h1>
            <p className="text-gray-500 text-sm">{t('staff.description')}</p>
          </div>
          <button
            onClick={onAddStaff}
            disabled={!canModify(user)}
            className="inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-indigo-600 text-white hover:bg-indigo-500 disabled:bg-gray-400 disabled:hover:bg-gray-400"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            {t('staff.add')}
          </button>
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <input
              type="text"
              value={searchTerm}
              onChange={handleSearchChange}
              placeholder={t('staff.search')}
              className="w-full md:w-1/2 rounded-lg border border-gray-300 px-4 py-2 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-shadow"
            />
          </div>

          {loading && <div className="text-gray-600 text-sm">{t('staff.loading')}</div>}
          {error && <div className="text-red-600 text-sm">{error}</div>}
          {!loading && !error && (
            <div className="flex flex-col gap-4">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={sortedStaff.length}
                pageSize={PAGE_SIZE}
                onPageChange={handlePageChange}
                summaryKey="staff.pagination.summary"
              />
              <div className="hidden md:block overflow-x-auto border border-gray-200 rounded-xl">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      {columns.map((column) => {
                        const isActive = sortConfig.key === column.key
                        const direction = isActive ? sortConfig.direction : null
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
                                  {direction === 'asc' ? '▲' : '▼'}
                                </span>
                              )}
                            </div>
                          </th>
                        )
                      })}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {paginatedStaff.length === 0 ? (
                      <tr>
                        <td colSpan={columns.length} className="px-6 py-10 text-center text-sm text-gray-500">
                          {t('staff.table.empty')}
                        </td>
                      </tr>
                    ) : (
                      paginatedStaff.map((member) => (
                        <tr
                          key={member.id}
                          className="hover:bg-gray-50 cursor-pointer"
                          onClick={() => onViewStaff(member)}
                        >
                          <td className="px-4 py-3 text-sm text-gray-900 font-medium">{member.fullname || '—'}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{getRoleLabel(member.role)}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{member.phone || '—'}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{member.email || '—'}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{member.bankdetail || '—'}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{displayCurrency(member.hourlyrate)}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{formatPercent(member.commission)}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{displayCurrency(member.monthlyfix)}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{member.note || '—'}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <div className="md:hidden space-y-3">
                {paginatedStaff.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-gray-300 px-4 py-6 text-center text-sm text-gray-500">
                    {t('staff.table.empty')}
                  </div>
                ) : (
                  paginatedStaff.map((member) => (
                    <div
                      key={member.id}
                      className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => onViewStaff(member)}
                    >
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
                          <dt className="text-gray-400 text-xs uppercase">{t('staff.mobile.bankdetail')}</dt>
                          <dd>{member.bankdetail || '—'}</dd>
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
                        <div className="md:col-span-2">
                          <dt className="text-gray-400 text-xs uppercase">{t('staff.mobile.note')}</dt>
                          <dd>{member.note || '—'}</dd>
                        </div>
                      </dl>
                    </div>
                  ))
                )}
              </div>

              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={sortedStaff.length}
                pageSize={PAGE_SIZE}
                onPageChange={handlePageChange}
                summaryKey="staff.pagination.summary"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Staff

