import { useEffect, useMemo, useState } from 'react'
import sql from '../lib/neon'

function PaymentsDue({ limit = 5, onViewCustomer = () => {} }) {
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchPayments = async () => {
      try {
        setLoading(true)
        setError(null)

        const orderRows =
          (await sql`
            SELECT
              o.id,
              o.customer_id,
              c.fullname AS customer_name,
              s.id AS service_id,
              s.name AS service_name,
              sc.name AS category_name,
              COALESCE(ol.starting, orent.starting, ost.starting) AS starting,
              COALESCE(ol.ending, orent.ending, ost.ending) AS ending,
              sl.base_price_per_hour,
              sr.hourly_rate,
              sr.daily_rate,
              sr.weekly_rate,
              ss.daily_rate AS storage_daily_rate,
              ss.weekly_rate AS storage_weekly_rate,
              ss.monthly_rate AS storage_monthly_rate,
              orent.hourly AS rental_hourly_flag,
              orent.daily AS rental_daily_flag,
              orent.weekly AS rental_weekly_flag,
              ost.daily AS storage_daily_flag,
              ost.weekly AS storage_weekly_flag,
              ost.monthly AS storage_monthly_flag,
              o.created_at
            FROM orders o
            JOIN customers c ON c.id = o.customer_id
            JOIN services s ON s.id = o.service_id
            JOIN service_categories sc ON sc.id = s.category_id
            LEFT JOIN orders_lessons ol ON ol.order_id = o.id
            LEFT JOIN services_lessons sl ON sl.service_id = s.id
            LEFT JOIN orders_rentals orent ON orent.order_id = o.id
            LEFT JOIN services_rentals sr ON sr.service_id = s.id
            LEFT JOIN orders_storage ost ON ost.order_id = o.id
            LEFT JOIN services_storage ss ON ss.service_id = s.id
          `) || []

        const paymentRows =
          (await sql`
            SELECT customer_id, SUM(amount_paid) AS paid_amount
            FROM (
              SELECT
                CASE
                  WHEN t.source_entity_type = 'customer' THEN t.source_entity_id
                  WHEN t.destination_entity_type = 'customer' THEN t.destination_entity_id
                  ELSE NULL
                END AS customer_id,
                CASE
                  WHEN t.source_entity_type = 'customer' THEN t.amount
                  WHEN t.destination_entity_type = 'customer' THEN -t.amount
                  ELSE 0
                END AS amount_paid
              FROM transactions t
              JOIN transaction_types tt ON tt.id = t.type_id
              WHERE t.source_entity_type = 'customer'
                 OR t.destination_entity_type = 'customer'
            ) sub
            WHERE customer_id IS NOT NULL
            GROUP BY customer_id
          `) || []

        const paymentsMap = new Map(paymentRows.map((row) => [row.customer_id, Number(row.paid_amount || 0)]))

        const chargesByCustomer = new Map()

        const hoursBetween = (start, end) => {
          if (!start || !end) return 0
          const startDate = new Date(start)
          const endDate = new Date(end)
          const diffMs = endDate - startDate
          if (Number.isNaN(diffMs) || diffMs <= 0) return 0
          return diffMs / (1000 * 60 * 60)
        }

        const ensureEntry = (row) => {
          if (!chargesByCustomer.has(row.customer_id)) {
            chargesByCustomer.set(row.customer_id, {
              customerId: row.customer_id,
              customerName: row.customer_name,
              total: 0,
              serviceCount: 0,
              lastOrderDate: row.created_at ? new Date(row.created_at) : null,
              services: new Set()
            })
          }
          const entry = chargesByCustomer.get(row.customer_id)
          entry.serviceCount += 1
          entry.services.add(row.service_name)
          if (row.created_at) {
            const orderDate = new Date(row.created_at)
            if (!entry.lastOrderDate || orderDate > entry.lastOrderDate) {
              entry.lastOrderDate = orderDate
            }
          }
          return entry
        }

        orderRows.forEach((row) => {
          const entry = ensureEntry(row)
          const category = (row.category_name || '').toLowerCase()
          const diffHours = hoursBetween(row.starting, row.ending)
          let charge = 0

          if (category === 'lessons') {
            const rate = Number(row.base_price_per_hour || 0)
            charge = diffHours * rate
          } else if (category === 'rentals') {
            if (row.rental_hourly_flag && row.hourly_rate) {
              charge += diffHours * Number(row.hourly_rate)
            }
            if (row.rental_daily_flag && row.daily_rate) {
              const days = Math.max(1, Math.ceil(diffHours / 24))
              charge += days * Number(row.daily_rate)
            }
            if (row.rental_weekly_flag && row.weekly_rate) {
              const weeks = Math.max(1, Math.ceil(diffHours / (24 * 7)))
              charge += weeks * Number(row.weekly_rate)
            }
            if (!row.rental_hourly_flag && !row.rental_daily_flag && !row.rental_weekly_flag && row.daily_rate) {
              const days = Math.max(1, Math.ceil(diffHours / 24))
              charge += days * Number(row.daily_rate)
            }
          } else if (category === 'storage') {
            const days = diffHours > 0 ? Math.max(1, Math.ceil(diffHours / 24)) : 0
            if (row.storage_daily_flag && row.storage_daily_rate) {
              charge += days * Number(row.storage_daily_rate)
            }
            if (row.storage_weekly_flag && row.storage_weekly_rate) {
              const weeks = Math.max(1, Math.ceil(days / 7))
              charge += weeks * Number(row.storage_weekly_rate)
            }
            if (row.storage_monthly_flag && row.storage_monthly_rate) {
              const months = Math.max(1, Math.ceil(days / 30))
              charge += months * Number(row.storage_monthly_rate)
            }
            if (!row.storage_daily_flag && !row.storage_weekly_flag && !row.storage_monthly_flag && row.storage_daily_rate) {
              charge += days * Number(row.storage_daily_rate)
            }
          }

          entry.total += charge
        })

        const entriesData = Array.from(chargesByCustomer.values())
          .map((entry) => {
            const paid = paymentsMap.get(entry.customerId) || 0
            const outstanding = Math.max(0, entry.total - paid)
            return {
              customerId: entry.customerId,
              customerName: entry.customerName,
              total: entry.total,
              paid,
              outstanding,
              serviceCount: entry.services.size,
              lastOrderDate: entry.lastOrderDate
            }
          })
          .sort((a, b) => b.total - a.total)
          .slice(0, limit)

        setEntries(entriesData)
      } catch (err) {
        console.error('Failed to load payments due:', err)
        setError('Unable to load payments due. Please try again later.')
      } finally {
        setLoading(false)
      }
    }

    fetchPayments()
  }, [limit])

  const formatCurrency = (value) =>
    new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(value || 0))

  const formatDate = (value) => {
    if (!value) return '—'
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return '—'
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  }

  return (
    <div className="rounded-xl bg-white p-2 sm:p-4 md:p-6 shadow-sm w-full">
      <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-4">Payments Due</h2>

      {loading && <div className="text-sm text-gray-600">Loading payments...</div>}
      {error && <div className="text-sm text-red-600">{error}</div>}

      {!loading && !error && entries.length === 0 && (
        <div className="text-gray-600">No payments to show.</div>
      )}

      {!loading && !error && entries.length > 0 && (
        <div className="space-y-3">
          {/* Desktop view */}
          <div className="hidden md:block overflow-x-auto border border-gray-200 rounded-xl">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Paid
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    Outstanding
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-100">
                {entries.map((entry) => (
                  <tr
                    key={entry.customerId}
                    onClick={() => onViewCustomer({ id: entry.customerId })}
                    className="hover:bg-gray-50 cursor-pointer"
                  >
                    <td className="px-4 py-3 text-sm text-gray-900 font-medium">
                      {entry.customerName || '—'}
                      {entry.lastOrderDate && (
                        <span className="block text-xs text-gray-400">Last {formatDate(entry.lastOrderDate)}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm text-emerald-600 font-semibold">{formatCurrency(entry.paid)}</td>
                    <td className="px-4 py-3 text-sm text-rose-600 font-semibold">{formatCurrency(entry.outstanding)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile view */}
          <div className="md:hidden space-y-3">
            {entries.map((entry) => (
              <div
                key={entry.customerId}
                onClick={() => onViewCustomer({ id: entry.customerId })}
                className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex-1">
                    <p className="text-base font-semibold text-gray-900">{entry.customerName || '—'}</p>
                    <p className="text-xs text-gray-500">
                      {entry.serviceCount} {entry.serviceCount === 1 ? 'service' : 'services'}
                      {entry.lastOrderDate ? ` • Last ${formatDate(entry.lastOrderDate)}` : ''}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="inline-flex items-center rounded-full bg-rose-100 px-2.5 py-0.5 text-xs font-medium text-rose-800">
                      {formatCurrency(entry.outstanding)}
                    </span>
                  </div>
                </div>
                <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2 text-sm text-gray-600">
                  <div>
                    <dt className="text-gray-400 text-xs uppercase">Paid</dt>
                    <dd className="font-medium">{formatCurrency(entry.paid)}</dd>
                  </div>
                </dl>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default PaymentsDue


