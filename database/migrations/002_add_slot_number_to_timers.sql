-- Migration: Add slot_number to timers table
-- Date: 2026-01-28

-- =========================
-- ADD SLOT_NUMBER COLUMN
-- =========================
-- Add slot_number field to track which slot (1-30) a timer occupies
ALTER TABLE timers ADD COLUMN IF NOT EXISTS slot_number INT CHECK (slot_number >= 1 AND slot_number <= 30);

-- Create index for faster slot lookups
CREATE INDEX IF NOT EXISTS idx_timers_slot ON timers(branch_id, slot_number, end_time) WHERE end_time IS NULL;

-- Create unique constraint to prevent multiple active timers on the same slot
CREATE UNIQUE INDEX IF NOT EXISTS idx_timers_unique_slot ON timers(branch_id, slot_number) WHERE end_time IS NULL;
