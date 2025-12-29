import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import sql from '../../lib/neon'
import { canModify } from '../../lib/permissions'
import { useDataTable } from '../../hooks/useDataTable'
import DataTable from '../../components/ui/DataTable'
import PageHeader from '../../components/layout/PageHeader'
import SearchBar from '../../components/ui/SearchBar'
import MobileCardView from '../../components/ui/MobileCardView'
import HotelsOverview from '../../components/ui/HotelsOverview'

function Hotels({ onAddHotel = () => {}, onEditHotel = () => {}, onViewHotel = () => {}, refreshKey = 0, user = null }) {
  const [hotels, setHotels] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [deletingId, setDeletingId] = useState(null)
  const { t } = useTranslation()

  const columns = useMemo(
    () => [
      { key: 'name', label: t('hotels.table.name', 'Name') },
      { key: 'phone', label: t('hotels.table.phone', 'Phone') },
      { key: 'address', label: t('hotels.table.address', 'Address') },
    ],
    [t],
  )

  const {
    data: tableData,
    setData: setTableData,
    searchTerm,
    sortConfig,
    filteredData,
    handleSort,
    handleSearchChange
  } = useDataTable(hotels, {
    defaultSortKey: 'name'
  })

  useEffect(() => {
    const fetchHotels = async () => {
      try {
        setLoading(true)
        setError(null)
        const result = await sql`
          SELECT id, name, phone, address, note
          FROM hotels
          ORDER BY name ASC
        `
        setHotels(result || [])
        setTableData(result || [])
      } catch (err) {
        console.error('Failed to load hotels:', err)
        setError(t('hotels.error.load', 'Unable to load hotels. Please try again later.'))
      } finally {
        setLoading(false)
      }
    }

    fetchHotels()
  }, [refreshKey, t, setTableData])

  const handleDelete = async (hotel) => {
    if (!window.confirm(t('hotels.confirm.delete', 'Are you sure you want to delete this hotel?'))) return
    try {
      setDeletingId(hotel.id)
      await sql`DELETE FROM hotels WHERE id = ${hotel.id}`
      setHotels(prev => prev.filter(h => h.id !== hotel.id))
      setTableData(prev => prev.filter(h => h.id !== hotel.id))
    } catch (err) {
      console.error('Failed to delete hotel:', err)
      alert(t('hotels.error.delete', 'Unable to delete hotel. Please try again.'))
    } finally {
      setDeletingId(null)
    }
  }

  return (
    <div className="px-4 py-6 sm:p-6 lg:p-8">
      <div className="flex flex-col gap-6 bg-white rounded-xl shadow-sm p-4 sm:p-6">
        <PageHeader
          title={t('hotels.title', 'Hotels')}
          description={t('hotels.description', 'Manage hotel partners, contacts, and logistics.')}
          onAdd={onAddHotel}
          addLabel={t('hotels.add', 'Add hotel')}
          user={user}
          canModifyFn={canModify}
        />

        <HotelsOverview hotels={hotels} />

        <div className="flex flex-col gap-4">
          <SearchBar
            value={searchTerm}
            onChange={handleSearchChange}
            placeholder={t('hotels.search', 'Search all columns...')}
          />

          {loading && <div className="text-gray-600 text-sm">{t('hotels.loading', 'Loading hotels...')}</div>}
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
                  onRowClick={onViewHotel}
                  emptyMessage={t('hotels.empty', 'No hotels found. Try adjusting your search or filters.')}
                />
              </div>

              {/* Mobile Card View */}
              <MobileCardView
                data={filteredData}
                emptyMessage={t('hotels.empty', 'No hotels found. Try adjusting your search or filters.')}
                onItemClick={onViewHotel}
                renderCard={(hotel) => (
                  <>
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-base font-semibold text-gray-900">{hotel.name || '—'}</p>
                        <p className="text-sm text-gray-500">{hotel.phone || '—'}</p>
                      </div>
                    </div>
                    <dl className="mt-4 space-y-2 text-sm text-gray-600">
                      <div>
                        <dt className="text-gray-400 text-xs uppercase">
                          {t('hotels.mobile.address', 'Address')}
                        </dt>
                        <dd>{hotel.address || '—'}</dd>
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

export default Hotels

