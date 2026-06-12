-- Run this migration to add import diagnostics columns to recipes table
-- This is required for the Tesseract.js OCR integration

ALTER TABLE public.recipes
ADD COLUMN IF NOT EXISTS raw_text TEXT,
ADD COLUMN IF NOT EXISTS import_confidence DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS import_errors TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN IF NOT EXISTS import_warnings TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN IF NOT EXISTS import_flags JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS import_reviewed_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_recipes_import_confidence ON public.recipes(import_confidence);

-- Verify the columns were added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'recipes' 
AND column_name IN ('raw_text', 'import_confidence', 'import_errors', 'import_warnings', 'import_flags', 'import_reviewed_at')
ORDER BY column_name;

