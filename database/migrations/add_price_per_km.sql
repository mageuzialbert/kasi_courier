-- Migration: Add price-per-kilometer delivery pricing
-- 1. Add price_per_km to company_profile (admin-configurable global rate)
-- 2. Add distance/pricing metadata columns to deliveries for reporting

-- Add price_per_km to company_profile
ALTER TABLE company_profile
ADD COLUMN IF NOT EXISTS price_per_km DECIMAL(10, 2) DEFAULT 2000.00;

COMMENT ON COLUMN company_profile.price_per_km IS 'Global delivery rate per kilometer in TZS. Admin can update this.';

-- Add distance and pricing columns to deliveries
ALTER TABLE deliveries
ADD COLUMN IF NOT EXISTS distance_km DECIMAL(10, 3) DEFAULT NULL;

ALTER TABLE deliveries
ADD COLUMN IF NOT EXISTS price_per_km_snapshot DECIMAL(10, 2) DEFAULT NULL;

ALTER TABLE deliveries
ADD COLUMN IF NOT EXISTS price_applied DECIMAL(10, 2) DEFAULT NULL;

ALTER TABLE deliveries
ADD COLUMN IF NOT EXISTS pricing_method TEXT DEFAULT NULL
CHECK (pricing_method IN ('PER_KM', 'CUSTOM_CLIENT', 'CUSTOM_STAFF'));

COMMENT ON COLUMN deliveries.distance_km IS 'Straight-line distance between pickup and dropoff in kilometers.';
COMMENT ON COLUMN deliveries.price_per_km_snapshot IS 'The price_per_km rate at the time this delivery was created.';
COMMENT ON COLUMN deliveries.price_applied IS 'The actual delivery fee charged (may differ from per-km if custom).';
COMMENT ON COLUMN deliveries.pricing_method IS 'How the price was determined: PER_KM, CUSTOM_CLIENT, or CUSTOM_STAFF.';

-- Refresh PostgREST schema cache
NOTIFY pgrst, 'reload schema';
