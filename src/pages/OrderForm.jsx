import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import sql from '../lib/neon'
import { useSettings } from '../context/SettingsContext'

const STORAGE_BILLING_BLUEPRINT = [
  {
    key: 'daily',
    labelKey: 'orderForm.storage.billing.daily.label',
    descriptionKey: 'orderForm.storage.billing.daily.description',
    fallbackLabel: 'By day',
    fallbackDescription: 'Charge per day of storage',
  },
  {
    key: 'weekly',
    labelKey: 'orderForm.storage.billing.weekly.label',
    descriptionKey: 'orderForm.storage.billing.weekly.description',
    fallbackLabel: 'By week',
    fallbackDescription: 'Charge per 7-day block',
  },
  {
    key: 'monthly',
    labelKey: 'orderForm.storage.billing.monthly.label',
    descriptionKey: 'orderForm.storage.billing.monthly.description',
    fallbackLabel: 'By month',
    fallbackDescription: 'Charge per calendar month',
  },
]

const RENTAL_BILLING_BLUEPRINT = [
  {
    key: 'hourly',
    labelKey: 'orderForm.rental.billing.hourly.label',
    descriptionKey: 'orderForm.rental.billing.hourly.description',
    fallbackLabel: 'By hour',
    fallbackDescription: 'Charge per hour of rental time',
  },
  {
    key: 'daily',
    labelKey: 'orderForm.rental.billing.daily.label',
    descriptionKey: 'orderForm.rental.billing.daily.description',
    fallbackLabel: 'By day',
    fallbackDescription: 'Charge per 24-hour period',
  },
]

const baseState = {
  id: null,
  service_id: '',
  customer_id: '',
  cancelled: false,
  note: '',
  student_id: '',
  instructor_id: '',
  equipment_id: '',
  storage_id: '',
  hourly: false,
  daily: false,
  weekly: false,
  monthly: false,
  check_in: '',
  check_out: '',
  starting: '',
  ending: '',
  lesson_day: '',
  lesson_start_time: '00:00',
  lesson_end_time: '00:00'
}

function toInputDateTime(value) {
  if (!value) return ''
  const date = new Date(value)
  // Convert to local time for datetime-local input
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${year}-${month}-${day}T${hours}:${minutes}`
}

function OrderForm({ order = null, onCancel, onSaved }) {
  const isEditing = Boolean(order?.id)
  const [formData, setFormData] = useState(baseState)
  const [services, setServices] = useState([])
  const [customers, setCustomers] = useState([])
  const [instructors, setInstructors] = useState([])
  const [equipment, setEquipment] = useState([])
  const [storageOptions, setStorageOptions] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [storageDurationInfo, setStorageDurationInfo] = useState(null)
  const [rentalDurationInfo, setRentalDurationInfo] = useState(null)
  const { formatTime } = useSettings()
  const { t } = useTranslation()

  const storageBillingOptions = useMemo(
    () =>
      STORAGE_BILLING_BLUEPRINT.map((option) => ({
        ...option,
        label: t(option.labelKey, option.fallbackLabel),
        description: t(option.descriptionKey, option.fallbackDescription),
      })),
    [t],
  )

  const rentalBillingOptions = useMemo(
    () =>
      RENTAL_BILLING_BLUEPRINT.map((option) => ({
        ...option,
        label: t(option.labelKey, option.fallbackLabel),
        description: t(option.descriptionKey, option.fallbackDescription),
      })),
    [t],
  )

  const getStorageOptionLabel = (mode) =>
    storageBillingOptions.find((option) => option.key === mode)?.label || mode
  const getRentalOptionLabel = (mode) =>
    rentalBillingOptions.find((option) => option.key === mode)?.label || mode

  useEffect(() => {
    const loadForm = async () => {
      try {
        setLoading(true)
        const [serviceRows, customerRows, instructorRows, equipmentRows, storageRows] = await Promise.all([
          sql`
            SELECT s.id, s.name, sc.name AS category_name
            FROM services s
            JOIN service_categories sc ON sc.id = s.category_id
            ORDER BY s.name
          `,
          sql`SELECT id, fullname FROM customers ORDER BY fullname`,
          sql`SELECT id, fullname FROM instructors ORDER BY fullname`,
          sql`SELECT id, name FROM equipment ORDER BY name`,
          sql`
            SELECT s.id, s.name
            FROM services s
            JOIN service_categories sc ON sc.id = s.category_id
            WHERE sc.name = 'storage'
            ORDER BY s.name
          `
        ])

        setServices(serviceRows || [])
        setCustomers(customerRows || [])
        setInstructors(instructorRows || [])
        setEquipment(equipmentRows || [])
        setStorageOptions(storageRows || [])

        if (isEditing && order?.id) {
          const rows =
            (await sql`
              SELECT
                o.id,
                o.service_id,
                o.customer_id,
                o.cancelled,
                s.name AS service_name,
                sc.name AS category_name,
                o.created_at,
                ol.student_id,
                ol.instructor_id,
                ol.starting AS lesson_start,
                ol.ending AS lesson_end,
                ol.note AS lesson_note,
                orent.equipment_id,
                orent.hourly,
                orent.daily,
                orent.weekly,
                orent.starting AS rental_start,
                orent.ending AS rental_end,
                orent.note AS rental_note,
                ost.storage_id,
                ost.daily AS storage_daily,
                ost.weekly AS storage_weekly,
                ost.monthly AS storage_monthly,
                ost.starting AS storage_start,
                ost.ending AS storage_end,
                ost.note AS storage_note
              FROM orders o
              JOIN services s ON s.id = o.service_id
              JOIN service_categories sc ON sc.id = s.category_id
              LEFT JOIN orders_lessons ol ON ol.order_id = o.id
              LEFT JOIN orders_rentals orent ON orent.order_id = o.id
              LEFT JOIN orders_storage ost ON ost.order_id = o.id
              WHERE o.id = ${order.id}
              LIMIT 1
            `) || []

          if (rows.length) {
            const row = rows[0]
            const categoryName = row.category_name
            const starting = row.lesson_start || row.rental_start || row.storage_start
            const ending = row.lesson_end || row.rental_end || row.storage_end
            const note = row.lesson_note || row.rental_note || row.storage_note || ''

            setFormData({
              id: row.id,
              service_id: row.service_id,
              customer_id: row.customer_id,
              cancelled: row.cancelled || false,
              note,
              student_id: row.student_id || row.customer_id,
              instructor_id: row.instructor_id || '',
              equipment_id: row.equipment_id || '',
              storage_id: row.storage_id || row.service_id,
              hourly: row.hourly || false,
              daily: row.daily || row.storage_daily || false,
              weekly: row.weekly || row.storage_weekly || false,
              monthly: row.storage_monthly || false,
              check_in: toLocalDateInput(row.storage_start || row.rental_start || row.lesson_start),
              check_out: toLocalDateInput(row.storage_end || row.rental_end || row.lesson_end),
              starting: toInputDateTime(starting),
              ending: toInputDateTime(ending),
              lesson_day: toLocalDateInput(starting),
              lesson_start_time: toLocalTimeInput(starting),
              lesson_end_time: toLocalTimeInput(ending),
              category_name: categoryName
            })
          }
        } else {
          setFormData((prev) => ({
            ...prev,
            service_id: serviceRows?.[0]?.id || '',
            customer_id: customerRows?.[0]?.id || '',
            cancelled: false,
            starting: '',
            ending: '',
            lesson_day: '',
            lesson_start_time: '00:00',
            lesson_end_time: '00:00'
          }))
        }
      } catch (err) {
        console.error('Failed to load order form data:', err)
        setError(t('orderForm.errors.load', 'Unable to load order data. Please try again.'))
      } finally {
        setLoading(false)
      }
    }

    loadForm()
  }, [order, isEditing, t])

  const selectedService = useMemo(
    () => services.find((service) => service.id === Number(formData.service_id)),
    [services, formData.service_id]
  )

  const categoryName = selectedService?.category_name

  useEffect(() => {
    if (!categoryName || isEditing) return
    if (categoryName === 'storage') {
      setFormData((prev) => ({
        ...prev,
        daily: true,
        weekly: false,
        monthly: false
      }))
    } else if (categoryName === 'rentals') {
      setFormData((prev) => ({
        ...prev,
        hourly: true,
        daily: false,
        weekly: false,
        monthly: false
      }))
    }
  }, [categoryName, isEditing])
  useEffect(() => {
    if (categoryName !== 'storage') {
      setStorageDurationInfo(null)
      return
    }
    const { check_in: checkIn, check_out: checkOut } = formData
    if (!checkIn || !checkOut) {
      setStorageDurationInfo(null)
      return
    }
    const start = new Date(checkIn)
    const end = new Date(checkOut)
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end < start) {
      setStorageDurationInfo(null)
      return
    }
    const diffMs = end - start
    const diffDays = Math.max(1, Math.ceil(diffMs / (1000 * 60 * 60 * 24)))
    let mode = 'daily'
    if (diffDays >= 30) {
      mode = 'monthly'
    } else if (diffDays >= 7) {
      mode = 'weekly'
    }
    setStorageDurationInfo({ days: diffDays, mode })
    setFormData((prev) => {
      const currentMode = prev.monthly ? 'monthly' : prev.weekly ? 'weekly' : 'daily'
      if (currentMode === mode) return prev
      return {
        ...prev,
        daily: mode === 'daily',
        weekly: mode === 'weekly',
        monthly: mode === 'monthly'
      }
    })
  }, [formData.check_in, formData.check_out, categoryName])

  useEffect(() => {
    if (categoryName !== 'rentals') {
      setRentalDurationInfo(null)
      return
    }
    const { starting, ending } = formData
    if (!starting || !ending) {
      setRentalDurationInfo(null)
      return
    }
    const start = new Date(starting)
    const end = new Date(ending)
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) {
      setRentalDurationInfo(null)
      return
    }
    const diffMs = end - start
    const totalHours = diffMs / (1000 * 60 * 60)
    const totalDays = totalHours / 24
    setRentalDurationInfo({
      hours: totalHours,
      days: totalDays
    })
    setFormData((prev) => {
      const suggestedMode = totalHours < 24 ? 'hourly' : 'daily'
      const currentMode = prev.daily ? 'daily' : 'hourly'
      if (currentMode === suggestedMode) return prev
      return {
        ...prev,
        hourly: suggestedMode === 'hourly',
        daily: suggestedMode === 'daily',
        weekly: false,
        monthly: false
      }
    })
  }, [formData.starting, formData.ending, categoryName])


  const handleChange = (event) => {
    const { name, value, type, checked } = event.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleStorageBillingChange = (mode) => {
    setFormData((prev) => ({
      ...prev,
      daily: mode === 'daily',
      weekly: mode === 'weekly',
      monthly: mode === 'monthly'
    }))
  }

  const storageBillingMode = formData.monthly ? 'monthly' : formData.weekly ? 'weekly' : 'daily'
  const handleRentalBillingChange = (mode) => {
    setFormData((prev) => ({
      ...prev,
      hourly: mode === 'hourly',
      daily: mode === 'daily',
      weekly: false,
      monthly: false
    }))
  }
  const rentalBillingMode = formData.daily ? 'daily' : 'hourly'

const toLocalDateInput = (value) => {
  if (!value) return ''
  const date = new Date(value)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

const toLocalTimeInput = (value) => {
  if (!value) return ''
  const date = new Date(value)
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  return `${hours}:${minutes}`
}

const combineDateAndTime = (date, time) => {
  if (!date || !time) return null
  const [year, month, day] = date.split('-').map(Number)
  const [hours, minutes] = time.split(':').map(Number)
  const utc = new Date(Date.UTC(year, month - 1, day, hours, minutes, 0, 0))
  return utc.toISOString()
}

const ensureDate = (value, fallbackTime = null) => {
  if (!value) return null
  if (fallbackTime) {
    return combineDateAndTime(value, fallbackTime)
  }
  // Handle datetime-local format (YYYY-MM-DDTHH:mm)
  if (typeof value === 'string' && value.includes('T') && !value.includes('Z') && !value.includes('+')) {
    const [datePart, timePart] = value.split('T')
    const [year, month, day] = datePart.split('-').map(Number)
    const [hours, minutes] = timePart.split(':').map(Number)
    // Create UTC date to avoid timezone shifts
    const utc = new Date(Date.UTC(year, month - 1, day, hours, minutes, 0, 0))
    return utc.toISOString()
  }
  return new Date(value).toISOString()
}

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!formData.service_id || !formData.customer_id) {
      setError(t('orderForm.validation.serviceCustomer', 'Service and customer are required.'))
      return
    }
    if (categoryName === 'lessons') {
      if (!formData.lesson_day || !formData.lesson_start_time || !formData.lesson_end_time) {
        setError(t('orderForm.validation.lessonFields', 'Please provide day, start time, and end time.'))
        return
      }
      
      // Validate that instructor doesn't have overlapping lessons
      if (formData.instructor_id) {
        const starting = combineDateAndTime(formData.lesson_day, formData.lesson_start_time)
        const ending = combineDateAndTime(formData.lesson_day, formData.lesson_end_time)
        
        if (starting && ending) {
          try {
            // Check for overlapping lessons for the same instructor
            let overlappingLessons
            if (isEditing) {
              overlappingLessons = await sql`
                SELECT ol.order_id, ol.starting, ol.ending, c.fullname AS student_name
                FROM orders_lessons ol
                JOIN orders o ON o.id = ol.order_id
                LEFT JOIN customers c ON c.id = ol.student_id
                WHERE ol.instructor_id = ${formData.instructor_id}
                  AND ol.starting < ${ending}
                  AND ol.ending > ${starting}
                  AND o.cancelled = FALSE
                  AND ol.order_id != ${formData.id}
              `
            } else {
              overlappingLessons = await sql`
                SELECT ol.order_id, ol.starting, ol.ending, c.fullname AS student_name
                FROM orders_lessons ol
                JOIN orders o ON o.id = ol.order_id
                LEFT JOIN customers c ON c.id = ol.student_id
                WHERE ol.instructor_id = ${formData.instructor_id}
                  AND ol.starting < ${ending}
                  AND ol.ending > ${starting}
                  AND o.cancelled = FALSE
              `
            }
            
            if (overlappingLessons && overlappingLessons.length > 0) {
              const conflict = overlappingLessons[0]
              const conflictStart = formatTime(conflict.starting)
              const conflictEnd = formatTime(conflict.ending)
              const conflictKey = conflict.student_name
                ? 'orderForm.validation.lessonConflictWithStudent'
                : 'orderForm.validation.lessonConflict'
              setError(
                t(conflictKey, {
                  start: conflictStart,
                  end: conflictEnd,
                  student: conflict.student_name,
                }),
              )
              setSaving(false)
              return
            }
          } catch (err) {
            console.error('Failed to check for overlapping lessons:', err)
            // Continue with save if check fails (don't block user)
          }
        }
      }
    } else if (categoryName === 'storage') {
      if (!formData.check_in || !formData.check_out) {
        setError(t('orderForm.validation.storageDates', 'Please provide check-in and check-out dates.'))
        return
      }
    } else if (!formData.starting || !formData.ending) {
      setError(t('orderForm.validation.rentalTimes', 'Please provide a start and end time.'))
      return
    }

    setSaving(true)
    setError(null)

    try {
      let orderId = formData.id
      if (isEditing) {
        await sql`
          UPDATE orders
          SET service_id = ${formData.service_id},
              customer_id = ${formData.customer_id},
              cancelled = ${formData.cancelled},
              updated_at = NOW()
          WHERE id = ${formData.id}
        `
      } else {
        const inserted =
          (await sql`
            INSERT INTO orders (service_id, customer_id, cancelled)
            VALUES (${formData.service_id}, ${formData.customer_id}, ${formData.cancelled})
            RETURNING id
          `) || []
        orderId = inserted[0].id
      }

      let starting = null
      let ending = null

      if (categoryName === 'lessons') {
        starting = combineDateAndTime(formData.lesson_day, formData.lesson_start_time)
        ending = combineDateAndTime(formData.lesson_day, formData.lesson_end_time)
      } else if (categoryName === 'storage') {
        starting = combineDateAndTime(formData.check_in, '00:00')
        ending = combineDateAndTime(formData.check_out, '00:00')
      } else {
        starting = ensureDate(formData.starting)
        ending = ensureDate(formData.ending)
      }

      if (categoryName === 'lessons') {
        await sql`
          INSERT INTO orders_lessons (order_id, student_id, instructor_id, starting, ending, note)
          VALUES (
            ${orderId},
            ${formData.student_id || formData.customer_id},
            ${formData.instructor_id || null},
            ${starting},
            ${ending},
            ${formData.note || null}
          )
          ON CONFLICT (order_id) DO UPDATE
          SET student_id = EXCLUDED.student_id,
              instructor_id = EXCLUDED.instructor_id,
              starting = EXCLUDED.starting,
              ending = EXCLUDED.ending,
              note = EXCLUDED.note
        `
        await sql`DELETE FROM orders_rentals WHERE order_id = ${orderId}`
        await sql`DELETE FROM orders_storage WHERE order_id = ${orderId}`
      } else if (categoryName === 'rentals') {
        await sql`
          INSERT INTO orders_rentals (order_id, equipment_id, hourly, daily, weekly, starting, ending, note)
          VALUES (
            ${orderId},
            ${formData.equipment_id || null},
            ${formData.hourly},
            ${formData.daily},
            ${formData.weekly},
            ${starting},
            ${ending},
            ${formData.note || null}
          )
          ON CONFLICT (order_id) DO UPDATE
          SET equipment_id = EXCLUDED.equipment_id,
              hourly = EXCLUDED.hourly,
              daily = EXCLUDED.daily,
              weekly = EXCLUDED.weekly,
              starting = EXCLUDED.starting,
              ending = EXCLUDED.ending,
              note = EXCLUDED.note
        `
        await sql`DELETE FROM orders_lessons WHERE order_id = ${orderId}`
        await sql`DELETE FROM orders_storage WHERE order_id = ${orderId}`
      } else if (categoryName === 'storage') {
        await sql`
          INSERT INTO orders_storage (order_id, storage_id, daily, weekly, monthly, starting, ending, note)
          VALUES (
            ${orderId},
            ${formData.storage_id || formData.service_id},
            ${formData.daily || (!formData.weekly && !formData.monthly)},
            ${formData.weekly},
            ${formData.monthly},
            ${starting},
            ${ending},
            ${formData.note || null}
          )
          ON CONFLICT (order_id) DO UPDATE
          SET storage_id = EXCLUDED.storage_id,
              daily = EXCLUDED.daily,
              weekly = EXCLUDED.weekly,
              monthly = EXCLUDED.monthly,
              starting = EXCLUDED.starting,
              ending = EXCLUDED.ending,
              note = EXCLUDED.note
        `
        await sql`DELETE FROM orders_lessons WHERE order_id = ${orderId}`
        await sql`DELETE FROM orders_rentals WHERE order_id = ${orderId}`
      } else {
        await sql`DELETE FROM orders_lessons WHERE order_id = ${orderId}`
        await sql`DELETE FROM orders_rentals WHERE order_id = ${orderId}`
        await sql`DELETE FROM orders_storage WHERE order_id = ${orderId}`
      }

      onSaved?.()
    } catch (err) {
      console.error('Failed to save order:', err)
      setError(err.message || t('orderForm.errors.save', 'Unable to save order. Please try again.'))
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="p-8">
        <div className="text-gray-600">{t('orderForm.loading', 'Loading order data...')}</div>
      </div>
    )
  }

  return (
    <div className="px-4 py-6 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-4xl rounded-xl bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {isEditing ? t('orderForm.title.edit', 'Edit Order') : t('orderForm.title.new', 'Add Order')}
            </h1>
            <p className="text-gray-500 text-sm">{t('orderForm.subtitle', 'Configure customer bookings, rentals, or storage.')}</p>
          </div>
          <button
            onClick={onCancel}
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
          >
            {t('orderForm.buttons.cancel', 'Cancel')}
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="service_id">
              {t('orderForm.fields.service', 'Service')}
            </label>
            <select
              id="service_id"
              name="service_id"
              value={formData.service_id}
              onChange={handleChange}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
            >
              {services.map((service) => (
                <option key={service.id} value={service.id}>
                  {service.name} ({service.category_name})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="customer_id">
              {t('orderForm.fields.customer', 'Customer')}
            </label>
            <select
              id="customer_id"
              name="customer_id"
              value={formData.customer_id}
              onChange={handleChange}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
            >
              {customers.map((customer) => (
                <option key={customer.id} value={customer.id}>
                  {customer.fullname}
                </option>
              ))}
            </select>
          </div>


          <div className="md:col-span-2">
            <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="note">
              {t('orderForm.fields.notes', 'Notes')}
            </label>
            <textarea
              id="note"
              name="note"
              rows="3"
              value={formData.note}
              onChange={handleChange}
              className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
              placeholder={t('orderForm.fields.notes.placeholder', 'Add reminders, logistics, or equipment info.')}
            />
          </div>

          {categoryName === 'lessons' && (
            <>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="student_id">
                  {t('orderForm.fields.student', 'Student')}
                </label>
                <select
                  id="student_id"
                  name="student_id"
                  value={formData.student_id || formData.customer_id}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                >
                  {customers.map((customer) => (
                    <option key={customer.id} value={customer.id}>
                      {customer.fullname}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="instructor_id">
                  {t('orderForm.fields.instructor', 'Instructor')}
                </label>
                <select
                  id="instructor_id"
                  name="instructor_id"
                  value={formData.instructor_id || ''}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                >
                  <option value="">{t('orderForm.fields.instructor.placeholder', 'Select instructor')}</option>
                  {instructors.map((instructor) => (
                    <option key={instructor.id} value={instructor.id}>
                      {instructor.fullname}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2 grid grid-cols-1 gap-4 md:grid-cols-3">
                <div>
                <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="lesson_day">
                  {t('orderForm.fields.day', 'Day')}
                </label>
                  <input
                    id="lesson_day"
                    name="lesson_day"
                    type="date"
                    value={formData.lesson_day}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                  />
                </div>

                <div>
                <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="lesson_start_time">
                  {t('orderForm.fields.startTime', 'Start time')}
                </label>
                  <input
                    id="lesson_start_time"
                    name="lesson_start_time"
                    type="time"
                    value={formData.lesson_start_time}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                  />
                </div>

                <div>
                <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="lesson_end_time">
                  {t('orderForm.fields.endTime', 'End time')}
                </label>
                  <input
                    id="lesson_end_time"
                    name="lesson_end_time"
                    type="time"
                    value={formData.lesson_end_time}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                  />
                </div>
              </div>

            </>
          )}

          {categoryName === 'rentals' && (
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="equipment_id">
                {t('orderForm.fields.equipment', 'Equipment')}
              </label>
              <select
                id="equipment_id"
                name="equipment_id"
                value={formData.equipment_id}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
              >
                <option value="">{t('orderForm.fields.equipment.placeholder', 'Select equipment')}</option>
                {equipment.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </div>
          )}

          {categoryName === 'rentals' && (
            <div
              className={`md:col-span-2 grid grid-cols-1 gap-4 ${
                categoryName === 'rentals' ? 'md:grid-cols-2' : ''
              }`}
            >
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="starting">
                  {t('orderForm.fields.startTime', 'Start time')}
                </label>
                <input
                  id="starting"
                  name="starting"
                  type="datetime-local"
                  value={formData.starting}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="ending">
                  {t('orderForm.fields.endTime', 'End time')}
                </label>
                <input
                  id="ending"
                  name="ending"
                  type="datetime-local"
                  value={formData.ending}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                />
              </div>
            </div>
          )}

          {categoryName === 'rentals' && rentalDurationInfo && (
            <div className="md:col-span-2 rounded-xl border border-indigo-100 bg-indigo-50 px-4 py-3 text-sm text-indigo-900">
              {t('orderForm.rental.duration', 'Rental duration:')}{' '}
              <span className="font-semibold">
                {rentalDurationInfo.hours < 24
                  ? t('orderForm.rental.durationHours', { value: rentalDurationInfo.hours.toFixed(1) })
                  : t('orderForm.rental.durationDays', { value: rentalDurationInfo.days.toFixed(2) })}
              </span>{' '}
              • {t('orderForm.rental.suggested', 'Suggested billing:')}{' '}
              <span className="font-semibold">
                {rentalDurationInfo.hours < 24 ? getRentalOptionLabel('hourly') : getRentalOptionLabel('daily')}
              </span>
            </div>
          )}

          {categoryName === 'rentals' && (
            <div className="md:col-span-2">
              <p className="mb-2 text-sm font-medium text-gray-700">
                {t('orderForm.section.billingCadence', 'Billing cadence')}
              </p>
              <div className="grid gap-3 md:grid-cols-3">
                {rentalBillingOptions.map((option) => {
                  const isActive = rentalBillingMode === option.key
                  const isSuggested =
                    rentalDurationInfo &&
                    ((option.key === 'hourly' && rentalDurationInfo.hours < 24) ||
                      (option.key === 'daily' && rentalDurationInfo.hours >= 24))
                  return (
                    <button
                      key={option.key}
                      type="button"
                      onClick={() => handleRentalBillingChange(option.key)}
                      className={`rounded-xl border px-4 py-3 text-left transition-colors ${
                        isActive
                          ? 'border-indigo-500 bg-indigo-50 text-indigo-900 shadow-sm'
                          : 'border-gray-200 bg-white text-gray-700 hover:border-indigo-200 hover:bg-indigo-50'
                      }`}
                    >
                      <span className="flex items-center gap-2 text-sm font-semibold">
                        {option.label}
                        {isSuggested && (
                          <span className="text-xs font-semibold text-indigo-600">
                            {t('orderForm.rental.billing.suggested', '(Suggested)')}
                          </span>
                        )}
                      </span>
                      <span className="mt-1 block text-xs text-gray-500">{option.description}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {categoryName === 'storage' && (
            <>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="check_in">
                  {t('orderForm.fields.checkIn', 'Check-in date')}
                </label>
                <input
                  id="check_in"
                  name="check_in"
                  type="date"
                  value={formData.check_in}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                />
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="check_out">
                  {t('orderForm.fields.checkOut', 'Check-out date')}
                </label>
                <input
                  id="check_out"
                  name="check_out"
                  type="date"
                  value={formData.check_out}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                />
              </div>

              {storageDurationInfo && (
                <div className="md:col-span-2 rounded-xl border border-indigo-100 bg-indigo-50 px-4 py-3 text-sm text-indigo-900">
                  {t('orderForm.storage.duration', 'Storage duration:')}{' '}
                  <span className="font-semibold">
                    {t('orderForm.storage.durationLabel', { count: storageDurationInfo.days })}
                  </span>{' '}
                  • {t('orderForm.storage.suggested', 'Suggested billing:')}{' '}
                  <span className="font-semibold">{getStorageOptionLabel(storageDurationInfo.mode)}</span>
                </div>
              )}

              <div className="md:col-span-2">
                <p className="mb-2 text-sm font-medium text-gray-700">
                  {t('orderForm.section.billingCadence', 'Billing cadence')}
                </p>
                <div className="grid gap-3 md:grid-cols-3">
                  {storageBillingOptions.map((option) => {
                    const isActive = storageBillingMode === option.key
                    return (
                      <button
                        key={option.key}
                        type="button"
                        onClick={() => handleStorageBillingChange(option.key)}
                        className={`rounded-xl border px-4 py-3 text-left transition-colors ${
                          isActive
                            ? 'border-indigo-500 bg-indigo-50 text-indigo-900 shadow-sm'
                            : 'border-gray-200 bg-white text-gray-700 hover:border-indigo-200 hover:bg-indigo-50'
                        }`}
                      >
                        <span className="block text-sm font-semibold">{option.label}</span>
                        <span className="mt-1 block text-xs text-gray-500">{option.description}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            </>
          )}

          {error && (
            <div className="md:col-span-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="md:col-span-2 flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onCancel}
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
            >
              {t('orderForm.buttons.cancel', 'Cancel')}
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 transition-colors disabled:opacity-50"
            >
              {saving
                ? t('orderForm.buttons.saving', 'Saving...')
                : isEditing
                ? t('orderForm.buttons.saveChanges', 'Save changes')
                : t('orderForm.buttons.create', 'Create order')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default OrderForm

