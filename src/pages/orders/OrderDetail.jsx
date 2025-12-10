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

function OrderDetail({ orderId, onBack, onEdit, onDelete, onViewCustomer, user = null }) {
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
  const [itemType, setItemType] = useState('service') // 'service' for Services, 'product' for Products
  const [actualItemType, setActualItemType] = useState('service') // 'service' or 'service_package' or 'product'
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
  
  // For adding refunds
  const [orderRefunds, setOrderRefunds] = useState([])
  const [showAddRefund, setShowAddRefund] = useState(false)
  const [refundAmount, setRefundAmount] = useState('')
  const [refundMethodId, setRefundMethodId] = useState('')
  const [refundCompanyAccountId, setRefundCompanyAccountId] = useState('')
  const [addingRefund, setAddingRefund] = useState(false)
  const [serviceCredits, setServiceCredits] = useState([])

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

        // Fetch order items with service information for packages and credit left
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
            END AS service_name,
            COALESCE(s.duration_unit, s2.duration_unit) as duration_unit,
            COALESCE(s.id, s2.id) as service_id
          FROM order_items oi
          LEFT JOIN service_packages sp ON oi.item_type = 'service_package' AND oi.item_id = sp.id
          LEFT JOIN services s ON sp.service_id = s.id
          LEFT JOIN services s2 ON oi.item_type = 'service' AND oi.item_id = s2.id
          LEFT JOIN customer_service_credits csc ON csc.order_item_id = oi.id
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
        
        // Fetch order refunds
        const refundsResult = await sql`
          SELECT 
            orf.id,
            orf.amount,
            orf.currency,
            orf.payment_method_id,
            orf.occurred_at,
            orf.note,
            orf.transaction_id,
            orf.created_at,
            pm.name AS payment_method_name,
            ca.name AS company_account_name
          FROM order_refunds orf
          LEFT JOIN payment_methods pm ON orf.payment_method_id = pm.id
          LEFT JOIN company_accounts ca ON orf.company_account_id = ca.id
          WHERE orf.order_id = ${orderId}
          ORDER BY orf.occurred_at ASC
        `
        setOrderRefunds(refundsResult || [])
        
        // Load dropdown options for adding items and payments
        const [servicesResult, packagesResult, productsResult, paymentMethodsResult, accountsResult] = await Promise.all([
          sql`SELECT id, name, base_price FROM services WHERE is_active = true ORDER BY name ASC`,
          sql`
            SELECT sp.id, sp.name, sp.price, sp.service_id, s.name AS service_name
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

        // Load service credit balances for this order (for both open and closed orders)
        if (orderResult && orderResult.length > 0) {
          try {
            const creditsResult = await sql`
              SELECT * FROM get_order_all_service_credits(${orderId})
            `
            setServiceCredits(creditsResult || [])
          } catch (creditErr) {
            console.error('Failed to load service credits:', creditErr)
            setServiceCredits([])
          }
        } else {
          setServiceCredits([])
        }

      } catch (err) {
        console.error('Failed to load order details:', err)
        setError(t('orderDetail.error.load', 'Unable to load order details. Please try again later.'))
      } finally {
        setLoading(false)
      }
    }

    fetchOrder()
  }, [orderId, t])

  // Helper function to reload service credits
  const reloadServiceCredits = async () => {
    if (!orderId || !order) {
      setServiceCredits([])
      return
    }
    try {
      const creditsResult = await sql`
        SELECT * FROM get_order_all_service_credits(${orderId})
      `
      setServiceCredits(creditsResult || [])
    } catch (creditErr) {
      console.error('Failed to load service credits:', creditErr)
      setServiceCredits([])
    }
  }

  const handleDelete = async () => {
    if (!orderId) return
    
    // Count all appointments (including completed) that will be deleted
    // This works for both open and closed orders
    const allAppointments = await sql`
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'completed') as completed,
        COUNT(*) FILTER (WHERE status IN ('scheduled', 'rescheduled', 'no_show')) as scheduled
      FROM scheduled_appointments
      WHERE order_id = ${orderId}
    `
    const totalCount = allAppointments?.[0]?.total || 0
    const completedCount = allAppointments?.[0]?.completed || 0
    const scheduledCount = allAppointments?.[0]?.scheduled || 0
    
    // Show warning message for both open and closed orders
    let confirmMessage
    if (totalCount > 0) {
      if (completedCount > 0) {
        confirmMessage = t('orderDetail.confirm.deleteWithCompleted', 'WARNING: This order has {{total}} appointment(s) including {{completed}} completed appointment(s). Deleting will PERMANENTLY DELETE ALL appointments (including completed ones), remove credits, and delete the order. This action cannot be undone. Are you sure?', { 
          total: totalCount, 
          completed: completedCount 
        })
      } else {
        confirmMessage = t('orderDetail.confirm.deleteWithAppointments', 'This order has {{count}} appointment(s). Deleting will PERMANENTLY DELETE ALL appointments, remove credits, and delete the order. This action cannot be undone. Are you sure?', { count: totalCount })
      }
    } else {
      confirmMessage = t('orderDetail.confirm.delete', 'Are you sure you want to delete this order? This will remove all credits and delete the order. This action cannot be undone.')
    }
    
    if (!window.confirm(confirmMessage)) {
      return
    }
    try {
      setDeleting(true)
      
      // Delete credits associated with this order's items (before deleting order)
      // Note: Database CASCADE should handle this, but we're being explicit
      await sql`
        DELETE FROM customer_service_credits
        WHERE order_item_id IN (
          SELECT id FROM order_items WHERE order_id = ${orderId}
        )
      `
      
      // Delete the order
      // All appointments (including completed) will be automatically deleted via CASCADE
      // (scheduled_appointments.order_id has ON DELETE CASCADE constraint)
      // Order items will also be deleted via CASCADE
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

      // Get item name based on actual type
      let itemName = ''
      if (actualItemType === 'service') {
        const service = services.find(s => s.id.toString() === itemId)
        itemName = service?.name || `Service #${itemId}`
      } else if (actualItemType === 'service_package') {
        const pkg = servicePackages.find(p => p.id.toString() === itemId)
        itemName = pkg?.name || `Package #${itemId}`
      } else if (actualItemType === 'product') {
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
              ${actualItemType}, 
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
                  ${actualItemType}, 
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

      // Reload order items with service information and credit left
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
          END AS service_name,
          COALESCE(s.duration_unit, s2.duration_unit) as duration_unit,
          CASE 
            WHEN csc.id IS NULL THEN NULL
            WHEN COALESCE(s.duration_unit, s2.duration_unit) = 'hours' THEN 
              csc.total_hours - (
                SELECT COALESCE(SUM(sa.duration_hours), 0)
                FROM scheduled_appointments sa
                WHERE sa.credit_id = csc.id
                  AND sa.order_id = ${orderId}
                  AND sa.status IN ('scheduled', 'completed')
                  AND sa.cancelled_at IS NULL
              )
            WHEN COALESCE(s.duration_unit, s2.duration_unit) = 'days' THEN 
              csc.total_days - (
                SELECT COALESCE(SUM(sa.duration_days), 0)
                FROM scheduled_appointments sa
                WHERE sa.credit_id = csc.id
                  AND sa.order_id = ${orderId}
                  AND sa.status IN ('scheduled', 'completed')
                  AND sa.cancelled_at IS NULL
              )
            WHEN COALESCE(s.duration_unit, s2.duration_unit) = 'months' THEN 
              csc.total_months::NUMERIC - (
                SELECT COALESCE(SUM(sa.duration_months), 0)::NUMERIC
                FROM scheduled_appointments sa
                WHERE sa.credit_id = csc.id
                  AND sa.order_id = ${orderId}
                  AND sa.status IN ('scheduled', 'completed')
                  AND sa.cancelled_at IS NULL
              )
            ELSE NULL
          END as credit_left
        FROM order_items oi
        LEFT JOIN service_packages sp ON oi.item_type = 'service_package' AND oi.item_id = sp.id
        LEFT JOIN services s ON sp.service_id = s.id
        LEFT JOIN services s2 ON oi.item_type = 'service' AND oi.item_id = s2.id
        LEFT JOIN customer_service_credits csc ON csc.order_item_id = oi.id
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

      // Reload service credits after adding item
      await reloadServiceCredits()

      // Reset form
      setItemType('service')
      setActualItemType('service')
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
      if (!paymentAmount || !paymentMethodId || !paymentCompanyAccountId) {
        alert(t('orderDetail.errors.paymentRequired', 'Please fill in payment amount, method, and company account.'))
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
            ${Number(paymentCompanyAccountId)},
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

  // Build combined services list (services with their packages grouped)
  const getCombinedServicesList = () => {
    const combined = []
    
    // Group packages by service_id
    const packagesByService = {}
    servicePackages.forEach(pkg => {
      const serviceId = pkg.service_id
      if (!packagesByService[serviceId]) {
        packagesByService[serviceId] = []
      }
      packagesByService[serviceId].push(pkg)
    })
    
    // Add services with their packages
    services.forEach(service => {
      // Add the service itself
      combined.push({
        id: service.id,
        name: service.name,
        type: 'service',
        price: service.base_price
      })
      
      // Add packages for this service
      const packages = packagesByService[service.id] || []
      packages.forEach(pkg => {
        combined.push({
          id: pkg.id,
          name: pkg.name,
          type: 'service_package',
          price: pkg.price,
          serviceName: service.name
        })
      })
    })
    
    // Add services that have packages but weren't in the services list (shouldn't happen, but safety)
    Object.keys(packagesByService).forEach(serviceId => {
      const service = services.find(s => s.id === Number(serviceId))
      if (!service) {
        // Service not found, add packages anyway
        packagesByService[serviceId].forEach(pkg => {
          combined.push({
            id: pkg.id,
            name: pkg.name,
            type: 'service_package',
            price: pkg.price,
            serviceName: pkg.service_name
          })
        })
      }
    })
    
    return combined
  }

  const handleItemTypeChange = (type) => {
    setItemType(type)
    setActualItemType(type === 'service' ? 'service' : 'product')
    setItemId('')
    setItemPrice('')
  }

  const handleItemIdChange = (id) => {
    setItemId(id)
    
    if (itemType === 'service') {
      // Check if it's a service or service_package from the combined list
      const combinedList = getCombinedServicesList()
      const selectedItem = combinedList.find(item => item.id.toString() === id)
      if (selectedItem) {
        setActualItemType(selectedItem.type)
        setItemPrice(selectedItem.price?.toString() || '')
      }
    } else if (itemType === 'product') {
      setActualItemType('product')
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
      
      // Reload order items with service information and credit left
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
          END AS service_name,
          COALESCE(s.duration_unit, s2.duration_unit) as duration_unit,
          CASE 
            WHEN csc.id IS NULL THEN NULL
            WHEN COALESCE(s.duration_unit, s2.duration_unit) = 'hours' THEN 
              csc.total_hours - (
                SELECT COALESCE(SUM(sa.duration_hours), 0)
                FROM scheduled_appointments sa
                WHERE sa.credit_id = csc.id
                  AND sa.order_id = ${orderId}
                  AND sa.status IN ('scheduled', 'completed')
                  AND sa.cancelled_at IS NULL
              )
            WHEN COALESCE(s.duration_unit, s2.duration_unit) = 'days' THEN 
              csc.total_days - (
                SELECT COALESCE(SUM(sa.duration_days), 0)
                FROM scheduled_appointments sa
                WHERE sa.credit_id = csc.id
                  AND sa.order_id = ${orderId}
                  AND sa.status IN ('scheduled', 'completed')
                  AND sa.cancelled_at IS NULL
              )
            WHEN COALESCE(s.duration_unit, s2.duration_unit) = 'months' THEN 
              csc.total_months::NUMERIC - (
                SELECT COALESCE(SUM(sa.duration_months), 0)::NUMERIC
                FROM scheduled_appointments sa
                WHERE sa.credit_id = csc.id
                  AND sa.order_id = ${orderId}
                  AND sa.status IN ('scheduled', 'completed')
                  AND sa.cancelled_at IS NULL
              )
            ELSE NULL
          END as credit_left
        FROM order_items oi
        LEFT JOIN service_packages sp ON oi.item_type = 'service_package' AND oi.item_id = sp.id
        LEFT JOIN services s ON sp.service_id = s.id
        LEFT JOIN services s2 ON oi.item_type = 'service' AND oi.item_id = s2.id
        LEFT JOIN customer_service_credits csc ON csc.order_item_id = oi.id
        WHERE oi.order_id = ${orderId}
        ORDER BY oi.created_at ASC
      `
      setOrderItems(itemsResult || [])

      // Reload service credits after removing item
      await reloadServiceCredits()

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

  const handleAddRefund = async (e) => {
    if (e) {
      e.preventDefault()
      e.stopPropagation()
    }

    if (!orderId || !order) return

    // Double-submission protection
    if (addingRefund) {
      return
    }

    try {
      if (!refundAmount || !refundMethodId || !refundCompanyAccountId) {
        alert(t('orderDetail.errors.refundRequired', 'Please fill in refund amount, method, and company account.'))
        return
      }

      const amount = Number(refundAmount)
      if (amount <= 0) {
        alert(t('orderDetail.errors.invalidRefund', 'Refund amount must be greater than 0.'))
        return
      }

      setAddingRefund(true)

      const occurredAt = new Date().toISOString()

      // Get the CUSTOMER_REFUND transaction type
      const refundTypeResult = await sql`
        SELECT id FROM transaction_types WHERE code = 'CUSTOMER_REFUND' LIMIT 1
      `
      
      if (!refundTypeResult || refundTypeResult.length === 0) {
        throw new Error('CUSTOMER_REFUND transaction type not found')
      }
      
      const refundTypeId = refundTypeResult[0].id

      // Create transaction for the refund
      let transactionId = null
      try {
        const transactionResult = await sql`
          INSERT INTO transactions (
            occurred_at,
            amount,
            currency,
            type_id,
            payment_method_id,
            source_entity_type,
            source_entity_id,
            destination_entity_type,
            destination_entity_id,
            reference,
            note,
            created_by
          ) VALUES (
            ${occurredAt},
            ${amount},
            ${order.currency || 'BRL'},
            ${refundTypeId},
            ${Number(refundMethodId)},
            'company_account',
            ${Number(refundCompanyAccountId)},
            'customer',
            ${order.customer_id},
            ${order.order_number || null},
            ${null},
            ${user?.id || null}
          )
          RETURNING id
        `
        transactionId = transactionResult?.[0]?.id
      } catch (transactionError) {
        console.error('Error creating refund transaction:', transactionError)
        throw transactionError
      }

      // Insert refund with transaction_id
      try {
        await sql`
          INSERT INTO order_refunds (order_id, amount, currency, payment_method_id, company_account_id, occurred_at, note, transaction_id)
          VALUES (
            ${orderId},
            ${amount},
            ${order.currency || 'BRL'},
            ${Number(refundMethodId)},
            ${Number(refundCompanyAccountId)},
            ${occurredAt},
            ${null},
            ${transactionId}
          )
        `
      } catch (insertError) {
        // If refund insert fails, delete the transaction we just created
        if (transactionId) {
          try {
            await sql`DELETE FROM transactions WHERE id = ${transactionId}`
          } catch (deleteError) {
            console.error('Error deleting transaction after refund insert failure:', deleteError)
          }
        }
        
        // Check if it's a duplicate key error
        if (insertError.message && insertError.message.includes('duplicate key value violates unique constraint "order_refunds_pkey"')) {
          // Reset the sequence and retry once
          try {
            await sql`
              SELECT setval('order_refunds_id_seq', COALESCE((SELECT MAX(id) FROM order_refunds), 0) + 1, false)
            `
            // Recreate transaction for retry
            const retryTransactionResult = await sql`
              INSERT INTO transactions (
                occurred_at,
                amount,
                currency,
                type_id,
                payment_method_id,
                source_entity_type,
                source_entity_id,
                destination_entity_type,
                destination_entity_id,
                reference,
                note,
                created_by
              ) VALUES (
                ${occurredAt},
                ${-amount},
                ${order.currency || 'BRL'},
                ${refundTypeId},
                ${Number(refundMethodId)},
                'company_account',
                ${Number(refundCompanyAccountId)},
                'customer',
                ${order.customer_id},
                ${order.order_number || null},
                ${null},
                ${user?.id || null}
              )
              RETURNING id
            `
            transactionId = retryTransactionResult?.[0]?.id
            
            // Retry the insert
            await sql`
              INSERT INTO order_refunds (order_id, amount, currency, payment_method_id, company_account_id, occurred_at, note, transaction_id)
              VALUES (
                ${orderId},
                ${amount},
                ${order.currency || 'BRL'},
                ${Number(refundMethodId)},
                ${Number(refundCompanyAccountId)},
                ${occurredAt},
                ${null},
                ${transactionId}
              )
            `
          } catch (retryError) {
            // If retry also fails, delete the transaction
            if (transactionId) {
              try {
                await sql`DELETE FROM transactions WHERE id = ${transactionId}`
              } catch (deleteError) {
                console.error('Error deleting transaction after retry failure:', deleteError)
              }
            }
            // Throw the original error
            throw insertError
          }
        } else {
          // If it's a different error, throw it
          throw insertError
        }
      }

      // Reload refunds
      const refundsResult = await sql`
        SELECT 
          orf.id,
          orf.amount,
          orf.currency,
          orf.payment_method_id,
          orf.occurred_at,
          orf.note,
          orf.transaction_id,
          orf.created_at,
          pm.name AS payment_method_name,
          ca.name AS company_account_name
        FROM order_refunds orf
        LEFT JOIN payment_methods pm ON orf.payment_method_id = pm.id
        LEFT JOIN company_accounts ca ON orf.company_account_id = ca.id
        WHERE orf.order_id = ${orderId}
        ORDER BY orf.occurred_at ASC
      `
      setOrderRefunds(refundsResult || [])

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
      setRefundAmount('')
      setRefundMethodId('')
      setRefundCompanyAccountId('')
      setShowAddRefund(false)
    } catch (error) {
      console.error('Error adding refund:', error)
      alert(t('orderDetail.errors.addRefundFailed', 'Failed to add refund. Please try again.'))
    } finally {
      setAddingRefund(false)
    }
  }

  const handleRemoveRefund = async (refundId) => {
    if (!orderId) return
    if (!window.confirm(t('orderDetail.confirm.removeRefund', 'Are you sure you want to remove this refund? The associated transaction will also be deleted. This action cannot be undone.'))) {
      return
    }
    try {
      // First, get the refund to check for transaction_id
      const refundResult = await sql`
        SELECT transaction_id FROM order_refunds WHERE id = ${refundId}
        LIMIT 1
      `
      
      const transactionId = refundResult?.[0]?.transaction_id

      // Delete the refund
      await sql`DELETE FROM order_refunds WHERE id = ${refundId}`

      // If there's an associated transaction, delete it
      if (transactionId) {
        await sql`DELETE FROM transactions WHERE id = ${transactionId}`
      }

      // Reload refunds
      const refundsResult = await sql`
        SELECT 
          orf.id,
          orf.amount,
          orf.currency,
          orf.payment_method_id,
          orf.occurred_at,
          orf.note,
          orf.transaction_id,
          orf.created_at,
          pm.name AS payment_method_name,
          ca.name AS company_account_name
        FROM order_refunds orf
        LEFT JOIN payment_methods pm ON orf.payment_method_id = pm.id
        LEFT JOIN company_accounts ca ON orf.company_account_id = ca.id
        WHERE orf.order_id = ${orderId}
        ORDER BY orf.occurred_at ASC
      `
      setOrderRefunds(refundsResult || [])

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
      console.error('Failed to remove refund:', err)
      alert(t('orderDetail.error.removeRefund', 'Unable to remove refund. Please try again.'))
    }
  }

  const handleCloseOrder = async () => {
    if (!orderId || !order) return
    
    // Prevent closing if balance is not zero (allowing for small floating point differences)
    // Recalculate balance including refunds: total_amount - total_paid + total_refunded
    const totalRefunded = orderRefunds.reduce((sum, r) => sum + Number(r.amount || 0), 0)
    const calculatedBalance = Number(order.total_amount || 0) - Number(order.total_paid || 0) + totalRefunded
    if (Math.abs(calculatedBalance) > 0.01) {
      alert(t('orderDetail.error.cannotCloseWithBalance', 'Cannot close order. The balance due must be zero. Current balance: {{balance}}', { balance: formatAmount(calculatedBalance) }))
      return
    }
    
    // Note: Orders can now be closed even with positive credits
    // Credits from closed orders are not counted for new orders
    
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
    
    // Check if there are completed appointments for this order
    const completedAppointments = await sql`
      SELECT COUNT(*) as count
      FROM scheduled_appointments
      WHERE order_id = ${orderId}
        AND status = 'completed'
    `
    const hasCompleted = completedAppointments?.[0]?.count > 0
    
    // Cannot cancel if there are completed appointments
    if (hasCompleted) {
      alert(t('orderDetail.error.cannotCancelWithCompleted', 'Cannot cancel order. This order has {{count}} completed appointment(s). Orders with completed appointments cannot be cancelled.', { count: completedAppointments[0].count }))
      return
    }
    
    // Check how many appointments will be cancelled
    const appointmentsToCancel = await sql`
      SELECT COUNT(*) as count
      FROM scheduled_appointments
      WHERE order_id = ${orderId}
        AND status IN ('scheduled', 'rescheduled', 'no_show')
    `
    const appointmentCount = appointmentsToCancel?.[0]?.count || 0
    
    const confirmMessage = appointmentCount > 0
      ? t('orderDetail.confirm.cancel', 'Are you sure you want to cancel this order? This will cancel {{count}} appointment(s) and remove all credits. This action cannot be undone.', { count: appointmentCount })
      : t('orderDetail.confirm.cancelNoAppointments', 'Are you sure you want to cancel this order? This will remove all credits. This action cannot be undone.')
    
    if (!window.confirm(confirmMessage)) {
      return
    }
    try {
      // Cancel all scheduled/rescheduled/no_show appointments
      await sql`
        UPDATE scheduled_appointments
        SET status = 'cancelled',
            cancelled_at = CURRENT_TIMESTAMP,
            updated_at = CURRENT_TIMESTAMP
        WHERE order_id = ${orderId}
          AND status IN ('scheduled', 'rescheduled', 'no_show')
      `
      
      // Delete all credits associated with this order's items
      await sql`
        DELETE FROM customer_service_credits
        WHERE order_item_id IN (
          SELECT id FROM order_items WHERE order_id = ${orderId}
        )
      `
      
      // Update order status to cancelled
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
        <div className="mb-6">
          <button
            onClick={onBack}
            className="mb-2 flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            {t('orderDetail.back', 'Back')}
          </button>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between mb-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 break-words">
                  {t('orderDetail.title', 'Order {{orderNumber}}', { orderNumber: order.order_number })}
                </h1>
                <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold ${statusStyle.pill}`}>
                  {order.status?.toUpperCase() || 'OPEN'}
                </span>
              </div>
              {order.customer_name && (
                <div className="mt-2 flex items-center gap-2">
                  <span className="text-sm text-gray-600">{order.customer_name}</span>
                  {order.customer_id && onViewCustomer && (
                    <button
                      onClick={() => onViewCustomer({ id: order.customer_id, fullname: order.customer_name })}
                      className="inline-flex items-center justify-center p-1 rounded text-gray-500 hover:text-gray-700 hover:bg-gray-100 transition-colors"
                      title={t('orderDetail.viewCustomer', 'View Customer')}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </button>
                  )}
                </div>
              )}
            </div>
            {order.status === 'open' && canModify(user) && (
              <div className="flex items-center gap-2 flex-wrap sm:flex-nowrap">
                <button
                  onClick={handleCloseOrder}
                  disabled={(() => {
                    const totalRefunded = orderRefunds.reduce((sum, r) => sum + Number(r.amount || 0), 0)
                    const calculatedBalance = Number(order.total_amount || 0) - Number(order.total_paid || 0) + totalRefunded
                    const hasNonZeroBalance = Math.abs(calculatedBalance) > 0.01
                    
                    // Only check balance, not credits - orders can be closed with positive credits
                    return hasNonZeroBalance
                  })()}
                  className="inline-flex items-center justify-center rounded-lg border border-emerald-300 px-3 py-2 text-sm font-semibold text-emerald-700 shadow-sm hover:bg-emerald-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white whitespace-nowrap"
                  title={(() => {
                    const totalRefunded = orderRefunds.reduce((sum, r) => sum + Number(r.amount || 0), 0)
                    const calculatedBalance = Number(order.total_amount || 0) - Number(order.total_paid || 0) + totalRefunded
                    const hasNonZeroBalance = Math.abs(calculatedBalance) > 0.01
                    
                    if (hasNonZeroBalance) {
                      return t('orderDetail.buttons.closeDisabled', 'Cannot close order. Balance due must be zero. Current balance: {{balance}}', { balance: formatAmount(calculatedBalance) })
                    }
                    return t('orderDetail.buttons.close', 'Close Order')
                  })()}
                >
                  {t('orderDetail.buttons.close', 'Close Order')}
                </button>
                <button
                  onClick={handleCancelOrder}
                  className="inline-flex items-center justify-center rounded-lg border border-red-300 px-3 py-2 text-sm font-semibold text-red-700 shadow-sm hover:bg-red-50 transition-colors whitespace-nowrap"
                >
                  {t('orderDetail.buttons.cancel', 'Cancel Order')}
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-4">
          <div className="lg:col-span-3 space-y-6">
            {/* Order Summary */}
            <div className="rounded-xl border border-gray-200 bg-white p-4 sm:p-5 shadow-sm">
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
                <div>
                  <p className="text-xs font-semibold uppercase text-gray-500">
                    {t('orderDetail.totalAmount', 'Total Amount')}
                  </p>
                  <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 break-words">
                    {formatAmount(order.total_amount)}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase text-gray-500">
                    {t('orderDetail.balanceDue', 'Balance Due')}
                  </p>
                  <p className={`text-xl sm:text-2xl font-bold break-words ${(() => {
                    const totalRefunded = orderRefunds.reduce((sum, r) => sum + Number(r.amount || 0), 0)
                    const calculatedBalance = Number(order.total_amount || 0) - Number(order.total_paid || 0) + totalRefunded
                    return calculatedBalance > 0 ? 'text-rose-700' : 'text-emerald-700'
                  })()}`}>
                    {(() => {
                      const totalRefunded = orderRefunds.reduce((sum, r) => sum + Number(r.amount || 0), 0)
                      const calculatedBalance = Number(order.total_amount || 0) - Number(order.total_paid || 0) + totalRefunded
                      return formatAmount(calculatedBalance)
                    })()}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase text-gray-500">
                    {t('orderDetail.totalPaid', 'Total Paid')}
                  </p>
                  <p className="text-xl sm:text-2xl font-bold text-gray-900 break-words">
                    {formatAmount(order.total_paid)}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold uppercase text-gray-500">
                    {t('orderDetail.totalRefund', 'Total Refund')}
                  </p>
                  <p className="text-xl sm:text-2xl font-bold text-rose-700 break-words">
                    {formatAmount(orderRefunds.reduce((sum, r) => sum + Number(r.amount || 0), 0))}
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
                {canModify(user) && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      if (order?.status === 'open') {
                        setShowAddItem(!showAddItem)
                      }
                    }}
                    disabled={order?.status !== 'open'}
                    className="inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-semibold shadow-sm transition-colors bg-indigo-600 text-white hover:bg-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-indigo-600"
                    title={order?.status !== 'open' ? t('orderDetail.items.cannotAddClosed', 'Cannot add items to a closed order') : ''}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    {t('orderDetail.items.add', 'Add Item')}
                  </button>
                )}
              </div>

              {/* Add Item Form */}
              {showAddItem && canModify(user) && (
                <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
                    <div>
                      <label className="mb-1 block text-xs font-medium text-gray-700">
                        {t('orderDetail.itemFields.type', 'Type')}
                      </label>
                      <select
                        value={itemType}
                        onChange={(e) => handleItemTypeChange(e.target.value)}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                      >
                        <option value="service">{t('orderDetail.itemTypes.services', 'Services')}</option>
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
                        {itemType === 'service' && getCombinedServicesList().map((item) => (
                          <option key={`${item.type}-${item.id}`} value={item.id}>
                            {item.type === 'service_package' ? `  └ ${item.name}` : item.name}
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
                <>
                  {/* Mobile Card View */}
                  <div className="block sm:hidden space-y-3">
                    {orderItems.map((item) => (
                      <div key={item.id} className="border border-gray-200 rounded-lg p-4 bg-white">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1 min-w-0">
                            {item.service_name && item.item_type === 'service_package' ? (
                              <>
                                <div className="text-sm font-medium text-gray-900 break-words">
                                  {item.service_name}
                                </div>
                                <div className="text-xs text-gray-500 mt-0.5 break-words">
                                  {item.item_name}
                                </div>
                              </>
                            ) : (
                              <div className="text-sm font-medium text-gray-900 break-words">
                                {item.item_name}
                              </div>
                            )}
                            <div className="text-xs text-gray-500 mt-1 capitalize">
                              {item.item_type.replace('_', ' ')}
                            </div>
                            {(() => {
                              // Match service credits by service_id to get the balance
                              const serviceCredit = serviceCredits.find(sc => sc.service_id === item.service_id)
                              if (serviceCredit && serviceCredit.balance !== null && serviceCredit.balance !== undefined) {
                                return (
                                  <div className="text-xs mt-1">
                                    <span className="text-gray-500">{t('orderDetail.items.credits', 'Credits')}: </span>
                                    <span className={Number(serviceCredit.balance) < 0 ? 'text-red-600 font-semibold' : Number(serviceCredit.balance) > 0 ? 'text-green-600 font-medium' : 'text-gray-500'}>
                                      {Number(serviceCredit.balance).toFixed(2)} {serviceCredit.duration_unit || ''}
                                    </span>
                                  </div>
                                )
                              }
                              return null
                            })()}
                          </div>
                            {canModify(user) && (
                              <button
                                onClick={() => {
                                  if (order.status === 'open') {
                                    handleRemoveItem(item.id)
                                  }
                                }}
                                disabled={order.status !== 'open'}
                                className="ml-2 inline-flex items-center justify-center rounded-lg border border-red-300 px-2 py-1 text-xs font-semibold text-red-700 hover:bg-red-50 transition-colors flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white"
                                title={order.status !== 'open' ? t('orderDetail.items.cannotRemoveClosed', 'Cannot remove items from a closed order') : t('orderDetail.items.remove', 'Remove Item')}
                              >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          )}
                        </div>
                        <div className="grid grid-cols-2 gap-2 mt-3 text-sm">
                          <div>
                            <span className="text-gray-500">{t('orderDetail.items.quantity', 'Qty')}: </span>
                            <span className="font-medium text-gray-900">{item.quantity}</span>
                          </div>
                          <div className="text-right">
                            <span className="text-gray-500">{t('orderDetail.items.unitPrice', 'Unit Price')}: </span>
                            <span className="font-medium text-gray-900">{formatAmount(item.unit_price)}</span>
                          </div>
                          <div className="col-span-2 text-right pt-2 border-t border-gray-200">
                            <span className="text-gray-500">{t('orderDetail.items.subtotal', 'Subtotal')}: </span>
                            <span className="font-semibold text-gray-900">{formatAmount(item.subtotal)}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Desktop Table View */}
                  <div className="hidden sm:block overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {t('orderDetail.items.item', 'Item')}
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {t('orderDetail.items.type', 'Type')}
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {t('orderDetail.items.credits', 'Credits')}
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
                         {canModify(user) && (
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
                            {item.service_name && item.item_type === 'service_package' ? (
                              <>
                                <div className="text-sm font-medium text-gray-900">
                                  {item.service_name}
                                </div>
                                <div className="text-xs text-gray-500 mt-0.5">
                                  {item.item_name}
                                </div>
                              </>
                            ) : (
                              <div className="text-sm font-medium text-gray-900">
                                {item.item_name}
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 capitalize">
                            {item.item_type.replace('_', ' ')}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                            {(() => {
                              // Match service credits by service_id to get the balance
                              const serviceCredit = serviceCredits.find(sc => sc.service_id === item.service_id)
                              if (serviceCredit && serviceCredit.balance !== null && serviceCredit.balance !== undefined) {
                                return (
                                  <span className={Number(serviceCredit.balance) < 0 ? 'text-red-600 font-semibold' : Number(serviceCredit.balance) > 0 ? 'text-green-600' : 'text-gray-500'}>
                                    {Number(serviceCredit.balance).toFixed(2)} {serviceCredit.duration_unit || ''}
                                  </span>
                                )
                              }
                              return <span className="text-gray-400">—</span>
                            })()}
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
                           {canModify(user) && (
                              <td className="px-4 py-3 whitespace-nowrap text-center">
                                <button
                                  onClick={() => {
                                    if (order.status === 'open') {
                                      handleRemoveItem(item.id)
                                    }
                                  }}
                                  disabled={order.status !== 'open'}
                                  className="inline-flex items-center justify-center rounded-lg border border-red-300 px-2 py-1 text-xs font-semibold text-red-700 hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white"
                                  title={order.status !== 'open' ? t('orderDetail.items.cannotRemoveClosed', 'Cannot remove items from a closed order') : t('orderDetail.items.remove', 'Remove Item')}
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
                      {order.discount_amount > 0 && (
                      <tr>
                         <td colSpan={canModify(user) ? 6 : 5} className="px-4 py-3 text-right text-sm font-semibold text-gray-500">
                            {t('orderDetail.items.discount', 'Discount')}:
                          </td>
                            <td className="px-4 py-3 text-right text-sm font-semibold text-red-600">
                              -{formatAmount(order.discount_amount)}
                            </td>
                           {canModify(user) && <td></td>}
                        </tr>
                      )}
                      {order.tax_amount > 0 && (
                        <tr>
                           <td colSpan={canModify(user) ? 6 : 5} className="px-4 py-3 text-right text-sm font-semibold text-gray-500">
                              {t('orderDetail.items.tax', 'Tax')}:
                            </td>
                            <td className="px-4 py-3 text-right text-sm font-semibold text-gray-900">
                              {formatAmount(order.tax_amount)}
                            </td>
                           {canModify(user) && <td></td>}
                        </tr>
                      )}
                      <tr>
                         <td colSpan={canModify(user) ? 6 : 5} className="px-4 py-3 text-right text-sm font-bold text-gray-900">
                            {t('orderDetail.items.total', 'Total')}:
                          </td>
                          <td className="px-4 py-3 text-right text-sm font-bold text-gray-900">
                            {formatAmount(order.total_amount)}
                          </td>
                         {canModify(user) && <td></td>}
                      </tr>
                    </tfoot>
                  </table>
                </div>
                </>
              )}
            </div>

            {/* Payments */}
            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">
                  {t('orderDetail.payments.title', 'Payments')}
                </h2>
                {canModify(user) && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      if (order?.status === 'open') {
                        setShowAddPayment(!showAddPayment)
                      }
                    }}
                    disabled={order?.status !== 'open'}
                    className="inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-semibold shadow-sm transition-colors bg-emerald-600 text-white hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-emerald-600"
                    title={order?.status !== 'open' ? t('orderDetail.payments.cannotAddClosed', 'Cannot add payments to a closed order') : ''}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    {t('orderDetail.payments.add', 'Add Payment')}
                  </button>
                )}
              </div>

              {/* Add Payment Form */}
              {showAddPayment && canModify(user) && (
                <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
                        {t('orderDetail.paymentFields.account', 'Company Account')} *
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
                <>
                  {/* Mobile Card View */}
                  <div className="block sm:hidden space-y-3">
                    {orderPayments.map((payment) => (
                      <div key={payment.id} className="border border-gray-200 rounded-lg p-4 bg-white">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-gray-900">
                              {formatAmount(payment.amount)}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              {formatDateTime(payment.occurred_at)}
                            </div>
                          </div>
                           {canModify(user) && (
                              <button
                                onClick={() => {
                                  if (order.status === 'open') {
                                    handleRemovePayment(payment.id)
                                  }
                                }}
                                disabled={order.status !== 'open'}
                                className="ml-2 inline-flex items-center justify-center rounded-lg border border-red-300 px-2 py-1 text-xs font-semibold text-red-700 hover:bg-red-50 transition-colors flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white"
                                title={order.status !== 'open' ? t('orderDetail.payments.cannotRemoveClosed', 'Cannot remove payments from a closed order') : t('orderDetail.payments.remove', 'Remove Payment')}
                              >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          )}
                        </div>
                        <div className="mt-2 space-y-1 text-sm">
                          <div>
                            <span className="text-gray-500">{t('orderDetail.payments.method', 'Payment Method')}: </span>
                            <span className="text-gray-900">{payment.payment_method_name || '—'}</span>
                          </div>
                          {payment.company_account_name && (
                            <div>
                              <span className="text-gray-500">{t('orderDetail.payments.account', 'Account')}: </span>
                              <span className="text-gray-900">{payment.company_account_name}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {/* Desktop Table View */}
                  <div className="hidden sm:block overflow-x-auto">
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
                        {canModify(user) && (
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
                          {canModify(user) && (
                            <td className="px-4 py-3 whitespace-nowrap text-center">
                              <button
                                onClick={() => {
                                  if (order.status === 'open') {
                                    handleRemovePayment(payment.id)
                                  }
                                }}
                                disabled={order.status !== 'open'}
                                className="inline-flex items-center justify-center rounded-lg border border-red-300 px-2 py-1 text-xs font-semibold text-red-700 hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white"
                                title={order.status !== 'open' ? t('orderDetail.payments.cannotRemoveClosed', 'Cannot remove payments from a closed order') : t('orderDetail.payments.remove', 'Remove Payment')}
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
                        <td colSpan={canModify(user) ? 4 : 3} className="px-4 py-3 text-right text-sm font-bold text-gray-900">
                          {t('orderDetail.payments.total', 'Total Paid')}:
                        </td>
                        <td className="px-4 py-3 text-right text-sm font-bold text-emerald-700">
                          {formatAmount(order.total_paid)}
                        </td>
                        {canModify(user) && <td></td>}
                      </tr>
                    </tfoot>
                  </table>
                </div>
                </>
              )}
            </div>

            {/* Refunds */}
            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">
                  {t('orderDetail.refunds.title', 'Refunds')}
                </h2>
                {canModify(user) && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      if (order?.status === 'open') {
                        setShowAddRefund(!showAddRefund)
                      }
                    }}
                    disabled={order?.status !== 'open'}
                    className="inline-flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-semibold shadow-sm transition-colors bg-rose-600 text-white hover:bg-rose-500 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-rose-600"
                    title={order?.status !== 'open' ? t('orderDetail.refunds.cannotAddClosed', 'Cannot add refunds to a closed order') : ''}
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                    {t('orderDetail.refunds.add', 'Add Refund')}
                  </button>
                )}
              </div>

              {/* Add Refund Form */}
              {showAddRefund && canModify(user) && (
                <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <div>
                      <label className="mb-1 block text-xs font-medium text-gray-700">
                        {t('orderDetail.refundFields.method', 'Payment Method *')}
                      </label>
                      <select
                        value={refundMethodId}
                        onChange={(e) => setRefundMethodId(e.target.value)}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                      >
                        <option value="">{t('orderDetail.refundFields.selectMethod', 'Select...')}</option>
                        {paymentMethods.map((pm) => (
                          <option key={pm.id} value={pm.id}>
                            {pm.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-gray-700">
                        {t('orderDetail.refundFields.account', 'Company Account')} *
                      </label>
                      <select
                        value={refundCompanyAccountId}
                        onChange={(e) => setRefundCompanyAccountId(e.target.value)}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                      >
                        <option value="">{t('orderDetail.refundFields.selectAccount', 'Select...')}</option>
                        {companyAccounts.map((acc) => (
                          <option key={acc.id} value={acc.id}>
                            {acc.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-gray-700">
                        {t('orderDetail.refundFields.amount', 'Amount *')}
                      </label>
                      <input
                        type="number"
                        step="0.01"
                        min="0.01"
                        value={refundAmount}
                        onChange={(e) => setRefundAmount(e.target.value)}
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                      />
                    </div>
                    <div className="flex items-end gap-2">
                      <button
                        type="button"
                        onClick={handleAddRefund}
                        disabled={addingRefund}
                        className="flex-1 rounded-lg bg-rose-600 px-3 py-2 text-sm font-semibold text-white hover:bg-rose-500 disabled:opacity-50"
                      >
                        {addingRefund ? t('orderDetail.buttons.addingRefund', 'Adding...') : t('orderDetail.buttons.add', 'Add')}
                      </button>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          setShowAddRefund(false)
                        }}
                        className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
                      >
                        {t('orderDetail.buttons.cancel', 'Cancel')}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {orderRefunds.length === 0 ? (
                <p className="text-gray-500 text-sm">{t('orderDetail.refunds.empty', 'No refunds recorded for this order.')}</p>
              ) : (
                <>
                  {/* Mobile Card View */}
                  <div className="block sm:hidden space-y-3">
                    {orderRefunds.map((refund) => (
                      <div key={refund.id} className="border border-gray-200 rounded-lg p-4 bg-white">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-medium text-rose-700">
                              {formatAmount(refund.amount)}
                            </div>
                            <div className="text-xs text-gray-500 mt-1">
                              {formatDateTime(refund.occurred_at)}
                            </div>
                          </div>
                           {canModify(user) && (
                              <button
                                onClick={() => {
                                  if (order.status === 'open') {
                                    handleRemoveRefund(refund.id)
                                  }
                                }}
                                disabled={order.status !== 'open'}
                                className="ml-2 inline-flex items-center justify-center rounded-lg border border-red-300 px-2 py-1 text-xs font-semibold text-red-700 hover:bg-red-50 transition-colors flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white"
                                title={order.status !== 'open' ? t('orderDetail.refunds.cannotRemoveClosed', 'Cannot remove refunds from a closed order') : t('orderDetail.refunds.remove', 'Remove Refund')}
                              >
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                              </svg>
                            </button>
                          )}
                        </div>
                        <div className="mt-2 space-y-1 text-sm">
                          <div>
                            <span className="text-gray-500">{t('orderDetail.refunds.method', 'Method')}:</span>{' '}
                            <span className="text-gray-900">{refund.payment_method_name || '—'}</span>
                          </div>
                          {refund.company_account_name && (
                            <div>
                              <span className="text-gray-500">{t('orderDetail.refunds.account', 'Account')}:</span>{' '}
                              <span className="text-gray-900">{refund.company_account_name}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Desktop Table View */}
                  <div className="hidden sm:block overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            {t('orderDetail.refunds.date', 'Date')}
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            {t('orderDetail.refunds.method', 'Method')}
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            {t('orderDetail.refunds.account', 'Account')}
                          </th>
                          <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider">
                            {t('orderDetail.refunds.amount', 'Amount')}
                          </th>
                           {canModify(user) && (
                              <th className="px-4 py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                {t('orderDetail.refunds.actions', 'Actions')}
                              </th>
                            )}
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {orderRefunds.map((refund) => (
                          <tr key={refund.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                              {formatDateTime(refund.occurred_at)}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                              {refund.payment_method_name || '—'}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                              {refund.company_account_name || '—'}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-sm font-semibold text-rose-700 text-right">
                              {formatAmount(refund.amount)}
                            </td>
                             {canModify(user) && (
                                <td className="px-4 py-3 whitespace-nowrap text-center">
                                  <button
                                    onClick={() => {
                                      if (order.status === 'open') {
                                        handleRemoveRefund(refund.id)
                                      }
                                    }}
                                    disabled={order.status !== 'open'}
                                    className="inline-flex items-center justify-center rounded-lg border border-red-300 px-2 py-1 text-xs font-semibold text-red-700 hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white"
                                    title={order.status !== 'open' ? t('orderDetail.refunds.cannotRemoveClosed', 'Cannot remove refunds from a closed order') : t('orderDetail.refunds.remove', 'Remove Refund')}
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
                           <td colSpan={canModify(user) ? 4 : 3} className="px-4 py-3 text-right text-sm font-bold text-gray-900">
                              {t('orderDetail.refunds.total', 'Total Refunded')}:
                            </td>
                            <td className="px-4 py-3 text-right text-sm font-bold text-rose-700">
                              {formatAmount(orderRefunds.reduce((sum, r) => sum + Number(r.amount || 0), 0))}
                            </td>
                           {canModify(user) && <td></td>}
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </>
              )}
            </div>

            {/* Service Credits */}
            {serviceCredits.length > 0 && (
              <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  {t('orderDetail.credits.title', 'Service Credits')}
                </h2>
                <div className="space-y-3">
                  {serviceCredits.map((credit) => (
                    <div key={credit.service_id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-900">
                          {credit.service_name}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {t('orderDetail.credits.fromItems', 'From items')}: {Number(credit.credits_from_items || 0).toFixed(2)} {credit.duration_unit} | 
                          {t('orderDetail.credits.used', 'Used')}: {Number(credit.credits_used_by_appointments || 0).toFixed(2)} {credit.duration_unit}
                        </div>
                      </div>
                      <div className={`text-lg font-bold ${Number(credit.balance || 0) < 0 ? 'text-red-600' : Number(credit.balance || 0) > 0 ? 'text-green-600' : 'text-gray-600'}`}>
                        {Number(credit.balance || 0).toFixed(2)} {credit.duration_unit}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
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
                  <dd className="mt-1 text-gray-900 font-semibold">{(() => {
                    const totalRefunded = orderRefunds.reduce((sum, r) => sum + Number(r.amount || 0), 0)
                    const calculatedBalance = Number(order.total_amount || 0) - Number(order.total_paid || 0) + totalRefunded
                    return formatCurrency(calculatedBalance)
                  })()}</dd>
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

