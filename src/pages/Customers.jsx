import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import sql from '../lib/neon'
import { canModify } from '../lib/permissions'
import { useSettings } from '../context/SettingsContext'
import Pagination from '../components/Pagination'

const PAGE_SIZE = 25

function Customers({ onAddCustomer = () => {}, onEditCustomer = () => {}, onViewCustomer = () => {}, refreshKey = 0, user = null }) {
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortConfig, setSortConfig] = useState({ key: 'fullname', direction: 'asc' })
  const [currentPage, setCurrentPage] = useState(1)
  const [deletingId, setDeletingId] = useState(null)
  const { formatDate } = useSettings()
  const { t } = useTranslation()

  const columns = useMemo(
    () => [
      { key: 'fullname', label: t('customers.table.fullname', 'Full Name') },
      { key: 'phone', label: t('customers.table.phone', 'Phone') },
      { key: 'email', label: t('customers.table.email', 'Email') },
      { key: 'doc', label: t('customers.table.document', 'Document') },
      { key: 'country', label: t('customers.table.country', 'Country') },
      { key: 'birthdate', label: t('customers.table.birthdate', 'Birthdate') },
      { key: 'hotel_name', label: t('customers.table.hotel', 'Hotel') },
      { key: 'agency_name', label: t('customers.table.agency', 'Agency') },
      { key: 'note', label: t('customers.table.note', 'Note') },
    ],
    [t],
  )

  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        setLoading(true)
        setError(null)
        const result = await sql`
          SELECT 
            c.id,
            c.fullname,
            c.phone,
            c.email,
            c.doctype,
            c.doc,
            c.country,
            c.birthdate,
            c.note,
            c.hotel_id,
            c.agency_id,
            h.name AS hotel_name,
            a.name AS agency_name
          FROM customers c
          LEFT JOIN hotels h ON c.hotel_id = h.id
          LEFT JOIN agencies a ON c.agency_id = a.id
          ORDER BY fullname ASC
        `
        setCustomers(result || [])
      } catch (err) {
        console.error('Failed to load customers:', err)
        setError('Unable to load customers. Please try again later.')
      } finally {
        setLoading(false)
      }
    }

    fetchCustomers()
  }, [refreshKey])

  const filteredCustomers = useMemo(() => {
    if (!searchTerm.trim()) return customers
    const query = searchTerm.toLowerCase()
    return customers.filter((customer) =>
      [
        customer.fullname,
        customer.phone,
        customer.email,
        customer.doctype,
        customer.doc,
        customer.country,
        customer.note,
        customer.hotel_name,
        customer.agency_name
      ]
        .filter((value) => value !== null && value !== undefined)
        .some((value) => value.toString().toLowerCase().includes(query))
    )
  }, [customers, searchTerm])

  const sortedCustomers = useMemo(() => {
    const sorted = [...filteredCustomers]
    sorted.sort((a, b) => {
      const aValue = a[sortConfig.key] ?? ''
      const bValue = b[sortConfig.key] ?? ''

      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1
      return 0
    })
    return sorted
  }, [filteredCustomers, sortConfig])

  const totalPages = Math.max(1, Math.ceil(sortedCustomers.length / PAGE_SIZE))
  const paginatedCustomers = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE
    return sortedCustomers.slice(start, start + PAGE_SIZE)
  }, [sortedCustomers, currentPage])

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

  const handleDelete = async (customerId) => {
    if (!window.confirm('Are you sure you want to delete this customer?')) return
    try {
      setDeletingId(customerId)
      await sql`DELETE FROM customers WHERE id = ${customerId}`
      setCustomers((prev) => prev.filter((customer) => customer.id !== customerId))
    } catch (err) {
      console.error('Failed to delete customer:', err)
      alert('Unable to delete customer. Please try again.')
    } finally {
      setDeletingId(null)
    }
  }

  const formatBirthdate = (value) =>
    formatDate(value, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })

  return (
    <div className="px-4 py-6 sm:p-6 lg:p-8">
      <div className="flex flex-col gap-6 bg-white rounded-xl shadow-sm p-4 sm:p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{t('customers.title', 'Customers')}</h1>
            <p className="text-gray-500 text-sm">
              {t('customers.description', 'Manage customer records with quick search, sorting, and pagination controls.')}
            </p>
          </div>
          <button
            onClick={onAddCustomer}
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
            {t('customers.add', 'Add customer')}
          </button>
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <input
              type="text"
              value={searchTerm}
              onChange={handleSearchChange}
              placeholder={t('customers.search', 'Search customers by name, contact, document, or country...')}
              className="w-full md:w-1/2 rounded-lg border border-gray-300 px-4 py-2 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-shadow"
            />
          </div>

          {loading && <div className="text-gray-600 text-sm">{t('customers.loading', 'Loading customers...')}</div>}
          {error && <div className="text-red-600 text-sm">{error}</div>}
          {!loading && !error && (
            <div className="flex flex-col gap-4">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={sortedCustomers.length}
                pageSize={PAGE_SIZE}
                onPageChange={handlePageChange}
                itemName={t('common.items.customers', 'customers')}
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
                    {paginatedCustomers.length === 0 ? (
                      <tr>
                        <td colSpan={columns.length} className="px-6 py-10 text-center text-sm text-gray-500">
                          {t('customers.empty', 'No customers found. Try adjusting your search or filters.')}
                        </td>
                      </tr>
                    ) : (
                      paginatedCustomers.map((customer) => (
                        <tr
                          key={customer.id}
                          className="hover:bg-gray-50 cursor-pointer"
                          onClick={() => onViewCustomer(customer)}
                        >
                          <td className="px-4 py-3 text-sm text-gray-900 font-medium">{customer.fullname || '—'}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{customer.phone || '—'}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{customer.email || '—'}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{customer.doc || '—'}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{customer.country || '—'}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{formatBirthdate(customer.birthdate)}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{customer.hotel_name || '—'}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{customer.agency_name || '—'}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{customer.note || '—'}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              <div className="md:hidden space-y-3">
                {paginatedCustomers.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-gray-300 px-4 py-6 text-center text-sm text-gray-500">
                    {t('customers.empty', 'No customers found. Try adjusting your search or filters.')}
                  </div>
                ) : (
                  paginatedCustomers.map((customer) => (
                    <div
                      key={customer.id}
                      className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => onViewCustomer(customer)}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-base font-semibold text-gray-900">{customer.fullname || '—'}</p>
                          <p className="text-sm text-gray-500">{customer.email || customer.phone || '—'}</p>
                        </div>
                        <span className="inline-flex items-center rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-medium text-indigo-800">
                          {customer.agency_name || t('common.direct', 'Direct')}
                        </span>
                      </div>
                      <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 text-sm text-gray-600">
                        <div>
                          <dt className="text-gray-400 text-xs uppercase">
                            {t('customers.mobile.phone', 'Phone')}
                          </dt>
                          <dd>{customer.phone || '—'}</dd>
                        </div>
                        <div>
                          <dt className="text-gray-400 text-xs uppercase">
                            {t('customers.mobile.document', 'Document')}
                          </dt>
                          <dd>{customer.doc || '—'}</dd>
                        </div>
                        <div>
                          <dt className="text-gray-400 text-xs uppercase">{t('customers.mobile.country', 'Country')}</dt>
                          <dd>{customer.country || '—'}</dd>
                        </div>
                        <div>
                          <dt className="text-gray-400 text-xs uppercase">
                            {t('customers.mobile.birthdate', 'Birthdate')}
                          </dt>
                          <dd>{formatBirthdate(customer.birthdate)}</dd>
                        </div>
                        <div>
                          <dt className="text-gray-400 text-xs uppercase">{t('customers.mobile.hotel', 'Hotel')}</dt>
                          <dd>{customer.hotel_name || '—'}</dd>
                        </div>
                        <div>
                          <dt className="text-gray-400 text-xs uppercase">{t('customers.mobile.agency', 'Agency')}</dt>
                          <dd>{customer.agency_name || '—'}</dd>
                        </div>
                        <div className="md:col-span-2">
                          <dt className="text-gray-400 text-xs uppercase">{t('customers.mobile.note', 'Note')}</dt>
                          <dd>{customer.note || '—'}</dd>
                        </div>
                      </dl>
                    </div>
                  ))
                )}
              </div>
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={sortedCustomers.length}
                pageSize={PAGE_SIZE}
                onPageChange={handlePageChange}
                itemName={t('common.items.customers', 'customers')}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Customers

