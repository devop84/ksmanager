INSERT INTO payment_methods (name, description) VALUES
('Visa Debit', 'Consumer debit cards issued over the Visa network'),
('Visa Credit', 'Standard Visa credit card payments'),
('Mastercard', 'Mastercard credit and debit transactions'),
('American Express', 'Amex credit charge payments'),
('Cash', 'On-site cash payments'),
('Bank Transfer', 'Wire or ACH transfer into company account'),
('PayPal', 'Online PayPal balance or card payment'),
('Stripe', 'Stripe-processed card or wallet payment')
ON CONFLICT (name) DO NOTHING;

