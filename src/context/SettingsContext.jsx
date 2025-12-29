import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import i18n from '../i18n/config'
import { getAppSetting, setAppSetting, updateUserLanguage, getSession } from '../lib/auth'

const STORAGE_KEY = 'ksmanager_settings'

const SettingsContext = createContext(null)

const defaultSettings = {
  language: 'en-US',
  currency: 'USD',
  timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
}

export function SettingsProvider({ children, user = null }) {
  const [settings, setSettings] = useState(() => {
    // Initialize with defaults, will be loaded from database
    return defaultSettings
  })
  const [loading, setLoading] = useState(true)
  const [currentUser, setCurrentUser] = useState(user)

  // Get user from session if not provided as prop
  useEffect(() => {
    const loadUser = async () => {
      if (user) {
        setCurrentUser(user)
        return
      }
      
      try {
        const sessionToken = localStorage.getItem('kiteManager_session')
        if (sessionToken) {
          const session = await getSession(sessionToken)
          if (session?.user) {
            setCurrentUser(session.user)
          }
        }
      } catch (error) {
        console.warn('Failed to load user from session:', error)
      }
    }
    
    loadUser()
  }, [user])

  // Load settings from database on mount and when user changes
  useEffect(() => {
    const loadSettings = async () => {
      try {
        setLoading(true)
        
        // Load currency from app_settings (global)
        const currency = await getAppSetting('currency') || defaultSettings.currency
        
        // Load language from user (per-user) or use default
        let language = defaultSettings.language
        if (currentUser?.id) {
          // Language is stored in user object from auth
          language = currentUser.language || defaultSettings.language
        } else {
          // Fallback to localStorage if no user (for backward compatibility)
          try {
            const stored = localStorage.getItem(STORAGE_KEY)
            if (stored) {
              const parsed = JSON.parse(stored)
              language = parsed.language || defaultSettings.language
            }
          } catch (error) {
            console.warn('Failed to parse stored settings', error)
          }
        }
        
        // Load timezone from localStorage (local preference)
        let timezone = defaultSettings.timezone
        try {
          const stored = localStorage.getItem(STORAGE_KEY)
          if (stored) {
            const parsed = JSON.parse(stored)
            timezone = parsed.timezone || defaultSettings.timezone
          }
        } catch (error) {
          console.warn('Failed to parse stored settings', error)
        }
        
        setSettings({ language, currency, timezone })
      } catch (error) {
        console.error('Failed to load settings:', error)
        setSettings(defaultSettings)
      } finally {
        setLoading(false)
      }
    }
    
    loadSettings()
  }, [currentUser?.id, currentUser?.language])

  // Save timezone to localStorage when it changes
  useEffect(() => {
    if (!loading) {
      try {
        const stored = localStorage.getItem(STORAGE_KEY)
        const parsed = stored ? JSON.parse(stored) : {}
        parsed.timezone = settings.timezone
        localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed))
      } catch (error) {
        console.warn('Failed to save timezone to localStorage', error)
      }
    }
  }, [settings.timezone, loading])

  // Update i18n when language changes
  useEffect(() => {
    if (!loading && i18n.language !== settings.language) {
      i18n.changeLanguage(settings.language)
    }
  }, [settings.language, loading])

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
      setLanguage: async (next) => {
        setSettings((prev) => ({ ...prev, language: next }))
        // Save to user database if user is logged in
        if (currentUser?.id) {
          try {
            await updateUserLanguage(currentUser.id, next)
            // Update currentUser state to reflect the change
            setCurrentUser((prev) => ({ ...prev, language: next }))
          } catch (error) {
            console.error('Failed to save language to database:', error)
          }
        } else {
          // Fallback to localStorage if no user
          try {
            const stored = localStorage.getItem(STORAGE_KEY)
            const parsed = stored ? JSON.parse(stored) : {}
            parsed.language = next
            localStorage.setItem(STORAGE_KEY, JSON.stringify(parsed))
          } catch (error) {
            console.warn('Failed to save language to localStorage', error)
          }
        }
      },
      setCurrency: async (next) => {
        setSettings((prev) => ({ ...prev, currency: next }))
        // Save to app_settings (global)
        try {
          await setAppSetting('currency', next)
        } catch (error) {
          console.error('Failed to save currency to database:', error)
        }
      },
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

