# Supabase Setup Instructions for Umami

Please complete the following steps in your Supabase dashboard:

## 1. Database Schema

Go to **SQL Editor** in your Supabase dashboard and run these queries:

### Create profiles table
```sql
CREATE TABLE public.profiles (
  id           UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  created_at   TIMESTAMPTZ DEFAULT now()
);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id)
  VALUES (NEW.id)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
```

### Create recipes table
```sql
CREATE TABLE public.recipes (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug          TEXT UNIQUE NOT NULL,
  title         TEXT NOT NULL,
  description   TEXT,
  image_url     TEXT,
  source_url    TEXT,
  ingredients   JSONB NOT NULL DEFAULT '[]',
  steps         JSONB NOT NULL DEFAULT '[]',
  tags          TEXT[] NOT NULL DEFAULT '{}',
  status        TEXT NOT NULL DEFAULT 'draft'
                CHECK (status IN ('draft', 'published')),
  owner_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  share_token   UUID UNIQUE,
  share_enabled BOOLEAN NOT NULL DEFAULT false,
  import_method TEXT DEFAULT 'manual'
                CHECK (import_method IN ('manual', 'url', 'ocr', 'fork')),
  import_source TEXT,
  published_at  TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX recipes_status_idx      ON public.recipes(status);
CREATE INDEX recipes_owner_idx       ON public.recipes(owner_id);
CREATE INDEX recipes_share_token_idx ON public.recipes(share_token)
  WHERE share_enabled = true;
CREATE INDEX recipes_tags_idx        ON public.recipes USING GIN(tags);
CREATE INDEX recipes_search_idx      ON public.recipes USING GIN(
  to_tsvector('english', coalesce(title,'') || ' ' || coalesce(description,''))
);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER recipes_updated_at
  BEFORE UPDATE ON public.recipes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

## 2. Row Level Security

Run these policies:

```sql
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipes  ENABLE ROW LEVEL SECURITY;

-- Profiles
CREATE POLICY "Profiles readable by all"
  ON public.profiles FOR SELECT USING (true);

CREATE POLICY "Users manage their own profile"
  ON public.profiles FOR ALL
  USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Recipes: public reads
CREATE POLICY "Published recipes readable by all"
  ON public.recipes FOR SELECT
  USING (status = 'published');

CREATE POLICY "Shared drafts readable via token"
  ON public.recipes FOR SELECT
  USING (share_enabled = true AND share_token IS NOT NULL);

-- Recipes: owners read their own (drafts + published)
CREATE POLICY "Owners read their own recipes"
  ON public.recipes FOR SELECT
  USING (auth.uid() = owner_id);

-- Recipes: authenticated writes (owner only)
CREATE POLICY "Authenticated users can create recipes"
  ON public.recipes FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners can update their recipes"
  ON public.recipes FOR UPDATE
  USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners can delete their recipes"
  ON public.recipes FOR DELETE
  USING (auth.uid() = owner_id);
```

## 3. Storage Buckets

Go to **Storage** in your Supabase dashboard:

1. Create bucket `recipe-images` (public)
2. Create bucket `ocr-uploads` (private)

For **recipe-images** bucket policies:
```sql
-- Allow public reads
CREATE POLICY "Public read recipe images"
ON storage.objects FOR SELECT
USING (bucket_id = 'recipe-images');

-- Allow authenticated users to upload to their own folder
CREATE POLICY "Users upload to own folder"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'recipe-images' AND
  auth.uid()::text = (storage.foldername(name))[1]
);
```

For **ocr-uploads** bucket policies:
```sql
-- Allow authenticated users to upload
CREATE POLICY "Authenticated users upload OCR"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'ocr-uploads' AND
  auth.uid() IS NOT NULL
);
```

## 4. Authentication Configuration

Go to **Authentication → Settings** in your Supabase dashboard:

1. Enable **Magic Link** (Email OTP)
2. Disable **Email + Password** authentication
3. Set **Site URL** to your deployed app URL (or http://localhost:5173 for development)
4. Add redirect URL: `http://localhost:5173/**` (and your production URL when deployed)
5. Customize the magic link email template with "Umami" branding

## 5. Environment Variables

The app will automatically use the Supabase connection from Make. No additional env vars needed.

---

Once you've completed these steps, the app will be ready to use!
