import DailyLessons from '../components/DailyLessons'
import RentalsInProgress from '../components/RentalsInProgress'
import StorageInProgress from '../components/StorageInProgress'

function Dashboard({ onEditOrder = () => {} }) {
  return (
    <div className="px-4 py-6 sm:p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 text-sm">View daily lessons schedule and overview.</p>
      </div>
      <div className="space-y-3 sm:space-y-6 w-full">
        <DailyLessons onEditOrder={onEditOrder} />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 sm:gap-6">
          <RentalsInProgress onEditOrder={onEditOrder} />
          <StorageInProgress onEditOrder={onEditOrder} />
        </div>
      </div>
    </div>
  )
}

export default Dashboard

