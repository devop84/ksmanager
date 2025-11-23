import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import sql from '../../lib/neon'

const initialFormState = {
  customer_id: '',
  status: 'open',
  agency_id: '',
  discount_amount: '0',
  tax_amount: '0',
  currency: 'BRL',
  note: ''
}

function OrderForm({ order, customer, onCancel, onSaved }) {
  const isEditing = Boolean(order?.id)
  const { t } = useTranslation()
  const [formData, setFormData] = useState(initialFormState)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [customers, setCustomers] = useState([])
  const [agencies, setAgencies] = useState([])
  const [openOrderWarning, setOpenOrderWarning] = useState(null)

  useEffect(() => {
    if (order) {
      setFormData({
        customer_id: order.customer_id?.toString() || '',
        status: order.status || 'open',
        agency_id: order.agency_id?.toString() || '',
        discount_amount: order.discount_amount?.toString() || '0',
        tax_amount: order.tax_amount?.toString() || '0',
        currency: order.currency || 'BRL',
        note: order.note || ''
      })
    } else if (customer) {
      // Pre-fill customer if coming from customer detail
      setFormData({
        ...initialFormState,
        customer_id: customer.id.toString(),
        agency_id: customer.agency_id?.toString() || ''
      })
      // Check for open order when customer is pre-filled
      const checkOpenOrder = async () => {
        try {
          const existingOpenOrder = await sql`
            SELECT id, order_number, status
            FROM orders
            WHERE customer_id = ${customer.id}
              AND status = 'open'
            LIMIT 1
          `
          if (existingOpenOrder && existingOpenOrder.length > 0) {
            setOpenOrderWarning({
              orderNumber: existingOpenOrder[0].order_number || existingOpenOrder[0].id,
              orderId: existingOpenOrder[0].id
            })
          }
        } catch (err) {
          console.error('Failed to check for open orders:', err)
        }
      }
      checkOpenOrder()
    } else {
      setFormData(initialFormState)
      setOpenOrderWarning(null)
    }
  }, [order, customer])

  useEffect(() => {
    // Load dropdown options
    const fetchData = async () => {
      try {
        const [customersResult, agenciesResult] = await Promise.all([
          sql`SELECT id, fullname, agency_id FROM customers ORDER BY fullname ASC`,
          sql`SELECT id, name FROM agencies ORDER BY name ASC`
        ])
        setCustomers(customersResult || [])
        setAgencies(agenciesResult || [])
      } catch (err) {
        console.error('Failed to load form data:', err)
      }
    }
    fetchData()
  }, [])

  const handleChange = async (event) => {
    const { name, value } = event.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    
    // If customer is selected, set their agency from the loaded customers data
    if (name === 'customer_id' && value && !isEditing) {
      const selectedCustomer = customers.find(c => c.id.toString() === value)
      if (selectedCustomer && selectedCustomer.agency_id) {
        setFormData((prev) => ({ ...prev, agency_id: selectedCustomer.agency_id.toString() }))
      } else {
        // Clear agency if customer has no agency
        setFormData((prev) => ({ ...prev, agency_id: '' }))
      }
      
      // Check if customer has an open order
      try {
        const existingOpenOrder = await sql`
          SELECT id, order_number, status
          FROM orders
          WHERE customer_id = ${Number(value)}
            AND status = 'open'
          LIMIT 1
        `
        
        if (existingOpenOrder && existingOpenOrder.length > 0) {
          setOpenOrderWarning({
            orderNumber: existingOpenOrder[0].order_number || existingOpenOrder[0].id,
            orderId: existingOpenOrder[0].id
          })
        } else {
          setOpenOrderWarning(null)
        }
      } catch (err) {
        console.error('Failed to check for open orders:', err)
        setOpenOrderWarning(null)
      }
    } else if (name === 'customer_id' && !value) {
      setOpenOrderWarning(null)
    }
  }


  const handleSubmit = async (event) => {
    event.preventDefault()
    
    // Prevent double submission
    if (saving) {
      return
    }
    
    setSaving(true)
    setError(null)

    if (!formData.customer_id) {
      setError(t('orderForm.errors.customerRequired', 'Customer is required.'))
      setSaving(false)
      return
    }

    try {
      let orderId

      if (isEditing) {
        // Check if status is changing from 'cancelled' to 'open' (reopening order)
        const wasCancelled = order.status === 'cancelled'
        const isNowOpen = formData.status === 'open'
        const isReopening = wasCancelled && isNowOpen
        
        // Update existing order
        await sql`
          UPDATE orders
          SET customer_id = ${Number(formData.customer_id)},
              status = ${formData.status},
              agency_id = ${formData.agency_id ? Number(formData.agency_id) : null},
              discount_amount = ${Number(formData.discount_amount || 0)},
              tax_amount = ${Number(formData.tax_amount || 0)},
              currency = ${formData.currency},
              note = ${formData.note || null},
              updated_at = CURRENT_TIMESTAMP,
              cancelled_at = CASE WHEN ${formData.status} = 'open' THEN NULL ELSE cancelled_at END
          WHERE id = ${order.id}
        `
        
        // If reopening order, recreate credits for all order items
        if (isReopening) {
          // Get all order items for this order
          const orderItems = await sql`
            SELECT id, item_type, item_id, quantity, order_id
            FROM order_items
            WHERE order_id = ${order.id}
          `
          
          // Recreate credits for each order item
          for (const item of orderItems || []) {
            if (item.item_type === 'service_package') {
              // Get service package details
              const pkgResult = await sql`
                SELECT sp.*, s.duration_unit, s.id as service_id
                FROM service_packages sp
                JOIN services s ON sp.service_id = s.id
                WHERE sp.id = ${item.item_id}
                LIMIT 1
              `
              
              if (pkgResult && pkgResult.length > 0) {
                const pkg = pkgResult[0]
                
                // Only create credit if duration_unit is not 'none'
                if (pkg.duration_unit !== 'none') {
                  let credit_total_hours = null
                  let credit_total_days = null
                  let credit_total_months = null
                  
                  // Determine which duration field to use
                  if (pkg.duration_unit === 'hours') {
                    credit_total_hours = Number(pkg.duration_hours || 0) * Number(item.quantity || 1)
                  } else if (pkg.duration_unit === 'days') {
                    credit_total_days = Number(pkg.duration_days || 0) * Number(item.quantity || 1)
                  } else if (pkg.duration_unit === 'months') {
                    credit_total_months = Number(pkg.duration_months || 0) * Number(item.quantity || 1)
                  }
                  
                  // Create credit and get the credit ID
                  const creditResult = await sql`
                    INSERT INTO customer_service_credits (
                      customer_id,
                      order_item_id,
                      service_package_id,
                      service_id,
                      total_hours,
                      total_days,
                      total_months,
                      status
                    )
                    VALUES (
                      ${Number(formData.customer_id)},
                      ${item.id},
                      ${pkg.id},
                      ${pkg.service_id},
                      ${credit_total_hours},
                      ${credit_total_days},
                      ${credit_total_months},
                      'active'
                    )
                    RETURNING id
                  `
                  
                  // Allocate orphaned appointments to this new credit
                  if (creditResult && creditResult.length > 0) {
                    const creditId = creditResult[0].id
                    await sql`
                      UPDATE scheduled_appointments
                      SET credit_id = ${creditId}
                      WHERE customer_id = ${Number(formData.customer_id)}
                        AND service_id = ${pkg.service_id}
                        AND credit_id IS NULL
                        AND status IN ('scheduled', 'completed')
                        AND cancelled_at IS NULL
                    `
                  }
                }
              }
            } else if (item.item_type === 'service') {
              // Get service details
              const svcResult = await sql`
                SELECT id as service_id, duration_unit
                FROM services
                WHERE id = ${item.item_id}
                LIMIT 1
              `
              
              if (svcResult && svcResult.length > 0) {
                const svc = svcResult[0]
                
                // Only create credit if duration_unit is not 'none'
                if (svc.duration_unit !== 'none') {
                  let credit_total_hours = null
                  let credit_total_days = null
                  let credit_total_months = null
                  
                  // For direct services, use 1 unit per quantity
                  if (svc.duration_unit === 'hours') {
                    credit_total_hours = 1 * Number(item.quantity || 1)
                  } else if (svc.duration_unit === 'days') {
                    credit_total_days = 1 * Number(item.quantity || 1)
                  } else if (svc.duration_unit === 'months') {
                    credit_total_months = 1 * Number(item.quantity || 1)
                  }
                  
                  // Create credit and get the credit ID
                  const creditResult = await sql`
                    INSERT INTO customer_service_credits (
                      customer_id,
                      order_item_id,
                      service_package_id,
                      service_id,
                      total_hours,
                      total_days,
                      total_months,
                      status
                    )
                    VALUES (
                      ${Number(formData.customer_id)},
                      ${item.id},
                      NULL,
                      ${svc.service_id},
                      ${credit_total_hours},
                      ${credit_total_days},
                      ${credit_total_months},
                      'active'
                    )
                    RETURNING id
                  `
                  
                  // Allocate orphaned appointments to this new credit
                  if (creditResult && creditResult.length > 0) {
                    const creditId = creditResult[0].id
                    await sql`
                      UPDATE scheduled_appointments
                      SET credit_id = ${creditId}
                      WHERE customer_id = ${Number(formData.customer_id)}
                        AND service_id = ${svc.service_id}
                        AND credit_id IS NULL
                        AND status IN ('scheduled', 'completed')
                        AND cancelled_at IS NULL
                    `
                  }
                }
              }
            }
          }
        }
        
        orderId = order.id
      } else {
        // Check if customer already has an open order
        const existingOpenOrder = await sql`
          SELECT id, order_number, status
          FROM orders
          WHERE customer_id = ${Number(formData.customer_id)}
            AND status = 'open'
          LIMIT 1
        `
        
        if (existingOpenOrder && existingOpenOrder.length > 0) {
          setError(t('orderForm.errors.openOrderExists', 'This customer already has an open order (Order #{{orderNumber}}). Please close the existing order before creating a new one.', { orderNumber: existingOpenOrder[0].order_number || existingOpenOrder[0].id }))
          setSaving(false)
          return
        }

        // Create new order - explicitly don't set id to let the database auto-generate it
        let result
        let retryAttempted = false
        
        try {
          result = await sql`
            INSERT INTO orders (customer_id, status, agency_id, discount_amount, tax_amount, currency, note)
            VALUES (
              ${Number(formData.customer_id)},
              ${formData.status},
              ${formData.agency_id ? Number(formData.agency_id) : null},
              ${Number(formData.discount_amount || 0)},
              ${Number(formData.tax_amount || 0)},
              ${formData.currency},
              ${formData.note || null}
            )
            RETURNING id
          `
        } catch (insertError) {
          // Check for duplicate key error (check both message and code if available)
          const errorMessage = insertError.message || insertError.toString() || ''
          const isDuplicateKey = errorMessage.includes('duplicate key') || 
                                  errorMessage.includes('orders_pkey') ||
                                  errorMessage.includes('orders_order_number_key') ||
                                  errorMessage.includes('unique constraint')
          
          if (isDuplicateKey && !retryAttempted) {
            retryAttempted = true
            try {
              console.log('Duplicate key detected, fixing sequences...')
              
              // Fix the ID sequence
              const maxIdResult = await sql`
                SELECT COALESCE(MAX(id), 0) as max_id FROM orders
              `
              const maxId = maxIdResult[0]?.max_id || 0
              
              await sql`
                SELECT setval('orders_id_seq', ${maxId + 1}, false)
              `
              
              // Fix the order_number sequence
              // The order number format is ORD-YYYY-NNNNNN
              // We need to find the highest sequence number used in the current year
              const currentYear = new Date().getFullYear()
              const orderNumberPattern = `ORD-${currentYear}-%`
              
              const maxOrderNumberResult = await sql`
                SELECT order_number 
                FROM orders 
                WHERE order_number LIKE ${orderNumberPattern}
                ORDER BY order_number DESC 
                LIMIT 1
              `
              
              let maxSequenceNum = 0
              if (maxOrderNumberResult && maxOrderNumberResult.length > 0) {
                const lastOrderNumber = maxOrderNumberResult[0].order_number
                // Extract the sequence number from ORD-YYYY-NNNNNN
                const match = lastOrderNumber.match(/ORD-\d{4}-(\d+)/)
                if (match && match[1]) {
                  maxSequenceNum = parseInt(match[1], 10) || 0
                }
              }
              
              // Set the order_number sequence to maxSequenceNum + 1
              await sql`
                SELECT setval('orders_order_number_seq', ${maxSequenceNum + 1}, false)
              `
              
              console.log(`Sequences fixed: ID=${maxId + 1}, OrderNumber=${maxSequenceNum + 1}, retrying insert...`)
              
              // Retry the insert
              result = await sql`
                INSERT INTO orders (customer_id, status, agency_id, discount_amount, tax_amount, currency, note)
                VALUES (
                  ${Number(formData.customer_id)},
                  ${formData.status},
                  ${formData.agency_id ? Number(formData.agency_id) : null},
                  ${Number(formData.discount_amount || 0)},
                  ${Number(formData.tax_amount || 0)},
                  ${formData.currency},
                  ${formData.note || null}
                )
                RETURNING id
              `
              
              console.log('Retry successful!')
            } catch (retryError) {
              console.error('Retry failed:', retryError)
              // If retry also fails, throw the original error
              throw insertError
            }
          } else {
            // If it's a different error or we already retried, throw it
            throw insertError
          }
        }
        
        if (!result || !result[0] || !result[0].id) {
          throw new Error('Failed to create order: No ID returned')
        }
        
        orderId = result[0].id
      }

      onSaved?.()
    } catch (err) {
      console.error('Failed to save order:', err)
      
      // Provide more specific error messages
      if (err.message && err.message.includes('orders_order_number_key')) {
        setError(t('orderForm.errors.duplicateOrderNumber', 'An order with this order number already exists. The system has attempted to fix this automatically. Please try again.'))
      } else if (err.message && err.message.includes('duplicate key')) {
        setError(t('orderForm.errors.duplicateKey', 'An order with this ID already exists. This may be a database sequence issue. Please refresh and try again.'))
      } else if (err.message && err.message.includes('unique constraint')) {
        setError(t('orderForm.errors.uniqueConstraint', 'This order already exists. Please refresh the page and try again.'))
      } else {
        setError(t('orderForm.errors.save', 'Unable to save order. Please try again.'))
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="px-4 py-6 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-6xl rounded-xl bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {isEditing ? t('orderForm.title.edit', 'Edit Order') : t('orderForm.title.new', 'New Order')}
            </h1>
            <p className="text-gray-500 text-sm">
              {isEditing
                ? t('orderForm.subtitle.edit', 'Update order details.')
                : t('orderForm.subtitle.new', 'Create a new order for a customer.')}
            </p>
          </div>
          <button
            onClick={onCancel}
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
          >
            {t('orderForm.buttons.cancel', 'Cancel')}
          </button>
        </div>

        {error && (
          <div className="mb-6 rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        {openOrderWarning && !isEditing && (
          <div className="mb-6 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            {t('orderForm.warnings.openOrderExists', 'Warning: This customer already has an open order (Order #{{orderNumber}}). You must close the existing order before creating a new one.', { orderNumber: openOrderWarning.orderNumber })}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Order Basic Info */}
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-5">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              {t('orderForm.sections.orderInfo', 'Order Information')}
            </h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="customer_id">
                  {t('orderForm.fields.customer', 'Customer *')}
                </label>
                <select
                  id="customer_id"
                  name="customer_id"
                  required
                  value={formData.customer_id}
                  onChange={handleChange}
                  disabled={!!customer}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  <option value="">{t('orderForm.fields.selectCustomer', 'Select a customer...')}</option>
                  {customers.map((cust) => (
                    <option key={cust.id} value={cust.id}>
                      {cust.fullname}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="status">
                  {t('orderForm.fields.status', 'Status')}
                </label>
                <select
                  id="status"
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                >
                  <option value="open">{t('orderForm.status.open', 'Open')}</option>
                  <option value="closed">{t('orderForm.status.closed', 'Closed')}</option>
                  <option value="cancelled">{t('orderForm.status.cancelled', 'Cancelled')}</option>
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="agency_id">
                  {t('orderForm.fields.agency', 'Agency')}
                </label>
                <select
                  id="agency_id"
                  name="agency_id"
                  value={formData.agency_id}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                >
                  <option value="">{t('orderForm.fields.selectAgency', 'Select an agency...')}</option>
                  {agencies.map((agency) => (
                    <option key={agency.id} value={agency.id}>
                      {agency.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="discount_amount">
                  {t('orderForm.fields.discount', 'Discount Amount')}
                </label>
                <input
                  id="discount_amount"
                  name="discount_amount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.discount_amount}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="tax_amount">
                  {t('orderForm.fields.tax', 'Tax Amount')}
                </label>
                <input
                  id="tax_amount"
                  name="tax_amount"
                  type="number"
                  step="0.01"
                  min="0"
                  value={formData.tax_amount}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                />
              </div>

              <div className="md:col-span-2">
                <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="note">
                  {t('orderForm.fields.note', 'Note')}
                </label>
                <textarea
                  id="note"
                  name="note"
                  rows="3"
                  value={formData.note}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onCancel}
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
            >
              {t('orderForm.buttons.cancel', 'Cancel')}
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving
                ? t('orderForm.buttons.saving', 'Saving...')
                : isEditing
                ? t('orderForm.buttons.update', 'Update Order')
                : t('orderForm.buttons.create', 'Create Order')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default OrderForm

