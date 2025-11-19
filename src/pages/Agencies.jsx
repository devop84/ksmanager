import { useEffect, useMemo, useState } from 'react'
import sql from '../lib/neon'

const PAGE_SIZE = 25

const columns = [
  { key: 'name', label: 'Name' },
  { key: 'phone', label: 'Phone' },
  { key: 'email', label: 'Email' },
  { key: 'commission', label: 'Commission' },
  { key: 'note', label: 'Note' }
]

function Agencies({ onAddAgency = () => {}, onEditAgency = () => {}, onViewAgency = () => {}, refreshKey = 0 }) {
  const [agencies, setAgencies] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' })
  const [currentPage, setCurrentPage] = useState(1)

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
      } catch (err) {
        console.error('Failed to load agencies:', err)
        setError('Unable to load agencies. Please try again later.')
      } finally {
        setLoading(false)
      }
    }

    fetchAgencies()
  }, [refreshKey])

  const filteredAgencies = useMemo(() => {
    if (!searchTerm.trim()) return agencies
    const query = searchTerm.toLowerCase()
    return agencies.filter((agency) =>
      [agency.name, agency.phone, agency.email, agency.commission, agency.note]
        .filter((value) => value !== null && value !== undefined)
        .some((value) => value.toString().toLowerCase().includes(query))
    )
  }, [agencies, searchTerm])

  const sortedAgencies = useMemo(() => {
    const sorted = [...filteredAgencies]
    sorted.sort((a, b) => {
      const aValue = a[sortConfig.key] ?? ''
      const bValue = b[sortConfig.key] ?? ''

      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1
      return 0
    })
    return sorted
  }, [filteredAgencies, sortConfig])

  const totalPages = Math.max(1, Math.ceil(sortedAgencies.length / PAGE_SIZE))
  const paginatedAgencies = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE
    return sortedAgencies.slice(start, start + PAGE_SIZE)
  }, [sortedAgencies, currentPage])

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
    setCurrentPage((prev) => Math.min(Math.max(newPage, 1), totalPages))
  }

  const renderPagination = () => (
    <div className="flex items-center justify-between text-sm text-gray-600">
      <span>
        Page {currentPage} of {totalPages} • Showing {paginatedAgencies.length} of {sortedAgencies.length} agencies
      </span>
      <div className="space-x-2">
        <button
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-3 py-1 rounded-md border text-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Previous
        </button>
        <button
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="px-3 py-1 rounded-md border text-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Next
        </button>
      </div>
    </div>
  )

  const formatCommission = (value) => {
    if (value === null || value === undefined) return '—'
    return `${Number(value).toFixed(1)}%`
  }

  return (
    <div className="px-4 py-6 sm:p-6 lg:p-8">
      <div className="flex flex-col gap-6 bg-white rounded-xl shadow-sm p-4 sm:p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Agencies</h1>
            <p className="text-gray-500 text-sm">Track partner agencies, contacts, and commissions.</p>
          </div>
          <button
            onClick={onAddAgency}
            className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 transition-colors"
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
            Add agency
          </button>
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <input
              type="text"
              value={searchTerm}
              onChange={handleSearchChange}
              placeholder="Search agencies by name, contact, or commission..."
              className="w-full md:w-1/2 rounded-lg border border-gray-300 px-4 py-2 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-shadow"
            />
          </div>

          {loading && <div className="text-gray-600 text-sm">Loading agencies...</div>}
          {error && <div className="text-red-600 text-sm">{error}</div>}
          {!loading && !error && (
            <div className="flex flex-col gap-4">
              {renderPagination()}
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
                    {paginatedAgencies.length === 0 ? (
                      <tr>
                        <td colSpan={columns.length} className="px-6 py-10 text-center text-sm text-gray-500">
                          No agencies found. Try adjusting your search or filters.
                        </td>
                      </tr>
                    ) : (
                      paginatedAgencies.map((agency) => (
                        <tr
                          key={agency.id}
                          className="hover:bg-gray-50 cursor-pointer"
                          onClick={() => onViewAgency(agency)}
                        >
                          <td className="px-4 py-3 text-sm text-gray-900 font-medium">{agency.name || '—'}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{agency.phone || '—'}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{agency.email || '—'}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{formatCommission(agency.commission)}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{agency.note || '—'}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <div className="md:hidden space-y-3">
                {paginatedAgencies.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-gray-300 px-4 py-6 text-center text-sm text-gray-500">
                    No agencies found. Try adjusting your search or filters.
                  </div>
                ) : (
                  paginatedAgencies.map((agency) => (
                    <div
                      key={agency.id}
                      className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => onViewAgency(agency)}
                    >
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
                          <dt className="text-gray-400 text-xs uppercase">Phone</dt>
                          <dd>{agency.phone || '—'}</dd>
                        </div>
                        <div>
                          <dt className="text-gray-400 text-xs uppercase">Commission</dt>
                          <dd>{formatCommission(agency.commission)}</dd>
                        </div>
                      <div className="md:col-span-2">
                        <dt className="text-gray-400 text-xs uppercase">Note</dt>
                        <dd>{agency.note || '—'}</dd>
                      </div>
                      </dl>
                    </div>
                  ))
                )}
              </div>

              {renderPagination()}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Agencies

