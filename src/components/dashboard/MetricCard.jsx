import { useTranslation } from 'react-i18next'

/**
 * Reusable metric card component for dashboards
 * @param {string} title - Metric title/label
 * @param {string|number} value - Main metric value
 * @param {string} subtitle - Optional subtitle or description
 * @param {string} icon - Optional icon SVG path
 * @param {string} color - Color theme (blue, green, purple, amber, indigo, red)
 * @param {function} onClick - Optional click handler
 * @param {string|ReactNode} trend - Optional trend indicator (e.g., "+5.2%", "↑", "↓")
 * @param {string} trendColor - Optional trend color (green, red, gray)
 */
function MetricCard({ title, value, subtitle, icon, color = 'blue', onClick, trend, trendColor }) {
  const { t } = useTranslation()
  
  const colorClasses = {
    blue: {
      bg: 'bg-gradient-to-br from-blue-50 to-blue-100',
      border: 'border-blue-200',
      text: 'text-blue-700',
      value: 'text-blue-900',
      icon: 'text-blue-600',
    },
    green: {
      bg: 'bg-gradient-to-br from-green-50 to-green-100',
      border: 'border-green-200',
      text: 'text-green-700',
      value: 'text-green-900',
      icon: 'text-green-600',
    },
    purple: {
      bg: 'bg-gradient-to-br from-purple-50 to-purple-100',
      border: 'border-purple-200',
      text: 'text-purple-700',
      value: 'text-purple-900',
      icon: 'text-purple-600',
    },
    amber: {
      bg: 'bg-gradient-to-br from-amber-50 to-amber-100',
      border: 'border-amber-200',
      text: 'text-amber-700',
      value: 'text-amber-900',
      icon: 'text-amber-600',
    },
    indigo: {
      bg: 'bg-gradient-to-br from-indigo-50 to-indigo-100',
      border: 'border-indigo-200',
      text: 'text-indigo-700',
      value: 'text-indigo-900',
      icon: 'text-indigo-600',
    },
    red: {
      bg: 'bg-gradient-to-br from-red-50 to-red-100',
      border: 'border-red-200',
      text: 'text-red-700',
      value: 'text-red-900',
      icon: 'text-red-600',
    },
  }

  const theme = colorClasses[color] || colorClasses.blue
  const trendColorClass = trendColor === 'green' ? 'text-green-700' : trendColor === 'red' ? 'text-red-700' : 'text-gray-700'

  return (
    <div
      onClick={onClick}
      className={`rounded-xl p-5 border ${theme.bg} ${theme.border} ${onClick ? 'cursor-pointer hover:shadow-md transition-shadow' : ''}`}
    >
      <div className="flex items-center justify-between mb-2">
        <p className={`text-sm font-medium ${theme.text}`}>{title}</p>
        {icon && (
          <svg className={`w-5 h-5 ${theme.icon}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={icon} />
          </svg>
        )}
      </div>
      <p className={`text-2xl font-bold ${theme.value}`}>{value}</p>
      {subtitle && <p className={`text-xs ${theme.text} mt-1`}>{subtitle}</p>}
      {trend && (
        <p className={`text-xs mt-1 ${trendColorClass}`}>
          {trend}
        </p>
      )}
    </div>
  )
}

export default MetricCard

