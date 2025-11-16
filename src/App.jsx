import { useState, useEffect } from 'react'
import Sidebar from './components/Sidebar'
import Dashboard from './pages/Dashboard'
import Customers from './pages/Customers'
import Instructors from './pages/Instructors'
import Lessons from './pages/Lessons'
import Rentals from './pages/Rentals'
import Login from './pages/Login'
import Signup from './pages/Signup'
import { getSession, deleteSession } from './lib/auth.js'

function App() {
  const [currentPage, setCurrentPage] = useState('dashboard')
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [showSignup, setShowSignup] = useState(false)
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  // Check if user is logged in on mount using session
  useEffect(() => {
    const checkSession = async () => {
      try {
        const sessionToken = localStorage.getItem('kiteManager_session')
        if (sessionToken) {
          const session = await getSession(sessionToken)
          if (session && session.user) {
            setUser(session.user)
            setIsAuthenticated(true)
          } else {
            // Invalid or expired session
            localStorage.removeItem('kiteManager_session')
          }
        }
      } catch (error) {
        console.error('Session check error:', error)
        localStorage.removeItem('kiteManager_session')
      } finally {
        setLoading(false)
      }
    }

    checkSession()
  }, [])

  const handleLogin = (userData) => {
    setUser(userData)
    setIsAuthenticated(true)
  }

  const handleSignup = (userData) => {
    // After signup, automatically log in
    handleLogin(userData)
  }

  const handleLogout = async () => {
    try {
      const sessionToken = localStorage.getItem('kiteManager_session')
      if (sessionToken) {
        await deleteSession(sessionToken)
      }
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      setUser(null)
      setIsAuthenticated(false)
      localStorage.removeItem('kiteManager_session')
      setCurrentPage('dashboard')
    }
  }

  const handleNavigate = (page) => {
    setCurrentPage(page)
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />
      case 'customers':
        return <Customers />
      case 'instructors':
        return <Instructors />
      case 'lessons':
        return <Lessons />
      case 'rentals':
        return <Rentals />
      default:
        return <Dashboard />
    }
  }

  // Show loading state while checking session
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-600">Loading...</div>
      </div>
    )
  }

  // Show login/signup if not authenticated
  if (!isAuthenticated) {
    if (showSignup) {
      return (
        <Signup
          onSignup={handleSignup}
          onSwitchToLogin={() => setShowSignup(false)}
        />
      )
    }
    return (
      <Login
        onLogin={handleLogin}
        onSwitchToSignup={() => setShowSignup(true)}
      />
    )
  }

  // Show main app if authenticated
  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar
        currentPage={currentPage}
        onNavigate={handleNavigate}
        onLogout={handleLogout}
        user={user}
      />
      
      {/* Main Content Area */}
      <div className="flex-1 bg-white">
        {renderPage()}
      </div>
    </div>
  )
}

export default App

