import { useTranslation } from 'react-i18next'
import { useSettings } from '../../context/SettingsContext'

/**
 * TransactionsOverview - Reusable component for displaying financial overview (income, expense, net result)
 * @param {number} income - Total income amount
 * @param {number} expense - Total expense amount
 * @param {number} net - Net result (income + expense). If not provided, will be calculated
 * @param {Object} options - Additional options
 * @param {Function} options.formatAmount - Custom formatter function. If not provided, uses useSettings formatCurrency
 */
function TransactionsOverview({ income = 0, expense = 0, net = null, formatAmount: customFormatAmount = null }) {
  const { t } = useTranslation()
  const { formatCurrency } = useSettings()
  
  const formatAmount = customFormatAmount || ((amount, options = {}) => 
    formatCurrency(Number(amount || 0), { 
      minimumFractionDigits: 2, 
      maximumFractionDigits: 2, 
      ...options 
    })
  )
  
  const netResult = net !== null ? net : income + expense

  return (
    <div className="grid gap-4 md:grid-cols-3">
      <div className="rounded-xl border border-emerald-100 bg-emerald-50/70 p-4">
        <p className="text-sm font-medium text-emerald-700">
          {t('transactions.summary.income', 'Total Income')}
        </p>
        <p className="mt-2 text-2xl font-semibold text-emerald-800">
          {formatAmount(Math.max(income, 0), { signDisplay: 'never' })}
        </p>
      </div>
      <div className="rounded-xl border border-rose-100 bg-rose-50/70 p-4">
        <p className="text-sm font-medium text-rose-700">
          {t('transactions.summary.expense', 'Total Expense')}
        </p>
        <p className="mt-2 text-2xl font-semibold text-rose-800">
          {formatAmount(Math.abs(Math.min(expense, 0)), { signDisplay: 'never' })}
        </p>
      </div>
      <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
        <p className="text-sm font-medium text-slate-700">
          {t('transactions.summary.net', 'Net Result')}
        </p>
        <p className="mt-2 text-2xl font-semibold text-slate-900">
          {formatAmount(netResult)}
        </p>
      </div>
    </div>
  )
}

export default TransactionsOverview

