-- Migration: Protect CUSTOMER_PAYMENT and CUSTOMER_REFUND transaction types
-- Date: 2024
-- Description: Prevents deletion of CUSTOMER_PAYMENT and CUSTOMER_REFUND transaction types
--              which are required for the order payment and refund system

-- Create a function to prevent deletion of protected transaction types
CREATE OR REPLACE FUNCTION prevent_delete_protected_transaction_types()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if the transaction type being deleted is a protected one
    IF OLD.code IN ('CUSTOMER_PAYMENT', 'CUSTOMER_REFUND') THEN
        RAISE EXCEPTION 'Cannot delete protected transaction type: %. This type is required by the system.', OLD.code;
    END IF;
    
    RETURN OLD;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to prevent deletion
DROP TRIGGER IF EXISTS trigger_prevent_delete_protected_transaction_types ON transaction_types;
CREATE TRIGGER trigger_prevent_delete_protected_transaction_types
BEFORE DELETE ON transaction_types
FOR EACH ROW
EXECUTE FUNCTION prevent_delete_protected_transaction_types();

