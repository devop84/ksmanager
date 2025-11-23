import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import sql from '../../lib/neon'
import { canModify } from '../../lib/permissions'
import { useDataTable } from '../../hooks/useDataTable'
import DataTable from '../../components/DataTable'
import PageHeader from '../../components/PageHeader'
import SearchBar from '../../components/SearchBar'

function Users({ onAddUser = () => {}, onEditUser = () => {}, onViewUser = () => {}, refreshKey = 0, user = null }) {
  const { t } = useTranslation()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [deletingId, setDeletingId] = useState(null)

  const columns = useMemo(
    () => [
      { key: 'name', label: t('users.table.name', 'Name') },
      { key: 'email', label: t('users.table.email', 'Email') },
      { key: 'role', label: t('users.table.role', 'Role') },
      { key: 'created_at', label: t('users.table.createdAt', 'Created At') }
    ],
    [t]
  )

  const {
    data: tableData,
    setData: setTableData,
    searchTerm,
    sortConfig,
    filteredData,
    handleSort,
    handleSearchChange
  } = useDataTable(users, {
    searchFields: ['name', 'email', 'role'],
    defaultSortKey: 'name'
  })

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        setLoading(true)
        setError(null)
        const result = await sql`
          SELECT id, name, email, role, created_at, updated_at
          FROM users
          ORDER BY name ASC
        `
        setUsers(result || [])
        setTableData(result || [])
      } catch (err) {
        console.error('Failed to load users:', err)
        setError(t('users.error.load', 'Failed to load users'))
      } finally {
        setLoading(false)
      }
    }

    fetchUsers()
  }, [refreshKey, t, setTableData])

  const handleDelete = async (userId) => {
    // Prevent deleting yourself
    if (user && userId === user.id) {
      alert(t('users.error.cannotDeleteSelf', 'You cannot delete your own account'))
      return
    }

    if (!window.confirm(t('users.confirm.delete', 'Are you sure you want to delete this user?'))) return
    
    try {
      setDeletingId(userId)
      await sql`DELETE FROM users WHERE id = ${userId}`
      setUsers((prev) => prev.filter((u) => u.id !== userId))
      setTableData((prev) => prev.filter((u) => u.id !== userId))
    } catch (err) {
      console.error('Failed to delete user:', err)
      alert(t('users.error.delete', 'Failed to delete user'))
    } finally {
      setDeletingId(null)
    }
  }

  const getRoleLabel = (role) => {
    if (!role) return '—'
    return t(`users.role.${role}`, role === 'admin' ? 'Admin' : 'View Only')
  }

  const formatDate = (dateString) => {
    if (!dateString) return '—'
    try {
      const date = new Date(dateString)
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    } catch {
      return '—'
    }
  }

  const renderCell = (key, row) => {
    switch (key) {
      case 'role':
        return getRoleLabel(row.role)
      case 'created_at':
        return formatDate(row.created_at)
      default:
        return row[key] ?? '—'
    }
  }

  const renderActions = (userRow) => {
    if (!canModify(user)) return null
    return (
      <div className="flex gap-2">
        <button
          onClick={(e) => {
            e.stopPropagation()
            onEditUser(userRow)
          }}
          className="rounded-lg border border-gray-300 px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
        >
          {t('users.actions.edit', 'Edit')}
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation()
            handleDelete(userRow.id)
          }}
          disabled={deletingId === userRow.id || (user && userRow.id === user.id)}
          className="rounded-lg border border-red-300 px-3 py-1 text-xs font-medium text-red-700 hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {deletingId === userRow.id ? t('users.actions.deleting', 'Deleting...') : t('users.actions.delete', 'Delete')}
        </button>
      </div>
    )
  }

  return (
    <div className="px-4 py-6 sm:p-6 lg:p-8">
      <div className="flex flex-col gap-6 bg-white rounded-xl shadow-sm p-4 sm:p-6">
        <PageHeader
          title={t('users.title', 'Users')}
          description={t('users.description', 'Manage user accounts and permissions')}
          onAdd={onAddUser}
          addLabel={t('users.add', 'Add User')}
          user={user}
          canModifyFn={canModify}
        />

        <div className="flex flex-col gap-4">
          <SearchBar
            value={searchTerm}
            onChange={handleSearchChange}
            placeholder={t('users.search', 'Search users...')}
          />

          {loading && <div className="text-gray-600 text-sm">{t('users.loading', 'Loading users...')}</div>}
          {error && <div className="text-red-600 text-sm">{error}</div>}
          {!loading && !error && (
            <>
              <div className="hidden md:block">
                <div className="overflow-x-auto border border-gray-200 rounded-xl">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        {columns.map((column) => {
                          const isActive = sortConfig.key === column.key
                          return (
                            <th
                              key={column.key}
                              onClick={() => handleSort(column.key)}
                              className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider cursor-pointer select-none hover:text-gray-900"
                            >
                              <div className="flex items-center gap-1">
                                {column.label}
                                {isActive && (
                                  <span className="text-gray-400">
                                    {sortConfig.direction === 'asc' ? '▲' : '▼'}
                                  </span>
                                )}
                              </div>
                            </th>
                          )
                        })}
                        {canModify(user) && (
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            {t('users.table.actions', 'Actions')}
                          </th>
                        )}
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-100">
                      {filteredData.length === 0 ? (
                        <tr>
                          <td
                            colSpan={canModify(user) ? columns.length + 1 : columns.length}
                            className="px-6 py-10 text-center text-sm text-gray-500"
                          >
                            {t('users.table.empty', 'No users found')}
                          </td>
                        </tr>
                      ) : (
                        filteredData.map((userRow) => (
                          <tr
                            key={userRow.id}
                            onClick={() => onViewUser?.(userRow)}
                            className={`${onViewUser ? 'hover:bg-gray-50 cursor-pointer' : ''}`}
                          >
                            {columns.map((column) => (
                              <td key={column.key} className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                                {renderCell(column.key, userRow)}
                              </td>
                            ))}
                            {canModify(user) && (
                              <td className="px-4 py-3 whitespace-nowrap text-sm" onClick={(e) => e.stopPropagation()}>
                                {renderActions(userRow)}
                              </td>
                            )}
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="md:hidden space-y-3">
                {filteredData.length === 0 ? (
                  <div className="rounded-lg border border-dashed border-gray-300 px-4 py-6 text-center text-sm text-gray-500">
                    {t('users.table.empty', 'No users found')}
                  </div>
                ) : (
                  filteredData.map((userRow) => (
                    <div
                      key={userRow.id}
                      className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                      onClick={() => onViewUser?.(userRow)}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-base font-semibold text-gray-900">{userRow.name || '—'}</p>
                          <p className="text-sm text-gray-500">{userRow.email || '—'}</p>
                          <p className="text-sm text-gray-500">{getRoleLabel(userRow.role)}</p>
                        </div>
                        {canModify(user) && (
                          <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                onEditUser(userRow)
                              }}
                              className="rounded-lg border border-gray-300 px-3 py-1 text-xs font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                              {t('users.actions.edit', 'Edit')}
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                handleDelete(userRow.id)
                              }}
                              disabled={deletingId === userRow.id || (user && userRow.id === user.id)}
                              className="rounded-lg border border-red-300 px-3 py-1 text-xs font-medium text-red-700 hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                              {deletingId === userRow.id ? t('users.actions.deleting', 'Deleting...') : t('users.actions.delete', 'Delete')}
                            </button>
                          </div>
                        )}
                      </div>
                      <dl className="mt-4 grid grid-cols-1 gap-2 text-sm text-gray-600">
                        <div>
                          <dt className="text-gray-400 text-xs uppercase">{t('users.mobile.createdAt', 'Created')}</dt>
                          <dd>{formatDate(userRow.created_at)}</dd>
                        </div>
                      </dl>
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default Users

