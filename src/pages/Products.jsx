import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import sql from '../lib/neon'
import { canModify } from '../lib/permissions'
import { useSettings } from '../context/SettingsContext'
import Pagination from '../components/Pagination'

const PAGE_SIZE = 25

function Products({ onAddProduct = () => {}, onEditProduct = () => {}, onViewProduct = () => {}, refreshKey = 0, user = null }) {
  const [products, setProducts] = useState([])
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
      { key: 'name', label: t('products.table.name', 'Name') },
      { key: 'category_name', label: t('products.table.category', 'Category') },
      { key: 'sku', label: t('products.table.sku', 'SKU') },
      { key: 'price', label: t('products.table.price', 'Price') },
      { key: 'stock_quantity', label: t('products.table.stock', 'Stock') },
      { key: 'is_active', label: t('products.table.status', 'Status') },
    ],
    [t],
  )

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
        setCategories(categoriesResult || [])
      } catch (err) {
        console.error('Failed to load products:', err)
        setError(t('products.error.load', 'Unable to load products. Please try again later.'))
      } finally {
        setLoading(false)
      }
    }

    fetchProducts()
  }, [refreshKey, t])

  const filteredProducts = useMemo(() => {
    return products.filter((product) => {
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
  }, [products, searchTerm, categoryFilter, activeFilter])

  const sortedProducts = useMemo(() => {
    const sorted = [...filteredProducts]
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
  }, [filteredProducts, sortConfig])

  const totalPages = Math.max(1, Math.ceil(sortedProducts.length / PAGE_SIZE))
  const paginatedProducts = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE
    return sortedProducts.slice(start, start + PAGE_SIZE)
  }, [sortedProducts, currentPage])

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

  const handleDelete = async (productId, event) => {
    event.stopPropagation()
    if (!window.confirm(t('products.confirm.delete', 'Are you sure you want to delete this product?'))) return
    try {
      setDeletingId(productId)
      await sql`DELETE FROM products WHERE id = ${productId}`
      setProducts((prev) => prev.filter((product) => product.id !== productId))
    } catch (err) {
      console.error('Failed to delete product:', err)
      alert(t('products.error.delete', 'Unable to delete product. Please try again.'))
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="px-4 py-6 sm:p-6 lg:p-8">
      <div className="flex flex-col gap-6 bg-white rounded-xl shadow-sm p-4 sm:p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{t('products.title', 'Products')}</h1>
            <p className="text-gray-500 text-sm">
              {t('products.description', 'Manage product catalog with pricing, stock, and categories.')}
            </p>
          </div>
          <button
            onClick={onAddProduct}
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
            {t('products.add', 'Add product')}
          </button>
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <input
              type="text"
              value={searchTerm}
              onChange={handleSearchChange}
              placeholder={t('products.search', 'Search products by name, SKU, or category...')}
              className="flex-1 rounded-lg border border-gray-300 px-4 py-2 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-shadow"
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
            <div className="flex flex-col gap-4">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={sortedProducts.length}
                pageSize={PAGE_SIZE}
                onPageChange={handlePageChange}
                itemName={t('products.items', 'products')}
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
                    {paginatedProducts.length === 0 ? (
                      <tr>
                        <td colSpan={columns.length} className="px-6 py-10 text-center text-sm text-gray-500">
                          {t('products.empty', 'No products found. Try adjusting your search or filters.')}
                        </td>
                      </tr>
                    ) : (
                      paginatedProducts.map((product) => {
                        const isActive = product.is_active === true || product.is_active === 'true'
                        return (
                          <tr
                            key={product.id}
                            className="hover:bg-gray-50 cursor-pointer"
                            onClick={() => onViewProduct(product)}
                          >
                            <td className="px-4 py-3 text-sm text-gray-900 font-medium">{product.name || '—'}</td>
                            <td className="px-4 py-3 text-sm text-gray-600">{product.category_name || '—'}</td>
                            <td className="px-4 py-3 text-sm text-gray-600 font-mono">{product.sku || '—'}</td>
                            <td className="px-4 py-3 text-sm text-gray-900">
                              {formatCurrency(Number(product.price || 0), { minimumFractionDigits: 2 })}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600">
                              <span className={Number(product.stock_quantity || 0) < 10 ? 'text-rose-600 font-semibold' : ''}>
                                {product.stock_quantity ?? 0}
                              </span>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <span
                                className={`inline-flex items-center rounded-full border px-2 py-1 text-xs font-semibold ${
                                  isActive
                                    ? 'text-emerald-700 bg-emerald-50 border-emerald-100'
                                    : 'text-gray-700 bg-gray-50 border-gray-200'
                                }`}
                              >
                                {isActive ? t('products.status.active', 'Active') : t('products.status.inactive', 'Inactive')}
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
                {paginatedProducts.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-gray-300 px-4 py-6 text-center text-sm text-gray-500">
                    {t('products.empty', 'No products found. Try adjusting your search or filters.')}
                  </div>
                ) : (
                  paginatedProducts.map((product) => {
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
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                totalItems={sortedProducts.length}
                pageSize={PAGE_SIZE}
                onPageChange={handlePageChange}
                itemName={t('products.items', 'products')}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default Products

