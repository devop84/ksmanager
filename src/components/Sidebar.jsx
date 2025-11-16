function Sidebar({ currentPage, onNavigate, onLogout, user }) {
  return (
    <div className="w-64 bg-gray-900 text-white min-h-screen flex flex-col">
      {/* App Title */}
      <div className="p-6 border-b border-gray-800">
        <h1 className="text-2xl font-bold">Kite Manager</h1>
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
              onClick={() => onNavigate('dashboard')}
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
              onClick={() => onNavigate('customers')}
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
              onClick={() => onNavigate('instructors')}
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
              onClick={() => onNavigate('lessons')}
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
              onClick={() => onNavigate('rentals')}
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
  )
}

export default Sidebar

