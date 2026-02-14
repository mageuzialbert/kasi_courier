-- Create suppliers table and link it to expenses
-- Also backfill suppliers from existing expenses.supplier text values

-- 1) Suppliers table
CREATE TABLE IF NOT EXISTS suppliers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  phone TEXT NOT NULL DEFAULT '+255000000000',
  email TEXT NOT NULL DEFAULT 'placeholder@local.invalid',
  active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Case-insensitive uniqueness for supplier names
CREATE UNIQUE INDEX IF NOT EXISTS idx_suppliers_name_unique ON suppliers (LOWER(name));
CREATE INDEX IF NOT EXISTS idx_suppliers_active ON suppliers(active);
CREATE INDEX IF NOT EXISTS idx_suppliers_created_at ON suppliers(created_at);

-- Keep updated_at current
CREATE OR REPLACE FUNCTION update_suppliers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS suppliers_updated_at ON suppliers;
CREATE TRIGGER suppliers_updated_at
  BEFORE UPDATE ON suppliers
  FOR EACH ROW
  EXECUTE FUNCTION update_suppliers_updated_at();

-- 2) Link expenses to suppliers
ALTER TABLE expenses
ADD COLUMN IF NOT EXISTS supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_expenses_supplier_id ON expenses(supplier_id);

-- 3) Seed suppliers and backfill supplier_id from legacy expenses.supplier values
-- Placeholder phone/email are generated and can be edited later.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'expenses'
      AND column_name = 'supplier'
  ) THEN
    EXECUTE $seed$
      WITH existing_suppliers AS (
        SELECT
          MIN(TRIM(supplier)) AS display_name,
          LOWER(TRIM(supplier)) AS normalized_name
        FROM expenses
        WHERE supplier IS NOT NULL
          AND TRIM(supplier) <> ''
        GROUP BY LOWER(TRIM(supplier))
      )
      INSERT INTO suppliers (name, phone, email, active)
      SELECT
        display_name,
        '+255000000000',
        CONCAT(
          REGEXP_REPLACE(normalized_name, '[^a-z0-9]+', '.', 'g'),
          '@placeholder.local'
        ),
        true
      FROM existing_suppliers
      ON CONFLICT ((LOWER(name))) DO NOTHING;
    $seed$;

    EXECUTE $backfill$
      UPDATE expenses e
      SET supplier_id = s.id
      FROM suppliers s
      WHERE e.supplier_id IS NULL
        AND e.supplier IS NOT NULL
        AND TRIM(e.supplier) <> ''
        AND LOWER(TRIM(e.supplier)) = LOWER(s.name);
    $backfill$;
  END IF;
END $$;
