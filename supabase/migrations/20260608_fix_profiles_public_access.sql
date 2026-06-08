-- Fix profiles table RLS to allow public access to profile info for published recipes
-- This allows the home page to display publisher names for published recipes

-- Drop the existing restrictive policy
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;

-- Create new policies:
-- 1. Users can view their own profile (full access)
CREATE POLICY "Users can view own profile"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

-- 2. Anyone can view public profile info (nickname, avatar_url) for any user
-- This is needed so published recipes can show the publisher's name
CREATE POLICY "Public profiles are viewable"
  ON public.profiles
  FOR SELECT
  USING (true);

-- Note: The above policy allows reading all profile fields, but in practice
-- the application only exposes nickname and avatar_url for published recipes.
-- If you want to restrict which fields are visible, you would need to handle
-- that at the application level or use a view with specific columns.

-- Made with Bob