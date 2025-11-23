import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import sql from '../../lib/neon'
import { canModify } from '../../lib/permissions'
import { useSettings } from '../../context/SettingsContext'
import DetailInfoPanel from '../../components/ui/DetailInfoPanel'

const statusStyles = {
  open: {
    pill: 'text-blue-700 bg-blue-50 border-blue-100',
    bg: 'bg-blue-50'
  },
  closed: {
    pill: 'text-emerald-700 bg-emerald-50 border-emerald-100',
    bg: 'bg-emerald-50'
  },
  cancelled: {
    pill: 'text-rose-700 bg-rose-50 border-rose-100',
    bg: 'bg-rose-50'
  }
}

function OrderDetail({ orderId, onBack, onEdit, onDelete, user = null }) {
  const [order, setOrder] = useState(null)
  const [orderItems, setOrderItems] = useState([])
  const [orderPayments, setOrderPayments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const { formatCurrency, formatDateTime, formatDate } = useSettings()
  const { t } = useTranslation()
  
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
  
  // For adding payments
  const [showAddPayment, setShowAddPayment] = useState(false)
  const [paymentAmount, setPaymentAmount] = useState('')
  const [paymentMethodId, setPaymentMethodId] = useState('')
  const [paymentCompanyAccountId, setPaymentCompanyAccountId] = useState('')
  const [paymentMethods, setPaymentMethods] = useState([])
  const [companyAccounts, setCompanyAccounts] = useState([])
  const [addingPayment, setAddingPayment] = useState(false)

  useEffect(() => {
    if (!orderId) return

    const fetchOrder = async () => {
      try {
        setLoading(true)
        setError(null)
        
        // Fetch order details
        const orderResult = await sql`
          SELECT 
            o.id,
            o.order_number,
            o.customer_id,
            o.status,
            o.subtotal,
            o.tax_amount,
            o.discount_amount,
            o.total_amount,
            o.currency,
            o.total_paid,
            o.balance_due,
            o.created_at,
            o.updated_at,
            o.closed_at,
            o.cancelled_at,
            o.agency_id,
            o.note,
            c.fullname AS customer_name,
            a.name AS agency_name,
            u.name AS created_by_name
          FROM orders o
          LEFT JOIN customers c ON o.customer_id = c.id
          LEFT JOIN agencies a ON o.agency_id = a.id
          LEFT JOIN users u ON o.created_by = u.id
          WHERE o.id = ${orderId}
          LIMIT 1
        `
        
        if (!orderResult || orderResult.length === 0) {
          setError(t('orderDetail.notFound', 'Order not found'))
          setOrder(null)
          return
        }

        setOrder(orderResult[0])

        // Fetch order items with service information for packages
        const itemsResult = await sql`
          SELECT 
            oi.id,
            oi.item_type,
            oi.item_id,
            oi.item_name,
            oi.quantity,
            oi.unit_price,
            oi.subtotal,
            oi.note,
            oi.created_at,
            CASE 
              WHEN oi.item_type = 'service_package' THEN s.name
              WHEN oi.item_type = 'service' THEN s2.name
              ELSE NULL
            END AS service_name
          FROM order_items oi
          LEFT JOIN service_packages sp ON oi.item_type = 'service_package' AND oi.item_id = sp.id
          LEFT JOIN services s ON sp.service_id = s.id
          LEFT JOIN services s2 ON oi.item_type = 'service' AND oi.item_id = s2.id
          WHERE oi.order_id = ${orderId}
          ORDER BY oi.created_at ASC
        `
        setOrderItems(itemsResult || [])

        // Fetch order payments
        const paymentsResult = await sql`
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
        setOrderPayments(paymentsResult || [])
        
        // Load dropdown options for adding items and payments
        const [servicesResult, packagesResult, productsResult, paymentMethodsResult, accountsResult] = await Promise.all([
          sql`SELECT id, name, base_price FROM services WHERE is_active = true ORDER BY name ASC`,
          sql`
            SELECT sp.id, sp.name, sp.price, s.name AS service_name
            FROM service_packages sp
            LEFT JOIN services s ON sp.service_id = s.id
            WHERE sp.is_active = true
            ORDER BY s.name ASC, sp.name ASC
          `,
          sql`SELECT id, name, price FROM products WHERE is_active = true ORDER BY name ASC`,
          sql`SELECT id, name FROM payment_methods ORDER BY name ASC`,
          sql`SELECT id, name FROM company_accounts ORDER BY name ASC`
        ])
        setServices(servicesResult || [])
        setServicePackages(packagesResult || [])
        setProducts(productsResult || [])
        setPaymentMethods(paymentMethodsResult || [])
        setCompanyAccounts(accountsResult || [])

      } catch (err) {
        console.error('Failed to load order details:', err)
        setError(t('orderDetail.error.load', 'Unable to load order details. Please try again later.'))
      } finally {
        setLoading(false)
      }
    }

    fetchOrder()
  }, [orderId, t])

  const handleDelete = async () => {
    if (!orderId) return
    if (!window.confirm(t('orderDetail.confirm.delete', 'Are you sure you want to delete this order? This action cannot be undone.'))) {
      return
    }
    try {
      setDeleting(true)
      await sql`DELETE FROM orders WHERE id = ${orderId}`
      onDelete?.()
    } catch (err) {
      console.error('Failed to delete order:', err)
      alert(t('orderDetail.error.delete', 'Unable to delete order. Please try again.'))
    } finally {
      setDeleting(false)
    }
  }

  const handleAddItem = async (e) => {
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }

    if (!orderId) return

    try {
      if (!itemId || !itemQuantity || !itemPrice) {
        alert(t('orderDetail.errors.itemRequired', 'Please fill in all item fields.'))
        return
      }

      const quantity = Number(itemQuantity)
      const price = Number(itemPrice)
      if (quantity <= 0 || price < 0) {
        alert(t('orderDetail.errors.invalidValues', 'Quantity and price must be positive values.'))
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
        alert(t('orderDetail.errors.itemNotFound', 'Selected item not found. Please select again.'))
        return
      }

      setAddingItem(true)

      // Insert order item with sequence fix retry logic
      let insertSuccess = false
      let retryAttempted = false
      
      while (!insertSuccess && !retryAttempted) {
        try {
          await sql`
            INSERT INTO order_items (order_id, item_type, item_id, item_name, quantity, unit_price, subtotal, note)
            VALUES (
              ${orderId}, 
              ${itemType}, 
              ${Number(itemId)}, 
              ${itemName}, 
              ${quantity}, 
              ${price}, 
              ${quantity * price}, 
              ${null}
            )
          `
          insertSuccess = true
        } catch (insertError) {
          // Check for duplicate key error on order_items_pkey
          const errorMessage = insertError.message || insertError.toString() || ''
          const isDuplicateKey = errorMessage.includes('duplicate key') && 
                                (errorMessage.includes('order_items_pkey') || errorMessage.includes('unique constraint'))
          
          if (isDuplicateKey && !retryAttempted) {
            retryAttempted = true
            try {
              console.log('Duplicate key detected for order_items, fixing sequence...')
              
              // Fix the order_items sequence
              const maxIdResult = await sql`
                SELECT COALESCE(MAX(id), 0) as max_id FROM order_items
              `
              const maxId = maxIdResult[0]?.max_id || 0
              
              await sql`
                SELECT setval('order_items_id_seq', ${maxId + 1}, false)
              `
              
              console.log(`Order items sequence fixed to ${maxId + 1}, retrying insert...`)
              
              // Retry the insert
              await sql`
                INSERT INTO order_items (order_id, item_type, item_id, item_name, quantity, unit_price, subtotal, note)
                VALUES (
                  ${orderId}, 
                  ${itemType}, 
                  ${Number(itemId)}, 
                  ${itemName}, 
                  ${quantity}, 
                  ${price}, 
                  ${quantity * price}, 
                  ${null}
                )
              `
              
              insertSuccess = true
              console.log('Retry successful!')
            } catch (retryError) {
              console.error('Retry failed:', retryError)
              throw insertError
            }
          } else {
            throw insertError
          }
        }
      }

      // Reload order items with service information
      const itemsResult = await sql`
        SELECT 
          oi.id,
          oi.item_type,
          oi.item_id,
          oi.item_name,
          oi.quantity,
          oi.unit_price,
          oi.subtotal,
          oi.note,
          oi.created_at,
          CASE 
            WHEN oi.item_type = 'service_package' THEN s.name
            WHEN oi.item_type = 'service' THEN s2.name
            ELSE NULL
          END AS service_name
        FROM order_items oi
        LEFT JOIN service_packages sp ON oi.item_type = 'service_package' AND oi.item_id = sp.id
        LEFT JOIN services s ON sp.service_id = s.id
        LEFT JOIN services s2 ON oi.item_type = 'service' AND oi.item_id = s2.id
        WHERE oi.order_id = ${orderId}
        ORDER BY oi.created_at ASC
      `
      setOrderItems(itemsResult || [])

      // Reload order to get updated totals
      const orderResult = await sql`
        SELECT 
          o.id,
          o.order_number,
          o.customer_id,
          o.status,
          o.subtotal,
          o.tax_amount,
          o.discount_amount,
          o.total_amount,
          o.currency,
          o.total_paid,
          o.balance_due,
          o.created_at,
          o.updated_at,
          o.closed_at,
          o.cancelled_at,
          o.agency_id,
          o.note,
          c.fullname AS customer_name,
          a.name AS agency_name,
          u.name AS created_by_name
        FROM orders o
        LEFT JOIN customers c ON o.customer_id = c.id
        LEFT JOIN agencies a ON o.agency_id = a.id
        LEFT JOIN users u ON o.created_by = u.id
        WHERE o.id = ${orderId}
        LIMIT 1
      `
      if (orderResult && orderResult.length > 0) {
        setOrder(orderResult[0])
      }

      // Reset form
      setItemType('service')
      setItemId('')
      setItemQuantity('1')
      setItemPrice('')
      setShowAddItem(false)
    } catch (error) {
      console.error('Error adding item:', error)
      alert(t('orderDetail.errors.addItemFailed', 'Failed to add item. Please try again.'))
    } finally {
      setAddingItem(false)
    }
  }

  const handleAddPayment = async (e) => {
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }

    if (!orderId || !order) return

    // Double-submission protection
    if (addingPayment) {
      return
    }

    try {
      if (!paymentAmount || !paymentMethodId) {
        alert(t('orderDetail.errors.paymentRequired', 'Please fill in payment amount and method.'))
        return
      }

      const amount = Number(paymentAmount)
      if (amount <= 0) {
        alert(t('orderDetail.errors.invalidPayment', 'Payment amount must be greater than 0.'))
        return
      }

      setAddingPayment(true)

      // Insert payment (trigger will automatically create transaction and update order totals)
      try {
        await sql`
          INSERT INTO order_payments (order_id, amount, currency, payment_method_id, company_account_id, occurred_at, note)
          VALUES (
            ${orderId},
            ${amount},
            ${order.currency || 'BRL'},
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
                ${orderId},
                ${amount},
                ${order.currency || 'BRL'},
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
      const paymentsResult = await sql`
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
      setOrderPayments(paymentsResult || [])

      // Reload order to get updated totals
      const orderResult = await sql`
        SELECT 
          o.id,
          o.order_number,
          o.customer_id,
          o.status,
          o.subtotal,
          o.tax_amount,
          o.discount_amount,
          o.total_amount,
          o.currency,
          o.total_paid,
          o.balance_due,
          o.created_at,
          o.updated_at,
          o.closed_at,
          o.cancelled_at,
          o.agency_id,
          o.note,
          c.fullname AS customer_name,
          a.name AS agency_name,
          u.name AS created_by_name
        FROM orders o
        LEFT JOIN customers c ON o.customer_id = c.id
        LEFT JOIN agencies a ON o.agency_id = a.id
        LEFT JOIN users u ON o.created_by = u.id
        WHERE o.id = ${orderId}
        LIMIT 1
      `
      if (orderResult && orderResult.length > 0) {
        setOrder(orderResult[0])
      }

      // Reset form
      setPaymentAmount('')
      setPaymentMethodId('')
      setPaymentCompanyAccountId('')
      setShowAddPayment(false)
    } catch (error) {
      console.error('Error adding payment:', error)
      alert(t('orderDetail.errors.addPaymentFailed', 'Failed to add payment. Please try again.'))
    } finally {
      setAddingPayment(false)
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

  const handleRemoveItem = async (itemId) => {
    if (!orderId) return
    if (!window.confirm(t('orderDetail.confirm.removeItem', 'Are you sure you want to remove this item from the order? This action cannot be undone.'))) {
      return
    }
    try {
      await sql`DELETE FROM order_items WHERE id = ${itemId}`
      
      // Reload order items with service information
      const itemsResult = await sql`
        SELECT 
          oi.id,
          oi.item_type,
          oi.item_id,
          oi.item_name,
          oi.quantity,
          oi.unit_price,
          oi.subtotal,
          oi.note,
          oi.created_at,
          CASE 
            WHEN oi.item_type = 'service_package' THEN s.name
            WHEN oi.item_type = 'service' THEN s2.name
            ELSE NULL
          END AS service_name
        FROM order_items oi
        LEFT JOIN service_packages sp ON oi.item_type = 'service_package' AND oi.item_id = sp.id
        LEFT JOIN services s ON sp.service_id = s.id
        LEFT JOIN services s2 ON oi.item_type = 'service' AND oi.item_id = s2.id
        WHERE oi.order_id = ${orderId}
        ORDER BY oi.created_at ASC
      `
      setOrderItems(itemsResult || [])

      // Reload order to get updated totals
      const orderResult = await sql`
        SELECT 
          o.id,
          o.order_number,
          o.customer_id,
          o.status,
          o.subtotal,
          o.tax_amount,
          o.discount_amount,
          o.total_amount,
          o.currency,
          o.total_paid,
          o.balance_due,
          o.created_at,
          o.updated_at,
          o.closed_at,
          o.cancelled_at,
          o.agency_id,
          o.note,
          c.fullname AS customer_name,
          a.name AS agency_name,
          u.name AS created_by_name
        FROM orders o
        LEFT JOIN customers c ON o.customer_id = c.id
        LEFT JOIN agencies a ON o.agency_id = a.id
        LEFT JOIN users u ON o.created_by = u.id
        WHERE o.id = ${orderId}
        LIMIT 1
      `
      if (orderResult && orderResult.length > 0) {
        setOrder(orderResult[0])
      }
    } catch (err) {
      console.error('Failed to remove item:', err)
      alert(t('orderDetail.error.removeItem', 'Unable to remove item. Please try again.'))
    }
  }

  const handleRemovePayment = async (paymentId) => {
    if (!orderId) return
    if (!window.confirm(t('orderDetail.confirm.removePayment', 'Are you sure you want to remove this payment? The associated transaction will also be deleted. This action cannot be undone.'))) {
      return
    }
    try {
      // First, get the payment to check for transaction_id
      const paymentResult = await sql`
        SELECT transaction_id FROM order_payments WHERE id = ${paymentId}
        LIMIT 1
      `
      
      const transactionId = paymentResult?.[0]?.transaction_id

      // Delete the payment (triggers will handle updating order totals)
      await sql`DELETE FROM order_payments WHERE id = ${paymentId}`

      // If there's an associated transaction, delete it
      if (transactionId) {
        await sql`DELETE FROM transactions WHERE id = ${transactionId}`
      }

      // Reload payments
      const paymentsResult = await sql`
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
      setOrderPayments(paymentsResult || [])

      // Reload order to get updated totals
      const orderResult = await sql`
        SELECT 
          o.id,
          o.order_number,
          o.customer_id,
          o.status,
          o.subtotal,
          o.tax_amount,
          o.discount_amount,
          o.total_amount,
          o.currency,
          o.total_paid,
          o.balance_due,
          o.created_at,
          o.updated_at,
          o.closed_at,
          o.cancelled_at,
          o.agency_id,
          o.note,
          c.fullname AS customer_name,
          a.name AS agency_name,
          u.name AS created_by_name
        FROM orders o
        LEFT JOIN customers c ON o.customer_id = c.id
        LEFT JOIN agencies a ON o.agency_id = a.id
        LEFT JOIN users u ON o.created_by = u.id
        WHERE o.id = ${orderId}
        LIMIT 1
      `
      if (orderResult && orderResult.length > 0) {
        setOrder(orderResult[0])
      }
    } catch (err) {
      console.error('Failed to remove payment:', err)
      alert(t('orderDetail.error.removePayment', 'Unable to remove payment. Please try again.'))
    }
  }

  const handleCloseOrder = async () => {
    if (!orderId || !order) return
    
    // Prevent closing if balance is not zero (allowing for small floating point differences)
    const balanceDue = Number(order.balance_due || 0)
    if (Math.abs(balanceDue) > 0.01) {
      alert(t('orderDetail.error.cannotCloseWithBalance', 'Cannot close order. The balance due must be zero. Current balance: {{balance}}', { balance: formatAmount(balanceDue) }))
      return
    }
    
    try {
      await sql`
        UPDATE orders 
        SET status = 'closed', closed_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
        WHERE id = ${orderId}
      `
      // Reload order
      const orderResult = await sql`
        SELECT 
          o.id,
          o.order_number,
          o.customer_id,
          o.status,
          o.subtotal,
          o.tax_amount,
          o.discount_amount,
          o.total_amount,
          o.currency,
          o.total_paid,
          o.balance_due,
          o.created_at,
          o.updated_at,
          o.closed_at,
          o.cancelled_at,
          o.agency_id,
          o.note,
          c.fullname AS customer_name,
          a.name AS agency_name,
          u.name AS created_by_name
        FROM orders o
        LEFT JOIN customers c ON o.customer_id = c.id
        LEFT JOIN agencies a ON o.agency_id = a.id
        LEFT JOIN users u ON o.created_by = u.id
        WHERE o.id = ${orderId}
        LIMIT 1
      `
      if (orderResult && orderResult.length > 0) {
        setOrder(orderResult[0])
      }
    } catch (err) {
      console.error('Failed to close order:', err)
      alert(t('orderDetail.error.close', 'Unable to close order. Please try again.'))
    }
  }

  const handleCancelOrder = async () => {
    if (!orderId || !order) return
    if (!window.confirm(t('orderDetail.confirm.cancel', 'Are you sure you want to cancel this order? This action cannot be undone.'))) {
      return
    }
    try {
      await sql`
        UPDATE orders 
        SET status = 'cancelled', cancelled_at = CURRENT_TIMESTAMP, updated_at = CURRENT_TIMESTAMP
        WHERE id = ${orderId}
      `
      // Reload order
      const orderResult = await sql`
        SELECT 
          o.id,
          o.order_number,
          o.customer_id,
          o.status,
          o.subtotal,
          o.tax_amount,
          o.discount_amount,
          o.total_amount,
          o.currency,
          o.total_paid,
          o.balance_due,
          o.created_at,
          o.updated_at,
          o.closed_at,
          o.cancelled_at,
          o.agency_id,
          o.note,
          c.fullname AS customer_name,
          a.name AS agency_name,
          u.name AS created_by_name
        FROM orders o
        LEFT JOIN customers c ON o.customer_id = c.id
        LEFT JOIN agencies a ON o.agency_id = a.id
        LEFT JOIN users u ON o.created_by = u.id
        WHERE o.id = ${orderId}
        LIMIT 1
      `
      if (orderResult && orderResult.length > 0) {
        setOrder(orderResult[0])
      }
    } catch (err) {
      console.error('Failed to cancel order:', err)
      alert(t('orderDetail.error.cancel', 'Unable to cancel order. Please try again.'))
    }
  }

  if (loading) {
    return (
      <div className="px-4 py-6 sm:p-6 lg:p-8">
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <div className="text-gray-600">{t('orderDetail.loading', 'Loading order details...')}</div>
        </div>
      </div>
    )
  }

  if (error || !order) {
    return (
      <div className="px-4 py-6 sm:p-6 lg:p-8">
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <div className="text-red-600">{error || t('orderDetail.notFound', 'Order not found')}</div>
          {onBack && (
            <button
              onClick={onBack}
              className="mt-4 rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
            >
              {t('orderDetail.back', 'Back')}
            </button>
          )}
        </div>
      </div>
    )
  }

  const statusStyle = statusStyles[order.status] || statusStyles.open
  const formatAmount = (value) => formatCurrency(Number(value || 0), { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  return (
    <div className="px-4 py-6 sm:p-6 lg:p-8">
      <div className="rounded-xl bg-white p-4 sm:p-6 shadow-sm">
        {/* Header */}
        <div className="mb-6 pb-6 border-b border-gray-200">
          <button
            onClick={onBack}
            className="mb-2 flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            {t('orderDetail.back', 'Back')}
          </button>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                {t('orderDetail.title', 'Order {{orderNumber}}', { orderNumber: order.order_number })}
              </h1>
              <p className="text-gray-500 text-sm mt-1">
                {t('orderDetail.subtitle', 'Full details for this customer order.')}
              </p>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              {order.status === 'open' && canModify(user) && (
                <>
                  <button
                    onClick={handleCloseOrder}
                    disabled={Math.abs(Number(order.balance_due || 0)) > 0.01}
                    className="inline-flex items-center justify-center rounded-lg border border-emerald-300 px-3 py-2 text-sm font-semibold text-emerald-700 shadow-sm hover:bg-emerald-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white"
                    title={Math.abs(Number(order.balance_due || 0)) > 0.01 ? t('orderDetail.buttons.closeDisabled', 'Cannot close order. Balance due must be zero. Current balance: {{balance}}', { balance: formatAmount(order.balance_due) }) : t('orderDetail.buttons.close', 'Close Order')}
                  >
                    {t('orderDetail.buttons.close', 'Close Order')}
                  </button>
                  <button
                    onClick={handleCancelOrder}
                    className="inline-flex items-center justify-center rounded-lg border border-red-300 px-3 py-2 text-sm font-semibold text-red-700 shadow-sm hover:bg-red-50 transition-colors"
                  >
                    {t('orderDetail.buttons.cancel', 'Cancel')}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="grid gap-6 xl:grid-cols-4">
          <div className="xl:col-span-3 space-y-6">
            {/* Order Summary */}
            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-center gap-4 mb-4">
                <div>
                  <p className="text-xs font-semibold uppercase text-gray-500">
                    {t('orderDetail.status', 'Status')}
                  </p>
                  <span className={`mt-1 inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${statusStyle.pill}`}>
                    {order.status?.toUpperCase() || 'OPEN'}
                  </span>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase text-gray-500">
                    {t('orderDetail.totalAmount', 'Total Amount')}
                  </p>
                  <p className="text-3xl font-bold text-gray-900">
                    {formatAmount(order.total_amount)}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase text-gray-500">
                    {t('orderDetail.balanceDue', 'Balance Due')}
                  </p>
                  <p className={`text-2xl font-bold ${order.balance_due > 0 ? 'text-rose-700' : 'text-emerald-700'}`}>
                    {formatAmount(order.balance_due)}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase text-gray-500">
                    {t('orderDetail.totalPaid', 'Total Paid')}
                  </p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatAmount(order.total_paid)}
                  </p>
                </div>
              </div>
            </div>

            {/* Order Items */}
            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">
                  {t('orderDetail.items.title', 'Order Items')}
                </h2>
                {canModify(user) && order?.status === 'open' && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      setShowAddItem(!showAddItem)
                    }}
                    className="inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-semibold shadow-sm transition-colors bg-indigo-600 text-white hover:bg-indigo-500"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    {t('orderDetail.items.add', 'Add Item')}
                  </button>
                )}
              </div>

              {/* Add Item Form */}
              {showAddItem && canModify(user) && order?.status === 'open' && (
                <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
                    <div>
                      <label className="mb-1 block text-xs font-medium text-gray-700">
                        {t('orderDetail.itemFields.type', 'Type')}
                      </label>
                      <select
                        value={itemType}
                        onChange={(e) => handleItemTypeChange(e.target.value)}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                      >
                        <option value="service">{t('orderDetail.itemTypes.service', 'Service')}</option>
                        <option value="service_package">{t('orderDetail.itemTypes.servicePackage', 'Service Package')}</option>
                        <option value="product">{t('orderDetail.itemTypes.product', 'Product')}</option>
                      </select>
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-gray-700">
                        {t('orderDetail.itemFields.item', 'Item')}
                      </label>
                      <select
                        value={itemId}
                        onChange={(e) => handleItemIdChange(e.target.value)}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                      >
                        <option value="">{t('orderDetail.itemFields.selectItem', 'Select...')}</option>
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
                        {t('orderDetail.itemFields.quantity', 'Qty')}
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
                        {t('orderDetail.itemFields.unitPrice', 'Unit Price')}
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
                        {addingItem ? t('orderDetail.buttons.adding', 'Adding...') : t('orderDetail.buttons.add', 'Add')}
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
                        {t('orderDetail.buttons.cancel', 'Cancel')}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {orderItems.length === 0 ? (
                <p className="text-gray-500 text-sm">{t('orderDetail.items.empty', 'No items in this order.')}</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {t('orderDetail.items.item', 'Item')}
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {t('orderDetail.items.type', 'Type')}
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {t('orderDetail.items.quantity', 'Qty')}
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {t('orderDetail.items.unitPrice', 'Unit Price')}
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {t('orderDetail.items.subtotal', 'Subtotal')}
                        </th>
                        {order.status === 'open' && canModify(user) && (
                          <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                            {t('orderDetail.items.actions', 'Actions')}
                          </th>
                        )}
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {orderItems.map((item) => (
                        <tr key={item.id}>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">
                              {item.item_name}
                            </div>
                            {item.service_name && item.item_type === 'service_package' && (
                              <div className="text-xs text-gray-500 mt-0.5">
                                {t('orderDetail.items.service', 'Service')}: {item.service_name}
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 capitalize">
                            {item.item_type.replace('_', ' ')}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 text-right">
                            {item.quantity}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 text-right">
                            {formatAmount(item.unit_price)}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-gray-900 text-right">
                            {formatAmount(item.subtotal)}
                          </td>
                          {order.status === 'open' && canModify(user) && (
                            <td className="px-4 py-3 whitespace-nowrap text-center">
                              <button
                                onClick={() => handleRemoveItem(item.id)}
                                className="inline-flex items-center justify-center rounded-lg border border-red-300 px-2 py-1 text-xs font-semibold text-red-700 hover:bg-red-50 transition-colors"
                                title={t('orderDetail.items.remove', 'Remove Item')}
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-gray-50">
                      <tr>
                        <td colSpan={order.status === 'open' && canModify(user) ? 5 : 5} className="px-4 py-3 text-right text-sm font-semibold text-gray-900">
                          {t('orderDetail.items.subtotal', 'Subtotal')}:
                        </td>
                        <td className="px-4 py-3 text-right text-sm font-semibold text-gray-900">
                          {formatAmount(order.subtotal)}
                        </td>
                        {order.status === 'open' && canModify(user) && <td></td>}
                      </tr>
                      {order.discount_amount > 0 && (
                      <tr>
                        <td colSpan={order.status === 'open' && canModify(user) ? 4 : 4} className="px-4 py-3 text-right text-sm font-semibold text-gray-500">
                          {t('orderDetail.items.discount', 'Discount')}:
                        </td>
                          <td className="px-4 py-3 text-right text-sm font-semibold text-red-600">
                            -{formatAmount(order.discount_amount)}
                          </td>
                          {order.status === 'open' && canModify(user) && <td></td>}
                        </tr>
                      )}
                      {order.tax_amount > 0 && (
                        <tr>
                          <td colSpan={order.status === 'open' && canModify(user) ? 4 : 4} className="px-4 py-3 text-right text-sm font-semibold text-gray-500">
                            {t('orderDetail.items.tax', 'Tax')}:
                          </td>
                          <td className="px-4 py-3 text-right text-sm font-semibold text-gray-900">
                            {formatAmount(order.tax_amount)}
                          </td>
                          {order.status === 'open' && canModify(user) && <td></td>}
                        </tr>
                      )}
                      <tr>
                        <td colSpan={order.status === 'open' && canModify(user) ? 4 : 4} className="px-4 py-3 text-right text-sm font-bold text-gray-900">
                          {t('orderDetail.items.total', 'Total')}:
                        </td>
                        <td className="px-4 py-3 text-right text-sm font-bold text-gray-900">
                          {formatAmount(order.total_amount)}
                        </td>
                        {order.status === 'open' && canModify(user) && <td></td>}
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </div>

            {/* Payments */}
            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">
                  {t('orderDetail.payments.title', 'Payments')}
                </h2>
                {canModify(user) && order?.status === 'open' && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      setShowAddPayment(!showAddPayment)
                    }}
                    className="inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-semibold shadow-sm transition-colors bg-emerald-600 text-white hover:bg-emerald-500"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    {t('orderDetail.payments.add', 'Add Payment')}
                  </button>
                )}
              </div>

              {/* Add Payment Form */}
              {showAddPayment && canModify(user) && order?.status === 'open' && (
                <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                    <div>
                      <label className="mb-1 block text-xs font-medium text-gray-700">
                        {t('orderDetail.paymentFields.amount', 'Amount *')}
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
                        {t('orderDetail.paymentFields.method', 'Payment Method *')}
                      </label>
                      <select
                        value={paymentMethodId}
                        onChange={(e) => setPaymentMethodId(e.target.value)}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                      >
                        <option value="">{t('orderDetail.paymentFields.selectMethod', 'Select...')}</option>
                        {paymentMethods.map((pm) => (
                          <option key={pm.id} value={pm.id}>
                            {pm.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-gray-700">
                        {t('orderDetail.paymentFields.account', 'Company Account')}
                      </label>
                      <select
                        value={paymentCompanyAccountId}
                        onChange={(e) => setPaymentCompanyAccountId(e.target.value)}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                      >
                        <option value="">{t('orderDetail.paymentFields.selectAccount', 'Select...')}</option>
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
                        {addingPayment ? t('orderDetail.buttons.addingPayment', 'Adding...') : t('orderDetail.buttons.add', 'Add')}
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
                        {t('orderDetail.buttons.cancel', 'Cancel')}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {orderPayments.length === 0 ? (
                <p className="text-gray-500 text-sm">{t('orderDetail.payments.empty', 'No payments recorded for this order.')}</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {t('orderDetail.payments.date', 'Date')}
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {t('orderDetail.payments.method', 'Payment Method')}
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {t('orderDetail.payments.account', 'Account')}
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {t('orderDetail.payments.amount', 'Amount')}
                        </th>
                        {order.status === 'open' && canModify(user) && (
                          <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                            {t('orderDetail.payments.actions', 'Actions')}
                          </th>
                        )}
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {orderPayments.map((payment) => (
                        <tr key={payment.id}>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                            {formatDateTime(payment.occurred_at)}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                            {payment.payment_method_name || '—'}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                            {payment.company_account_name || '—'}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-emerald-700 text-right">
                            {formatAmount(payment.amount)}
                          </td>
                          {order.status === 'open' && canModify(user) && (
                            <td className="px-4 py-3 whitespace-nowrap text-center">
                              <button
                                onClick={() => handleRemovePayment(payment.id)}
                                className="inline-flex items-center justify-center rounded-lg border border-red-300 px-2 py-1 text-xs font-semibold text-red-700 hover:bg-red-50 transition-colors"
                                title={t('orderDetail.payments.remove', 'Remove Payment')}
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-gray-50">
                      <tr>
                        <td colSpan={order.status === 'open' && canModify(user) ? 3 : 3} className="px-4 py-3 text-right text-sm font-bold text-gray-900">
                          {t('orderDetail.payments.total', 'Total Paid')}:
                        </td>
                        <td className="px-4 py-3 text-right text-sm font-bold text-emerald-700">
                          {formatAmount(order.total_paid)}
                        </td>
                        {order.status === 'open' && canModify(user) && <td></td>}
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </div>

            {/* Order Details */}
            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                {t('orderDetail.details.title', 'Order Details')}
              </h2>
              <dl className="grid gap-4 md:grid-cols-2">
                <div>
                  <dt className="text-xs font-semibold uppercase text-gray-500">
                    {t('orderDetail.details.customer', 'Customer')}
                  </dt>
                  <dd className="mt-1 text-gray-900">{order.customer_name || '—'}</dd>
                </div>
                {order.agency_name && (
                  <div>
                    <dt className="text-xs font-semibold uppercase text-gray-500">
                      {t('orderDetail.details.agency', 'Agency')}
                    </dt>
                    <dd className="mt-1 text-gray-900">{order.agency_name}</dd>
                  </div>
                )}
                {order.note && (
                  <div className="md:col-span-2">
                    <dt className="text-xs font-semibold uppercase text-gray-500">
                      {t('orderDetail.details.note', 'Note')}
                    </dt>
                    <dd className="mt-1 whitespace-pre-wrap text-gray-900">{order.note}</dd>
                  </div>
                )}
              </dl>
            </div>
          </div>

          {/* Sidebar */}
          <div className="xl:col-span-1">
            <DetailInfoPanel
              title={t('orderDetail.info.title', 'Order Information')}
              onEdit={() => onEdit?.(order)}
              onDelete={handleDelete}
              user={user}
              deleting={deleting}
            >
              <dl className="space-y-4 text-sm">
                <div>
                  <dt className="text-xs font-medium text-gray-500 uppercase">{t('orderDetail.info.id', 'ID')}</dt>
                  <dd className="mt-1 text-gray-900 font-mono">#{order.id}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-gray-500 uppercase">{t('orderDetail.info.orderNumber', 'Order Number')}</dt>
                  <dd className="mt-1 text-gray-900">{order.order_number || '—'}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-gray-500 uppercase">{t('orderDetail.info.customer', 'Customer')}</dt>
                  <dd className="mt-1 text-gray-900">{order.customer_name || '—'}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-gray-500 uppercase">{t('orderDetail.info.status', 'Status')}</dt>
                  <dd className="mt-1 text-gray-900 capitalize">{order.status || '—'}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-gray-500 uppercase">{t('orderDetail.info.subtotal', 'Subtotal')}</dt>
                  <dd className="mt-1 text-gray-900">{formatCurrency(order.subtotal || 0)}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-gray-500 uppercase">{t('orderDetail.info.taxAmount', 'Tax Amount')}</dt>
                  <dd className="mt-1 text-gray-900">{formatCurrency(order.tax_amount || 0)}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-gray-500 uppercase">{t('orderDetail.info.discountAmount', 'Discount Amount')}</dt>
                  <dd className="mt-1 text-gray-900">{formatCurrency(order.discount_amount || 0)}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-gray-500 uppercase">{t('orderDetail.info.totalAmount', 'Total Amount')}</dt>
                  <dd className="mt-1 text-gray-900 font-semibold">{formatCurrency(order.total_amount || 0)}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-gray-500 uppercase">{t('orderDetail.info.currency', 'Currency')}</dt>
                  <dd className="mt-1 text-gray-900">{order.currency || 'BRL'}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-gray-500 uppercase">{t('orderDetail.info.totalPaid', 'Total Paid')}</dt>
                  <dd className="mt-1 text-gray-900">{formatCurrency(order.total_paid || 0)}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-gray-500 uppercase">{t('orderDetail.info.balanceDue', 'Balance Due')}</dt>
                  <dd className="mt-1 text-gray-900 font-semibold">{formatCurrency(order.balance_due || 0)}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-gray-500 uppercase">{t('orderDetail.info.agency', 'Agency')}</dt>
                  <dd className="mt-1 text-gray-900">{order.agency_name || '—'}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-gray-500 uppercase">{t('orderDetail.info.note', 'Note')}</dt>
                  <dd className="mt-1 text-gray-900 whitespace-pre-wrap">{order.note || '—'}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-gray-500 uppercase">{t('orderDetail.info.createdAt', 'Created At')}</dt>
                  <dd className="mt-1 text-gray-900">{formatDateTime(order.created_at)}</dd>
                </div>
                {order.updated_at && (
                  <div>
                    <dt className="text-xs font-medium text-gray-500 uppercase">{t('orderDetail.info.updatedAt', 'Updated At')}</dt>
                    <dd className="mt-1 text-gray-900">{formatDateTime(order.updated_at)}</dd>
                  </div>
                )}
                {order.closed_at && (
                  <div>
                    <dt className="text-xs font-medium text-gray-500 uppercase">{t('orderDetail.info.closedAt', 'Closed At')}</dt>
                    <dd className="mt-1 text-gray-900">{formatDateTime(order.closed_at)}</dd>
                  </div>
                )}
                {order.cancelled_at && (
                  <div>
                    <dt className="text-xs font-medium text-gray-500 uppercase">{t('orderDetail.info.cancelledAt', 'Cancelled At')}</dt>
                    <dd className="mt-1 text-gray-900">{formatDateTime(order.cancelled_at)}</dd>
                  </div>
                )}
                {order.created_by_name && (
                  <div>
                    <dt className="text-xs font-medium text-gray-500 uppercase">{t('orderDetail.info.createdBy', 'Created By')}</dt>
                    <dd className="mt-1 text-gray-900">{order.created_by_name}</dd>
                  </div>
                )}
              </dl>
            </DetailInfoPanel>
          </div>
        </div>
      </div>
    </div>
  )
}

export default OrderDetail

