import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import sql from '../../lib/neon'
import { canModify } from '../../lib/permissions'
import { useSettings } from '../../context/SettingsContext'
import { useDataTable } from '../../hooks/useDataTable'
import DataTable from '../../components/ui/DataTable'
import PageHeader from '../../components/layout/PageHeader'
import SearchBar from '../../components/ui/SearchBar'
import MobileCardView from '../../components/ui/MobileCardView'
import CustomersOverview from '../../components/ui/CustomersOverview'

function Customers({ onAddCustomer = () => {}, onEditCustomer = () => {}, onViewCustomer = () => {}, refreshKey = 0, user = null }) {
  const [customers, setCustomers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [deletingId, setDeletingId] = useState(null)
  const { formatDate } = useSettings()
  const { t } = useTranslation()

  const columns = useMemo(
    () => [
      { key: 'fullname', label: t('customers.table.fullname', 'Full Name') },
      { key: 'phone', label: t('customers.table.phone', 'Phone') },
      { key: 'email', label: t('customers.table.email', 'Email') },
      { key: 'doc', label: t('customers.table.document', 'Document') },
      { key: 'country', label: t('customers.table.country', 'Country') },
      { key: 'birthdate', label: t('customers.table.birthdate', 'Birthdate') },
      { key: 'hotel_name', label: t('customers.table.hotel', 'Hotel') },
      { key: 'agency_name', label: t('customers.table.agency', 'Agency') },
      { key: 'note', label: t('customers.table.note', 'Note') },
    ],
    [t],
  )

  useEffect(() => {
    const fetchCustomers = async () => {
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
            h.name AS hotel_name,
            a.name AS agency_name
          FROM customers c
          LEFT JOIN hotels h ON c.hotel_id = h.id
          LEFT JOIN agencies a ON c.agency_id = a.id
          ORDER BY fullname ASC
        `
        setCustomers(result || [])
        setTableData(result || [])
      } catch (err) {
        console.error('Failed to load customers:', err)
        setError(t('customers.error.load', 'Unable to load customers. Please try again later.'))
      } finally {
        setLoading(false)
      }
    }

    fetchCustomers()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshKey, t])

  const {
    data: tableData,
    setData: setTableData,
    searchTerm,
    sortConfig,
    filteredData,
    handleSort,
    handleSearchChange
  } = useDataTable(customers, {
    defaultSortKey: 'fullname',
    defaultSortDirection: 'asc'
  })

  const handleDelete = async (customerId) => {
    if (!window.confirm(t('customers.confirm.delete', 'Are you sure you want to delete this customer?'))) return
    try {
      setDeletingId(customerId)
      await sql`DELETE FROM customers WHERE id = ${customerId}`
      setCustomers((prev) => prev.filter((customer) => customer.id !== customerId))
      setTableData((prev) => prev.filter((customer) => customer.id !== customerId))
    } catch (err) {
      console.error('Failed to delete customer:', err)
      alert(t('customers.error.delete', 'Unable to delete customer. Please try again.'))
    } finally {
      setDeletingId(null)
    }
  }

  const formatBirthdate = (value) => {
    if (!value) return '—'
    return formatDate(value, {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })
  }

  const renderCell = (key, row) => {
    if (!row) return '—'
    
    switch (key) {
      case 'birthdate':
        return formatBirthdate(row.birthdate)
      default:
        return row[key] ?? '—'
    }
  }

  return (
    <div className="px-4 py-6 sm:p-6 lg:p-8">
      <div className="flex flex-col gap-6 bg-white rounded-xl shadow-sm p-4 sm:p-6">
        <PageHeader
          title={t('customers.title', 'Customers')}
          description={t('customers.description', 'Manage customer records with quick search, sorting, and pagination controls.')}
          onAdd={onAddCustomer}
          addLabel={t('customers.add', 'Add customer')}
          user={user}
          canModifyFn={canModify}
        />

        <CustomersOverview customers={customers} />

        <div className="flex flex-col gap-4">
          <SearchBar
              value={searchTerm}
              onChange={handleSearchChange}
            placeholder={t('customers.search', 'Search all columns...')}
            />

          {loading && <div className="text-gray-600 text-sm">{t('customers.loading', 'Loading customers...')}</div>}
          {error && <div className="text-red-600 text-sm">{error}</div>}
          
          {!loading && !error && (
            <>
              {/* Desktop Table View */}
              <div className="hidden md:block">
                <DataTable
                  columns={columns}
                  data={filteredData}
                  sortConfig={sortConfig}
                  onSort={handleSort}
                  onRowClick={onViewCustomer}
                  renderCell={renderCell}
                  emptyMessage={t('customers.empty', 'No customers found. Try adjusting your search or filters.')}
                />
              </div>

              {/* Mobile Card View */}
              <MobileCardView
                data={filteredData}
                emptyMessage={t('customers.empty', 'No customers found. Try adjusting your search or filters.')}
                onItemClick={onViewCustomer}
                renderCard={(customer) => (
                  <>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-base font-semibold text-gray-900">{customer.fullname || '—'}</p>
                          <p className="text-sm text-gray-500">{customer.email || customer.phone || '—'}</p>
                        </div>
                        <span className="inline-flex items-center rounded-full bg-indigo-100 px-2.5 py-0.5 text-xs font-medium text-indigo-800">
                          {customer.agency_name || t('common.direct', 'Direct')}
                        </span>
                      </div>
                      <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 text-sm text-gray-600">
                        <div>
                          <dt className="text-gray-400 text-xs uppercase">
                            {t('customers.mobile.phone', 'Phone')}
                          </dt>
                          <dd>{customer.phone || '—'}</dd>
                        </div>
                        <div>
                          <dt className="text-gray-400 text-xs uppercase">
                            {t('customers.mobile.document', 'Document')}
                          </dt>
                          <dd>{customer.doc || '—'}</dd>
                        </div>
                        <div>
                          <dt className="text-gray-400 text-xs uppercase">{t('customers.mobile.country', 'Country')}</dt>
                          <dd>{customer.country || '—'}</dd>
                        </div>
                        <div>
                          <dt className="text-gray-400 text-xs uppercase">
                            {t('customers.mobile.birthdate', 'Birthdate')}
                          </dt>
                          <dd>{formatBirthdate(customer.birthdate)}</dd>
                        </div>
                        <div>
                          <dt className="text-gray-400 text-xs uppercase">{t('customers.mobile.hotel', 'Hotel')}</dt>
                          <dd>{customer.hotel_name || '—'}</dd>
                        </div>
                        <div>
                          <dt className="text-gray-400 text-xs uppercase">{t('customers.mobile.agency', 'Agency')}</dt>
                          <dd>{customer.agency_name || '—'}</dd>
                        </div>
                        <div className="md:col-span-2">
                          <dt className="text-gray-400 text-xs uppercase">{t('customers.mobile.note', 'Note')}</dt>
                          <dd>{customer.note || '—'}</dd>
                        </div>
                      </dl>
                  </>
                )}
              />
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default Customers

