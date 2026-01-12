-- Automated script to create Demo Users (Admin, Staff, Rider)
-- This script creates auth users and corresponding user records
-- 
-- DEMO CREDENTIALS:
-- Admin: admin@kasicourier.com / Admin123!
-- Staff: staff@kasicourier.com / Staff123!
-- Rider: rider@kasicourier.com / Rider123!
--
-- IMPORTANT: You must create the auth users in Supabase Dashboard first:
-- 1. Go to Supabase Dashboard > Authentication > Users
-- 2. Click "Add User" for each:
--    - Email: admin@kasicourier.com, Password: Admin123!
--    - Email: staff@kasicourier.com, Password: Staff123!
--    - Email: rider@kasicourier.com, Password: Rider123!
-- 3. Confirm emails for all users
-- 4. Then run this script

DO $$
DECLARE
  admin_user_id UUID;
  staff_user_id UUID;
  rider_user_id UUID;
  user_exists BOOLEAN;
BEGIN
  -- ============================================
  -- CREATE/UPDATE ADMIN USER
  -- ============================================
  SELECT id INTO admin_user_id
  FROM auth.users
  WHERE email = 'admin@kasicourier.com'
  LIMIT 1;

  IF admin_user_id IS NULL THEN
    RAISE EXCEPTION 'Auth user with email admin@kasicourier.com not found. Please create the auth user first in Supabase Dashboard.';
  END IF;

  SELECT EXISTS(SELECT 1 FROM users WHERE id = admin_user_id) INTO user_exists;

  IF user_exists THEN
    UPDATE users
    SET 
      name = 'Demo Admin',
      email = 'admin@kasicourier.com',
      phone = '+255700000001',
      role = 'ADMIN',
      active = true
    WHERE id = admin_user_id;
    RAISE NOTICE 'Admin user updated successfully. User ID: %', admin_user_id;
  ELSE
    INSERT INTO users (id, name, email, phone, role, active, created_at)
    VALUES (
      admin_user_id,
      'Demo Admin',
      'admin@kasicourier.com',
      '+255700000001',
      'ADMIN',
      true,
      NOW()
    );
    RAISE NOTICE 'Admin user created successfully. User ID: %', admin_user_id;
  END IF;

  -- ============================================
  -- CREATE/UPDATE STAFF USER
  -- ============================================
  SELECT id INTO staff_user_id
  FROM auth.users
  WHERE email = 'staff@kasicourier.com'
  LIMIT 1;

  IF staff_user_id IS NULL THEN
    RAISE EXCEPTION 'Auth user with email staff@kasicourier.com not found. Please create the auth user first in Supabase Dashboard.';
  END IF;

  SELECT EXISTS(SELECT 1 FROM users WHERE id = staff_user_id) INTO user_exists;

  IF user_exists THEN
    UPDATE users
    SET 
      name = 'Demo Staff',
      email = 'staff@kasicourier.com',
      phone = '+255700000002',
      role = 'STAFF',
      active = true
    WHERE id = staff_user_id;
    RAISE NOTICE 'Staff user updated successfully. User ID: %', staff_user_id;
  ELSE
    INSERT INTO users (id, name, email, phone, role, active, created_at)
    VALUES (
      staff_user_id,
      'Demo Staff',
      'staff@kasicourier.com',
      '+255700000002',
      'STAFF',
      true,
      NOW()
    );
    RAISE NOTICE 'Staff user created successfully. User ID: %', staff_user_id;
  END IF;

  -- ============================================
  -- CREATE/UPDATE RIDER USER
  -- ============================================
  SELECT id INTO rider_user_id
  FROM auth.users
  WHERE email = 'rider@kasicourier.com'
  LIMIT 1;

  IF rider_user_id IS NULL THEN
    RAISE EXCEPTION 'Auth user with email rider@kasicourier.com not found. Please create the auth user first in Supabase Dashboard.';
  END IF;

  SELECT EXISTS(SELECT 1 FROM users WHERE id = rider_user_id) INTO user_exists;

  IF user_exists THEN
    UPDATE users
    SET 
      name = 'Demo Rider',
      email = 'rider@kasicourier.com',
      phone = '+255700000003',
      role = 'RIDER',
      active = true
    WHERE id = rider_user_id;
    RAISE NOTICE 'Rider user updated successfully. User ID: %', rider_user_id;
  ELSE
    INSERT INTO users (id, name, email, phone, role, active, created_at)
    VALUES (
      rider_user_id,
      'Demo Rider',
      'rider@kasicourier.com',
      '+255700000003',
      'RIDER',
      true,
      NOW()
    );
    RAISE NOTICE 'Rider user created successfully. User ID: %', rider_user_id;
  END IF;

END $$;

-- Verification - Show all demo users
SELECT 
  u.id,
  u.name,
  u.email,
  u.phone,
  u.role,
  u.active,
  CASE 
    WHEN au.email_confirmed_at IS NOT NULL THEN 'Email Confirmed'
    ELSE 'Email Not Confirmed'
  END as email_status
FROM users u
LEFT JOIN auth.users au ON u.id = au.id
WHERE u.email IN ('admin@kasicourier.com', 'staff@kasicourier.com', 'rider@kasicourier.com')
ORDER BY u.role;
