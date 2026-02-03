-- Add missing columns to order_items table
-- This allows storing therapist, room info from timers and service details

ALTER TABLE order_items 
ADD COLUMN IF NOT EXISTS service_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS subtotal NUMERIC(12,2),
ADD COLUMN IF NOT EXISTS therapist_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS room_name VARCHAR(255);
