import { canModify } from '../lib/permissions'

/**
 * Reusable page header component with title, description, and add button
 */
export default function PageHeader({ 
  title, 
  description, 
  onAdd, 
  addLabel, 
  user, 
  canModifyFn = canModify 
}) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
        {description && <p className="text-gray-500 text-sm">{description}</p>}
      </div>
      {onAdd && (
        <button
          onClick={onAdd}
          disabled={!canModifyFn(user)}
          className="inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-sm font-semibold shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed bg-indigo-600 text-white hover:bg-indigo-500 disabled:bg-gray-400 disabled:hover:bg-gray-400"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          {addLabel}
        </button>
      )}
    </div>
  )
}

