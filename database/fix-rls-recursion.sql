-- Fix infinite recursion in RLS policies
-- The issue: Policies query the users table, which triggers another policy check, causing recursion
-- Solution: Create a SECURITY DEFINER function that can check roles without triggering RLS

-- Function to get user role without triggering RLS
CREATE OR REPLACE FUNCTION public.get_user_role(user_id UUID)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role TEXT;
BEGIN
  SELECT role INTO user_role
  FROM public.users
  WHERE id = user_id;
  
  RETURN user_role;
END;
$$;

-- Drop existing policies that cause recursion
DROP POLICY IF EXISTS "Admins can read all users" ON users;
DROP POLICY IF EXISTS "Staff can read riders and businesses" ON users;
DROP POLICY IF EXISTS "Admins can update any user" ON users;
DROP POLICY IF EXISTS "Businesses can read own record" ON businesses;
DROP POLICY IF EXISTS "Staff and Admins can read all businesses" ON businesses;
DROP POLICY IF EXISTS "Admins can update any business" ON businesses;
DROP POLICY IF EXISTS "Staff and Admins can read all deliveries" ON deliveries;
DROP POLICY IF EXISTS "Riders can read assigned deliveries" ON deliveries;
DROP POLICY IF EXISTS "Businesses and Staff can create deliveries" ON deliveries;
DROP POLICY IF EXISTS "Staff can update deliveries" ON deliveries;
DROP POLICY IF EXISTS "Riders can update assigned deliveries" ON deliveries;
DROP POLICY IF EXISTS "Read delivery events" ON delivery_events;
DROP POLICY IF EXISTS "Riders and Staff can create events" ON delivery_events;
DROP POLICY IF EXISTS "Staff and Admins can read all charges" ON charges;
DROP POLICY IF EXISTS "Staff and Admins can create charges" ON charges;
DROP POLICY IF EXISTS "Staff and Admins can read all invoices" ON invoices;
DROP POLICY IF EXISTS "Read invoice items" ON invoice_items;
DROP POLICY IF EXISTS "Admins and Staff can read SMS logs" ON sms_logs;
DROP POLICY IF EXISTS "Users can read own OTP codes" ON otp_codes;
DROP POLICY IF EXISTS "Users can update own OTP codes" ON otp_codes;
DROP POLICY IF EXISTS "Admins can modify regions" ON regions;
DROP POLICY IF EXISTS "Admins can modify districts" ON districts;

-- Recreate policies using the function to avoid recursion

-- ============================================
-- USERS TABLE POLICIES
-- ============================================

-- Admins can read all users
CREATE POLICY "Admins can read all users"
  ON users FOR SELECT
  USING (
    public.get_user_role(auth.uid()) = 'ADMIN'
  );

-- Staff can read riders and businesses
CREATE POLICY "Staff can read riders and businesses"
  ON users FOR SELECT
  USING (
    public.get_user_role(auth.uid()) = 'STAFF'
    AND role IN ('RIDER', 'BUSINESS')
  );

-- Admins can update any user
CREATE POLICY "Admins can update any user"
  ON users FOR UPDATE
  USING (
    public.get_user_role(auth.uid()) = 'ADMIN'
  );

-- ============================================
-- BUSINESSES TABLE POLICIES
-- ============================================

-- Businesses can read their own record
CREATE POLICY "Businesses can read own record"
  ON businesses FOR SELECT
  USING (
    user_id = auth.uid()
    OR public.get_user_role(auth.uid()) IN ('ADMIN', 'STAFF')
  );

-- Staff and Admins can read all businesses
CREATE POLICY "Staff and Admins can read all businesses"
  ON businesses FOR SELECT
  USING (
    public.get_user_role(auth.uid()) IN ('ADMIN', 'STAFF')
  );

-- Admins can update any business
CREATE POLICY "Admins can update any business"
  ON businesses FOR UPDATE
  USING (
    public.get_user_role(auth.uid()) = 'ADMIN'
  );

-- ============================================
-- DELIVERIES TABLE POLICIES
-- ============================================

-- Staff and Admins can read all deliveries
CREATE POLICY "Staff and Admins can read all deliveries"
  ON deliveries FOR SELECT
  USING (
    public.get_user_role(auth.uid()) IN ('ADMIN', 'STAFF')
  );

-- Riders can read assigned deliveries
CREATE POLICY "Riders can read assigned deliveries"
  ON deliveries FOR SELECT
  USING (
    assigned_rider_id = auth.uid()
    AND public.get_user_role(auth.uid()) = 'RIDER'
  );

-- Businesses and Staff can create deliveries
CREATE POLICY "Businesses and Staff can create deliveries"
  ON deliveries FOR INSERT
  WITH CHECK (
    public.get_user_role(auth.uid()) IN ('BUSINESS', 'STAFF')
  );

-- Staff can update deliveries (for assignment)
CREATE POLICY "Staff can update deliveries"
  ON deliveries FOR UPDATE
  USING (
    public.get_user_role(auth.uid()) = 'STAFF'
  );

-- Riders can update assigned deliveries (status only)
CREATE POLICY "Riders can update assigned deliveries"
  ON deliveries FOR UPDATE
  USING (
    assigned_rider_id = auth.uid()
    AND public.get_user_role(auth.uid()) = 'RIDER'
  );

-- ============================================
-- DELIVERY EVENTS TABLE POLICIES
-- ============================================

-- Anyone can read events for deliveries they have access to
CREATE POLICY "Read delivery events"
  ON delivery_events FOR SELECT
  USING (
    delivery_id IN (
      SELECT id FROM deliveries
      WHERE 
        business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid())
        OR assigned_rider_id = auth.uid()
        OR public.get_user_role(auth.uid()) IN ('ADMIN', 'STAFF')
    )
  );

-- Riders and Staff can create delivery events
CREATE POLICY "Riders and Staff can create events"
  ON delivery_events FOR INSERT
  WITH CHECK (
    public.get_user_role(auth.uid()) IN ('RIDER', 'STAFF')
  );

-- ============================================
-- CHARGES TABLE POLICIES
-- ============================================

-- Staff and Admins can read all charges
CREATE POLICY "Staff and Admins can read all charges"
  ON charges FOR SELECT
  USING (
    public.get_user_role(auth.uid()) IN ('ADMIN', 'STAFF')
  );

-- Staff and Admins can create charges
CREATE POLICY "Staff and Admins can create charges"
  ON charges FOR INSERT
  WITH CHECK (
    public.get_user_role(auth.uid()) IN ('ADMIN', 'STAFF')
  );

-- ============================================
-- INVOICES TABLE POLICIES
-- ============================================

-- Staff and Admins can read all invoices
CREATE POLICY "Staff and Admins can read all invoices"
  ON invoices FOR SELECT
  USING (
    public.get_user_role(auth.uid()) IN ('ADMIN', 'STAFF')
  );

-- ============================================
-- INVOICE ITEMS TABLE POLICIES
-- ============================================

-- Same access as invoices
CREATE POLICY "Read invoice items"
  ON invoice_items FOR SELECT
  USING (
    invoice_id IN (
      SELECT id FROM invoices
      WHERE 
        business_id IN (SELECT id FROM businesses WHERE user_id = auth.uid())
        OR public.get_user_role(auth.uid()) IN ('ADMIN', 'STAFF')
    )
  );

-- ============================================
-- SMS LOGS TABLE POLICIES
-- ============================================

-- Admins and Staff can read SMS logs
CREATE POLICY "Admins and Staff can read SMS logs"
  ON sms_logs FOR SELECT
  USING (
    public.get_user_role(auth.uid()) IN ('ADMIN', 'STAFF')
  );

-- ============================================
-- OTP CODES TABLE POLICIES
-- ============================================

-- Users can read their own OTP codes (for verification)
CREATE POLICY "Users can read own OTP codes"
  ON otp_codes FOR SELECT
  USING (
    phone IN (
      SELECT phone FROM users WHERE id = auth.uid()
    )
  );

-- Users can update their own OTP codes (mark as used)
CREATE POLICY "Users can update own OTP codes"
  ON otp_codes FOR UPDATE
  USING (
    phone IN (
      SELECT phone FROM users WHERE id = auth.uid()
    )
  );

-- ============================================
-- REGIONS TABLE POLICIES
-- ============================================

-- Only admins can modify regions
CREATE POLICY "Admins can modify regions"
  ON regions FOR ALL
  USING (
    public.get_user_role(auth.uid()) = 'ADMIN'
  );

-- ============================================
-- DISTRICTS TABLE POLICIES
-- ============================================

-- Only admins can modify districts
CREATE POLICY "Admins can modify districts"
  ON districts FOR ALL
  USING (
    public.get_user_role(auth.uid()) = 'ADMIN'
  );
