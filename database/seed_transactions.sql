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
    note
) VALUES
(
    NOW() - INTERVAL '7 days',
    1450.00,
    'USD',
    (SELECT id FROM transaction_types WHERE code = 'customer_payment'),
    (SELECT id FROM payment_methods WHERE name = 'Visa Credit'),
    'customer',
    (SELECT id FROM customers ORDER BY id LIMIT 1),
    'company_account',
    (SELECT id FROM company_accounts WHERE name = 'KiteSurf Holdings'),
    'ORD-20015',
    'Deposit received for advanced coaching package'
),
(
    NOW() - INTERVAL '5 days',
    -325.00,
    'USD',
    (SELECT id FROM transaction_types WHERE code = 'agency_commission'),
    (SELECT id FROM payment_methods WHERE name = 'Bank Transfer'),
    'company_account',
    (SELECT id FROM company_accounts WHERE name = 'KiteSurf Holdings'),
    'agency',
    (SELECT id FROM agencies WHERE name = 'Wave Travel Partners'),
    'COMM-884',
    'Commission payout for March group booking'
),
(
    NOW() - INTERVAL '3 days',
    -480.00,
    'USD',
    (SELECT id FROM transaction_types WHERE code = 'third_party_invoice'),
    (SELECT id FROM payment_methods WHERE name = 'Visa Debit'),
    'company_account',
    (SELECT id FROM company_accounts WHERE name = 'Blue Current Investments'),
    'third_party',
    (SELECT id FROM third_parties WHERE name = 'Swift Wing Supplies'),
    'INV-3391',
    'Emergency kite bladder replacements'
),
(
    NOW() - INTERVAL '2 days',
    -600.00,
    'USD',
    (SELECT id FROM transaction_types WHERE code = 'instructor_payout'),
    (SELECT id FROM payment_methods WHERE name = 'Cash'),
    'company_account',
    (SELECT id FROM company_accounts WHERE name = 'KiteSurf Holdings'),
    'instructor',
    (SELECT id FROM instructors ORDER BY id LIMIT 1),
    'PAY-INS-120',
    'Weekend coaching payout'
),
(
    NOW() - INTERVAL '1 day',
    2000.00,
    'USD',
    (SELECT id FROM transaction_types WHERE code = 'internal_transfer'),
    (SELECT id FROM payment_methods WHERE name = 'Bank Transfer'),
    'company_account',
    (SELECT id FROM company_accounts WHERE name = 'Blue Current Investments'),
    'company_account',
    (SELECT id FROM company_accounts WHERE name = 'KiteSurf Holdings'),
    'XFER-554',
    'Working capital top-up'
);

