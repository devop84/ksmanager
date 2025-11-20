import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import sql from '../lib/neon'
import { canModify } from '../lib/permissions'
import Pagination from '../components/Pagination'

const PAGE_SIZE = 25

function ThirdParties({ refreshKey = 0, onAddThirdParty = () => {}, onEditThirdParty = () => {}, onViewThirdParty = () => {}, user = null }) {
  const { t } = useTranslation()
  const [thirdParties, setThirdParties] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' })
  const [currentPage, setCurrentPage] = useState(1)

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
      } catch (err) {
        console.error('Failed to load third parties:', err)
        setError(t('thirdParties.error.load'))
      } finally {
        setLoading(false)
      }
    }

    fetchThirdParties()
  }, [refreshKey, t])

  const filteredThirdParties = useMemo(() => {
    if (!searchTerm.trim()) return thirdParties
    const query = searchTerm.toLowerCase()
    return thirdParties.filter((tp) =>
      [tp.name, tp.category_name, tp.phone, tp.email, tp.note]
        .filter((value) => value !== null && value !== undefined)
        .some((value) => value.toString().toLowerCase().includes(query))
    )
  }, [thirdParties, searchTerm])

  const sortedThirdParties = useMemo(() => {
    const sorted = [...filteredThirdParties]
    sorted.sort((a, b) => {
      const aValue = a[sortConfig.key] ?? ''
      const bValue = b[sortConfig.key] ?? ''

      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1
      return 0
    })
    return sorted
  }, [filteredThirdParties, sortConfig])

  const totalPages = Math.max(1, Math.ceil(sortedThirdParties.length / PAGE_SIZE))
  const paginatedThirdParties = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE
    return sortedThirdParties.slice(start, start + PAGE_SIZE)
  }, [sortedThirdParties, currentPage])

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

  return (
    <div className="px-4 py-6 sm:p-6 lg:p-8">
      <div className="flex flex-col gap-6 bg-white rounded-xl shadow-sm p-4 sm:p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{t('thirdParties.title')}</h1>
            <p className="text-gray-500 text-sm">{t('thirdParties.description')}</p>
          </div>
          <button
            onClick={onAddThirdParty}
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
            {t('thirdParties.add')}
          </button>
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <input
              type="text"
              value={searchTerm}
              onChange={handleSearchChange}
              placeholder={t('thirdParties.search')}
              className="w-full md:w-1/2 rounded-lg border border-gray-300 px-4 py-2 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-shadow"
            />
          </div>

          {loading && <div className="text-gray-600 text-sm">{t('thirdParties.loading')}</div>}
          {error && <div className="text-red-600 text-sm">{error}</div>}
          {!loading && !error && (
            <div className="flex flex-col gap-4">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={sortedThirdParties.length}
                pageSize={PAGE_SIZE}
                onPageChange={handlePageChange}
                summaryKey="thirdParties.pagination.summary"
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
                                <span className="text-gray-400">{direction === 'asc' ? '▲' : '▼'}</span>
                              )}
                            </div>
                          </th>
                        )
                      })}
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {paginatedThirdParties.length === 0 ? (
                      <tr>
                        <td colSpan={columns.length} className="px-6 py-10 text-center text-sm text-gray-500">
                          {t('thirdParties.table.empty')}
                        </td>
                      </tr>
                    ) : (
                      paginatedThirdParties.map((tp) => (
                        <tr
                          key={tp.id}
                          className="hover:bg-gray-50 cursor-pointer"
                          onClick={() => onViewThirdParty(tp)}
                        >
                          <td className="px-4 py-3 text-sm text-gray-900 font-medium">{tp.name || '—'}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{tp.category_name || '—'}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{tp.phone || '—'}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{tp.email || '—'}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{tp.note || '—'}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <div className="md:hidden space-y-3">
                {paginatedThirdParties.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-gray-300 px-4 py-6 text-center text-sm text-gray-500">
                    {t('thirdParties.table.empty')}
                  </div>
                ) : (
                  paginatedThirdParties.map((tp) => (
                    <div
                      key={tp.id}
                      className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => onViewThirdParty(tp)}
                    >
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
                    </div>
                  ))
                )}
              </div>

              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={sortedThirdParties.length}
                pageSize={PAGE_SIZE}
                onPageChange={handlePageChange}
                summaryKey="thirdParties.pagination.summary"
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ThirdParties


