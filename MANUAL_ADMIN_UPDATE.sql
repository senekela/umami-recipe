-- Manual Admin Setup Script
-- Run this in Supabase SQL Editor (https://supabase.com/dashboard/project/YOUR_PROJECT/sql/new)

-- Step 1: Add is_admin column to profiles table (if not already added)
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE NOT NULL;

-- Step 2: Create an index on is_admin for faster queries
CREATE INDEX IF NOT EXISTS idx_profiles_is_admin ON profiles(is_admin);

-- Step 3: (OPTIONAL) Promote an existing user to admin
-- Replace 'user@example.com' with the actual email of the user you want to make admin
-- Uncomment the lines below and update the email:

-- UPDATE profiles
-- SET is_admin = true
-- WHERE id = (
--   SELECT id FROM auth.users WHERE email = 'user@example.com'
-- );

-- Step 4: Verify the update
-- Uncomment to see all admin users:
-- SELECT p.id, u.email, p.nickname, p.is_admin, p.created_at
-- FROM profiles p
-- JOIN auth.users u ON p.id = u.id
-- WHERE p.is_admin = true;

-- Step 5: (OPTIONAL) View all users and their admin status
-- Uncomment to see all users:
-- SELECT p.id, u.email, p.nickname, p.is_admin, p.created_at
-- FROM profiles p
-- JOIN auth.users u ON p.id = u.id
-- ORDER BY p.created_at DESC;

-- Made with Bob
