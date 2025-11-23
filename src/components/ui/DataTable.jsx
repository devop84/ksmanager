/**
 * Reusable data table component with sorting and custom cell rendering
 */
export default function DataTable({
  columns,
  data,
  sortConfig,
  onSort,
  onRowClick,
  renderCell,
  emptyMessage = 'No data found',
  className = ''
}) {
  return (
    <div className={`overflow-x-auto border border-gray-200 rounded-xl ${className}`}>
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            {columns.map((column, index) => {
              const isActive = sortConfig.key === column.key
              const align = column.align === 'right' ? 'text-right' : 'text-left'
              const isFirstColumn = index === 0
              return (
                <th
                  key={column.key}
                  onClick={() => onSort(column.key)}
                  className={`px-4 py-3 ${align} text-xs ${isFirstColumn ? 'font-bold' : 'font-semibold'} text-gray-600 uppercase tracking-wider cursor-pointer select-none hover:text-gray-900`}
                >
                  <div className={`flex items-center gap-1 ${column.align === 'right' ? 'justify-end' : ''}`}>
                    {column.label}
                    {isActive && (
                      <span className="text-gray-400">
                        {sortConfig.direction === 'asc' ? '▲' : '▼'}
                      </span>
                    )}
                  </div>
                </th>
              )
            })}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-100">
          {data.length === 0 ? (
            <tr>
              <td 
                colSpan={columns.length} 
                className="px-6 py-10 text-center text-sm text-gray-500"
              >
                {emptyMessage}
              </td>
            </tr>
          ) : (
            data.map((row) => (
              <tr
                key={row.id}
                onClick={() => onRowClick?.(row)}
                className={`${onRowClick ? 'hover:bg-gray-50 cursor-pointer' : ''}`}
              >
                {columns.map((column, index) => {
                  const isFirstColumn = index === 0
                  return (
                    <td key={column.key} className={`px-4 py-3 whitespace-nowrap text-sm text-gray-900 ${isFirstColumn ? 'font-semibold' : ''}`}>
                      {renderCell ? renderCell(column.key, row) : (row[column.key] ?? '—')}
                    </td>
                  )
                })}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}

