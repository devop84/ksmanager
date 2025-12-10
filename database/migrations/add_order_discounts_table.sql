-- ============================================
-- ORDER DISCOUNTS (Multiple discounts per order)
-- ============================================

-- Discounts table (multiple discounts can be applied to an order)
CREATE TABLE IF NOT EXISTS order_discounts (
    id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    
    -- Discount details
    amount NUMERIC(12,2) NOT NULL CHECK (amount > 0),
    currency VARCHAR(3) NOT NULL DEFAULT 'BRL',
    
    -- Discount reason/description
    reason VARCHAR(255),
    note TEXT,
    
    -- When and who
    occurred_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_order_discounts_order ON order_discounts(order_id);
CREATE INDEX IF NOT EXISTS idx_order_discounts_occurred_at ON order_discounts(occurred_at);

-- Function to update order discount_amount from order_discounts
CREATE OR REPLACE FUNCTION update_order_discount_amount()
RETURNS TRIGGER AS $$
DECLARE
    affected_order_id INTEGER;
    total_discount NUMERIC(12,2);
    current_subtotal NUMERIC(12,2);
    current_tax NUMERIC(12,2);
BEGIN
    affected_order_id := COALESCE(NEW.order_id, OLD.order_id);
    
    -- Calculate total discount from all discount records
    SELECT COALESCE(SUM(amount), 0) INTO total_discount
    FROM order_discounts
    WHERE order_id = affected_order_id;
    
    -- Get current subtotal and tax
    SELECT 
        COALESCE((
            SELECT SUM(subtotal) 
            FROM order_items 
            WHERE order_id = affected_order_id
        ), 0),
        COALESCE(tax_amount, 0)
    INTO current_subtotal, current_tax
    FROM orders
    WHERE id = affected_order_id;
    
    -- Update order discount_amount and recalculate total_amount
    -- This ensures consistency with the existing update_order_totals logic
    UPDATE orders
    SET 
        discount_amount = total_discount,
        total_amount = current_subtotal - total_discount + current_tax,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = affected_order_id;
    
    -- Also update balance_due based on current total_paid
    UPDATE orders
    SET balance_due = total_amount - COALESCE(total_paid, 0)
    WHERE id = affected_order_id;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Trigger to recalculate discount_amount when discounts change
CREATE TRIGGER trigger_update_order_discount_amount
AFTER INSERT OR UPDATE OR DELETE ON order_discounts
FOR EACH ROW
EXECUTE FUNCTION update_order_discount_amount();

