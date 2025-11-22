import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import sql from '../lib/neon'
import { canModify } from '../lib/permissions'
import { useSettings } from '../context/SettingsContext'
import Pagination from '../components/Pagination'

const PAGE_SIZE = 25

function Services({ onAddService = () => {}, onEditService = () => {}, onViewService = () => {}, refreshKey = 0, user = null }) {
  const [services, setServices] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [activeFilter, setActiveFilter] = useState('all')
  const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' })
  const [currentPage, setCurrentPage] = useState(1)
  const [deletingId, setDeletingId] = useState(null)
  const [categories, setCategories] = useState([])
  const { formatCurrency } = useSettings()
  const { t } = useTranslation()

  const columns = useMemo(
    () => [
      { key: 'name', label: t('services.table.name', 'Name') },
      { key: 'category_name', label: t('services.table.category', 'Category') },
      { key: 'base_price', label: t('services.table.basePrice', 'Base Price') },
      { key: 'is_active', label: t('services.table.status', 'Status') },
      { key: 'created_at', label: t('services.table.created', 'Created') },
    ],
    [t],
  )

  useEffect(() => {
    const fetchServices = async () => {
      try {
        setLoading(true)
        setError(null)
        const [servicesResult, categoriesResult] = await Promise.all([
          sql`
            SELECT 
              s.id,
              s.name,
              s.description,
              s.base_price,
              s.currency,
              s.is_active,
              s.created_at,
              s.updated_at,
              sc.name AS category_name,
              sc.id AS category_id
            FROM services s
            LEFT JOIN service_categories sc ON s.category_id = sc.id
            ORDER BY s.name ASC
          `,
          sql`
            SELECT id, name
            FROM service_categories
            ORDER BY name ASC
          `
        ])
        setServices(servicesResult || [])
        setCategories(categoriesResult || [])
      } catch (err) {
        console.error('Failed to load services:', err)
        setError(t('services.error.load', 'Unable to load services. Please try again later.'))
      } finally {
        setLoading(false)
      }
    }

    fetchServices()
  }, [refreshKey, t])

  const filteredServices = useMemo(() => {
    return services.filter((service) => {
      if (categoryFilter !== 'all' && service.category_id?.toString() !== categoryFilter) return false
      if (activeFilter !== 'all') {
        const isActive = service.is_active === true || service.is_active === 'true'
        if (activeFilter === 'active' && !isActive) return false
        if (activeFilter === 'inactive' && isActive) return false
      }
      if (!searchTerm.trim()) return true
      const query = searchTerm.toLowerCase()
      return [
        service.name,
        service.description,
        service.category_name
      ]
        .filter((value) => value !== null && value !== undefined)
        .some((value) => value.toString().toLowerCase().includes(query))
    })
  }, [services, searchTerm, categoryFilter, activeFilter])

  const sortedServices = useMemo(() => {
    const sorted = [...filteredServices]
    sorted.sort((a, b) => {
      let aValue = a[sortConfig.key] ?? ''
      let bValue = b[sortConfig.key] ?? ''

      // Handle numeric sorting for price
      if (sortConfig.key === 'base_price') {
        aValue = Number(aValue) || 0
        bValue = Number(bValue) || 0
      }

      // Handle boolean sorting for is_active
      if (sortConfig.key === 'is_active') {
        aValue = aValue === true || aValue === 'true' ? 1 : 0
        bValue = bValue === true || bValue === 'true' ? 1 : 0
      }

      // Handle date sorting
      if (sortConfig.key === 'created_at') {
        aValue = aValue ? new Date(aValue).getTime() : 0
        bValue = bValue ? new Date(bValue).getTime() : 0
      }

      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1
      return 0
    })
    return sorted
  }, [filteredServices, sortConfig])

  const totalPages = Math.max(1, Math.ceil(sortedServices.length / PAGE_SIZE))
  const paginatedServices = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE
    return sortedServices.slice(start, start + PAGE_SIZE)
  }, [sortedServices, currentPage])

  useEffect(() => {
    setCurrentPage(1)
  }, [searchTerm, categoryFilter, activeFilter])

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

  const handleDelete = async (serviceId, event) => {
    event.stopPropagation()
    if (!window.confirm(t('services.confirm.delete', 'Are you sure you want to delete this service? This will also delete all associated packages.'))) return
    try {
      setDeletingId(serviceId)
      await sql`DELETE FROM services WHERE id = ${serviceId}`
      setServices((prev) => prev.filter((service) => service.id !== serviceId))
    } catch (err) {
      console.error('Failed to delete service:', err)
      alert(t('services.error.delete', 'Unable to delete service. Please try again.'))
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="px-4 py-6 sm:p-6 lg:p-8">
      <div className="flex flex-col gap-6 bg-white rounded-xl shadow-sm p-4 sm:p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{t('services.title', 'Services')}</h1>
            <p className="text-gray-500 text-sm">
              {t('services.description', 'Manage service catalog with categories, pricing, and packages.')}
            </p>
          </div>
          <button
            onClick={onAddService}
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
            {t('services.add', 'Add service')}
          </button>
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <input
              type="text"
              value={searchTerm}
              onChange={handleSearchChange}
              placeholder={t('services.search', 'Search services by name, category, or description...')}
              className="flex-1 rounded-lg border border-gray-300 px-4 py-2 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-shadow"
            />
            <div className="flex gap-2">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
              >
                <option value="all">{t('services.filters.allCategories', 'All Categories')}</option>
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
                <option value="all">{t('services.filters.allStatus', 'All Status')}</option>
                <option value="active">{t('services.filters.active', 'Active')}</option>
                <option value="inactive">{t('services.filters.inactive', 'Inactive')}</option>
              </select>
            </div>
          </div>

          {loading && <div className="text-gray-600 text-sm">{t('services.loading', 'Loading services...')}</div>}
          {error && <div className="text-red-600 text-sm">{error}</div>}
          {!loading && !error && (
            <div className="flex flex-col gap-4">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={sortedServices.length}
                pageSize={PAGE_SIZE}
                onPageChange={handlePageChange}
                itemName={t('services.items', 'services')}
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
                    {paginatedServices.length === 0 ? (
                      <tr>
                        <td colSpan={columns.length} className="px-6 py-10 text-center text-sm text-gray-500">
                          {t('services.empty', 'No services found. Try adjusting your search or filters.')}
                        </td>
                      </tr>
                    ) : (
                      paginatedServices.map((service) => {
                        const isActive = service.is_active === true || service.is_active === 'true'
                        return (
                          <tr
                            key={service.id}
                            className="hover:bg-gray-50 cursor-pointer"
                            onClick={() => onViewService(service)}
                          >
                            <td className="px-4 py-3 text-sm text-gray-900 font-medium">{service.name || '—'}</td>
                            <td className="px-4 py-3 text-sm text-gray-600">{service.category_name || '—'}</td>
                            <td className="px-4 py-3 text-sm text-gray-900">
                              {formatCurrency(Number(service.base_price || 0), { minimumFractionDigits: 2 })}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <span
                                className={`inline-flex items-center rounded-full border px-2 py-1 text-xs font-semibold ${
                                  isActive
                                    ? 'text-emerald-700 bg-emerald-50 border-emerald-100'
                                    : 'text-gray-700 bg-gray-50 border-gray-200'
                                }`}
                              >
                                {isActive ? t('services.status.active', 'Active') : t('services.status.inactive', 'Inactive')}
                              </span>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                              {new Date(service.created_at).toLocaleDateString()}
                            </td>
                          </tr>
                        )
                      })
                    )}
                  </tbody>
                </table>
              </div>

              <div className="md:hidden space-y-3">
                {paginatedServices.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-gray-300 px-4 py-6 text-center text-sm text-gray-500">
                    {t('services.empty', 'No services found. Try adjusting your search or filters.')}
                  </div>
                ) : (
                  paginatedServices.map((service) => {
                    const isActive = service.is_active === true || service.is_active === 'true'
                    return (
                      <div
                        key={service.id}
                        className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                        onClick={() => onViewService(service)}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="text-base font-semibold text-gray-900">{service.name || '—'}</p>
                            <p className="text-sm text-gray-500">{service.category_name || '—'}</p>
                          </div>
                          <span
                            className={`inline-flex items-center rounded-full border px-2 py-1 text-xs font-semibold ${
                              isActive
                                ? 'text-emerald-700 bg-emerald-50 border-emerald-100'
                                : 'text-gray-700 bg-gray-50 border-gray-200'
                            }`}
                          >
                            {isActive ? t('services.status.active', 'Active') : t('services.status.inactive', 'Inactive')}
                          </span>
                        </div>
                        <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 text-sm text-gray-600">
                          <div>
                            <dt className="text-gray-400 text-xs uppercase">{t('services.mobile.basePrice', 'Base Price')}</dt>
                            <dd>{formatCurrency(Number(service.base_price || 0))}</dd>
                          </div>
                          <div>
                            <dt className="text-gray-400 text-xs uppercase">{t('services.mobile.currency', 'Currency')}</dt>
                            <dd>{service.currency || 'BRL'}</dd>
                          </div>
                        </dl>
                        {service.description && (
                          <div className="mt-3 pt-3 border-t border-gray-200">
                            <p className="text-sm text-gray-600">{service.description}</p>
                          </div>
                        )}
                      </div>
                    )
                  })
                )}
              </div>
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={sortedServices.length}
                pageSize={PAGE_SIZE}
                onPageChange={handlePageChange}
                itemName={t('services.items', 'services')}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Services

