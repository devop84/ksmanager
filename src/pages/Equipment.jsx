import { useEffect, useMemo, useState } from 'react'
import sql from '../lib/neon'

const PAGE_SIZE = 25

const columns = [
  { key: 'name', label: 'Equipment' },
  { key: 'category_name', label: 'Category' },
  { key: 'description', label: 'Description' }
]

function Equipment({ refreshKey = 0, onAddEquipment = () => {}, onEditEquipment = () => {}, onViewEquipment = () => {} }) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' })
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    const fetchEquipment = async () => {
      try {
        setLoading(true)
        setError(null)
        const result = await sql`
          SELECT e.id, e.name, e.description, ec.name AS category_name
          FROM equipment e
          LEFT JOIN equipment_categories ec ON ec.id = e.category_id
          ORDER BY e.name ASC
        `
        setItems(result || [])
      } catch (err) {
        console.error('Failed to load equipment:', err)
        setError('Unable to load equipment. Please try again later.')
      } finally {
        setLoading(false)
      }
    }

    fetchEquipment()
  }, [refreshKey])

  const filteredItems = useMemo(() => {
    if (!searchTerm.trim()) return items
    const query = searchTerm.toLowerCase()
    return items.filter((item) =>
      [item.name, item.description, item.category_name]
        .filter((value) => value !== null && value !== undefined)
        .some((value) => value.toString().toLowerCase().includes(query))
    )
  }, [items, searchTerm])

  const sortedItems = useMemo(() => {
    const sorted = [...filteredItems]
    sorted.sort((a, b) => {
      const aValue = a[sortConfig.key] ?? ''
      const bValue = b[sortConfig.key] ?? ''

      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1
      return 0
    })
    return sorted
  }, [filteredItems, sortConfig])

  const totalPages = Math.max(1, Math.ceil(sortedItems.length / PAGE_SIZE))
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE
    return sortedItems.slice(start, start + PAGE_SIZE)
  }, [sortedItems, currentPage])

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
        Page {currentPage} of {totalPages} • Showing {paginatedItems.length} of {sortedItems.length} items
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
            <h1 className="text-3xl font-bold text-gray-900">Equipment</h1>
            <p className="text-gray-500 text-sm">
              Track boards, kites, harnesses, and other inventory items.
            </p>
          </div>
          <button
            onClick={onAddEquipment}
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
            Add equipment
          </button>
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <input
              type="text"
              value={searchTerm}
              onChange={handleSearchChange}
              placeholder="Search equipment by name or category..."
              className="w-full md:w-1/2 rounded-lg border border-gray-300 px-4 py-2 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-shadow"
            />
          </div>

          {loading && <div className="text-gray-600 text-sm">Loading equipment...</div>}
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
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {paginatedItems.length === 0 ? (
                      <tr>
                        <td colSpan={columns.length} className="px-6 py-10 text-center text-sm text-gray-500">
                          No equipment found. Try adjusting your search.
                        </td>
                      </tr>
                    ) : (
                      paginatedItems.map((item) => (
                        <tr
                          key={item.id}
                          className="hover:bg-gray-50 cursor-pointer"
                          onClick={() => onViewEquipment(item)}
                        >
                          <td className="px-4 py-3 text-sm text-gray-900 font-medium">{item.name}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{item.category_name || '—'}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{item.description || '—'}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
              <div className="md:hidden space-y-3">
                {paginatedItems.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-gray-300 px-4 py-6 text-center text-sm text-gray-500">
                    No equipment found. Try adjusting your search.
                  </div>
                ) : (
                  paginatedItems.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => onViewEquipment(item)}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-base font-semibold text-gray-900">{item.name}</p>
                          <p className="text-sm text-gray-500">{item.category_name || 'Uncategorized'}</p>
                        </div>
                      </div>
                      {item.description && (
                        <p className="mt-2 text-sm text-gray-600">{item.description}</p>
                      )}
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

export default Equipment
