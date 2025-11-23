import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSettings } from '../../context/SettingsContext'
import sql from '../../lib/neon'

/**
 * InstructorsOverview - Component for displaying instructor statistics
 * @param {Array} instructors - Array of instructor objects
 */
function InstructorsOverview({ instructors = [] }) {
  const { t } = useTranslation()
  const { formatCurrency } = useSettings()
  const [lessons, setLessons] = useState([])
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)

        // Fetch all appointments with instructor_id (lessons)
        const lessonsResult = await sql`
          SELECT 
            sa.instructor_id,
            sa.duration_hours,
            sa.scheduled_start,
            sa.scheduled_end,
            sa.status
          FROM scheduled_appointments sa
          WHERE sa.instructor_id IS NOT NULL
            AND sa.status != 'cancelled'
        `
        setLessons(lessonsResult || [])

        // Fetch all transactions related to instructors
        const transactionsResult = await sql`
          SELECT 
            t.destination_entity_id AS instructor_id,
            t.amount,
            tt.direction
          FROM transactions t
          JOIN transaction_types tt ON tt.id = t.type_id
          WHERE t.destination_entity_type = 'instructor'
             OR t.source_entity_type = 'instructor'
        `
        setTransactions(transactionsResult || [])
      } catch (err) {
        console.error('Failed to load instructor overview data:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const stats = useMemo(() => {
    if (!instructors || !Array.isArray(instructors)) {
      return {
        total: 0,
        topInstructors: [],
        totalSalaryDue: 0
      }
    }

    // Calculate hours per instructor
    const instructorHours = new Map()

    lessons.forEach((lesson) => {
      if (!lesson || !lesson.instructor_id) return

      const instructorId = lesson.instructor_id
      let hours = 0

      // Prefer duration_hours if available
      if (lesson.duration_hours != null && lesson.duration_hours > 0) {
        hours = Number(lesson.duration_hours)
      }
      // Otherwise calculate from start/end times
      else if (lesson.scheduled_start && lesson.scheduled_end) {
        const start = new Date(lesson.scheduled_start)
        const end = new Date(lesson.scheduled_end)
        const diff = (end - start) / (1000 * 60 * 60)
        hours = diff > 0 ? diff : 0
      }

      if (hours > 0) {
        const current = instructorHours.get(instructorId) || 0
        instructorHours.set(instructorId, current + hours)
      }
    })

    // Get top 3 instructors by hours
    const instructorHoursArray = Array.from(instructorHours.entries())
      .map(([instructorId, hours]) => {
        const instructor = instructors.find(i => i.id === instructorId)
        return {
          id: instructorId,
          name: instructor?.fullname || `Instructor ${instructorId}`,
          hours: hours
        }
      })
      .filter(item => item.name) // Only include if instructor exists
      .sort((a, b) => b.hours - a.hours)
      .slice(0, 3)

    // Calculate total salary due for all instructors
    let totalSalaryDue = 0

    instructors.forEach((instructor) => {
      if (!instructor) return

      const instructorId = instructor.id
      const hourlyRate = Number(instructor.hourlyrate) || 0
      const totalHours = instructorHours.get(instructorId) || 0
      const totalOwed = totalHours * hourlyRate

      // Calculate total paid from transactions
      const totalPaid = transactions.reduce((sum, txn) => {
        if (txn.instructor_id !== instructorId) return sum
        const amount = Number(txn.amount || 0)
        if (txn.direction === 'expense') {
          return sum + Math.abs(amount)
        } else if (txn.direction === 'income') {
          return sum - Math.abs(amount)
        }
        return sum
      }, 0)

      const outstanding = Math.max(0, totalOwed - totalPaid)
      totalSalaryDue += outstanding
    })

    return {
      total: instructors.length,
      topInstructors: instructorHoursArray,
      totalSalaryDue
    }
  }, [instructors, lessons, transactions])

  const formatAmount = (amount) =>
    formatCurrency(Number(amount || 0), { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  const formatHours = (hours) => {
    const h = Number(hours || 0)
    return h.toFixed(1)
  }

  if (loading) {
    return (
      <div className="text-gray-600 text-sm py-4">
        {t('instructors.overview.loading', 'Loading overview...')}
      </div>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {/* Total Instructors */}
      <div className="rounded-xl border border-indigo-100 bg-indigo-50/70 p-4">
        <p className="text-sm font-medium text-indigo-700">
          {t('instructors.overview.total', 'Total Instructors')}
        </p>
        <p className="mt-2 text-2xl font-semibold text-indigo-800">
          {stats.total}
        </p>
      </div>

      {/* Top 3 Instructors */}
      <div className="rounded-xl border border-blue-100 bg-blue-50/70 p-4">
        <p className="text-sm font-medium text-blue-700">
          {t('instructors.overview.topInstructors', 'Top 3 Instructors')}
        </p>
        {stats.topInstructors.length > 0 ? (
          <div className="mt-2 space-y-1">
            {stats.topInstructors.map((instructor, index) => (
              <p key={instructor.id} className="text-sm text-blue-800">
                <span className="font-semibold">#{index + 1}</span> {instructor.name} ({formatHours(instructor.hours)}h)
              </p>
            ))}
          </div>
        ) : (
          <p className="mt-2 text-sm text-gray-500">
            {t('instructors.overview.noData', 'No data')}
          </p>
        )}
      </div>

      {/* Total Salary Due */}
      <div className="rounded-xl border border-rose-100 bg-rose-50/70 p-4">
        <p className="text-sm font-medium text-rose-700">
          {t('instructors.overview.salaryDue', 'Salary Due Total')}
        </p>
        <p className="mt-2 text-2xl font-semibold text-rose-800">
          {formatAmount(stats.totalSalaryDue)}
        </p>
      </div>
    </div>
  )
}

export default InstructorsOverview

