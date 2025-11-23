import { useTranslation } from 'react-i18next'
import PageHeader from '../components/layout/PageHeader'
import DailyAppointments from '../components/dashboard/DailyAppointments'
import PaymentsDueAndOpenOrders from '../components/dashboard/PaymentsDueAndOpenOrders'

function Dashboard({ user, onNavigate, onViewOrder, onViewTransaction, onViewAppointment, onViewCustomer }) {
  const { t } = useTranslation()

  // TODO: Role-based module visibility will be implemented later
  // For now, show all modules
  const visibleModules = [
    'dailyAppointments',
    'paymentsDueAndOpenOrders'
    // Future modules will be added here based on user role
  ]

  return (
    <div className="p-4 md:p-6">
      <PageHeader
        title={t('dashboard.title', 'Dashboard')}
        description={t('dashboard.description', 'Overview of your business metrics and recent activity')}
      />

      {/* Dashboard Modules Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6 mt-6">
        {visibleModules.includes('dailyAppointments') && (
          <div className="lg:col-span-2 xl:col-span-3">
            <DailyAppointments
              user={user}
              onViewAppointment={onViewAppointment}
            />
          </div>
        )}
        {visibleModules.includes('paymentsDueAndOpenOrders') && (
          <div className="lg:col-span-2 xl:col-span-3">
            <PaymentsDueAndOpenOrders
              user={user}
              onViewOrder={onViewOrder}
              onViewCustomer={onViewCustomer}
            />
          </div>
        )}
        {/* Future modules will be added here */}
      </div>
    </div>
  )
}

export default Dashboard

