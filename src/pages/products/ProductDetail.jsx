import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import sql from '../../lib/neon'
import { canModify } from '../../lib/permissions'
import { useSettings } from '../../context/SettingsContext'
import DetailInfoPanel from '../../components/DetailInfoPanel'

function ProductDetail({ productId, onEdit, onDelete, onBack, user = null }) {
  const { t } = useTranslation()
  const { formatCurrency, formatDateTime } = useSettings()
  const [product, setProduct] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true)
        setError(null)
        const result = await sql`
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
            pc.id AS category_id,
            pc.name AS category_name,
            pc.description AS category_description
          FROM products p
          LEFT JOIN product_categories pc ON p.category_id = pc.id
          WHERE p.id = ${productId}
          LIMIT 1
        `
        
        if (result && result.length > 0) {
          setProduct(result[0])
        } else {
          setError(t('productDetail.notFound', 'Product not found'))
        }
      } catch (err) {
        console.error('Failed to load product:', err)
        setError(t('productDetail.error.load', 'Unable to load product. Please try again later.'))
      } finally {
        setLoading(false)
      }
    }

    if (productId) {
      fetchProduct()
    }
  }, [productId, t])

  const handleDelete = async () => {
    if (!window.confirm(t('productDetail.confirm.delete', 'Are you sure you want to delete this product? This action cannot be undone.'))) {
      return
    }

    try {
      setDeleting(true)
      await sql`DELETE FROM products WHERE id = ${productId}`
      onDelete?.()
    } catch (err) {
      console.error('Failed to delete product:', err)
      alert(t('productDetail.error.delete', 'Unable to delete product. Please try again.'))
    } finally {
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="px-4 py-6 sm:p-6 lg:p-8">
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <div className="text-gray-600">{t('productDetail.loading', 'Loading product details...')}</div>
        </div>
      </div>
    )
  }

  if (error || !product) {
    return (
      <div className="px-4 py-6 sm:p-6 lg:p-8">
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <div className="text-red-600">{error || t('productDetail.notFound', 'Product not found')}</div>
          {onBack && (
            <button
              onClick={onBack}
              className="mt-4 rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
            >
              {t('productDetail.back', 'Back')}
            </button>
          )}
        </div>
      </div>
    )
  }

  const isActive = product.is_active === true || product.is_active === 'true'
  const stockQuantity = Number(product.stock_quantity || 0)
  const isLowStock = stockQuantity < 10

  return (
    <div className="px-4 py-6 sm:p-6 lg:p-8">
      <div className="rounded-xl bg-white shadow-sm">
        {/* Header */}
        <div className="p-6">
          <button
            onClick={onBack}
            className="mb-6 flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            {t('productDetail.back', 'Back')}
          </button>
          
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-4 mb-2">
                <h1 className="text-3xl font-bold text-gray-900">{product.name || t('products.title', 'Product')}</h1>
                <span
                  className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${
                    isActive
                      ? 'text-emerald-700 bg-emerald-50 border-emerald-100'
                      : 'text-gray-700 bg-gray-50 border-gray-200'
                  }`}
                >
                  {isActive ? t('productDetail.status.active', 'Active') : t('productDetail.status.inactive', 'Inactive')}
                </span>
              </div>
              {product.category_name && (
                <p className="text-gray-500 text-sm">
                  {t('productDetail.category', 'Category')}: <span className="font-medium">{product.category_name}</span>
                </p>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => onEdit?.(product)}
                disabled={!canModify(user)}
                className="inline-flex items-center justify-center p-2 rounded-lg border border-gray-300 bg-white text-gray-700 shadow-sm hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title={t('productDetail.actions.edit', 'Edit product')}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536M16.732 3.732a2.5 2.5 0 113.536 3.536L7.5 20.036H4v-3.572L16.732 3.732z" />
                </svg>
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting || !canModify(user)}
                className="inline-flex items-center justify-center p-2 rounded-lg border border-red-300 bg-white text-red-700 shadow-sm hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title={t('productDetail.actions.delete', 'Delete product')}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="px-6 pb-6">
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Left Column - Product Details */}
            <div className="lg:col-span-2 space-y-6">
              {/* Price and Stock */}
              <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  {t('productDetail.pricing.title', 'Pricing & Stock')}
                </h2>
                <dl className="grid gap-4 md:grid-cols-2">
                  <div>
                    <dt className="text-xs font-medium text-gray-500 uppercase">{t('productDetail.pricing.price', 'Price')}</dt>
                    <dd className="mt-1 text-2xl font-bold text-gray-900">
                      {formatCurrency(Number(product.price || 0), { minimumFractionDigits: 2 })}
                    </dd>
                    <dd className="mt-1 text-sm text-gray-500">{product.currency || 'BRL'}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-gray-500 uppercase">{t('productDetail.pricing.stock', 'Stock Quantity')}</dt>
                    <dd className={`mt-1 text-2xl font-bold ${isLowStock ? 'text-rose-700' : 'text-gray-900'}`}>
                      {stockQuantity}
                    </dd>
                    {isLowStock && (
                      <dd className="mt-1 text-sm text-rose-600 font-medium">
                        {t('productDetail.pricing.lowStock', 'Low stock warning')}
                      </dd>
                    )}
                  </div>
                </dl>
              </div>

              {/* Description */}
              {product.description && (
                <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">
                    {t('productDetail.description.title', 'Description')}
                  </h2>
                  <p className="text-sm text-gray-700 whitespace-pre-wrap">{product.description}</p>
                </div>
              )}

              {/* Category Details */}
              {product.category_description && (
                <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">
                    {t('productDetail.category.title', 'Category Information')}
                  </h2>
                  <p className="text-sm text-gray-700">{product.category_description}</p>
                </div>
              )}
            </div>

            {/* Right Column - Metadata */}
            <div className="lg:col-span-1">
              <DetailInfoPanel
                title={t('productDetail.info.title', 'Product Information')}
                onEdit={() => onEdit?.(product)}
                onDelete={handleDelete}
                user={user}
                deleting={deleting}
              >
                <dl className="space-y-4 text-sm">
                  <div>
                    <dt className="text-xs font-medium text-gray-500 uppercase">{t('productDetail.info.id', 'ID')}</dt>
                    <dd className="mt-1 text-gray-900 font-mono">#{product.id}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-gray-500 uppercase">{t('productDetail.info.name', 'Name')}</dt>
                    <dd className="mt-1 text-gray-900">{product.name || '—'}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-gray-500 uppercase">{t('productDetail.info.category', 'Category')}</dt>
                    <dd className="mt-1 text-gray-900">{product.category_name || '—'}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-gray-500 uppercase">{t('productDetail.info.description', 'Description')}</dt>
                    <dd className="mt-1 text-gray-900 whitespace-pre-wrap">{product.description || '—'}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-gray-500 uppercase">{t('productDetail.info.price', 'Price')}</dt>
                    <dd className="mt-1 text-gray-900">{formatCurrency(Number(product.price || 0), { minimumFractionDigits: 2 })}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-gray-500 uppercase">{t('productDetail.info.currency', 'Currency')}</dt>
                    <dd className="mt-1 text-gray-900">{product.currency || 'BRL'}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-gray-500 uppercase">{t('productDetail.info.sku', 'SKU')}</dt>
                    <dd className="mt-1 text-gray-900 font-mono">{product.sku || '—'}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-gray-500 uppercase">{t('productDetail.info.stock', 'Stock Quantity')}</dt>
                    <dd className="mt-1 text-gray-900">{stockQuantity}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-gray-500 uppercase">{t('productDetail.info.active', 'Active')}</dt>
                    <dd className="mt-1 text-gray-900">{isActive ? t('productDetail.status.active', 'Active') : t('productDetail.status.inactive', 'Inactive')}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-gray-500 uppercase">{t('productDetail.info.created', 'Created')}</dt>
                    <dd className="mt-1 text-gray-900">{formatDateTime(product.created_at)}</dd>
                  </div>
                  {product.updated_at && (
                    <div>
                      <dt className="text-xs font-medium text-gray-500 uppercase">{t('productDetail.info.updated', 'Last update')}</dt>
                      <dd className="mt-1 text-gray-900">{formatDateTime(product.updated_at)}</dd>
                    </div>
                  )}
                </dl>
              </DetailInfoPanel>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProductDetail

