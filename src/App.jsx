import { useState, useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import Sidebar from './components/Sidebar'
import Customers from './pages/customers/Customers'
import Hotels from './pages/hotels/Hotels'
import Agencies from './pages/agencies/Agencies'
import Instructors from './pages/instructors/Instructors'
import Staff from './pages/staff/Staff'
import CustomerForm from './pages/customers/CustomerForm'
import CustomerDetail from './pages/customers/CustomerDetail'
import HotelForm from './pages/hotels/HotelForm'
import HotelDetail from './pages/hotels/HotelDetail'
import AgencyForm from './pages/agencies/AgencyForm'
import AgencyDetail from './pages/agencies/AgencyDetail'
import InstructorForm from './pages/instructors/InstructorForm'
import InstructorDetail from './pages/instructors/InstructorDetail'
import StaffForm from './pages/staff/StaffForm'
import StaffDetail from './pages/staff/StaffDetail'
import Login from './pages/Login'
import Signup from './pages/Signup'
import CompanyAccounts from './pages/companyaccounts/CompanyAccounts'
import CompanyAccountForm from './pages/companyaccounts/CompanyAccountForm'
import CompanyAccountDetail from './pages/companyaccounts/CompanyAccountDetail'
import ThirdParties from './pages/thirdparties/ThirdParties'
import ThirdPartyForm from './pages/thirdparties/ThirdPartyForm'
import ThirdPartyDetail from './pages/thirdparties/ThirdPartyDetail'
import Transactions from './pages/transactions/Transactions'
import TransactionForm from './pages/transactions/TransactionForm'
import TransactionDetail from './pages/transactions/TransactionDetail'
import Orders from './pages/orders/Orders'
import OrderForm from './pages/orders/OrderForm'
import OrderDetail from './pages/orders/OrderDetail'
import Products from './pages/products/Products'
import ProductForm from './pages/products/ProductForm'
import ProductDetail from './pages/products/ProductDetail'
import Services from './pages/services/Services'
import ServiceForm from './pages/services/ServiceForm'
import ServiceDetail from './pages/services/ServiceDetail'
import ServicePackages from './pages/services/ServicePackages'
import ServicePackageForm from './pages/services/ServicePackageForm'
import ServicePackageDetail from './pages/services/ServicePackageDetail'
import Appointments from './pages/appointments/Appointments'
import AppointmentForm from './pages/appointments/AppointmentForm'
import AppointmentDetail from './pages/appointments/AppointmentDetail'
import Settings from './pages/Settings'
import Landing from './pages/Landing'
import Roadmap from './pages/Roadmap'
import Dashboard from './pages/Dashboard'
import { getSession, deleteSession } from './lib/auth.js'
import { canModify } from './lib/permissions.js'
import sql from './lib/neon'
function App() {
  const { t } = useTranslation()
  const [currentPage, setCurrentPage] = useState('landing')
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
  const [staffFormStaff, setStaffFormStaff] = useState(null)
  const [staffRefreshKey, setStaffRefreshKey] = useState(0)
  const [staffDetailId, setStaffDetailId] = useState(null)
  const [companyAccountsRefreshKey, setCompanyAccountsRefreshKey] = useState(0)
  const [companyAccountFormAccount, setCompanyAccountFormAccount] = useState(null)
  const [companyAccountDetailId, setCompanyAccountDetailId] = useState(null)
  const [thirdPartiesRefreshKey, setThirdPartiesRefreshKey] = useState(0)
  const [thirdPartyFormItem, setThirdPartyFormItem] = useState(null)
  const [thirdPartyDetailId, setThirdPartyDetailId] = useState(null)
  const [transactionsRefreshKey, setTransactionsRefreshKey] = useState(0)
  const [transactionFormTransaction, setTransactionFormTransaction] = useState(null)
  const [transactionDetailId, setTransactionDetailId] = useState(null)
  const [orderDetailId, setOrderDetailId] = useState(null)
  const [orderDetailBackPage, setOrderDetailBackPage] = useState('customers')
  const [orderDetailBackId, setOrderDetailBackId] = useState(null)
  const [productsRefreshKey, setProductsRefreshKey] = useState(0)
  const [productFormProduct, setProductFormProduct] = useState(null)
  const [productDetailId, setProductDetailId] = useState(null)
  const [ordersRefreshKey, setOrdersRefreshKey] = useState(0)
  const [orderFormOrder, setOrderFormOrder] = useState(null)
  const [orderFormCustomer, setOrderFormCustomer] = useState(null)
  const [servicesRefreshKey, setServicesRefreshKey] = useState(0)
  const [serviceFormService, setServiceFormService] = useState(null)
  const [serviceDetailId, setServiceDetailId] = useState(null)
  const [servicePackagesRefreshKey, setServicePackagesRefreshKey] = useState(0)
  const [servicePackageFormPackage, setServicePackageFormPackage] = useState(null)
  const [servicePackageFormService, setServicePackageFormService] = useState(null)
  const [servicePackageDetailId, setServicePackageDetailId] = useState(null)
  const [servicePackageDetailBackPage, setServicePackageDetailBackPage] = useState('servicePackages')
  const [servicePackageDetailBackId, setServicePackageDetailBackId] = useState(null)
  const [appointmentsRefreshKey, setAppointmentsRefreshKey] = useState(0)
  const [appointmentFormAppointment, setAppointmentFormAppointment] = useState(null)
  const [appointmentFormCustomer, setAppointmentFormCustomer] = useState(null)
  const [appointmentDetailId, setAppointmentDetailId] = useState(null)
  const [usersRefreshKey, setUsersRefreshKey] = useState(0)
  const [userFormUser, setUserFormUser] = useState(null)

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
    setCurrentPage('dashboard')
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
      setCurrentPage('landing')
    }
  }

  const handleNavigate = (page) => {
    // Allow navigation to public pages (landing, roadmap) even when not authenticated
    if (page === 'landing' || page === 'roadmap') {
      setCurrentPage(page)
      setIsSidebarOpen(false)
      return
    }
    // For protected pages, check authentication
    if (!isAuthenticated && page !== 'login' && page !== 'signup') {
      setCurrentPage('login')
      return
    }
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

  const openOrders = () => {
    setCurrentPage('orders')
  }

  const openOrderForm = (order = null, customer = null) => {
    setOrderFormOrder(order)
    setOrderFormCustomer(customer)
    setCurrentPage('orderForm')
  }

  const handleOrderFormSaved = () => {
    setOrderFormOrder(null)
    setOrderFormCustomer(null)
    setOrdersRefreshKey((prev) => prev + 1)
    if (orderFormOrder) {
      // After editing, go to order detail
      setOrderDetailId(orderFormOrder.id)
      setCurrentPage('orderDetail')
    } else {
      // After creating, go to orders list
      setCurrentPage('orders')
    }
  }

  const handleOrderFormCancel = () => {
    setOrderFormOrder(null)
    setOrderFormCustomer(null)
    if (orderFormOrder) {
      // If editing, go back to order detail
      setOrderDetailId(orderFormOrder.id)
      setCurrentPage('orderDetail')
    } else if (orderFormCustomer) {
      // If creating from customer detail, go back to customer
      setCustomerDetailId(orderFormCustomer.id)
      setCurrentPage('customerDetail')
    } else {
      // Otherwise, go to orders list
      setCurrentPage('orders')
    }
  }

  const openOrderDetail = (order, backPage = 'customers', backId = null) => {
    setOrderDetailId(order.id)
    setOrderDetailBackPage(backPage)
    setOrderDetailBackId(backId)
    setCurrentPage('orderDetail')
  }

  const handleOrderDetailBack = () => {
    setOrderDetailId(null)
    if (orderDetailBackPage === 'customerDetail' && orderDetailBackId) {
      setCustomerDetailId(orderDetailBackId)
      setCurrentPage('customerDetail')
    } else if (orderDetailBackPage === 'orders') {
      setCurrentPage('orders')
    } else {
      setCurrentPage(orderDetailBackPage || 'customers')
    }
    setOrderDetailBackPage('customers')
    setOrderDetailBackId(null)
  }

  const handleOrderDetailEdit = (order) => {
    openOrderForm(order)
  }

  const handleOrderDetailDelete = () => {
    // Refresh the orders list
    setOrdersRefreshKey((prev) => prev + 1)
    // Refresh the customer detail if we came from there
    if (orderDetailBackPage === 'customerDetail' && orderDetailBackId) {
      // Could trigger a refresh here if needed
    }
    handleOrderDetailBack()
  }

  const openProductForm = (product = null) => {
    setProductFormProduct(product)
    setCurrentPage('productForm')
  }

  const handleProductFormSaved = () => {
    setProductsRefreshKey((prev) => prev + 1)
    setProductFormProduct(null)
    setCurrentPage('products')
  }

  const handleProductFormCancel = () => {
    setProductFormProduct(null)
    setCurrentPage('products')
  }

  const openProductDetail = (product) => {
    setProductDetailId(product.id)
    setCurrentPage('productDetail')
  }

  const handleProductDetailBack = () => {
    setProductDetailId(null)
    setCurrentPage('products')
  }

  const handleProductDetailEdit = (product) => {
    setProductFormProduct(product)
    setProductDetailId(null)
    setCurrentPage('productForm')
  }

  const handleProductDetailDelete = () => {
    setProductsRefreshKey((prev) => prev + 1)
    setProductDetailId(null)
    setCurrentPage('products')
  }

  const openServiceForm = (service = null) => {
    setServiceFormService(service)
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

  const handleServiceDetailAddPackage = (service) => {
    setServicePackageFormService(service)
    setServiceDetailId(null)
    setCurrentPage('servicePackageForm')
  }

  const handleServiceDetailViewPackage = (pkg) => {
    setServicePackageDetailId(pkg.id)
    setServicePackageDetailBackPage('serviceDetail')
    setServicePackageDetailBackId(serviceDetailId)
    setCurrentPage('servicePackageDetail')
  }

  const openServicePackages = () => {
    setCurrentPage('servicePackages')
  }

  const openServicePackageForm = (pkg = null, service = null) => {
    setServicePackageFormPackage(pkg)
    setServicePackageFormService(service)
    setCurrentPage('servicePackageForm')
  }

  const handleServicePackageFormSaved = () => {
    setServicePackagesRefreshKey((prev) => prev + 1)
    setServicesRefreshKey((prev) => prev + 1) // Refresh services too in case package count changed
    setServicePackageFormPackage(null)
    setServicePackageFormService(null)
    // If we came from service detail, go back there
    if (serviceDetailId || servicePackageFormService) {
      const backToServiceId = serviceDetailId || servicePackageFormService?.id
      if (backToServiceId) {
        setServiceDetailId(backToServiceId)
        setCurrentPage('serviceDetail')
      } else {
        setCurrentPage('servicePackages')
      }
    } else {
      setCurrentPage('servicePackages')
    }
  }

  const handleServicePackageFormCancel = () => {
    const backToServiceId = serviceDetailId || servicePackageFormService?.id
    setServicePackageFormPackage(null)
    setServicePackageFormService(null)
    if (backToServiceId) {
      setServiceDetailId(backToServiceId)
      setCurrentPage('serviceDetail')
    } else {
      setCurrentPage('servicePackages')
    }
  }

  const openServicePackageDetail = (pkg, backPage = 'servicePackages', backId = null) => {
    setServicePackageDetailId(pkg.id)
    setServicePackageDetailBackPage(backPage)
    setServicePackageDetailBackId(backId)
    setCurrentPage('servicePackageDetail')
  }

  const handleServicePackageDetailBack = () => {
    setServicePackageDetailId(null)
    if (servicePackageDetailBackPage === 'serviceDetail' && servicePackageDetailBackId) {
      setServiceDetailId(servicePackageDetailBackId)
      setCurrentPage('serviceDetail')
    } else if (servicePackageDetailBackPage === 'servicePackages') {
      setCurrentPage('servicePackages')
    } else {
      setCurrentPage(servicePackageDetailBackPage || 'servicePackages')
    }
    setServicePackageDetailBackPage('servicePackages')
    setServicePackageDetailBackId(null)
  }

  const handleServicePackageDetailEdit = (pkg) => {
    setServicePackageFormPackage(pkg)
    setServicePackageDetailId(null)
    setCurrentPage('servicePackageForm')
  }

  const handleServicePackageDetailDelete = () => {
    setServicePackagesRefreshKey((prev) => prev + 1)
    setServicesRefreshKey((prev) => prev + 1)
    setServicePackageDetailId(null)
    // If we came from service detail, go back there
    if (servicePackageDetailBackPage === 'serviceDetail' && servicePackageDetailBackId) {
      setServiceDetailId(servicePackageDetailBackId)
      setCurrentPage('serviceDetail')
    } else {
      setCurrentPage(servicePackageDetailBackPage || 'servicePackages')
    }
    setServicePackageDetailBackPage('servicePackages')
    setServicePackageDetailBackId(null)
  }

  const handleServicePackageDetailViewService = (service) => {
    setServiceDetailId(service.id)
    setServicePackageDetailId(null)
    setCurrentPage('serviceDetail')
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

  const handleInstructorDetailDelete = async () => {
    if (!instructorDetailId) return
    if (!window.confirm(t('instructors.confirm.delete', 'Are you sure you want to delete this instructor?'))) return
    
    try {
      await sql`DELETE FROM instructors WHERE id = ${instructorDetailId}`
      setInstructorsRefreshKey((prev) => prev + 1)
      setInstructorDetailId(null)
      setCurrentPage('instructors')
    } catch (err) {
      console.error('Failed to delete instructor:', err)
      alert(t('instructors.error.delete', 'Failed to delete instructor'))
    }
  }

  const openStaffForm = (staff = null) => {
    setStaffFormStaff(staff)
    setCurrentPage('staffForm')
  }

  const handleStaffFormSaved = () => {
    setStaffRefreshKey((prev) => prev + 1)
    setStaffFormStaff(null)
    setCurrentPage('staff')
  }

  const handleStaffFormCancel = () => {
    setStaffFormStaff(null)
    setCurrentPage('staff')
  }

  const openStaffDetail = (staff) => {
    setStaffDetailId(staff.id)
    setCurrentPage('staffDetail')
  }

  const handleStaffDetailBack = () => {
    setStaffDetailId(null)
    setCurrentPage('staff')
  }

  const handleStaffDetailEdit = (staff) => {
    setStaffFormStaff(staff)
    setStaffDetailId(null)
    setCurrentPage('staffForm')
  }

  const handleStaffDetailDelete = () => {
    setStaffRefreshKey((prev) => prev + 1)
    setStaffDetailId(null)
    setCurrentPage('staff')
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

  const openAppointmentForm = (appointment = null, customer = null) => {
    setAppointmentFormAppointment(appointment)
    setAppointmentFormCustomer(customer)
    setCurrentPage('appointmentForm')
  }

  const handleAppointmentFormSaved = () => {
    setAppointmentFormAppointment(null)
    const savedCustomer = appointmentFormCustomer
    setAppointmentFormCustomer(null)
    setAppointmentsRefreshKey((prev) => prev + 1)
    // If we were adding from customer detail, go back to customer detail
    if (savedCustomer) {
      setCustomerDetailId(savedCustomer.id)
      setCurrentPage('customerDetail')
    } else {
      setCurrentPage('appointments')
    }
  }

  const handleAppointmentFormCancel = () => {
    setAppointmentFormAppointment(null)
    const cancelledCustomer = appointmentFormCustomer
    setAppointmentFormCustomer(null)
    // If we were adding from customer detail, go back to customer detail
    if (cancelledCustomer) {
      setCustomerDetailId(cancelledCustomer.id)
      setCurrentPage('customerDetail')
    } else {
      setCurrentPage('appointments')
    }
  }

  const handleAppointmentView = (appointment) => {
    setAppointmentDetailId(appointment.id)
    setCurrentPage('appointmentDetail')
  }

  const handleAppointmentEdit = (appointment) => {
    openAppointmentForm(appointment)
  }

  const handleAppointmentDetailBack = () => {
    setAppointmentDetailId(null)
    setCurrentPage('appointments')
  }

  const handleAppointmentDetailEdit = (appointment) => {
    openAppointmentForm(appointment)
  }

  const handleAppointmentDetailDelete = () => {
    setAppointmentsRefreshKey((prev) => prev + 1)
    setAppointmentDetailId(null)
    setCurrentPage('appointments')
  }

  const handleUserFormSaved = () => {
    setUsersRefreshKey((prev) => prev + 1)
    setUserFormUser(null)
    // Stay on settings page
  }

  const handleUserFormCancel = () => {
    setUserFormUser(null)
    // Stay on settings page
  }


  const closeSidebar = () => {
    setIsSidebarOpen(false)
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return (
          <Dashboard
            user={user}
            onNavigate={handleNavigate}
            onViewOrder={(order) => openOrderDetail(order, 'dashboard')}
            onViewTransaction={(transaction) => openTransactionDetail(transaction)}
            onViewAppointment={(appointment) => handleAppointmentView(appointment)}
            onViewCustomer={(customer) => openCustomerDetail(customer)}
          />
        )
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
      case 'staff':
        return (
          <Staff
            refreshKey={staffRefreshKey}
            user={user}
            onAddStaff={() => openStaffForm(null)}
            onEditStaff={(staff) => openStaffForm(staff)}
            onViewStaff={(staff) => openStaffDetail(staff)}
          />
        )
      case 'customerDetail':
        return (
          <CustomerDetail
            customerId={customerDetailId}
            onBack={handleCustomerDetailBack}
            onEdit={handleCustomerDetailEdit}
            onDelete={handleCustomerDetailDelete}
            onViewAppointment={handleAppointmentView}
            onAddAppointment={(customer) => openAppointmentForm(null, customer)}
            onAddTransaction={(customer) => {
              const transaction = {
                destination_entity_type: 'customer',
                destination_entity_id: customer.id
              }
              openTransactionForm(transaction)
            }}
            onAddOrder={(customer) => openOrderForm(null, customer)}
            onViewOrder={(order) => openOrderDetail(order, 'customerDetail', customerDetailId)}
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
            onDelete={handleInstructorDetailDelete}
            user={user}
          />
        )
      case 'staffForm':
        return (
          <StaffForm
            staff={staffFormStaff}
            onCancel={handleStaffFormCancel}
            onSaved={handleStaffFormSaved}
          />
        )
      case 'staffDetail':
        return (
          <StaffDetail
            staffId={staffDetailId}
            onBack={handleStaffDetailBack}
            onEdit={(staff) => handleStaffDetailEdit(staff)}
            onDelete={handleStaffDetailDelete}
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
      case 'orders':
        return (
          <Orders
            refreshKey={ordersRefreshKey}
            user={user}
            onAddOrder={() => openOrderForm(null)}
            onEditOrder={(order) => openOrderDetail(order, 'orders')}
            onViewOrder={(order) => openOrderDetail(order, 'orders')}
          />
        )
      case 'orderForm':
        return (
          <OrderForm
            order={orderFormOrder}
            customer={orderFormCustomer}
            onCancel={handleOrderFormCancel}
            onSaved={handleOrderFormSaved}
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
      case 'products':
        return (
          <Products
            refreshKey={productsRefreshKey}
            user={user}
            onAddProduct={() => openProductForm(null)}
            onEditProduct={(product) => openProductForm(product)}
            onViewProduct={(product) => openProductDetail(product)}
          />
        )
      case 'productForm':
        return (
          <ProductForm
            product={productFormProduct}
            onCancel={handleProductFormCancel}
            onSaved={handleProductFormSaved}
          />
        )
      case 'productDetail':
        return (
          <ProductDetail
            productId={productDetailId}
            onBack={handleProductDetailBack}
            onEdit={handleProductDetailEdit}
            onDelete={handleProductDetailDelete}
            user={user}
          />
        )
      case 'services':
        return (
          <Services
            refreshKey={servicesRefreshKey}
            user={user}
            onAddService={() => openServiceForm(null)}
            onEditService={(service) => openServiceForm(service)}
            onViewService={(service) => openServiceDetail(service)}
          />
        )
      case 'serviceForm':
        return (
          <ServiceForm
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
            onEdit={handleServiceDetailEdit}
            onDelete={handleServiceDetailDelete}
            onAddPackage={handleServiceDetailAddPackage}
            onViewPackage={handleServiceDetailViewPackage}
            user={user}
          />
        )
      case 'servicePackages':
        return (
          <ServicePackages
            refreshKey={servicePackagesRefreshKey}
            user={user}
            onAddPackage={() => openServicePackageForm(null, null)}
            onEditPackage={(pkg) => openServicePackageForm(pkg, null)}
            onViewPackage={(pkg) => openServicePackageDetail(pkg, 'servicePackages')}
          />
        )
      case 'servicePackageForm':
        return (
          <ServicePackageForm
            package={servicePackageFormPackage}
            service={servicePackageFormService}
            onCancel={handleServicePackageFormCancel}
            onSaved={handleServicePackageFormSaved}
          />
        )
      case 'servicePackageDetail':
        return (
          <ServicePackageDetail
            packageId={servicePackageDetailId}
            onBack={handleServicePackageDetailBack}
            onEdit={handleServicePackageDetailEdit}
            onDelete={handleServicePackageDetailDelete}
            onViewService={handleServicePackageDetailViewService}
            user={user}
          />
        )
      case 'appointments':
        return (
          <Appointments
            refreshKey={appointmentsRefreshKey}
            user={user}
            onAddAppointment={() => openAppointmentForm(null)}
            onViewAppointment={handleAppointmentView}
            onEditAppointment={handleAppointmentEdit}
          />
        )
      case 'appointmentForm':
        return (
          <AppointmentForm
            appointment={appointmentFormAppointment}
            customer={appointmentFormCustomer}
            onCancel={handleAppointmentFormCancel}
            onSaved={handleAppointmentFormSaved}
          />
        )
      case 'appointmentDetail':
        return (
          <AppointmentDetail
            appointmentId={appointmentDetailId}
            onBack={handleAppointmentDetailBack}
            onEdit={handleAppointmentDetailEdit}
            onDelete={handleAppointmentDetailDelete}
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
      case 'settings':
        return (
          <Settings
            user={user}
            usersRefreshKey={usersRefreshKey}
            userFormUser={userFormUser}
            onUserFormSaved={handleUserFormSaved}
            onUserFormCancel={handleUserFormCancel}
          />
        )
      case 'landing':
        return <Landing onNavigate={handleNavigate} isAuthenticated={isAuthenticated} />
      case 'roadmap':
        return <Roadmap />
      default:
        return <Dashboard
          user={user}
          onNavigate={handleNavigate}
          onViewOrder={(order) => openOrderDetail(order, 'dashboard')}
          onViewTransaction={(transaction) => openTransactionDetail(transaction)}
          onViewAppointment={(appointment) => handleAppointmentView(appointment)}
          onViewCustomer={(customer) => openCustomerDetail(customer)}
        />
    }
  }

  // Show loading state while checking session
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-gray-600">{t('common.loading', 'Loading...')}</div>
      </div>
    )
  }

  // Show public pages (landing, roadmap) or login/signup if not authenticated
  if (!isAuthenticated) {
    // Show public pages
    if (currentPage === 'landing') {
      return <Landing onNavigate={handleNavigate} isAuthenticated={false} />
    }
    if (currentPage === 'roadmap') {
      return <Roadmap />
    }
    // Show login/signup
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
        onNavigate={handleNavigate}
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


