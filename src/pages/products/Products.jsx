import { useEffect, useMemo, useState, useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import sql from '../../lib/neon'
import { canModify } from '../../lib/permissions'
import { useSettings } from '../../context/SettingsContext'
import { useDataTable } from '../../hooks/useDataTable'
import DataTable from '../../components/DataTable'
import PageHeader from '../../components/PageHeader'
import SearchBar from '../../components/SearchBar'

function Products({ onAddProduct = () => {}, onEditProduct = () => {}, onViewProduct = () => {}, refreshKey = 0, user = null }) {
  const [products, setProducts] = useState([])
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
      { key: 'name', label: t('products.table.name', 'Name') },
      { key: 'category_name', label: t('products.table.category', 'Category') },
      { key: 'sku', label: t('products.table.sku', 'SKU') },
      { key: 'price', label: t('products.table.price', 'Price') },
      { key: 'stock_quantity', label: t('products.table.stock', 'Stock') },
      { key: 'is_active', label: t('products.table.status', 'Status') },
    ],
    [t],
  )

  const customFilterFn = useCallback((data, searchTerm) => {
    return data.filter((product) => {
      if (categoryFilter !== 'all' && product.category_id?.toString() !== categoryFilter) return false
      if (activeFilter !== 'all') {
        const isActive = product.is_active === true || product.is_active === 'true'
        if (activeFilter === 'active' && !isActive) return false
        if (activeFilter === 'inactive' && isActive) return false
      }
      if (!searchTerm.trim()) return true
      const query = searchTerm.toLowerCase()
      return [
        product.name,
        product.sku,
        product.description,
        product.category_name
      ]
        .filter((value) => value !== null && value !== undefined)
        .some((value) => value.toString().toLowerCase().includes(query))
    })
  }, [categoryFilter, activeFilter])

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
    searchFields: ['name', 'sku', 'description', 'category_name'],
    defaultSortKey: 'name',
    customFilterFn,
    customSortFn
  })

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true)
        setError(null)
        const [productsResult, categoriesResult] = await Promise.all([
          sql`
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
          `,
          sql`
            SELECT id, name
            FROM product_categories
            ORDER BY name ASC
          `
        ])
        setProducts(productsResult || [])
        setTableData(productsResult || [])
        setCategories(categoriesResult || [])
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
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <SearchBar
              value={searchTerm}
              onChange={handleSearchChange}
              placeholder={t('products.search', 'Search products by name, SKU, or category...')}
              className="flex-1"
            />
            <div className="flex gap-2">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
              >
                <option value="all">{t('products.filters.allCategories', 'All Categories')}</option>
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
                <option value="all">{t('products.filters.allStatus', 'All Status')}</option>
                <option value="active">{t('products.filters.active', 'Active')}</option>
                <option value="inactive">{t('products.filters.inactive', 'Inactive')}</option>
              </select>
            </div>
          </div>

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

              <div className="md:hidden space-y-3">
                {filteredData.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-gray-300 px-4 py-6 text-center text-sm text-gray-500">
                    {t('products.empty', 'No products found. Try adjusting your search or filters.')}
                  </div>
                ) : (
                  filteredData.map((product) => {
                    const isActive = product.is_active === true || product.is_active === 'true'
                    return (
                      <div
                        key={product.id}
                        className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                        onClick={() => onViewProduct(product)}
                      >
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

export default Products

