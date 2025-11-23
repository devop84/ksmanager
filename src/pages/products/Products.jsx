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

function Products({ onAddProduct = () => {}, onEditProduct = () => {}, onViewProduct = () => {}, refreshKey = 0, user = null }) {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [deletingId, setDeletingId] = useState(null)
  const { formatCurrency } = useSettings()
  const { t } = useTranslation()

  const columns = useMemo(
    () => [
      { key: 'name', label: t('products.table.name', 'Name') },
      { key: 'category_name', label: t('products.table.category', 'Category') },
      { key: 'sku', label: t('products.table.sku', 'SKU') },
      { key: 'price', label: t('products.table.price', 'Price') },
      { key: 'stock_quantity', label: t('products.table.stock', 'Stock') },
      { key: 'is_active', label: t('products.table.status', 'Status') },
    ],
    [t],
  )

  // Custom filter function that searches all columns
  const customFilterFn = useCallback((data, searchTerm) => {
    if (!data || !Array.isArray(data)) return []
    
    // If no search term, return all data
    if (!searchTerm || !searchTerm.trim()) return data
    
    const query = searchTerm.toLowerCase()
    
    return data.filter((product) => {
      if (!product) return false
      
      // Search across all fields
      return Object.values(product)
        .filter(value => value != null && value !== undefined)
        .some(value => value.toString().toLowerCase().includes(query))
    })
  }, [])

  const customSortFn = useCallback((sorted, sortConfig) => {
    sorted.sort((a, b) => {
      let aValue = a[sortConfig.key] ?? ''
      let bValue = b[sortConfig.key] ?? ''

      // Handle numeric sorting for price and stock_quantity
      if (sortConfig.key === 'price' || sortConfig.key === 'stock_quantity') {
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
  }, [])

  const {
    data: tableData,
    setData: setTableData,
    searchTerm,
    sortConfig,
    filteredData,
    handleSort,
    handleSearchChange
  } = useDataTable(products, {
    defaultSortKey: 'name',
    customFilterFn,
    customSortFn
  })

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true)
        setError(null)
        const productsResult = await sql`
          SELECT 
            p.id,
            p.name,
            p.description,
            p.price,
            p.currency,
            p.sku,
            p.stock_quantity,
            p.is_active,
            p.created_at,
            p.updated_at,
            pc.name AS category_name,
            pc.id AS category_id
          FROM products p
          LEFT JOIN product_categories pc ON p.category_id = pc.id
          ORDER BY p.name ASC
        `
        setProducts(productsResult || [])
        setTableData(productsResult || [])
      } catch (err) {
        console.error('Failed to load products:', err)
        setError(t('products.error.load', 'Unable to load products. Please try again later.'))
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [refreshKey, t, setTableData])

  const handleDelete = async (productId, event) => {
    event.stopPropagation()
    if (!window.confirm(t('products.confirm.delete', 'Are you sure you want to delete this product?'))) return
    try {
      setDeletingId(productId)
      await sql`DELETE FROM products WHERE id = ${productId}`
      setProducts((prev) => prev.filter((product) => product.id !== productId))
      setTableData((prev) => prev.filter((product) => product.id !== productId))
    } catch (err) {
      console.error('Failed to delete product:', err)
      alert(t('products.error.delete', 'Unable to delete product. Please try again.'))
    } finally {
      setDeletingId(null)
    }
  }

  const renderCell = (key, row) => {
    const isActive = row.is_active === true || row.is_active === 'true'
    switch (key) {
      case 'price':
        return formatCurrency(Number(row.price || 0), { minimumFractionDigits: 2 })
      case 'stock_quantity':
        return (
          <span className={Number(row.stock_quantity || 0) < 10 ? 'text-rose-600 font-semibold' : ''}>
            {row.stock_quantity ?? 0}
          </span>
        )
      case 'is_active':
        return (
          <span
            className={`inline-flex items-center rounded-full border px-2 py-1 text-xs font-semibold ${
              isActive
                ? 'text-emerald-700 bg-emerald-50 border-emerald-100'
                : 'text-gray-700 bg-gray-50 border-gray-200'
            }`}
          >
            {isActive ? t('products.status.active', 'Active') : t('products.status.inactive', 'Inactive')}
          </span>
        )
      case 'sku':
        return <span className="font-mono">{row.sku || '—'}</span>
      default:
        return row[key] ?? '—'
    }
  }

  return (
    <div className="px-4 py-6 sm:p-6 lg:p-8">
      <div className="flex flex-col gap-6 bg-white rounded-xl shadow-sm p-4 sm:p-6">
        <PageHeader
          title={t('products.title', 'Products')}
          description={t('products.description', 'Manage product catalog with pricing, stock, and categories.')}
          onAdd={onAddProduct}
          addLabel={t('products.add', 'Add product')}
          user={user}
          canModifyFn={canModify}
        />

        <div className="flex flex-col gap-4">
          <SearchBar
            value={searchTerm}
            onChange={handleSearchChange}
            placeholder={t('products.search', 'Search all columns...')}
          />

          {loading && <div className="text-gray-600 text-sm">{t('products.loading', 'Loading products...')}</div>}
          {error && <div className="text-red-600 text-sm">{error}</div>}
          {!loading && !error && (
            <>
              <div className="hidden md:block">
                <DataTable
                  columns={columns}
                  data={filteredData}
                  sortConfig={sortConfig}
                  onSort={handleSort}
                  onRowClick={onViewProduct}
                  renderCell={renderCell}
                  emptyMessage={t('products.empty', 'No products found. Try adjusting your search or filters.')}
                />
              </div>

              <MobileCardView
                data={filteredData}
                emptyMessage={t('products.empty', 'No products found. Try adjusting your search or filters.')}
                onItemClick={onViewProduct}
                renderCard={(product) => {
                  const isActive = product.is_active === true || product.is_active === 'true'
                  return (
                    <>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-base font-semibold text-gray-900">{product.name || '—'}</p>
                          <p className="text-sm text-gray-500">{product.category_name || '—'}</p>
                        </div>
                        <span
                          className={`inline-flex items-center rounded-full border px-2 py-1 text-xs font-semibold ${
                            isActive
                              ? 'text-emerald-700 bg-emerald-50 border-emerald-100'
                              : 'text-gray-700 bg-gray-50 border-gray-200'
                          }`}
                        >
                          {isActive ? t('products.status.active', 'Active') : t('products.status.inactive', 'Inactive')}
                        </span>
                      </div>
                      <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 text-sm text-gray-600">
                        <div>
                          <dt className="text-gray-400 text-xs uppercase">{t('products.mobile.sku', 'SKU')}</dt>
                          <dd className="font-mono">{product.sku || '—'}</dd>
                        </div>
                        <div>
                          <dt className="text-gray-400 text-xs uppercase">{t('products.mobile.price', 'Price')}</dt>
                          <dd>{formatCurrency(Number(product.price || 0))}</dd>
                        </div>
                        <div>
                          <dt className="text-gray-400 text-xs uppercase">{t('products.mobile.stock', 'Stock')}</dt>
                          <dd className={Number(product.stock_quantity || 0) < 10 ? 'text-rose-600 font-semibold' : ''}>
                            {product.stock_quantity ?? 0}
                          </dd>
                        </div>
                      </dl>
                      {product.description && (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <p className="text-sm text-gray-600">{product.description}</p>
                        </div>
                      )}
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

export default Products

