-- Migration: Add rooms table and update timers table for timer modal functionality
-- Date: 2026-01-27

-- =========================
-- CREATE ROOMS TABLE
-- =========================
CREATE TABLE IF NOT EXISTS rooms (
  id SERIAL PRIMARY KEY,
  branch_id INT REFERENCES branches(id),
  name VARCHAR(50) NOT NULL,
  type VARCHAR(20), -- SPA, LC, etc.
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW()
);

-- =========================
-- UPDATE TIMERS TABLE
-- =========================
-- Add missing columns to timers table if they don't exist
ALTER TABLE timers ADD COLUMN IF NOT EXISTS service_id INT REFERENCES services(id);
ALTER TABLE timers ADD COLUMN IF NOT EXISTS room_id INT REFERENCES rooms(id);
ALTER TABLE timers ADD COLUMN IF NOT EXISTS branch_id INT REFERENCES branches(id);
ALTER TABLE timers ADD COLUMN IF NOT EXISTS planned_end_time TIMESTAMP;

-- Create index for faster room occupancy lookups
CREATE INDEX IF NOT EXISTS idx_timers_room_active ON timers(room_id, end_time) WHERE end_time IS NULL;

-- =========================
-- SEED SAMPLE ROOMS
-- =========================
INSERT INTO rooms (branch_id, name, type, is_active) VALUES
(1, 'Room 1', 'SPA', true),
(1, 'Room 2', 'SPA', true),
(1, 'Room 3', 'SPA', true),
(1, 'Sofa 1', 'LC', true),
(1, 'Sofa 2', 'LC', true),
(1, 'Sofa 3', 'LC', true),
(2, 'Room A', 'SPA', true),
(2, 'Room B', 'SPA', true),
(2, 'Sofa A', 'LC', true),
(2, 'Sofa B', 'LC', true)
ON CONFLICT DO NOTHING;
