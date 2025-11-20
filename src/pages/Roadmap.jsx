import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import FeedbackForm from '../components/FeedbackForm'

function Roadmap() {
  const { t } = useTranslation()
  const [showFeedback, setShowFeedback] = useState(false)

  const phases = [
    {
      id: 1,
      title: 'Phase 1: Foundation & Beta Testing',
      status: 'in_progress',
      timeline: 'Q4 2024 - Q1 2025',
      description: 'Core system development, testing, and early commercialization preparation',
      features: [
        { name: 'Core Entity Management', status: 'completed', desc: 'Customers, Hotels, Agencies, Instructors, Staff, Equipment' },
        { name: 'Service Catalog', status: 'completed', desc: 'Lessons, Rentals, Storage with pricing tiers' },
        { name: 'Order Management', status: 'completed', desc: 'Create, edit, track orders (lessons, rentals, storage)' },
        { name: 'Financial Ledger', status: 'completed', desc: 'Transaction tracking with payment methods' },
        { name: 'Dashboard System', status: 'completed', desc: 'Management, Operations, Financial, Partners' },
        { name: 'User Authentication', status: 'completed', desc: 'Role-based access control' },
        { name: 'Multi-language Support', status: 'completed', desc: 'English & Portuguese' },
        { name: 'Beta Testing & Bug Fixes', status: 'in_progress', desc: 'Testing phase with real-world usage' },
        { name: 'UI/UX Refinements', status: 'in_progress', desc: 'Polish based on user feedback' },
        { name: 'Performance Optimization', status: 'in_progress', desc: 'Speed and responsiveness improvements' },
        { name: 'Commercialization Prep', status: 'planned', desc: 'Pricing model, documentation, support system' },
      ]
    },
    {
      id: 2,
      title: 'Phase 2: Core Enhancements',
      status: 'planned',
      timeline: 'Q2 2025 - Q3 2025',
      description: 'Reporting, email automation, customer portal, and payment gateway',
      features: [
        { name: 'Reporting & Analytics', status: 'planned', desc: 'Financial reports, customer analytics, service performance, PDF/Excel export' },
        { name: 'Email & Notifications', status: 'planned', desc: 'Automated confirmations, reminders, invoices, template customization' },
        { name: 'Customer Portal (MVP)', status: 'planned', desc: 'Customer login, booking history, invoice downloads, booking requests' },
        { name: 'Advanced Booking System', status: 'planned', desc: 'Online widget, real-time calendar, group bookings, waitlist' },
        { name: 'Payment Gateway Integration', status: 'planned', desc: 'Stripe/PayPal, card processing, payment links, refunds (End of Phase 2)' },
      ]
    },
    {
      id: 3,
      title: 'Phase 3: Automation & Intelligence',
      status: 'planned',
      timeline: 'Q4 2025',
      description: 'AI chatbot, smart scheduling, and advanced automation',
      features: [
        { name: 'AI Customer Service Chatbot', status: 'planned', desc: '24/7 support, booking assistance, multi-language, learning from interactions' },
        { name: 'Smart Scheduling', status: 'planned', desc: 'Instructor availability, auto-assignment, conflict detection, equipment optimization' },
        { name: 'Weather Integration', status: 'planned', desc: 'Weather-based scheduling suggestions and alerts' },
        { name: 'SMS Notifications', status: 'planned', desc: 'Text reminders via Twilio integration' },
      ]
    },
    {
      id: 4,
      title: 'Phase 4: Growth & Scale',
      status: 'planned',
      timeline: '2026',
      description: 'Mobile apps, integrations, marketing tools, and advanced analytics',
      features: [
        { name: 'Mobile Apps', status: 'planned', desc: 'Native iOS/Android apps for instructors and staff' },
        { name: 'Third-party Integrations', status: 'planned', desc: 'QuickBooks, Xero, Google Calendar, Outlook, CRM systems' },
        { name: 'Marketing Tools', status: 'planned', desc: 'Customer segmentation, email campaigns, referral tracking, loyalty points' },
        { name: 'Advanced Analytics & AI', status: 'planned', desc: 'Predictive analytics, demand forecasting, revenue optimization, churn prediction' },
      ]
    },
    {
      id: 5,
      title: 'Phase 5: Enterprise Features',
      status: 'planned',
      timeline: '2027',
      description: 'Multi-location support and white-label solutions',
      features: [
        { name: 'Multi-Location Support', status: 'planned', desc: 'Manage multiple kite schools, centralized reporting, equipment transfers' },
        { name: 'White-Label Solution', status: 'planned', desc: 'Custom branding, API access, multi-tenant architecture' },
        { name: 'Advanced Financial Features', status: 'planned', desc: 'Automated commissions, payroll, tax reporting, multi-currency' },
      ]
    }
  ]

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'in_progress':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'planned':
        return 'bg-gray-100 text-gray-700 border-gray-200'
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200'
    }
  }

  const getStatusBadge = (status) => {
    switch (status) {
      case 'completed':
        return `✅ ${t('roadmap.phase.status.completed')}`
      case 'in_progress':
        return `🔄 ${t('roadmap.phase.status.inProgress')}`
      case 'planned':
        return `📋 ${t('roadmap.phase.status.planned')}`
      default:
        return status
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-indigo-50">
      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-indigo-100 rounded-full mb-4">
            <svg className="w-10 h-10 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-3">{t('roadmap.title')}</h1>
          <p className="text-xl text-gray-600 mb-6">
            {t('roadmap.subtitle')}
          </p>
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-yellow-100 border border-yellow-300 rounded-lg">
            <span className="text-yellow-800 font-medium">{t('roadmap.version')}</span>
            <span className="text-yellow-600">•</span>
            <span className="text-yellow-700 text-sm">{t('roadmap.version.beta')}</span>
          </div>
        </div>

        {/* Feedback CTA */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-8 border border-indigo-200">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">{t('roadmap.feedback.title')} 🎯</h2>
              <p className="text-gray-600">
                {t('roadmap.feedback.subtitle')}
              </p>
            </div>
            <button
              onClick={() => setShowFeedback(!showFeedback)}
              className="px-6 py-3 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors shadow-md"
            >
              {showFeedback ? t('roadmap.feedback.cta.hide') : t('roadmap.feedback.cta.show')}
            </button>
          </div>
          {showFeedback && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <FeedbackForm onSuccess={() => setShowFeedback(false)} />
            </div>
          )}
        </div>

        {/* Roadmap Timeline */}
        <div className="space-y-8">
          {phases.map((phase, phaseIndex) => (
            <div key={phase.id} className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
              {/* Phase Header */}
              <div className={`px-6 py-5 border-b ${phase.status === 'in_progress' ? 'bg-gradient-to-r from-blue-50 to-indigo-50' : 'bg-gray-50'}`}>
                <div className="flex items-start justify-between flex-wrap gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-2xl font-bold text-gray-900">{t('roadmap.phase.title')} {phase.id}</span>
                      <span className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(phase.status)}`}>
                        {getStatusBadge(phase.status)}
                      </span>
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">{phase.title}</h2>
                    <p className="text-gray-600 mb-2">{phase.description}</p>
                    <p className="text-sm text-gray-500">📅 {t('roadmap.phase.timeline')} {phase.timeline}</p>
                  </div>
                </div>
              </div>

              {/* Phase Features */}
              <div className="p-6">
                <div className="grid gap-4 md:grid-cols-2">
                  {phase.features.map((feature, featureIndex) => (
                    <div
                      key={featureIndex}
                      className={`p-4 rounded-lg border-2 ${getStatusColor(feature.status)} transition-all hover:shadow-md`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-semibold text-gray-900">{feature.name}</h3>
                        <span className={`text-xs px-2 py-1 rounded ${getStatusColor(feature.status)} ml-2 whitespace-nowrap`}>
                          {getStatusBadge(feature.status)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600">{feature.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* What We're Testing Section */}
        <div className="mt-12 bg-white rounded-xl shadow-lg p-8 border border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">{t('roadmap.testing.title')}</h2>
          
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div>
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <span className="text-blue-500">🎯</span> {t('roadmap.testing.focus.title')}
              </h3>
              <ul className="space-y-2 text-gray-600">
                <li className="flex items-start gap-2">
                  <span className="text-indigo-500 mt-1">•</span>
                  <span>{t('roadmap.testing.focus.ux')}</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-indigo-500 mt-1">•</span>
                  <span>{t('roadmap.testing.focus.features')}</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-indigo-500 mt-1">•</span>
                  <span>{t('roadmap.testing.focus.performance')}</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-indigo-500 mt-1">•</span>
                  <span>{t('roadmap.testing.focus.mobile')}</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-indigo-500 mt-1">•</span>
                  <span>{t('roadmap.testing.focus.payments')}</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-indigo-500 mt-1">•</span>
                  <span>{t('roadmap.testing.focus.reporting')}</span>
                </li>
              </ul>
            </div>

            <div>
              <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                <span className="text-green-500">💬</span> {t('roadmap.testing.types.title')}
              </h3>
              <ul className="space-y-2 text-gray-600">
                <li className="flex items-start gap-2">
                  <span className="text-indigo-500 mt-1">•</span>
                  <span>{t('roadmap.testing.types.bugs')}</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-indigo-500 mt-1">•</span>
                  <span>{t('roadmap.testing.types.features')}</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-indigo-500 mt-1">•</span>
                  <span>{t('roadmap.testing.types.ux')}</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-indigo-500 mt-1">•</span>
                  <span>{t('roadmap.testing.types.workflows')}</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-indigo-500 mt-1">•</span>
                  <span>{t('roadmap.testing.types.export')}</span>
                </li>
              </ul>
            </div>
          </div>

          <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
            <p className="text-sm text-indigo-800">
              <strong>💡 {t('roadmap.testing.note')}</strong>
            </p>
          </div>
        </div>

        {/* Development Timeline */}
        <div className="mt-12 bg-white rounded-xl shadow-lg p-8 border border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">{t('roadmap.timeline.title')}</h2>
          <div className="relative">
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-300"></div>
            <div className="space-y-6">
              <div className="relative pl-12">
                <div className="absolute left-3 w-4 h-4 bg-blue-500 rounded-full border-4 border-white shadow"></div>
                <div>
                  <div className="font-semibold text-gray-900">{t('roadmap.timeline.current')}</div>
                  <div className="text-sm text-gray-600">{t('roadmap.timeline.current.desc')}</div>
                </div>
              </div>
              <div className="relative pl-12">
                <div className="absolute left-3 w-4 h-4 bg-gray-300 rounded-full border-4 border-white shadow"></div>
                <div>
                  <div className="font-semibold text-gray-900">{t('roadmap.timeline.q2')}</div>
                  <div className="text-sm text-gray-600">{t('roadmap.timeline.q2.desc')}</div>
                </div>
              </div>
              <div className="relative pl-12">
                <div className="absolute left-3 w-4 h-4 bg-gray-300 rounded-full border-4 border-white shadow"></div>
                <div>
                  <div className="font-semibold text-gray-900">{t('roadmap.timeline.q3')}</div>
                  <div className="text-sm text-gray-600">{t('roadmap.timeline.q3.desc')}</div>
                </div>
              </div>
              <div className="relative pl-12">
                <div className="absolute left-3 w-4 h-4 bg-gray-300 rounded-full border-4 border-white shadow"></div>
                <div>
                  <div className="font-semibold text-gray-900">{t('roadmap.timeline.q4')}</div>
                  <div className="text-sm text-gray-600">{t('roadmap.timeline.q4.desc')}</div>
                </div>
              </div>
              <div className="relative pl-12">
                <div className="absolute left-3 w-4 h-4 bg-gray-300 rounded-full border-4 border-white shadow"></div>
                <div>
                  <div className="font-semibold text-gray-900">{t('roadmap.timeline.2026')}</div>
                  <div className="text-sm text-gray-600">{t('roadmap.timeline.2026.desc')}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Roadmap

