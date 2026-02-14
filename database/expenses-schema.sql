-- Expenses Schema
-- This file creates suppliers, expense_categories, and expenses tables

-- Create suppliers table
CREATE TABLE IF NOT EXISTS suppliers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  phone TEXT NOT NULL DEFAULT '+255000000000',
  email TEXT NOT NULL DEFAULT 'placeholder@local.invalid',
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create expense_categories table
CREATE TABLE IF NOT EXISTS expense_categories (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create expenses table
CREATE TABLE IF NOT EXISTS expenses (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  category_id UUID REFERENCES expense_categories(id) ON DELETE SET NULL,
  supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
  amount DECIMAL(10, 2) NOT NULL,
  description TEXT,
  expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE UNIQUE INDEX IF NOT EXISTS idx_suppliers_name_unique ON suppliers(LOWER(name));
CREATE INDEX IF NOT EXISTS idx_suppliers_active ON suppliers(active);
CREATE INDEX IF NOT EXISTS idx_suppliers_created_at ON suppliers(created_at);
CREATE INDEX IF NOT EXISTS idx_expense_categories_active ON expense_categories(active);
CREATE INDEX IF NOT EXISTS idx_expenses_category_id ON expenses(category_id);
CREATE INDEX IF NOT EXISTS idx_expenses_supplier_id ON expenses(supplier_id);
CREATE INDEX IF NOT EXISTS idx_expenses_expense_date ON expenses(expense_date);
CREATE INDEX IF NOT EXISTS idx_expenses_created_by ON expenses(created_by);
CREATE INDEX IF NOT EXISTS idx_expenses_created_at ON expenses(created_at);

-- Function to update updated_at timestamp for expense_categories
CREATE OR REPLACE FUNCTION update_expense_categories_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
CREATE TRIGGER expense_categories_updated_at
  BEFORE UPDATE ON expense_categories
  FOR EACH ROW
  EXECUTE FUNCTION update_expense_categories_updated_at();

-- Function to update updated_at timestamp for suppliers
CREATE OR REPLACE FUNCTION update_suppliers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to automatically update updated_at
DROP TRIGGER IF EXISTS suppliers_updated_at ON suppliers;
CREATE TRIGGER suppliers_updated_at
  BEFORE UPDATE ON suppliers
  FOR EACH ROW
  EXECUTE FUNCTION update_suppliers_updated_at();

-- Seed initial expense categories
INSERT INTO expense_categories (name, description, active) VALUES
  ('Fuel', 'Vehicle fuel costs', true),
  ('Vehicle Maintenance', 'Repairs, servicing, and maintenance for delivery vehicles', true),
  ('Salaries', 'Staff and rider salaries', true),
  ('Office Rent', 'Office space rental costs', true),
  ('Utilities', 'Electricity, water, internet, phone bills', true),
  ('Marketing', 'Advertising and marketing expenses', true),
  ('Other', 'Miscellaneous expenses', true)
ON CONFLICT (name) DO NOTHING;
