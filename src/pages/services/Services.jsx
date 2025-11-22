import { useEffect, useMemo, useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import sql from '../../lib/neon'
import { canModify } from '../../lib/permissions'
import { useSettings } from '../../context/SettingsContext'
import { useDataTable } from '../../hooks/useDataTable'
import DataTable from '../../components/DataTable'
import PageHeader from '../../components/PageHeader'
import SearchBar from '../../components/SearchBar'

function Services({ onAddService = () => {}, onEditService = () => {}, onViewService = () => {}, refreshKey = 0, user = null }) {
  const [services, setServices] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [categoryFilter, setCategoryFilter] = useState('all')
  const [activeFilter, setActiveFilter] = useState('all')
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

  const customFilterFn = useCallback((data, searchTerm) => {
    return data.filter((service) => {
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
  }, [categoryFilter, activeFilter])

  const customSortFn = useCallback((sorted, sortConfig) => {
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
  }, [])

  const {
    data: tableData,
    setData: setTableData,
    searchTerm,
    sortConfig,
    filteredData,
    handleSort,
    handleSearchChange
  } = useDataTable(services, {
    searchFields: ['name', 'description', 'category_name'],
    defaultSortKey: 'name',
    customFilterFn,
    customSortFn
  })

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
              s.duration_unit,
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
        setTableData(servicesResult || [])
        setCategories(categoriesResult || [])
      } catch (err) {
        console.error('Failed to load services:', err)
        setError(t('services.error.load', 'Unable to load services. Please try again later.'))
      } finally {
        setLoading(false)
      }
    }

    fetchServices()
  }, [refreshKey, t, setTableData])

  const handleDelete = async (serviceId, event) => {
    event.stopPropagation()
    if (!window.confirm(t('services.confirm.delete', 'Are you sure you want to delete this service? This will also delete all associated packages.'))) return
    try {
      setDeletingId(serviceId)
      await sql`DELETE FROM services WHERE id = ${serviceId}`
      setServices((prev) => prev.filter((service) => service.id !== serviceId))
      setTableData((prev) => prev.filter((service) => service.id !== serviceId))
    } catch (err) {
      console.error('Failed to delete service:', err)
      alert(t('services.error.delete', 'Unable to delete service. Please try again.'))
    } finally {
      setDeletingId(null)
    }
  }

  const renderCell = (key, row) => {
    const isActive = row.is_active === true || row.is_active === 'true'
    switch (key) {
      case 'base_price':
        return formatCurrency(Number(row.base_price || 0), { minimumFractionDigits: 2 })
      case 'is_active':
        return (
          <span
            className={`inline-flex items-center rounded-full border px-2 py-1 text-xs font-semibold ${
              isActive
                ? 'text-emerald-700 bg-emerald-50 border-emerald-100'
                : 'text-gray-700 bg-gray-50 border-gray-200'
            }`}
          >
            {isActive ? t('services.status.active', 'Active') : t('services.status.inactive', 'Inactive')}
          </span>
        )
      case 'created_at':
        return new Date(row.created_at).toLocaleDateString()
      default:
        return row[key] ?? '—'
    }
  }

  return (
    <div className="px-4 py-6 sm:p-6 lg:p-8">
      <div className="flex flex-col gap-6 bg-white rounded-xl shadow-sm p-4 sm:p-6">
        <PageHeader
          title={t('services.title', 'Services')}
          description={t('services.description', 'Manage service catalog with categories, pricing, and packages.')}
          onAdd={onAddService}
          addLabel={t('services.add', 'Add service')}
          user={user}
          canModifyFn={canModify}
        />

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <SearchBar
              value={searchTerm}
              onChange={handleSearchChange}
              placeholder={t('services.search', 'Search services by name, category, or description...')}
              className="flex-1"
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
            <>
              <div className="hidden md:block">
                <DataTable
                  columns={columns}
                  data={filteredData}
                  sortConfig={sortConfig}
                  onSort={handleSort}
                  onRowClick={onViewService}
                  renderCell={renderCell}
                  emptyMessage={t('services.empty', 'No services found. Try adjusting your search or filters.')}
                />
              </div>

              <div className="md:hidden space-y-3">
                {filteredData.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-gray-300 px-4 py-6 text-center text-sm text-gray-500">
                    {t('services.empty', 'No services found. Try adjusting your search or filters.')}
                  </div>
                ) : (
                  filteredData.map((service) => {
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
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default Services

