import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import sql from '../lib/neon'

const ENTITY_TYPES_BLUEPRINT = [
  { value: 'company_account', labelKey: 'transactions.entity.company_account', fallback: 'Company Account' },
  { value: 'customer', labelKey: 'transactions.entity.customer', fallback: 'Customer' },
  { value: 'agency', labelKey: 'transactions.entity.agency', fallback: 'Agency' },
  { value: 'instructor', labelKey: 'transactions.entity.instructor', fallback: 'Instructor' },
  { value: 'third_party', labelKey: 'transactions.entity.third_party', fallback: 'Third Party' }
]

const initialFormState = {
  occurred_at: '',
  amount: '',
  currency: 'USD',
  type_id: '',
  payment_method_id: '',
  source_entity_type: 'company_account',
  source_entity_id: '',
  destination_entity_type: 'company_account',
  destination_entity_id: '',
  reference: '',
  note: '',
  link_to_orders: false, // Will be auto-enabled when customer is selected
  link_mode: 'group', // 'group' or 'individual'
  order_group_id: null, // Will be auto-set to default group when customer is selected
  order_allocations: [] // Array of { order_id, amount_allocated }
}

function TransactionForm({ transaction, onCancel, onSaved }) {
  const isEditing = Boolean(transaction?.id)
  const [formData, setFormData] = useState(initialFormState)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState(null)
  const [loadingReferenceData, setLoadingReferenceData] = useState(true)
  const [orderGroups, setOrderGroups] = useState([])
  const [customerOrders, setCustomerOrders] = useState([])
  const [loadingOrders, setLoadingOrders] = useState(false)
  const [prevCustomerId, setPrevCustomerId] = useState(null)
  const [referenceData, setReferenceData] = useState({
    transactionTypes: [],
    paymentMethods: [],
    companyAccounts: [],
    customers: [],
    agencies: [],
    instructors: [],
    thirdParties: []
  })
  const { t } = useTranslation()

  const entityTypeOptions = useMemo(
    () =>
      ENTITY_TYPES_BLUEPRINT.map((type) => ({
        ...type,
        label: t(type.labelKey, type.fallback)
      })),
    [t]
  )

  useEffect(() => {
    const fetchReferenceData = async () => {
      try {
        setLoadingReferenceData(true)
        const [
          transactionTypes,
          paymentMethods,
          companyAccounts,
          customers,
          agencies,
          instructors,
          thirdParties
        ] = await Promise.all([
          sql`SELECT id, label, code, direction FROM transaction_types ORDER BY label`,
          sql`SELECT id, name FROM payment_methods ORDER BY name`,
          sql`SELECT id, name FROM company_accounts ORDER BY name`,
          sql`SELECT id, fullname AS name FROM customers ORDER BY fullname LIMIT 500`,
          sql`SELECT id, name FROM agencies ORDER BY name LIMIT 200`,
          sql`SELECT id, fullname AS name FROM instructors ORDER BY fullname LIMIT 200`,
          sql`SELECT id, name FROM third_parties ORDER BY name LIMIT 200`
        ])

        setReferenceData({
          transactionTypes: transactionTypes || [],
          paymentMethods: paymentMethods || [],
          companyAccounts: companyAccounts || [],
          customers: customers || [],
          agencies: agencies || [],
          instructors: instructors || [],
          thirdParties: thirdParties || []
        })
      } catch (err) {
        console.error('Failed to load reference data:', err)
        setError(t('transactionForm.errors.referenceData', 'Unable to load reference data. Please refresh and try again.'))
      } finally {
        setLoadingReferenceData(false)
      }
    }

    fetchReferenceData()
  }, [t])

  useEffect(() => {
    const loadTransactionData = async () => {
      if (transaction) {
        // Load existing order allocations if editing
        let orderAllocations = []
        if (transaction.id) {
          try {
            const allocations = await sql`
              SELECT order_id, amount_allocated
              FROM transaction_orders
              WHERE transaction_id = ${transaction.id}
            `
            orderAllocations = (allocations || []).map(a => ({
              order_id: a.order_id,
              amount_allocated: parseFloat(a.amount_allocated) || 0
            }))
          } catch (err) {
            console.error('Failed to load order allocations:', err)
          }
        }

        setFormData({
          occurred_at: transaction.occurred_at ? new Date(transaction.occurred_at).toISOString().slice(0, 16) : '',
          amount: transaction.amount ? Math.abs(transaction.amount).toString() : '',
          currency: transaction.currency || 'USD',
          type_id: transaction.type_id ? String(transaction.type_id) : '',
          payment_method_id: transaction.payment_method_id ? String(transaction.payment_method_id) : '',
          source_entity_type: transaction.source_entity_type || 'company_account',
          source_entity_id: transaction.source_entity_id ? String(transaction.source_entity_id) : '',
          destination_entity_type: transaction.destination_entity_type || 'company_account',
          destination_entity_id: transaction.destination_entity_id ? String(transaction.destination_entity_id) : '',
          reference: transaction.reference || '',
          note: transaction.note || '',
          link_to_orders: false,
          link_mode: 'group',
          order_group_id: transaction.order_group_id ? String(transaction.order_group_id) : null,
          order_allocations: []
        })
      } else {
        const now = new Date()
        const localIso = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
        setFormData((prev) => ({ ...initialFormState, occurred_at: localIso }))
      }
    }

    loadTransactionData()
  }, [transaction])

  // Load order groups and orders when customer is selected as source (customer making payment)
  useEffect(() => {
    const loadCustomerOrders = async () => {
      const customerId = formData.source_entity_type === 'customer' && formData.source_entity_id
        ? Number(formData.source_entity_id)
        : null

      if (!customerId) {
        setOrderGroups([])
        setCustomerOrders([])
        return
      }

      try {
        setLoadingOrders(true)
        
        // Ensure default group exists (inline logic in case function doesn't exist)
        try {
          // First check if is_default column exists by trying a query
          let existingDefault
          try {
            existingDefault = await sql`
              SELECT id FROM order_groups 
              WHERE customer_id = ${customerId} AND is_default = TRUE 
              LIMIT 1
            `
          } catch (err) {
            // is_default column doesn't exist, check if any group exists (oldest will be default)
            existingDefault = await sql`
              SELECT id FROM order_groups 
              WHERE customer_id = ${customerId}
              ORDER BY created_at ASC
              LIMIT 1
            `
          }
          
          if (!existingDefault || existingDefault.length === 0) {
            // Create default group if it doesn't exist
            // Try with is_default first, fallback without it
            try {
              await sql`
                INSERT INTO order_groups (customer_id, name, is_default)
                VALUES (${customerId}, 'Default Group', TRUE)
              `
            } catch (err) {
              // is_default column doesn't exist, insert without it
              await sql`
                INSERT INTO order_groups (customer_id, name)
                VALUES (${customerId}, 'Default Group')
              `
            }
          }
        } catch (err) {
          // Fallback: just try to ensure default group exists using function if available
          try {
            await sql`SELECT ensure_default_order_group(${customerId})`
          } catch (funcErr) {
            console.warn('ensure_default_order_group function not available, using inline logic')
          }
        }
        
        // Now fetch all groups for this customer
        // Try with is_default first, fallback if column doesn't exist
        let groups, orders
        try {
          [groups, orders] = await Promise.all([
            sql`
              SELECT 
                og.id,
                og.name,
                COALESCE(og.is_default, FALSE) AS is_default,
                COUNT(DISTINCT CASE WHEN o.cancelled = FALSE THEN o.id END) AS order_count,
                COALESCE(SUM(CASE WHEN o.cancelled = FALSE THEN o.calculated_price ELSE 0 END), 0) AS total_amount
              FROM order_groups og
              LEFT JOIN orders o ON o.group_id = og.id
              WHERE og.customer_id = ${customerId}
              GROUP BY og.id, og.name, og.is_default
              ORDER BY COALESCE(og.is_default, FALSE) DESC, og.created_at DESC
            `,
          sql`
            SELECT 
              o.id,
              o.service_id,
              o.calculated_price,
              o.calculated_price_per_hour,
              o.hours,
              s.name AS service_name,
              sc.name AS category_name,
              COALESCE(ol.starting, orent.starting, ost.starting) AS starting
            FROM orders o
            JOIN services s ON s.id = o.service_id
            JOIN service_categories sc ON sc.id = s.category_id
            LEFT JOIN orders_lessons ol ON ol.order_id = o.id
            LEFT JOIN orders_rentals orent ON orent.order_id = o.id
            LEFT JOIN orders_storage ost ON ost.order_id = o.id
            WHERE o.customer_id = ${customerId}
              AND o.cancelled = FALSE
            ORDER BY o.created_at DESC
          `
          ])
        } catch (err) {
          // Fallback: query without is_default column
          if (err.message && err.message.includes('is_default')) {
            console.log('is_default column not found, using fallback query')
            [groups, orders] = await Promise.all([
              sql`
                SELECT 
                  og.id,
                  og.name,
                  FALSE AS is_default,
                  COUNT(DISTINCT CASE WHEN o.cancelled = FALSE THEN o.id END) AS order_count,
                  COALESCE(SUM(CASE WHEN o.cancelled = FALSE THEN o.calculated_price ELSE 0 END), 0) AS total_amount
                FROM order_groups og
                LEFT JOIN orders o ON o.group_id = og.id
                WHERE og.customer_id = ${customerId}
                GROUP BY og.id, og.name
                ORDER BY og.created_at DESC
              `,
              sql`
                SELECT 
                  o.id,
                  o.service_id,
                  o.calculated_price,
                  o.calculated_price_per_hour,
                  o.hours,
                  s.name AS service_name,
                  sc.name AS category_name,
                  COALESCE(ol.starting, orent.starting, ost.starting) AS starting
                FROM orders o
                JOIN services s ON s.id = o.service_id
                JOIN service_categories sc ON sc.id = s.category_id
                LEFT JOIN orders_lessons ol ON ol.order_id = o.id
                LEFT JOIN orders_rentals orent ON orent.order_id = o.id
                LEFT JOIN orders_storage ost ON ost.order_id = o.id
                WHERE o.customer_id = ${customerId}
                  AND o.cancelled = FALSE
                ORDER BY o.created_at DESC
              `
            ])
            
            // Mark the oldest group as default if is_default column doesn't exist
            if (groups && groups.length > 0) {
              // Sort by created_at and mark first one as default
              groups.sort((a, b) => new Date(a.created_at || 0) - new Date(b.created_at || 0))
              groups[0].is_default = true
            }
          } else {
            throw err
          }
        }
        
        // Normalize group data to ensure correct types
        const groupsList = (groups || []).map(g => {
          const group = {
            id: Number(g.id),
            name: g.name || null,
            is_default: Boolean(g.is_default),
            order_count: Number(g.order_count || 0),
            total_amount: parseFloat(g.total_amount || 0)
          }
          return group
        })
        
        console.log('Raw groups from SQL:', groups) // Debug
        console.log('Loaded order groups for customer', customerId, ':', groupsList) // Debug log
        console.log('Groups count:', groupsList.length) // Debug
        
        // If no groups found, try to ensure default group again and refetch
        if (groupsList.length === 0) {
          console.log('No groups found, ensuring default group again...') // Debug
          
          // Try to create default group inline
          try {
            let existingDefault
            try {
              existingDefault = await sql`
                SELECT id FROM order_groups 
                WHERE customer_id = ${customerId} AND is_default = TRUE 
                LIMIT 1
              `
            } catch (err) {
              // is_default doesn't exist, check for any group
              existingDefault = await sql`
                SELECT id FROM order_groups 
                WHERE customer_id = ${customerId}
                ORDER BY created_at ASC
                LIMIT 1
              `
            }
            
            if (!existingDefault || existingDefault.length === 0) {
              try {
                await sql`
                  INSERT INTO order_groups (customer_id, name, is_default)
                  VALUES (${customerId}, 'Default Group', TRUE)
                `
              } catch (err) {
                // is_default doesn't exist, insert without it
                await sql`
                  INSERT INTO order_groups (customer_id, name)
                  VALUES (${customerId}, 'Default Group')
                `
              }
            }
          } catch (err) {
            console.warn('Error ensuring default group:', err)
          }
          
          // Refetch groups
          let retryGroups
          try {
            retryGroups = await sql`
              SELECT 
                og.id,
                og.name,
                COALESCE(og.is_default, FALSE) AS is_default,
                COUNT(DISTINCT CASE WHEN o.cancelled = FALSE THEN o.id END) AS order_count,
                COALESCE(SUM(CASE WHEN o.cancelled = FALSE THEN o.calculated_price ELSE 0 END), 0) AS total_amount
              FROM order_groups og
              LEFT JOIN orders o ON o.group_id = og.id
              WHERE og.customer_id = ${customerId}
              GROUP BY og.id, og.name, og.is_default
              ORDER BY COALESCE(og.is_default, FALSE) DESC, og.created_at DESC
            `
          } catch (err) {
            // Fallback without is_default
            retryGroups = await sql`
              SELECT 
                og.id,
                og.name,
                FALSE AS is_default,
                COUNT(DISTINCT CASE WHEN o.cancelled = FALSE THEN o.id END) AS order_count,
                COALESCE(SUM(CASE WHEN o.cancelled = FALSE THEN o.calculated_price ELSE 0 END), 0) AS total_amount
              FROM order_groups og
              LEFT JOIN orders o ON o.group_id = og.id
              WHERE og.customer_id = ${customerId}
              GROUP BY og.id, og.name
              ORDER BY og.created_at DESC
            `
            if (retryGroups && retryGroups.length > 0) {
              retryGroups.sort((a, b) => new Date(a.created_at || 0) - new Date(b.created_at || 0))
              retryGroups[0].is_default = true
            }
          }
          
          const retryGroupsList = (retryGroups || []).map(g => ({
            id: Number(g.id),
            name: g.name || null,
            is_default: Boolean(g.is_default),
            order_count: Number(g.order_count || 0),
            total_amount: parseFloat(g.total_amount || 0)
          }))
          
          console.log('Retry groups:', retryGroupsList) // Debug
          setOrderGroups(retryGroupsList)
          
          // Select default group if found
          const defaultGroup = retryGroupsList.find(g => g.is_default)
          if (defaultGroup && !formData.order_group_id) {
            setFormData(prev => ({
              ...prev,
              order_group_id: String(defaultGroup.id)
            }))
          }
        } else {
          setOrderGroups(groupsList)
        }
        setCustomerOrders(orders || [])
        
        // Auto-select default group when customer is first selected
        // Only do this when customer changes (not on every render)
        const defaultGroup = groupsList.find(g => g.is_default)
        const currentCustomerId = customerId
        const customerChanged = prevCustomerId !== currentCustomerId
        
        if (defaultGroup && !isEditing && customerChanged) {
          setFormData(prev => ({
            ...prev,
            order_group_id: String(defaultGroup.id)
          }))
          setPrevCustomerId(currentCustomerId)
        } else if (defaultGroup && !isEditing && !formData.order_group_id) {
          // Fallback: if no customer was selected before, select default group
          setFormData(prev => ({
            ...prev,
            order_group_id: String(defaultGroup.id)
          }))
        } else if (!prevCustomerId) {
          setPrevCustomerId(currentCustomerId)
        }
      } catch (err) {
        console.error('Failed to load customer orders:', err)
        setOrderGroups([])
        setCustomerOrders([])
      } finally {
        setLoadingOrders(false)
      }
    }

    loadCustomerOrders()
  }, [formData.source_entity_type, formData.source_entity_id])

  const entityOptionsMap = useMemo(
    () => ({
      company_account: referenceData.companyAccounts,
      customer: referenceData.customers,
      agency: referenceData.agencies,
      instructor: referenceData.instructors,
      third_party: referenceData.thirdParties
    }),
    [referenceData]
  )

  const handleChange = (event) => {
    const { name, value, type, checked } = event.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleOrderAllocationChange = (orderId, amount) => {
    setFormData((prev) => {
      const allocations = [...prev.order_allocations]
      const index = allocations.findIndex(a => a.order_id === orderId)
      
      if (index >= 0) {
        if (amount === '' || amount === '0') {
          allocations.splice(index, 1)
        } else {
          allocations[index] = { order_id: orderId, amount_allocated: parseFloat(amount) || 0 }
        }
      } else if (amount && amount !== '0') {
        allocations.push({ order_id: orderId, amount_allocated: parseFloat(amount) || 0 })
      }
      
      return { ...prev, order_allocations: allocations }
    })
  }

  const getOrderAllocation = (orderId) => {
    const allocation = formData.order_allocations.find(a => a.order_id === orderId)
    return allocation ? allocation.amount_allocated.toString() : ''
  }

  const getTotalAllocated = () => {
    return formData.order_allocations.reduce((sum, a) => sum + (a.amount_allocated || 0), 0)
  }

  const getRemainingAmount = () => {
    const transactionAmount = Math.abs(parseFloat(formData.amount) || 0)
    return transactionAmount - getTotalAllocated()
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSaving(true)
    setError(null)

    const selectedType = referenceData.transactionTypes.find((type) => String(type.id) === formData.type_id)

    if (!selectedType) {
      setError(t('transactionForm.validation.typeRequired', 'Transaction type is required.'))
      setSaving(false)
      return
    }

    const payload = {
      occurred_at: formData.occurred_at ? new Date(formData.occurred_at) : new Date(),
      amount: formData.amount ? Number(formData.amount) : 0,
      currency: formData.currency || 'USD',
      type_id: Number(selectedType.id),
      payment_method_id: formData.payment_method_id ? Number(formData.payment_method_id) : null,
      source_entity_type: formData.source_entity_type,
      source_entity_id: formData.source_entity_id ? Number(formData.source_entity_id) : null,
      destination_entity_type: formData.destination_entity_type,
      destination_entity_id: formData.destination_entity_id ? Number(formData.destination_entity_id) : null,
      reference: formData.reference || null,
      note: formData.note || null
    }

    if (!payload.amount || Number.isNaN(payload.amount) || payload.amount === 0) {
      setError(t('transactionForm.validation.amount', 'Amount must be a non-zero number.'))
      setSaving(false)
      return
    }


    if (selectedType.direction === 'income' && payload.amount < 0) {
      payload.amount = Math.abs(payload.amount)
    } else if (selectedType.direction === 'expense' && payload.amount > 0) {
      payload.amount = -payload.amount
    }

    try {
      let transactionId = transaction?.id

      // Handle order_group_id - always link to order group for customer payments
      // If no group selected, link to default group
      let orderGroupId = null
      if (formData.source_entity_type === 'customer' && formData.source_entity_id) {
        if (formData.order_group_id) {
          orderGroupId = Number(formData.order_group_id)
        } else {
          // Auto-link to default group for customer payments
          try {
            // First try to find existing default group
            let defaultGroupResult = await sql`
              SELECT id FROM order_groups 
              WHERE customer_id = ${Number(formData.source_entity_id)} AND is_default = TRUE 
              LIMIT 1
            `
            
            if (!defaultGroupResult || defaultGroupResult.length === 0) {
              // Create default group if it doesn't exist
              const newGroup = await sql`
                INSERT INTO order_groups (customer_id, name, is_default)
                VALUES (${Number(formData.source_entity_id)}, 'Default Group', TRUE)
                RETURNING id
              `
              defaultGroupResult = newGroup
            }
            
            orderGroupId = defaultGroupResult[0]?.id || null
          } catch (err) {
            console.error('Failed to get default order group:', err)
          }
        }
      }

      if (isEditing) {
        await sql`
          UPDATE transactions
          SET occurred_at = ${payload.occurred_at},
              amount = ${payload.amount},
              currency = ${payload.currency},
              type_id = ${payload.type_id},
              payment_method_id = ${payload.payment_method_id},
              source_entity_type = ${payload.source_entity_type},
              source_entity_id = ${payload.source_entity_id},
              destination_entity_type = ${payload.destination_entity_type},
              destination_entity_id = ${payload.destination_entity_id},
              reference = ${payload.reference},
              note = ${payload.note},
              order_group_id = ${orderGroupId},
              updated_at = NOW()
          WHERE id = ${transaction.id}
        `
        transactionId = transaction.id
      } else {
        const inserted =
          (await sql`
            INSERT INTO transactions (
              occurred_at,
              amount,
              currency,
              type_id,
              payment_method_id,
              source_entity_type,
              source_entity_id,
              destination_entity_type,
              destination_entity_id,
              reference,
              note,
              order_group_id
            ) VALUES (
              ${payload.occurred_at},
              ${payload.amount},
              ${payload.currency},
              ${payload.type_id},
              ${payload.payment_method_id},
              ${payload.source_entity_type},
              ${payload.source_entity_id},
              ${payload.destination_entity_type},
              ${payload.destination_entity_id},
              ${payload.reference},
              ${payload.note},
              ${orderGroupId}
            )
            RETURNING id
          `) || []
        transactionId = inserted[0]?.id
      }

      // Remove any existing individual order allocations (we only use group linking now)
      if (transactionId && isEditing) {
        await sql`DELETE FROM transaction_orders WHERE transaction_id = ${transactionId}`
      }

      onSaved?.()
    } catch (err) {
      console.error('Failed to save transaction:', err)
      setError(t('transactionForm.errors.save', 'Unable to save transaction. Please check the details and try again.'))
    } finally {
      setSaving(false)
    }
  }

  const renderEntitySelect = (role) => {
    const typeKey = formData[`${role}_entity_type`]
    const options = entityOptionsMap[typeKey] || []
    const fieldName = `${role}_entity_id`
    const labelKey =
      role === 'source' ? 'transactionForm.section.sourceEntity' : 'transactionForm.section.destinationEntity'
    const placeholderKey =
      role === 'source' ? 'transactionForm.section.selectSource' : 'transactionForm.section.selectDestination'

    return (
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor={fieldName}>
          {t(labelKey, role === 'source' ? 'Source entity' : 'Destination entity')}
        </label>
        <select
          id={fieldName}
          name={fieldName}
          value={formData[fieldName]}
          onChange={handleChange}
          disabled={loadingReferenceData || options.length === 0}
          className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 disabled:bg-gray-100"
        >
          <option value="">{t(placeholderKey, role === 'source' ? 'Select source...' : 'Select destination...')}</option>
          {options.map((option) => (
            <option key={option.id} value={option.id}>
              {option.name}
            </option>
          ))}
        </select>
      </div>
    )
  }

  return (
    <div className="px-4 py-6 sm:p-6 lg:p-8">
      <div className="mx-auto max-w-4xl rounded-xl bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              {isEditing
                ? t('transactionForm.title.edit', 'Edit Transaction')
                : t('transactionForm.title.new', 'Add Transaction')}
            </h1>
            <p className="text-gray-500 text-sm">
              {isEditing
                ? t('transactionForm.subtitle.edit', 'Update the transaction details.')
                : t('transactionForm.subtitle.new', 'Record a new transaction entry.')}
            </p>
          </div>
          <button
            onClick={onCancel}
            className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
          >
            {t('transactionForm.buttons.cancel', 'Cancel')}
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="occurred_at">
                {t('transactionForm.fields.occurredAt', 'Date & time *')}
              </label>
              <input
                id="occurred_at"
                name="occurred_at"
                type="datetime-local"
                required
                value={formData.occurred_at}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="amount">
                {t('transactionForm.fields.amount', 'Amount *')}
              </label>
              <input
                id="amount"
                name="amount"
                type="number"
                step="0.01"
                required
                value={formData.amount}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="type_id">
                {t('transactionForm.fields.type', 'Transaction type *')}
              </label>
              <select
                id="type_id"
                name="type_id"
                required
                value={formData.type_id}
                onChange={handleChange}
                disabled={loadingReferenceData}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 disabled:bg-gray-100"
              >
                <option value="">{t('transactionForm.fields.type.placeholder', 'Select type...')}</option>
                {referenceData.transactionTypes.map((type) => (
                  <option key={type.id} value={type.id}>
                    {type.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="payment_method_id">
                {t('transactionForm.fields.paymentMethod', 'Payment method')}
              </label>
              <select
                id="payment_method_id"
                name="payment_method_id"
                value={formData.payment_method_id}
                onChange={handleChange}
                disabled={loadingReferenceData}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 disabled:bg-gray-100"
              >
                <option value="">{t('transactionForm.fields.paymentMethod.none', 'None')}</option>
                {referenceData.paymentMethods.map((method) => (
                  <option key={method.id} value={method.id}>
                    {method.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-3">
              <label className="text-sm font-semibold text-gray-800">
                {t('transactionForm.section.source', 'Source')}
              </label>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="source_entity_type">
                  {t('transactionForm.section.sourceType', 'Source type *')}
                </label>
                <select
                  id="source_entity_type"
                  name="source_entity_type"
                  value={formData.source_entity_type}
                  onChange={(event) => {
                    setFormData((prev) => ({ 
                      ...prev, 
                      source_entity_type: event.target.value, 
                      source_entity_id: '',
                      order_group_id: null
                    }))
                  }}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                >
                  {entityTypeOptions.map((entity) => (
                    <option key={entity.value} value={entity.value}>
                      {entity.label}
                    </option>
                  ))}
                </select>
              </div>
              {renderEntitySelect('source')}
            </div>

            <div className="space-y-3">
              <label className="text-sm font-semibold text-gray-800">
                {t('transactionForm.section.destination', 'Destination')}
              </label>
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="destination_entity_type">
                  {t('transactionForm.section.destinationType', 'Destination type *')}
                </label>
                <select
                  id="destination_entity_type"
                  name="destination_entity_type"
                  value={formData.destination_entity_type}
                  onChange={(event) => {
                    setFormData((prev) => ({ ...prev, destination_entity_type: event.target.value, destination_entity_id: '' }))
                  }}
                  className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                >
                  {entityTypeOptions.map((entity) => (
                    <option key={entity.value} value={entity.value}>
                      {entity.label}
                    </option>
                  ))}
                </select>
              </div>
              {renderEntitySelect('destination')}
            </div>
          </div>

          {/* Order Group Selection - Only show when source is a customer (customer making payment) */}
          {formData.source_entity_type === 'customer' && formData.source_entity_id && (
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="order_group_id">
                {t('transactionForm.orderLinking.selectGroup', 'Select Order Group')}
              </label>
              {loadingOrders ? (
                <div className="text-sm text-gray-500 py-2">
                  {t('transactionForm.orderLinking.loading', 'Loading orders...')}
                </div>
              ) : (
                <>
                  <select
                    id="order_group_id"
                    name="order_group_id"
                    value={formData.order_group_id || ''}
                    onChange={handleChange}
                    className="w-full rounded-lg border border-gray-300 px-4 py-2 bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
                  >
                    {orderGroups.length === 0 ? (
                      <option value="">{t('transactionForm.orderLinking.noGroups', 'No order groups found for this customer.')}</option>
                    ) : (
                      orderGroups.map(group => (
                        <option key={group.id} value={String(group.id)}>
                          {group.name || (group.is_default ? t('transactionForm.orderLinking.defaultGroup', 'Default Group') : `Group #${group.id}`)}
                          {group.is_default && ` (${t('transactionForm.orderLinking.default', 'Default')})`}
                          {' - '}
                          {group.order_count} {t('transactionForm.orderLinking.orders', 'orders')}, {t('transactionForm.orderLinking.totalAmount', 'Total: {{amount}}', { amount: (group.total_amount || 0).toFixed(2) })}
                        </option>
                      ))
                    )}
                  </select>
                  {orderGroups.length === 0 && !loadingOrders && (
                    <p className="mt-2 text-xs text-gray-500">
                      {t('transactionForm.orderLinking.noGroups', 'No order groups found for this customer.')}
                    </p>
                  )}
                </>
              )}
            </div>
          )}

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="reference">
                {t('transactionForm.fields.reference', 'Reference')}
              </label>
              <input
                id="reference"
                name="reference"
                type="text"
                value={formData.reference}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700" htmlFor="note">
                {t('transactionForm.fields.note', 'Note')}
              </label>
              <input
                id="note"
                name="note"
                type="text"
                value={formData.note}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
              />
            </div>
          </div>

          {error && (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onCancel}
              className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50 transition-colors"
            >
              {t('transactionForm.buttons.cancel', 'Cancel')}
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 transition-colors disabled:opacity-50"
            >
              {saving
                ? t('transactionForm.buttons.saving', 'Saving...')
                : isEditing
                ? t('transactionForm.buttons.saveChanges', 'Save changes')
                : t('transactionForm.buttons.create', 'Create transaction')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default TransactionForm


