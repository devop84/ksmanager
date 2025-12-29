import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSettings } from '../context/SettingsContext'
import { isAdmin } from '../lib/permissions'
import Users from './users/Users'
import UserForm from './users/UserForm'
import TransactionTypes from './settings/TransactionTypes'
import TransactionTypeForm from './settings/TransactionTypeForm'

const languages = [
  { value: 'en-US', label: 'English (US)' },
  { value: 'pt-BR', label: 'Português (Brasil)' },
]

const currencies = [
  { value: 'USD', label: 'USD • US Dollar' },
  { value: 'EUR', label: 'EUR • Euro' },
  { value: 'BRL', label: 'BRL • Real Brasileiro' },
]

function Settings({ user = null, onUserFormSaved = () => {}, onUserFormCancel = () => {}, usersRefreshKey = 0, userFormUser = null }) {
  const { language, currency, timezone, setLanguage, setCurrency, setTimezone, formatCurrency, formatDateTime } =
    useSettings()
  const { t } = useTranslation()
  const [showUserForm, setShowUserForm] = useState(false)
  const [editingUser, setEditingUser] = useState(null)
  const [showTransactionTypeForm, setShowTransactionTypeForm] = useState(false)
  const [editingTransactionType, setEditingTransactionType] = useState(null)
  const [transactionTypesRefreshKey, setTransactionTypesRefreshKey] = useState(0)

  const timezoneOptions = useMemo(() => {
    try {
      return typeof Intl.supportedValuesOf === 'function'
        ? Intl.supportedValuesOf('timeZone')
        : ['UTC', 'America/New_York', 'America/Sao_Paulo', 'Europe/Lisbon']
    } catch {
      return ['UTC', 'America/New_York', 'America/Sao_Paulo', 'Europe/Lisbon']
    }
  }, [])

  // Handle user form open/edit
  const handleAddUser = () => {
    setEditingUser(null)
    setShowUserForm(true)
    onUserFormCancel()
  }

  const handleEditUser = (userToEdit) => {
    setEditingUser(userToEdit)
    setShowUserForm(true)
    onUserFormCancel()
  }

  const handleUserFormSaved = () => {
    setShowUserForm(false)
    setEditingUser(null)
    onUserFormSaved()
  }

  const handleUserFormCancel = () => {
    setShowUserForm(false)
    setEditingUser(null)
    onUserFormCancel()
  }

  // Handle transaction type form
  const handleAddTransactionType = () => {
    setEditingTransactionType(null)
    setShowTransactionTypeForm(true)
  }

  const handleEditTransactionType = (typeToEdit) => {
    setEditingTransactionType(typeToEdit)
    setShowTransactionTypeForm(true)
  }

  const handleTransactionTypeFormSaved = () => {
    setShowTransactionTypeForm(false)
    setEditingTransactionType(null)
    setTransactionTypesRefreshKey((prev) => prev + 1)
  }

  const handleTransactionTypeFormCancel = () => {
    setShowTransactionTypeForm(false)
    setEditingTransactionType(null)
  }

  // Show user form if requested via props or internal state
  const currentUserToEdit = userFormUser || editingUser
  const shouldShowUserForm = showUserForm || Boolean(userFormUser)

  // If user form should be shown, render it
  if (shouldShowUserForm) {
    return <UserForm user={currentUserToEdit} onCancel={handleUserFormCancel} onSaved={handleUserFormSaved} />
  }

  // If transaction type form should be shown, render it
  if (showTransactionTypeForm) {
    return <TransactionTypeForm type={editingTransactionType} onCancel={handleTransactionTypeFormCancel} onSaved={handleTransactionTypeFormSaved} />
  }

  return (
    <div className="px-4 py-6 sm:p-6 lg:p-8 space-y-6">
      <header className="bg-white rounded-xl p-6 shadow-sm">
        <h1 className="text-3xl font-bold text-gray-900">{t('settings.title', 'Settings')}</h1>
        <p className="mt-2 text-sm text-gray-500">{t('settings.description')}</p>
      </header>

      <section className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4 bg-white rounded-xl p-6 shadow-sm">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{t('settings.language')}</label>
            <select
              value={language}
              onChange={(event) => setLanguage(event.target.value)}
              className="w-full rounded-lg border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
            >
              {languages.map((lang) => (
                <option key={lang.value} value={lang.value}>
                  {lang.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {t('settings.currency')}
              <span className="ml-2 text-xs text-gray-500 font-normal">(Global)</span>
            </label>
            <select
              value={currency}
              onChange={(event) => setCurrency(event.target.value)}
              className="w-full rounded-lg border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
            >
              {currencies.map((cur) => (
                <option key={cur.value} value={cur.value}>
                  {cur.label}
                </option>
              ))}
            </select>
            <p className="mt-1 text-xs text-gray-500">
              {t('settings.currency.description', 'Currency setting applies to all users')}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">{t('settings.timezone')}</label>
            <select
              value={timezone}
              onChange={(event) => setTimezone(event.target.value)}
              className="w-full rounded-lg border-gray-300 focus:border-indigo-500 focus:ring-indigo-500"
            >
              {timezoneOptions.map((zone) => (
                <option key={zone} value={zone}>
                  {zone}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 shadow-sm space-y-4">
          <h2 className="text-xl font-semibold text-gray-900">{t('settings.preview')}</h2>
          <div className="rounded-lg border border-dashed border-gray-200 p-4 space-y-2 text-gray-700">
            <p>{formatCurrency(12345.67)}</p>
            <p>{formatDateTime(new Date())}</p>
            <p className="text-sm text-gray-500">{t('settings.updated')}</p>
          </div>
        </div>
      </section>

      {/* User Management Section - Admin Only */}
      {isAdmin(user) && (
        <Users
          onAddUser={handleAddUser}
          onEditUser={handleEditUser}
          refreshKey={usersRefreshKey}
          user={user}
        />
      )}

      {/* Transaction Types Management Section - Admin Only */}
      {isAdmin(user) && (
        <TransactionTypes
          onAddType={handleAddTransactionType}
          onEditType={handleEditTransactionType}
          refreshKey={transactionTypesRefreshKey}
          user={user}
        />
      )}
    </div>
  )
}

export default Settings

