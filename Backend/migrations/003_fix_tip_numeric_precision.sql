-- Alter amount_eth column to allow higher precision and scale
-- NUMERIC(38, 18) allows up to 20 digits before decimal and 18 after
ALTER TABLE tips 
ALTER COLUMN amount_eth TYPE NUMERIC(38, 18);
