import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import sql from '../../lib/neon'

const initialFormState = {
  customer_id: '',
  attendee_name: '',
  service_id: '',
  service_package_id: '',
  credit_id: '',
  scheduled_start: '',
  scheduled_end: '',
  duration_hours: '',
  duration_days: '',
  duration_months: '',
  instructor_id: '',
  note: ''
}

function AppointmentForm({ appointment, customer, onCancel, onSaved }) {
  const isEditing = Boolean(appointment?.id)
  const { t } = useTranslation()
  const [formData, setFormData] = useState(initialFormState)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [customers, setCustomers] = useState([])
  const [services, setServices] = useState([])
  const [allServices, setAllServices] = useState([]) // Keep all services for filtering
  const [servicePackages, setServicePackages] = useState([])
  const [customerCredits, setCustomerCredits] = useState([])
  const [instructors, setInstructors] = useState([])
  const [selectedService, setSelectedService] = useState(null)
  const [selectedCredit, setSelectedCredit] = useState(null)

  // Helper function to format date to datetime-local string (always in local time)
  // Input: ISO string from database (UTC) or timestamp -> Output: datetime-local string (local time)
  const formatDateTimeLocal = (dateStr) => {
    if (!dateStr) return ''
    
    // Create date object from ISO string or timestamp (UTC from database)
    // When database returns a TIMESTAMP, PostgreSQL returns it as an ISO string with timezone
    // or as a Date object. We need to ensure it's parsed correctly.
    let date
    if (typeof dateStr === 'string') {
      // If it's a string, create Date object (will parse ISO with timezone correctly)
      date = new Date(dateStr)
    } else if (dateStr instanceof Date) {
      date = dateStr
    } else {
      // Try to parse as timestamp
      date = new Date(dateStr)
    }
    
    // Check if date is valid
    if (isNaN(date.getTime())) {
      console.warn('Invalid date in formatDateTimeLocal:', dateStr)
      return ''
    }
    
    // Get local time components (these methods ALWAYS return local time)
    // When date is UTC from database, getHours() automatically converts to local time
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    
    return `${year}-${month}-${day}T${hours}:${minutes}`
  }

  // Helper function to parse datetime-local string as local time Date object
  const parseDateTimeLocal = (localDateTimeStr) => {
    if (!localDateTimeStr) return null
    
    // Parse the datetime-local string (format: "YYYY-MM-DDTHH:mm")
    const [datePart, timePart] = localDateTimeStr.split('T')
    if (!datePart || !timePart) return null
    
    const [year, month, day] = datePart.split('-').map(Number)
    const [hours, minutes] = timePart.split(':').map(Number)
    
    // Create a date object in local time
    // Using new Date(year, month-1, day, hours, minutes) creates a date in LOCAL time
    const localDate = new Date(year, month - 1, day, hours || 0, minutes || 0, 0, 0)
    
    if (isNaN(localDate.getTime())) return null
    return localDate
  }

  // Helper function to convert datetime-local string to ISO string for database (UTC)
  const convertLocalToISO = (localDateTimeStr) => {
    const localDate = parseDateTimeLocal(localDateTimeStr)
    if (!localDate) return null
    
    // Convert to ISO string (UTC) for database storage
    return localDate.toISOString()
  }

  useEffect(() => {
    if (appointment) {
      // Format dates for datetime-local input (convert from UTC to local time)
      // PostgreSQL TIMESTAMP WITH TIME ZONE automatically converts to client timezone
      // Neon driver should return ISO string with timezone, which we parse correctly
      const startLocal = formatDateTimeLocal(appointment.scheduled_start)
      const endLocal = formatDateTimeLocal(appointment.scheduled_end)

      setFormData({
        customer_id: appointment.customer_id?.toString() || '',
        attendee_name: appointment.attendee_name || '',
        service_id: appointment.service_id?.toString() || '',
        service_package_id: appointment.service_package_id?.toString() || '',
        credit_id: appointment.credit_id?.toString() || '',
        scheduled_start: startLocal,
        scheduled_end: endLocal,
        duration_hours: appointment.duration_hours?.toString() || '',
        duration_days: appointment.duration_days?.toString() || '',
        duration_months: appointment.duration_months?.toString() || '',
        instructor_id: appointment.instructor_id?.toString() || '',
        note: appointment.note || ''
      })
    } else if (customer) {
      // Pre-fill customer if coming from customer detail
      setFormData({
        ...initialFormState,
        customer_id: customer.id.toString()
      })
      loadCustomerCredits(customer.id)
    } else {
      setFormData(initialFormState)
    }
  }, [appointment, customer])

  useEffect(() => {
    // Load dropdown options
    const fetchData = async () => {
      try {
        const [customersResult, servicesResult, packagesResult, instructorsResult] = await Promise.all([
          sql`SELECT id, fullname FROM customers ORDER BY fullname ASC`,
          sql`SELECT s.id, s.name, s.duration_unit, s.category_id, sc.name AS category_name FROM services s LEFT JOIN service_categories sc ON s.category_id = sc.id WHERE s.is_active = true ORDER BY s.name ASC`,
          sql`SELECT sp.id, sp.name, sp.service_id, s.name AS service_name FROM service_packages sp LEFT JOIN services s ON sp.service_id = s.id WHERE sp.is_active = true ORDER BY s.name ASC, sp.name ASC`,
          sql`SELECT id, fullname FROM instructors ORDER BY fullname ASC`
        ])
        setCustomers(customersResult || [])
        setAllServices(servicesResult || [])
        setServices(servicesResult || [])
        setServicePackages(packagesResult || [])
        setInstructors(instructorsResult || [])
        console.log('Instructors loaded:', instructorsResult?.length || 0, instructorsResult)
      } catch (err) {
        console.error('Failed to load form data:', err)
      }
    }
    fetchData()
  }, [])


  // Load customer credits when customer is selected
  useEffect(() => {
    if (formData.customer_id && !isEditing) {
      loadCustomerCredits(parseInt(formData.customer_id))
    } else {
      // Clear credits when no customer selected
      setCustomerCredits([])
    }
  }, [formData.customer_id, isEditing])

  const loadCustomerCredits = async (customerId) => {
    try {
      // Try to use the function first
      let result = await sql`
        SELECT * FROM get_customer_credits(${customerId})
        WHERE available > 0 AND status = 'active'
        ORDER BY created_at DESC
      `.catch(() => null)
      
      // Fallback if function doesn't work
      if (!result) {
        result = await sql`
          SELECT 
            csc.id as credit_id,
            csc.customer_id,
            csc.order_item_id,
            csc.service_package_id,
            csc.service_id,
            s.name as service_name,
            sp.name as package_name,
            s.duration_unit,
            CASE 
              WHEN s.duration_unit = 'hours' THEN csc.total_hours
              WHEN s.duration_unit = 'days' THEN csc.total_days
              WHEN s.duration_unit = 'months' THEN csc.total_months::NUMERIC
              ELSE 0
            END as total,
            CASE 
              WHEN s.duration_unit = 'hours' THEN COALESCE(SUM(sa.duration_hours) FILTER (WHERE sa.status IN ('scheduled', 'completed') AND sa.cancelled_at IS NULL), 0)
              WHEN s.duration_unit = 'days' THEN COALESCE(SUM(sa.duration_days) FILTER (WHERE sa.status IN ('scheduled', 'completed') AND sa.cancelled_at IS NULL), 0)
              WHEN s.duration_unit = 'months' THEN COALESCE(SUM(sa.duration_months) FILTER (WHERE sa.status IN ('scheduled', 'completed') AND sa.cancelled_at IS NULL), 0)::NUMERIC
              ELSE 0
            END as used,
            CASE 
              WHEN s.duration_unit = 'hours' THEN csc.total_hours - COALESCE(SUM(sa.duration_hours) FILTER (WHERE sa.status IN ('scheduled', 'completed') AND sa.cancelled_at IS NULL), 0)
              WHEN s.duration_unit = 'days' THEN csc.total_days - COALESCE(SUM(sa.duration_days) FILTER (WHERE sa.status IN ('scheduled', 'completed') AND sa.cancelled_at IS NULL), 0)
              WHEN s.duration_unit = 'months' THEN (csc.total_months::NUMERIC - COALESCE(SUM(sa.duration_months) FILTER (WHERE sa.status IN ('scheduled', 'completed') AND sa.cancelled_at IS NULL), 0)::NUMERIC)
              ELSE 0
            END as available,
            csc.status
          FROM customer_service_credits csc
          JOIN services s ON csc.service_id = s.id
          JOIN service_packages sp ON csc.service_package_id = sp.id
          LEFT JOIN scheduled_appointments sa ON sa.credit_id = csc.id
          WHERE csc.customer_id = ${customerId}
            AND csc.status = 'active'
          GROUP BY csc.id, csc.customer_id, csc.order_item_id, csc.service_package_id, csc.service_id, 
                   s.name, sp.name, s.duration_unit, csc.total_hours, csc.total_days, csc.total_months, csc.status
          HAVING (
            CASE 
              WHEN s.duration_unit = 'hours' THEN csc.total_hours - COALESCE(SUM(sa.duration_hours) FILTER (WHERE sa.status IN ('scheduled', 'completed') AND sa.cancelled_at IS NULL), 0)
              WHEN s.duration_unit = 'days' THEN csc.total_days - COALESCE(SUM(sa.duration_days) FILTER (WHERE sa.status IN ('scheduled', 'completed') AND sa.cancelled_at IS NULL), 0)
              WHEN s.duration_unit = 'months' THEN (csc.total_months::NUMERIC - COALESCE(SUM(sa.duration_months) FILTER (WHERE sa.status IN ('scheduled', 'completed') AND sa.cancelled_at IS NULL), 0)::NUMERIC)
              ELSE 0
            END
          ) > 0
          ORDER BY csc.created_at DESC
        `
      }
      
      setCustomerCredits(result || [])
    } catch (err) {
      console.error('Failed to load customer credits:', err)
      setCustomerCredits([])
      setServiceCreditsMap({})
    }
  }

  // Load service details when service is selected
  useEffect(() => {
    if (formData.service_id) {
      // Try to find service in allServices first (most complete data), then in services
      let service = allServices.find(s => s.id.toString() === formData.service_id)
      if (!service) {
        service = services.find(s => s.id.toString() === formData.service_id)
      }
      
      setSelectedService(service || null)
      
      // Clear instructor_id if service category is not "lessons"
      if (service && service.category_name && service.category_name.toLowerCase() !== 'lessons') {
        setFormData(prev => ({ ...prev, instructor_id: '' }))
      }
    } else {
      setSelectedService(null)
    }
  }, [formData.service_id, services, allServices])

  // Load credit details when credit is selected
  useEffect(() => {
    if (formData.credit_id) {
      const credit = customerCredits.find(c => c.credit_id.toString() === formData.credit_id)
      setSelectedCredit(credit || null)
      
      // Auto-fill service from credit
      if (credit && !formData.service_id) {
        setFormData(prev => ({ ...prev, service_id: credit.service_id.toString() }))
      }
    } else {
      setSelectedCredit(null)
    }
  }, [formData.credit_id, customerCredits])

  // Calculate end time from start time and duration (all in local time)
  useEffect(() => {
    if (formData.scheduled_start && (formData.duration_hours || formData.duration_days || formData.duration_months)) {
      // Parse the datetime-local string explicitly as local time
      const [datePart, timePart] = formData.scheduled_start.split('T')
      if (!datePart || !timePart) return
      
      const [year, month, day] = datePart.split('-').map(Number)
      const [hours, minutes] = timePart.split(':').map(Number)
      
      // Create date in local time using Date constructor (this creates local time, not UTC)
      let end = new Date(year, month - 1, day, hours, minutes, 0, 0)
      
      // Check if valid date
      if (isNaN(end.getTime())) return
      
      // Add duration in local time (these methods work in local time)
      if (formData.duration_hours) {
        end.setHours(end.getHours() + parseFloat(formData.duration_hours))
      } else if (formData.duration_days) {
        end.setDate(end.getDate() + parseFloat(formData.duration_days))
      } else if (formData.duration_months) {
        end.setMonth(end.getMonth() + parseInt(formData.duration_months))
      }
      
      // Format for datetime-local input (local time components)
      const endYear = end.getFullYear()
      const endMonth = String(end.getMonth() + 1).padStart(2, '0')
      const endDay = String(end.getDate()).padStart(2, '0')
      const endHours = String(end.getHours()).padStart(2, '0')
      const endMinutes = String(end.getMinutes()).padStart(2, '0')
      const formattedEnd = `${endYear}-${endMonth}-${endDay}T${endHours}:${endMinutes}`
      
      if (formData.scheduled_end !== formattedEnd) {
        setFormData(prev => ({ ...prev, scheduled_end: formattedEnd }))
      }
    }
  }, [formData.scheduled_start, formData.duration_hours, formData.duration_days, formData.duration_months])

  const handleChange = (event) => {
    const { name, value } = event.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleCreditChange = (creditId) => {
    if (creditId) {
      const credit = customerCredits.find(c => c.credit_id.toString() === creditId)
      if (credit) {
        setFormData(prev => ({
          ...prev,
          credit_id: creditId,
          service_id: credit.service_id.toString(),
          service_package_id: credit.service_package_id.toString()
        }))
        // The useEffect watching formData.service_id will handle setting selectedService
      }
    } else {
      setFormData(prev => ({ ...prev, credit_id: '', service_id: '', service_package_id: '' }))
    }
  }

  const handleDurationChange = (unit, value) => {
    setFormData(prev => {
      const newData = {
        ...prev,
        [`duration_${unit}`]: value,
        duration_hours: unit === 'hours' ? value : '',
        duration_days: unit === 'days' ? value : '',
        duration_months: unit === 'months' ? value : ''
      }
      return newData
    })
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    
    // Prevent double submission
    if (saving) {
      return
    }
    
    if (!formData.customer_id || (!isEditing && !formData.credit_id) || !formData.service_id || !formData.scheduled_start || !formData.scheduled_end) {
      setError(t('appointmentForm.error.required', 'Please fill in all required fields.'))
      return
    }

    // Validate that end is after start
    // Parse datetime-local strings explicitly as local time for comparison
    const startDate = parseDateTimeLocal(formData.scheduled_start)
    const endDate = parseDateTimeLocal(formData.scheduled_end)
    if (!startDate || !endDate || endDate <= startDate) {
      setError(t('appointmentForm.error.invalidTime', 'End time must be after start time.'))
      return
    }

    // Validate duration matches service duration unit
    if (selectedService) {
      if (selectedService.duration_unit === 'hours' && !formData.duration_hours) {
        setError(t('appointmentForm.error.durationRequired', 'Duration is required for this service.'))
        return
      }
      if (selectedService.duration_unit === 'days' && !formData.duration_days) {
        setError(t('appointmentForm.error.durationRequired', 'Duration is required for this service.'))
        return
      }
      if (selectedService.duration_unit === 'months' && !formData.duration_months) {
        setError(t('appointmentForm.error.durationRequired', 'Duration is required for this service.'))
        return
      }
    }

    // Validate credit is selected (required for new appointments)
    if (!isEditing && !formData.credit_id) {
      setError(t('appointmentForm.error.creditRequired', 'Please select a credit package to use for this appointment'))
      return
    }

    // Validate credit availability if using credit
    if (formData.credit_id && selectedCredit) {
      const requestedDuration = parseFloat(
        formData.duration_hours || formData.duration_days || formData.duration_months || 0
      )
      const available = parseFloat(selectedCredit.available || 0)
      
      if (requestedDuration > available) {
        setError(t('appointmentForm.error.insufficientCredit', 'Insufficient credit. Available: {{available}}', { available }))
        return
      }
    }

    try {
      setSaving(true)
      setError(null)

      // Convert local datetime to ISO string (UTC) for database storage
      const startISO = convertLocalToISO(formData.scheduled_start)
      const endISO = convertLocalToISO(formData.scheduled_end)

      const appointmentData = {
        customer_id: parseInt(formData.customer_id),
        attendee_name: formData.attendee_name?.trim() || null,
        service_id: parseInt(formData.service_id),
        service_package_id: formData.service_package_id ? parseInt(formData.service_package_id) : null,
        credit_id: formData.credit_id ? parseInt(formData.credit_id) : null,
        // Convert local datetime to ISO string (UTC) for database storage
        scheduled_start: startISO,
        scheduled_end: endISO,
        duration_hours: formData.duration_hours ? parseFloat(formData.duration_hours) : null,
        duration_days: formData.duration_days ? parseFloat(formData.duration_days) : null,
        duration_months: formData.duration_months ? parseInt(formData.duration_months) : null,
        instructor_id: formData.instructor_id ? parseInt(formData.instructor_id) : null,
        note: formData.note || null,
        status: appointment?.status || 'scheduled'
      }

      if (isEditing) {
        await sql`
          UPDATE scheduled_appointments
          SET 
            customer_id = ${appointmentData.customer_id},
            attendee_name = ${appointmentData.attendee_name},
            service_id = ${appointmentData.service_id},
            service_package_id = ${appointmentData.service_package_id},
            credit_id = ${appointmentData.credit_id},
            scheduled_start = ${appointmentData.scheduled_start},
            scheduled_end = ${appointmentData.scheduled_end},
            duration_hours = ${appointmentData.duration_hours},
            duration_days = ${appointmentData.duration_days},
            duration_months = ${appointmentData.duration_months},
            instructor_id = ${appointmentData.instructor_id},
            note = ${appointmentData.note},
            updated_at = CURRENT_TIMESTAMP
          WHERE id = ${appointment.id}
        `
      } else {
        try {
          await sql`
            INSERT INTO scheduled_appointments (
              customer_id, attendee_name, service_id, service_package_id, credit_id,
              scheduled_start, scheduled_end,
              duration_hours, duration_days, duration_months,
              instructor_id, note, status
            )
            VALUES (
              ${appointmentData.customer_id}, ${appointmentData.attendee_name}, ${appointmentData.service_id}, ${appointmentData.service_package_id}, ${appointmentData.credit_id},
              ${appointmentData.scheduled_start}, ${appointmentData.scheduled_end},
              ${appointmentData.duration_hours}, ${appointmentData.duration_days}, ${appointmentData.duration_months},
              ${appointmentData.instructor_id}, ${appointmentData.note}, ${appointmentData.status}
            )
          `
        } catch (insertErr) {
          // If duplicate key error, try to fix the sequence and retry once
          if (insertErr.message && insertErr.message.includes('duplicate key') && insertErr.message.includes('scheduled_appointments_pkey')) {
            try {
              // Fix the sequence by setting it to the max ID + 1
              await sql`
                SELECT setval(
                  'scheduled_appointments_id_seq',
                  COALESCE((SELECT MAX(id) FROM scheduled_appointments), 0) + 1,
                  false
                )
              `
              // Retry the insert after fixing the sequence
              await sql`
                INSERT INTO scheduled_appointments (
                  customer_id, attendee_name, service_id, service_package_id, credit_id,
                  scheduled_start, scheduled_end,
                  duration_hours, duration_days, duration_months,
                  instructor_id, note, status
                )
                VALUES (
                  ${appointmentData.customer_id}, ${appointmentData.attendee_name}, ${appointmentData.service_id}, ${appointmentData.service_package_id}, ${appointmentData.credit_id},
                  ${appointmentData.scheduled_start}, ${appointmentData.scheduled_end},
                  ${appointmentData.duration_hours}, ${appointmentData.duration_days}, ${appointmentData.duration_months},
                  ${appointmentData.instructor_id}, ${appointmentData.note}, ${appointmentData.status}
                )
              `
            } catch (retryErr) {
              // If retry also fails, throw the original error
              throw insertErr
            }
          } else {
            // Re-throw if it's not a duplicate key error
            throw insertErr
          }
        }
      }

      onSaved?.()
    } catch (err) {
      console.error('Failed to save appointment:', err)
      // Check for duplicate key error (primary key violation)
      if (err.message && err.message.includes('duplicate key')) {
        setError(t('appointmentForm.error.duplicate', 'This appointment already exists. Please refresh the page and try again.'))
      } else {
        setError(t('appointmentForm.error.save', 'Unable to save appointment. Please try again.'))
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="px-4 py-6 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900">
            {isEditing ? t('appointmentForm.title.edit', 'Edit Appointment') : t('appointmentForm.title.create', 'Schedule Appointment')}
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            {isEditing ? t('appointmentForm.subtitle.edit', 'Update appointment details.') : t('appointmentForm.subtitle.create', 'Create a new scheduled appointment.')}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm" noValidate>
          {error && (
            <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="space-y-6">
            {/* Customer and Attendee Name - Inline */}
            <div className="grid gap-6 md:grid-cols-2">
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700" htmlFor="customer_id">
                  {t('appointmentForm.fields.customer', 'Customer *')}
                </label>
                <select
                  id="customer_id"
                  name="customer_id"
                  required
                  value={formData.customer_id}
                  onChange={handleChange}
                  disabled={!!customer}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  <option value="">{t('appointmentForm.fields.selectCustomer', 'Select a customer...')}</option>
                  {customers.map((cust) => (
                    <option key={cust.id} value={cust.id}>
                      {cust.fullname}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700" htmlFor="attendee_name">
                  {t('appointmentForm.fields.attendeeName', 'Attendee Name (Optional)')}
                </label>
                <input
                  type="text"
                  id="attendee_name"
                  name="attendee_name"
                  value={formData.attendee_name}
                  onChange={handleChange}
                  placeholder={t('appointmentForm.fields.attendeePlaceholder', 'Family member or friend name')}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                />
                <p className="mt-1.5 text-xs text-gray-500">
                  {t('appointmentForm.fields.attendeeHelp', 'For appointments booked for someone else')}
                </p>
              </div>
            </div>

            {/* Credit Selection - Primary Selector (replaces Service Dropdown) */}
            {!isEditing && formData.customer_id && customerCredits.length > 0 && (
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700" htmlFor="credit_id">
                  {t('appointmentForm.fields.credit', 'Use Credit')} <span className="text-red-500">*</span>
                </label>
                <select
                  id="credit_id"
                  name="credit_id"
                  value={formData.credit_id}
                  onChange={(e) => handleCreditChange(e.target.value)}
                  required
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                >
                  <option value="">{t('appointmentForm.fields.selectCredit', 'Select a credit package...')}</option>
                  {customerCredits.map((credit) => (
                    <option key={credit.credit_id} value={credit.credit_id}>
                      {credit.service_name} - {credit.package_name}
                    </option>
                  ))}
                </select>
                {selectedCredit && (
                  <p className="mt-1.5 text-sm text-gray-600">
                    {t('appointmentForm.creditInfo', 'Available: {{available}} {{unit}}', { 
                      available: Number(selectedCredit.available || 0).toFixed(2), 
                      unit: selectedCredit.duration_unit 
                    })}
                  </p>
                )}
              </div>
            )}
            {!isEditing && formData.customer_id && customerCredits.length === 0 && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-4">
                <p className="text-sm text-amber-800">
                  {t('appointmentForm.noCredits', 'This customer has no available credits. Please purchase a service package first.')}
                </p>
              </div>
            )}

            {/* Duration, Start Time, End Time in same row */}
            {selectedService && selectedService.duration_unit !== 'none' && (
              <div className="grid gap-6 md:grid-cols-3">
                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700">
                    {t('appointmentForm.fields.duration', 'Duration *')} ({selectedService.duration_unit})
                  </label>
                  {selectedService.duration_unit === 'hours' && (
                    <input
                      type="number"
                      step="0.5"
                      min="0.5"
                      required
                      value={formData.duration_hours}
                      onChange={(e) => handleDurationChange('hours', e.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                    />
                  )}
                  {selectedService.duration_unit === 'days' && (
                    <input
                      type="number"
                      step="0.5"
                      min="0.5"
                      required
                      value={formData.duration_days}
                      onChange={(e) => handleDurationChange('days', e.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                    />
                  )}
                  {selectedService.duration_unit === 'months' && (
                    <input
                      type="number"
                      min="1"
                      required
                      value={formData.duration_months}
                      onChange={(e) => handleDurationChange('months', e.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                    />
                  )}
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700" htmlFor="scheduled_start">
                    {t('appointmentForm.fields.startTime', 'Start Time *')}
                    <span className="ml-2 text-xs font-normal text-gray-500">(Local Time)</span>
                  </label>
                  <input
                    type="datetime-local"
                    id="scheduled_start"
                    name="scheduled_start"
                    required
                    value={formData.scheduled_start}
                    onChange={handleChange}
                    step="300"
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700" htmlFor="scheduled_end">
                    {t('appointmentForm.fields.endTime', 'End Time *')}
                    <span className="ml-2 text-xs font-normal text-gray-500">(Local Time)</span>
                  </label>
                  <input
                    type="datetime-local"
                    id="scheduled_end"
                    name="scheduled_end"
                    required
                    value={formData.scheduled_end}
                    onChange={handleChange}
                    step="300"
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                  />
                </div>
              </div>
            )}

            {/* Instructor Field */}
            {selectedService && selectedService.category_name && selectedService.category_name.toLowerCase() === 'lessons' && (
              <div>
                <label className="mb-2 block text-sm font-medium text-gray-700" htmlFor="instructor_id">
                  {t('appointmentForm.fields.instructor', 'Instructor')}
                </label>
                <select
                  id="instructor_id"
                  name="instructor_id"
                  value={formData.instructor_id}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                >
                  <option value="">{t('appointmentForm.fields.selectInstructor', 'Select an instructor...')}</option>
                  {instructors && instructors.length > 0 ? (
                    instructors.map((instructor) => (
                      <option key={instructor.id} value={instructor.id}>
                        {instructor.fullname}
                      </option>
                    ))
                  ) : (
                    <option value="" disabled>{t('appointmentForm.fields.noInstructors', 'No instructors available')}</option>
                  )}
                </select>
              </div>
            )}

            {/* Notes */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700" htmlFor="note">
                {t('appointmentForm.fields.note', 'Note')}
              </label>
              <textarea
                id="note"
                name="note"
                rows="3"
                value={formData.note}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
              />
            </div>
          </div>

          <div className="mt-6 flex items-center justify-end gap-4">
            <button
              type="button"
              onClick={onCancel}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
            >
              {t('appointmentForm.buttons.cancel', 'Cancel')}
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg border border-indigo-600 bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? t('appointmentForm.buttons.saving', 'Saving...') : t('appointmentForm.buttons.save', 'Save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AppointmentForm

