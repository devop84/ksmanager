import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import Sidebar from './components/layout/Sidebar'
import Customers from './pages/customers/Customers'
import Hotels from './pages/hotels/Hotels'
import Agencies from './pages/agencies/Agencies'
import Instructors from './pages/instructors/Instructors'
import Staff from './pages/staff/Staff'
import CustomerForm from './pages/customers/CustomerForm'
// import CustomerDetail from './pages/customers/CustomerDetail' // Disabled - replaced with CustomerDetail2
import CustomerDetail2 from './pages/customers/CustomerDetail2'
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
import Calendar from './pages/calendar/Calendar'
import Settings from './pages/Settings'
import Landing from './pages/Landing'
import Roadmap from './pages/Roadmap'
import Dashboard from './pages/Dashboard'
import MonthlyReport from './pages/reports/MonthlyReport'
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
  const [customerFormBackPage, setCustomerFormBackPage] = useState('customers')
  const [customerFormBackId, setCustomerFormBackId] = useState(null)
  const [customerDetailId, setCustomerDetailId] = useState(null)
  const [customersRefreshKey, setCustomersRefreshKey] = useState(0)
  const [hotelFormHotel, setHotelFormHotel] = useState(null)
  const [hotelFormBackPage, setHotelFormBackPage] = useState('hotels')
  const [hotelFormBackId, setHotelFormBackId] = useState(null)
  const [hotelDetailId, setHotelDetailId] = useState(null)
  const [hotelsRefreshKey, setHotelsRefreshKey] = useState(0)
  const [agencyFormAgency, setAgencyFormAgency] = useState(null)
  const [agencyFormBackPage, setAgencyFormBackPage] = useState('agencies')
  const [agencyFormBackId, setAgencyFormBackId] = useState(null)
  const [agencyDetailId, setAgencyDetailId] = useState(null)
  const [agenciesRefreshKey, setAgenciesRefreshKey] = useState(0)
  const [instructorFormInstructor, setInstructorFormInstructor] = useState(null)
  const [instructorFormBackPage, setInstructorFormBackPage] = useState('instructors')
  const [instructorFormBackId, setInstructorFormBackId] = useState(null)
  const [instructorsRefreshKey, setInstructorsRefreshKey] = useState(0)
  const [instructorDetailId, setInstructorDetailId] = useState(null)
  const [staffFormStaff, setStaffFormStaff] = useState(null)
  const [staffFormBackPage, setStaffFormBackPage] = useState('staff')
  const [staffFormBackId, setStaffFormBackId] = useState(null)
  const [staffRefreshKey, setStaffRefreshKey] = useState(0)
  const [staffDetailId, setStaffDetailId] = useState(null)
  const [companyAccountsRefreshKey, setCompanyAccountsRefreshKey] = useState(0)
  const [companyAccountFormAccount, setCompanyAccountFormAccount] = useState(null)
  const [companyAccountFormBackPage, setCompanyAccountFormBackPage] = useState('companyAccounts')
  const [companyAccountFormBackId, setCompanyAccountFormBackId] = useState(null)
  const [companyAccountDetailId, setCompanyAccountDetailId] = useState(null)
  const [thirdPartiesRefreshKey, setThirdPartiesRefreshKey] = useState(0)
  const [thirdPartyFormItem, setThirdPartyFormItem] = useState(null)
  const [thirdPartyFormBackPage, setThirdPartyFormBackPage] = useState('thirdParties')
  const [thirdPartyFormBackId, setThirdPartyFormBackId] = useState(null)
  const [thirdPartyDetailId, setThirdPartyDetailId] = useState(null)
  const [transactionsRefreshKey, setTransactionsRefreshKey] = useState(0)
  const [transactionFormTransaction, setTransactionFormTransaction] = useState(null)
  const [transactionFormBackPage, setTransactionFormBackPage] = useState('transactions')
  const [transactionFormBackId, setTransactionFormBackId] = useState(null)
  const [transactionDetailId, setTransactionDetailId] = useState(null)
  const [orderDetailId, setOrderDetailId] = useState(null)
  const [orderDetailBackPage, setOrderDetailBackPage] = useState('customers')
  const [orderDetailBackId, setOrderDetailBackId] = useState(null)
  const [productsRefreshKey, setProductsRefreshKey] = useState(0)
  const [productFormProduct, setProductFormProduct] = useState(null)
  const [productFormBackPage, setProductFormBackPage] = useState('products')
  const [productFormBackId, setProductFormBackId] = useState(null)
  const [productDetailId, setProductDetailId] = useState(null)
  const [ordersRefreshKey, setOrdersRefreshKey] = useState(0)
  const [orderFormOrder, setOrderFormOrder] = useState(null)
  const [orderFormCustomer, setOrderFormCustomer] = useState(null)
  const [orderFormBackPage, setOrderFormBackPage] = useState('orders')
  const [orderFormBackId, setOrderFormBackId] = useState(null)
  const [servicesRefreshKey, setServicesRefreshKey] = useState(0)
  const [serviceFormService, setServiceFormService] = useState(null)
  const [serviceFormBackPage, setServiceFormBackPage] = useState('services')
  const [serviceFormBackId, setServiceFormBackId] = useState(null)
  const [serviceDetailId, setServiceDetailId] = useState(null)
  const [servicePackagesRefreshKey, setServicePackagesRefreshKey] = useState(0)
  const [servicePackageFormPackage, setServicePackageFormPackage] = useState(null)
  const [servicePackageFormService, setServicePackageFormService] = useState(null)
  const [servicePackageFormBackPage, setServicePackageFormBackPage] = useState('servicePackages')
  const [servicePackageFormBackId, setServicePackageFormBackId] = useState(null)
  const [servicePackageDetailId, setServicePackageDetailId] = useState(null)
  const [servicePackageDetailBackPage, setServicePackageDetailBackPage] = useState('servicePackages')
  const [servicePackageDetailBackId, setServicePackageDetailBackId] = useState(null)
  const [appointmentsRefreshKey, setAppointmentsRefreshKey] = useState(0)
  const [appointmentFormAppointment, setAppointmentFormAppointment] = useState(null)
  const [appointmentFormCustomer, setAppointmentFormCustomer] = useState(null)
  const [appointmentFormBackPage, setAppointmentFormBackPage] = useState('appointments')
  const [appointmentFormBackId, setAppointmentFormBackId] = useState(null)
  const [appointmentDetailId, setAppointmentDetailId] = useState(null)
  const [appointmentDetailBackPage, setAppointmentDetailBackPage] = useState('appointments')
  const [customerDetailBackPage, setCustomerDetailBackPage] = useState('customers')
  const [instructorDetailBackPage, setInstructorDetailBackPage] = useState('instructors')
  const [usersRefreshKey, setUsersRefreshKey] = useState(0)
  const [userFormUser, setUserFormUser] = useState(null)

  // Helper function to get page from URL path
  const getPageFromPath = (pathname) => {
    const path = pathname.replace(/^\/+|\/+$/g, '') || 'landing'
    // Map URL paths to page names
    const pathToPage = {
      '': 'landing',
      'landing': 'landing',
      'login': 'login',
      'signup': 'signup',
      'dashboard': 'dashboard',
      'customers': 'customers',
      'hotels': 'hotels',
      'agencies': 'agencies',
      'instructors': 'instructors',
      'staff': 'staff',
      'company-accounts': 'companyAccounts',
      'third-parties': 'thirdParties',
      'transactions': 'transactions',
      'orders': 'orders',
      'products': 'products',
      'services': 'services',
      'service-packages': 'servicePackages',
      'appointments': 'appointments',
      'calendar': 'calendar',
      'settings': 'settings',
      'roadmap': 'roadmap',
      'monthly-report': 'monthlyReport'
    }
    return pathToPage[path] || 'landing'
  }

  // Helper function to get URL path from page name
  const getPathFromPage = (page) => {
    // Map detail and form pages to their base pages
    const basePageMap = {
      'customerDetail': 'customers',
      'customerForm': 'customers',
      'hotelDetail': 'hotels',
      'hotelForm': 'hotels',
      'agencyDetail': 'agencies',
      'agencyForm': 'agencies',
      'instructorDetail': 'instructors',
      'instructorForm': 'instructors',
      'staffDetail': 'staff',
      'staffForm': 'staff',
      'companyAccountDetail': 'companyAccounts',
      'companyAccountForm': 'companyAccounts',
      'thirdPartyDetail': 'thirdParties',
      'thirdPartyForm': 'thirdParties',
      'transactionDetail': 'transactions',
      'transactionForm': 'transactions',
      'orderDetail': 'orders',
      'orderForm': 'orders',
      'productDetail': 'products',
      'productForm': 'products',
      'serviceDetail': 'services',
      'serviceForm': 'services',
      'servicePackageDetail': 'servicePackages',
      'servicePackageForm': 'servicePackages',
      'appointmentDetail': 'appointments',
      'appointmentForm': 'appointments'
    }
    
    // Get the base page if it's a detail/form page
    const basePage = basePageMap[page] || page
    
    const pageToPath = {
      'landing': '/',
      'login': '/login',
      'signup': '/signup',
      'dashboard': '/dashboard',
      'customers': '/customers',
      'hotels': '/hotels',
      'agencies': '/agencies',
      'instructors': '/instructors',
      'staff': '/staff',
      'companyAccounts': '/company-accounts',
      'thirdParties': '/third-parties',
      'transactions': '/transactions',
      'orders': '/orders',
      'products': '/products',
      'services': '/services',
      'servicePackages': '/service-packages',
      'appointments': '/appointments',
      'calendar': '/calendar',
      'settings': '/settings',
      'roadmap': '/roadmap',
      'monthlyReport': '/monthly-report'
    }
    return pageToPath[basePage] || '/'
  }

  // Initialize page from URL on mount
  useEffect(() => {
    const pathname = window.location.pathname
    const pageFromUrl = getPageFromPath(pathname)
    if (pageFromUrl !== currentPage) {
      setCurrentPage(pageFromUrl)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Capture current navigation state for history
  const captureNavigationState = () => {
    return {
      page: currentPage,
      customerDetailId,
      customerDetailBackPage,
      hotelDetailId,
      hotelFormBackPage,
      agencyDetailId,
      agencyFormBackPage,
      instructorDetailId,
      instructorDetailBackPage,
      staffDetailId,
      staffFormBackPage,
      companyAccountDetailId,
      companyAccountFormBackPage,
      thirdPartyDetailId,
      thirdPartyFormBackPage,
      transactionDetailId,
      transactionFormBackPage,
      orderDetailId,
      orderDetailBackPage,
      orderDetailBackId,
      productDetailId,
      productFormBackPage,
      serviceDetailId,
      serviceFormBackPage,
      servicePackageDetailId,
      servicePackageDetailBackPage,
      servicePackageDetailBackId,
      appointmentDetailId,
      appointmentDetailBackPage
    }
  }

  // Restore navigation state from history
  const restoreNavigationState = (state) => {
    if (!state) return
    
    if (state.customerDetailId !== undefined) setCustomerDetailId(state.customerDetailId)
    if (state.customerDetailBackPage !== undefined) setCustomerDetailBackPage(state.customerDetailBackPage)
    if (state.hotelDetailId !== undefined) setHotelDetailId(state.hotelDetailId)
    if (state.hotelFormBackPage !== undefined) setHotelFormBackPage(state.hotelFormBackPage)
    if (state.agencyDetailId !== undefined) setAgencyDetailId(state.agencyDetailId)
    if (state.agencyFormBackPage !== undefined) setAgencyFormBackPage(state.agencyFormBackPage)
    if (state.instructorDetailId !== undefined) setInstructorDetailId(state.instructorDetailId)
    if (state.instructorDetailBackPage !== undefined) setInstructorDetailBackPage(state.instructorDetailBackPage)
    if (state.staffDetailId !== undefined) setStaffDetailId(state.staffDetailId)
    if (state.staffFormBackPage !== undefined) setStaffFormBackPage(state.staffFormBackPage)
    if (state.companyAccountDetailId !== undefined) setCompanyAccountDetailId(state.companyAccountDetailId)
    if (state.companyAccountFormBackPage !== undefined) setCompanyAccountFormBackPage(state.companyAccountFormBackPage)
    if (state.thirdPartyDetailId !== undefined) setThirdPartyDetailId(state.thirdPartyDetailId)
    if (state.thirdPartyFormBackPage !== undefined) setThirdPartyFormBackPage(state.thirdPartyFormBackPage)
    if (state.transactionDetailId !== undefined) setTransactionDetailId(state.transactionDetailId)
    if (state.transactionFormBackPage !== undefined) setTransactionFormBackPage(state.transactionFormBackPage)
    if (state.orderDetailId !== undefined) setOrderDetailId(state.orderDetailId)
    if (state.orderDetailBackPage !== undefined) setOrderDetailBackPage(state.orderDetailBackPage)
    if (state.orderDetailBackId !== undefined) setOrderDetailBackId(state.orderDetailBackId)
    if (state.productDetailId !== undefined) setProductDetailId(state.productDetailId)
    if (state.productFormBackPage !== undefined) setProductFormBackPage(state.productFormBackPage)
    if (state.serviceDetailId !== undefined) setServiceDetailId(state.serviceDetailId)
    if (state.serviceFormBackPage !== undefined) setServiceFormBackPage(state.serviceFormBackPage)
    if (state.servicePackageDetailId !== undefined) setServicePackageDetailId(state.servicePackageDetailId)
    if (state.servicePackageDetailBackPage !== undefined) setServicePackageDetailBackPage(state.servicePackageDetailBackPage)
    if (state.servicePackageDetailBackId !== undefined) setServicePackageDetailBackId(state.servicePackageDetailBackId)
    if (state.appointmentDetailId !== undefined) setAppointmentDetailId(state.appointmentDetailId)
    if (state.appointmentDetailBackPage !== undefined) setAppointmentDetailBackPage(state.appointmentDetailBackPage)
  }

  // Track previous state to detect actual navigation changes
  const prevNavigationStateRef = useRef(null)

  // Sync URL with currentPage changes (but not on initial mount to avoid conflicts)
  useEffect(() => {
    // Skip if this is the initial render
    if (loading) return
    
    const path = getPathFromPage(currentPage)
    const navigationState = captureNavigationState()
    
    // Check if this is a real navigation change (not just a state update)
    const isNavigationChange = !prevNavigationStateRef.current || 
      prevNavigationStateRef.current.page !== currentPage ||
      prevNavigationStateRef.current.customerDetailId !== customerDetailId ||
      prevNavigationStateRef.current.orderDetailId !== orderDetailId ||
      prevNavigationStateRef.current.appointmentDetailId !== appointmentDetailId ||
      prevNavigationStateRef.current.servicePackageDetailId !== servicePackageDetailId
    
    if (window.location.pathname !== path) {
      // URL changed, always push new state
      window.history.pushState(navigationState, '', path)
      prevNavigationStateRef.current = navigationState
    } else if (isNavigationChange) {
      // Same URL but different page/context (e.g., navigating to detail page from list)
      // Push new state to create history entry
      window.history.pushState(navigationState, '', path)
      prevNavigationStateRef.current = navigationState
    } else {
      // Just a state update, replace current state
      window.history.replaceState(navigationState, '', path)
      prevNavigationStateRef.current = navigationState
    }
  }, [
    currentPage, loading, customerDetailId, customerDetailBackPage,
    hotelDetailId, hotelFormBackPage, agencyDetailId, agencyFormBackPage,
    instructorDetailId, instructorDetailBackPage, staffDetailId, staffFormBackPage,
    companyAccountDetailId, companyAccountFormBackPage, thirdPartyDetailId, thirdPartyFormBackPage,
    transactionDetailId, transactionFormBackPage, orderDetailId, orderDetailBackPage, orderDetailBackId,
    productDetailId, productFormBackPage, serviceDetailId, serviceFormBackPage,
    servicePackageDetailId, servicePackageDetailBackPage, servicePackageDetailBackId,
    appointmentDetailId, appointmentDetailBackPage
  ])

  // Listen to browser back/forward button
  useEffect(() => {
    const handlePopState = (event) => {
      const state = event.state
      if (state && state.page) {
        // Restore full navigation state
        restoreNavigationState(state)
        setCurrentPage(state.page)
      } else {
        // Fallback: just use URL
        const pathname = window.location.pathname
        const pageFromUrl = getPageFromPath(pathname)
        setCurrentPage(pageFromUrl)
      }
    }

    window.addEventListener('popstate', handlePopState)
    return () => {
      window.removeEventListener('popstate', handlePopState)
    }
  }, [])

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

  const openCustomerForm = (customer = null, backPage = 'customers', backId = null) => {
    setCustomerFormCustomer(customer)
    setCustomerFormBackPage(backPage)
    setCustomerFormBackId(backId)
    setCurrentPage('customerForm')
  }

  const openCustomerDetail = (customer, backPage = 'customers') => {
    setCustomerDetailId(customer.id)
    setCustomerDetailBackPage(backPage)
    setCurrentPage('customerDetail')
  }

  const handleCustomerFormSaved = () => {
    const backPage = customerFormBackPage
    const backId = customerFormBackId
    
    setCustomersRefreshKey((prev) => prev + 1)
    setCustomerFormCustomer(null)
    
    // Navigate back to where we came from
    if (backPage === 'customerDetail' && backId) {
      setCustomerDetailId(backId)
      setCurrentPage('customerDetail')
    } else {
      setCurrentPage(backPage || 'customers')
    }
    
    // Reset back page tracking
    setCustomerFormBackPage('customers')
    setCustomerFormBackId(null)
  }

  const handleCustomerFormCancel = () => {
    const backPage = customerFormBackPage
    const backId = customerFormBackId
    
    setCustomerFormCustomer(null)
    
    // Navigate back to where we came from
    if (backPage === 'customerDetail' && backId) {
      setCustomerDetailId(backId)
      setCurrentPage('customerDetail')
    } else {
      setCurrentPage(backPage || 'customers')
    }
    
    // Reset back page tracking
    setCustomerFormBackPage('customers')
    setCustomerFormBackId(null)
  }

  const handleCustomerDetailBack = () => {
    setCustomerDetailId(null)
    setCurrentPage(customerDetailBackPage || 'customers')
    setCustomerDetailBackPage('customers')
  }

  const handleCustomerDetailEdit = (customer) => {
    openCustomerForm(customer, 'customerDetail', customerDetailId)
  }

  const handleCustomerDetailDelete = () => {
    setCustomersRefreshKey((prev) => prev + 1)
    setCustomerDetailId(null)
    setCurrentPage(customerDetailBackPage || 'customers')
    setCustomerDetailBackPage('customers')
  }

  const openOrders = () => {
    setCurrentPage('orders')
  }

  const openOrderForm = (order = null, customer = null, backPage = 'orders', backId = null) => {
    setOrderFormOrder(order)
    setOrderFormCustomer(customer)
    setOrderFormBackPage(backPage)
    setOrderFormBackId(backId)
    setCurrentPage('orderForm')
  }

  const handleOrderFormSaved = () => {
    const wasEditing = !!orderFormOrder
    const wasFromCustomer = !!orderFormCustomer
    const customerId = orderFormCustomer?.id
    const backPage = orderFormBackPage
    const backId = orderFormBackId
    
    setOrderFormOrder(null)
    setOrderFormCustomer(null)
    setOrdersRefreshKey((prev) => prev + 1)
    
    // Navigate back to where we came from
    if (backPage === 'orderDetail' && backId) {
      // If we came from order detail, go back there
      setOrderDetailId(backId)
      setCurrentPage('orderDetail')
    } else if (wasEditing) {
      // After editing, go to order detail
      setOrderDetailId(orderFormOrder.id)
      setCurrentPage('orderDetail')
    } else if (wasFromCustomer && customerId) {
      // After creating from customer detail, go back to customer detail
      setCustomerDetailId(customerId)
      setCurrentPage('customerDetail')
    } else {
      // Otherwise, go to orders list
      setCurrentPage(backPage || 'orders')
    }
    
    // Reset back page tracking
    setOrderFormBackPage('orders')
    setOrderFormBackId(null)
  }

  const handleOrderFormCancel = () => {
    const wasEditing = !!orderFormOrder
    const wasFromCustomer = !!orderFormCustomer
    const customerId = orderFormCustomer?.id
    const backPage = orderFormBackPage
    const backId = orderFormBackId
    
    setOrderFormOrder(null)
    setOrderFormCustomer(null)
    
    // Navigate back to where we came from
    if (backPage === 'orderDetail' && backId) {
      // If we came from order detail, go back there
      setOrderDetailId(backId)
      setCurrentPage('orderDetail')
    } else if (wasEditing) {
      // If editing, go back to order detail
      setOrderDetailId(orderFormOrder.id)
      setCurrentPage('orderDetail')
    } else if (wasFromCustomer && customerId) {
      // If creating from customer detail, go back to customer
      setCustomerDetailId(customerId)
      setCurrentPage('customerDetail')
    } else {
      // Otherwise, go to orders list
      setCurrentPage(backPage || 'orders')
    }
    
    // Reset back page tracking
    setOrderFormBackPage('orders')
    setOrderFormBackId(null)
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
    openOrderForm(order, null, 'orderDetail', orderDetailId)
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

  const openProductForm = (product = null, backPage = 'products', backId = null) => {
    setProductFormProduct(product)
    setProductFormBackPage(backPage)
    setProductFormBackId(backId)
    setCurrentPage('productForm')
  }

  const handleProductFormSaved = () => {
    const backPage = productFormBackPage
    const backId = productFormBackId
    
    setProductsRefreshKey((prev) => prev + 1)
    setProductFormProduct(null)
    
    if (backPage === 'productDetail' && backId) {
      setProductDetailId(backId)
      setCurrentPage('productDetail')
    } else {
      setCurrentPage(backPage || 'products')
    }
    
    setProductFormBackPage('products')
    setProductFormBackId(null)
  }

  const handleProductFormCancel = () => {
    const backPage = productFormBackPage
    const backId = productFormBackId
    
    setProductFormProduct(null)
    
    if (backPage === 'productDetail' && backId) {
      setProductDetailId(backId)
      setCurrentPage('productDetail')
    } else {
      setCurrentPage(backPage || 'products')
    }
    
    setProductFormBackPage('products')
    setProductFormBackId(null)
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
    openProductForm(product, 'productDetail', productDetailId)
  }

  const handleProductDetailDelete = () => {
    setProductsRefreshKey((prev) => prev + 1)
    setProductDetailId(null)
    setCurrentPage('products')
  }

  const openServiceForm = (service = null, backPage = 'services', backId = null) => {
    setServiceFormService(service)
    setServiceFormBackPage(backPage)
    setServiceFormBackId(backId)
    setCurrentPage('serviceForm')
  }

  const handleServiceFormSaved = () => {
    const backPage = serviceFormBackPage
    const backId = serviceFormBackId
    
    setServicesRefreshKey((prev) => prev + 1)
    setServiceFormService(null)
    
    if (backPage === 'serviceDetail' && backId) {
      setServiceDetailId(backId)
      setCurrentPage('serviceDetail')
    } else {
      setCurrentPage(backPage || 'services')
    }
    
    setServiceFormBackPage('services')
    setServiceFormBackId(null)
  }

  const handleServiceFormCancel = () => {
    const backPage = serviceFormBackPage
    const backId = serviceFormBackId
    
    setServiceFormService(null)
    
    if (backPage === 'serviceDetail' && backId) {
      setServiceDetailId(backId)
      setCurrentPage('serviceDetail')
    } else {
      setCurrentPage(backPage || 'services')
    }
    
    setServiceFormBackPage('services')
    setServiceFormBackId(null)
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
    openServiceForm(service, 'serviceDetail', serviceDetailId)
  }

  const handleServiceDetailDelete = () => {
    setServicesRefreshKey((prev) => prev + 1)
    setServiceDetailId(null)
    setCurrentPage('services')
  }

  const handleServiceDetailAddPackage = (service) => {
    openServicePackageForm(null, service, 'serviceDetail', serviceDetailId)
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

  const openServicePackageForm = (pkg = null, service = null, backPage = 'servicePackages', backId = null) => {
    setServicePackageFormPackage(pkg)
    setServicePackageFormService(service)
    setServicePackageFormBackPage(backPage)
    setServicePackageFormBackId(backId)
    setCurrentPage('servicePackageForm')
  }

  const handleServicePackageFormSaved = () => {
    const backPage = servicePackageFormBackPage
    const backId = servicePackageFormBackId
    
    setServicePackagesRefreshKey((prev) => prev + 1)
    setServicesRefreshKey((prev) => prev + 1) // Refresh services too in case package count changed
    setServicePackageFormPackage(null)
    setServicePackageFormService(null)
    
    // Navigate back to where we came from
    if (backPage === 'servicePackageDetail' && backId) {
      setServicePackageDetailId(backId)
      setCurrentPage('servicePackageDetail')
    } else if (backPage === 'serviceDetail' && backId) {
      setServiceDetailId(backId)
      setCurrentPage('serviceDetail')
    } else if (serviceDetailId || servicePackageFormService) {
      // Legacy support: if we came from service detail, go back there
      const backToServiceId = serviceDetailId || servicePackageFormService?.id
      if (backToServiceId) {
        setServiceDetailId(backToServiceId)
        setCurrentPage('serviceDetail')
      } else {
        setCurrentPage(backPage || 'servicePackages')
      }
    } else {
      setCurrentPage(backPage || 'servicePackages')
    }
    
    setServicePackageFormBackPage('servicePackages')
    setServicePackageFormBackId(null)
  }

  const handleServicePackageFormCancel = () => {
    const backPage = servicePackageFormBackPage
    const backId = servicePackageFormBackId
    
    setServicePackageFormPackage(null)
    setServicePackageFormService(null)
    
    // Navigate back to where we came from
    if (backPage === 'servicePackageDetail' && backId) {
      setServicePackageDetailId(backId)
      setCurrentPage('servicePackageDetail')
    } else if (backPage === 'serviceDetail' && backId) {
      setServiceDetailId(backId)
      setCurrentPage('serviceDetail')
    } else if (serviceDetailId || servicePackageFormService) {
      // Legacy support: if we came from service detail, go back there
      const backToServiceId = serviceDetailId || servicePackageFormService?.id
      if (backToServiceId) {
        setServiceDetailId(backToServiceId)
        setCurrentPage('serviceDetail')
      } else {
        setCurrentPage(backPage || 'servicePackages')
      }
    } else {
      setCurrentPage(backPage || 'servicePackages')
    }
    
    setServicePackageFormBackPage('servicePackages')
    setServicePackageFormBackId(null)
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
    openServicePackageForm(pkg, null, 'servicePackageDetail', servicePackageDetailId)
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


  const openHotelForm = (hotel = null, backPage = 'hotels', backId = null) => {
    setHotelFormHotel(hotel)
    setHotelFormBackPage(backPage)
    setHotelFormBackId(backId)
    setCurrentPage('hotelForm')
  }

  const handleHotelFormSaved = () => {
    const backPage = hotelFormBackPage
    const backId = hotelFormBackId
    
    setHotelsRefreshKey((prev) => prev + 1)
    setHotelFormHotel(null)
    
    if (backPage === 'hotelDetail' && backId) {
      setHotelDetailId(backId)
      setCurrentPage('hotelDetail')
    } else {
      setCurrentPage(backPage || 'hotels')
    }
    
    setHotelFormBackPage('hotels')
    setHotelFormBackId(null)
  }

  const handleHotelFormCancel = () => {
    const backPage = hotelFormBackPage
    const backId = hotelFormBackId
    
    setHotelFormHotel(null)
    
    if (backPage === 'hotelDetail' && backId) {
      setHotelDetailId(backId)
      setCurrentPage('hotelDetail')
    } else {
      setCurrentPage(backPage || 'hotels')
    }
    
    setHotelFormBackPage('hotels')
    setHotelFormBackId(null)
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
    openHotelForm(hotel, 'hotelDetail', hotelDetailId)
  }

  const handleHotelDetailDelete = () => {
    setHotelsRefreshKey((prev) => prev + 1)
    setHotelDetailId(null)
    setCurrentPage('hotels')
  }

  const openAgencyForm = (agency = null, backPage = 'agencies', backId = null) => {
    setAgencyFormAgency(agency)
    setAgencyFormBackPage(backPage)
    setAgencyFormBackId(backId)
    setCurrentPage('agencyForm')
  }

  const handleAgencyFormSaved = () => {
    const backPage = agencyFormBackPage
    const backId = agencyFormBackId
    
    setAgenciesRefreshKey((prev) => prev + 1)
    setAgencyFormAgency(null)
    
    if (backPage === 'agencyDetail' && backId) {
      setAgencyDetailId(backId)
      setCurrentPage('agencyDetail')
    } else {
      setCurrentPage(backPage || 'agencies')
    }
    
    setAgencyFormBackPage('agencies')
    setAgencyFormBackId(null)
  }

  const handleAgencyFormCancel = () => {
    const backPage = agencyFormBackPage
    const backId = agencyFormBackId
    
    setAgencyFormAgency(null)
    
    if (backPage === 'agencyDetail' && backId) {
      setAgencyDetailId(backId)
      setCurrentPage('agencyDetail')
    } else {
      setCurrentPage(backPage || 'agencies')
    }
    
    setAgencyFormBackPage('agencies')
    setAgencyFormBackId(null)
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
    openAgencyForm(agency, 'agencyDetail', agencyDetailId)
  }

  const handleAgencyDetailDelete = () => {
    setAgenciesRefreshKey((prev) => prev + 1)
    setAgencyDetailId(null)
    setCurrentPage('agencies')
  }

  const openInstructorForm = (instructor = null, backPage = 'instructors', backId = null) => {
    setInstructorFormInstructor(instructor)
    setInstructorFormBackPage(backPage)
    setInstructorFormBackId(backId)
    setCurrentPage('instructorForm')
  }

  const handleInstructorFormSaved = () => {
    const backPage = instructorFormBackPage
    const backId = instructorFormBackId
    
    setInstructorsRefreshKey((prev) => prev + 1)
    setInstructorFormInstructor(null)
    
    if (backPage === 'instructorDetail' && backId) {
      setInstructorDetailId(backId)
      setCurrentPage('instructorDetail')
    } else {
      setCurrentPage(backPage || 'instructors')
    }
    
    setInstructorFormBackPage('instructors')
    setInstructorFormBackId(null)
  }

  const handleInstructorFormCancel = () => {
    const backPage = instructorFormBackPage
    const backId = instructorFormBackId
    
    setInstructorFormInstructor(null)
    
    if (backPage === 'instructorDetail' && backId) {
      setInstructorDetailId(backId)
      setCurrentPage('instructorDetail')
    } else {
      setCurrentPage(backPage || 'instructors')
    }
    
    setInstructorFormBackPage('instructors')
    setInstructorFormBackId(null)
  }

  const openInstructorDetail = (instructor, backPage = 'instructors') => {
    setInstructorDetailId(instructor.id)
    setInstructorDetailBackPage(backPage)
    setCurrentPage('instructorDetail')
  }

  const handleInstructorDetailBack = () => {
    setInstructorDetailId(null)
    setCurrentPage(instructorDetailBackPage || 'instructors')
    setInstructorDetailBackPage('instructors')
  }

  const handleInstructorDetailDelete = async () => {
    if (!instructorDetailId) return
    if (!window.confirm(t('instructors.confirm.delete', 'Are you sure you want to delete this instructor?'))) return
    
    try {
      await sql`DELETE FROM instructors WHERE id = ${instructorDetailId}`
      setInstructorsRefreshKey((prev) => prev + 1)
      setInstructorDetailId(null)
      setCurrentPage(instructorDetailBackPage || 'instructors')
      setInstructorDetailBackPage('instructors')
    } catch (err) {
      console.error('Failed to delete instructor:', err)
      alert(t('instructors.error.delete', 'Failed to delete instructor'))
    }
  }

  const openStaffForm = (staff = null, backPage = 'staff', backId = null) => {
    setStaffFormStaff(staff)
    setStaffFormBackPage(backPage)
    setStaffFormBackId(backId)
    setCurrentPage('staffForm')
  }

  const handleStaffFormSaved = () => {
    const backPage = staffFormBackPage
    const backId = staffFormBackId
    
    setStaffRefreshKey((prev) => prev + 1)
    setStaffFormStaff(null)
    
    if (backPage === 'staffDetail' && backId) {
      setStaffDetailId(backId)
      setCurrentPage('staffDetail')
    } else {
      setCurrentPage(backPage || 'staff')
    }
    
    setStaffFormBackPage('staff')
    setStaffFormBackId(null)
  }

  const handleStaffFormCancel = () => {
    const backPage = staffFormBackPage
    const backId = staffFormBackId
    
    setStaffFormStaff(null)
    
    if (backPage === 'staffDetail' && backId) {
      setStaffDetailId(backId)
      setCurrentPage('staffDetail')
    } else {
      setCurrentPage(backPage || 'staff')
    }
    
    setStaffFormBackPage('staff')
    setStaffFormBackId(null)
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
    openStaffForm(staff, 'staffDetail', staffDetailId)
  }

  const handleStaffDetailDelete = async () => {
    if (!window.confirm(t('staff.confirm.delete', 'Are you sure you want to delete this staff member? This action cannot be undone.'))) {
      return
    }

    try {
      await sql`DELETE FROM staff WHERE id = ${staffDetailId}`
      setStaffRefreshKey((prev) => prev + 1)
      setStaffDetailId(null)
      setCurrentPage('staff')
    } catch (err) {
      console.error('Failed to delete staff:', err)
      alert(t('staff.error.delete', 'Unable to delete staff. Please try again.'))
    }
  }


  const openCompanyAccountForm = (account = null, backPage = 'companyAccounts', backId = null) => {
    setCompanyAccountFormAccount(account)
    setCompanyAccountFormBackPage(backPage)
    setCompanyAccountFormBackId(backId)
    setCurrentPage('companyAccountForm')
  }

  const handleCompanyAccountFormSaved = () => {
    const backPage = companyAccountFormBackPage
    const backId = companyAccountFormBackId
    
    setCompanyAccountsRefreshKey((prev) => prev + 1)
    setCompanyAccountFormAccount(null)
    
    if (backPage === 'companyAccountDetail' && backId) {
      setCompanyAccountDetailId(backId)
      setCurrentPage('companyAccountDetail')
    } else {
      setCurrentPage(backPage || 'companyAccounts')
    }
    
    setCompanyAccountFormBackPage('companyAccounts')
    setCompanyAccountFormBackId(null)
  }

  const handleCompanyAccountFormCancel = () => {
    const backPage = companyAccountFormBackPage
    const backId = companyAccountFormBackId
    
    setCompanyAccountFormAccount(null)
    
    if (backPage === 'companyAccountDetail' && backId) {
      setCompanyAccountDetailId(backId)
      setCurrentPage('companyAccountDetail')
    } else {
      setCurrentPage(backPage || 'companyAccounts')
    }
    
    setCompanyAccountFormBackPage('companyAccounts')
    setCompanyAccountFormBackId(null)
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
    openCompanyAccountForm(account, 'companyAccountDetail', companyAccountDetailId)
  }

  const handleCompanyAccountDetailDelete = () => {
    setCompanyAccountsRefreshKey((prev) => prev + 1)
    setCompanyAccountDetailId(null)
    setCurrentPage('companyAccounts')
  }

  const openThirdPartyForm = (thirdParty = null, backPage = 'thirdParties', backId = null) => {
    setThirdPartyFormItem(thirdParty)
    setThirdPartyFormBackPage(backPage)
    setThirdPartyFormBackId(backId)
    setCurrentPage('thirdPartyForm')
  }

  const handleThirdPartyFormSaved = () => {
    const backPage = thirdPartyFormBackPage
    const backId = thirdPartyFormBackId
    
    setThirdPartiesRefreshKey((prev) => prev + 1)
    setThirdPartyFormItem(null)
    
    if (backPage === 'thirdPartyDetail' && backId) {
      setThirdPartyDetailId(backId)
      setCurrentPage('thirdPartyDetail')
    } else {
      setCurrentPage(backPage || 'thirdParties')
    }
    
    setThirdPartyFormBackPage('thirdParties')
    setThirdPartyFormBackId(null)
  }

  const handleThirdPartyFormCancel = () => {
    const backPage = thirdPartyFormBackPage
    const backId = thirdPartyFormBackId
    
    setThirdPartyFormItem(null)
    
    if (backPage === 'thirdPartyDetail' && backId) {
      setThirdPartyDetailId(backId)
      setCurrentPage('thirdPartyDetail')
    } else {
      setCurrentPage(backPage || 'thirdParties')
    }
    
    setThirdPartyFormBackPage('thirdParties')
    setThirdPartyFormBackId(null)
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
    openThirdPartyForm(thirdParty, 'thirdPartyDetail', thirdPartyDetailId)
  }

  const handleThirdPartyDetailDelete = () => {
    setThirdPartiesRefreshKey((prev) => prev + 1)
    setThirdPartyDetailId(null)
    setCurrentPage('thirdParties')
  }

  const openTransactionForm = (transactionEntry = null, backPage = 'transactions', backId = null) => {
    setTransactionFormTransaction(transactionEntry)
    setTransactionFormBackPage(backPage)
    setTransactionFormBackId(backId)
    setCurrentPage('transactionForm')
  }

  const handleTransactionFormSaved = () => {
    const backPage = transactionFormBackPage
    const backId = transactionFormBackId
    
    setTransactionsRefreshKey((prev) => prev + 1)
    setTransactionFormTransaction(null)
    
    if (backPage === 'transactionDetail' && backId) {
      setTransactionDetailId(backId)
      setCurrentPage('transactionDetail')
    } else {
      setCurrentPage(backPage || 'transactions')
    }
    
    setTransactionFormBackPage('transactions')
    setTransactionFormBackId(null)
  }

  const handleTransactionFormCancel = () => {
    const backPage = transactionFormBackPage
    const backId = transactionFormBackId
    
    setTransactionFormTransaction(null)
    
    if (backPage === 'transactionDetail' && backId) {
      setTransactionDetailId(backId)
      setCurrentPage('transactionDetail')
    } else {
      setCurrentPage(backPage || 'transactions')
    }
    
    setTransactionFormBackPage('transactions')
    setTransactionFormBackId(null)
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
    openTransactionForm(transaction, 'transactionDetail', transactionDetailId)
  }

  const handleTransactionDetailDelete = () => {
    setTransactionsRefreshKey((prev) => prev + 1)
    setTransactionDetailId(null)
    setCurrentPage('transactions')
  }

  const openAppointmentForm = (appointment = null, customer = null, backPage = 'appointments', backId = null) => {
    setAppointmentFormAppointment(appointment)
    setAppointmentFormCustomer(customer)
    setAppointmentFormBackPage(backPage)
    setAppointmentFormBackId(backId)
    setCurrentPage('appointmentForm')
  }

  const handleAppointmentFormSaved = () => {
    const wasEditing = !!appointmentFormAppointment
    const savedCustomer = appointmentFormCustomer
    const backPage = appointmentFormBackPage
    const backId = appointmentFormBackId
    
    setAppointmentFormAppointment(null)
    setAppointmentFormCustomer(null)
    setAppointmentsRefreshKey((prev) => prev + 1)
    
    // Navigate back to where we came from
    if (backPage === 'appointmentDetail' && backId) {
      // If we came from appointment detail, go back there
      setAppointmentDetailId(backId)
      setCurrentPage('appointmentDetail')
    } else if (savedCustomer) {
      // If we were adding from customer detail, go back to customer detail
      setCustomerDetailId(savedCustomer.id)
      setCurrentPage('customerDetail')
    } else {
      // Otherwise, go to appointments list
      setCurrentPage(backPage || 'appointments')
    }
    
    // Reset back page tracking
    setAppointmentFormBackPage('appointments')
    setAppointmentFormBackId(null)
  }

  const handleAppointmentFormCancel = () => {
    const cancelledCustomer = appointmentFormCustomer
    const backPage = appointmentFormBackPage
    const backId = appointmentFormBackId
    
    setAppointmentFormAppointment(null)
    setAppointmentFormCustomer(null)
    
    // Navigate back to where we came from
    if (backPage === 'appointmentDetail' && backId) {
      // If we came from appointment detail, go back there
      setAppointmentDetailId(backId)
      setCurrentPage('appointmentDetail')
    } else if (cancelledCustomer) {
      // If we were adding from customer detail, go back to customer detail
      setCustomerDetailId(cancelledCustomer.id)
      setCurrentPage('customerDetail')
    } else {
      // Otherwise, go to appointments list
      setCurrentPage(backPage || 'appointments')
    }
    
    // Reset back page tracking
    setAppointmentFormBackPage('appointments')
    setAppointmentFormBackId(null)
  }

  const handleAppointmentView = (appointment, backPage = 'appointments') => {
    setAppointmentDetailId(appointment.id)
    setAppointmentDetailBackPage(backPage)
    setCurrentPage('appointmentDetail')
  }

  const handleAppointmentEdit = (appointment) => {
    openAppointmentForm(appointment)
  }

  const handleAppointmentDetailBack = () => {
    setAppointmentDetailId(null)
    setCurrentPage(appointmentDetailBackPage || 'appointments')
    setAppointmentDetailBackPage('appointments')
  }

  const handleAppointmentDetailEdit = (appointment) => {
    openAppointmentForm(appointment, null, 'appointmentDetail', appointmentDetailId)
  }

  const handleAppointmentDetailDelete = () => {
    setAppointmentsRefreshKey((prev) => prev + 1)
    setAppointmentDetailId(null)
    setCurrentPage(appointmentDetailBackPage || 'appointments')
    setAppointmentDetailBackPage('appointments')
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
            onViewAppointment={(appointment) => handleAppointmentView(appointment, 'dashboard')}
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
          <CustomerDetail2
            customerId={customerDetailId}
            onBack={handleCustomerDetailBack}
            onEdit={handleCustomerDetailEdit}
            onDelete={handleCustomerDetailDelete}
            onViewAppointment={(appointment) => handleAppointmentView(appointment, 'customerDetail')}
            onAddAppointment={(customer) => openAppointmentForm(null, customer, 'customerDetail', customerDetailId)}
            onAddOrder={(customer) => openOrderForm(null, customer, 'customerDetail', customerDetailId)}
            onAddPayment={(order) => openOrderDetail(order, 'customerDetail', customerDetailId)}
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
            onEdit={(instructor) => openInstructorForm(instructor, 'instructorDetail', instructorDetailId)}
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
            onViewCustomer={(customer) => openCustomerDetail(customer, 'orderDetail')}
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
            onViewAppointment={(appointment) => handleAppointmentView(appointment, 'appointments')}
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
            onViewCustomer={(customer) => openCustomerDetail(customer, 'appointmentDetail')}
            onViewInstructor={(instructor) => openInstructorDetail(instructor, 'appointmentDetail')}
            onViewOrder={(order) => openOrderDetail(order, 'appointmentDetail', appointmentDetailId)}
            user={user}
          />
        )
      case 'calendar':
        return (
          <Calendar
            onViewAppointment={(appointment) => handleAppointmentView(appointment, 'calendar')}
            onAddAppointment={() => openAppointmentForm(null)}
            onNavigateToAppointments={() => setCurrentPage('appointments')}
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
      case 'monthlyReport':
        return <MonthlyReport user={user} />
      default:
        return <Dashboard
          user={user}
          onNavigate={handleNavigate}
          onViewOrder={(order) => openOrderDetail(order, 'dashboard')}
          onViewTransaction={(transaction) => openTransactionDetail(transaction)}
          onViewAppointment={(appointment) => handleAppointmentView(appointment, 'dashboard')}
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


