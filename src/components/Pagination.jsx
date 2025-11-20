import { useTranslation } from 'react-i18next'

/**
 * Reusable pagination component for list pages
 * @param {number} currentPage - Current page number (1-indexed)
 * @param {number} totalPages - Total number of pages
 * @param {number} totalItems - Total number of items across all pages
 * @param {number} pageSize - Number of items per page
 * @param {function} onPageChange - Callback when page changes (receives new page number)
 * @param {string} summaryKey - Optional translation key for summary text (defaults to generic)
 * @param {string} itemName - Optional item name for generic summary (e.g., "items", "records")
 */
function Pagination({ currentPage, totalPages, totalItems, pageSize, onPageChange, summaryKey, itemName = 'items' }) {
  const { t } = useTranslation()

  const handlePageChange = (newPage) => {
    const clampedPage = Math.min(Math.max(newPage, 1), totalPages)
    onPageChange(clampedPage)
  }

  // Calculate the number of items on the current page
  const startIndex = (currentPage - 1) * pageSize
  const endIndex = Math.min(startIndex + pageSize, totalItems)
  const currentPageItemCount = totalItems === 0 ? 0 : endIndex - startIndex

  // Use provided summary key or fallback to generic
  const summaryText = summaryKey
    ? t(summaryKey, {
        current: currentPage,
        total: totalPages,
        count: currentPageItemCount,
        all: totalItems,
      })
    : t('common.pagination.summary', {
        current: currentPage,
        total: totalPages,
        count: currentPageItemCount,
        all: totalItems,
        items: itemName,
      })

  return (
    <div className="flex items-center justify-between text-sm text-gray-600">
      <span>{summaryText}</span>
      <div className="space-x-2">
        <button
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-3 py-1 rounded-md border text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
        >
          {t('common.previous', 'Previous')}
        </button>
        <button
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="px-3 py-1 rounded-md border text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 transition-colors"
        >
          {t('common.next', 'Next')}
        </button>
      </div>
    </div>
  )
}

export default Pagination

