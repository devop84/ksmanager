import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSettings } from '../context/SettingsContext'
import FeedbackForm from '../components/FeedbackForm'

function Landing({ onNavigate, isAuthenticated = false }) {
  const { t } = useTranslation()
  const { language, setLanguage } = useSettings()
  const [showFeedback, setShowFeedback] = useState(false)
  const [showLanguageMenu, setShowLanguageMenu] = useState(false)

  const features = [
    {
      icon: '📊',
      title: t('landing.features.dashboards.title'),
      description: t('landing.features.dashboards.desc')
    },
    {
      icon: '👥',
      title: t('landing.features.customers.title'),
      description: t('landing.features.customers.desc')
    },
    {
      icon: '🏄',
      title: t('landing.features.services.title'),
      description: t('landing.features.services.desc')
    },
    {
      icon: '📅',
      title: t('landing.features.booking.title'),
      description: t('landing.features.booking.desc')
    },
    {
      icon: '💰',
      title: t('landing.features.financial.title'),
      description: t('landing.features.financial.desc')
    },
    {
      icon: '🌐',
      title: t('landing.features.multilang.title'),
      description: t('landing.features.multilang.desc')
    }
  ]

  const roadmapHighlights = [
    { phase: t('landing.roadmap.phase1'), status: t('landing.roadmap.status.inProgress'), feature: t('landing.roadmap.phase1.feature') },
    { phase: t('landing.roadmap.phase2'), status: 'Q2-Q3 2025', feature: t('landing.roadmap.phase2.feature') },
    { phase: t('landing.roadmap.phase3'), status: 'Q4 2025', feature: t('landing.roadmap.phase3.feature') },
    { phase: t('landing.roadmap.phase4'), status: '2026', feature: t('landing.roadmap.phase4.feature') }
  ]

  return (
    <div className="min-h-screen bg-white">
      {/* Navigation - Only show when not authenticated */}
      {!isAuthenticated && (
      <nav className="bg-white border-b border-gray-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <svg
                className="w-8 h-8 text-indigo-600"
                viewBox="0 0 24 24"
                fill="currentColor"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path d="M24 15v-2.3c-1.63.6-3.33.81-5 .61-2.26-.28-4.24-1.32-6.22-2.38-3.02-1.62-5.93-3.18-9.78-2.45-1.06.19-2.08.57-3 1.11v2.36c1.63-.6 3.33-.81 5-.61 2.26.28 4.24 1.32 6.22 2.38 3.02 1.61 5.93 3.18 9.78 2.44 1.06-.18 2.08-.56 3-1.12zm0-5.5V7.2c-1.63.6-3.33.82-5 .62-2.26-.29-4.24-1.33-6.22-2.39C9 3.8 6.1 2.22 2.25 2.95c-1.06.19-2.08.57-3 1.11v2.36c1.63-.6 3.33-.81 5-.61 2.26.28 4.24 1.33 6.22 2.39 3.02 1.61 5.93 3.17 9.78 2.44 1.06-.2 2.08-.58 3-1.13z" />
              </svg>
              <h1 className="text-2xl font-bold text-gray-900">KSMANAGER</h1>
            </div>
            <div className="flex items-center gap-4">
              {/* Language Selector */}
              <div className="relative">
                <button
                  onClick={() => setShowLanguageMenu(!showLanguageMenu)}
                  className="flex items-center gap-2 px-3 py-2 text-gray-700 hover:text-indigo-600 font-medium transition-colors rounded-lg hover:bg-gray-50"
                  aria-label="Select language"
                >
                  <span className="text-lg">
                    {language === 'pt-BR' ? '🇧🇷' : '🇺🇸'}
                  </span>
                  <span className="text-sm">
                    {language === 'pt-BR' ? 'PT' : 'EN'}
                  </span>
                  <svg
                    className={`w-4 h-4 transition-transform ${showLanguageMenu ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {showLanguageMenu && (
                  <>
                    {/* Backdrop */}
                    <div
                      className="fixed inset-0 z-40"
                      onClick={() => setShowLanguageMenu(false)}
                    ></div>
                    
                    {/* Dropdown Menu */}
                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                      <button
                        onClick={() => {
                          setLanguage('en-US')
                          setShowLanguageMenu(false)
                        }}
                        className={`w-full px-4 py-2 text-left flex items-center gap-3 hover:bg-gray-50 transition-colors ${
                          language === 'en-US' ? 'bg-indigo-50 text-indigo-600' : 'text-gray-700'
                        }`}
                      >
                        <span className="text-xl">🇺🇸</span>
                        <span className="font-medium">English (US)</span>
                        {language === 'en-US' && (
                          <svg className="w-4 h-4 ml-auto" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </button>
                      <button
                        onClick={() => {
                          setLanguage('pt-BR')
                          setShowLanguageMenu(false)
                        }}
                        className={`w-full px-4 py-2 text-left flex items-center gap-3 hover:bg-gray-50 transition-colors ${
                          language === 'pt-BR' ? 'bg-indigo-50 text-indigo-600' : 'text-gray-700'
                        }`}
                      >
                        <span className="text-xl">🇧🇷</span>
                        <span className="font-medium">Português (Brasil)</span>
                        {language === 'pt-BR' && (
                          <svg className="w-4 h-4 ml-auto" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        )}
                      </button>
                    </div>
                  </>
                )}
              </div>
              
              <button
                onClick={() => {
                  const feedbackSection = document.getElementById('feedback')
                  feedbackSection?.scrollIntoView({ behavior: 'smooth' })
                }}
                className="text-gray-700 hover:text-indigo-600 font-medium transition-colors"
              >
                {t('landing.nav.feedback')}
              </button>
              <button
                onClick={() => onNavigate && onNavigate('roadmap')}
                className="text-gray-700 hover:text-indigo-600 font-medium transition-colors"
              >
                {t('landing.nav.roadmap')}
              </button>
              <button
                onClick={() => onNavigate && onNavigate('login')}
                className="px-4 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors"
              >
                {t('landing.nav.login')}
              </button>
            </div>
          </div>
        </div>
      </nav>
      )}

      {/* Hero Section */}
      <section className="bg-gradient-to-br from-indigo-600 via-purple-600 to-pink-600 text-white py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full mb-6">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
              <span className="text-sm font-medium">{t('landing.hero.betaBadge')}</span>
            </div>
            <h1 className="text-5xl md:text-6xl font-bold mb-6">
              {t('landing.hero.title')}
            </h1>
            <p className="text-xl md:text-2xl text-indigo-100 mb-8 max-w-3xl mx-auto">
              {t('landing.hero.subtitle')}
            </p>
            <div className="flex items-center justify-center gap-4 flex-wrap">
              <button
                onClick={() => onNavigate && onNavigate('login')}
                className="px-8 py-4 bg-white text-indigo-600 font-semibold rounded-lg hover:bg-gray-100 transition-colors shadow-lg text-lg"
              >
                {t('landing.hero.cta.try')}
              </button>
              <button
                onClick={() => onNavigate && onNavigate('roadmap')}
                className="px-8 py-4 bg-indigo-500/20 backdrop-blur-sm text-white font-semibold rounded-lg hover:bg-indigo-500/30 transition-colors border-2 border-white/30 text-lg"
              >
                {t('landing.hero.cta.roadmap')}
              </button>
            </div>
            <p className="text-sm text-indigo-200 mt-6">{t('landing.hero.version')}</p>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">{t('landing.features.title')}</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              {t('landing.features.subtitle')}
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="bg-white rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow border border-gray-200">
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Roadmap Preview */}
      <section id="roadmap" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">{t('landing.roadmap.title')}</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              {t('landing.roadmap.subtitle')}
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            {roadmapHighlights.map((item, index) => (
              <div key={index} className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-6 border border-indigo-200">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-lg font-bold text-gray-900">{item.phase}</span>
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    item.status === 'In Progress' 
                      ? 'bg-blue-100 text-blue-800' 
                      : 'bg-gray-100 text-gray-700'
                  }`}>
                    {item.status}
                  </span>
                </div>
                <p className="text-gray-700">{item.feature}</p>
              </div>
            ))}
          </div>
          <div className="text-center">
            <button
              onClick={() => onNavigate && onNavigate('roadmap')}
              className="px-8 py-3 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition-colors"
            >
              {t('landing.roadmap.cta')}
            </button>
          </div>
        </div>
      </section>

      {/* Beta Testing CTA */}
      <section className="py-20 bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-4xl font-bold mb-6">{t('landing.beta.title')}</h2>
          <p className="text-xl text-indigo-100 mb-8">
            {t('landing.beta.subtitle')}
          </p>
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 mb-8 text-left">
            <h3 className="font-semibold mb-4">{t('landing.beta.looking')}</h3>
            <ul className="space-y-2 text-indigo-100">
              <li>• {t('landing.beta.item1')}</li>
              <li>• {t('landing.beta.item2')}</li>
              <li>• {t('landing.beta.item3')}</li>
            </ul>
          </div>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <button
              onClick={() => onNavigate && onNavigate('login')}
              className="px-8 py-4 bg-white text-indigo-600 font-semibold rounded-lg hover:bg-gray-100 transition-colors shadow-lg"
            >
              {t('landing.beta.cta.start')}
            </button>
            <button
              onClick={() => {
                const feedbackSection = document.getElementById('feedback')
                feedbackSection?.scrollIntoView({ behavior: 'smooth' })
              }}
              className="px-8 py-4 bg-indigo-500/20 backdrop-blur-sm text-white font-semibold rounded-lg hover:bg-indigo-500/30 transition-colors border-2 border-white/30"
            >
              {t('landing.beta.cta.feedback')}
            </button>
          </div>
        </div>
      </section>

      {/* Feedback Section */}
      <section id="feedback" className="py-20 bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">{t('landing.feedback.title')}</h2>
            <p className="text-xl text-gray-600">
              {t('landing.feedback.subtitle')}
            </p>
          </div>
          <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-200">
            <FeedbackForm />
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-3 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <svg className="w-8 h-8 text-indigo-400" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M24 15v-2.3c-1.63.6-3.33.81-5 .61-2.26-.28-4.24-1.32-6.22-2.38-3.02-1.62-5.93-3.18-9.78-2.45-1.06.19-2.08.57-3 1.11v2.36c1.63-.6 3.33-.81 5-.61 2.26.28 4.24 1.32 6.22 2.38 3.02 1.61 5.93 3.18 9.78 2.44 1.06-.18 2.08-.56 3-1.12zm0-5.5V7.2c-1.63.6-3.33.82-5 .62-2.26-.29-4.24-1.33-6.22-2.39C9 3.8 6.1 2.22 2.25 2.95c-1.06.19-2.08.57-3 1.11v2.36c1.63-.6 3.33-.81 5-.61 2.26.28 4.24 1.33 6.22 2.39 3.02 1.61 5.93 3.17 9.78 2.44 1.06-.2 2.08-.58 3-1.13z" />
                </svg>
                <h3 className="text-xl font-bold text-white">KSMANAGER</h3>
              </div>
              <p className="text-sm">
                All-in-one business management for kite schools and water sports businesses.
              </p>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">{t('landing.footer.product')}</h4>
              <ul className="space-y-2 text-sm">
                <li>
                  <button onClick={() => onNavigate && onNavigate('roadmap')} className="hover:text-white transition-colors">{t('landing.nav.roadmap')}</button>
                </li>
                <li>
                  <button onClick={() => {
                    const feedbackSection = document.getElementById('feedback')
                    feedbackSection?.scrollIntoView({ behavior: 'smooth' })
                  }} className="hover:text-white transition-colors">{t('landing.nav.feedback')}</button>
                </li>
                <li>
                  <button onClick={() => onNavigate && onNavigate('login')} className="hover:text-white transition-colors">{t('landing.nav.login')}</button>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="text-white font-semibold mb-4">{t('landing.footer.status')}</h4>
              <ul className="space-y-2 text-sm">
                <li>{t('landing.footer.status.version')}</li>
                <li>{t('landing.footer.status.beta')}</li>
                <li>{t('landing.footer.status.phase')}</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 text-center text-sm">
            <p>&copy; {new Date().getFullYear()} KSManager. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default Landing

