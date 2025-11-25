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
  const [openOrder, setOpenOrder] = useState(null)

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


  // Load customer open order and credits when customer is selected
  useEffect(() => {
    if (formData.customer_id && !isEditing) {
      loadCustomerOpenOrder(parseInt(formData.customer_id))
      loadCustomerCredits(parseInt(formData.customer_id))
    } else {
      // Clear credits and order when no customer selected
      setCustomerCredits([])
      setOpenOrder(null)
    }
  }, [formData.customer_id, isEditing])

  const loadCustomerOpenOrder = async (customerId) => {
    try {
      const result = await sql`
        SELECT id, order_number, status
        FROM orders
        WHERE customer_id = ${customerId}
          AND status = 'open'
        ORDER BY created_at DESC
        LIMIT 1
      `
      if (result && result.length > 0) {
        setOpenOrder(result[0])
      } else {
        setOpenOrder(null)
      }
    } catch (err) {
      console.error('Failed to load customer open order:', err)
      setOpenOrder(null)
    }
  }

  const loadCustomerCredits = async (customerId) => {
    try {
      // Use the same query logic as CustomerDetail, but filter for available > 0
      const result = await sql`
        SELECT 
          csc.id as credit_id,
          csc.customer_id,
          csc.order_item_id,
          csc.service_package_id,
          csc.service_id,
          s.name as service_name,
          COALESCE(sp.name, 'Direct Service') as package_name,
          s.duration_unit,
          CASE 
            WHEN s.duration_unit = 'hours' THEN COALESCE(csc.total_hours, 0)
            WHEN s.duration_unit = 'days' THEN COALESCE(csc.total_days, 0)
            WHEN s.duration_unit = 'months' THEN COALESCE(csc.total_months, 0)::NUMERIC
            ELSE 0
          END as total,
          CASE 
            WHEN s.duration_unit = 'hours' THEN COALESCE(SUM(sa.duration_hours) FILTER (WHERE sa.status IN ('scheduled', 'completed') AND sa.cancelled_at IS NULL), 0)
            WHEN s.duration_unit = 'days' THEN COALESCE(SUM(sa.duration_days) FILTER (WHERE sa.status IN ('scheduled', 'completed') AND sa.cancelled_at IS NULL), 0)
            WHEN s.duration_unit = 'months' THEN COALESCE(SUM(sa.duration_months) FILTER (WHERE sa.status IN ('scheduled', 'completed') AND sa.cancelled_at IS NULL), 0)::NUMERIC
            ELSE 0
          END as used,
          CASE 
            WHEN s.duration_unit = 'hours' THEN COALESCE(csc.total_hours, 0) - COALESCE(SUM(sa.duration_hours) FILTER (WHERE sa.status IN ('scheduled', 'completed') AND sa.cancelled_at IS NULL), 0)
            WHEN s.duration_unit = 'days' THEN COALESCE(csc.total_days, 0) - COALESCE(SUM(sa.duration_days) FILTER (WHERE sa.status IN ('scheduled', 'completed') AND sa.cancelled_at IS NULL), 0)
            WHEN s.duration_unit = 'months' THEN (COALESCE(csc.total_months, 0)::NUMERIC - COALESCE(SUM(sa.duration_months) FILTER (WHERE sa.status IN ('scheduled', 'completed') AND sa.cancelled_at IS NULL), 0)::NUMERIC)
            ELSE 0
          END as available,
          COALESCE(csc.status, 'active') as status
        FROM customer_service_credits csc
        JOIN services s ON csc.service_id = s.id
        LEFT JOIN service_packages sp ON csc.service_package_id = sp.id
        LEFT JOIN scheduled_appointments sa ON sa.credit_id = csc.id
        WHERE csc.customer_id = ${customerId}
          AND COALESCE(csc.status, 'active') = 'active'
        GROUP BY csc.id, csc.customer_id, csc.order_item_id, csc.service_package_id, csc.service_id, 
                 s.name, sp.name, s.duration_unit, csc.total_hours, csc.total_days, csc.total_months, csc.status
        HAVING (
          CASE 
            WHEN s.duration_unit = 'hours' THEN COALESCE(csc.total_hours, 0) - COALESCE(SUM(sa.duration_hours) FILTER (WHERE sa.status IN ('scheduled', 'completed') AND sa.cancelled_at IS NULL), 0)
            WHEN s.duration_unit = 'days' THEN COALESCE(csc.total_days, 0) - COALESCE(SUM(sa.duration_days) FILTER (WHERE sa.status IN ('scheduled', 'completed') AND sa.cancelled_at IS NULL), 0)
            WHEN s.duration_unit = 'months' THEN (COALESCE(csc.total_months, 0)::NUMERIC - COALESCE(SUM(sa.duration_months) FILTER (WHERE sa.status IN ('scheduled', 'completed') AND sa.cancelled_at IS NULL), 0)::NUMERIC)
            ELSE 0
          END
        ) > 0
        ORDER BY csc.created_at DESC
      `
      
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
      if (credit && !formData.service_id && credit.service_id) {
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
          service_id: credit.service_id ? credit.service_id.toString() : '',
          service_package_id: credit.service_package_id ? credit.service_package_id.toString() : ''
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
    
    if (!formData.customer_id || !formData.service_id || !formData.scheduled_start || !formData.scheduled_end) {
      setError(t('appointmentForm.error.required', 'Please fill in all required fields.'))
      return
    }

    // Validate that customer has an open order
    if (!isEditing && !openOrder) {
      setError(t('appointmentForm.error.noOpenOrder', 'Customer must have an open order to create an appointment. Please create an order first.'))
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

    // Note: Credit is optional - appointments can be created without credits (generating negative credits)

    try {
      setSaving(true)
      setError(null)

      // Convert local datetime to ISO string (UTC) for database storage
      const startISO = convertLocalToISO(formData.scheduled_start)
      const endISO = convertLocalToISO(formData.scheduled_end)

      // Get order_id - use openOrder for new appointments, or get from existing appointment
      let orderId = null
      if (!isEditing) {
        orderId = openOrder?.id || null
      } else {
        // For editing, get order_id and order_status from existing appointment
        const existingAppointment = await sql`
          SELECT sa.order_id, o.status AS order_status
          FROM scheduled_appointments sa
          LEFT JOIN orders o ON sa.order_id = o.id
          WHERE sa.id = ${appointment.id}
        `
        if (existingAppointment && existingAppointment.length > 0) {
          const appointmentData = existingAppointment[0]
          // Prevent editing if linked to closed or cancelled order
          if (appointmentData.order_id && 
              (appointmentData.order_status === 'closed' || appointmentData.order_status === 'cancelled')) {
            setError(t('appointmentForm.error.orderClosedOrCancelled', 'Cannot edit appointment: linked to a closed or cancelled order.'))
            setSaving(false)
            return
          }
          orderId = appointmentData.order_id
        } else {
          // Try to find open order for this customer
          const openOrderResult = await sql`
            SELECT id FROM orders
            WHERE customer_id = ${parseInt(formData.customer_id)}
              AND status = 'open'
            ORDER BY created_at DESC
            LIMIT 1
          `
          if (openOrderResult && openOrderResult.length > 0) {
            orderId = openOrderResult[0].id
          }
        }
      }

      const appointmentData = {
        customer_id: parseInt(formData.customer_id),
        order_id: orderId,
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
            order_id = ${appointmentData.order_id},
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
              customer_id, order_id, attendee_name, service_id, service_package_id, credit_id,
              scheduled_start, scheduled_end,
              duration_hours, duration_days, duration_months,
              instructor_id, note, status
            )
            VALUES (
              ${appointmentData.customer_id}, ${appointmentData.order_id}, ${appointmentData.attendee_name}, ${appointmentData.service_id}, ${appointmentData.service_package_id}, ${appointmentData.credit_id},
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
                  customer_id, order_id, attendee_name, service_id, service_package_id, credit_id,
                  scheduled_start, scheduled_end,
                  duration_hours, duration_days, duration_months,
                  instructor_id, note, status
                )
                VALUES (
                  ${appointmentData.customer_id}, ${appointmentData.order_id}, ${appointmentData.attendee_name}, ${appointmentData.service_id}, ${appointmentData.service_package_id}, ${appointmentData.credit_id},
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

            {/* Open Order Check */}
            {!isEditing && formData.customer_id && (
              <div>
                {openOrder ? (
                  <div className="rounded-lg border border-green-200 bg-green-50 p-4">
                    <p className="text-sm text-green-800">
                      {t('appointmentForm.openOrderFound', 'Open order found: {{orderNumber}}', { orderNumber: openOrder.order_number || openOrder.id })}
                    </p>
                  </div>
                ) : (
                  <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                    <p className="text-sm text-red-800">
                      {t('appointmentForm.noOpenOrder', 'Customer must have an open order to create an appointment. Please create an order first.')}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Service Selection */}
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700" htmlFor="service_id">
                {t('appointmentForm.fields.service', 'Service')} <span className="text-red-500">*</span>
              </label>
              <select
                id="service_id"
                name="service_id"
                value={formData.service_id}
                onChange={handleChange}
                required
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
              >
                <option value="">{t('appointmentForm.fields.selectService', 'Select a service...')}</option>
                {services.map((service) => (
                  <option key={service.id} value={service.id}>
                    {service.name}
                  </option>
                ))}
              </select>
            </div>

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

