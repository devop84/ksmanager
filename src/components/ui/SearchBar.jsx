/**
 * Reusable search bar component
 */
export default function SearchBar({ 
  value, 
  onChange, 
  placeholder, 
  className = '' 
}) {
  return (
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={`w-full md:w-1/2 rounded-lg border border-gray-300 px-4 py-2 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 transition-shadow ${className}`}
    />
  )
}

