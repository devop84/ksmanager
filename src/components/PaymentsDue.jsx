import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import sql from '../lib/neon'
import { useSettings } from '../context/SettingsContext'

function PaymentsDue({ limit = 5, onViewCustomer = () => {} }) {
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const { formatCurrency, formatDate } = useSettings()
  const { t } = useTranslation()

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
              o.calculated_price,
              o.created_at
            FROM orders o
            JOIN customers c ON c.id = o.customer_id
            JOIN services s ON s.id = o.service_id
            JOIN service_categories sc ON sc.id = s.category_id
            LEFT JOIN orders_lessons ol ON ol.order_id = o.id
            LEFT JOIN orders_rentals orent ON orent.order_id = o.id
            LEFT JOIN orders_storage ost ON ost.order_id = o.id
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

          // Pricing calculation removed - will need to be updated to use packages or orders.calculated_price
          // For now, just use calculated_price from orders table if available
          const calculatedPrice = row.calculated_price || 0
          charge = calculatedPrice

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
        setError(t('dashboard.paymentsDue.error.load'))
      } finally {
        setLoading(false)
      }
    }

    fetchPayments()
  }, [limit])

  return (
    <div className="rounded-xl bg-white p-2 sm:p-4 md:p-6 shadow-sm w-full">
      <h2 className="text-lg sm:text-xl font-semibold text-gray-800 mb-4">{t('dashboard.paymentsDue.title')}</h2>

      {loading && <div className="text-sm text-gray-600">{t('common.loading')}</div>}
      {error && <div className="text-sm text-red-600">{error}</div>}

      {!loading && !error && entries.length === 0 && <div className="text-gray-600">{t('common.empty')}</div>}

      {!loading && !error && entries.length > 0 && (
        <div className="space-y-3">
          {/* Desktop view */}
          <div className="hidden md:block overflow-x-auto border border-gray-200 rounded-xl">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    {t('dashboard.paymentsDue.table.customer')}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    {t('dashboard.paymentsDue.table.paid')}
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                    {t('dashboard.paymentsDue.table.outstanding')}
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
                        <span className="block text-xs text-gray-400">
                          {t('common.last', 'Last')}{' '}
                          {formatDate(entry.lastOrderDate, { month: 'short', day: 'numeric' })}
                        </span>
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
                      {entry.serviceCount}{' '}
                      {entry.serviceCount === 1 ? t('common.services.one') : t('common.services.other')}
                      {entry.lastOrderDate
                        ? ` • ${t('common.last', 'Last')} ${formatDate(entry.lastOrderDate, { month: 'short', day: 'numeric' })}`
                        : ''}
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
                    <dt className="text-gray-400 text-xs uppercase">{t('dashboard.paymentsDue.mobile.paid')}</dt>
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


