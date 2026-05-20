-- Add is_admin column to profiles table
ALTER TABLE profiles
ADD COLUMN is_admin BOOLEAN DEFAULT FALSE NOT NULL;

-- Create an index on is_admin for faster queries
CREATE INDEX idx_profiles_is_admin ON profiles(is_admin);

-- Add a comment to document the column
COMMENT ON COLUMN profiles.is_admin IS 'Indicates whether the user has admin privileges';

-- Made with Bob
