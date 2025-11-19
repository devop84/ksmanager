import { useEffect, useMemo, useState } from 'react'
import sql from '../lib/neon'
import { canModify } from '../lib/permissions'

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
          setError('Instructor not found')
          setInstructor(null)
          return
        }

        setInstructor(instructorRows[0])

        const lessonRows =
          (await sql`
            SELECT
              ol.order_id,
              ol.starting,
              ol.ending,
              ol.note,
              c.fullname AS student_name,
              s.name AS service_name,
              o.cancelled
            FROM orders_lessons ol
            JOIN orders o ON o.id = ol.order_id
            JOIN customers c ON c.id = ol.student_id
            JOIN services s ON s.id = o.service_id
            WHERE ol.instructor_id = ${instructorId}
            ORDER BY ol.starting DESC
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

        const totalHours = lessonRows.reduce((sum, lesson) => {
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
        setError('Unable to load instructor details. Please try again later.')
      } finally {
        setLoading(false)
      }
    }

    if (instructorId) {
      fetchInstructor()
    }
  }, [instructorId])

  const formatDate = (value) => {
    if (!value) return '—'
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return '—'
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  const formatDateTime = (value) => {
    if (!value) return '—'
    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return '—'
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    })
  }

  const formatCurrency = (value) =>
    new Intl.NumberFormat('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(Number(value || 0))

  if (loading) {
    return (
      <div className="px-4 py-6 sm:p-6 lg:p-8">
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <div className="text-gray-600">Loading instructor details...</div>
        </div>
      </div>
    )
  }

  if (error || !instructor) {
    return (
      <div className="px-4 py-6 sm:p-6 lg:p-8">
        <div className="rounded-xl bg-white p-6 shadow-sm">
          <div className="text-red-600">{error || 'Instructor not found'}</div>
          {onBack && (
            <button
              onClick={onBack}
              className="mt-4 rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Back to Instructors
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
            Back to Instructors
          </button>
          <h1 className="text-3xl font-bold text-gray-900">{instructor.fullname}</h1>
          <p className="text-gray-500 text-sm mt-1">Instructor details, lesson history, and payouts.</p>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-4 gap-6">
          <div className="xl:col-span-3 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div className="rounded-lg border border-gray-200 bg-gradient-to-br from-blue-50 to-blue-100 p-4">
                <div className="text-sm font-medium text-blue-700 mb-1">Total Lessons</div>
                <div className="text-2xl font-bold text-blue-900">{summary.totalLessons}</div>
              </div>
              <div className="rounded-lg border border-gray-200 bg-gradient-to-br from-green-50 to-green-100 p-4">
                <div className="text-sm font-medium text-green-700 mb-1">Total Hours</div>
                <div className="text-2xl font-bold text-green-900">{summary.totalHours.toFixed(1)}h</div>
              </div>
              <div className="rounded-lg border border-gray-200 bg-gradient-to-br from-purple-50 to-purple-100 p-4">
                <div className="text-sm font-medium text-purple-700 mb-1">Outstanding</div>
                <div className="text-2xl font-bold text-purple-900">{formatCurrency(summary.outstanding)}</div>
              </div>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Lesson History</h2>
                <p className="text-sm text-gray-500">{lessons.length} recent lessons</p>
              </div>
              {lessons.length === 0 ? (
                <div className="text-gray-600">No lessons recorded for this instructor.</div>
              ) : (
                <div className="space-y-3">
                  <div className="hidden md:block overflow-x-auto border border-gray-200 rounded-xl">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            Date
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            Student
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            Service
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            Duration
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-100">
                        {lessons.map((lesson) => (
                          <tr key={lesson.order_id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm text-gray-700">{formatDateTime(lesson.starting)}</td>
                            <td className="px-4 py-3 text-sm text-gray-700">{lesson.student_name || '—'}</td>
                            <td className="px-4 py-3 text-sm text-gray-700">{lesson.service_name || '—'}</td>
                            <td className="px-4 py-3 text-sm text-gray-700">
                              {lesson.starting && lesson.ending
                                ? `${((new Date(lesson.ending) - new Date(lesson.starting)) / (1000 * 60)) || 0} mins`
                                : '—'}
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
                <h2 className="text-lg font-semibold text-gray-900">Transactions</h2>
                <p className="text-sm text-gray-500">{transactions.length} payouts/refunds</p>
              </div>
              {transactions.length === 0 ? (
                <div className="text-gray-600">No transactions recorded for this instructor.</div>
              ) : (
                <div className="space-y-3">
                  <div className="hidden md:block overflow-x-auto border border-gray-200 rounded-xl">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            Date
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            Type
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            Method
                          </th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                            Amount
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
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-5 shadow-sm sticky top-6 space-y-6">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900">Instructor Info</h2>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => onEdit?.(instructor)}
                      disabled={!canModify(user)}
                      className="inline-flex items-center justify-center p-2 rounded-lg border border-gray-300 bg-white text-gray-700 shadow-sm hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white"
                      title="Edit instructor"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536M16.732 3.732a2.5 2.5 0 113.536 3.536L7.5 20.036H4v-3.572L16.732 3.732z" />
                      </svg>
                    </button>
                    <button
                      onClick={onDelete}
                      disabled={!canModify(user)}
                      className="inline-flex items-center justify-center p-2 rounded-lg border border-red-300 bg-white text-red-700 shadow-sm hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white"
                      title="Delete instructor"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                </div>
                <dl className="space-y-4 text-sm">
                  <div>
                    <dt className="text-xs font-medium text-gray-500 uppercase">Phone</dt>
                    <dd className="mt-1 text-gray-900">{instructor.phone || '—'}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-gray-500 uppercase">Email</dt>
                    <dd className="mt-1 text-gray-900">{instructor.email || '—'}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-gray-500 uppercase">Hourly Rate</dt>
                    <dd className="mt-1 text-gray-900">{formatCurrency(instructor.hourlyrate || 0)}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-gray-500 uppercase">Commission</dt>
                    <dd className="mt-1 text-gray-900">
                      {instructor.commission != null ? `${Number(instructor.commission).toFixed(1)}%` : '—'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-gray-500 uppercase">Bank Details</dt>
                    <dd className="mt-1 text-gray-900">{instructor.bankdetail || '—'}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-gray-500 uppercase">Note</dt>
                    <dd className="mt-1 text-gray-900 whitespace-pre-wrap">{instructor.note || '—'}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-gray-500 uppercase">Joined</dt>
                    <dd className="mt-1 text-gray-900">{formatDateTime(instructor.created_at)}</dd>
                  </div>
                  {instructor.updated_at && (
                    <div>
                      <dt className="text-xs font-medium text-gray-500 uppercase">Last Update</dt>
                      <dd className="mt-1 text-gray-900">{formatDateTime(instructor.updated_at)}</dd>
                    </div>
                  )}
                </dl>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default InstructorDetail


