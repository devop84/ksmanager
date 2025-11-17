import LessonsDailyDashboard from '../components/LessonsDailyDashboard'

function Dashboard({ onEditOrder = () => {} }) {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Dashboard</h1>
      <div className="space-y-6">
        <div className="overflow-x-auto w-full max-w-full">
          <LessonsDailyDashboard onEditOrder={onEditOrder} />
        </div>
      </div>
    </div>
  )
}

export default Dashboard

