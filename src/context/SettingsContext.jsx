import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import i18n from '../i18n/config'

const STORAGE_KEY = 'ksmanager_settings'

const SettingsContext = createContext(null)

const defaultSettings = {
  language: 'en-US',
  currency: 'USD',
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
}

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        return { ...defaultSettings, ...parsed }
      }
    } catch (error) {
      console.warn('Failed to parse stored settings', error)
    }
    return defaultSettings
  })

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
  }, [settings])

  useEffect(() => {
    if (i18n.language !== settings.language) {
      i18n.changeLanguage(settings.language)
    }
  }, [settings.language])

  const contextValue = useMemo(() => {
    const { language, currency, timezone } = settings

    const getNumberFormatter = (options = {}) =>
      new Intl.NumberFormat(language, { style: 'currency', currency, ...options })
    const getDateFormatter = (options = {}) =>
      new Intl.DateTimeFormat(language, { timeZone: timezone, ...options })

    const formatValue = (value) => {
      if (value instanceof Date) {
        if (Number.isNaN(value.getTime())) return null
        return value
      }
      if (value === null || value === undefined) return null
      const parsed = new Date(value)
      if (Number.isNaN(parsed.getTime())) return null
      return parsed
    }

    return {
      language,
      currency,
      timezone,
      setLanguage: (next) => setSettings((prev) => ({ ...prev, language: next })),
      setCurrency: (next) => setSettings((prev) => ({ ...prev, currency: next })),
      setTimezone: (next) => setSettings((prev) => ({ ...prev, timezone: next })),
      formatCurrency: (value, options) => getNumberFormatter(options).format(Number(value || 0)),
      formatNumber: (value, options) => new Intl.NumberFormat(language, options).format(Number(value || 0)),
      formatDate: (value, options) => {
        const date = formatValue(value)
        if (!date) return '—'
        return getDateFormatter({ year: 'numeric', month: 'short', day: 'numeric', ...options }).format(date)
      },
      formatDateTime: (value, options) => {
        const date = formatValue(value)
        if (!date) return '—'
        return getDateFormatter({
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          ...options,
        }).format(date)
      },
      formatTime: (value, options) => {
        const date = formatValue(value)
        if (!date) return '—'
        return getDateFormatter({
          hour: '2-digit',
          minute: '2-digit',
          ...options,
        }).format(date)
      },
    }
  }, [settings])

  return <SettingsContext.Provider value={contextValue}>{children}</SettingsContext.Provider>
}

export function useSettings() {
  const context = useContext(SettingsContext)
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider')
  }
  return context
}

