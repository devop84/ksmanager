import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import sql from '../lib/neon'
import { canModify } from '../lib/permissions'
import { useSettings } from '../context/SettingsContext'
import Pagination from '../components/Pagination'

const PAGE_SIZE = 25

function ServicePackages({ onAddPackage = () => {}, onEditPackage = () => {}, onViewPackage = () => {}, refreshKey = 0, user = null }) {
  const [packages, setPackages] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [serviceFilter, setServiceFilter] = useState('all')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [activeFilter, setActiveFilter] = useState('all')
  const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' })
  const [currentPage, setCurrentPage] = useState(1)
  const [services, setServices] = useState([])
  const [categories, setCategories] = useState([])
  const { formatCurrency } = useSettings()
  const { t } = useTranslation()

  const columns = useMemo(
    () => [
      { key: 'name', label: t('servicePackages.table.name', 'Package Name') },
      { key: 'service_name', label: t('servicePackages.table.service', 'Service') },
      { key: 'category_name', label: t('servicePackages.table.category', 'Category') },
      { key: 'duration_hours', label: t('servicePackages.table.duration', 'Duration') },
      { key: 'price', label: t('servicePackages.table.price', 'Price') },
      { key: 'is_active', label: t('servicePackages.table.status', 'Status') },
    ],
    [t],
  )

  useEffect(() => {
    const fetchPackages = async () => {
      try {
        setLoading(true)
        setError(null)
        const [packagesResult, servicesResult, categoriesResult] = await Promise.all([
          sql`
            SELECT 
              sp.id,
              sp.name,
              sp.duration_hours,
              sp.price,
              sp.currency,
              sp.description,
              sp.is_active,
              sp.created_at,
              sp.updated_at,
              s.id AS service_id,
              s.name AS service_name,
              sc.id AS category_id,
              sc.name AS category_name
            FROM service_packages sp
            LEFT JOIN services s ON sp.service_id = s.id
            LEFT JOIN service_categories sc ON s.category_id = sc.id
            ORDER BY s.name ASC, sp.duration_hours ASC NULLS LAST
          `,
          sql`
            SELECT DISTINCT s.id, s.name
            FROM services s
            ORDER BY s.name ASC
          `,
          sql`
            SELECT DISTINCT sc.id, sc.name
            FROM service_categories sc
            ORDER BY sc.name ASC
          `
        ])
        setPackages(packagesResult || [])
        setServices(servicesResult || [])
        setCategories(categoriesResult || [])
      } catch (err) {
        console.error('Failed to load service packages:', err)
        setError(t('servicePackages.error.load', 'Unable to load service packages. Please try again later.'))
      } finally {
        setLoading(false)
      }
    }

    fetchPackages()
  }, [refreshKey, t])

  const filteredPackages = useMemo(() => {
    return packages.filter((pkg) => {
      if (serviceFilter !== 'all' && pkg.service_id?.toString() !== serviceFilter) return false
      if (categoryFilter !== 'all' && pkg.category_id?.toString() !== categoryFilter) return false
      if (activeFilter !== 'all') {
        const isActive = pkg.is_active === true || pkg.is_active === 'true'
        if (activeFilter === 'active' && !isActive) return false
        if (activeFilter === 'inactive' && isActive) return false
      }
      if (!searchTerm.trim()) return true
      const query = searchTerm.toLowerCase()
      return [
        pkg.name,
        pkg.service_name,
        pkg.category_name,
        pkg.description
      ]
        .filter((value) => value !== null && value !== undefined)
        .some((value) => value.toString().toLowerCase().includes(query))
    })
  }, [packages, searchTerm, serviceFilter, categoryFilter, activeFilter])

  const sortedPackages = useMemo(() => {
    const sorted = [...filteredPackages]
    sorted.sort((a, b) => {
      let aValue = a[sortConfig.key] ?? ''
      let bValue = b[sortConfig.key] ?? ''

      // Handle numeric sorting for price and duration
      if (sortConfig.key === 'price' || sortConfig.key === 'duration_hours') {
        aValue = Number(aValue) || 0
        bValue = Number(bValue) || 0
      }

      // Handle boolean sorting for is_active
      if (sortConfig.key === 'is_active') {
        aValue = aValue === true || aValue === 'true' ? 1 : 0
        bValue = bValue === true || bValue === 'true' ? 1 : 0
      }

      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1
      return 0
    })
    return sorted
  }, [filteredPackages, sortConfig])

  const totalPages = Math.max(1, Math.ceil(sortedPackages.length / PAGE_SIZE))
  const paginatedPackages = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE
    return sortedPackages.slice(start, start + PAGE_SIZE)
  }, [sortedPackages, currentPage])

  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, serviceFilter, categoryFilter, activeFilter])

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
            <h1 className="text-3xl font-bold text-gray-900">{t('servicePackages.title', 'Service Packages')}</h1>
            <p className="text-gray-500 text-sm">
              {t('servicePackages.description', 'View and manage service packages across all services.')}
            </p>
          </div>
          <button
            onClick={onAddPackage}
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
            {t('servicePackages.add', 'Add package')}
          </button>
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <input
              type="text"
              value={searchTerm}
              onChange={handleSearchChange}
              placeholder={t('servicePackages.search', 'Search packages by name, service, or category...')}
              className="flex-1 rounded-lg border border-gray-300 px-4 py-2 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-shadow"
            />
            <div className="flex gap-2">
              <select
                value={serviceFilter}
                onChange={(e) => setServiceFilter(e.target.value)}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
              >
                <option value="all">{t('servicePackages.filters.allServices', 'All Services')}</option>
                {services.map((service) => (
                  <option key={service.id} value={service.id.toString()}>
                    {service.name}
                  </option>
                ))}
              </select>
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
              >
                <option value="all">{t('servicePackages.filters.allCategories', 'All Categories')}</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id.toString()}>
                    {cat.name}
                  </option>
                ))}
              </select>
              <select
                value={activeFilter}
                onChange={(e) => setActiveFilter(e.target.value)}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
              >
                <option value="all">{t('servicePackages.filters.allStatus', 'All Status')}</option>
                <option value="active">{t('servicePackages.filters.active', 'Active')}</option>
                <option value="inactive">{t('servicePackages.filters.inactive', 'Inactive')}</option>
              </select>
            </div>
          </div>

          {loading && <div className="text-gray-600 text-sm">{t('servicePackages.loading', 'Loading packages...')}</div>}
          {error && <div className="text-red-600 text-sm">{error}</div>}
          {!loading && !error && (
            <div className="flex flex-col gap-4">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={sortedPackages.length}
                pageSize={PAGE_SIZE}
                onPageChange={handlePageChange}
                itemName={t('servicePackages.items', 'packages')}
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
                    {paginatedPackages.length === 0 ? (
                      <tr>
                        <td colSpan={columns.length} className="px-6 py-10 text-center text-sm text-gray-500">
                          {t('servicePackages.empty', 'No packages found. Try adjusting your search or filters.')}
                        </td>
                      </tr>
                    ) : (
                      paginatedPackages.map((pkg) => {
                        const isActive = pkg.is_active === true || pkg.is_active === 'true'
                        return (
                          <tr
                            key={pkg.id}
                            className="hover:bg-gray-50 cursor-pointer"
                            onClick={() => onViewPackage(pkg)}
                          >
                            <td className="px-4 py-3 text-sm text-gray-900 font-medium">{pkg.name || '—'}</td>
                            <td className="px-4 py-3 text-sm text-gray-900">{pkg.service_name || '—'}</td>
                            <td className="px-4 py-3 text-sm text-gray-600">{pkg.category_name || '—'}</td>
                            <td className="px-4 py-3 text-sm text-gray-600">
                              {pkg.duration_hours ? `${pkg.duration_hours}h` : '—'}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900">
                              {formatCurrency(Number(pkg.price || 0), { minimumFractionDigits: 2 })}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <span
                                className={`inline-flex items-center rounded-full border px-2 py-1 text-xs font-semibold ${
                                  isActive
                                    ? 'text-emerald-700 bg-emerald-50 border-emerald-100'
                                    : 'text-gray-700 bg-gray-50 border-gray-200'
                                }`}
                              >
                                {isActive ? t('servicePackages.status.active', 'Active') : t('servicePackages.status.inactive', 'Inactive')}
                              </span>
                            </td>
                          </tr>
                        )
                      })
                    )}
                  </tbody>
                </table>
              </div>

              <div className="md:hidden space-y-3">
                {paginatedPackages.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-gray-300 px-4 py-6 text-center text-sm text-gray-500">
                    {t('servicePackages.empty', 'No packages found. Try adjusting your search or filters.')}
                  </div>
                ) : (
                  paginatedPackages.map((pkg) => {
                    const isActive = pkg.is_active === true || pkg.is_active === 'true'
                    return (
                      <div
                        key={pkg.id}
                        className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                        onClick={() => onViewPackage(pkg)}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-base font-semibold text-gray-900">{pkg.name || '—'}</p>
                            <p className="text-sm text-gray-500">{pkg.service_name || '—'}</p>
                          </div>
                          <span
                            className={`inline-flex items-center rounded-full border px-2 py-1 text-xs font-semibold ${
                              isActive
                                ? 'text-emerald-700 bg-emerald-50 border-emerald-100'
                                : 'text-gray-700 bg-gray-50 border-gray-200'
                            }`}
                          >
                            {isActive ? t('servicePackages.status.active', 'Active') : t('servicePackages.status.inactive', 'Inactive')}
                          </span>
                        </div>
                        <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 text-sm text-gray-600">
                          <div>
                            <dt className="text-gray-400 text-xs uppercase">{t('servicePackages.mobile.category', 'Category')}</dt>
                            <dd>{pkg.category_name || '—'}</dd>
                          </div>
                          <div>
                            <dt className="text-gray-400 text-xs uppercase">{t('servicePackages.mobile.duration', 'Duration')}</dt>
                            <dd>{pkg.duration_hours ? `${pkg.duration_hours}h` : '—'}</dd>
                          </div>
                          <div>
                            <dt className="text-gray-400 text-xs uppercase">{t('servicePackages.mobile.price', 'Price')}</dt>
                            <dd>{formatCurrency(Number(pkg.price || 0))}</dd>
                          </div>
                        </dl>
                      </div>
                    )
                  })
                )}
              </div>
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={sortedPackages.length}
                pageSize={PAGE_SIZE}
                onPageChange={handlePageChange}
                itemName={t('servicePackages.items', 'packages')}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ServicePackages

