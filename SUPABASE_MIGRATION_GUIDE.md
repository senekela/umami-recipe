# How to Apply the Profile Migration in Supabase Dashboard

Follow these steps to manually apply the SQL migration for the user profile feature.

## Step-by-Step Instructions

### 1. Open Supabase Dashboard

1. Go to [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Sign in to your account
3. Select your **Umami Recipe** project

### 2. Navigate to SQL Editor

1. In the left sidebar, click on **"SQL Editor"** (icon looks like `</>`)
2. Click **"New query"** button (top right)

### 3. Copy and Paste the SQL

Copy the entire SQL code below and paste it into the SQL Editor:

```sql
-- Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  nickname TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policies
-- Users can view their own profile
CREATE POLICY "Users can view own profile"
  ON public.profiles
  FOR SELECT
  USING (auth.uid() = id);

-- Users can insert their own profile
CREATE POLICY "Users can insert own profile"
  ON public.profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON public.profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Create function to handle updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Create function to automatically create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, nickname)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to auto-create profile
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Create storage bucket for avatars
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Create storage policies for avatars
CREATE POLICY "Avatar images are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update their own avatar"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'avatars' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own avatar"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'avatars' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
```

### 4. Run the Migration

1. Click the **"Run"** button (or press `Cmd/Ctrl + Enter`)
2. Wait for the query to complete
3. You should see a success message: **"Success. No rows returned"**

### 5. Verify the Migration

#### Check the Profiles Table

1. Go to **"Table Editor"** in the left sidebar
2. Look for the **"profiles"** table in the list
3. Click on it to see the structure:
   - `id` (uuid, primary key)
   - `nickname` (text)
   - `avatar_url` (text)
   - `created_at` (timestamptz)
   - `updated_at` (timestamptz)

#### Check the Storage Bucket

1. Go to **"Storage"** in the left sidebar
2. You should see a bucket named **"avatars"**
3. Click on it - it should be empty initially
4. The bucket should be marked as **"Public"**

#### Check RLS Policies

1. In **"Table Editor"**, click on the **"profiles"** table
2. Click the **"RLS"** tab (or shield icon)
3. You should see 3 policies:
   - "Users can view own profile"
   - "Users can insert own profile"
   - "Users can update own profile"

### 6. Create Profile for Existing Users (Optional)

If you already have users in your system, you need to create profiles for them manually:

```sql
-- Run this in SQL Editor to create profiles for existing users
INSERT INTO public.profiles (id, nickname)
SELECT 
  id, 
  COALESCE(raw_user_meta_data->>'name', split_part(email, '@', 1))
FROM auth.users
WHERE id NOT IN (SELECT id FROM public.profiles);
```

## Troubleshooting

### Error: "relation already exists"

If you see this error, it means the table or policy already exists. This is safe to ignore if you're re-running the migration.

### Error: "permission denied"

Make sure you're logged in as the project owner or have sufficient permissions.

### Storage Bucket Not Created

If the avatars bucket wasn't created:

1. Go to **Storage** in the sidebar
2. Click **"New bucket"**
3. Name it **"avatars"**
4. Check **"Public bucket"**
5. Click **"Create bucket"**

Then run the storage policies SQL separately:

```sql
CREATE POLICY "Avatar images are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'avatars' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can update their own avatar"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'avatars' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete their own avatar"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'avatars' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );
```

## What This Migration Does

1. **Creates `profiles` table** - Stores user nicknames and avatar URLs
2. **Enables RLS** - Ensures users can only access their own profile
3. **Creates policies** - Defines who can read/write profile data
4. **Auto-creates profiles** - New users automatically get a profile
5. **Creates storage bucket** - Stores profile pictures securely
6. **Sets up storage policies** - Controls who can upload/view avatars

## Next Steps

After successfully running the migration:

1. Restart your development server if it's running
2. Log in to your app
3. Navigate to the "Me" tab
4. Click "Edit Profile" or "Profile" button
5. Try uploading a profile picture and setting a nickname

## Need Help?

If you encounter any issues:

1. Check the Supabase logs in the dashboard
2. Look at the browser console for errors
3. Verify all policies are enabled
4. Make sure the storage bucket is public