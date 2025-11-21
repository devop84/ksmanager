import sql from './neon'

/**
 * Calculate order prices based on tier scope rules
 * @param {number} orderId - The order ID to calculate prices for
 * @param {number} serviceId - The service ID
 * @param {number} customerId - The customer ID
 * @returns {Promise<{success: boolean, price?: number, pricePerHour?: number, totalHours?: number, tier?: object}>}
 */
export async function calculateOrderPrices(orderId, serviceId, customerId) {
  try {
    // 1. Get service configuration (package_tier_scope)
    const serviceData = await sql`
      SELECT 
        sl.requires_package_pricing,
        sl.package_tier_scope,
        sl.base_price_per_hour,
        sl.default_duration_hours
      FROM services_lessons sl
      WHERE sl.service_id = ${serviceId}
      LIMIT 1
    `

    if (!serviceData || serviceData.length === 0) {
      // Not a lesson service or service not found
      return { success: false, error: 'Service not found or not a lesson service' }
    }

    const service = serviceData[0]

    // Get the hours for the current order
    const orderData = await sql`
      SELECT 
        EXTRACT(EPOCH FROM (ol.ending - ol.starting)) / 3600 AS hours
      FROM orders_lessons ol
      WHERE ol.order_id = ${orderId}
      LIMIT 1
    `

    if (!orderData || orderData.length === 0) {
      return { success: false, error: 'Order lesson data not found' }
    }

    const currentOrderHours = parseFloat(orderData[0].hours) || 0

    if (!service.requires_package_pricing) {
      // Simple pricing: base_price_per_hour * hours
      const price = service.base_price_per_hour * currentOrderHours
      const pricePerHour = service.base_price_per_hour

      // Update order
      await sql`
        UPDATE orders
        SET 
          calculated_price = ${price},
          calculated_price_per_hour = ${pricePerHour},
          calculated_at = NOW(),
          hours = ${currentOrderHours}
        WHERE id = ${orderId}
      `

      return {
        success: true,
        price,
        pricePerHour,
        totalHours: currentOrderHours,
        tier: null
      }
    }

    // Package pricing: determine which orders to include based on tier_scope
    let ordersToInclude = []

    if (service.package_tier_scope === 'service_only') {
      // Only include orders for this specific service
      ordersToInclude = await sql`
        SELECT 
          o.id,
          EXTRACT(EPOCH FROM (ol.ending - ol.starting)) / 3600 AS hours
        FROM orders o
        JOIN orders_lessons ol ON ol.order_id = o.id
        WHERE o.service_id = ${serviceId}
          AND o.customer_id = ${customerId}
          AND o.cancelled = FALSE
        ORDER BY o.id
      `
    } else if (service.package_tier_scope === 'order_group') {
      // Get the order's group_id
      const orderGroupData = await sql`
        SELECT group_id FROM orders WHERE id = ${orderId} LIMIT 1
      `
      const groupId = orderGroupData && orderGroupData.length > 0 ? orderGroupData[0].group_id : null

      if (!groupId) {
        // No group - just calculate for this order
        ordersToInclude = await sql`
          SELECT 
            o.id,
            EXTRACT(EPOCH FROM (ol.ending - ol.starting)) / 3600 AS hours
          FROM orders o
          JOIN orders_lessons ol ON ol.order_id = o.id
          WHERE o.id = ${orderId}
        `
      } else {
        // Include all lesson orders in the same group
        ordersToInclude = await sql`
          SELECT 
            o.id,
            EXTRACT(EPOCH FROM (ol.ending - ol.starting)) / 3600 AS hours
          FROM orders o
          JOIN orders_lessons ol ON ol.order_id = o.id
          JOIN services s ON s.id = o.service_id
          JOIN service_categories sc ON sc.id = s.category_id
          WHERE o.group_id = ${groupId}
            AND o.customer_id = ${customerId}
            AND o.cancelled = FALSE
            AND sc.name = 'lessons'
          ORDER BY o.id
        `
      }
    } else if (service.package_tier_scope === 'customer_all') {
      // Include all lesson orders for this customer
      ordersToInclude = await sql`
        SELECT 
          o.id,
          EXTRACT(EPOCH FROM (ol.ending - ol.starting)) / 3600 AS hours
        FROM orders o
        JOIN orders_lessons ol ON ol.order_id = o.id
        JOIN services s ON s.id = o.service_id
        JOIN service_categories sc ON sc.id = s.category_id
        WHERE o.customer_id = ${customerId}
          AND o.cancelled = FALSE
          AND sc.name = 'lessons'
        ORDER BY o.id
      `
    }

    // Sum total hours
    const totalHours = ordersToInclude.reduce((sum, row) => {
      return sum + (parseFloat(row.hours) || 0)
    }, 0)

    // Get package tiers for this service
    const tiers = await sql`
      SELECT 
        id,
        min_total_hours,
        max_total_hours,
        price_per_hour
      FROM services_lessons_packages
      WHERE service_id = ${serviceId}
      ORDER BY min_total_hours
    `

    // Find matching tier
    let matchedTier = null
    let pricePerHour = service.base_price_per_hour

    for (const tier of tiers) {
      const min = parseFloat(tier.min_total_hours) || 0
      const max = tier.max_total_hours ? parseFloat(tier.max_total_hours) : Infinity

      if (totalHours >= min && totalHours <= max) {
        matchedTier = tier
        pricePerHour = parseFloat(tier.price_per_hour)
        break
      }
    }

    // Calculate price for current order: pricePerHour * currentOrderHours
    const price = pricePerHour * currentOrderHours

    // Update the current order
    await sql`
      UPDATE orders
      SET 
        calculated_price = ${price},
        calculated_price_per_hour = ${pricePerHour},
        calculated_at = NOW(),
        hours = ${currentOrderHours}
      WHERE id = ${orderId}
    `

    // If tier scope requires recalculating other orders, do that now
    if (service.package_tier_scope !== 'service_only' && ordersToInclude.length > 1) {
      // Recalculate all orders in the same scope
      const otherOrderIds = ordersToInclude
        .map(row => row.id)
        .filter(id => id !== orderId)

      for (const otherOrderId of otherOrderIds) {
        // Get hours for this order
        const otherOrderHours = ordersToInclude.find(r => r.id === otherOrderId)?.hours || 0
        const otherOrderPrice = pricePerHour * parseFloat(otherOrderHours)

        await sql`
          UPDATE orders
          SET 
            calculated_price = ${otherOrderPrice},
            calculated_price_per_hour = ${pricePerHour},
            calculated_at = NOW(),
            hours = ${otherOrderHours}
          WHERE id = ${otherOrderId}
        `
      }
    }

    return {
      success: true,
      price,
      pricePerHour,
      totalHours,
      tier: matchedTier
    }
  } catch (error) {
    console.error('Error calculating order prices:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Recalculate prices for all orders in a group
 * @param {number} groupId - The order group ID
 * @returns {Promise<{success: boolean}>}
 */
export async function recalculateGroupPrices(groupId) {
  try {
    // Get all orders in the group
    const orders = await sql`
      SELECT 
        o.id,
        o.service_id,
        o.customer_id
      FROM orders o
      JOIN orders_lessons ol ON ol.order_id = o.id
      WHERE o.group_id = ${groupId}
        AND o.cancelled = FALSE
    `

    // Recalculate each order
    for (const order of orders) {
      await calculateOrderPrices(order.id, order.service_id, order.customer_id)
    }

    return { success: true }
  } catch (error) {
    console.error('Error recalculating group prices:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Recalculate prices for all customer orders (for customer_all scope)
 * @param {number} customerId - The customer ID
 * @returns {Promise<{success: boolean}>}
 */
export async function recalculateCustomerPrices(customerId) {
  try {
    // Get all lesson orders for customer
    const orders = await sql`
      SELECT 
        o.id,
        o.service_id,
        o.customer_id
      FROM orders o
      JOIN orders_lessons ol ON ol.order_id = o.id
      JOIN services s ON s.id = o.service_id
      JOIN service_categories sc ON sc.id = s.category_id
      WHERE o.customer_id = ${customerId}
        AND o.cancelled = FALSE
        AND sc.name = 'lessons'
    `

    // Recalculate each order
    for (const order of orders) {
      await calculateOrderPrices(order.id, order.service_id, order.customer_id)
    }

    return { success: true }
  } catch (error) {
    console.error('Error recalculating customer prices:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Calculate price for a rental order
 * @param {number} orderId - The order ID
 * @param {number} serviceId - The service ID
 * @returns {Promise<{success: boolean, price?: number}>}
 */
export async function calculateRentalPrice(orderId, serviceId) {
  try {
    // Get rental order data
    const orderData = await sql`
      SELECT 
        orr.hourly,
        orr.daily,
        orr.weekly,
        orr.starting,
        orr.ending
      FROM orders_rentals orr
      WHERE orr.order_id = ${orderId}
      LIMIT 1
    `

    if (!orderData || orderData.length === 0) {
      return { success: false, error: 'Rental order data not found' }
    }

    const rental = orderData[0]

    // Get service rates
    const serviceData = await sql`
      SELECT 
        sr.hourly_rate,
        sr.daily_rate,
        sr.weekly_rate
      FROM services_rentals sr
      WHERE sr.service_id = ${serviceId}
      LIMIT 1
    `

    if (!serviceData || serviceData.length === 0) {
      return { success: false, error: 'Rental service data not found' }
    }

    const service = serviceData[0]

    if (!rental.starting || !rental.ending) {
      return { success: false, error: 'Rental start/end dates not set' }
    }

    // Calculate duration
    const start = new Date(rental.starting)
    const end = new Date(rental.ending)
    const diffMs = end - start
    const diffHours = diffMs / (1000 * 60 * 60)
    const diffDays = Math.ceil(diffHours / 24)

    let price = 0
    let hours = diffHours

    if (rental.hourly && service.hourly_rate) {
      price = diffHours * parseFloat(service.hourly_rate)
    } else if (rental.daily && service.daily_rate) {
      price = diffDays * parseFloat(service.daily_rate)
      hours = diffDays * 24
    } else if (rental.weekly && service.weekly_rate) {
      const weeks = Math.ceil(diffDays / 7)
      price = weeks * parseFloat(service.weekly_rate)
      hours = weeks * 7 * 24
    }

    // Update order
    await sql`
      UPDATE orders
      SET 
        calculated_price = ${price},
        calculated_price_per_hour = ${hours > 0 ? price / hours : 0},
        calculated_at = NOW(),
        hours = ${hours}
      WHERE id = ${orderId}
    `

    return { success: true, price }
  } catch (error) {
    console.error('Error calculating rental price:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Calculate price for a storage order
 * @param {number} orderId - The order ID
 * @param {number} serviceId - The service ID
 * @returns {Promise<{success: boolean, price?: number}>}
 */
export async function calculateStoragePrice(orderId, serviceId) {
  try {
    // Get storage order data
    const orderData = await sql`
      SELECT 
        ost.daily,
        ost.weekly,
        ost.monthly,
        ost.starting,
        ost.ending
      FROM orders_storage ost
      WHERE ost.order_id = ${orderId}
      LIMIT 1
    `

    if (!orderData || orderData.length === 0) {
      return { success: false, error: 'Storage order data not found' }
    }

    const storage = orderData[0]

    // Get service rates
    const serviceData = await sql`
      SELECT 
        ss.daily_rate,
        ss.weekly_rate,
        ss.monthly_rate
      FROM services_storage ss
      WHERE ss.service_id = ${serviceId}
      LIMIT 1
    `

    if (!serviceData || serviceData.length === 0) {
      return { success: false, error: 'Storage service data not found' }
    }

    const service = serviceData[0]

    if (!storage.starting || !storage.ending) {
      return { success: false, error: 'Storage check-in/check-out dates not set' }
    }

    // Calculate duration
    const start = new Date(storage.starting)
    const end = new Date(storage.ending)
    const diffMs = end - start
    const diffDays = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)))

    let price = 0
    let days = diffDays

    if (storage.monthly && service.monthly_rate) {
      // Monthly billing: calculate months, round up
      const months = Math.ceil(diffDays / 30)
      price = months * parseFloat(service.monthly_rate)
      days = months * 30
    } else if (storage.weekly && service.weekly_rate) {
      // Weekly billing: calculate weeks, round up
      const weeks = Math.ceil(diffDays / 7)
      price = weeks * parseFloat(service.weekly_rate)
      days = weeks * 7
    } else if (storage.daily && service.daily_rate) {
      // Daily billing
      price = diffDays * parseFloat(service.daily_rate)
    }

    // Update order (hours = days for storage)
    await sql`
      UPDATE orders
      SET 
        calculated_price = ${price},
        calculated_price_per_hour = ${days > 0 ? price / days : 0},
        calculated_at = NOW(),
        hours = ${days}
      WHERE id = ${orderId}
    `

    return { success: true, price }
  } catch (error) {
    console.error('Error calculating storage price:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Calculate price for any order type (unified function)
 * @param {number} orderId - The order ID
 * @param {number} serviceId - The service ID
 * @param {number} customerId - The customer ID
 * @returns {Promise<{success: boolean}>}
 */
export async function calculateOrderPrice(orderId, serviceId, customerId) {
  try {
    // Determine order type by checking which table has data
    const [lessonData, rentalData, storageData] = await Promise.all([
      sql`SELECT 1 FROM orders_lessons WHERE order_id = ${orderId} LIMIT 1`,
      sql`SELECT 1 FROM orders_rentals WHERE order_id = ${orderId} LIMIT 1`,
      sql`SELECT 1 FROM orders_storage WHERE order_id = ${orderId} LIMIT 1`
    ])

    if (lessonData && lessonData.length > 0) {
      return await calculateOrderPrices(orderId, serviceId, customerId)
    } else if (rentalData && rentalData.length > 0) {
      return await calculateRentalPrice(orderId, serviceId)
    } else if (storageData && storageData.length > 0) {
      return await calculateStoragePrice(orderId, serviceId)
    } else {
      return { success: false, error: 'Order type not found' }
    }
  } catch (error) {
    console.error('Error calculating order price:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Calculate prices for all orders with null calculated_price
 * @param {number|null} customerId - Optional: only calculate for specific customer
 * @returns {Promise<{success: boolean, processed: number}>}
 */
export async function calculateMissingPrices(customerId = null) {
  try {
    // Get all orders with null calculated_price
    let orders
    if (customerId) {
      orders = await sql`
        SELECT 
          o.id,
          o.service_id,
          o.customer_id
        FROM orders o
        WHERE o.calculated_price IS NULL
          AND o.cancelled = FALSE
          AND o.customer_id = ${customerId}
      `
    } else {
      orders = await sql`
        SELECT 
          o.id,
          o.service_id,
          o.customer_id
        FROM orders o
        WHERE o.calculated_price IS NULL
          AND o.cancelled = FALSE
      `
    }

    let processed = 0
    for (const order of orders) {
      try {
        const result = await calculateOrderPrice(order.id, order.service_id, order.customer_id)
        if (result.success) {
          processed++
        }
      } catch (err) {
        console.error(`Failed to calculate price for order ${order.id}:`, err)
      }
    }

    return { success: true, processed }
  } catch (error) {
    console.error('Error calculating missing prices:', error)
    return { success: false, error: error.message, processed: 0 }
  }
}

