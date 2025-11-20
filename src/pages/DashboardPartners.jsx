import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import sql from '../lib/neon'
import { useSettings } from '../context/SettingsContext'

function DashboardPartners({ onViewAgency = () => {}, onViewThirdParty = () => {}, onViewStaff = () => {}, onViewInstructor = () => {}, onNavigate = () => {} }) {
  const { t } = useTranslation()
  const { formatCurrency, formatDate, formatDateTime } = useSettings()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  // Agencies data
  const [agenciesSummary, setAgenciesSummary] = useState({
    totalAgencies: 0,
    totalCustomers: 0,
    totalOrders: 0,
    totalCommissionPaid: 0,
  })
  const [topAgencies, setTopAgencies] = useState([])
  
  // Third parties data
  const [thirdPartiesSummary, setThirdPartiesSummary] = useState({
    totalThirdParties: 0,
    totalTransactions: 0,
    totalPaid: 0,
    totalReceived: 0,
    netFlow: 0,
  })
  const [thirdPartiesByCategory, setThirdPartiesByCategory] = useState([])
  const [recentThirdPartyTransactions, setRecentThirdPartyTransactions] = useState([])
  
  // Salaries data
  const [salariesSummary, setSalariesSummary] = useState({
    totalStaff: 0,
    totalInstructors: 0,
    staffPaidThisMonth: 0,
    instructorsPaidThisMonth: 0,
    staffOutstanding: 0,
    instructorsOutstanding: 0,
  })
  const [staffPayments, setStaffPayments] = useState([])
  const [instructorPayments, setInstructorPayments] = useState([])

  useEffect(() => {
    const fetchPartnersData = async () => {
      try {
        setLoading(true)
        setError(null)

        const now = new Date()
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

        // Agencies Summary
        const agenciesCountRows = await sql`SELECT COUNT(*) AS count FROM agencies`
        const agenciesCustomersRows = await sql`
          SELECT COUNT(DISTINCT c.id) AS count
          FROM customers c
          WHERE c.agency_id IS NOT NULL
        `
        const agenciesOrdersRows = await sql`
          SELECT COUNT(DISTINCT o.id) AS count
          FROM orders o
          JOIN customers c ON c.id = o.customer_id
          WHERE c.agency_id IS NOT NULL
        `
        const agenciesCommissionRows = await sql`
          SELECT COALESCE(SUM(ABS(t.amount)), 0) AS total
          FROM transactions t
          WHERE t.destination_entity_type = 'agency'
            AND t.occurred_at >= ${startOfMonth.toISOString()}
        `

        // Top Agencies by customers/orders
        const topAgenciesRows = await sql`
          SELECT
            a.id,
            a.name,
            a.commission,
            COUNT(DISTINCT c.id) AS customer_count,
            COUNT(DISTINCT o.id) AS order_count,
            COALESCE(SUM(CASE WHEN t.destination_entity_type = 'agency' AND t.occurred_at >= ${startOfMonth.toISOString()} THEN ABS(t.amount) ELSE 0 END), 0) AS commission_paid
          FROM agencies a
          LEFT JOIN customers c ON c.agency_id = a.id
          LEFT JOIN orders o ON o.customer_id = c.id
          LEFT JOIN transactions t ON t.destination_entity_type = 'agency' AND t.destination_entity_id = a.id
          GROUP BY a.id, a.name, a.commission
          ORDER BY customer_count DESC, order_count DESC
          LIMIT 5
        `

        // Third Parties Summary
        const thirdPartiesCountRows = await sql`SELECT COUNT(*) AS count FROM third_parties`
        const thirdPartiesTxnRows = await sql`
          SELECT
            COUNT(*) AS transaction_count,
            COALESCE(SUM(CASE WHEN t.source_entity_type = 'third_party' THEN ABS(t.amount) ELSE 0 END), 0) AS total_paid,
            COALESCE(SUM(CASE WHEN t.destination_entity_type = 'third_party' THEN ABS(t.amount) ELSE 0 END), 0) AS total_received
          FROM transactions t
          WHERE t.source_entity_type = 'third_party' OR t.destination_entity_type = 'third_party'
        `
        const thirdPartiesTxn = thirdPartiesTxnRows[0] || { transaction_count: 0, total_paid: 0, total_received: 0 }

        // Third Parties by Category
        const thirdPartiesByCategoryRows = await sql`
          SELECT
            COALESCE(tpc.name, 'Uncategorized') AS category_name,
            COUNT(DISTINCT tp.id) AS party_count,
            COUNT(DISTINCT t.id) AS transaction_count,
            COALESCE(SUM(CASE WHEN t.source_entity_type = 'third_party' THEN ABS(t.amount) ELSE 0 END), 0) AS total_paid,
            COALESCE(SUM(CASE WHEN t.destination_entity_type = 'third_party' THEN ABS(t.amount) ELSE 0 END), 0) AS total_received
          FROM third_parties tp
          LEFT JOIN third_parties_categories tpc ON tpc.id = tp.category_id
          LEFT JOIN transactions t ON (t.source_entity_type = 'third_party' AND t.source_entity_id = tp.id) OR (t.destination_entity_type = 'third_party' AND t.destination_entity_id = tp.id)
          GROUP BY tpc.name
          ORDER BY party_count DESC
        `

        // Recent Third Party Transactions
        const recentThirdPartyTxnRows = await sql`
          SELECT
            t.id,
            t.occurred_at,
            t.amount,
            tt.label AS type_label,
            tt.direction,
            tp.name AS third_party_name,
            tp.id AS third_party_id
          FROM transactions t
          JOIN transaction_types tt ON tt.id = t.type_id
          LEFT JOIN third_parties tp ON (
            (t.source_entity_type = 'third_party' AND t.source_entity_id = tp.id) OR
            (t.destination_entity_type = 'third_party' AND t.destination_entity_id = tp.id)
          )
          WHERE t.source_entity_type = 'third_party' OR t.destination_entity_type = 'third_party'
          ORDER BY t.occurred_at DESC
          LIMIT 10
        `

        // Salaries Summary
        const staffCountRows = await sql`SELECT COUNT(*) AS count FROM staff`
        const instructorsCountRows = await sql`SELECT COUNT(*) AS count FROM instructors`
        
        // Staff payments this month
        const staffPaymentsRows = await sql`
          SELECT COALESCE(SUM(ABS(t.amount)), 0) AS total
          FROM transactions t
          WHERE t.destination_entity_type = 'staff'
            AND t.occurred_at >= ${startOfMonth.toISOString()}
        `
        
        // Instructor payments this month
        const instructorPaymentsRows = await sql`
          SELECT COALESCE(SUM(ABS(t.amount)), 0) AS total
          FROM transactions t
          WHERE t.destination_entity_type = 'instructor'
            AND t.occurred_at >= ${startOfMonth.toISOString()}
        `

        // Staff outstanding (simplified - based on monthly fix if set)
        const staffOutstandingRows = await sql`
          SELECT COALESCE(SUM(COALESCE(s.monthlyfix, 0)), 0) AS total
          FROM staff s
          WHERE s.monthlyfix IS NOT NULL AND s.monthlyfix > 0
        `
        
        // Instructor outstanding (based on lessons worked - simplified)
        const instructorOutstandingRows = await sql`
          SELECT COALESCE(SUM(
            CASE
              WHEN i.monthlyfix IS NOT NULL AND i.monthlyfix > 0 THEN i.monthlyfix
              WHEN i.hourlyrate IS NOT NULL AND i.hourlyrate > 0 THEN 
                (SELECT COALESCE(SUM(EXTRACT(EPOCH FROM (ol.ending - ol.starting)) / 3600), 0) * i.hourlyrate
                 FROM orders_lessons ol
                 WHERE ol.instructor_id = i.id
                   AND ol.starting >= ${startOfMonth.toISOString()}
                   AND NOT EXISTS (
                     SELECT 1 FROM transactions t
                     WHERE t.destination_entity_type = 'instructor'
                       AND t.destination_entity_id = i.id
                       AND t.occurred_at >= ${startOfMonth.toISOString()}
                   ))
              ELSE 0
            END
          ), 0) AS total
          FROM instructors i
        `

        // Recent Staff Payments
        const recentStaffPaymentsRows = await sql`
          SELECT
            t.id,
            t.occurred_at,
            t.amount,
            tt.label AS type_label,
            s.fullname AS staff_name,
            s.role,
            s.id AS staff_id
          FROM transactions t
          JOIN transaction_types tt ON tt.id = t.type_id
          JOIN staff s ON t.destination_entity_type = 'staff' AND t.destination_entity_id = s.id
          WHERE t.destination_entity_type = 'staff'
          ORDER BY t.occurred_at DESC
          LIMIT 10
        `

        // Recent Instructor Payments
        const recentInstructorPaymentsRows = await sql`
          SELECT
            t.id,
            t.occurred_at,
            t.amount,
            tt.label AS type_label,
            i.fullname AS instructor_name,
            i.id AS instructor_id
          FROM transactions t
          JOIN transaction_types tt ON tt.id = t.type_id
          JOIN instructors i ON t.destination_entity_type = 'instructor' AND t.destination_entity_id = i.id
          WHERE t.destination_entity_type = 'instructor'
          ORDER BY t.occurred_at DESC
          LIMIT 10
        `

        setAgenciesSummary({
          totalAgencies: Number(agenciesCountRows[0]?.count || 0),
          totalCustomers: Number(agenciesCustomersRows[0]?.count || 0),
          totalOrders: Number(agenciesOrdersRows[0]?.count || 0),
          totalCommissionPaid: Number(agenciesCommissionRows[0]?.total || 0),
        })
        setTopAgencies(topAgenciesRows || [])

        setThirdPartiesSummary({
          totalThirdParties: Number(thirdPartiesCountRows[0]?.count || 0),
          totalTransactions: Number(thirdPartiesTxn.transaction_count || 0),
          totalPaid: Number(thirdPartiesTxn.total_paid || 0),
          totalReceived: Number(thirdPartiesTxn.total_received || 0),
          netFlow: Number(thirdPartiesTxn.total_received || 0) - Number(thirdPartiesTxn.total_paid || 0),
        })
        setThirdPartiesByCategory(thirdPartiesByCategoryRows || [])
        setRecentThirdPartyTransactions(recentThirdPartyTxnRows || [])

        setSalariesSummary({
          totalStaff: Number(staffCountRows[0]?.count || 0),
          totalInstructors: Number(instructorsCountRows[0]?.count || 0),
          staffPaidThisMonth: Number(staffPaymentsRows[0]?.total || 0),
          instructorsPaidThisMonth: Number(instructorPaymentsRows[0]?.total || 0),
          staffOutstanding: Number(staffOutstandingRows[0]?.total || 0),
          instructorsOutstanding: Number(instructorOutstandingRows[0]?.total || 0),
        })
        setStaffPayments(recentStaffPaymentsRows || [])
        setInstructorPayments(recentInstructorPaymentsRows || [])
      } catch (err) {
        console.error('Failed to load partners data:', err)
        setError(t('dashboardPartners.error.load'))
      } finally {
        setLoading(false)
      }
    }

    fetchPartnersData()
  }, [t])

  const formatAmount = (amount, direction) => {
    const formatted = formatCurrency(Math.abs(Number(amount || 0)))
    if (direction === 'income') return `+${formatted}`
    if (direction === 'expense') return `-${formatted}`
    return formatted
  }

  const getAmountColorClass = (amount) => {
    if (amount > 0) return 'text-emerald-600'
    if (amount < 0) return 'text-rose-600'
    return 'text-gray-600'
  }

  if (loading) {
    return (
      <div className="px-4 py-6 sm:p-6 lg:p-8">
        <div className="text-gray-600">{t('common.loading')}</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="px-4 py-6 sm:p-6 lg:p-8">
        <div className="text-red-600">{error}</div>
      </div>
    )
  }

  return (
    <div className="px-4 py-6 sm:p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm p-4 sm:p-6">
        <h1 className="text-3xl font-bold text-gray-900">{t('dashboardPartners.title')}</h1>
        <p className="text-gray-500 text-sm mt-1">{t('dashboardPartners.description')}</p>
      </div>

      {/* Salaries Section */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">{t('dashboardPartners.salaries.title')}</h2>
        </div>

        {/* Salaries Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-4 mb-6">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-5 border border-blue-200">
            <p className="text-sm font-medium text-blue-700 mb-1">{t('dashboardPartners.salaries.totalStaff')}</p>
            <p className="text-2xl font-bold text-blue-900">{salariesSummary.totalStaff}</p>
          </div>
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-5 border border-purple-200">
            <p className="text-sm font-medium text-purple-700 mb-1">{t('dashboardPartners.salaries.totalInstructors')}</p>
            <p className="text-2xl font-bold text-purple-900">{salariesSummary.totalInstructors}</p>
          </div>
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-5 border border-green-200">
            <p className="text-sm font-medium text-green-700 mb-1">{t('dashboardPartners.salaries.staffPaid')}</p>
            <p className="text-2xl font-bold text-green-900">{formatCurrency(salariesSummary.staffPaidThisMonth)}</p>
            <p className="text-xs text-green-600 mt-1">{t('dashboardPartners.salaries.thisMonth')}</p>
          </div>
          <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-xl p-5 border border-emerald-200">
            <p className="text-sm font-medium text-emerald-700 mb-1">{t('dashboardPartners.salaries.instructorsPaid')}</p>
            <p className="text-2xl font-bold text-emerald-900">{formatCurrency(salariesSummary.instructorsPaidThisMonth)}</p>
            <p className="text-xs text-emerald-600 mt-1">{t('dashboardPartners.salaries.thisMonth')}</p>
          </div>
          <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl p-5 border border-amber-200">
            <p className="text-sm font-medium text-amber-700 mb-1">{t('dashboardPartners.salaries.staffOutstanding')}</p>
            <p className="text-2xl font-bold text-amber-900">{formatCurrency(salariesSummary.staffOutstanding)}</p>
          </div>
          <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-xl p-5 border border-orange-200">
            <p className="text-sm font-medium text-orange-700 mb-1">{t('dashboardPartners.salaries.instructorsOutstanding')}</p>
            <p className="text-2xl font-bold text-orange-900">{formatCurrency(salariesSummary.instructorsOutstanding)}</p>
          </div>
        </div>

        {/* Recent Payments Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Staff Payments */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">{t('dashboardPartners.salaries.recentStaffPayments')}</h3>
              <button
                onClick={() => onNavigate('staff')}
                className="text-sm text-indigo-600 hover:text-indigo-800"
              >
                {t('dashboardPartners.salaries.viewAll')}
              </button>
            </div>
            {staffPayments.length === 0 ? (
              <p className="text-sm text-gray-500">{t('dashboardPartners.salaries.noPayments')}</p>
            ) : (
              <div className="space-y-2">
                {staffPayments.map((payment) => (
                  <div
                    key={payment.id}
                    onClick={() => payment.staff_id && onViewStaff({ id: payment.staff_id })}
                    className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{payment.staff_name || '—'}</p>
                      <p className="text-xs text-gray-600">
                        {t(`staff.role.${payment.role}`, payment.role)} • {formatDateTime(payment.occurred_at)}
                      </p>
                    </div>
                    <p className="text-sm font-semibold text-emerald-600 ml-4">
                      {formatCurrency(payment.amount)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Instructor Payments */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">{t('dashboardPartners.salaries.recentInstructorPayments')}</h3>
              <button
                onClick={() => onNavigate('instructors')}
                className="text-sm text-indigo-600 hover:text-indigo-800"
              >
                {t('dashboardPartners.salaries.viewAll')}
              </button>
            </div>
            {instructorPayments.length === 0 ? (
              <p className="text-sm text-gray-500">{t('dashboardPartners.salaries.noPayments')}</p>
            ) : (
              <div className="space-y-2">
                {instructorPayments.map((payment) => (
                  <div
                    key={payment.id}
                    onClick={() => payment.instructor_id && onViewInstructor({ id: payment.instructor_id })}
                    className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{payment.instructor_name || '—'}</p>
                      <p className="text-xs text-gray-600">{formatDateTime(payment.occurred_at)}</p>
                    </div>
                    <p className="text-sm font-semibold text-emerald-600 ml-4">
                      {formatCurrency(payment.amount)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Agencies Section */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">{t('dashboardPartners.agencies.title')}</h2>
          <button
            onClick={() => onNavigate('agencies')}
            className="text-sm text-indigo-600 hover:text-indigo-800"
          >
            {t('dashboardPartners.agencies.viewAll')}
          </button>
        </div>

        {/* Agencies Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-5 border border-blue-200">
            <p className="text-sm font-medium text-blue-700 mb-1">{t('dashboardPartners.agencies.totalAgencies')}</p>
            <p className="text-2xl font-bold text-blue-900">{agenciesSummary.totalAgencies}</p>
          </div>
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-5 border border-green-200">
            <p className="text-sm font-medium text-green-700 mb-1">{t('dashboardPartners.agencies.totalCustomers')}</p>
            <p className="text-2xl font-bold text-green-900">{agenciesSummary.totalCustomers}</p>
          </div>
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-5 border border-purple-200">
            <p className="text-sm font-medium text-purple-700 mb-1">{t('dashboardPartners.agencies.totalOrders')}</p>
            <p className="text-2xl font-bold text-purple-900">{agenciesSummary.totalOrders}</p>
          </div>
          <div className="bg-gradient-to-br from-amber-50 to-amber-100 rounded-xl p-5 border border-amber-200">
            <p className="text-sm font-medium text-amber-700 mb-1">{t('dashboardPartners.agencies.commissionPaid')}</p>
            <p className="text-2xl font-bold text-amber-900">{formatCurrency(agenciesSummary.totalCommissionPaid)}</p>
            <p className="text-xs text-amber-600 mt-1">{t('dashboardPartners.agencies.thisMonth')}</p>
          </div>
        </div>

        {/* Top Agencies */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('dashboardPartners.agencies.topAgencies')}</h3>
          {topAgencies.length === 0 ? (
            <p className="text-sm text-gray-500">{t('dashboardPartners.agencies.empty')}</p>
          ) : (
            <div className="space-y-3">
              {topAgencies.map((agency) => (
                <div
                  key={agency.id}
                  onClick={() => onViewAgency({ id: agency.id })}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-900 truncate">{agency.name}</p>
                    <p className="text-xs text-gray-600 mt-1">
                      {t('dashboardPartners.agencies.commission', { value: agency.commission || 0 })} • {t('dashboardPartners.agencies.customers', { count: agency.customer_count })} • {t('dashboardPartners.agencies.orders', { count: agency.order_count })}
                    </p>
                  </div>
                  <p className="text-sm font-semibold text-gray-900 ml-4">
                    {formatCurrency(agency.commission_paid)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Third Parties Section */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">{t('dashboardPartners.thirdParties.title')}</h2>
          <button
            onClick={() => onNavigate('thirdParties')}
            className="text-sm text-indigo-600 hover:text-indigo-800"
          >
            {t('dashboardPartners.thirdParties.viewAll')}
          </button>
        </div>

        {/* Third Parties Summary Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <div className="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-xl p-5 border border-indigo-200">
            <p className="text-sm font-medium text-indigo-700 mb-1">{t('dashboardPartners.thirdParties.totalParties')}</p>
            <p className="text-2xl font-bold text-indigo-900">{thirdPartiesSummary.totalThirdParties}</p>
          </div>
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-5 border border-blue-200">
            <p className="text-sm font-medium text-blue-700 mb-1">{t('dashboardPartners.thirdParties.totalTransactions')}</p>
            <p className="text-2xl font-bold text-blue-900">{thirdPartiesSummary.totalTransactions}</p>
          </div>
          <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-5 border border-green-200">
            <p className="text-sm font-medium text-green-700 mb-1">{t('dashboardPartners.thirdParties.totalReceived')}</p>
            <p className="text-2xl font-bold text-green-900">{formatCurrency(thirdPartiesSummary.totalReceived)}</p>
          </div>
          <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-5 border border-red-200">
            <p className="text-sm font-medium text-red-700 mb-1">{t('dashboardPartners.thirdParties.totalPaid')}</p>
            <p className="text-2xl font-bold text-red-900">{formatCurrency(thirdPartiesSummary.totalPaid)}</p>
          </div>
          <div className={`bg-gradient-to-br rounded-xl p-5 border ${
            thirdPartiesSummary.netFlow >= 0 
              ? 'from-emerald-50 to-emerald-100 border-emerald-200' 
              : 'from-rose-50 to-rose-100 border-rose-200'
          }`}>
            <p className={`text-sm font-medium mb-1 ${
              thirdPartiesSummary.netFlow >= 0 ? 'text-emerald-700' : 'text-rose-700'
            }`}>
              {t('dashboardPartners.thirdParties.netFlow')}
            </p>
            <p className={`text-2xl font-bold ${
              thirdPartiesSummary.netFlow >= 0 ? 'text-emerald-900' : 'text-rose-900'
            }`}>
              {formatCurrency(thirdPartiesSummary.netFlow)}
            </p>
          </div>
        </div>

        {/* Third Parties by Category */}
        <div className="mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('dashboardPartners.thirdParties.byCategory')}</h3>
          {thirdPartiesByCategory.length === 0 ? (
            <p className="text-sm text-gray-500">{t('dashboardPartners.thirdParties.empty')}</p>
          ) : (
            <div className="space-y-2">
              {thirdPartiesByCategory.map((category, index) => (
                <div key={index} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{category.category_name}</p>
                    <p className="text-xs text-gray-600">
                      {t('dashboardPartners.thirdParties.parties', { count: category.party_count })} • {t('dashboardPartners.thirdParties.transactions', { count: category.transaction_count })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-semibold text-gray-900">{formatCurrency(category.total_received - category.total_paid)}</p>
                    <p className="text-xs text-gray-500">{t('dashboardPartners.thirdParties.net')}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Third Party Transactions */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('dashboardPartners.thirdParties.recentTransactions')}</h3>
          {recentThirdPartyTransactions.length === 0 ? (
            <p className="text-sm text-gray-500">{t('dashboardPartners.thirdParties.noTransactions')}</p>
          ) : (
            <div className="space-y-2">
              {recentThirdPartyTransactions.map((txn) => (
                <div
                  key={txn.id}
                  onClick={() => txn.third_party_id && onViewThirdParty({ id: txn.third_party_id })}
                  className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{txn.third_party_name || '—'}</p>
                    <p className="text-xs text-gray-600">{txn.type_label} • {formatDateTime(txn.occurred_at)}</p>
                  </div>
                  <p className={`text-sm font-semibold ml-4 ${getAmountColorClass(txn.amount)}`}>
                    {formatAmount(txn.amount, txn.direction)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default DashboardPartners

