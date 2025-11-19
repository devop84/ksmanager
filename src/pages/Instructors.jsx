import { useEffect, useMemo, useState } from 'react'
import sql from '../lib/neon'
import { canModify } from '../lib/permissions'

const PAGE_SIZE = 25

const columns = [
  { key: 'fullname', label: 'Full Name' },
  { key: 'phone', label: 'Phone' },
  { key: 'email', label: 'Email' },
  { key: 'bankdetail', label: 'Bank Detail' },
  { key: 'hourlyrate', label: 'Hourly Rate' },
  { key: 'commission', label: 'Commission' },
  { key: 'monthlyfix', label: 'Monthly Fix' },
  { key: 'note', label: 'Note' }
]

function Instructors({ onAddInstructor = () => {}, onEditInstructor = () => {}, onViewInstructor = () => {}, refreshKey = 0, user = null }) {
  const [instructors, setInstructors] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortConfig, setSortConfig] = useState({ key: 'fullname', direction: 'asc' })
  const [currentPage, setCurrentPage] = useState(1)
  const [deletingId, setDeletingId] = useState(null)

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
      } catch (err) {
        console.error('Failed to load instructors:', err)
        setError('Unable to load instructors. Please try again later.')
      } finally {
        setLoading(false)
      }
    }

    fetchInstructors()
  }, [refreshKey])

  const filteredInstructors = useMemo(() => {
    if (!searchTerm.trim()) return instructors
    const query = searchTerm.toLowerCase()
    return instructors.filter((instructor) =>
      [
        instructor.fullname,
        instructor.phone,
        instructor.email,
        instructor.bankdetail,
        instructor.hourlyrate,
        instructor.commission,
        instructor.monthlyfix,
        instructor.note
      ]
        .filter((value) => value !== null && value !== undefined)
        .some((value) => value.toString().toLowerCase().includes(query))
    )
  }, [instructors, searchTerm])

  const sortedInstructors = useMemo(() => {
    const sorted = [...filteredInstructors]
    sorted.sort((a, b) => {
      const aValue = a[sortConfig.key] ?? ''
      const bValue = b[sortConfig.key] ?? ''

      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1
      return 0
    })
    return sorted
  }, [filteredInstructors, sortConfig])

  const totalPages = Math.max(1, Math.ceil(sortedInstructors.length / PAGE_SIZE))
  const paginatedInstructors = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE
    return sortedInstructors.slice(start, start + PAGE_SIZE)
  }, [sortedInstructors, currentPage])

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

  const handleDelete = async (instructorId) => {
    if (!window.confirm('Are you sure you want to delete this instructor?')) return
    try {
      setDeletingId(instructorId)
      await sql`DELETE FROM instructors WHERE id = ${instructorId}`
      setInstructors((prev) => prev.filter((instructor) => instructor.id !== instructorId))
    } catch (err) {
      console.error('Failed to delete instructor:', err)
      alert('Unable to delete instructor. Please try again.')
    } finally {
      setDeletingId(null)
    }
  }

  const renderPagination = () => (
    <div className="flex items-center justify-between text-sm text-gray-600">
      <span>
        Page {currentPage} of {totalPages} • Showing {paginatedInstructors.length} of {sortedInstructors.length}{' '}
        instructors
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

  const formatCurrency = (value) => {
    if (value === null || value === undefined) return '—'
    return `$${Number(value).toFixed(2)}`
  }

  const formatPercent = (value) => {
    if (value === null || value === undefined) return '—'
    return `${Number(value).toFixed(1)}%`
  }

  return (
    <div className="px-4 py-6 sm:p-6 lg:p-8">
      <div className="flex flex-col gap-6 bg-white rounded-xl shadow-sm p-4 sm:p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Instructors</h1>
            <p className="text-gray-500 text-sm">Manage instructor roster, pay rates, and contact details.</p>
          </div>
          <button
            onClick={onAddInstructor}
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
            Add instructor
          </button>
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <input
              type="text"
              value={searchTerm}
              onChange={handleSearchChange}
              placeholder="Search instructors by name, contact, or rate..."
              className="w-full md:w-1/2 rounded-lg border border-gray-300 px-4 py-2 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-shadow"
            />
          </div>

          {loading && <div className="text-gray-600 text-sm">Loading instructors...</div>}
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
                    {paginatedInstructors.length === 0 ? (
                      <tr>
                        <td colSpan={columns.length} className="px-6 py-10 text-center text-sm text-gray-500">
                          No instructors found. Try adjusting your search or filters.
                        </td>
                      </tr>
                    ) : (
                      paginatedInstructors.map((instructor) => (
                        <tr
                          key={instructor.id}
                          className="hover:bg-gray-50 cursor-pointer"
                          onClick={() => onViewInstructor(instructor)}
                        >
                          <td className="px-4 py-3 text-sm text-gray-900 font-medium">{instructor.fullname || '—'}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{instructor.phone || '—'}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{instructor.email || '—'}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{instructor.bankdetail || '—'}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{formatCurrency(instructor.hourlyrate)}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{formatPercent(instructor.commission)}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{formatCurrency(instructor.monthlyfix)}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{instructor.note || '—'}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <div className="md:hidden space-y-3">
                {paginatedInstructors.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-gray-300 px-4 py-6 text-center text-sm text-gray-500">
                    No instructors found. Try adjusting your search or filters.
                  </div>
                ) : (
                  paginatedInstructors.map((instructor) => (
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
                          {formatCurrency(instructor.hourlyrate)}
                        </span>
                      </div>
                      <dl className="mt-4 grid grid-cols-2 gap-3 text-sm text-gray-600">
                        <div>
                          <dt className="text-gray-400 text-xs uppercase">Phone</dt>
                          <dd>{instructor.phone || '—'}</dd>
                        </div>
                        <div>
                          <dt className="text-gray-400 text-xs uppercase">Bank Detail</dt>
                          <dd>{instructor.bankdetail || '—'}</dd>
                        </div>
                        <div>
                          <dt className="text-gray-400 text-xs uppercase">Hourly</dt>
                          <dd>{formatCurrency(instructor.hourlyrate)}</dd>
                        </div>
                        <div>
                          <dt className="text-gray-400 text-xs uppercase">Commission</dt>
                          <dd>{formatPercent(instructor.commission)}</dd>
                        </div>
                        <div>
                          <dt className="text-gray-400 text-xs uppercase">Monthly Fix</dt>
                          <dd>{formatCurrency(instructor.monthlyfix)}</dd>
                        </div>
                        <div className="md:col-span-2">
                          <dt className="text-gray-400 text-xs uppercase">Note</dt>
                          <dd>{instructor.note || '—'}</dd>
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

export default Instructors

