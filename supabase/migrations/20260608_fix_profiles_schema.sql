-- Fix profiles table schema to match the application code
-- This migration adds missing columns and renames display_name to nickname

-- Add missing columns if they don't exist
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS avatar_url TEXT,
ADD COLUMN IF NOT EXISTS avatar_path TEXT,
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Rename display_name to nickname if display_name exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'profiles' 
    AND column_name = 'display_name'
  ) THEN
    ALTER TABLE public.profiles RENAME COLUMN display_name TO nickname;
  END IF;
END $$;

-- Add nickname column if it doesn't exist (in case display_name didn't exist)
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS nickname TEXT;

-- Ensure the updated_at trigger exists
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Drop and recreate the trigger to ensure it works
DROP TRIGGER IF EXISTS set_updated_at ON public.profiles;

CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Reload the schema cache
NOTIFY pgrst, 'reload schema';

-- Made with Bob
