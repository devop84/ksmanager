import { useEffect, useMemo, useState } from 'react'
import sql from '../lib/neon'

const PAGE_SIZE = 25

const columns = [
  { key: 'name', label: 'Name' },
  { key: 'details', label: 'Details' },
  { key: 'note', label: 'Note' }
]

function CompanyAccounts({ refreshKey = 0, onAddAccount = () => {}, onEditAccount = () => {} }) {
  const [accounts, setAccounts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' })
  const [currentPage, setCurrentPage] = useState(1)
  const [deletingId, setDeletingId] = useState(null)

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
      } catch (err) {
        console.error('Failed to load company accounts:', err)
        setError('Unable to load company accounts. Please try again later.')
      } finally {
        setLoading(false)
      }
    }

    fetchAccounts()
  }, [refreshKey])

  const filteredAccounts = useMemo(() => {
    if (!searchTerm.trim()) return accounts
    const query = searchTerm.toLowerCase()
    return accounts.filter((account) =>
      [account.name, account.details, account.note]
        .filter((value) => value !== null && value !== undefined)
        .some((value) => value.toString().toLowerCase().includes(query))
    )
  }, [accounts, searchTerm])

  const sortedAccounts = useMemo(() => {
    const sorted = [...filteredAccounts]
    sorted.sort((a, b) => {
      const aValue = a[sortConfig.key] ?? ''
      const bValue = b[sortConfig.key] ?? ''

      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1
      return 0
    })
    return sorted
  }, [filteredAccounts, sortConfig])

  const totalPages = Math.max(1, Math.ceil(sortedAccounts.length / PAGE_SIZE))
  const paginatedAccounts = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE
    return sortedAccounts.slice(start, start + PAGE_SIZE)
  }, [sortedAccounts, currentPage])

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

  const handleDelete = async (accountId) => {
    if (!window.confirm('Are you sure you want to delete this account?')) return
    try {
      setDeletingId(accountId)
      await sql`DELETE FROM company_accounts WHERE id = ${accountId}`
      setAccounts((prev) => prev.filter((account) => account.id !== accountId))
    } catch (err) {
      console.error('Failed to delete company account:', err)
      alert('Unable to delete company account. Please try again.')
    } finally {
      setDeletingId(null)
    }
  }

  const renderPagination = () => (
    <div className="flex items-center justify-between text-sm text-gray-600">
      <span>
        Page {currentPage} of {totalPages} • Showing {paginatedAccounts.length} of {sortedAccounts.length} accounts
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

  return (
    <div className="px-4 py-6 sm:p-6 lg:p-8">
      <div className="flex flex-col gap-6 bg-white rounded-xl shadow-sm p-4 sm:p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Company Accounts</h1>
            <p className="text-gray-500 text-sm">Track bank accounts, treasury notes, and internal account details.</p>
          </div>
          <button
            onClick={onAddAccount}
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
            Add account
          </button>
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <input
              type="text"
              value={searchTerm}
              onChange={handleSearchChange}
              placeholder="Search accounts by name or description..."
              className="w-full md:w-1/2 rounded-lg border border-gray-300 px-4 py-2 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-shadow"
            />
          </div>

          {loading && <div className="text-gray-600 text-sm">Loading company accounts...</div>}
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
                                <span className="text-gray-400">{direction === 'asc' ? '▲' : '▼'}</span>
                              )}
                            </div>
                          </th>
                        )
                      })}
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {paginatedAccounts.length === 0 ? (
                      <tr>
                        <td colSpan={columns.length + 1} className="px-6 py-10 text-center text-sm text-gray-500">
                          No company accounts found. Try adjusting your search or filters.
                        </td>
                      </tr>
                    ) : (
                      paginatedAccounts.map((account) => (
                        <tr key={account.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-gray-900 font-medium">{account.name || '—'}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{account.details || '—'}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{account.note || '—'}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            <div className="flex items-center gap-3">
                              <button
                                onClick={() => onEditAccount(account)}
                                className="text-gray-500 hover:text-indigo-600 transition-colors"
                                aria-label="Edit account"
                              >
                                <svg
                                  className="w-5 h-5"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                  xmlns="http://www.w3.org/2000/svg"
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M15.232 5.232l3.536 3.536M16.732 3.732a2.5 2.5 0 113.536 3.536L7.5 20.036H4v-3.572L16.732 3.732z"
                                  />
                                </svg>
                              </button>
                              <button
                                onClick={() => handleDelete(account.id)}
                                disabled={deletingId === account.id}
                                className="text-gray-500 hover:text-red-600 transition-colors disabled:opacity-50"
                                aria-label="Delete account"
                              >
                                <svg
                                  className="w-5 h-5"
                                  fill="none"
                                  stroke="currentColor"
                                  viewBox="0 0 24 24"
                                  xmlns="http://www.w3.org/2000/svg"
                                >
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <div className="md:hidden space-y-3">
                {paginatedAccounts.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-gray-300 px-4 py-6 text-center text-sm text-gray-500">
                    No company accounts found. Try adjusting your search or filters.
                  </div>
                ) : (
                  paginatedAccounts.map((account) => (
                    <div key={account.id} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-base font-semibold text-gray-900">{account.name || '—'}</p>
                          <p className="text-sm text-gray-500">{account.details?.slice(0, 80) || '—'}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => onEditAccount(account)}
                            className="text-gray-500 hover:text-indigo-600 transition-colors"
                            aria-label="Edit account"
                          >
                            <svg
                              className="w-5 h-5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M15.232 5.232l3.536 3.536M16.732 3.732a2.5 2.5 0 113.536 3.536L7.5 20.036H4v-3.572L16.732 3.732z"
                              />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleDelete(account.id)}
                            disabled={deletingId === account.id}
                            className="text-gray-500 hover:text-red-600 transition-colors disabled:opacity-50"
                            aria-label="Delete account"
                          >
                            <svg
                              className="w-5 h-5"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                              xmlns="http://www.w3.org/2000/svg"
                            >
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      </div>
                      <dl className="mt-4 space-y-3 text-sm text-gray-600">
                        <div>
                          <dt className="text-gray-400 text-xs uppercase">Details</dt>
                          <dd>{account.details || '—'}</dd>
                        </div>
                        <div>
                          <dt className="text-gray-400 text-xs uppercase">Note</dt>
                          <dd>{account.note || '—'}</dd>
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

export default CompanyAccounts


