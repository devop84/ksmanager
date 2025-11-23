import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import sql from '../../lib/neon'
import { useSettings } from '../../context/SettingsContext'

function PaymentsDueAndOpenOrders({ user, onViewOrder, onViewCustomer }) {
  const { t } = useTranslation()
  const { formatCurrency, formatDateTime } = useSettings()
  const [paymentsDue, setPaymentsDue] = useState([])
  const [openOrders, setOpenOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)

        // Fetch orders with payments due (balance_due > 0)
        const paymentsDueResult = await sql`
          SELECT 
            o.id,
            o.order_number,
            o.status,
            o.total_amount,
            o.total_paid,
            o.balance_due,
            o.currency,
            o.created_at,
            c.id AS customer_id,
            c.fullname AS customer_name,
            c.phone AS customer_phone,
            c.email AS customer_email
          FROM orders o
          LEFT JOIN customers c ON o.customer_id = c.id
          WHERE o.balance_due > 0
            AND o.status != 'cancelled'
          ORDER BY o.balance_due DESC, o.created_at DESC
          LIMIT 20
        `

        // Fetch orders with open status
        const openOrdersResult = await sql`
          SELECT 
            o.id,
            o.order_number,
            o.status,
            o.total_amount,
            o.total_paid,
            o.balance_due,
            o.currency,
            o.created_at,
            c.id AS customer_id,
            c.fullname AS customer_name,
            c.phone AS customer_phone,
            c.email AS customer_email
          FROM orders o
          LEFT JOIN customers c ON o.customer_id = c.id
          WHERE o.status = 'open'
          ORDER BY o.created_at DESC
          LIMIT 20
        `

        setPaymentsDue(paymentsDueResult || [])
        setOpenOrders(openOrdersResult || [])
      } catch (err) {
        console.error('Failed to load payments due and open orders:', err)
        setError(t('dashboard.paymentsDueAndOpenOrders.error.load', 'Unable to load data. Please try again later.'))
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [t])

  const renderOrderCard = (order, isPaymentDue = false) => {
    if (!order || !order.id) return null

    return (
      <div
        key={order.id}
        onClick={() => onViewOrder && onViewOrder({ id: order.id })}
        className="p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer transition-colors mb-2"
      >
        <div className="flex items-start justify-between mb-2">
          <div className="flex-1 min-w-0">
            <div className="font-medium text-gray-900 text-sm truncate">
              {order.customer_name || '—'}
            </div>
            <div className="text-xs text-gray-600 mt-0.5 truncate">
              {order.order_number || `#${order.id}`}
            </div>
          </div>
          {isPaymentDue && (
            <span className="inline-flex items-center rounded-full border px-2 py-1 text-xs font-semibold text-rose-700 bg-rose-50 border-rose-100 flex-shrink-0 ml-2">
              {t('dashboard.paymentsDueAndOpenOrders.paymentDue', 'PAYMENT DUE')}
            </span>
          )}
        </div>
        <div className="mt-2 pt-2 border-t border-gray-100 space-y-1">
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-500">{t('dashboard.paymentsDueAndOpenOrders.total', 'Total')}:</span>
            <span className="font-medium text-gray-900">{formatCurrency(Number(order.total_amount || 0))}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-gray-500">{t('dashboard.paymentsDueAndOpenOrders.paid', 'Paid')}:</span>
            <span className="text-gray-700">{formatCurrency(Number(order.total_paid || 0))}</span>
          </div>
          {isPaymentDue && (
            <div className="flex items-center justify-between text-xs">
              <span className="text-gray-500">{t('dashboard.paymentsDueAndOpenOrders.balance', 'Balance')}:</span>
              <span className="font-semibold text-rose-700">{formatCurrency(Number(order.balance_due || 0))}</span>
            </div>
          )}
          <div className="flex items-center gap-1.5 text-xs text-gray-500 mt-1">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span>{formatDateTime(order.created_at)}</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Payments Due Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            {t('dashboard.paymentsDueAndOpenOrders.paymentsDue.title', 'Payments Due')}
          </h2>
          {paymentsDue.length > 0 && (
            <span className="text-sm text-gray-500">
              {t('dashboard.paymentsDueAndOpenOrders.paymentsDue.count', '{{count}} orders', { count: paymentsDue.length })}
            </span>
          )}
        </div>

        {loading ? (
          <div className="text-gray-600 text-sm text-center py-8">
            {t('dashboard.paymentsDueAndOpenOrders.loading', 'Loading...')}
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800 text-sm">
            {error}
          </div>
        ) : paymentsDue.length === 0 ? (
          <div className="text-gray-500 text-sm text-center py-8">
            {t('dashboard.paymentsDueAndOpenOrders.paymentsDue.empty', 'No payments due at this time.')}
          </div>
        ) : (
          <div className="space-y-2">
            {paymentsDue.map((order) => renderOrderCard(order, true))}
          </div>
        )}
      </div>

      {/* Open Orders Section */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">
            {t('dashboard.paymentsDueAndOpenOrders.openOrders.title', 'Open Orders')}
          </h2>
          {openOrders.length > 0 && (
            <span className="text-sm text-gray-500">
              {t('dashboard.paymentsDueAndOpenOrders.openOrders.count', '{{count}} orders', { count: openOrders.length })}
            </span>
          )}
        </div>

        {loading ? (
          <div className="text-gray-600 text-sm text-center py-8">
            {t('dashboard.paymentsDueAndOpenOrders.loading', 'Loading...')}
          </div>
        ) : error ? (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800 text-sm">
            {error}
          </div>
        ) : openOrders.length === 0 ? (
          <div className="text-gray-500 text-sm text-center py-8">
            {t('dashboard.paymentsDueAndOpenOrders.openOrders.empty', 'No open orders at this time.')}
          </div>
        ) : (
          <div className="space-y-2">
            {openOrders.map((order) => renderOrderCard(order, false))}
          </div>
        )}
      </div>
    </div>
  )
}

export default PaymentsDueAndOpenOrders

