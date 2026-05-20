ALTER TABLE public.recipes
ADD COLUMN IF NOT EXISTS raw_text TEXT,
ADD COLUMN IF NOT EXISTS import_confidence DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS import_errors TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN IF NOT EXISTS import_warnings TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN IF NOT EXISTS import_flags JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS import_reviewed_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_recipes_import_confidence ON public.recipes(import_confidence);

-- Made with Bob
