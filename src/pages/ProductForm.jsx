import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import sql from '../lib/neon'

const initialFormState = {
  name: '',
  description: '',
  category_id: '',
  price: '',
  currency: 'BRL',
  sku: '',
  stock_quantity: '0',
  is_active: true
}

function ProductForm({ product, onCancel, onSaved }) {
  const isEditing = Boolean(product?.id)
  const { t } = useTranslation()
  const [formData, setFormData] = useState(initialFormState)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [categories, setCategories] = useState([])

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name || '',
        description: product.description || '',
        category_id: product.category_id ?? '',
        price: product.price ?? '',
        currency: product.currency || 'BRL',
        sku: product.sku || '',
        stock_quantity: product.stock_quantity ?? '0',
        is_active: product.is_active !== false && product.is_active !== 'false'
      })
    } else {
      setFormData(initialFormState)
    }
  }, [product])

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const result = await sql`
          SELECT id, name
          FROM product_categories
          ORDER BY name ASC
        `
        setCategories(result || [])
      } catch (err) {
        console.error('Failed to load product categories:', err)
      }
    }

    fetchCategories()
  }, [])

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSaving(true)
    setError(null)

    const priceValue = formData.price !== '' ? Number(formData.price) : null
    const stockQuantityValue = formData.stock_quantity !== '' ? Number(formData.stock_quantity) : 0
    const categoryIdValue = formData.category_id ? Number(formData.category_id) : null

    if (!formData.name.trim()) {
      setError(t('productForm.errors.nameRequired', 'Product name is required.'))
      setSaving(false)
      return
    }

    if (categoryIdValue === null) {
      setError(t('productForm.errors.categoryRequired', 'Product category is required.'))
      setSaving(false)
      return
    }

    if (priceValue === null || priceValue < 0) {
      setError(t('productForm.errors.priceRequired', 'Valid price is required.'))
      setSaving(false)
      return
    }

    try {
      if (isEditing) {
        await sql`
          UPDATE products
          SET name = ${formData.name},
              description = ${formData.description || null},
              category_id = ${categoryIdValue},
              price = ${priceValue},
              currency = ${formData.currency},
              sku = ${formData.sku || null},
              stock_quantity = ${stockQuantityValue},
              is_active = ${formData.is_active},
              updated_at = CURRENT_TIMESTAMP
          WHERE id = ${product.id}
        `
      } else {
        await sql`
          INSERT INTO products (name, description, category_id, price, currency, sku, stock_quantity, is_active)
          VALUES (${formData.name}, ${formData.description || null}, ${categoryIdValue}, ${priceValue}, ${formData.currency}, ${formData.sku || null}, ${stockQuantityValue}, ${formData.is_active})
        `
      }

      onSaved?.()
    } catch (err) {
      console.error('Failed to save product:', err)
      setError(t('productForm.errors.save', 'Unable to save product. Please try again.'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="px-4 py-6 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-3xl rounded-xl bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {isEditing ? t('productForm.title.edit', 'Edit Product') : t('productForm.title.new', 'Add Product')}
            </h1>
            <p className="text-gray-500 text-sm">
              {isEditing
                ? t('productForm.subtitle.edit', 'Update product information and save changes.')
                : t('productForm.subtitle.new', 'Fill out the details to add a new product.')}
            </p>
          </div>
          <button
            onClick={onCancel}
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
          >
            {t('productForm.buttons.cancel', 'Cancel')}
          </button>
        </div>

        {error && (
          <div className="mt-4 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="name">
              {t('productForm.fields.name', 'Product Name *')}
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              value={formData.name}
              onChange={handleChange}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="category_id">
              {t('productForm.fields.category', 'Category *')}
            </label>
            <select
              id="category_id"
              name="category_id"
              required
              value={formData.category_id}
              onChange={handleChange}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
            >
              <option value="">{t('productForm.fields.selectCategory', 'Select a category...')}</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="price">
                {t('productForm.fields.price', 'Price *')}
              </label>
              <div className="flex">
                <input
                  id="price"
                  name="price"
                  type="number"
                  step="0.01"
                  min="0"
                  required
                  value={formData.price}
                  onChange={handleChange}
                  className="w-full rounded-l-lg border border-gray-300 px-4 py-2 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                />
                <select
                  name="currency"
                  value={formData.currency}
                  onChange={handleChange}
                  className="rounded-r-lg border border-l-0 border-gray-300 bg-gray-50 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                >
                  <option value="BRL">BRL</option>
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                </select>
              </div>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="stock_quantity">
                {t('productForm.fields.stock', 'Stock Quantity')}
              </label>
              <input
                id="stock_quantity"
                name="stock_quantity"
                type="number"
                min="0"
                value={formData.stock_quantity}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
              />
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="sku">
              {t('productForm.fields.sku', 'SKU (Stock Keeping Unit)')}
            </label>
            <input
              id="sku"
              name="sku"
              type="text"
              value={formData.sku}
              onChange={handleChange}
              placeholder={t('productForm.fields.skuPlaceholder', 'e.g., TSH-001')}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 font-mono"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="description">
              {t('productForm.fields.description', 'Description')}
            </label>
            <textarea
              id="description"
              name="description"
              rows="4"
              value={formData.description}
              onChange={handleChange}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
            />
          </div>

          <div className="flex items-center">
            <input
              id="is_active"
              name="is_active"
              type="checkbox"
              checked={formData.is_active}
              onChange={handleChange}
              className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            <label htmlFor="is_active" className="ml-2 block text-sm text-gray-700">
              {t('productForm.fields.isActive', 'Product is active and available for sale')}
            </label>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onCancel}
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
            >
              {t('productForm.buttons.cancel', 'Cancel')}
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving
                ? t('productForm.buttons.saving', 'Saving...')
                : isEditing
                ? t('productForm.buttons.update', 'Update Product')
                : t('productForm.buttons.create', 'Create Product')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default ProductForm

