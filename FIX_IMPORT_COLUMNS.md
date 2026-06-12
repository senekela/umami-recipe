# Fix Import Columns Error

## Problem

When trying to import recipes with OCR, you get this error:
```
Failed to save recipe: Could not find the 'import_confidence' column of 'recipes' in the schema cache
```

## Cause

The database migration `20260520_add_recipe_import_diagnostics.sql` hasn't been run on your Supabase database yet. This migration adds the necessary columns for import diagnostics.

## Solution

You need to run the migration to add these columns to your `recipes` table.

### Option 1: Via Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor** in the left sidebar
3. Click **New Query**
4. Copy and paste the contents of `run_import_diagnostics_migration.sql`
5. Click **Run** to execute the migration
6. Verify the columns were added by checking the output

### Option 2: Via Supabase CLI

If you have the Supabase CLI installed:

```bash
# Make sure you're logged in
supabase login

# Link to your project (if not already linked)
supabase link --project-ref your-project-ref

# Run the migration
supabase db push
```

### Option 3: Manual SQL Execution

Connect to your database and run:

```sql
ALTER TABLE public.recipes
ADD COLUMN IF NOT EXISTS raw_text TEXT,
ADD COLUMN IF NOT EXISTS import_confidence DOUBLE PRECISION,
ADD COLUMN IF NOT EXISTS import_errors TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN IF NOT EXISTS import_warnings TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN IF NOT EXISTS import_flags JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS import_reviewed_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_recipes_import_confidence ON public.recipes(import_confidence);
```

## Verify the Fix

After running the migration, verify the columns exist:

```sql
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'recipes' 
AND column_name IN ('raw_text', 'import_confidence', 'import_errors', 'import_warnings', 'import_flags', 'import_reviewed_at')
ORDER BY column_name;
```

You should see 6 rows returned with these columns:
- `import_confidence` (double precision)
- `import_errors` (ARRAY)
- `import_flags` (jsonb)
- `import_reviewed_at` (timestamp with time zone)
- `import_warnings` (ARRAY)
- `raw_text` (text)

## Test the Import

After the migration:

1. Refresh your browser to clear any cached schema
2. Navigate to **Import Recipe → From Photo**
3. Upload a recipe photo
4. The import should now work without errors

## What These Columns Do

- **`raw_text`**: Stores the raw OCR-extracted text
- **`import_confidence`**: OCR confidence score (0-1)
- **`import_errors`**: Array of error messages during import
- **`import_warnings`**: Array of warning messages
- **`import_flags`**: JSON array of flagged fields needing review
- **`import_reviewed_at`**: Timestamp when user reviewed the import

These columns enable the import diagnostics and review workflow for OCR-imported recipes.

---

**Made with Bob** 🤖