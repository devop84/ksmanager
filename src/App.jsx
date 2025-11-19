import { useState, useEffect } from 'react'
import Sidebar from './components/Sidebar'
import Dashboard from './pages/Dashboard'
import Customers from './pages/Customers'
import Hotels from './pages/Hotels'
import Agencies from './pages/Agencies'
import Instructors from './pages/Instructors'
import Services from './pages/Services'
import ServiceDetail from './pages/ServiceDetail'
import Equipment from './pages/Equipment'
import Orders from './pages/Orders'
import CustomerForm from './pages/CustomerForm'
import CustomerDetail from './pages/CustomerDetail'
import HotelForm from './pages/HotelForm'
import HotelDetail from './pages/HotelDetail'
import AgencyForm from './pages/AgencyForm'
import AgencyDetail from './pages/AgencyDetail'
import InstructorForm from './pages/InstructorForm'
import InstructorDetail from './pages/InstructorDetail'
import ServicesForm from './pages/ServicesForm'
import EquipmentForm from './pages/EquipmentForm'
import EquipmentDetail from './pages/EquipmentDetail'
import OrderForm from './pages/OrderForm'
import OrderDetail from './pages/OrderDetail'
import Login from './pages/Login'
import Signup from './pages/Signup'
import CompanyAccounts from './pages/CompanyAccounts'
import CompanyAccountForm from './pages/CompanyAccountForm'
import CompanyAccountDetail from './pages/CompanyAccountDetail'
import ThirdParties from './pages/ThirdParties'
import ThirdPartyForm from './pages/ThirdPartyForm'
import ThirdPartyDetail from './pages/ThirdPartyDetail'
import Transactions from './pages/Transactions'
import TransactionForm from './pages/TransactionForm'
import TransactionDetail from './pages/TransactionDetail'
import { getSession, deleteSession } from './lib/auth.js'
import { canModify } from './lib/permissions.js'

function App() {
  const [currentPage, setCurrentPage] = useState('dashboard')
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [showSignup, setShowSignup] = useState(false)
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [customerFormCustomer, setCustomerFormCustomer] = useState(null)
  const [customerDetailId, setCustomerDetailId] = useState(null)
  const [customersRefreshKey, setCustomersRefreshKey] = useState(0)
  const [hotelFormHotel, setHotelFormHotel] = useState(null)
  const [hotelDetailId, setHotelDetailId] = useState(null)
  const [hotelsRefreshKey, setHotelsRefreshKey] = useState(0)
  const [agencyFormAgency, setAgencyFormAgency] = useState(null)
  const [agencyDetailId, setAgencyDetailId] = useState(null)
  const [agenciesRefreshKey, setAgenciesRefreshKey] = useState(0)
  const [instructorFormInstructor, setInstructorFormInstructor] = useState(null)
  const [instructorsRefreshKey, setInstructorsRefreshKey] = useState(0)
  const [instructorDetailId, setInstructorDetailId] = useState(null)
  const [serviceFormService, setServiceFormService] = useState(null)
  const [serviceDetailId, setServiceDetailId] = useState(null)
  const [servicesRefreshKey, setServicesRefreshKey] = useState(0)
  const [equipmentRefreshKey, setEquipmentRefreshKey] = useState(0)
  const [equipmentFormItem, setEquipmentFormItem] = useState(null)
  const [equipmentDetailId, setEquipmentDetailId] = useState(null)
  const [ordersRefreshKey, setOrdersRefreshKey] = useState(0)
  const [orderFormOrder, setOrderFormOrder] = useState(null)
  const [orderDetailId, setOrderDetailId] = useState(null)
  const [companyAccountsRefreshKey, setCompanyAccountsRefreshKey] = useState(0)
  const [companyAccountFormAccount, setCompanyAccountFormAccount] = useState(null)
  const [companyAccountDetailId, setCompanyAccountDetailId] = useState(null)
  const [thirdPartiesRefreshKey, setThirdPartiesRefreshKey] = useState(0)
  const [thirdPartyFormItem, setThirdPartyFormItem] = useState(null)
  const [thirdPartyDetailId, setThirdPartyDetailId] = useState(null)
  const [transactionsRefreshKey, setTransactionsRefreshKey] = useState(0)
  const [transactionFormTransaction, setTransactionFormTransaction] = useState(null)
  const [transactionDetailId, setTransactionDetailId] = useState(null)

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

  const openCustomerDetail = (customer) => {
    setCustomerDetailId(customer.id)
    setCurrentPage('customerDetail')
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

  const handleCustomerDetailBack = () => {
    setCustomerDetailId(null)
    setCurrentPage('customers')
  }

  const handleCustomerDetailEdit = (customer) => {
    setCustomerFormCustomer(customer)
    setCustomerDetailId(null)
    setCurrentPage('customerForm')
  }

  const handleCustomerDetailDelete = () => {
    setCustomersRefreshKey((prev) => prev + 1)
    setCustomerDetailId(null)
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

  const openHotelDetail = (hotel) => {
    setHotelDetailId(hotel.id)
    setCurrentPage('hotelDetail')
  }

  const handleHotelDetailBack = () => {
    setHotelDetailId(null)
    setCurrentPage('hotels')
  }

  const handleHotelDetailEdit = (hotel) => {
    setHotelFormHotel(hotel)
    setHotelDetailId(null)
    setCurrentPage('hotelForm')
  }

  const handleHotelDetailDelete = () => {
    setHotelsRefreshKey((prev) => prev + 1)
    setHotelDetailId(null)
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

  const openAgencyDetail = (agency) => {
    setAgencyDetailId(agency.id)
    setCurrentPage('agencyDetail')
  }

  const handleAgencyDetailBack = () => {
    setAgencyDetailId(null)
    setCurrentPage('agencies')
  }

  const handleAgencyDetailEdit = (agency) => {
    setAgencyFormAgency(agency)
    setAgencyDetailId(null)
    setCurrentPage('agencyForm')
  }

  const handleAgencyDetailDelete = () => {
    setAgenciesRefreshKey((prev) => prev + 1)
    setAgencyDetailId(null)
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

  const openInstructorDetail = (instructor) => {
    setInstructorDetailId(instructor.id)
    setCurrentPage('instructorDetail')
  }

  const handleInstructorDetailBack = () => {
    setInstructorDetailId(null)
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

  const openServiceDetail = (service) => {
    setServiceDetailId(service.id)
    setCurrentPage('serviceDetail')
  }

  const handleServiceDetailBack = () => {
    setServiceDetailId(null)
    setCurrentPage('services')
  }

  const handleServiceDetailEdit = (service) => {
    setServiceFormService(service)
    setServiceDetailId(null)
    setCurrentPage('serviceForm')
  }

  const handleServiceDetailDelete = () => {
    setServicesRefreshKey((prev) => prev + 1)
    setServiceDetailId(null)
    setCurrentPage('services')
  }

  const openCompanyAccountForm = (account = null) => {
    setCompanyAccountFormAccount(account)
    setCurrentPage('companyAccountForm')
  }

  const handleCompanyAccountFormSaved = () => {
    setCompanyAccountsRefreshKey((prev) => prev + 1)
    setCompanyAccountFormAccount(null)
    setCurrentPage('companyAccounts')
  }

  const handleCompanyAccountFormCancel = () => {
    setCompanyAccountFormAccount(null)
    setCurrentPage('companyAccounts')
  }

  const openCompanyAccountDetail = (account) => {
    setCompanyAccountDetailId(account.id)
    setCurrentPage('companyAccountDetail')
  }

  const handleCompanyAccountDetailBack = () => {
    setCompanyAccountDetailId(null)
    setCurrentPage('companyAccounts')
  }

  const handleCompanyAccountDetailEdit = (account) => {
    setCompanyAccountFormAccount(account)
    setCompanyAccountDetailId(null)
    setCurrentPage('companyAccountForm')
  }

  const handleCompanyAccountDetailDelete = () => {
    setCompanyAccountsRefreshKey((prev) => prev + 1)
    setCompanyAccountDetailId(null)
    setCurrentPage('companyAccounts')
  }

  const openThirdPartyForm = (thirdParty = null) => {
    setThirdPartyFormItem(thirdParty)
    setCurrentPage('thirdPartyForm')
  }

  const handleThirdPartyFormSaved = () => {
    setThirdPartiesRefreshKey((prev) => prev + 1)
    setThirdPartyFormItem(null)
    setCurrentPage('thirdParties')
  }

  const handleThirdPartyFormCancel = () => {
    setThirdPartyFormItem(null)
    setCurrentPage('thirdParties')
  }

  const openThirdPartyDetail = (thirdParty) => {
    setThirdPartyDetailId(thirdParty.id)
    setCurrentPage('thirdPartyDetail')
  }

  const handleThirdPartyDetailBack = () => {
    setThirdPartyDetailId(null)
    setCurrentPage('thirdParties')
  }

  const handleThirdPartyDetailEdit = (thirdParty) => {
    setThirdPartyFormItem(thirdParty)
    setThirdPartyDetailId(null)
    setCurrentPage('thirdPartyForm')
  }

  const handleThirdPartyDetailDelete = () => {
    setThirdPartiesRefreshKey((prev) => prev + 1)
    setThirdPartyDetailId(null)
    setCurrentPage('thirdParties')
  }

  const openTransactionForm = (transactionEntry = null) => {
    setTransactionFormTransaction(transactionEntry)
    setCurrentPage('transactionForm')
  }

  const handleTransactionFormSaved = () => {
    setTransactionsRefreshKey((prev) => prev + 1)
    setTransactionFormTransaction(null)
    setCurrentPage('transactions')
  }

  const handleTransactionFormCancel = () => {
    setTransactionFormTransaction(null)
    setCurrentPage('transactions')
  }

  const openTransactionDetail = (transaction) => {
    setTransactionDetailId(transaction.id)
    setCurrentPage('transactionDetail')
  }

  const handleTransactionDetailBack = () => {
    setTransactionDetailId(null)
    setCurrentPage('transactions')
  }

  const handleTransactionDetailEdit = (transaction) => {
    setTransactionFormTransaction(transaction)
    setTransactionDetailId(null)
    setCurrentPage('transactionForm')
  }

  const handleTransactionDetailDelete = () => {
    setTransactionsRefreshKey((prev) => prev + 1)
    setTransactionDetailId(null)
    setCurrentPage('transactions')
  }

  const openEquipmentForm = (item = null) => {
    setEquipmentFormItem(item)
    setCurrentPage('equipmentForm')
  }

  const handleEquipmentFormSaved = () => {
    setEquipmentRefreshKey((prev) => prev + 1)
    setEquipmentFormItem(null)
    setCurrentPage('equipment')
  }

  const handleEquipmentFormCancel = () => {
    setEquipmentFormItem(null)
    setCurrentPage('equipment')
  }

  const openEquipmentDetail = (equipment) => {
    setEquipmentDetailId(equipment.id)
    setCurrentPage('equipmentDetail')
  }

  const handleEquipmentDetailBack = () => {
    setEquipmentDetailId(null)
    setCurrentPage('equipment')
  }

  const handleEquipmentDetailEdit = (equipment) => {
    setEquipmentFormItem(equipment)
    setEquipmentDetailId(null)
    setCurrentPage('equipmentForm')
  }

  const handleEquipmentDetailDelete = () => {
    setEquipmentRefreshKey((prev) => prev + 1)
    setEquipmentDetailId(null)
    setCurrentPage('equipment')
  }

  const openOrderForm = (order = null) => {
    setOrderFormOrder(order)
    setCurrentPage('orderForm')
  }

  const handleOrderFormSaved = () => {
    setOrdersRefreshKey((prev) => prev + 1)
    setOrderFormOrder(null)
    setCurrentPage('orders')
  }

  const handleOrderFormCancel = () => {
    setOrderFormOrder(null)
    setCurrentPage('orders')
  }

  const openOrderDetail = (order) => {
    setOrderDetailId(order.id)
    setCurrentPage('orderDetail')
  }

  const handleOrderDetailBack = () => {
    setOrderDetailId(null)
    setCurrentPage('orders')
  }

  const handleOrderDetailEdit = (order) => {
    setOrderFormOrder(order)
    setOrderDetailId(null)
    setCurrentPage('orderForm')
  }

  const handleOrderDetailDelete = () => {
    setOrdersRefreshKey((prev) => prev + 1)
    setOrderDetailId(null)
    setCurrentPage('orders')
  }

  const closeSidebar = () => {
    setIsSidebarOpen(false)
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard onEditOrder={(order) => openOrderForm(order)} onViewCustomer={(customer) => openCustomerDetail(customer)} />
      case 'customers':
        return (
          <Customers
            refreshKey={customersRefreshKey}
            user={user}
            onAddCustomer={() => openCustomerForm(null)}
            onEditCustomer={(customer) => openCustomerForm(customer)}
            onViewCustomer={(customer) => openCustomerDetail(customer)}
          />
        )
      case 'hotels':
        return (
          <Hotels
            refreshKey={hotelsRefreshKey}
            user={user}
            onAddHotel={() => openHotelForm(null)}
            onEditHotel={(hotel) => openHotelForm(hotel)}
            onViewHotel={(hotel) => openHotelDetail(hotel)}
          />
        )
      case 'agencies':
        return (
          <Agencies
            refreshKey={agenciesRefreshKey}
            user={user}
            onAddAgency={() => openAgencyForm(null)}
            onEditAgency={(agency) => openAgencyForm(agency)}
        onViewAgency={(agency) => openAgencyDetail(agency)}
          />
        )
      case 'services':
        return (
          <Services
            refreshKey={servicesRefreshKey}
            user={user}
            onAddService={() => openServiceForm(null)}
            onViewService={(service) => openServiceDetail(service)}
          />
        )
      case 'transactions':
        return (
          <Transactions
            refreshKey={transactionsRefreshKey}
            user={user}
            onAddTransaction={() => openTransactionForm(null)}
            onViewTransaction={(transaction) => openTransactionDetail(transaction)}
          />
        )
      case 'thirdParties':
        return (
          <ThirdParties
            refreshKey={thirdPartiesRefreshKey}
            user={user}
            onAddThirdParty={() => openThirdPartyForm(null)}
            onEditThirdParty={(thirdParty) => openThirdPartyForm(thirdParty)}
            onViewThirdParty={(thirdParty) => openThirdPartyDetail(thirdParty)}
          />
        )
      case 'companyAccounts':
        return (
          <CompanyAccounts
            refreshKey={companyAccountsRefreshKey}
            user={user}
            onAddAccount={() => openCompanyAccountForm(null)}
            onEditAccount={(account) => openCompanyAccountForm(account)}
            onViewAccount={(account) => openCompanyAccountDetail(account)}
          />
        )
      case 'orders':
        return (
          <Orders
            refreshKey={ordersRefreshKey}
            user={user}
            onAddOrder={() => openOrderForm(null)}
            onEditOrder={(order) => openOrderForm(order)}
            onViewOrder={(order) => openOrderDetail(order)}
          />
        )
      case 'equipment':
        return (
          <Equipment
            refreshKey={equipmentRefreshKey}
            user={user}
            onAddEquipment={() => openEquipmentForm(null)}
            onEditEquipment={(item) => openEquipmentForm(item)}
            onViewEquipment={(item) => openEquipmentDetail(item)}
          />
        )
      case 'instructors':
        return (
          <Instructors
            refreshKey={instructorsRefreshKey}
            user={user}
            onAddInstructor={() => openInstructorForm(null)}
            onEditInstructor={(instructor) => openInstructorForm(instructor)}
            onViewInstructor={(instructor) => openInstructorDetail(instructor)}
          />
        )
      case 'customerDetail':
        return (
          <CustomerDetail
            customerId={customerDetailId}
            onBack={handleCustomerDetailBack}
            onEdit={handleCustomerDetailEdit}
            onDelete={handleCustomerDetailDelete}
            onEditOrder={(order) => openOrderForm(order)}
            user={user}
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
      case 'hotelDetail':
        return (
          <HotelDetail
            hotelId={hotelDetailId}
            onBack={handleHotelDetailBack}
            onEdit={(hotel) => handleHotelDetailEdit(hotel)}
            onDelete={handleHotelDetailDelete}
            user={user}
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
      case 'agencyDetail':
        return (
          <AgencyDetail
            agencyId={agencyDetailId}
            onBack={handleAgencyDetailBack}
            onEdit={(agency) => handleAgencyDetailEdit(agency)}
            onDelete={handleAgencyDetailDelete}
            user={user}
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
      case 'instructorDetail':
        return (
          <InstructorDetail
            instructorId={instructorDetailId}
            onBack={handleInstructorDetailBack}
            onEdit={(instructor) => openInstructorForm(instructor)}
            user={user}
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
      case 'serviceDetail':
        return (
          <ServiceDetail
            serviceId={serviceDetailId}
            onBack={handleServiceDetailBack}
            onEdit={(service) => handleServiceDetailEdit(service)}
            onDelete={handleServiceDetailDelete}
            user={user}
          />
        )
      case 'thirdPartyForm':
        return (
          <ThirdPartyForm
            thirdParty={thirdPartyFormItem}
            onCancel={handleThirdPartyFormCancel}
            onSaved={handleThirdPartyFormSaved}
          />
        )
      case 'thirdPartyDetail':
        return (
          <ThirdPartyDetail
            thirdPartyId={thirdPartyDetailId}
            onBack={handleThirdPartyDetailBack}
            onEdit={(thirdParty) => handleThirdPartyDetailEdit(thirdParty)}
            onDelete={handleThirdPartyDetailDelete}
            user={user}
          />
        )
      case 'transactionForm':
        return (
          <TransactionForm
            transaction={transactionFormTransaction}
            onCancel={handleTransactionFormCancel}
            onSaved={handleTransactionFormSaved}
          />
        )
      case 'transactionDetail':
        return (
          <TransactionDetail
            transactionId={transactionDetailId}
            onBack={handleTransactionDetailBack}
            onEdit={(transaction) => handleTransactionDetailEdit(transaction)}
            onDelete={handleTransactionDetailDelete}
            user={user}
          />
        )
      case 'companyAccountForm':
        return (
          <CompanyAccountForm
            account={companyAccountFormAccount}
            onCancel={handleCompanyAccountFormCancel}
            onSaved={handleCompanyAccountFormSaved}
          />
        )
      case 'companyAccountDetail':
        return (
          <CompanyAccountDetail
            accountId={companyAccountDetailId}
            onBack={handleCompanyAccountDetailBack}
            onEdit={(account) => handleCompanyAccountDetailEdit(account)}
            onDelete={handleCompanyAccountDetailDelete}
            user={user}
          />
        )
      case 'equipmentForm':
        return (
          <EquipmentForm
            equipment={equipmentFormItem}
            onCancel={handleEquipmentFormCancel}
            onSaved={handleEquipmentFormSaved}
          />
        )
      case 'equipmentDetail':
        return (
          <EquipmentDetail
            equipmentId={equipmentDetailId}
            onBack={handleEquipmentDetailBack}
            onEdit={(equipment) => handleEquipmentDetailEdit(equipment)}
            onDelete={handleEquipmentDetailDelete}
            user={user}
          />
        )
      case 'orderDetail':
        return (
          <OrderDetail
            orderId={orderDetailId}
            onBack={handleOrderDetailBack}
            onEdit={handleOrderDetailEdit}
            onDelete={handleOrderDetailDelete}
            user={user}
          />
        )
      case 'orderForm':
        return (
          <OrderForm
            order={orderFormOrder}
            onCancel={handleOrderFormCancel}
            onSaved={handleOrderFormSaved}
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
      <div className="flex-1 flex flex-col min-h-screen bg-gray-50 w-full">
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

