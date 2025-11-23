import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSettings } from '../../context/SettingsContext'
import sql from '../../lib/neon'

/**
 * AgenciesOverview - Component for displaying agency statistics
 * @param {Array} agencies - Array of agency objects
 */
function AgenciesOverview({ agencies = [] }) {
  const { t } = useTranslation()
  const { formatCurrency } = useSettings()
  const [customers, setCustomers] = useState([])
  const [transactions, setTransactions] = useState([])
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)

        // Fetch all customers with agency_id
        const customersResult = await sql`
          SELECT 
            c.agency_id,
            c.id AS customer_id
          FROM customers c
          WHERE c.agency_id IS NOT NULL
        `
        setCustomers(customersResult || [])

        // Fetch all transactions related to agencies
        const transactionsResult = await sql`
          SELECT 
            COALESCE(t.destination_entity_id, t.source_entity_id) AS agency_id,
            t.amount,
            tt.direction,
            t.source_entity_type,
            t.destination_entity_type
          FROM transactions t
          JOIN transaction_types tt ON tt.id = t.type_id
          WHERE t.destination_entity_type = 'agency'
             OR t.source_entity_type = 'agency'
        `
        setTransactions(transactionsResult || [])

        // Fetch all orders from agency customers to calculate commission owed
        const ordersResult = await sql`
          SELECT 
            c.agency_id,
            o.id AS order_id,
            o.total_amount,
            a.commission
          FROM orders o
          JOIN customers c ON o.customer_id = c.id
          JOIN agencies a ON c.agency_id = a.id
          WHERE c.agency_id IS NOT NULL
        `
        setOrders(ordersResult || [])
      } catch (err) {
        console.error('Failed to load agency overview data:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const stats = useMemo(() => {
    if (!agencies || !Array.isArray(agencies)) {
      return {
        total: 0,
        topAgencies: [],
        totalPaymentDue: 0
      }
    }

    // Calculate customer count per agency
    const agencyCustomerCount = new Map()
    customers.forEach((customer) => {
      if (!customer || !customer.agency_id) return
      const current = agencyCustomerCount.get(customer.agency_id) || 0
      agencyCustomerCount.set(customer.agency_id, current + 1)
    })

    // Get top 3 agencies by customer count
    const topAgenciesArray = Array.from(agencyCustomerCount.entries())
      .map(([agencyId, count]) => {
        const agency = agencies.find(a => a.id === agencyId)
        return {
          id: agencyId,
          name: agency?.name || `Agency ${agencyId}`,
          customerCount: count
        }
      })
      .filter(item => item.name) // Only include if agency exists
      .sort((a, b) => b.customerCount - a.customerCount)
      .slice(0, 3)

    // Calculate total payment due for all agencies
    // Payment due = Commission owed - Commission paid
    let totalPaymentDue = 0

    agencies.forEach((agency) => {
      if (!agency) return

      const agencyId = agency.id
      const commissionRate = Number(agency.commission) || 0

      // Calculate total commission owed from orders
      const agencyOrders = orders.filter(o => o.agency_id === agencyId)
      const totalCommissionOwed = agencyOrders.reduce((sum, order) => {
        const orderTotal = Number(order.total_amount) || 0
        const orderCommission = orderTotal * (commissionRate / 100)
        return sum + orderCommission
      }, 0)

      // Calculate total commission paid from transactions
      // If agency is destination and direction is 'expense', money is going TO agency (they received payment)
      // If agency is source and direction is 'income', money is coming FROM agency (they paid out)
      const totalPaid = transactions.reduce((sum, txn) => {
        if (txn.agency_id !== agencyId) return sum
        const amount = Number(txn.amount || 0)
        const absAmount = Math.abs(amount)
        
        if (txn.destination_entity_type === 'agency' && txn.direction === 'expense') {
          // Money going to agency (expense for company, income for agency)
          return sum + absAmount
        } else if (txn.source_entity_type === 'agency' && txn.direction === 'income') {
          // Money coming from agency (income for company, expense for agency)
          return sum - absAmount
        }
        return sum
      }, 0)

      // Payment due = Commission owed - Commission paid
      const outstanding = Math.max(0, totalCommissionOwed - totalPaid)
      totalPaymentDue += outstanding
    })

    return {
      total: agencies.length,
      topAgencies: topAgenciesArray,
      totalPaymentDue
    }
  }, [agencies, customers, transactions, orders])

  const formatAmount = (amount) =>
    formatCurrency(Number(amount || 0), { minimumFractionDigits: 2, maximumFractionDigits: 2 })

  if (loading) {
    return (
      <div className="text-gray-600 text-sm py-4">
        {t('agencies.overview.loading', 'Loading overview...')}
      </div>
    )
  }

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {/* Total Agencies */}
      <div className="rounded-xl border border-indigo-100 bg-indigo-50/70 p-4">
        <p className="text-sm font-medium text-indigo-700">
          {t('agencies.overview.total', 'Agency Count')}
        </p>
        <p className="mt-2 text-2xl font-semibold text-indigo-800">
          {stats.total}
        </p>
      </div>

      {/* Top 3 Agencies */}
      <div className="rounded-xl border border-blue-100 bg-blue-50/70 p-4">
        <p className="text-sm font-medium text-blue-700">
          {t('agencies.overview.topAgencies', 'Top 3 Agencies')}
        </p>
        {stats.topAgencies.length > 0 ? (
          <div className="mt-2 space-y-1">
            {stats.topAgencies.map((agency, index) => (
              <p key={agency.id} className="text-sm text-blue-800">
                <span className="font-semibold">#{index + 1}</span> {agency.name} ({agency.customerCount})
              </p>
            ))}
          </div>
        ) : (
          <p className="mt-2 text-sm text-gray-500">
            {t('agencies.overview.noData', 'No data')}
          </p>
        )}
      </div>

      {/* Total Payment Due */}
      <div className="rounded-xl border border-rose-100 bg-rose-50/70 p-4">
        <p className="text-sm font-medium text-rose-700">
          {t('agencies.overview.paymentDue', 'Payment Due')}
        </p>
        <p className="mt-2 text-2xl font-semibold text-rose-800">
          {formatAmount(stats.totalPaymentDue)}
        </p>
      </div>
    </div>
  )
}

export default AgenciesOverview

