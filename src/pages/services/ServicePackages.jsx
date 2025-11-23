import { useEffect, useMemo, useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import sql from '../../lib/neon'
import { canModify } from '../../lib/permissions'
import { useSettings } from '../../context/SettingsContext'
import { useDataTable } from '../../hooks/useDataTable'
import DataTable from '../../components/ui/DataTable'
import PageHeader from '../../components/layout/PageHeader'
import SearchBar from '../../components/ui/SearchBar'
import MobileCardView from '../../components/ui/MobileCardView'

function ServicePackages({ onAddPackage = () => {}, onEditPackage = () => {}, onViewPackage = () => {}, refreshKey = 0, user = null }) {
  const [packages, setPackages] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
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

  // Helper function to format duration display based on service's duration_unit
  const formatDuration = (pkg) => {
    const durationUnit = pkg.duration_unit || 'none'
    
    if (durationUnit === 'none') {
      return '—'
    }
    
    if (durationUnit === 'hours' && pkg.duration_hours) {
      return `${pkg.duration_hours}h`
    }
    
    if (durationUnit === 'days' && pkg.duration_days) {
      return `${pkg.duration_days}d`
    }
    
    if (durationUnit === 'months' && pkg.duration_months) {
      return `${pkg.duration_months}mo`
    }
    
    return '—'
  }

  // Custom filter function that searches all columns
  const customFilterFn = useCallback((data, searchTerm) => {
    if (!data || !Array.isArray(data)) return []
    
    // If no search term, return all data
    if (!searchTerm || !searchTerm.trim()) return data
    
    const query = searchTerm.toLowerCase()
    
    return data.filter((pkg) => {
      if (!pkg) return false
      
      // Search across all fields
      return Object.values(pkg)
        .filter(value => value != null && value !== undefined)
        .some(value => value.toString().toLowerCase().includes(query))
    })
  }, [])

  const customSortFn = useCallback((sorted, sortConfig) => {
    sorted.sort((a, b) => {
      let aValue = a[sortConfig.key] ?? ''
      let bValue = b[sortConfig.key] ?? ''

      // Handle numeric sorting for price and duration
      if (sortConfig.key === 'price' || sortConfig.key === 'duration_hours') {
        // For duration, use the appropriate field based on duration_unit
        if (sortConfig.key === 'duration_hours') {
          aValue = Number(a.duration_hours || a.duration_days || a.duration_months) || 0
          bValue = Number(b.duration_hours || b.duration_days || b.duration_months) || 0
        } else {
          aValue = Number(aValue) || 0
          bValue = Number(bValue) || 0
        }
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
  }, [])

  const {
    data: tableData,
    setData: setTableData,
    searchTerm,
    sortConfig,
    filteredData,
    handleSort,
    handleSearchChange
  } = useDataTable(packages, {
    defaultSortKey: 'name',
    customFilterFn,
    customSortFn
  })

  useEffect(() => {
    const fetchPackages = async () => {
      try {
        setLoading(true)
        setError(null)
        const packagesResult = await sql`
          SELECT 
            sp.id,
            sp.name,
            sp.duration_hours,
            sp.duration_days,
            sp.duration_months,
            sp.price,
            sp.currency,
            sp.description,
            sp.is_active,
            sp.created_at,
            sp.updated_at,
            s.id AS service_id,
            s.name AS service_name,
            s.duration_unit,
            sc.id AS category_id,
            sc.name AS category_name
          FROM service_packages sp
          LEFT JOIN services s ON sp.service_id = s.id
          LEFT JOIN service_categories sc ON s.category_id = sc.id
          ORDER BY s.name ASC, 
            CASE 
              WHEN sp.duration_hours IS NOT NULL THEN sp.duration_hours
              WHEN sp.duration_days IS NOT NULL THEN sp.duration_days
              WHEN sp.duration_months IS NOT NULL THEN sp.duration_months
              ELSE 0
            END ASC
        `
        setPackages(packagesResult || [])
        setTableData(packagesResult || [])
      } catch (err) {
        console.error('Failed to load service packages:', err)
        setError(t('servicePackages.error.load', 'Unable to load service packages. Please try again later.'))
      } finally {
        setLoading(false)
      }
    }

    fetchPackages()
  }, [refreshKey, t, setTableData])

  const renderCell = (key, row) => {
    const isActive = row.is_active === true || row.is_active === 'true'
    switch (key) {
      case 'duration_hours':
        return formatDuration(row)
      case 'price':
        return formatCurrency(Number(row.price || 0), { minimumFractionDigits: 2 })
      case 'is_active':
        return (
          <span
            className={`inline-flex items-center rounded-full border px-2 py-1 text-xs font-semibold ${
              isActive
                ? 'text-emerald-700 bg-emerald-50 border-emerald-100'
                : 'text-gray-700 bg-gray-50 border-gray-200'
            }`}
          >
            {isActive ? t('servicePackages.status.active', 'Active') : t('servicePackages.status.inactive', 'Inactive')}
          </span>
        )
      default:
        return row[key] ?? '—'
    }
  }

  return (
    <div className="px-4 py-6 sm:p-6 lg:p-8">
      <div className="flex flex-col gap-6 bg-white rounded-xl shadow-sm p-4 sm:p-6">
        <PageHeader
          title={t('servicePackages.title', 'Service Packages')}
          description={t('servicePackages.description', 'View and manage service packages across all services.')}
          onAdd={onAddPackage}
          addLabel={t('servicePackages.add', 'Add package')}
          user={user}
          canModifyFn={canModify}
        />

        <div className="flex flex-col gap-4">
          <SearchBar
            value={searchTerm}
            onChange={handleSearchChange}
            placeholder={t('servicePackages.search', 'Search all columns...')}
          />

          {loading && <div className="text-gray-600 text-sm">{t('servicePackages.loading', 'Loading packages...')}</div>}
          {error && <div className="text-red-600 text-sm">{error}</div>}
          {!loading && !error && (
            <>
              <div className="hidden md:block">
                <DataTable
                  columns={columns}
                  data={filteredData}
                  sortConfig={sortConfig}
                  onSort={handleSort}
                  onRowClick={onViewPackage}
                  renderCell={renderCell}
                  emptyMessage={t('servicePackages.empty', 'No packages found. Try adjusting your search or filters.')}
                />
              </div>

              <MobileCardView
                data={filteredData}
                emptyMessage={t('servicePackages.empty', 'No packages found. Try adjusting your search or filters.')}
                onItemClick={onViewPackage}
                renderCard={(pkg) => {
                  const isActive = pkg.is_active === true || pkg.is_active === 'true'
                  return (
                    <>
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
                          <dd>{formatDuration(pkg)}</dd>
                        </div>
                        <div>
                          <dt className="text-gray-400 text-xs uppercase">{t('servicePackages.mobile.price', 'Price')}</dt>
                          <dd>{formatCurrency(Number(pkg.price || 0))}</dd>
                        </div>
                      </dl>
                    </>
                  )
                }}
              />
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default ServicePackages

