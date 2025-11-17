function Sidebar({ currentPage, onNavigate, onLogout, user, isMobileOpen, onClose }) {
  const handleNavigateClick = (page) => {
    onNavigate(page)
    if (onClose) {
      onClose()
    }
  }

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
      </div>

      {/* User Info */}
      {user && (
        <div className="p-4 border-b border-gray-800">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-medium truncate flex-1">
              {user.name || user.email}
            </p>
            <button
              onClick={onLogout}
              className="px-3 py-1.5 text-xs font-medium rounded-md bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white transition-colors duration-200 whitespace-nowrap"
            >
              Logout
            </button>
          </div>
        </div>
      )}

      {/* Navigation Menu */}
      <nav className="flex-1 p-4">
        <ul className="space-y-2">
          <li>
            <button
              onClick={() => handleNavigateClick('dashboard')}
              className={`w-full text-left px-4 py-3 rounded-lg transition-colors duration-200 ${
                currentPage === 'dashboard'
                  ? 'bg-indigo-600 text-white'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              }`}
            >
              Dashboard
            </button>
          </li>
          <li>
            <button
              onClick={() => handleNavigateClick('customers')}
              className={`w-full text-left px-4 py-3 rounded-lg transition-colors duration-200 ${
                currentPage === 'customers'
                  ? 'bg-indigo-600 text-white'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              }`}
            >
              Customers
            </button>
          </li>
          <li>
            <button
              onClick={() => handleNavigateClick('hotels')}
              className={`w-full text-left px-4 py-3 rounded-lg transition-colors duration-200 ${
                currentPage === 'hotels'
                  ? 'bg-indigo-600 text-white'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              }`}
            >
              Hotels
            </button>
          </li>
          <li>
            <button
              onClick={() => handleNavigateClick('agencies')}
              className={`w-full text-left px-4 py-3 rounded-lg transition-colors duration-200 ${
                currentPage === 'agencies'
                  ? 'bg-indigo-600 text-white'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              }`}
            >
              Agencies
            </button>
          </li>
          <li>
            <button
              onClick={() => handleNavigateClick('instructors')}
              className={`w-full text-left px-4 py-3 rounded-lg transition-colors duration-200 ${
                currentPage === 'instructors'
                  ? 'bg-indigo-600 text-white'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              }`}
            >
              Instructors
            </button>
          </li>
          <li>
            <button
              onClick={() => handleNavigateClick('services')}
              className={`w-full text-left px-4 py-3 rounded-lg transition-colors duration-200 ${
                currentPage === 'services'
                  ? 'bg-indigo-600 text-white'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              }`}
            >
              Services
            </button>
          </li>
          <li>
            <button
              onClick={() => handleNavigateClick('equipment')}
              className={`w-full text-left px-4 py-3 rounded-lg transition-colors duration-200 ${
                currentPage === 'equipment'
                  ? 'bg-indigo-600 text-white'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              }`}
            >
              Equipment
            </button>
          </li>
        </ul>
      </nav>
    </div>
    </>
  )
}

export default Sidebar
