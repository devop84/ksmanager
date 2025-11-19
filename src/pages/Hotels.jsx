import { useEffect, useMemo, useState } from 'react'
import sql from '../lib/neon'
import { canModify } from '../lib/permissions'

const PAGE_SIZE = 25

const columns = [
  { key: 'name', label: 'Name' },
  { key: 'phone', label: 'Phone' },
  { key: 'address', label: 'Address' },
  { key: 'note', label: 'Note' }
]

function Hotels({ onAddHotel = () => {}, onEditHotel = () => {}, onViewHotel = () => {}, refreshKey = 0, user = null }) {
  const [hotels, setHotels] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' })
  const [currentPage, setCurrentPage] = useState(1)
  const [deletingId, setDeletingId] = useState(null)

  useEffect(() => {
    const fetchHotels = async () => {
      try {
        setLoading(true)
        setError(null)
        const result = await sql`
          SELECT id, name, phone, address, note
          FROM hotels
          ORDER BY name ASC
        `
        setHotels(result || [])
      } catch (err) {
        console.error('Failed to load hotels:', err)
        setError('Unable to load hotels. Please try again later.')
      } finally {
        setLoading(false)
      }
    }

    fetchHotels()
  }, [refreshKey])

  const filteredHotels = useMemo(() => {
    if (!searchTerm.trim()) return hotels
    const query = searchTerm.toLowerCase()
    return hotels.filter((hotel) =>
      [hotel.name, hotel.phone, hotel.address, hotel.note]
        .filter((value) => value !== null && value !== undefined)
        .some((value) => value.toString().toLowerCase().includes(query))
    )
  }, [hotels, searchTerm])

  const sortedHotels = useMemo(() => {
    const sorted = [...filteredHotels]
    sorted.sort((a, b) => {
      const aValue = a[sortConfig.key] ?? ''
      const bValue = b[sortConfig.key] ?? ''

      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1
      return 0
    })
    return sorted
  }, [filteredHotels, sortConfig])

  const totalPages = Math.max(1, Math.ceil(sortedHotels.length / PAGE_SIZE))
  const paginatedHotels = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE
    return sortedHotels.slice(start, start + PAGE_SIZE)
  }, [sortedHotels, currentPage])

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

  const handleDelete = async (hotelId) => {
    if (!window.confirm('Are you sure you want to delete this hotel?')) return
    try {
      setDeletingId(hotelId)
      await sql`DELETE FROM hotels WHERE id = ${hotelId}`
      setHotels((prev) => prev.filter((hotel) => hotel.id !== hotelId))
    } catch (err) {
      console.error('Failed to delete hotel:', err)
      alert('Unable to delete hotel. Please try again.')
    } finally {
      setDeletingId(null)
    }
  }

  const renderPagination = () => (
    <div className="flex items-center justify-between text-sm text-gray-600">
      <span>
        Page {currentPage} of {totalPages} • Showing {paginatedHotels.length} of {sortedHotels.length} hotels
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
            <h1 className="text-3xl font-bold text-gray-900">Hotels</h1>
            <p className="text-gray-500 text-sm">Manage hotel partners, contacts, and logistics.</p>
          </div>
          <button
            onClick={onAddHotel}
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
            Add hotel
          </button>
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <input
              type="text"
              value={searchTerm}
              onChange={handleSearchChange}
              placeholder="Search hotels by name, phone, or address..."
              className="w-full md:w-1/2 rounded-lg border border-gray-300 px-4 py-2 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-shadow"
            />
          </div>

          {loading && <div className="text-gray-600 text-sm">Loading hotels...</div>}
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
                    {paginatedHotels.length === 0 ? (
                      <tr>
                        <td
                          colSpan={columns.length}
                          className="px-6 py-10 text-center text-sm text-gray-500"
                        >
                          No hotels found. Try adjusting your search or filters.
                        </td>
                      </tr>
                    ) : (
                      paginatedHotels.map((hotel) => (
                        <tr
                          key={hotel.id}
                          className="hover:bg-gray-50 cursor-pointer"
                          onClick={() => onViewHotel(hotel)}
                        >
                          <td className="px-4 py-3 text-sm text-gray-900 font-medium">{hotel.name || '—'}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{hotel.phone || '—'}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{hotel.address || '—'}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{hotel.note || '—'}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <div className="md:hidden space-y-3">
                {paginatedHotels.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-gray-300 px-4 py-6 text-center text-sm text-gray-500">
                    No hotels found. Try adjusting your search or filters.
                  </div>
                ) : (
                  paginatedHotels.map((hotel) => (
                    <div
                      key={hotel.id}
                      className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => onViewHotel(hotel)}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-base font-semibold text-gray-900">{hotel.name || '—'}</p>
                          <p className="text-sm text-gray-500">{hotel.phone || '—'}</p>
                        </div>
                      </div>
                      <dl className="mt-4 space-y-2 text-sm text-gray-600">
                        <div>
                          <dt className="text-gray-400 text-xs uppercase">Address</dt>
                          <dd>{hotel.address || '—'}</dd>
                        </div>
                    <div>
                      <dt className="text-gray-400 text-xs uppercase">Note</dt>
                      <dd>{hotel.note || '—'}</dd>
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

export default Hotels

