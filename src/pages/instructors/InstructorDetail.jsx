import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import sql from '../../lib/neon'
import { canModify } from '../../lib/permissions'
import { useSettings } from '../../context/SettingsContext'
import DetailInfoPanel from '../../components/ui/DetailInfoPanel'

function InstructorDetail({ instructorId, onBack, onEdit, onDelete, user = null }) {
  const [instructor, setInstructor] = useState(null)
  const [lessons, setLessons] = useState([])
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [summary, setSummary] = useState({
    totalLessons: 0,
    totalHours: 0,
    totalOwed: 0,
    totalPaid: 0
  })
  const { t } = useTranslation()
  const { formatCurrency, formatDateTime, formatNumber } = useSettings()

  useEffect(() => {
    const fetchInstructor = async () => {
      try {
        setLoading(true)
        setError(null)

        const instructorRows = await sql`
          SELECT
            i.id,
            i.fullname,
            i.phone,
            i.email,
            i.bankdetail,
            i.hourlyrate,
            i.commission,
            i.monthlyfix,
            i.note,
            i.created_at,
            i.updated_at
          FROM instructors i
          WHERE i.id = ${instructorId}
          LIMIT 1
        `

        if (!instructorRows?.length) {
          setError(t('instructorDetail.notFound'))
          setInstructor(null)
          return
        }

        setInstructor(instructorRows[0])

        const lessonRows =
          (await sql`
            SELECT
              sa.id,
              sa.scheduled_start AS starting,
              sa.scheduled_end AS ending,
              sa.duration_hours,
              sa.note,
              c.fullname AS student_name,
              s.name AS service_name,
              sa.status,
              o.id AS order_id,
              o.status AS order_status
            FROM scheduled_appointments sa
            JOIN customers c ON c.id = sa.customer_id
            JOIN services s ON s.id = sa.service_id
            LEFT JOIN customer_service_credits csc ON csc.id = sa.credit_id
            LEFT JOIN order_items oi ON oi.id = csc.order_item_id
            LEFT JOIN orders o ON o.id = oi.order_id
            WHERE sa.instructor_id = ${instructorId}
              AND sa.status != 'cancelled'
            ORDER BY sa.scheduled_start DESC
            LIMIT 50
          `) || []

        setLessons(lessonRows)

        const transactionRows =
          (await sql`
            SELECT
              t.id,
              t.occurred_at,
              t.amount,
              tt.label AS type_label,
              tt.direction,
              pm.name AS payment_method
            FROM transactions t
            JOIN transaction_types tt ON tt.id = t.type_id
            LEFT JOIN payment_methods pm ON pm.id = t.payment_method_id
            WHERE t.destination_entity_type = 'instructor' AND t.destination_entity_id = ${instructorId}
               OR t.source_entity_type = 'instructor' AND t.source_entity_id = ${instructorId}
            ORDER BY t.occurred_at DESC
            LIMIT 25
          `) || []

        setTransactions(transactionRows)

        // Calculate total hours: prefer duration_hours if available, otherwise calculate from start/end times
        const totalHours = lessonRows.reduce((sum, lesson) => {
          // First try to use duration_hours if available
          if (lesson.duration_hours != null && lesson.duration_hours > 0) {
            return sum + Number(lesson.duration_hours)
          }
          // Otherwise calculate from start/end times
          if (!lesson.starting || !lesson.ending) return sum
          const start = new Date(lesson.starting)
          const end = new Date(lesson.ending)
          const diff = (end - start) / (1000 * 60 * 60)
          return sum + (diff > 0 ? diff : 0)
        }, 0)

        const totalLessons = lessonRows.length
        const hourlyRate = Number(instructorRows[0].hourlyrate ?? 0)
        const totalOwed = totalHours * hourlyRate
        const totalPaid = transactionRows.reduce((sum, txn) => {
          const amount = Number(txn.amount || 0)
          if (txn.direction === 'expense') {
            return sum + Math.abs(amount)
          } else if (txn.direction === 'income') {
            return sum - Math.abs(amount)
          }
          return sum
        }, 0)

        setSummary({
          totalLessons,
          totalHours,
          totalOwed,
          totalPaid,
          outstanding: Math.max(0, totalOwed - totalPaid)
        })
      } catch (err) {
        console.error('Failed to load instructor detail:', err)
        setError(t('instructorDetail.error.load'))
      } finally {
        setLoading(false)
      }
    }

    if (instructorId) {
      fetchInstructor()
    }
  }, [instructorId, t])

  const displayCurrency = (value) => {
    if (value === null || value === undefined) return '—'
    return formatCurrency(value)
  }

  const displayPercent = (value) => {
    if (value === null || value === undefined) return '—'
    return `${formatNumber(Number(value), { minimumFractionDigits: 1, maximumFractionDigits: 1 })}%`
  }

  const formatLessonDuration = (lesson) => {
    if (!lesson.starting || !lesson.ending) return '—'
    const start = new Date(lesson.starting)
    const end = new Date(lesson.ending)
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return '—'
    const minutes = Math.max(0, Math.round((end - start) / (1000 * 60)))
    if (!minutes) return '—'
    return t('instructorDetail.lessons.durationMinutes', { minutes })
  }

  if (loading) {
    return (
      <div className="px-4 py-6 sm:p-6 lg:p-8">
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <div className="text-gray-600">{t('instructorDetail.loading')}</div>
        </div>
      </div>
    )
  }

  if (error || !instructor) {
    return (
      <div className="px-4 py-6 sm:p-6 lg:p-8">
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <div className="text-red-600">{error || t('instructorDetail.notFound')}</div>
          {onBack && (
            <button
              onClick={onBack}
              className="mt-4 rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
            >
              {t('instructorDetail.back')}
            </button>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="px-4 py-6 sm:p-6 lg:p-8">
      <div className="rounded-xl bg-white p-4 sm:p-6 shadow-sm">
        <div className="mb-6 pb-6 border-b border-gray-200">
          <button
            onClick={onBack}
            className="mb-2 flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            {t('instructorDetail.back')}
          </button>
          <h1 className="text-3xl font-bold text-gray-900">{instructor.fullname}</h1>
          <p className="text-gray-500 text-sm mt-1">{t('instructorDetail.description')}</p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          <div className="xl:col-span-3 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="rounded-lg border border-gray-200 bg-gradient-to-br from-blue-50 to-blue-100 p-4">
                <div className="text-sm font-medium text-blue-700 mb-1">{t('instructorDetail.summary.lessons')}</div>
                <div className="text-2xl font-bold text-blue-900">{summary.totalLessons}</div>
              </div>
              <div className="rounded-lg border border-gray-200 bg-gradient-to-br from-green-50 to-green-100 p-4">
                <div className="text-sm font-medium text-green-700 mb-1">{t('instructorDetail.summary.hours')}</div>
                <div className="text-2xl font-bold text-green-900">
                  {t('instructorDetail.summary.hoursValue', {
                    hours: formatNumber(summary.totalHours, { minimumFractionDigits: 1, maximumFractionDigits: 1 })
                  })}
                </div>
              </div>
              <div className="rounded-lg border border-gray-200 bg-gradient-to-br from-purple-50 to-purple-100 p-4">
                <div className="text-sm font-medium text-purple-700 mb-1">
                  {t('instructorDetail.summary.outstanding')}
                </div>
                <div className="text-2xl font-bold text-purple-900">{displayCurrency(summary.outstanding)}</div>
              </div>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">{t('instructorDetail.lessons.title')}</h2>
                <p className="text-sm text-gray-500">
                  {t('instructorDetail.lessons.count', { count: lessons.length })}
                </p>
              </div>
              {lessons.length === 0 ? (
                <div className="text-gray-600">{t('instructorDetail.lessons.empty')}</div>
              ) : (
                <div className="space-y-3">
                  <div className="hidden md:block overflow-x-auto border border-gray-200 rounded-xl">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            {t('instructorDetail.lessons.table.date')}
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            {t('instructorDetail.lessons.table.student')}
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            {t('instructorDetail.lessons.table.service')}
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            {t('instructorDetail.lessons.table.duration')}
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-100">
                        {lessons.map((lesson) => (
                          <tr key={lesson.id || lesson.order_id || `lesson-${lesson.starting}`} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm text-gray-700">{formatDateTime(lesson.starting)}</td>
                            <td className="px-4 py-3 text-sm text-gray-700">{lesson.student_name || '—'}</td>
                            <td className="px-4 py-3 text-sm text-gray-700">{lesson.service_name || '—'}</td>
                            <td className="px-4 py-3 text-sm text-gray-700">
                              {formatLessonDuration(lesson)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">{t('instructorDetail.transactions.title')}</h2>
                <p className="text-sm text-gray-500">
                  {t('instructorDetail.transactions.count', { count: transactions.length })}
                </p>
              </div>
              {transactions.length === 0 ? (
                <div className="text-gray-600">{t('instructorDetail.transactions.empty')}</div>
              ) : (
                <div className="space-y-3">
                  <div className="hidden md:block overflow-x-auto border border-gray-200 rounded-xl">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            {t('instructorDetail.transactions.table.date')}
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            {t('instructorDetail.transactions.table.type')}
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            {t('instructorDetail.transactions.table.method')}
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            {t('instructorDetail.transactions.table.amount')}
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-100">
                        {transactions.map((txn) => (
                          <tr key={txn.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm text-gray-600">{formatDateTime(txn.occurred_at)}</td>
                            <td className="px-4 py-3 text-sm text-gray-600">{txn.type_label}</td>
                            <td className="px-4 py-3 text-sm text-gray-600">{txn.payment_method || '—'}</td>
                            <td
                              className={`px-4 py-3 text-sm font-semibold ${
                                txn.direction === 'income'
                                  ? 'text-emerald-600'
                                  : txn.direction === 'expense'
                                  ? 'text-rose-600'
                                  : 'text-gray-900'
                              }`}
                            >
                              {formatCurrency(txn.amount)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="xl:col-span-1">
            <DetailInfoPanel
              title={t('instructorDetail.info.title')}
              onEdit={() => onEdit?.(instructor)}
              onDelete={onDelete}
              user={user}
            >
              <dl className="space-y-4 text-sm">
                <div>
                  <dt className="text-xs font-medium text-gray-500 uppercase">{t('instructorDetail.info.id', 'ID')}</dt>
                  <dd className="mt-1 text-gray-900 font-mono">#{instructor.id}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-gray-500 uppercase">{t('instructorDetail.info.fullname', 'Full Name')}</dt>
                  <dd className="mt-1 text-gray-900">{instructor.fullname || '—'}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-gray-500 uppercase">{t('instructorDetail.info.phone')}</dt>
                  <dd className="mt-1 text-gray-900">{instructor.phone || '—'}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-gray-500 uppercase">{t('instructorDetail.info.email')}</dt>
                  <dd className="mt-1 text-gray-900">{instructor.email || '—'}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-gray-500 uppercase">{t('instructorDetail.info.hourly')}</dt>
                  <dd className="mt-1 text-gray-900">{displayCurrency(instructor.hourlyrate)}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-gray-500 uppercase">
                    {t('instructorDetail.info.commission')}
                  </dt>
                  <dd className="mt-1 text-gray-900">{displayPercent(instructor.commission)}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-gray-500 uppercase">{t('instructorDetail.info.monthly', 'Monthly Fix')}</dt>
                  <dd className="mt-1 text-gray-900">{displayCurrency(instructor.monthlyfix)}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-gray-500 uppercase">{t('instructorDetail.info.bank')}</dt>
                  <dd className="mt-1 text-gray-900 whitespace-pre-wrap">{instructor.bankdetail || '—'}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-gray-500 uppercase">{t('instructorDetail.info.note')}</dt>
                  <dd className="mt-1 text-gray-900 whitespace-pre-wrap">{instructor.note || '—'}</dd>
                </div>
                <div>
                  <dt className="text-xs font-medium text-gray-500 uppercase">{t('instructorDetail.info.joined')}</dt>
                  <dd className="mt-1 text-gray-900">{formatDateTime(instructor.created_at)}</dd>
                </div>
                {instructor.updated_at && (
                  <div>
                    <dt className="text-xs font-medium text-gray-500 uppercase">{t('instructorDetail.info.updated')}</dt>
                    <dd className="mt-1 text-gray-900">{formatDateTime(instructor.updated_at)}</dd>
                  </div>
                )}
              </dl>
            </DetailInfoPanel>
          </div>
        </div>
      </div>
    </div>
  )
}

export default InstructorDetail

