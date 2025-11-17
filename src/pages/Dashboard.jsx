import LessonsDailyDashboard from '../components/LessonsDailyDashboard'

function Dashboard({ onEditOrder = () => {} }) {
  return (
    <div className="p-2 sm:p-4 md:p-8">
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-3 sm:mb-6">Dashboard</h1>
      <div className="space-y-3 sm:space-y-6 w-full">
        <LessonsDailyDashboard onEditOrder={onEditOrder} />
      </div>
    </div>
  )
}

export default Dashboard

