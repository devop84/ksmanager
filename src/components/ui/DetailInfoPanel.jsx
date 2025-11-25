import { useTranslation } from 'react-i18next'
import { canModify } from '../../lib/permissions'

/**
 * Reusable component for the right sidebar information panel in detail pages
 * Displays all database fields from the corresponding table
 * 
 * @param {Object} props
 * @param {string} props.title - Title of the information panel
 * @param {Function} props.onEdit - Callback when edit button is clicked
 * @param {Function} props.onDelete - Callback when delete button is clicked
 * @param {Object} props.user - Current user object for permission checking
 * @param {Function} props.canModifyFn - Function to check if user can modify (defaults to canModify)
 * @param {boolean} props.deleting - Whether delete operation is in progress
 * @param {boolean} props.disableActions - Whether to disable edit/delete actions (e.g., when linked to closed/cancelled order)
 * @param {React.ReactNode} props.children - Content to render inside the panel (typically <dl> with fields)
 * @param {string} props.className - Additional CSS classes
 */
function DetailInfoPanel({
  title,
  onEdit,
  onDelete,
  user = null,
  canModifyFn = canModify,
  deleting = false,
  disableActions = false,
  children,
  className = ''
}) {
  const { t } = useTranslation()
  const canEdit = canModifyFn(user) && !disableActions

  return (
    <div className={`rounded-xl border border-gray-200 bg-gray-50 p-5 shadow-sm sticky top-6 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
        <div className="flex items-center gap-2">
          {onEdit && (
            <button
              onClick={onEdit}
              disabled={!canEdit}
              className="inline-flex items-center justify-center p-2 rounded-lg border border-gray-300 bg-white text-gray-700 shadow-sm hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white"
              title={disableActions ? t('detailInfoPanel.actions.editDisabled', 'Cannot edit: linked to closed or cancelled order') : t('detailInfoPanel.actions.edit', 'Edit')}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536M16.732 3.732a2.5 2.5 0 113.536 3.536L7.5 20.036H4v-3.572L16.732 3.732z" />
              </svg>
            </button>
          )}
          {onDelete && (
            <button
              onClick={onDelete}
              disabled={deleting || !canEdit}
              className="inline-flex items-center justify-center p-2 rounded-lg border border-red-300 bg-white text-red-700 shadow-sm hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white"
              title={deleting ? t('detailInfoPanel.actions.deleting', 'Deleting…') : disableActions ? t('detailInfoPanel.actions.deleteDisabled', 'Cannot delete: linked to closed or cancelled order') : t('detailInfoPanel.actions.delete', 'Delete')}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>
      {children}
    </div>
  )
}

export default DetailInfoPanel

