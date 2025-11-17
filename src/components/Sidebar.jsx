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
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            {/* Graduation cap */}
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M6 8l6-3 6 3M6 8v6l6 3 6-3V8M6 8l6 3 6-3"
            />
            {/* Tassel */}
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M12 11v2"
            />
            <circle cx="12" cy="13" r="1" fill="currentColor"/>
            {/* Waves */}
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M3 18c2 0 2-1 4-1s2 1 4 1 2-1 4-1 2 1 4 1 2-1 4-1"
            />
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M3 21c2 0 2-1 4-1s2 1 4 1 2-1 4-1 2 1 4 1 2-1 4-1"
            />
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
              onClick={() => handleNavigateClick('lessons')}
              className={`w-full text-left px-4 py-3 rounded-lg transition-colors duration-200 ${
                currentPage === 'lessons'
                  ? 'bg-indigo-600 text-white'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              }`}
            >
              Lessons
            </button>
          </li>
          <li>
            <button
              onClick={() => handleNavigateClick('rentals')}
              className={`w-full text-left px-4 py-3 rounded-lg transition-colors duration-200 ${
                currentPage === 'rentals'
                  ? 'bg-indigo-600 text-white'
                  : 'text-gray-300 hover:bg-gray-800 hover:text-white'
              }`}
            >
              Rentals
            </button>
          </li>
        </ul>
      </nav>
    </div>
    </>
  )
}

export default Sidebar
