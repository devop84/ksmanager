import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import sql from '../lib/neon'
import { canModify } from '../lib/permissions'
import { useSettings } from '../context/SettingsContext'

const statusStyles = {
  pending: 'bg-yellow-100 text-yellow-800',
  in_progress: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
  cancelled: 'bg-red-100 text-red-800'
}

function AgencyDetail({ agencyId, onBack, onEdit, onDelete, user = null }) {
  const [agency, setAgency] = useState(null)
  const [customers, setCustomers] = useState([])
  const [orders, setOrders] = useState([])
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const { formatCurrency, formatDate, formatDateTime, formatNumber } = useSettings()
  const { t } = useTranslation()

  useEffect(() => {
    if (!agencyId) return

    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)

        const [agencyRows, customerRows, orderRows, transactionRows] = await Promise.all([
          sql`
            SELECT
              id,
              name,
              phone,
              email,
              commission,
              note,
              created_at,
              updated_at
            FROM agencies
            WHERE id = ${agencyId}
            LIMIT 1
          `,
          sql`
            SELECT
              c.id,
              c.fullname,
              c.phone,
              c.email,
              c.country,
              c.created_at,
              COUNT(o.id) AS order_count,
              MAX(o.created_at) AS last_order_at
            FROM customers c
            LEFT JOIN orders o ON o.customer_id = c.id
            WHERE c.agency_id = ${agencyId}
            GROUP BY c.id, c.fullname, c.phone, c.email, c.country, c.created_at
            ORDER BY c.fullname ASC
          `,
          sql`
            SELECT
              o.id,
              o.cancelled,
              o.created_at,
              s.name AS service_name,
              sc.name AS category_name,
              c.fullname AS customer_name,
              COALESCE(ol.starting, orent.starting, ost.starting) AS starting,
              COALESCE(ol.ending, orent.ending, ost.ending) AS ending,
              CASE
                WHEN ol.order_id IS NOT NULL THEN 'lessons'
                WHEN orent.order_id IS NOT NULL THEN 'rentals'
                WHEN ost.order_id IS NOT NULL THEN 'storage'
                ELSE 'other'
              END AS order_type
            FROM orders o
            JOIN customers c ON c.id = o.customer_id
            JOIN services s ON s.id = o.service_id
            JOIN service_categories sc ON sc.id = s.category_id
            LEFT JOIN orders_lessons ol ON ol.order_id = o.id
            LEFT JOIN orders_rentals orent ON orent.order_id = o.id
            LEFT JOIN orders_storage ost ON ost.order_id = o.id
            WHERE c.agency_id = ${agencyId}
            ORDER BY o.created_at DESC
            LIMIT 50
          `,
          sql`
            SELECT
              t.id,
              t.occurred_at,
              t.amount,
              tt.label AS type_label,
              tt.direction,
              pm.name AS payment_method,
              t.source_entity_type,
              t.source_entity_id,
              t.destination_entity_type,
              t.destination_entity_id
            FROM transactions t
            JOIN transaction_types tt ON tt.id = t.type_id
            LEFT JOIN payment_methods pm ON pm.id = t.payment_method_id
            WHERE (t.source_entity_type = 'agency' AND t.source_entity_id = ${agencyId})
               OR (t.destination_entity_type = 'agency' AND t.destination_entity_id = ${agencyId})
            ORDER BY t.occurred_at DESC
            LIMIT 50
          `
        ])

        if (!agencyRows?.length) {
          setError(t('agencyDetail.notFound'))
          setAgency(null)
          setCustomers([])
          setOrders([])
          setTransactions([])
          return
        }

        const preparedCustomers =
          customerRows?.map((row) => ({
            ...row,
            order_count: Number(row.order_count) || 0
          })) || []

        const preparedOrders =
          orderRows?.map((row) => ({
            ...row,
            status: determineStatus(row)
          })) || []

        const preparedTransactions =
          transactionRows?.map((row) => ({
            ...row,
            amount: Number(row.amount || 0)
          })) || []

        setAgency(agencyRows[0])
        setCustomers(preparedCustomers)
        setOrders(preparedOrders)
        setTransactions(preparedTransactions)
      } catch (err) {
        console.error('Failed to load agency details:', err)
        setError(t('agencyDetail.error.load'))
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [agencyId, t])

  const summary = useMemo(() => {
    const totalCustomers = customers.length
    const totalOrders = orders.length
    const activeOrders = orders.filter((order) => order.status === 'pending' || order.status === 'in_progress').length

    const commissionTotals = transactions.reduce(
      (acc, txn) => {
        const amount = Number(txn.amount || 0)
        const absAmount = Math.abs(amount)
        const isDestinationAgency = txn.destination_entity_type === 'agency'
        const isSourceAgency = txn.source_entity_type === 'agency'

        if (txn.direction === 'expense' && isDestinationAgency) {
          acc.paid += absAmount
        }
        if (txn.direction === 'income' && isSourceAgency) {
          acc.received += absAmount
        }

        acc.net += amount
        return acc
      },
      { paid: 0, received: 0, net: 0 }
    )

    return {
      totalCustomers,
      totalOrders,
      activeOrders,
      commissionPaid: commissionTotals.paid,
      netFlow: commissionTotals.net
    }
  }, [customers, orders, transactions])

  const handleDelete = async () => {
    if (!window.confirm(t('agencyDetail.confirm.delete'))) {
      return
    }
    try {
      setDeleting(true)
      await sql`DELETE FROM agencies WHERE id = ${agencyId}`
      if (onDelete) {
        onDelete()
      } else if (onBack) {
        onBack()
      }
    } catch (err) {
      console.error('Failed to delete agency:', err)
      alert(t('agencyDetail.error.delete'))
    } finally {
      setDeleting(false)
    }
  }

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

  const renderStatusBadge = (status) => {
    const classes = statusStyles[status] || 'bg-gray-100 text-gray-700'
    const label =
      status === 'in_progress'
        ? t('common.status.in_progress', 'In Progress')
        : t(`common.status.${status}`, status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' '))

    return (
      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${classes}`}>
        {label}
      </span>
    )
  }

  const formatPercent = (value) => {
    if (value === null || value === undefined) return '—'
    const formatted = formatNumber(Number(value), { minimumFractionDigits: 1, maximumFractionDigits: 1 })
    return t('agencyDetail.commissionValue', { value: formatted })
  }

  const formatLongDate = (value) =>
    formatDate(value, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })

  const formatDetailedDateTime = (value) =>
    formatDateTime(value, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    })

  const formatShortDate = (value) =>
    formatDate(value, {
      month: 'short',
      day: 'numeric',
    })

  const getOrderTypeLabel = (type) => {
    const key = `agencyDetail.orders.type.${type || 'other'}`
    return t(key, { defaultValue: type || 'order' })
  }

  const formatDateRange = (start, end) => {
    if (!start && !end) return '—'
    const startDate = start ? formatShortDate(start) : null
    const endDate = end ? formatShortDate(end) : null
    if (startDate && endDate) {
      return `${startDate} → ${endDate}`
    }

    if (startDate) return startDate
    if (endDate) return endDate
    return '—'
  }

  if (loading) {
    return (
      <div className="px-4 py-6 sm:p-6 lg:p-8">
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <div className="text-gray-600">{t('common.loading')}</div>
        </div>
      </div>
    )
  }

  if (error || !agency) {
    return (
      <div className="px-4 py-6 sm:p-6 lg:p-8">
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <div className="text-red-600">{error || t('agencyDetail.notFound')}</div>
          {onBack && (
            <button
              onClick={onBack}
              className="mt-4 rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
            >
              {t('agencyDetail.back')}
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="px-4 py-6 sm:p-6 lg:p-8">
      <div className="rounded-xl bg-white p-4 sm:p-6 shadow-sm">
        <div className="mb-6 pb-6 border-b border-gray-200">
          <button
            onClick={onBack}
            className="mb-2 flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            {t('agencyDetail.back')}
          </button>
          <h1 className="text-3xl font-bold text-gray-900">{agency.name}</h1>
          <p className="text-gray-500 text-sm mt-1">{t('agencyDetail.description')}</p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          <div className="xl:col-span-3 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="rounded-lg border border-gray-200 bg-gradient-to-br from-indigo-50 to-indigo-100 p-4">
                <div className="text-sm font-medium text-indigo-700 mb-1">{t('agencyDetail.summary.customers')}</div>
                <div className="text-2xl font-bold text-indigo-900">{summary.totalCustomers}</div>
              </div>
              <div className="rounded-lg border border-gray-200 bg-gradient-to-br from-emerald-50 to-emerald-100 p-4">
                <div className="text-sm font-medium text-emerald-700 mb-1">{t('agencyDetail.summary.orders')}</div>
                <div className="text-2xl font-bold text-emerald-900">{summary.totalOrders}</div>
              </div>
              <div className="rounded-lg border border-gray-200 bg-gradient-to-br from-yellow-50 to-yellow-100 p-4">
                <div className="text-sm font-medium text-yellow-700 mb-1">{t('agencyDetail.summary.active')}</div>
                <div className="text-2xl font-bold text-yellow-900">{summary.activeOrders}</div>
              </div>
              <div className="rounded-lg border border-gray-200 bg-gradient-to-br from-purple-50 to-purple-100 p-4">
                <div className="text-sm font-medium text-purple-700 mb-1">{t('agencyDetail.summary.commission')}</div>
                <div className="text-2xl font-bold text-purple-900">{formatCurrency(summary.commissionPaid)}</div>
              </div>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">{t('agencyDetail.customers.title')}</h2>
                <p className="text-sm text-gray-500">
                  {t('agencyDetail.customers.count', { count: customers.length })}
                </p>
              </div>
              {customers.length === 0 ? (
                <div className="text-gray-600">{t('agencyDetail.customers.empty')}</div>
              ) : (
                <>
                  <div className="hidden md:block overflow-x-auto border border-gray-200 rounded-xl">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            {t('agencyDetail.customers.table.customer')}
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            {t('agencyDetail.customers.table.contact')}
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            {t('agencyDetail.customers.table.country')}
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            {t('agencyDetail.customers.table.orders')}
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            {t('agencyDetail.customers.table.lastBooking')}
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-100">
                        {customers.map((customer) => (
                          <tr key={customer.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm text-gray-900 font-medium">{customer.fullname || '—'}</td>
                            <td className="px-4 py-3 text-sm text-gray-600">{customer.email || customer.phone || '—'}</td>
                            <td className="px-4 py-3 text-sm text-gray-600">{customer.country || '—'}</td>
                            <td className="px-4 py-3 text-sm text-gray-600">{customer.order_count}</td>
                            <td className="px-4 py-3 text-sm text-gray-600">
                              {customer.last_order_at ? formatLongDate(customer.last_order_at) : '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="md:hidden space-y-3">
                    {customers.map((customer) => (
                      <div key={customer.id} className="rounded-lg border border-gray-200 p-4">
                        <p className="text-sm font-semibold text-gray-900">{customer.fullname || '—'}</p>
                        <p className="text-sm text-gray-500">{customer.email || customer.phone || '—'}</p>
                        <dl className="mt-3 grid grid-cols-2 gap-3 text-xs text-gray-500">
                          <div>
                            <dt className="uppercase">{t('agencyDetail.customers.table.country')}</dt>
                            <dd className="text-gray-900 text-sm">{customer.country || '—'}</dd>
                          </div>
                          <div>
                            <dt className="uppercase">{t('agencyDetail.customers.table.orders')}</dt>
                            <dd className="text-gray-900 text-sm">{customer.order_count}</dd>
                          </div>
                          <div className="col-span-2">
                            <dt className="uppercase">{t('agencyDetail.customers.table.lastBooking')}</dt>
                            <dd className="text-gray-900 text-sm">
                              {customer.last_order_at ? formatLongDate(customer.last_order_at) : '—'}
                            </dd>
                          </div>
                        </dl>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">{t('agencyDetail.orders.title')}</h2>
                <p className="text-sm text-gray-500">{t('agencyDetail.orders.count', { count: orders.length })}</p>
              </div>
              {orders.length === 0 ? (
                <div className="text-gray-600">{t('agencyDetail.orders.empty')}</div>
              ) : (
                <>
                  <div className="hidden md:block overflow-x-auto border border-gray-200 rounded-xl">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            {t('agencyDetail.orders.table.order')}
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            {t('agencyDetail.orders.table.customer')}
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            {t('agencyDetail.orders.table.service')}
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            {t('agencyDetail.orders.table.window')}
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            {t('agencyDetail.orders.table.status')}
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-100">
                        {orders.map((order) => (
                          <tr key={order.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm text-gray-900 font-medium">
                              #{order.id}{' '}
                              <span className="text-xs uppercase text-gray-400">
                                · {getOrderTypeLabel(order.order_type)}
                              </span>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600">{order.customer_name || '—'}</td>
                            <td className="px-4 py-3 text-sm text-gray-600">{order.service_name || '—'}</td>
                            <td className="px-4 py-3 text-sm text-gray-600">
                              {formatDateRange(order.starting, order.ending)}
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-600">{renderStatusBadge(order.status)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="md:hidden space-y-3">
                    {orders.map((order) => (
                      <div key={order.id} className="rounded-lg border border-gray-200 p-4">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-semibold text-gray-900">#{order.id}</p>
                          {renderStatusBadge(order.status)}
                        </div>
                        <p className="text-sm text-gray-500 mt-1">{order.customer_name || '—'}</p>
                        <p className="text-sm text-gray-500">
                          {order.service_name || '—'} · {getOrderTypeLabel(order.order_type)}
                        </p>
                        <p className="text-xs text-gray-400 mt-2">{formatDateRange(order.starting, order.ending)}</p>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">{t('agencyDetail.transactions.title')}</h2>
                <p className="text-sm text-gray-500">
                  {t('agencyDetail.transactions.count', { count: transactions.length })}
                </p>
              </div>
              {transactions.length === 0 ? (
                <div className="text-gray-600">{t('agencyDetail.transactions.empty')}</div>
              ) : (
                <div className="space-y-3">
                  <div className="hidden md:block overflow-x-auto border border-gray-200 rounded-xl">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            {t('agencyDetail.transactions.table.date')}
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            {t('agencyDetail.transactions.table.type')}
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            {t('agencyDetail.transactions.table.method')}
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            {t('agencyDetail.transactions.table.amount')}
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-100">
                        {transactions.map((txn) => (
                          <tr key={txn.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm text-gray-600">{formatDetailedDateTime(txn.occurred_at)}</td>
                            <td className="px-4 py-3 text-sm text-gray-600">{txn.type_label}</td>
                            <td className="px-4 py-3 text-sm text-gray-600">{txn.payment_method || '—'}</td>
                            <td
                              className={`px-4 py-3 text-sm font-semibold ${
                                txn.direction === 'income'
                                  ? 'text-emerald-600'
                                  : txn.direction === 'expense'
                                  ? 'text-rose-600'
                                  : 'text-gray-900'
                              }`}
                            >
                              {txn.direction === 'expense' ? '-' : '+'}
                              {formatCurrency(Math.abs(txn.amount))}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="md:hidden space-y-3">
                    {transactions.map((txn) => (
                      <div key={txn.id} className="rounded-lg border border-gray-200 p-4">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-semibold text-gray-900">{txn.type_label}</p>
                          <span
                            className={`text-sm font-semibold ${
                              txn.direction === 'income'
                                ? 'text-emerald-600'
                                : txn.direction === 'expense'
                                ? 'text-rose-600'
                                : 'text-gray-900'
                            }`}
                          >
                            {txn.direction === 'expense' ? '-' : '+'}
                            {formatCurrency(Math.abs(txn.amount))}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">{formatDetailedDateTime(txn.occurred_at)}</p>
                        <p className="text-xs text-gray-500">{txn.payment_method || '—'}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="xl:col-span-1">
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-5 shadow-sm sticky top-6 space-y-6">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">{t('agencyDetail.info.title')}</h2>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onEdit?.(agency)}
                      disabled={!canModify(user)}
                      className="inline-flex items-center justify-center p-2 rounded-lg border border-gray-300 bg-white text-gray-700 shadow-sm hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white"
                      title={t('agencyDetail.actions.edit')}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536M16.732 3.732a2.5 2.5 0 113.536 3.536L7.5 20.036H4v-3.572L16.732 3.732z" />
                      </svg>
                    </button>
                    <button
                      onClick={handleDelete}
                      disabled={deleting || !canModify(user)}
                      className="inline-flex items-center justify-center p-2 rounded-lg border border-red-300 bg-white text-red-700 shadow-sm hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white"
                      title={t('agencyDetail.actions.delete')}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
                <dl className="space-y-4 text-sm">
                  <div>
                    <dt className="text-xs font-medium text-gray-500 uppercase">{t('agencyDetail.info.phone')}</dt>
                    <dd className="mt-1 text-gray-900">{agency.phone || '—'}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-gray-500 uppercase">{t('agencyDetail.info.email')}</dt>
                    <dd className="mt-1 text-gray-900">{agency.email || '—'}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-gray-500 uppercase">{t('agencyDetail.info.commission')}</dt>
                    <dd className="mt-1 text-gray-900">{formatPercent(agency.commission)}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-gray-500 uppercase">{t('agencyDetail.info.note')}</dt>
                    <dd className="mt-1 text-gray-900 whitespace-pre-wrap">{agency.note || '—'}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-gray-500 uppercase">{t('agencyDetail.info.created')}</dt>
                    <dd className="mt-1 text-gray-900">{formatDetailedDateTime(agency.created_at)}</dd>
                  </div>
                  {agency.updated_at && (
                    <div>
                      <dt className="text-xs font-medium text-gray-500 uppercase">{t('agencyDetail.info.updated')}</dt>
                      <dd className="mt-1 text-gray-900">{formatDetailedDateTime(agency.updated_at)}</dd>
                    </div>
                  )}
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AgencyDetail


