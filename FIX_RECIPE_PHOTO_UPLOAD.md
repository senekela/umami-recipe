# Fix Recipe Photo Upload RLS Error

## Problem
When uploading a photo for a new recipe, you get: "new row violates row-level security policy"

## Root Cause
The `recipe-images` storage bucket and its RLS policies were missing from the database.

## Solution
Apply the migration file: [`supabase/migrations/20260520_create_recipes_and_storage.sql`](supabase/migrations/20260520_create_recipes_and_storage.sql)

## Manual Steps to Apply

### Option 1: Via Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor** in the left sidebar
3. Click **New Query**
4. Copy the entire contents of [`supabase/migrations/20260520_create_recipes_and_storage.sql`](supabase/migrations/20260520_create_recipes_and_storage.sql)
5. Paste into the SQL editor
6. Click **Run** to execute the migration

### Option 2: Via Supabase CLI

If you have the Supabase CLI installed and linked to your project:

```bash
supabase db push
```

This will automatically apply all pending migrations.

## What This Migration Does

1. **Creates the `recipes` table** with proper schema:
   - All recipe fields (title, description, ingredients, steps, etc.)
   - Owner tracking via `owner_id`
   - Draft/published status
   - Share functionality with tokens

2. **Sets up RLS policies for recipes**:
   - ✅ Anyone can view published recipes
   - ✅ Users can view their own recipes (draft or published)
   - ✅ Anyone can view shared recipes (with valid share token)
   - ✅ Users can create/update/delete their own recipes

3. **Creates `recipe-images` storage bucket** (public)

4. **Sets up RLS policies for recipe images**:
   - ✅ Anyone can view recipe images (public bucket)
   - ✅ Authenticated users can upload images to their own folder (`{user_id}/...`)
   - ✅ Users can update/delete only their own images

## File Structure for Recipe Images

When uploading recipe images, they should be stored with this path structure:
```
recipe-images/{user_id}/{filename}
```

Example:
```
recipe-images/123e4567-e89b-12d3-a456-426614174000/my-recipe-photo.jpg
```

This ensures users can only upload/modify images in their own folder.

## Verification

After applying the migration, verify it worked:

1. Go to **Database** → **Tables** in Supabase dashboard
   - You should see the `recipes` table

2. Go to **Storage** in Supabase dashboard
   - You should see the `recipe-images` bucket

3. Try uploading a photo for a new recipe
   - It should now work without RLS errors!

## Need Help?

If you encounter any issues:
- Check the Supabase logs in the dashboard
- Verify you're authenticated when uploading
- Ensure the file path follows the `{user_id}/filename` pattern
