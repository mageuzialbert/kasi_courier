-- Migration: Add salary fields to expenses table
-- Run this in Supabase SQL Editor

ALTER TABLE expenses
  ADD COLUMN IF NOT EXISTS is_salary BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS rider_id  UUID REFERENCES users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS staff_id  UUID REFERENCES users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_expenses_is_salary ON expenses(is_salary);
CREATE INDEX IF NOT EXISTS idx_expenses_rider_id  ON expenses(rider_id);
CREATE INDEX IF NOT EXISTS idx_expenses_staff_id  ON expenses(staff_id);
