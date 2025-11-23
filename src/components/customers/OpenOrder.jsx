import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import sql from '../../lib/neon'
import { canModify } from '../../lib/permissions'

function OpenOrder({ 
  openOrder, 
  user, 
  onViewOrder, 
  onReload,
  formatCurrency,
  formatDateTime
}) {
  const { t } = useTranslation()
  const [openOrderItems, setOpenOrderItems] = useState([])
  const [loadingOpenOrderItems, setLoadingOpenOrderItems] = useState(false)
  // For adding items
  const [showAddItem, setShowAddItem] = useState(false)
  const [itemType, setItemType] = useState('service')
  const [itemId, setItemId] = useState('')
  const [itemQuantity, setItemQuantity] = useState('1')
  const [itemPrice, setItemPrice] = useState('')
  const [services, setServices] = useState([])
  const [servicePackages, setServicePackages] = useState([])
  const [products, setProducts] = useState([])
  const [addingItem, setAddingItem] = useState(false)
  // For payments
  const [orderPayments, setOrderPayments] = useState([])
  const [showAddPayment, setShowAddPayment] = useState(false)
  const [paymentAmount, setPaymentAmount] = useState('')
  const [paymentMethodId, setPaymentMethodId] = useState('')
  const [paymentCompanyAccountId, setPaymentCompanyAccountId] = useState('')
  const [paymentMethods, setPaymentMethods] = useState([])
  const [companyAccounts, setCompanyAccounts] = useState([])
  const [addingPayment, setAddingPayment] = useState(false)

  // Function to fetch open order items
  const fetchOpenOrderItems = async (orderId) => {
    try {
      setLoadingOpenOrderItems(true)
      const result = await sql`
        SELECT 
          oi.id,
          oi.item_type,
          oi.item_id,
          oi.item_name,
          oi.quantity,
          oi.unit_price,
          oi.subtotal,
          -- Product fields
          p.name AS product_name,
          pc.name AS product_category,
          -- Service/Service Package fields
          s.name AS service_name,
          sp.name AS service_package_name,
          sc.name AS service_category,
          s.duration_unit,
          -- Credit information
          csc.id AS credit_id,
          CASE 
            WHEN s.duration_unit = 'hours' THEN COALESCE(csc.total_hours, 0)
            WHEN s.duration_unit = 'days' THEN COALESCE(csc.total_days, 0)
            WHEN s.duration_unit = 'months' THEN COALESCE(csc.total_months, 0)::NUMERIC
            ELSE 0
          END as credit_total,
          CASE 
            WHEN s.duration_unit = 'hours' THEN COALESCE(SUM(sa.duration_hours) FILTER (WHERE sa.status IN ('scheduled', 'completed') AND sa.cancelled_at IS NULL), 0)
            WHEN s.duration_unit = 'days' THEN COALESCE(SUM(sa.duration_days) FILTER (WHERE sa.status IN ('scheduled', 'completed') AND sa.cancelled_at IS NULL), 0)
            WHEN s.duration_unit = 'months' THEN COALESCE(SUM(sa.duration_months) FILTER (WHERE sa.status IN ('scheduled', 'completed') AND sa.cancelled_at IS NULL), 0)::NUMERIC
            ELSE 0
          END as credit_used,
          CASE 
            WHEN s.duration_unit = 'hours' THEN COALESCE(csc.total_hours, 0) - COALESCE(SUM(sa.duration_hours) FILTER (WHERE sa.status IN ('scheduled', 'completed') AND sa.cancelled_at IS NULL), 0)
            WHEN s.duration_unit = 'days' THEN COALESCE(csc.total_days, 0) - COALESCE(SUM(sa.duration_days) FILTER (WHERE sa.status IN ('scheduled', 'completed') AND sa.cancelled_at IS NULL), 0)
            WHEN s.duration_unit = 'months' THEN (COALESCE(csc.total_months, 0)::NUMERIC - COALESCE(SUM(sa.duration_months) FILTER (WHERE sa.status IN ('scheduled', 'completed') AND sa.cancelled_at IS NULL), 0)::NUMERIC)
            ELSE 0
          END as credit_available
        FROM order_items oi
        LEFT JOIN products p ON oi.item_type = 'product' AND oi.item_id = p.id
        LEFT JOIN product_categories pc ON p.category_id = pc.id
        LEFT JOIN service_packages sp ON oi.item_type = 'service_package' AND oi.item_id = sp.id
        LEFT JOIN services s ON (oi.item_type = 'service_package' AND sp.service_id = s.id) OR (oi.item_type = 'service' AND oi.item_id = s.id)
        LEFT JOIN service_categories sc ON s.category_id = sc.id
        LEFT JOIN customer_service_credits csc ON oi.id = csc.order_item_id
        LEFT JOIN scheduled_appointments sa ON sa.credit_id = csc.id
        WHERE oi.order_id = ${orderId}
        GROUP BY oi.id, oi.item_type, oi.item_id, oi.item_name, oi.quantity, oi.unit_price, oi.subtotal,
                 p.name, pc.name, s.name, sp.name, sc.name, s.duration_unit, csc.id, csc.total_hours, csc.total_days, csc.total_months
        ORDER BY oi.created_at ASC
      `
      setOpenOrderItems(result || [])
    } catch (err) {
      console.error('Failed to load open order items:', err)
      setOpenOrderItems([])
    } finally {
      setLoadingOpenOrderItems(false)
    }
  }

  // Function to load dropdown options for adding items
  const loadItemOptions = async () => {
    try {
      const [servicesResult, packagesResult, productsResult] = await Promise.all([
        sql`SELECT id, name, base_price FROM services WHERE is_active = true ORDER BY name ASC`,
        sql`
          SELECT sp.id, sp.name, sp.price, s.name AS service_name
          FROM service_packages sp
          LEFT JOIN services s ON sp.service_id = s.id
          WHERE sp.is_active = true
          ORDER BY s.name ASC, sp.name ASC
        `,
        sql`SELECT id, name, price FROM products WHERE is_active = true ORDER BY name ASC`
      ])
      setServices(servicesResult || [])
      setServicePackages(packagesResult || [])
      setProducts(productsResult || [])
    } catch (err) {
      console.error('Failed to load item options:', err)
    }
  }

  // Function to fetch order payments
  const fetchOrderPayments = async (orderId) => {
    try {
      const result = await sql`
        SELECT 
          op.id,
          op.amount,
          op.currency,
          op.payment_method_id,
          op.occurred_at,
          op.note,
          op.transaction_id,
          op.created_at,
          pm.name AS payment_method_name,
          ca.name AS company_account_name
        FROM order_payments op
        LEFT JOIN payment_methods pm ON op.payment_method_id = pm.id
        LEFT JOIN company_accounts ca ON op.company_account_id = ca.id
        WHERE op.order_id = ${orderId}
        ORDER BY op.occurred_at ASC
      `
      setOrderPayments(result || [])
    } catch (err) {
      console.error('Failed to fetch payments:', err)
      setOrderPayments([])
    }
  }

  // Function to load payment options
  const loadPaymentOptions = async () => {
    try {
      const [paymentMethodsResult, accountsResult] = await Promise.all([
        sql`SELECT id, name FROM payment_methods ORDER BY name ASC`,
        sql`SELECT id, name FROM company_accounts ORDER BY name ASC`
      ])
      setPaymentMethods(paymentMethodsResult || [])
      setCompanyAccounts(accountsResult || [])
    } catch (err) {
      console.error('Failed to load payment options:', err)
    }
  }

  // Load items and payments when openOrder changes
  useEffect(() => {
    if (openOrder) {
      fetchOpenOrderItems(openOrder.id)
      fetchOrderPayments(openOrder.id)
      loadItemOptions()
      loadPaymentOptions()
    } else {
      setOpenOrderItems([])
      setOrderPayments([])
    }
  }, [openOrder?.id])

  const handleCloseOrder = async () => {
    if (!openOrder) return
    
    // Prevent closing if balance is not zero (allowing for small floating point differences)
    const balanceDue = Number(openOrder.balance_due || 0)
    if (Math.abs(balanceDue) > 0.01) {
      alert(t('customerDetail.orders.error.cannotCloseWithBalance', 'Cannot close order. The balance due must be zero. Current balance: {{balance}}', { balance: formatCurrency(balanceDue) }))
      return
    }
    
    try {
      await sql`
        UPDATE orders 
        SET status = 'closed', closed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
        WHERE id = ${openOrder.id}
      `
      // Reload orders to refresh the display
      if (onReload) {
        await onReload()
      }
    } catch (err) {
      console.error('Failed to close order:', err)
      alert(t('customerDetail.orders.error.close', 'Unable to close order. Please try again.'))
    }
  }

  const handleCancelOrder = async () => {
    if (!openOrder) return
    if (!window.confirm(t('customerDetail.orders.confirm.cancel', 'Are you sure you want to cancel this order? This action cannot be undone.'))) {
      return
    }
    try {
      await sql`
        UPDATE orders 
        SET status = 'cancelled', cancelled_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
        WHERE id = ${openOrder.id}
      `
      // Delete all credits associated with this order's items
      await sql`
        DELETE FROM customer_service_credits
        WHERE order_item_id IN (
          SELECT id FROM order_items WHERE order_id = ${openOrder.id}
        )
      `
      // Reload orders to refresh the display
      if (onReload) {
        await onReload()
      }
    } catch (err) {
      console.error('Failed to cancel order:', err)
      alert(t('customerDetail.orders.error.cancel', 'Unable to cancel order. Please try again.'))
    }
  }

  const handleItemTypeChange = (type) => {
    setItemType(type)
    setItemId('')
    setItemPrice('')
  }

  const handleItemIdChange = (id) => {
    setItemId(id)
    // Auto-fill price based on selected item
    if (itemType === 'service') {
      const service = services.find(s => s.id.toString() === id)
      setItemPrice(service?.base_price?.toString() || '')
    } else if (itemType === 'service_package') {
      const pkg = servicePackages.find(p => p.id.toString() === id)
      setItemPrice(pkg?.price?.toString() || '')
    } else if (itemType === 'product') {
      const product = products.find(p => p.id.toString() === id)
      setItemPrice(product?.price?.toString() || '')
    }
  }

  const handleAddItem = async (e) => {
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }

    if (!openOrder) return

    try {
      if (!itemId || !itemQuantity || !itemPrice) {
        alert(t('customerDetail.orders.errors.itemRequired', 'Please fill in all item fields.'))
        return
      }

      const quantity = Number(itemQuantity)
      const price = Number(itemPrice)
      if (quantity <= 0 || price < 0) {
        alert(t('customerDetail.orders.errors.invalidValues', 'Quantity and price must be positive values.'))
        return
      }

      // Get item name based on type
      let itemName = ''
      if (itemType === 'service') {
        const service = services.find(s => s.id.toString() === itemId)
        itemName = service?.name || `Service #${itemId}`
      } else if (itemType === 'service_package') {
        const pkg = servicePackages.find(p => p.id.toString() === itemId)
        itemName = pkg?.name || `Package #${itemId}`
      } else if (itemType === 'product') {
        const product = products.find(p => p.id.toString() === itemId)
        itemName = product?.name || `Product #${itemId}`
      }

      if (!itemName) {
        alert(t('customerDetail.orders.errors.itemNotFound', 'Selected item not found. Please select again.'))
        return
      }

      setAddingItem(true)

      // Insert order item
      await sql`
        INSERT INTO order_items (order_id, item_type, item_id, item_name, quantity, unit_price, subtotal, note)
        VALUES (
          ${openOrder.id}, 
          ${itemType}, 
          ${Number(itemId)}, 
          ${itemName}, 
          ${quantity}, 
          ${price}, 
          ${quantity * price}, 
          ${null}
        )
      `

      // Reload orders to get updated totals (this will also reload items)
      if (onReload) {
        await onReload()
      }
      // Also reload items directly
      await fetchOpenOrderItems(openOrder.id)

      // Reset form
      setItemType('service')
      setItemId('')
      setItemQuantity('1')
      setItemPrice('')
      setShowAddItem(false)
    } catch (err) {
      console.error('Failed to add item:', err)
      alert(t('customerDetail.orders.errors.addItemFailed', 'Failed to add item. Please try again.'))
    } finally {
      setAddingItem(false)
    }
  }

  const handleDeleteItem = async (itemId) => {
    if (!openOrder) return
    if (!window.confirm(t('customerDetail.orders.confirm.deleteItem', 'Are you sure you want to delete this item? This action cannot be undone.'))) {
      return
    }
    try {
      // Delete the order item (CASCADE will handle credits)
      await sql`
        DELETE FROM order_items WHERE id = ${itemId}
      `
      // Reload orders to get updated totals
      if (onReload) {
        await onReload()
      }
      // Also reload items directly
      await fetchOpenOrderItems(openOrder.id)
    } catch (err) {
      console.error('Failed to delete item:', err)
      alert(t('customerDetail.orders.errors.deleteItemFailed', 'Failed to delete item. Please try again.'))
    }
  }

  const handleDeletePayment = async (paymentId) => {
    if (!openOrder) return
    if (!window.confirm(t('customerDetail.orders.confirm.deletePayment', 'Are you sure you want to delete this payment? This action cannot be undone.'))) {
      return
    }
    try {
      // Delete the payment
      await sql`
        DELETE FROM order_payments WHERE id = ${paymentId}
      `
      // Reload payments
      await fetchOrderPayments(openOrder.id)
      // Reload orders to get updated totals
      if (onReload) {
        await onReload()
      }
    } catch (err) {
      console.error('Failed to delete payment:', err)
      alert(t('customerDetail.orders.errors.deletePaymentFailed', 'Failed to delete payment. Please try again.'))
    }
  }

  const handleAddPayment = async (e) => {
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }

    if (!openOrder) return

    // Double-submission protection
    if (addingPayment) {
      return
    }

    try {
      if (!paymentAmount || !paymentMethodId) {
        alert(t('customerDetail.orders.errors.paymentRequired', 'Please fill in payment amount and method.'))
        return
      }

      const amount = Number(paymentAmount)
      if (amount <= 0) {
        alert(t('customerDetail.orders.errors.invalidPayment', 'Payment amount must be greater than 0.'))
        return
      }

      setAddingPayment(true)

      // Insert payment (trigger will automatically create transaction and update order totals)
      try {
        await sql`
          INSERT INTO order_payments (order_id, amount, currency, payment_method_id, company_account_id, occurred_at, note)
          VALUES (
            ${openOrder.id},
            ${amount},
            ${openOrder.currency || 'BRL'},
            ${Number(paymentMethodId)},
            ${paymentCompanyAccountId ? Number(paymentCompanyAccountId) : null},
            ${new Date().toISOString()},
            ${null}
          )
        `
      } catch (insertError) {
        // Check if it's a duplicate key error
        if (insertError.message && insertError.message.includes('duplicate key value violates unique constraint "order_payments_pkey"')) {
          // Reset the sequence and retry once
          try {
            await sql`
              SELECT setval('order_payments_id_seq', COALESCE((SELECT MAX(id) FROM order_payments), 0) + 1, false)
            `
            // Retry the insert
            await sql`
              INSERT INTO order_payments (order_id, amount, currency, payment_method_id, company_account_id, occurred_at, note)
              VALUES (
                ${openOrder.id},
                ${amount},
                ${openOrder.currency || 'BRL'},
                ${Number(paymentMethodId)},
                ${paymentCompanyAccountId ? Number(paymentCompanyAccountId) : null},
                ${new Date().toISOString()},
                ${null}
              )
            `
          } catch (retryError) {
            // If retry also fails, throw the original error
            throw insertError
          }
        } else {
          // If it's a different error, throw it
          throw insertError
        }
      }

      // Reload payments
      await fetchOrderPayments(openOrder.id)

      // Reload orders to get updated totals
      if (onReload) {
        await onReload()
      }

      // Reset form
      setPaymentAmount('')
      setPaymentMethodId('')
      setPaymentCompanyAccountId('')
      setShowAddPayment(false)
    } catch (error) {
      console.error('Error adding payment:', error)
      alert(t('customerDetail.orders.errors.addPaymentFailed', 'Failed to add payment. Please try again.'))
    } finally {
      setAddingPayment(false)
    }
  }

  if (!openOrder) {
    return null
  }

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 
            onClick={() => onViewOrder?.(openOrder)}
            className="text-lg font-semibold text-gray-900 cursor-pointer hover:text-indigo-600 transition-colors"
          >
            {t('customerDetail.orders.openOrder', 'Open Order')}: {openOrder.order_number || `#${openOrder.id}`}
          </h2>
          <p className="text-xs text-gray-500 mt-1">
            {t('customerDetail.orders.createdAt', 'Created')}: {formatDateTime(openOrder.created_at)}
          </p>
        </div>
        {canModify(user) && (
          <div className="flex items-center gap-2">
            <button
              onClick={handleCloseOrder}
              disabled={Math.abs(Number(openOrder.balance_due || 0)) > 0.01}
              className="inline-flex items-center justify-center rounded-lg border border-emerald-300 px-3 py-2 text-sm font-semibold text-emerald-700 shadow-sm hover:bg-emerald-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white"
              title={Math.abs(Number(openOrder.balance_due || 0)) > 0.01 ? t('customerDetail.orders.closeDisabled', 'Cannot close order. Balance due must be zero.') : t('customerDetail.orders.close', 'Close Order')}
            >
              {t('customerDetail.orders.close', 'Close Order')}
            </button>
            <button
              onClick={handleCancelOrder}
              className="inline-flex items-center justify-center rounded-lg border border-red-300 px-3 py-2 text-sm font-semibold text-red-700 shadow-sm hover:bg-red-50 transition-colors"
            >
              {t('customerDetail.orders.cancel', 'Cancel')}
            </button>
            <button
              onClick={() => setShowAddItem(true)}
              className="inline-flex items-center justify-center rounded-lg border border-indigo-300 px-3 py-2 text-sm font-semibold text-indigo-700 shadow-sm hover:bg-indigo-50 transition-colors"
            >
              {t('customerDetail.orders.buttons.addItem', 'Add Item')}
            </button>
            <button
              onClick={() => setShowAddPayment(true)}
              className="inline-flex items-center justify-center rounded-lg border border-emerald-300 px-3 py-2 text-sm font-semibold text-emerald-700 shadow-sm hover:bg-emerald-50 transition-colors"
            >
              {t('customerDetail.orders.buttons.addPayment', 'Add Payment')}
            </button>
          </div>
        )}
      </div>

      {/* Forms at the top */}
      <div className="space-y-4 mb-6">
        {/* Add Item Form */}
        {showAddItem && canModify(user) && (
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700">
                  {t('customerDetail.orders.itemFields.type', 'Type')}
                </label>
                <select
                  value={itemType}
                  onChange={(e) => handleItemTypeChange(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                >
                  <option value="service">{t('customerDetail.orders.itemTypes.service', 'Service')}</option>
                  <option value="service_package">{t('customerDetail.orders.itemTypes.servicePackage', 'Service Package')}</option>
                  <option value="product">{t('customerDetail.orders.itemTypes.product', 'Product')}</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700">
                  {t('customerDetail.orders.itemFields.item', 'Item')}
                </label>
                <select
                  value={itemId}
                  onChange={(e) => handleItemIdChange(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                >
                  <option value="">{t('customerDetail.orders.itemFields.selectItem', 'Select...')}</option>
                  {itemType === 'service' && services.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.name}
                    </option>
                  ))}
                  {itemType === 'service_package' && servicePackages.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} {p.service_name ? `(${p.service_name})` : ''}
                    </option>
                  ))}
                  {itemType === 'product' && products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700">
                  {t('customerDetail.orders.itemFields.quantity', 'Qty')}
                </label>
                <input
                  type="number"
                  min="1"
                  value={itemQuantity}
                  onChange={(e) => setItemQuantity(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700">
                  {t('customerDetail.orders.itemFields.unitPrice', 'Unit Price')}
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={itemPrice}
                  onChange={(e) => setItemPrice(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                />
              </div>
              <div className="flex items-end gap-2">
                <button
                  type="button"
                  onClick={handleAddItem}
                  disabled={addingItem}
                  className="flex-1 rounded-lg bg-indigo-600 px-3 py-2 text-sm font-semibold text-white hover:bg-indigo-500 disabled:opacity-50"
                >
                  {addingItem ? t('customerDetail.orders.buttons.adding', 'Adding...') : t('customerDetail.orders.buttons.add', 'Add')}
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    setShowAddItem(false)
                  }}
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                >
                  {t('customerDetail.orders.buttons.cancel', 'Cancel')}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Add Payment Form */}
        {showAddPayment && canModify(user) && (
          <div className="p-4 bg-gray-50 rounded-lg border border-gray-200">
            <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700">
                  {t('customerDetail.orders.paymentFields.amount', 'Amount *')}
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  value={paymentAmount}
                  onChange={(e) => setPaymentAmount(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700">
                  {t('customerDetail.orders.paymentFields.method', 'Payment Method *')}
                </label>
                <select
                  value={paymentMethodId}
                  onChange={(e) => setPaymentMethodId(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                >
                  <option value="">{t('customerDetail.orders.paymentFields.selectMethod', 'Select...')}</option>
                  {paymentMethods.map((pm) => (
                    <option key={pm.id} value={pm.id}>
                      {pm.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-gray-700">
                  {t('customerDetail.orders.paymentFields.account', 'Company Account')}
                </label>
                <select
                  value={paymentCompanyAccountId}
                  onChange={(e) => setPaymentCompanyAccountId(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                >
                  <option value="">{t('customerDetail.orders.paymentFields.selectAccount', 'Select...')}</option>
                  {companyAccounts.map((acc) => (
                    <option key={acc.id} value={acc.id}>
                      {acc.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="flex items-end gap-2">
                <button
                  type="button"
                  onClick={handleAddPayment}
                  disabled={addingPayment}
                  className="flex-1 rounded-lg bg-emerald-600 px-3 py-2 text-sm font-semibold text-white hover:bg-emerald-500 disabled:opacity-50"
                >
                  {addingPayment ? t('customerDetail.orders.buttons.addingPayment', 'Adding...') : t('customerDetail.orders.buttons.add', 'Add')}
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    setShowAddPayment(false)
                  }}
                  className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                >
                  {t('customerDetail.orders.buttons.cancel', 'Cancel')}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Services Table */}
      {loadingOpenOrderItems ? (
        <div className="text-gray-600 text-sm py-4">{t('customerDetail.orders.loadingItems', 'Loading items...')}</div>
      ) : (
        <>
          {openOrderItems.filter(item => item.item_type === 'service' || item.item_type === 'service_package').length > 0 && (
            <div className="mb-6">
              <div className="overflow-x-auto">
                <table className="w-full divide-y divide-gray-200 table-fixed">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase w-48">
                        {t('customerDetail.orders.services', 'Services')}
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase w-32">
                        {t('customerDetail.orders.category', 'Category')}
                      </th>
                      <th className="px-3 py-2 text-right text-xs font-medium text-gray-700 uppercase w-16">
                        {t('customerDetail.orders.quantity', 'Qty')}
                      </th>
                      <th className="px-3 py-2 text-right text-xs font-medium text-gray-700 uppercase w-24">
                        {t('customerDetail.orders.creditTotal', 'Credit Total')}
                      </th>
                      <th className="px-3 py-2 text-right text-xs font-medium text-gray-700 uppercase w-20">
                        {t('customerDetail.orders.creditUsed', 'Used')}
                      </th>
                      <th className="px-3 py-2 text-right text-xs font-medium text-gray-700 uppercase w-24">
                        {t('customerDetail.orders.creditAvailable', 'Available')}
                      </th>
                      {canModify(user) && (
                        <th className="px-3 py-2 text-center text-xs font-medium text-gray-700 uppercase w-20">
                          {t('customerDetail.orders.actions', 'Actions')}
                        </th>
                      )}
                      <th className="px-3 py-2 text-right text-xs font-medium text-gray-700 uppercase w-28">
                        {t('customerDetail.orders.price', 'Price')}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {openOrderItems.filter(item => item.item_type === 'service' || item.item_type === 'service_package').map((item) => {
                      const displayName = item.service_package_name || item.service_name || item.item_name
                      const durationUnit = item.duration_unit || ''
                      return (
                        <tr key={item.id}>
                          <td className="px-3 py-2 text-sm font-medium text-gray-900 w-48">
                            {displayName}
                          </td>
                          <td className="px-3 py-2 text-sm text-gray-500 w-32">
                            {item.service_category || '—'}
                          </td>
                          <td className="px-3 py-2 text-sm text-gray-900 text-right w-16">
                            {item.quantity || 0}
                          </td>
                          <td className="px-3 py-2 text-sm text-gray-900 text-right w-24">
                            {Number(item.credit_total || 0).toFixed(2)} {durationUnit}
                          </td>
                          <td className="px-3 py-2 text-sm text-gray-700 text-right w-20">
                            {Number(item.credit_used || 0).toFixed(2)} {durationUnit}
                          </td>
                          <td className="px-3 py-2 text-sm font-semibold text-right w-24">
                            <span className={Number(item.credit_available || 0) > 0 ? 'text-emerald-700' : 'text-rose-700'}>
                              {Number(item.credit_available || 0).toFixed(2)} {durationUnit}
                            </span>
                          </td>
                          {canModify(user) && (
                            <td className="px-3 py-2 text-center w-20">
                              <button
                                onClick={(e) => {
                                  e.preventDefault()
                                  e.stopPropagation()
                                  handleDeleteItem(item.id)
                                }}
                                className="inline-flex items-center justify-center rounded-lg p-1.5 text-red-600 hover:bg-red-50 transition-colors"
                                title={t('customerDetail.orders.deleteItem', 'Delete item')}
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </td>
                          )}
                          <td className="px-3 py-2 text-sm text-gray-900 text-right font-medium w-28">
                            {formatCurrency(Number(item.subtotal || 0))}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Products Table */}
          {openOrderItems.filter(item => item.item_type === 'product').length > 0 && (
            <div className="mb-6">
              <div className="overflow-x-auto">
                <table className="w-full divide-y divide-gray-200 table-fixed">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase w-48">
                        {t('customerDetail.orders.products', 'Products')}
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase w-32">
                        {t('customerDetail.orders.category', 'Category')}
                      </th>
                      <th className="px-3 py-2 text-right text-xs font-medium text-gray-700 uppercase w-16">
                        {t('customerDetail.orders.quantity', 'Qty')}
                      </th>
                      <th className="px-3 py-2 text-right text-xs font-medium text-gray-700 uppercase w-24">
                      </th>
                      <th className="px-3 py-2 text-right text-xs font-medium text-gray-700 uppercase w-20">
                      </th>
                      <th className="px-3 py-2 text-right text-xs font-medium text-gray-700 uppercase w-24">
                      </th>
                      {canModify(user) && (
                        <th className="px-3 py-2 text-center text-xs font-medium text-gray-700 uppercase w-20">
                          {t('customerDetail.orders.actions', 'Actions')}
                        </th>
                      )}
                      <th className="px-3 py-2 text-right text-xs font-medium text-gray-700 uppercase w-28">
                        {t('customerDetail.orders.price', 'Price')}
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {openOrderItems.filter(item => item.item_type === 'product').map((item) => (
                      <tr key={item.id}>
                        <td className="px-3 py-2 text-sm font-medium text-gray-900 w-48">
                          {item.product_name || item.item_name}
                        </td>
                        <td className="px-3 py-2 text-sm text-gray-500 w-32">
                          {item.product_category || '—'}
                        </td>
                        <td className="px-3 py-2 text-sm text-gray-900 text-right w-16">
                          {item.quantity || 0}
                        </td>
                        <td className="px-3 py-2 text-sm w-24"></td>
                        <td className="px-3 py-2 text-sm w-20"></td>
                        <td className="px-3 py-2 text-sm w-24"></td>
                        {canModify(user) && (
                          <td className="px-3 py-2 text-center w-20">
                            <button
                              onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                handleDeleteItem(item.id)
                              }}
                              className="inline-flex items-center justify-center rounded-lg p-1.5 text-red-600 hover:bg-red-50 transition-colors"
                              title={t('customerDetail.orders.deleteItem', 'Delete item')}
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </td>
                        )}
                        <td className="px-3 py-2 text-sm text-gray-900 text-right font-medium w-28">
                          {formatCurrency(Number(item.subtotal || 0))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Payments Table */}
          {orderPayments.length > 0 && (
            <div className="mb-6">
              <div className="overflow-x-auto">
                <table className="w-full divide-y divide-gray-200 table-fixed">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase w-48">
                        {t('customerDetail.orders.payments', 'Payments')}
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase w-40">
                        Date
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase w-32">
                        Payment Method
                      </th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-700 uppercase w-32">
                        Account
                      </th>
                      {canModify(user) && (
                        <th className="px-3 py-2 text-center text-xs font-medium text-gray-700 uppercase w-20">
                          {t('customerDetail.orders.actions', 'Actions')}
                        </th>
                      )}
                      <th className="px-3 py-2 text-right text-xs font-medium text-gray-700 uppercase w-28">
                        Amount
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {orderPayments.map((payment) => (
                      <tr key={payment.id}>
                        <td className="px-3 py-2 text-sm text-gray-900 w-48">
                          Payment-{payment.id}
                        </td>
                        <td className="px-3 py-2 text-sm text-gray-500 w-40">
                          {formatDateTime(payment.occurred_at)}
                        </td>
                        <td className="px-3 py-2 text-sm text-gray-500 w-32">
                          {payment.payment_method_name || '—'}
                        </td>
                        <td className="px-3 py-2 text-sm text-gray-500 w-32">
                          {payment.company_account_name || '—'}
                        </td>
                        {canModify(user) && (
                          <td className="px-3 py-2 text-center w-20">
                            <button
                              onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                handleDeletePayment(payment.id)
                              }}
                              className="inline-flex items-center justify-center rounded-lg p-1.5 text-red-600 hover:bg-red-50 transition-colors"
                              title={t('customerDetail.orders.deletePayment', 'Delete payment')}
                            >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          </td>
                        )}
                        <td className="px-3 py-2 text-sm text-gray-900 text-right font-medium w-28">
                          {formatCurrency(Number(payment.amount || 0))}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Totals at the bottom */}
          <div className="border-t border-gray-300 pt-3 mt-3">
            <div className="flex justify-end space-x-8">
              <div className="text-right">
                <div className="text-sm font-semibold text-gray-900">
                  {t('customerDetail.orders.total', 'Total')}: {formatCurrency(Number(openOrder.total_amount || 0))}
                </div>
                <div className="text-sm font-semibold text-gray-900 mt-1">
                  {t('customerDetail.orders.totalPaid', 'Total Paid')}: {formatCurrency(orderPayments.reduce((sum, p) => sum + Number(p.amount || 0), 0))}
                </div>
                <div className={`text-sm font-semibold mt-1 ${
                  Number(openOrder.balance_due || 0) > 0 ? 'text-rose-700' : 'text-emerald-700'
                }`}>
                  {t('customerDetail.orders.balance', 'Balance Due')}: {formatCurrency(Number(openOrder.balance_due || 0))}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  )
}

export default OpenOrder

