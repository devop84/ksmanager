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

function EquipmentDetail({ equipmentId, onBack, onEdit, onDelete, user = null }) {
  const [equipment, setEquipment] = useState(null)
  const [rentals, setRentals] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const { t } = useTranslation()
  const { formatDate, formatDateTime } = useSettings()

  useEffect(() => {
    if (!equipmentId) return

    const fetchData = async () => {
      try {
        setLoading(true)
        setError(null)

        const [equipmentRows, rentalRows] = await Promise.all([
          sql`
            SELECT
              e.id,
              e.name,
              e.description,
              e.category_id,
              ec.name AS category_name,
              e.created_at,
              e.updated_at
            FROM equipment e
            LEFT JOIN equipment_categories ec ON ec.id = e.category_id
            WHERE e.id = ${equipmentId}
            LIMIT 1
          `,
          sql`
            SELECT
              o.id AS order_id,
              o.customer_id,
              c.fullname AS customer_name,
              o.cancelled,
              o.created_at,
              s.name AS service_name,
              orent.starting,
              orent.ending,
              orent.hourly,
              orent.daily,
              orent.weekly,
              orent.note AS rental_note
            FROM orders_rentals orent
            JOIN orders o ON o.id = orent.order_id
            JOIN customers c ON c.id = o.customer_id
            JOIN services s ON s.id = o.service_id
            WHERE orent.equipment_id = ${equipmentId}
            ORDER BY o.created_at DESC
            LIMIT 50
          `
        ])

        if (!equipmentRows?.length) {
          setError(t('equipmentDetail.notFound'))
          setEquipment(null)
          setRentals([])
          return
        }

        setEquipment(equipmentRows[0])
        setRentals(rentalRows || [])
      } catch (err) {
        console.error('Failed to load equipment details:', err)
        setError(t('equipmentDetail.error.load'))
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [equipmentId, t])

  const determineStatus = (rental) => {
    if (rental.cancelled) return 'cancelled'
    const now = new Date()
    const start = rental.starting ? new Date(rental.starting) : null
    const end = rental.ending ? new Date(rental.ending) : null
    if (!start || !end) return 'pending'
    if (now < start) return 'pending'
    if (now >= start && now <= end) return 'in_progress'
    if (now > end) return 'completed'
    return 'pending'
  }

  const summary = useMemo(() => {
    const totalRentals = rentals.length
    const activeRentals = rentals.filter((rental) => {
      const status = determineStatus(rental)
      return status === 'pending' || status === 'in_progress'
    }).length
    const uniqueCustomers = new Set(rentals.map((rental) => rental.customer_id)).size
    const lastRental = rentals.length ? rentals[0].created_at : null

    return {
      totalRentals,
      activeRentals,
      uniqueCustomers,
      lastRental
    }
  }, [rentals])

  const handleDelete = async () => {
    if (!window.confirm(t('equipmentDetail.confirm.delete'))) {
      return
    }
    try {
      setDeleting(true)
      await sql`DELETE FROM equipment WHERE id = ${equipmentId}`
      if (onDelete) {
        onDelete()
      } else if (onBack) {
        onBack()
      }
    } catch (err) {
      console.error('Failed to delete equipment:', err)
      alert(t('equipmentDetail.error.delete'))
    } finally {
      setDeleting(false)
    }
  }

  const formatDateRange = (start, end) => {
    if (!start && !end) return '—'
    const startDate = start ? new Date(start) : null
    const endDate = end ? new Date(end) : null
    const formatter = new Intl.DateTimeFormat(undefined, { month: 'short', day: 'numeric' })
    if (startDate && endDate) {
      return `${formatter.format(startDate)} → ${formatter.format(endDate)}`
    }
    if (startDate) return formatter.format(startDate)
    if (endDate) return formatter.format(endDate)
    return '—'
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

  const getBillingMode = (rental) => {
    if (rental.hourly) return t('equipmentDetail.billing.hourly')
    if (rental.daily) return t('equipmentDetail.billing.daily')
    if (rental.weekly) return t('equipmentDetail.billing.weekly')
    return '—'
  }

  if (loading) {
    return (
      <div className="px-4 py-6 sm:p-6 lg:p-8">
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <div className="text-gray-600">{t('equipmentDetail.loading')}</div>
        </div>
      </div>
    )
  }

  if (error || !equipment) {
    return (
      <div className="px-4 py-6 sm:p-6 lg:p-8">
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <div className="text-red-600">{error || t('equipmentDetail.notFound')}</div>
          {onBack && (
            <button
              onClick={onBack}
              className="mt-4 rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
            >
              {t('equipmentDetail.back')}
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
            {t('equipmentDetail.back')}
          </button>
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{equipment.name}</h1>
              <p className="text-gray-500 text-sm mt-1">
                {equipment.category_name || t('equipment.category.uncategorized')} • {t('equipmentDetail.description')}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => onEdit?.(equipment)}
                disabled={!canModify(user)}
                className="inline-flex items-center justify-center rounded-lg border border-gray-300 px-3 py-2 text-sm font-semibold text-gray-700 shadow-sm hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white"
              >
                {t('equipmentDetail.actions.edit')}
              </button>
              <button
                onClick={handleDelete}
                disabled={deleting || !canModify(user)}
                className="inline-flex items-center justify-center rounded-lg border border-red-300 px-3 py-2 text-sm font-semibold text-red-700 shadow-sm hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white"
              >
                {deleting ? t('equipmentDetail.buttons.deleting') : t('equipmentDetail.buttons.delete')}
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          <div className="xl:col-span-3 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="rounded-lg border border-indigo-100 bg-indigo-50/70 p-4">
                <p className="text-sm font-medium text-indigo-700">{t('equipmentDetail.summary.customers')}</p>
                <p className="text-2xl font-bold text-indigo-900 mt-1">{summary.uniqueCustomers}</p>
              </div>
              <div className="rounded-lg border border-emerald-100 bg-emerald-50/70 p-4">
                <p className="text-sm font-medium text-emerald-700">{t('equipmentDetail.summary.total')}</p>
                <p className="text-2xl font-bold text-emerald-900 mt-1">{summary.totalRentals}</p>
              </div>
              <div className="rounded-lg border border-yellow-100 bg-yellow-50/70 p-4">
                <p className="text-sm font-medium text-yellow-700">{t('equipmentDetail.summary.active')}</p>
                <p className="text-2xl font-bold text-yellow-900 mt-1">{summary.activeRentals}</p>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-medium text-slate-700">{t('equipmentDetail.summary.last')}</p>
                <p className="text-lg font-semibold text-slate-900 mt-1">{formatDate(summary.lastRental)}</p>
              </div>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">{t('equipmentDetail.rentals.title')}</h2>
                <p className="text-sm text-gray-500">{t('equipmentDetail.rentals.count', { count: rentals.length })}</p>
              </div>
              {rentals.length === 0 ? (
                <div className="text-gray-600">{t('equipmentDetail.rentals.empty')}</div>
              ) : (
                <>
                  <div className="hidden md:block overflow-x-auto border border-gray-200 rounded-xl">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            {t('equipmentDetail.rentals.table.order')}
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            {t('equipmentDetail.rentals.table.customer')}
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            {t('equipmentDetail.rentals.table.service')}
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            {t('equipmentDetail.rentals.table.billing')}
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            {t('equipmentDetail.rentals.table.window')}
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            {t('equipmentDetail.rentals.table.status')}
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-100">
                        {rentals.map((rental) => (
                          <tr key={rental.order_id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm text-gray-900 font-medium">#{rental.order_id}</td>
                            <td className="px-4 py-3 text-sm text-gray-700">{rental.customer_name || '—'}</td>
                            <td className="px-4 py-3 text-sm text-gray-600">{rental.service_name || '—'}</td>
                            <td className="px-4 py-3 text-sm text-gray-600">{getBillingMode(rental)}</td>
                            <td className="px-4 py-3 text-sm text-gray-600">{formatDateRange(rental.starting, rental.ending)}</td>
                            <td className="px-4 py-3 text-sm">{renderStatusBadge(determineStatus(rental))}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <div className="md:hidden space-y-3">
                    {rentals.map((rental) => (
                      <div key={rental.order_id} className="rounded-lg border border-gray-200 p-4">
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="text-sm font-semibold text-gray-900">#{rental.order_id}</p>
                            <p className="text-xs text-gray-500">{rental.customer_name || '—'}</p>
                          </div>
                          {renderStatusBadge(determineStatus(rental))}
                        </div>
                        <dl className="mt-3 grid grid-cols-2 gap-3 text-xs text-gray-500">
                          <div>
                            <dt className="uppercase">{t('equipmentDetail.rentals.table.service')}</dt>
                            <dd className="text-gray-900 text-sm">{rental.service_name || '—'}</dd>
                          </div>
                          <div>
                            <dt className="uppercase">{t('equipmentDetail.rentals.table.billing')}</dt>
                            <dd className="text-gray-900 text-sm">{getBillingMode(rental)}</dd>
                          </div>
                          <div>
                            <dt className="uppercase">{t('equipmentDetail.rentals.table.window')}</dt>
                            <dd className="text-gray-900 text-sm">{formatDateRange(rental.starting, rental.ending)}</dd>
                          </div>
                        </dl>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          <div className="xl:col-span-1">
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-5 shadow-sm sticky top-6 space-y-6">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">{t('equipmentDetail.info.title')}</h2>
                </div>
                <dl className="space-y-4 text-sm">
                  <div>
                    <dt className="text-xs font-medium text-gray-500 uppercase">{t('equipmentDetail.info.category')}</dt>
                    <dd className="mt-1 text-gray-900">{equipment.category_name || t('equipment.category.uncategorized')}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-gray-500 uppercase">{t('equipmentDetail.info.description')}</dt>
                    <dd className="mt-1 text-gray-900 whitespace-pre-wrap">{equipment.description || '—'}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-gray-500 uppercase">{t('equipmentDetail.info.created')}</dt>
                    <dd className="mt-1 text-gray-900">{formatDateTime(equipment.created_at)}</dd>
                  </div>
                  {equipment.updated_at && (
                    <div>
                      <dt className="text-xs font-medium text-gray-500 uppercase">{t('equipmentDetail.info.updated')}</dt>
                      <dd className="mt-1 text-gray-900">{formatDateTime(equipment.updated_at)}</dd>
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

export default EquipmentDetail

