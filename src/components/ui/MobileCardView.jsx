/**
 * MobileCardView - Reusable component for displaying data in card format on mobile devices
 * @param {Array} data - Array of items to display
 * @param {string} emptyMessage - Message to show when data is empty
 * @param {Function} onItemClick - Callback when a card is clicked
 * @param {Function} renderCard - Function to render each card's content
 * @param {Function} renderActions - Optional function to render action buttons
 */
function MobileCardView({ data, emptyMessage, onItemClick, renderCard, renderActions }) {
  if (data.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-gray-300 px-4 py-6 text-center text-sm text-gray-500">
        {emptyMessage}
      </div>
    )
  }

  return (
    <div className="md:hidden space-y-3">
      {data.map((item) => (
        <div
          key={item.id}
          className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => onItemClick?.(item)}
        >
          {renderCard(item)}
          {renderActions && (
            <div onClick={(e) => e.stopPropagation()}>
              {renderActions(item)}
            </div>
          )}
        </div>
      ))}
    </div>
  )
}

export default MobileCardView

