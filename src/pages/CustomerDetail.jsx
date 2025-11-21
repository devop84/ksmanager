import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import sql from '../lib/neon'
import { canModify } from '../lib/permissions'
import { useSettings } from '../context/SettingsContext'

function CustomerDetail({ customerId, onEdit, onDelete, onBack, onAddTransaction = () => {}, user = null }) {
  const { t } = useTranslation()
  const { formatCurrency, formatDate, formatDateTime } = useSettings()
  const [customer, setCustomer] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [deleting, setDeleting] = useState(false)

  // Load customer data
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
            c.country,
            c.created_at,
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
  }, [customerId, t])



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
      <div className="rounded-xl bg-white shadow-sm">
        {/* Header */}
        <div className="p-6">
          <button
            onClick={onBack}
            className="mb-6 flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            {t('customerDetail.back')}
          </button>
          
          <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6">
            <div className="flex-1">
              <h1 className="text-3xl font-bold text-gray-900 mb-6">{customer.fullname || t('customers.title')}</h1>
            </div>

            {/* Customer Info Card - Top Right */}
            <div className="w-full md:w-80">
              <div className="rounded-xl border border-gray-200 bg-gray-50 p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">{t('customerDetail.info.title')}</h2>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onEdit?.(customer)}
                    disabled={!canModify(user)}
                      className="inline-flex items-center justify-center p-2 rounded-lg border border-gray-300 bg-white text-gray-700 shadow-sm hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title={t('customerDetail.actions.edit')}
                  >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536M16.732 3.732a2.5 2.5 0 113.536 3.536L7.5 20.036H4v-3.572L16.732 3.732z" />
                    </svg>
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={deleting || !canModify(user)}
                      className="inline-flex items-center justify-center p-2 rounded-lg border border-red-300 bg-white text-red-700 shadow-sm hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    title={t('customerDetail.actions.delete')}
                  >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
              
              <dl className="space-y-4">
                <div>
                  <dt className="text-xs font-medium text-gray-500 uppercase">{t('customerDetail.info.fullname')}</dt>
                  <dd className="mt-1 text-sm text-gray-900">{customer.fullname || '—'}</dd>
                </div>
                  {customer.phone && (
                <div>
                  <dt className="text-xs font-medium text-gray-500 uppercase">{t('customerDetail.info.phone')}</dt>
                      <dd className="mt-1 text-sm text-gray-900">{customer.phone}</dd>
                </div>
                  )}
                  {customer.email && (
                <div>
                  <dt className="text-xs font-medium text-gray-500 uppercase">{t('customerDetail.info.email')}</dt>
                      <dd className="mt-1 text-sm text-gray-900 break-all">{customer.email}</dd>
                </div>
                  )}
                  {customer.country && (
                <div>
                  <dt className="text-xs font-medium text-gray-500 uppercase">{t('customerDetail.info.country')}</dt>
                      <dd className="mt-1 text-sm text-gray-900">{customer.country}</dd>
                </div>
                  )}
                  {customer.hotel_name && (
                <div>
                  <dt className="text-xs font-medium text-gray-500 uppercase">{t('customerDetail.info.hotel')}</dt>
                      <dd className="mt-1 text-sm text-gray-900">{customer.hotel_name}</dd>
                </div>
                  )}
                  {customer.agency_name && (
                <div>
                  <dt className="text-xs font-medium text-gray-500 uppercase">{t('customerDetail.info.agency')}</dt>
                      <dd className="mt-1 text-sm text-gray-900">{customer.agency_name}</dd>
                </div>
                  )}
                  {customer.birthdate && (
                    <div>
                      <dt className="text-xs font-medium text-gray-500 uppercase">{t('customerDetail.info.birthdate')}</dt>
                      <dd className="mt-1 text-sm text-gray-900">{formatDate(customer.birthdate)}</dd>
                    </div>
                  )}
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
              </dl>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CustomerDetail
