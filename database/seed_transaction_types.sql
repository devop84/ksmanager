INSERT INTO transaction_types (code, label, direction, description) VALUES
('customer_payment', 'Customer Payment', 'income', 'Incoming payment from customer to company'),
('service_refund', 'Customer Refund', 'expense', 'Refund issued back to a customer'),
('agency_commission', 'Agency Commission Payout', 'expense', 'Commission payments to partner agencies'),
('instructor_payout', 'Instructor Payout', 'expense', 'Hourly or contract payouts to instructors'),
('third_party_invoice', 'Third Party Expense', 'expense', 'Invoices settled with third-party vendors'),
('internal_transfer', 'Internal Account Transfer', 'transfer', 'Move funds between company accounts'),
('capital_injection', 'Capital Injection', 'income', 'Owners or investors funding the business'),
('misc_income', 'Miscellaneous Income', 'income', 'Other income items not tied to orders')
ON CONFLICT (code) DO NOTHING;

