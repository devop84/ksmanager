import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useSettings } from '../context/SettingsContext'

const languages = [
  { value: 'en-US', label: 'English (US)' },
  { value: 'pt-BR', label: 'Português (Brasil)' },
]

const currencies = [
  { value: 'USD', label: 'USD • US Dollar' },
  { value: 'EUR', label: 'EUR • Euro' },
  { value: 'BRL', label: 'BRL • Real Brasileiro' },
]

function Settings() {
  const { language, currency, timezone, setLanguage, setCurrency, setTimezone, formatCurrency, formatDateTime } =
    useSettings()
  const { t } = useTranslation()

  const timezoneOptions = useMemo(() => {
    try {
      return typeof Intl.supportedValuesOf === 'function'
        ? Intl.supportedValuesOf('timeZone')
        : ['UTC', 'America/New_York', 'America/Sao_Paulo', 'Europe/Lisbon']
    } catch {
      return ['UTC', 'America/New_York', 'America/Sao_Paulo', 'Europe/Lisbon']
    }
  }, [])

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
            <label className="block text-sm font-medium text-gray-700 mb-2">{t('settings.currency')}</label>
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
    </div>
  )
}

export default Settings

