import { useState, useMemo, useEffect } from 'react'

/**
 * Custom hook for managing data table state, filtering, and sorting
 * @param {Array} initialData - Initial data array
 * @param {Object} options - Configuration options
 * @param {Array} options.searchFields - Fields to search in
 * @param {string} options.defaultSortKey - Default sort column key
 * @param {string} options.defaultSortDirection - Default sort direction ('asc' | 'desc')
 * @param {Function} options.customFilterFn - Custom filter function
 * @param {Function} options.customSortFn - Custom sort function
 * @returns {Object} Table state and handlers
 */
export function useDataTable(initialData = [], options = {}) {
  const {
    searchFields = [],
    defaultSortKey = 'name',
    defaultSortDirection = 'asc',
    customFilterFn = null,
    customSortFn = null
  } = options

  const [data, setData] = useState(initialData)
  const [searchTerm, setSearchTerm] = useState('')
  const [sortConfig, setSortConfig] = useState({ 
    key: defaultSortKey, 
    direction: defaultSortDirection 
  })

  // Update data when initialData changes
  useEffect(() => {
    setData(initialData)
  }, [initialData])

  const filteredData = useMemo(() => {
    let filtered = data

    // Custom filter function
    if (customFilterFn) {
      filtered = customFilterFn(filtered, searchTerm)
    } else if (searchTerm.trim()) {
      // Search across all fields if searchFields not specified, otherwise use specified fields
      const query = searchTerm.toLowerCase()
      filtered = filtered.filter((item) => {
        if (searchFields.length > 0) {
          // Search only specified fields
          return searchFields
            .map(field => item[field])
            .filter(value => value != null && value !== undefined)
            .some(value => value.toString().toLowerCase().includes(query))
        } else {
          // Search all fields (all object values)
          return Object.values(item)
            .filter(value => value != null && value !== undefined)
            .some(value => value.toString().toLowerCase().includes(query))
        }
      })
    }

    return filtered
  }, [data, searchTerm, searchFields, customFilterFn])

  const sortedData = useMemo(() => {
    const sorted = [...filteredData]
    
    if (customSortFn) {
      return customSortFn(sorted, sortConfig)
    }

    sorted.sort((a, b) => {
      let aValue = a[sortConfig.key] ?? ''
      let bValue = b[sortConfig.key] ?? ''

      // Handle dates (common patterns)
      if (
        sortConfig.key.includes('_at') || 
        sortConfig.key === 'created_at' || 
        sortConfig.key === 'updated_at' ||
        sortConfig.key === 'birthdate' ||
        sortConfig.key === 'scheduled_start' ||
        sortConfig.key === 'scheduled_end'
      ) {
        aValue = aValue ? new Date(aValue).getTime() : 0
        bValue = bValue ? new Date(bValue).getTime() : 0
      }
      // Handle numbers (including numeric strings)
      else if (typeof aValue === 'number' || !isNaN(Number(aValue))) {
        aValue = Number(aValue) || 0
        bValue = Number(bValue) || 0
      }
      // Handle strings
      else if (typeof aValue === 'string' && typeof bValue === 'string') {
        aValue = aValue.toLowerCase()
        bValue = bValue.toLowerCase()
      }

      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1
      return 0
    })

    return sorted
  }, [filteredData, sortConfig, customSortFn])

  const handleSort = (key) => {
    setSortConfig((prev) => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }))
  }

  const handleSearchChange = (value) => {
    setSearchTerm(value)
  }

  return {
    data,
    setData,
    searchTerm,
    sortConfig,
    filteredData: sortedData,
    handleSort,
    handleSearchChange
  }
}

