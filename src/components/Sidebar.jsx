import { useTranslation } from 'react-i18next'

function Sidebar({ currentPage, onNavigate, onLogout, user, isMobileOpen, onClose }) {
  const { t } = useTranslation()

  const handleNavigateClick = (page) => {
    onNavigate(page)
    if (onClose) {
      onClose()
    }
  }

  const navItems = [
    { key: 'dashboard', label: t('nav.dashboard', 'Dashboard') },
    { key: 'customers', label: t('nav.customers', 'Customers') },
    { key: 'orders', label: t('nav.orders', 'Orders') },
    { key: 'appointments', label: t('nav.schedule', 'Appointments') },
    { key: 'transactions', label: t('nav.transactions', 'Transactions') },
    { key: 'services', label: t('nav.services', 'Services') },
    { key: 'servicePackages', label: t('nav.servicePackages', 'Service Packages') },
    { key: 'products', label: t('nav.products', 'Products') },
    { key: 'companyAccounts', label: t('nav.companyAccounts', 'Company Accounts') },
    { key: 'instructors', label: t('nav.instructors', 'Instructors') },
    { key: 'staff', label: t('nav.staff', 'Staff') },
    { key: 'agencies', label: t('nav.agencies', 'Agencies') },
    { key: 'thirdParties', label: t('nav.thirdParties', 'Third Parties') },
    { key: 'hotels', label: t('nav.hotels', 'Hotels') },
    { key: 'settings', label: t('nav.settings', 'Settings') },
    { key: 'roadmap', label: t('nav.roadmap', 'Roadmap') },
  ]

  return (
    <>
      {/* Mobile overlay */}
      <div
        className={`fixed inset-0 bg-black/40 z-30 transition-opacity duration-300 md:hidden ${
          isMobileOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
        aria-hidden="true"
      />

      <div
        className={`fixed inset-y-0 left-0 z-40 w-64 bg-gray-900 text-white min-h-screen flex flex-col transform transition-transform duration-300 md:static md:translate-x-0 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Close button for mobile */}
        <button
          onClick={onClose}
          className="md:hidden absolute top-4 right-4 text-gray-400 hover:text-white transition-colors duration-200"
          aria-label="Close sidebar"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      {/* App Title */}
      <div className="p-6 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <svg
            className="w-8 h-8 text-indigo-400"
            viewBox="0 0 24 24"
            fill="currentColor"
            xmlns="http://www.w3.org/2000/svg"
            aria-hidden="true"
          >
            <path d="M24 15v-2.3c-1.63.6-3.33.81-5 .61-2.26-.28-4.24-1.32-6.22-2.38-3.02-1.62-5.93-3.18-9.78-2.45-1.06.19-2.08.57-3 1.11v2.36c1.63-.6 3.33-.81 5-.61 2.26.28 4.24 1.32 6.22 2.38 3.02 1.61 5.93 3.18 9.78 2.44 1.06-.18 2.08-.56 3-1.12zm0-5.5V7.2c-1.63.6-3.33.82-5 .62-2.26-.29-4.24-1.33-6.22-2.39C9 3.8 6.1 2.22 2.25 2.95c-1.06.19-2.08.57-3 1.11v2.36c1.63-.6 3.33-.81 5-.61 2.26.28 4.24 1.33 6.22 2.39 3.02 1.61 5.93 3.17 9.78 2.44 1.06-.2 2.08-.58 3-1.13z" />
          </svg>
          <h1 className="text-2xl font-bold">KSMANAGER</h1>
        </div>
        <p className="text-xs text-gray-400 mt-2">v0.1.0-beta</p>
      </div>

      {/* User Info */}
      {user && (
        <div className="p-4 border-b border-gray-800">
          <div className="flex items-center justify-between gap-2 mb-2">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">
                {user.name || user.email}
              </p>
              <p className="text-xs text-gray-400 truncate mt-0.5">
                {user.role === 'admin' 
                  ? t('user.role.admin')
                  : t('user.role.viewOnly')}
              </p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {/* Settings Button */}
              <button
                onClick={() => {
                  handleNavigateClick('settings')
                }}
                className="p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-800 transition-colors duration-200"
                aria-label={t('nav.settings', 'Settings')}
                title={t('nav.settings', 'Settings')}
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
              </button>
              {/* Logout Button */}
            <button
              onClick={onLogout}
                className="p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-800 transition-colors duration-200"
                aria-label={t('user.logout', 'Logout')}
                title={t('user.logout', 'Logout')}
              >
                <svg
                  className="w-5 h-5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
            >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                  />
                </svg>
            </button>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Menu */}
      <nav className="flex-1 p-4 overflow-y-auto">
        <ul className="space-y-2">
          {/* Navigation Items */}
          {navItems.map((item) => (
            <li key={item.key}>
              <button
                onClick={() => handleNavigateClick(item.key)}
                className={`w-full text-left px-4 py-3 rounded-lg transition-colors duration-200 ${
                  currentPage === item.key
                    ? 'bg-indigo-600 text-white'
                    : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                }`}
              >
                {item.label}
              </button>
            </li>
          ))}
        </ul>
      </nav>
    </div>
    </>
  )
}

export default Sidebar
