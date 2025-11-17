import LessonsDailyDashboard from '../components/LessonsDailyDashboard'

function Dashboard({ onEditOrder = () => {} }) {
  return (
    <div className="p-8 min-w-0 max-w-full overflow-hidden">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Dashboard</h1>
      <div className="space-y-6 min-w-0">
        <LessonsDailyDashboard onEditOrder={onEditOrder} />
      </div>
    </div>
  )
}

export default Dashboard

