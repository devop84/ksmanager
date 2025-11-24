import { useTranslation } from 'react-i18next'
import { useSettings } from '../../context/SettingsContext'
import { useMemo } from 'react'

function CalendarMonthView({ currentDate, appointments, statusColors, onViewAppointment, onDateClick, onNavigateToAppointments }) {
  const { t } = useTranslation()
  const { formatDate, formatTime } = useSettings()

  // Get first day of month and number of days
  const getMonthDays = () => {
    const year = currentDate.getFullYear()
    const month = currentDate.getMonth()
    
    const firstDay = new Date(year, month, 1)
    const lastDay = new Date(year, month + 1, 0)
    const daysInMonth = lastDay.getDate()
    const startingDayOfWeek = firstDay.getDay()
    
    const days = []
    
    // Add empty cells for days before month starts
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null)
    }
    
    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day))
    }
    
    return days
  }

  const days = getMonthDays()
  const today = new Date()
  const isCurrentMonth = currentDate.getMonth() === today.getMonth() && 
                         currentDate.getFullYear() === today.getFullYear()

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  // Color mapping for service categories
  const categoryColors = {
    'Lesson': 'bg-purple-100 text-purple-900 border-purple-200',
    'Rental': 'bg-green-200 text-green-900 border-green-300',
    'Storage': 'bg-yellow-100 text-yellow-900 border-yellow-200',
    'Package': 'bg-orange-200 text-orange-900 border-orange-300',
    'Course': 'bg-indigo-200 text-indigo-900 border-indigo-300',
    'Equipment': 'bg-red-200 text-red-900 border-red-300',
    'Other': 'bg-gray-200 text-gray-900 border-gray-300',
  }

  // Get color for a category (with fallback for unknown categories)
  const getCategoryColor = (category) => {
    if (!category) return categoryColors['Other']
    
    // Try exact match first
    if (categoryColors[category]) {
      return categoryColors[category]
    }
    
    // Try case-insensitive match and handle plural forms
    const lowerCategory = category.toLowerCase().trim()
    for (const [key, value] of Object.entries(categoryColors)) {
      const lowerKey = key.toLowerCase()
      // Exact match
      if (lowerKey === lowerCategory) {
        return value
      }
      // Handle plural/singular variations (e.g., "Lessons" matches "Lesson")
      if (lowerCategory === lowerKey + 's' || lowerKey === lowerCategory + 's' || 
          lowerCategory.startsWith(lowerKey) || lowerKey.startsWith(lowerCategory)) {
        return value
      }
    }
    
    // Generate consistent color based on category name hash
    const colorPalette = [
      'bg-cyan-100 text-cyan-800 border-cyan-200',
      'bg-teal-100 text-teal-800 border-teal-200',
      'bg-emerald-100 text-emerald-800 border-emerald-200',
      'bg-yellow-100 text-yellow-800 border-yellow-200',
      'bg-amber-100 text-amber-800 border-amber-200',
      'bg-red-100 text-red-800 border-red-200',
      'bg-rose-100 text-rose-800 border-rose-200',
      'bg-violet-100 text-violet-800 border-violet-200',
      'bg-fuchsia-100 text-fuchsia-800 border-fuchsia-200',
    ]
    
    let hash = 0
    for (let i = 0; i < category.length; i++) {
      hash = category.charCodeAt(i) + ((hash << 5) - hash)
    }
    return colorPalette[Math.abs(hash) % colorPalette.length]
  }

  // Process appointments to get service category counts per day
  const dayOverview = useMemo(() => {
    const overview = {}
    
    days.forEach((date, dayIndex) => {
      if (!date) return
      
      const dateOnly = new Date(date)
      dateOnly.setHours(0, 0, 0, 0)
      
      // Find all appointments that overlap with this day
      const dayAppointments = appointments.filter(apt => {
        const aptStart = new Date(apt.scheduled_start)
        aptStart.setHours(0, 0, 0, 0)
        const aptEnd = new Date(apt.scheduled_end)
        aptEnd.setHours(0, 0, 0, 0)
        
        return aptStart <= dateOnly && aptEnd >= dateOnly
      })
      
      // Count by service category
      const categoryCounts = {}
      dayAppointments.forEach(apt => {
        const category = apt.service_category_name || 'Other'
        categoryCounts[category] = (categoryCounts[category] || 0) + 1
      })
      
      overview[dayIndex] = {
        total: dayAppointments.length,
        categories: categoryCounts,
        appointments: dayAppointments
      }
    })
    
    return overview
  }, [appointments, days])

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
      {/* Week day headers */}
      <div className="grid grid-cols-7 border-b border-gray-200">
        {weekDays.map((day, index) => (
          <div
            key={index}
            className="p-3 text-center text-xs font-semibold text-gray-700 bg-gray-50 border-r border-gray-200 last:border-r-0"
          >
            {t(`calendar.weekday.${day.toLowerCase()}`, day)}
          </div>
        ))}
      </div>

      {/* Calendar grid */}
      <div className="grid grid-cols-7">
        {days.map((date, dayIndex) => {
          const isToday = date && 
                         date.toDateString() === today.toDateString() &&
                         isCurrentMonth
          const isOtherMonth = !date || date.getMonth() !== currentDate.getMonth()
          const overview = dayOverview[dayIndex] || { total: 0, categories: {}, appointments: [] }

          return (
            <div
              key={dayIndex}
              className={`min-h-[120px] border-r border-b border-gray-200 p-2 ${
                isOtherMonth ? 'bg-gray-50' : 'bg-white'
              } ${isToday ? 'bg-blue-50' : ''} hover:bg-gray-50 transition-colors cursor-pointer`}
              onClick={() => date && onDateClick(date)}
            >
              {date && (
                <>
                  {/* Day number */}
                  <div className={`text-sm font-medium mb-2 ${
                    isToday ? 'text-blue-600 font-bold' : 
                    isOtherMonth ? 'text-gray-400' : 'text-gray-900'
                  }`}>
                    {date.getDate()}
                  </div>
                  
                  {/* Day overview - service category counts */}
                  {overview.total > 0 ? (
                    <div className="space-y-1">
                      {Object.entries(overview.categories).map(([category, count]) => (
                        <div
                          key={category}
                          className={`text-xs px-2 py-1 rounded border font-medium ${getCategoryColor(category)}`}
                        >
                          <span className="font-semibold">{count}</span> {category}
                        </div>
                      ))}
                      {overview.total > Object.keys(overview.categories).length && (
                        <div className="text-xs text-gray-500 px-1">
                          {overview.total} total
                        </div>
                      )}
                    </div>
                  ) : null}
                </>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default CalendarMonthView
