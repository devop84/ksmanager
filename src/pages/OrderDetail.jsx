import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import sql from '../lib/neon'
import { canModify } from '../lib/permissions'
import { useSettings } from '../context/SettingsContext'

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
            o.instructor_id,
            o.agency_id,
            o.note,
            c.fullname AS customer_name,
            i.fullname AS instructor_name,
            a.name AS agency_name,
            u.name AS created_by_name
          FROM orders o
          LEFT JOIN customers c ON o.customer_id = c.id
          LEFT JOIN instructors i ON o.instructor_id = i.id
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

        // Fetch order items
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
            oi.created_at
          FROM order_items oi
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

  const handleCloseOrder = async () => {
    if (!orderId || !order) return
    if (order.balance_due > 0) {
      if (!window.confirm(t('orderDetail.confirm.closeWithBalance', 'This order has an outstanding balance. Are you sure you want to close it?'))) {
        return
      }
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
          o.instructor_id,
          o.agency_id,
          o.note,
          c.fullname AS customer_name,
          i.fullname AS instructor_name,
          a.name AS agency_name,
          u.name AS created_by_name
        FROM orders o
        LEFT JOIN customers c ON o.customer_id = c.id
        LEFT JOIN instructors i ON o.instructor_id = i.id
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
          o.instructor_id,
          o.agency_id,
          o.note,
          c.fullname AS customer_name,
          i.fullname AS instructor_name,
          a.name AS agency_name,
          u.name AS created_by_name
        FROM orders o
        LEFT JOIN customers c ON o.customer_id = c.id
        LEFT JOIN instructors i ON o.instructor_id = i.id
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
                    className="inline-flex items-center justify-center rounded-lg border border-emerald-300 px-3 py-2 text-sm font-semibold text-emerald-700 shadow-sm hover:bg-emerald-50 transition-colors"
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
              <button
                onClick={() => onEdit?.(order)}
                disabled={!canModify(user) || order.status !== 'open'}
                className="inline-flex items-center justify-center rounded-lg border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white"
              >
                {t('orderDetail.buttons.edit', 'Edit')}
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting || !canModify(user)}
                className="inline-flex items-center justify-center rounded-lg border border-red-300 px-3 py-2 text-sm font-semibold text-red-700 shadow-sm hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white"
              >
                {deleting ? t('orderDetail.buttons.deleting', 'Deleting…') : t('orderDetail.buttons.delete', 'Delete')}
              </button>
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
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                {t('orderDetail.items.title', 'Order Items')}
              </h2>
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
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {orderItems.map((item) => (
                        <tr key={item.id}>
                          <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                            {item.item_name}
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
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-gray-50">
                      <tr>
                        <td colSpan="4" className="px-4 py-3 text-right text-sm font-semibold text-gray-900">
                          {t('orderDetail.items.subtotal', 'Subtotal')}:
                        </td>
                        <td className="px-4 py-3 text-right text-sm font-semibold text-gray-900">
                          {formatAmount(order.subtotal)}
                        </td>
                      </tr>
                      {order.discount_amount > 0 && (
                        <tr>
                          <td colSpan="4" className="px-4 py-3 text-right text-sm font-semibold text-gray-500">
                            {t('orderDetail.items.discount', 'Discount')}:
                          </td>
                          <td className="px-4 py-3 text-right text-sm font-semibold text-red-600">
                            -{formatAmount(order.discount_amount)}
                          </td>
                        </tr>
                      )}
                      {order.tax_amount > 0 && (
                        <tr>
                          <td colSpan="4" className="px-4 py-3 text-right text-sm font-semibold text-gray-500">
                            {t('orderDetail.items.tax', 'Tax')}:
                          </td>
                          <td className="px-4 py-3 text-right text-sm font-semibold text-gray-900">
                            {formatAmount(order.tax_amount)}
                          </td>
                        </tr>
                      )}
                      <tr>
                        <td colSpan="4" className="px-4 py-3 text-right text-sm font-bold text-gray-900">
                          {t('orderDetail.items.total', 'Total')}:
                        </td>
                        <td className="px-4 py-3 text-right text-sm font-bold text-gray-900">
                          {formatAmount(order.total_amount)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </div>

            {/* Payments */}
            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                {t('orderDetail.payments.title', 'Payments')}
              </h2>
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
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-gray-50">
                      <tr>
                        <td colSpan="3" className="px-4 py-3 text-right text-sm font-bold text-gray-900">
                          {t('orderDetail.payments.total', 'Total Paid')}:
                        </td>
                        <td className="px-4 py-3 text-right text-sm font-bold text-emerald-700">
                          {formatAmount(order.total_paid)}
                        </td>
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
                {order.instructor_name && (
                  <div>
                    <dt className="text-xs font-semibold uppercase text-gray-500">
                      {t('orderDetail.details.instructor', 'Instructor')}
                    </dt>
                    <dd className="mt-1 text-gray-900">{order.instructor_name}</dd>
                  </div>
                )}
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
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-5 shadow-sm sticky top-6 space-y-4">
              <div>
                <p className="text-xs font-semibold uppercase text-gray-500">
                  {t('orderDetail.sidebar.orderId', 'Order ID')}
                </p>
                <p className="mt-1 text-gray-900 font-mono">#{order.id}</p>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase text-gray-500">
                  {t('orderDetail.sidebar.created', 'Created')}
                </p>
                <p className="mt-1 text-gray-900">
                  {formatDateTime(order.created_at)}
                </p>
              </div>
              {order.closed_at && (
                <div>
                  <p className="text-xs font-semibold uppercase text-gray-500">
                    {t('orderDetail.sidebar.closed', 'Closed')}
                  </p>
                  <p className="mt-1 text-gray-900">
                    {formatDateTime(order.closed_at)}
                  </p>
                </div>
              )}
              {order.cancelled_at && (
                <div>
                  <p className="text-xs font-semibold uppercase text-gray-500">
                    {t('orderDetail.sidebar.cancelled', 'Cancelled')}
                  </p>
                  <p className="mt-1 text-gray-900">
                    {formatDateTime(order.cancelled_at)}
                  </p>
                </div>
              )}
              {order.updated_at && (
                <div>
                  <p className="text-xs font-semibold uppercase text-gray-500">
                    {t('orderDetail.sidebar.updated', 'Last update')}
                  </p>
                  <p className="mt-1 text-gray-900">
                    {formatDateTime(order.updated_at)}
                  </p>
                </div>
              )}
              {order.created_by_name && (
                <div>
                  <p className="text-xs font-semibold uppercase text-gray-500">
                    {t('orderDetail.sidebar.createdBy', 'Created By')}
                  </p>
                  <p className="mt-1 text-gray-900">{order.created_by_name}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default OrderDetail

