import { useState, useEffect } from 'react'
import Sidebar from './components/Sidebar'
import Dashboard from './pages/Dashboard'
import Customers from './pages/Customers'
import Hotels from './pages/Hotels'
import Agencies from './pages/Agencies'
import Instructors from './pages/Instructors'
import Services from './pages/Services'
import CustomerForm from './pages/CustomerForm'
import HotelForm from './pages/HotelForm'
import AgencyForm from './pages/AgencyForm'
import InstructorForm from './pages/InstructorForm'
import ServicesForm from './pages/ServicesForm'
import Login from './pages/Login'
import Signup from './pages/Signup'
import { getSession, deleteSession } from './lib/auth.js'

function App() {
  const [currentPage, setCurrentPage] = useState('dashboard')
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [showSignup, setShowSignup] = useState(false)
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [customerFormCustomer, setCustomerFormCustomer] = useState(null)
  const [customersRefreshKey, setCustomersRefreshKey] = useState(0)
  const [hotelFormHotel, setHotelFormHotel] = useState(null)
  const [hotelsRefreshKey, setHotelsRefreshKey] = useState(0)
  const [agencyFormAgency, setAgencyFormAgency] = useState(null)
  const [agenciesRefreshKey, setAgenciesRefreshKey] = useState(0)
  const [instructorFormInstructor, setInstructorFormInstructor] = useState(null)
  const [instructorsRefreshKey, setInstructorsRefreshKey] = useState(0)
  const [serviceFormService, setServiceFormService] = useState(null)
  const [servicesRefreshKey, setServicesRefreshKey] = useState(0)

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
    setIsSidebarOpen(false)
  }

  const toggleSidebar = () => {
    setIsSidebarOpen((prev) => !prev)
  }

  const openCustomerForm = (customer = null) => {
    setCustomerFormCustomer(customer)
    setCurrentPage('customerForm')
  }

  const handleCustomerFormSaved = () => {
    setCustomersRefreshKey((prev) => prev + 1)
    setCustomerFormCustomer(null)
    setCurrentPage('customers')
  }

  const handleCustomerFormCancel = () => {
    setCustomerFormCustomer(null)
    setCurrentPage('customers')
  }

  const openHotelForm = (hotel = null) => {
    setHotelFormHotel(hotel)
    setCurrentPage('hotelForm')
  }

  const handleHotelFormSaved = () => {
    setHotelsRefreshKey((prev) => prev + 1)
    setHotelFormHotel(null)
    setCurrentPage('hotels')
  }

  const handleHotelFormCancel = () => {
    setHotelFormHotel(null)
    setCurrentPage('hotels')
  }

  const openAgencyForm = (agency = null) => {
    setAgencyFormAgency(agency)
    setCurrentPage('agencyForm')
  }

  const handleAgencyFormSaved = () => {
    setAgenciesRefreshKey((prev) => prev + 1)
    setAgencyFormAgency(null)
    setCurrentPage('agencies')
  }

  const handleAgencyFormCancel = () => {
    setAgencyFormAgency(null)
    setCurrentPage('agencies')
  }

  const openInstructorForm = (instructor = null) => {
    setInstructorFormInstructor(instructor)
    setCurrentPage('instructorForm')
  }

  const handleInstructorFormSaved = () => {
    setInstructorsRefreshKey((prev) => prev + 1)
    setInstructorFormInstructor(null)
    setCurrentPage('instructors')
  }

  const handleInstructorFormCancel = () => {
    setInstructorFormInstructor(null)
    setCurrentPage('instructors')
  }

  const openServiceForm = (serviceData = null) => {
    setServiceFormService(serviceData)
    setCurrentPage('serviceForm')
  }

  const handleServiceFormSaved = () => {
    setServicesRefreshKey((prev) => prev + 1)
    setServiceFormService(null)
    setCurrentPage('services')
  }

  const handleServiceFormCancel = () => {
    setServiceFormService(null)
    setCurrentPage('services')
  }

  const closeSidebar = () => {
    setIsSidebarOpen(false)
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />
      case 'customers':
        return (
          <Customers
            refreshKey={customersRefreshKey}
            onAddCustomer={() => openCustomerForm(null)}
            onEditCustomer={(customer) => openCustomerForm(customer)}
          />
        )
      case 'hotels':
        return (
          <Hotels
            refreshKey={hotelsRefreshKey}
            onAddHotel={() => openHotelForm(null)}
            onEditHotel={(hotel) => openHotelForm(hotel)}
          />
        )
      case 'agencies':
        return (
          <Agencies
            refreshKey={agenciesRefreshKey}
            onAddAgency={() => openAgencyForm(null)}
            onEditAgency={(agency) => openAgencyForm(agency)}
          />
        )
      case 'services':
        return (
          <Services
            refreshKey={servicesRefreshKey}
            onAddService={() => openServiceForm(null)}
            onEditService={(serviceItem) => openServiceForm(serviceItem)}
          />
        )
      case 'instructors':
        return (
          <Instructors
            refreshKey={instructorsRefreshKey}
            onAddInstructor={() => openInstructorForm(null)}
            onEditInstructor={(instructor) => openInstructorForm(instructor)}
          />
        )
      case 'customerForm':
        return (
          <CustomerForm
            customer={customerFormCustomer}
            onCancel={handleCustomerFormCancel}
            onSaved={handleCustomerFormSaved}
          />
        )
      case 'hotelForm':
        return (
          <HotelForm
            hotel={hotelFormHotel}
            onCancel={handleHotelFormCancel}
            onSaved={handleHotelFormSaved}
          />
        )
      case 'agencyForm':
        return (
          <AgencyForm
            agency={agencyFormAgency}
            onCancel={handleAgencyFormCancel}
            onSaved={handleAgencyFormSaved}
          />
        )
      case 'instructorForm':
        return (
          <InstructorForm
            instructor={instructorFormInstructor}
            onCancel={handleInstructorFormCancel}
            onSaved={handleInstructorFormSaved}
          />
        )
      case 'serviceForm':
        return (
          <ServicesForm
            service={serviceFormService}
            onCancel={handleServiceFormCancel}
            onSaved={handleServiceFormSaved}
          />
        )
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
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <Sidebar
        currentPage={currentPage}
        onNavigate={handleNavigate}
        onLogout={handleLogout}
        user={user}
        isMobileOpen={isSidebarOpen}
        onClose={closeSidebar}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-screen bg-white">
        {/* Mobile header */}
        <header className="md:hidden sticky top-0 z-10 bg-gray-900 text-white px-4 py-4 flex items-center justify-between shadow-lg">
          <button
            onClick={toggleSidebar}
            className="text-white hover:text-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-indigo-400 rounded-md p-2"
            aria-label="Toggle sidebar"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <div className="flex items-center gap-2">
            <svg
              className="w-6 h-6 text-indigo-300"
              viewBox="0 0 24 24"
              fill="currentColor"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path d="M24 15v-2.3c-1.63.6-3.33.81-5 .61-2.26-.28-4.24-1.32-6.22-2.38-3.02-1.62-5.93-3.18-9.78-2.45-1.06.19-2.08.57-3 1.11v2.36c1.63-.6 3.33-.81 5-.61 2.26.28 4.24 1.32 6.22 2.38 3.02 1.61 5.93 3.18 9.78 2.44 1.06-.18 2.08-.56 3-1.12zm0-5.5V7.2c-1.63.6-3.33.82-5 .62-2.26-.29-4.24-1.33-6.22-2.39C9 3.8 6.1 2.22 2.25 2.95c-1.06.19-2.08.57-3 1.11v2.36c1.63-.6 3.33-.81 5-.61 2.26.28 4.24 1.33 6.22 2.39 3.02 1.61 5.93 3.17 9.78 2.44 1.06-.2 2.08-.58 3-1.13z" />
            </svg>
            <h1 className="text-lg font-bold">KSMANAGER</h1>
          </div>
          <div className="w-6" aria-hidden="true" />
        </header>

        <main className="flex-1">
          {renderPage()}
        </main>
      </div>
    </div>
  )
}

export default App

