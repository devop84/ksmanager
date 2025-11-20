import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import sql from '../lib/neon'
import { canModify } from '../lib/permissions'
import { useSettings } from '../context/SettingsContext'

function CustomerDetail({ customerId, onEdit, onDelete, onBack, onEditOrder = () => {}, onDeleteOrder = () => {}, user = null }) {
  const { t } = useTranslation()
  const { formatCurrency, formatDate, formatDateTime } = useSettings()
  const [customer, setCustomer] = useState(null)
  const [orders, setOrders] = useState([])
  const [billingItems, setBillingItems] = useState([])
  const [billingLoading, setBillingLoading] = useState(true)
  const [billingTotals, setBillingTotals] = useState({ paid: 0, toPay: 0 })
  const [lessonPricing, setLessonPricing] = useState({ totalHours: 0, tiers: [] })
  const [billingQuote, setBillingQuote] = useState([])
  const [billingQuoteTotal, setBillingQuoteTotal] = useState(0)
  const [ordersLoading, setOrdersLoading] = useState(true)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    const fetchCustomer = async () => {
      try {
        setLoading(true)
        setError(null)
        const result = await sql`
          SELECT 
            c.id,
            c.fullname,
            c.phone,
            c.email,
            c.doctype,
            c.doc,
            c.country,
            c.birthdate,
            c.note,
            c.hotel_id,
            c.agency_id,
            c.created_at,
            c.updated_at,
            h.name AS hotel_name,
            a.name AS agency_name
          FROM customers c
          LEFT JOIN hotels h ON c.hotel_id = h.id
          LEFT JOIN agencies a ON c.agency_id = a.id
          WHERE c.id = ${customerId}
          LIMIT 1
        `
        
        if (result && result.length > 0) {
          setCustomer(result[0])
        } else {
          setError(t('customerDetail.notFound'))
        }
      } catch (err) {
        console.error('Failed to load customer:', err)
        setError(t('customerDetail.error.load'))
      } finally {
        setLoading(false)
      }
    }

    if (customerId) {
      fetchCustomer()
    }
  }, [customerId])

  // Fetch customer orders
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setOrdersLoading(true)
        const rows =
          (await sql`
            SELECT
              o.id,
              o.service_id,
              o.cancelled,
              o.created_at,
              s.name AS service_name,
              sc.name AS category_name,
              COALESCE(ol.starting, orent.starting, ost.starting) AS starting,
              COALESCE(ol.ending, orent.ending, ost.ending) AS ending,
              CASE
                WHEN ol.order_id IS NOT NULL THEN 'lessons'
                WHEN orent.order_id IS NOT NULL THEN 'rentals'
                WHEN ost.order_id IS NOT NULL THEN 'storage'
                ELSE 'other'
              END AS type,
              ol.student_id,
              ol.instructor_id,
              i.fullname AS instructor_name,
              ol.note AS lesson_note,
              orent.equipment_id,
              e.name AS equipment_name,
              orent.hourly,
              orent.daily,
              orent.weekly,
              orent.note AS rental_note,
              ost.storage_id,
              ost.daily AS storage_daily,
              ost.weekly AS storage_weekly,
              ost.monthly AS storage_monthly,
              ost.note AS storage_note
            FROM orders o
            JOIN services s ON s.id = o.service_id
            JOIN service_categories sc ON sc.id = s.category_id
            LEFT JOIN orders_lessons ol ON ol.order_id = o.id
            LEFT JOIN orders_rentals orent ON orent.order_id = o.id
            LEFT JOIN orders_storage ost ON ost.order_id = o.id
            LEFT JOIN instructors i ON i.id = ol.instructor_id
            LEFT JOIN equipment e ON e.id = orent.equipment_id
            WHERE o.customer_id = ${customerId}
            ORDER BY o.created_at DESC
          `) || []
        
        const decorated = rows.map((row) => ({
          ...row,
          status: determineStatus(row)
        }))

        setOrders(decorated)
      } catch (err) {
        console.error('Failed to load orders:', err)
      } finally {
        setOrdersLoading(false)
      }
    }

    if (customerId) {
      fetchOrders()
    }
  }, [customerId])

  useEffect(() => {
    const fetchBilling = async () => {
      if (!customerId) return
      try {
        setBillingLoading(true)
        const rows =
          (await sql`
            SELECT
              o.id AS order_id,
              s.name AS service_name,
              sc.name AS category_name,
              tt.code AS transaction_type_code,
              tt.label AS transaction_label,
              t.amount,
              t.occurred_at
            FROM transactions t
            JOIN transaction_types tt ON tt.id = t.type_id
            LEFT JOIN orders o ON o.id = CASE
              WHEN t.source_entity_type = 'order' THEN t.source_entity_id
              WHEN t.destination_entity_type = 'order' THEN t.destination_entity_id
              ELSE NULL
            END
            LEFT JOIN services s ON s.id = o.service_id
            LEFT JOIN service_categories sc ON sc.id = s.category_id
            WHERE (t.source_entity_type = 'customer' AND t.source_entity_id = ${customerId})
               OR (t.destination_entity_type = 'customer' AND t.destination_entity_id = ${customerId})
            ORDER BY t.occurred_at DESC
          `) || []

        const prepared = rows.map((row) => ({
          ...row,
          amount: Number(row.amount ?? 0)
        }))
        setBillingItems(prepared)

        setBillingItems(prepared)
      } catch (err) {
        console.error('Failed to load billing data:', err)
      } finally {
        setBillingLoading(false)
      }
    }

    fetchBilling()
  }, [customerId])

  useEffect(() => {
    const buildQuotation = async () => {
      if (!orders.length) {
        setLessonPricing({ totalHours: 0, tiers: [] })
        setBillingQuote([])
        setBillingQuoteTotal(0)
        setBillingTotals({ paid: 0, toPay: 0 })
        return
      }

      const serviceIds = Array.from(new Set(orders.map((order) => order.service_id).filter(Boolean)))
      if (serviceIds.length === 0) {
        setLessonPricing({ totalHours: 0, suggestedRate: null, tiers: [] })
        setBillingQuote([])
        setBillingQuoteTotal(0)
        return
      }

      try {
        const serviceRows =
          (await sql`
            SELECT
              s.id,
              s.name,
              sc.name AS category_name,
              sl.base_price_per_hour,
              sr.hourly_rate AS rental_hourly_rate,
              sr.daily_rate AS rental_daily_rate,
              sr.weekly_rate AS rental_weekly_rate,
              ss.daily_rate AS storage_daily_rate,
              ss.weekly_rate AS storage_weekly_rate,
              ss.monthly_rate AS storage_monthly_rate
            FROM services s
            JOIN service_categories sc ON sc.id = s.category_id
            LEFT JOIN services_lessons sl ON sl.service_id = s.id
            LEFT JOIN services_rentals sr ON sr.service_id = s.id
            LEFT JOIN services_storage ss ON ss.service_id = s.id
            WHERE s.id = ANY(${serviceIds})
          `) || []

        const serviceMap = new Map(serviceRows.map((row) => [row.id, row]))
        const lessonServiceIds = serviceRows.filter((row) => row.category_name === 'lessons').map((row) => row.id)

        let lessonPackageRows = []
        if (lessonServiceIds.length) {
          lessonPackageRows =
            (await sql`
              SELECT service_id, min_total_hours, max_total_hours, price_per_hour
              FROM services_lessons_packages
              WHERE service_id = ANY(${lessonServiceIds})
              ORDER BY service_id, min_total_hours
            `) || []
        }

        const lessonPackagesMap = new Map()
        lessonPackageRows.forEach((pkg) => {
          const arr = lessonPackagesMap.get(pkg.service_id) || []
          arr.push({
            min: Number(pkg.min_total_hours ?? 0),
            max: pkg.max_total_hours != null ? Number(pkg.max_total_hours) : null,
            price: Number(pkg.price_per_hour ?? 0)
          })
          lessonPackagesMap.set(pkg.service_id, arr)
        })
        lessonPackagesMap.forEach((arr, key) => {
          arr.sort((a, b) => a.min - b.min)
          lessonPackagesMap.set(key, arr)
        })

        const lessonHoursByService = {}
        const rentalDataByService = {}
        const storageDataByService = {}
        let totalLessonHours = 0

        orders.forEach((order) => {
          if (!order.service_id) return
          const detail = serviceMap.get(order.service_id)
          if (!detail) return
          const start = order.starting ? new Date(order.starting) : null
          const end = order.ending ? new Date(order.ending) : null
          const diffHours = start && end ? Math.max(0, (end - start) / (1000 * 60 * 60)) : 0

          if (detail.category_name === 'lessons') {
            totalLessonHours += diffHours
            lessonHoursByService[order.service_id] = lessonHoursByService[order.service_id] || { hours: 0 }
            lessonHoursByService[order.service_id].hours += diffHours
          } else if (detail.category_name === 'rentals') {
            const entry =
              rentalDataByService[order.service_id] || { hours: 0, days: 0, orders: 0, total: 0, hourlyRate: 0, dailyRate: 0 }
            let amount = 0
            if (order.hourly && detail.rental_hourly_rate) {
              amount += Number(detail.rental_hourly_rate) * diffHours
              entry.hours += diffHours
              entry.hourlyRate = Number(detail.rental_hourly_rate)
            }
            if (order.daily && detail.rental_daily_rate) {
              const days = Math.max(1, Math.ceil(diffHours / 24))
              amount += Number(detail.rental_daily_rate) * days
              entry.days += days
              entry.dailyRate = Number(detail.rental_daily_rate)
            }
            if (order.weekly && detail.rental_weekly_rate) {
              const weeks = Math.max(1, Math.ceil(diffHours / (24 * 7)))
              amount += Number(detail.rental_weekly_rate) * weeks
              entry.days += weeks * 7
            }
            if (amount === 0 && detail.rental_daily_rate && diffHours > 0) {
              const days = Math.max(1, Math.ceil(diffHours / 24))
              amount += Number(detail.rental_daily_rate) * days
              entry.days += days
              entry.dailyRate = Number(detail.rental_daily_rate)
            }
            entry.total += amount
            entry.orders += 1
            rentalDataByService[order.service_id] = entry
          } else if (detail.category_name === 'storage') {
            const entry =
              storageDataByService[order.service_id] || {
                dailyUnits: 0,
                weeklyUnits: 0,
                monthlyUnits: 0,
                total: 0,
                dailyRate: Number(detail.storage_daily_rate ?? 0),
                weeklyRate: Number(detail.storage_weekly_rate ?? 0),
                monthlyRate: Number(detail.storage_monthly_rate ?? 0)
              }
            const days = diffHours > 0 ? Math.max(1, Math.ceil(diffHours / 24)) : 0
            if (order.storage_daily && detail.storage_daily_rate) {
              entry.dailyUnits += days
              entry.total += Number(detail.storage_daily_rate) * days
            }
            if (order.storage_weekly && detail.storage_weekly_rate) {
              const weeks = Math.max(1, Math.ceil(days / 7))
              entry.weeklyUnits += weeks
              entry.total += Number(detail.storage_weekly_rate) * weeks
            }
            if (order.storage_monthly && detail.storage_monthly_rate) {
              const months = Math.max(1, Math.ceil(days / 30))
              entry.monthlyUnits += months
              entry.total += Number(detail.storage_monthly_rate) * months
            }
            storageDataByService[order.service_id] = entry
          }
        })

        const determineLessonRate = (serviceId) => {
          const detail = serviceMap.get(serviceId)
          let rate = Number(detail?.base_price_per_hour ?? 0)
          const packages = lessonPackagesMap.get(serviceId) || []
          let matched = false
          for (const pkg of packages) {
            const min = pkg.min
            const max = pkg.max != null ? pkg.max : Infinity
            if (totalLessonHours >= min && totalLessonHours <= max) {
              rate = pkg.price
              matched = true
              break
            }
          }
          if (!matched && packages.length) {
            const last = packages[packages.length - 1]
            if (totalLessonHours >= last.min) {
              rate = last.price
            }
          }
          return rate
        }

        const quoteItems = []

        Object.entries(lessonHoursByService).forEach(([serviceId, data]) => {
          const id = Number(serviceId)
          const detail = serviceMap.get(id)
          if (!detail) return
          const rate = determineLessonRate(id)
          const total = data.hours * rate
          quoteItems.push({
            serviceId: id,
            serviceName: detail.name,
            categoryName: detail.category_name,
            quantityLabel: `${data.hours.toFixed(1)} ${t('customerDetail.units.hours')}`,
            unitLabel: rate ? `${formatCurrency(rate)} ${t('customerDetail.units.perHour')}` : '—',
            total
          })
        })

        Object.entries(rentalDataByService).forEach(([serviceId, data]) => {
          const id = Number(serviceId)
          const detail = serviceMap.get(id)
          if (!detail || data.total === 0) return
          const quantityParts = []
          if (data.hours > 0) quantityParts.push(`${data.hours.toFixed(1)} ${t('customerDetail.units.hours')}`)
          if (data.days > 0) quantityParts.push(`${data.days} ${t('customerDetail.units.day', { count: data.days })}`)
          quoteItems.push({
            serviceId: id,
            serviceName: detail.name,
            categoryName: detail.category_name,
            quantityLabel: quantityParts.join(' • ') || `${data.orders} ${t('customerDetail.units.booking', { count: data.orders })}`,
            unitLabel:
              data.hours > 0 && data.days === 0
                ? `${formatCurrency(data.hourlyRate)} ${t('customerDetail.units.perHour')}`
                : data.days > 0 && data.hours === 0
                ? `${formatCurrency(data.dailyRate)} ${t('customerDetail.units.perDay')}`
                : t('customerDetail.units.mixed'),
            total: data.total
          })
        })

        Object.entries(storageDataByService).forEach(([serviceId, data]) => {
          const id = Number(serviceId)
          const detail = serviceMap.get(id)
          if (!detail || data.total === 0) return
          const quantityParts = []
          if (data.dailyUnits > 0) quantityParts.push(`${data.dailyUnits} ${t('customerDetail.units.day', { count: data.dailyUnits })}`)
          if (data.weeklyUnits > 0) quantityParts.push(`${data.weeklyUnits} ${t('customerDetail.units.week', { count: data.weeklyUnits })}`)
          if (data.monthlyUnits > 0) quantityParts.push(`${data.monthlyUnits} ${t('customerDetail.units.month', { count: data.monthlyUnits })}`)

          let unitLabel = '—'
          if (data.dailyUnits > 0 && detail.storage_daily_rate) {
            unitLabel = `${formatCurrency(detail.storage_daily_rate)} ${t('customerDetail.units.perDay')}`
          } else if (data.weeklyUnits > 0 && detail.storage_weekly_rate) {
            unitLabel = `${formatCurrency(detail.storage_weekly_rate)} ${t('customerDetail.units.perWeek')}`
          } else if (data.monthlyUnits > 0 && detail.storage_monthly_rate) {
            unitLabel = `${formatCurrency(detail.storage_monthly_rate)} ${t('customerDetail.units.perMonth')}`
          }

          quoteItems.push({
            serviceId: id,
            serviceName: detail.name,
            categoryName: detail.category_name,
            quantityLabel: quantityParts.join(' • ') || t('customerDetail.units.storage'),
            unitLabel,
            total: data.total
          })
        })

        const grandTotal = quoteItems.reduce((sum, item) => sum + item.total, 0)

        const paid = billingItems.reduce((sum, txn) => (txn.amount >= 0 ? sum + txn.amount : sum), 0)
        const toPay = Math.max(0, grandTotal - paid)

        setBillingQuote(quoteItems)
        setBillingQuoteTotal(grandTotal)
        setBillingTotals({ paid, toPay })
        setLessonPricing({
          totalHours: totalLessonHours,
          tiers: lessonPackageRows.map((tier) => ({
            ...tier,
            min_total_hours: Number(tier.min_total_hours ?? 0),
            max_total_hours: tier.max_total_hours != null ? Number(tier.max_total_hours) : null,
            price_per_hour: Number(tier.price_per_hour ?? 0)
          }))
        })
      } catch (err) {
        console.error('Failed to build billing quotation:', err)
        setBillingQuote([])
        setBillingQuoteTotal(0)
        setBillingTotals({ paid: 0, toPay: 0 })
        setLessonPricing({ totalHours: 0, tiers: [] })
      }
    }

    buildQuotation()
  }, [orders, billingItems])

  const determineStatus = (order) => {
    if (order.cancelled) return 'cancelled'
    const now = new Date()
    const start = order.starting ? new Date(order.starting) : null
    const end = order.ending ? new Date(order.ending) : null
    if (!start || !end) return 'pending'
    if (now < start) return 'pending'
    if (now >= start && now <= end) return 'in_progress'
    if (now > end) return 'completed'
    return 'pending'
  }

  const statusStyles = {
    pending: 'bg-yellow-100 text-yellow-800',
    in_progress: 'bg-blue-100 text-blue-800',
    completed: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800'
  }

  const renderStatusBadge = (status) => {
    const classes = statusStyles[status] || 'bg-gray-100 text-gray-700'
    const label = t(`common.status.${status}`, status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' '))
    return (
      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${classes}`}>
        {label}
      </span>
    )
  }

  const handleDelete = async () => {
    if (!window.confirm(t('customerDetail.confirm.delete'))) {
      return
    }

    try {
      setDeleting(true)
      await sql`DELETE FROM customers WHERE id = ${customerId}`
      onDelete?.()
    } catch (err) {
      console.error('Failed to delete customer:', err)
      alert(t('customerDetail.error.delete'))
    } finally {
      setDeleting(false)
    }
  }

  const formatOrderDate = (value) => {
    if (!value) return '—'
    return formatDateTime(value)
  }

  // Format total time in a human-readable way (similar to RentalsInProgress)
  const formatTotalTime = (totalHours) => {
    if (totalHours === 0) return t('customerDetail.time.none')
    
    const totalMinutes = Math.floor(totalHours * 60)
    const days = Math.floor(totalMinutes / (24 * 60))
    const hours = Math.floor((totalMinutes % (24 * 60)) / 60)
    const minutes = totalMinutes % 60
    
    const parts = []
    if (days > 0) parts.push(`${days}d`)
    if (hours > 0) parts.push(`${hours}h`)
    if (minutes > 0 || parts.length === 0) parts.push(`${minutes}m`)
    
    return parts.join(' ')
  }

  // Calculate order statistics
  const calculateOrderStats = () => {
    if (!orders || orders.length === 0) {
      return { lessonHours: 0, rentalHours: 0, storageHours: 0 }
    }

    let lessonHours = 0
    let rentalHours = 0
    let storageHours = 0

    orders.forEach((order) => {
      if (order.starting && order.ending) {
        const start = new Date(order.starting)
        const end = new Date(order.ending)
        const diffMs = end - start
        const diffHours = diffMs / (1000 * 60 * 60)
        
        if (order.type === 'lessons') {
          lessonHours += diffHours
        } else if (order.type === 'rentals') {
          rentalHours += diffHours
        } else if (order.type === 'storage') {
          storageHours += diffHours
        }
      }
    })

    return { lessonHours, rentalHours, storageHours }
  }

  const orderStats = calculateOrderStats()


  if (loading) {
    return (
      <div className="px-4 py-6 sm:p-6 lg:p-8">
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <div className="text-gray-600">{t('customerDetail.loading')}</div>
        </div>
      </div>
    )
  }

  if (error || !customer) {
    return (
      <div className="px-4 py-6 sm:p-6 lg:p-8">
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <div className="text-red-600">{error || t('customerDetail.notFound')}</div>
          {onBack && (
            <button
              onClick={onBack}
              className="mt-4 rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
            >
              {t('customerDetail.back')}
            </button>
          )}
        </div>
      </div>
    )
  }

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
            {t('customerDetail.back')}
          </button>
          <h1 className="text-3xl font-bold text-gray-900">{customer.fullname || t('customers.title')}</h1>
          <p className="text-gray-500 text-sm mt-1">{t('customerDetail.title')}</p>
        </div>

        {/* Main Content: Two Column Layout */}
        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          {/* Left Column: Quick Look + Billing + Orders (3/4 width) */}
          <div className="xl:col-span-3 space-y-6">
            {/* Quick Look Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="rounded-lg border border-gray-200 bg-gradient-to-br from-blue-50 to-blue-100 p-4">
                <div className="text-sm font-medium text-blue-700 mb-1">{t('customerDetail.summary.lessonHours')}</div>
                <div className="text-2xl font-bold text-blue-900">{formatTotalTime(orderStats.lessonHours)}</div>
              </div>
              <div className="rounded-lg border border-gray-200 bg-gradient-to-br from-green-50 to-green-100 p-4">
                <div className="text-sm font-medium text-green-700 mb-1">{t('customerDetail.summary.rental')}</div>
                <div className="text-2xl font-bold text-green-900">{formatTotalTime(orderStats.rentalHours)}</div>
              </div>
              <div className="rounded-lg border border-gray-200 bg-gradient-to-br from-purple-50 to-purple-100 p-4">
                <div className="text-sm font-medium text-purple-700 mb-1">{t('customerDetail.summary.storage')}</div>
                <div className="text-2xl font-bold text-purple-900">{formatTotalTime(orderStats.storageHours)}</div>
              </div>
            </div>

            {/* Billing Section */}
            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between mb-4">
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">{t('customerDetail.billing.title')}</h2>
                  <p className="text-sm text-gray-500">{t('customerDetail.billing.description')}</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg border border-emerald-100 bg-emerald-50 p-3">
                    <p className="text-xs font-medium text-emerald-700 uppercase">{t('customerDetail.billing.paid')}</p>
                    <p className="text-lg font-semibold text-emerald-900">{formatCurrency(billingTotals.paid)}</p>
                  </div>
                  <div className="rounded-lg border border-amber-100 bg-amber-50 p-3">
                    <p className="text-xs font-medium text-amber-700 uppercase">{t('customerDetail.billing.toPay')}</p>
                    <p className="text-lg font-semibold text-amber-900">{formatCurrency(billingTotals.toPay)}</p>
                  </div>
                </div>
              </div>

              <div className="mt-4">
                <h3 className="text-sm font-semibold text-gray-900 mb-2">{t('customerDetail.billing.quotation.title')}</h3>
                {billingQuote.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-gray-300 px-4 py-6 text-sm text-gray-500">
                    {t('customerDetail.billing.quotation.empty')}
                  </div>
                ) : (
                  <>
                    <div className="overflow-hidden rounded-lg border border-gray-200">
                      <table className="min-w-full divide-y divide-gray-200 text-sm">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-4 py-2 text-left font-semibold text-gray-600">{t('customerDetail.billing.quotation.table.service')}</th>
                            <th className="px-4 py-2 text-left font-semibold text-gray-600">{t('customerDetail.billing.quotation.table.category')}</th>
                            <th className="px-4 py-2 text-left font-semibold text-gray-600">{t('customerDetail.billing.quotation.table.quantity')}</th>
                            <th className="px-4 py-2 text-left font-semibold text-gray-600">{t('customerDetail.billing.quotation.table.rate')}</th>
                            <th className="px-4 py-2 text-right font-semibold text-gray-600">{t('customerDetail.billing.quotation.table.total')}</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 bg-white">
                          {billingQuote.map((item) => (
                            <tr key={item.serviceId}>
                              <td className="px-4 py-2 text-gray-900 font-medium">{item.serviceName}</td>
                              <td className="px-4 py-2 text-gray-500 capitalize">{item.categoryName}</td>
                              <td className="px-4 py-2 text-gray-700">{item.quantityLabel}</td>
                              <td className="px-4 py-2 text-gray-500">{item.unitLabel}</td>
                              <td className="px-4 py-2 text-right font-semibold text-gray-900">
                                {formatCurrency(item.total)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className="flex justify-end items-center gap-4 mt-3 text-sm font-semibold text-gray-900">
                      <span>{t('customerDetail.billing.quotation.grandTotal')}</span>
                      <span className="text-lg">{formatCurrency(billingQuoteTotal)}</span>
                    </div>
                  </>
                )}
                {lessonPricing.totalHours > 0 && (
                  <p className="mt-2 text-xs text-gray-500">
                    {t('customerDetail.billing.quotation.tierNote', { hours: lessonPricing.totalHours.toFixed(1) })}
                  </p>
                )}
              </div>

              <div className="mt-6">
                <h3 className="text-sm font-semibold text-gray-900 mb-2">{t('customerDetail.billing.transactions.title')}</h3>
                {billingLoading ? (
                  <div className="text-gray-600 text-sm">{t('customerDetail.billing.transactions.loading')}</div>
                ) : billingItems.length === 0 ? (
                  <div className="text-sm text-gray-500">{t('customerDetail.billing.transactions.empty')}</div>
                ) : (
                  <div className="space-y-3 max-h-56 overflow-y-auto pr-1">
                    {billingItems.slice(0, 6).map((item, index) => (
                      <div
                        key={`${item.order_id}-${item.occurred_at}-${item.transaction_type_code}-${index}`}
                        className="rounded-lg border border-gray-200 p-3 text-sm flex items-start justify-between gap-3"
                      >
                        <div>
                          <p className="font-medium text-gray-900">
                            {item.service_name || item.transaction_label || t('customerDetail.billing.transactions.transaction')}
                          </p>
                          <p className="text-xs text-gray-500">
                            {item.category_name || item.transaction_type_code || '—'}
                          </p>
                          <p className="text-xs text-gray-400 mt-1">
                            {new Date(item.occurred_at).toLocaleDateString()}
                          </p>
                        </div>
                        <div
                          className={`text-sm font-semibold ${
                            item.amount >= 0 ? 'text-emerald-600' : 'text-rose-600'
                          }`}
                        >
                          {formatCurrency(item.amount)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Orders Section */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-bold text-gray-900">{t('customerDetail.orders.title')}</h2>
                  <p className="text-gray-500 text-sm mt-1">
                    {t('customerDetail.orders.count', { count: orders.length })}
                  </p>
                </div>
              </div>

              {ordersLoading ? (
                <div className="text-gray-600 text-sm py-8">{t('customerDetail.orders.loading')}</div>
              ) : orders.length === 0 ? (
                <div className="text-gray-500 text-sm py-8 text-center border border-dashed border-gray-300 rounded-lg">
                  {t('customerDetail.orders.empty')}
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Desktop view */}
                  <div className="hidden md:block overflow-x-auto border border-gray-200 rounded-xl">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            {t('customerDetail.orders.table.order')}
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            {t('customerDetail.orders.table.type')}
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            {t('customerDetail.orders.table.service')}
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            {t('customerDetail.orders.table.category')}
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            {t('customerDetail.orders.table.status')}
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            {t('customerDetail.orders.table.starting')}
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            {t('customerDetail.orders.table.ending')}
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            {t('customerDetail.orders.table.actions')}
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-100">
                        {orders.map((order) => (
                          <tr
                            key={order.id}
                            className="hover:bg-gray-50"
                          >
                            <td className="px-4 py-3 text-sm text-gray-900 font-medium">#{order.id}</td>
                            <td className="px-4 py-3 text-sm text-gray-600 capitalize">{order.type || '—'}</td>
                            <td className="px-4 py-3 text-sm text-gray-600">{order.service_name || '—'}</td>
                            <td className="px-4 py-3 text-sm text-gray-600">{order.category_name || '—'}</td>
                            <td className="px-4 py-3 text-sm">{renderStatusBadge(order.status)}</td>
                            <td className="px-4 py-3 text-sm text-gray-600">{formatOrderDate(order.starting)}</td>
                            <td className="px-4 py-3 text-sm text-gray-600">{formatOrderDate(order.ending)}</td>
                            <td className="px-4 py-3 text-sm text-gray-600">
                              <div className="flex items-center gap-3">
                                <button
                                  onClick={() => onEditOrder({ id: order.id })}
                                  disabled={!canModify(user)}
                                  className="text-gray-500 hover:text-indigo-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:text-gray-500"
                                  title={t('customerDetail.orders.actions.edit')}
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536M16.732 3.732a2.5 2.5 0 113.536 3.536L7.5 20.036H4v-3.572L16.732 3.732z" />
                                  </svg>
                                </button>
                                <button
                                  onClick={() => onDeleteOrder?.(order.id)}
                                  disabled={!canModify(user)}
                                  className="text-gray-500 hover:text-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:text-gray-500"
                                  title={t('customerDetail.orders.actions.delete')}
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {/* Mobile view */}
                  <div className="md:hidden space-y-4">
                    {orders.map((order) => (
                      <div
                        key={order.id}
                        className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
                      >
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div className="flex-1">
                            <p className="text-base font-semibold text-gray-900">
                              Order #{order.id} · {order.type || 'other'}
                            </p>
                            <p className="text-sm text-gray-600">{order.service_name || '—'}</p>
                            <p className="text-xs text-gray-400">{order.category_name || '—'}</p>
                          </div>
                          <div>{renderStatusBadge(order.status)}</div>
                        </div>

                        {/* Order Details */}
                        <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm text-gray-600 mt-3 pt-3 border-t border-gray-100">
                          {order.type === 'lessons' && order.instructor_name && (
                            <div className="col-span-2">
                              <dt className="text-gray-400 text-xs uppercase">{t('customerDetail.orders.mobile.instructor')}</dt>
                              <dd>{order.instructor_name}</dd>
                            </div>
                          )}
                          {order.type === 'rentals' && order.equipment_name && (
                            <div className="col-span-2">
                              <dt className="text-gray-400 text-xs uppercase">{t('customerDetail.orders.mobile.equipment')}</dt>
                              <dd>{order.equipment_name}</dd>
                            </div>
                          )}
                          {order.starting && (
                            <div>
                              <dt className="text-gray-400 text-xs uppercase">{t('customerDetail.orders.mobile.starting')}</dt>
                              <dd className="font-medium">{formatOrderDate(order.starting)}</dd>
                            </div>
                          )}
                          {order.ending && (
                            <div>
                              <dt className="text-gray-400 text-xs uppercase">{t('customerDetail.orders.mobile.ending')}</dt>
                              <dd className="font-medium">{formatOrderDate(order.ending)}</dd>
                            </div>
                          )}
                          {(order.lesson_note || order.rental_note || order.storage_note) && (
                            <div className="col-span-2">
                              <dt className="text-gray-400 text-xs uppercase">{t('customerDetail.orders.mobile.note')}</dt>
                              <dd className="mt-1">{order.lesson_note || order.rental_note || order.storage_note}</dd>
                            </div>
                          )}
                        </dl>
                        <div className="flex items-center gap-3 mt-3 pt-3 border-t border-gray-100">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              onEditOrder({ id: order.id })
                            }}
                            disabled={!canModify(user)}
                            className="text-gray-500 hover:text-indigo-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:text-gray-500"
                            title={t('customerDetail.orders.actions.edit')}
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536M16.732 3.732a2.5 2.5 0 113.536 3.536L7.5 20.036H4v-3.572L16.732 3.732z" />
                            </svg>
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              onDeleteOrder?.(order.id)
                            }}
                            disabled={!canModify(user)}
                            className="text-gray-500 hover:text-red-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:text-gray-500"
                            title={t('customerDetail.orders.actions.delete')}
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column */}
          <div className="xl:col-span-1 space-y-6">
            {/* Personal Info Card */}
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-5 shadow-sm sticky top-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">{t('customerDetail.info.title')}</h2>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onEdit?.(customer)}
                    disabled={!canModify(user)}
                    className="inline-flex items-center justify-center p-2 rounded-lg border border-gray-300 bg-white text-gray-700 shadow-sm hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white"
                    title={t('customerDetail.actions.edit')}
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M15.232 5.232l3.536 3.536M16.732 3.732a2.5 2.5 0 113.536 3.536L7.5 20.036H4v-3.572L16.732 3.732z"
                      />
                    </svg>
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={deleting || !canModify(user)}
                    className="inline-flex items-center justify-center p-2 rounded-lg border border-red-300 bg-white text-red-700 shadow-sm hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white"
                    title={t('customerDetail.actions.delete')}
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>
              </div>
              
              <dl className="space-y-4">
                <div>
                  <dt className="text-xs font-medium text-gray-500 uppercase">{t('customerDetail.info.fullname')}</dt>
                  <dd className="mt-1 text-sm text-gray-900">{customer.fullname || '—'}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-gray-500 uppercase">{t('customerDetail.info.phone')}</dt>
                  <dd className="mt-1 text-sm text-gray-900">{customer.phone || '—'}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-gray-500 uppercase">{t('customerDetail.info.email')}</dt>
                  <dd className="mt-1 text-sm text-gray-900">{customer.email || '—'}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-gray-500 uppercase">{t('customerDetail.info.birthdate')}</dt>
                  <dd className="mt-1 text-sm text-gray-900">{formatDate(customer.birthdate)}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-gray-500 uppercase">{t('customerDetail.info.country')}</dt>
                  <dd className="mt-1 text-sm text-gray-900">{customer.country || '—'}</dd>
                </div>
                <div className="pt-4 border-t border-gray-200">
                  <dt className="text-xs font-medium text-gray-500 uppercase">{t('customerDetail.info.doctype')}</dt>
                  <dd className="mt-1 text-sm text-gray-900">{customer.doctype || '—'}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-gray-500 uppercase">{t('customerDetail.info.doc')}</dt>
                  <dd className="mt-1 text-sm text-gray-900">{customer.doc || '—'}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-gray-500 uppercase">{t('customerDetail.info.hotel')}</dt>
                  <dd className="mt-1 text-sm text-gray-900">{customer.hotel_name || '—'}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-gray-500 uppercase">{t('customerDetail.info.agency')}</dt>
                  <dd className="mt-1 text-sm text-gray-900">{customer.agency_name || '—'}</dd>
                </div>
                {customer.note && (
                  <div className="pt-4 border-t border-gray-200">
                    <dt className="text-xs font-medium text-gray-500 uppercase mb-2 block">{t('customerDetail.info.note')}</dt>
                    <dd className="text-sm text-gray-700 whitespace-pre-wrap">{customer.note}</dd>
                  </div>
                )}
                <div className="pt-4 border-t border-gray-200">
                  <dt className="text-xs font-medium text-gray-500 uppercase">{t('customerDetail.info.customerId')}</dt>
                  <dd className="mt-1 text-sm text-gray-900 font-mono">#{customer.id}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-gray-500 uppercase">{t('customerDetail.info.created')}</dt>
                  <dd className="mt-1 text-sm text-gray-900">{formatDateTime(customer.created_at)}</dd>
                </div>
                {customer.updated_at && (
                  <div>
                    <dt className="text-xs font-medium text-gray-500 uppercase">{t('customerDetail.info.updated')}</dt>
                    <dd className="mt-1 text-sm text-gray-900">{formatDateTime(customer.updated_at)}</dd>
                  </div>
                )}
              </dl>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CustomerDetail

