import { useTranslation } from 'react-i18next'
import PageHeader from '../components/layout/PageHeader'
import DailyAppointments from '../components/dashboard/DailyAppointments'
import InstructorDailySchedule from '../components/dashboard/InstructorDailySchedule'
import PaymentsDueAndOpenOrders from '../components/dashboard/PaymentsDueAndOpenOrders'

function Dashboard({ user, onNavigate, onViewOrder, onViewTransaction, onViewAppointment, onViewCustomer }) {
  const { t } = useTranslation()

  // TODO: Role-based module visibility will be implemented later
  // For now, show all modules
  const visibleModules = [
    'dailyAppointments',
    'instructorSchedule',
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
      <div className="mt-6 space-y-6">
        {/* Two Column Layout for Appointments */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {visibleModules.includes('dailyAppointments') && (
            <DailyAppointments
              user={user}
              onViewAppointment={onViewAppointment}
            />
          )}
          {visibleModules.includes('instructorSchedule') && (
            <InstructorDailySchedule
              onViewAppointment={onViewAppointment}
            />
          )}
        </div>
        
        {/* Full Width Modules */}
        {visibleModules.includes('paymentsDueAndOpenOrders') && (
          <PaymentsDueAndOpenOrders
            user={user}
            onViewOrder={onViewOrder}
            onViewCustomer={onViewCustomer}
          />
        )}
        {/* Future modules will be added here */}
      </div>
    </div>
  )
}

export default Dashboard

