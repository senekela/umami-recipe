-- Create recipes table
CREATE TABLE IF NOT EXISTS public.recipes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  image_url TEXT,
  source_url TEXT,
  ingredients JSONB DEFAULT '[]'::jsonb,
  steps JSONB DEFAULT '[]'::jsonb,
  tags TEXT[] DEFAULT ARRAY[]::TEXT[],
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  share_token UUID,
  share_enabled BOOLEAN DEFAULT false,
  import_method TEXT DEFAULT 'manual' CHECK (import_method IN ('manual', 'url', 'ocr', 'fork')),
  import_source TEXT,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.recipes ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view published recipes" ON public.recipes;
DROP POLICY IF EXISTS "Users can view own recipes" ON public.recipes;
DROP POLICY IF EXISTS "Users can view shared recipes" ON public.recipes;
DROP POLICY IF EXISTS "Users can insert own recipes" ON public.recipes;
DROP POLICY IF EXISTS "Users can update own recipes" ON public.recipes;
DROP POLICY IF EXISTS "Users can delete own recipes" ON public.recipes;

-- Create RLS policies for recipes
-- Anyone can view published recipes
CREATE POLICY "Users can view published recipes"
  ON public.recipes
  FOR SELECT
  USING (status = 'published');

-- Users can view their own recipes (draft or published)
CREATE POLICY "Users can view own recipes"
  ON public.recipes
  FOR SELECT
  USING (auth.uid() = owner_id);

-- Anyone can view recipes with share_enabled and valid share_token
CREATE POLICY "Users can view shared recipes"
  ON public.recipes
  FOR SELECT
  USING (share_enabled = true AND share_token IS NOT NULL);

-- Users can insert their own recipes
CREATE POLICY "Users can insert own recipes"
  ON public.recipes
  FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

-- Users can update their own recipes
CREATE POLICY "Users can update own recipes"
  ON public.recipes
  FOR UPDATE
  USING (auth.uid() = owner_id)
  WITH CHECK (auth.uid() = owner_id);

-- Users can delete their own recipes
CREATE POLICY "Users can delete own recipes"
  ON public.recipes
  FOR DELETE
  USING (auth.uid() = owner_id);

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS set_updated_at_recipes ON public.recipes;

CREATE TRIGGER set_updated_at_recipes
  BEFORE UPDATE ON public.recipes
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_recipes_owner_id ON public.recipes(owner_id);
CREATE INDEX IF NOT EXISTS idx_recipes_status ON public.recipes(status);
CREATE INDEX IF NOT EXISTS idx_recipes_slug ON public.recipes(slug);
CREATE INDEX IF NOT EXISTS idx_recipes_share_token ON public.recipes(share_token);

-- Create storage bucket for recipe images
INSERT INTO storage.buckets (id, name, public)
VALUES ('recipe-images', 'recipe-images', true)
ON CONFLICT (id) DO NOTHING;

-- Drop existing storage policies if they exist
DROP POLICY IF EXISTS "Recipe images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload recipe images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own recipe images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own recipe images" ON storage.objects;

-- Create storage policies for recipe images
-- Anyone can view recipe images (public bucket)
CREATE POLICY "Recipe images are publicly accessible"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'recipe-images');

-- Authenticated users can upload recipe images to their own folder
CREATE POLICY "Users can upload recipe images"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'recipe-images'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Users can update their own recipe images
CREATE POLICY "Users can update own recipe images"
  ON storage.objects FOR UPDATE
  USING (
    bucket_id = 'recipe-images'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  )
  WITH CHECK (
    bucket_id = 'recipe-images'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Users can delete their own recipe images
CREATE POLICY "Users can delete own recipe images"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'recipe-images'
    AND auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- Made with Bob