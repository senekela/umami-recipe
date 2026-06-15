# Fix Empanadas Recipe Servings

## Problem
The empanadas recipe has a mismatch between:
- The **servings tag** displayed in the UI (from `recipe.servings` field)
- The **"POUR 6 PERSONNES"** text in the recipe content

## Solution

### Option 1: Fix via Supabase Dashboard (Recommended)

1. Go to your Supabase project dashboard
2. Navigate to **Table Editor** → **recipes** table
3. Find the empanadas recipe (search for "empanada" or "empenada")
4. Update the `servings` column to **6** to match "POUR 6 PERSONNES"
5. Save the changes

### Option 2: Fix via SQL Editor

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor**
3. Run this query to find the recipe:

```sql
SELECT id, title, servings, slug 
FROM recipes 
WHERE title ILIKE '%empanada%' OR title ILIKE '%empenada%';
```

4. Verify the recipe and note its current `servings` value
5. Run this query to update it to 6:

```sql
UPDATE recipes 
SET servings = 6 
WHERE title ILIKE '%empanada%' OR title ILIKE '%empenada%';
```

### Option 3: Fix via Recipe Editor in the App

1. Open the app and navigate to the empanadas recipe
2. Click **"Edit Recipe"** (you must be the owner)
3. Update the servings field to **6**
4. Save the changes

## How the Servings Display Works

The servings are displayed in two places:

1. **Tags section** (line 170-176 in [`RecipeDetail.tsx`](src/pages/RecipeDetail.tsx:170)):
   ```tsx
   {recipe.servings && (
     <div className="flex items-center gap-2 rounded-full border border-black/10 bg-white/70 px-4 py-2 text-sm">
       <Users className="h-4 w-4 text-stone-700" />
       <span className="font-medium text-stone-950">{recipe.servings}</span>
       <span className="text-stone-600">servings</span>
     </div>
   )}
   ```

2. **Recipe scaling component** - uses `recipe.servings` as the base for calculations

The "POUR 6 PERSONNES" text is likely stored in:
- The recipe's `description` field, OR
- One of the recipe's `steps` text

## Verification

After updating, verify that:
1. The servings tag shows **6 servings**
2. The "POUR 6 PERSONNES" text matches this number
3. The recipe scaling works correctly from the base of 6 servings

## Prevention

To prevent this issue in the future:

1. **When importing recipes via OCR or URL scraper**, ensure the servings extraction logic correctly identifies "POUR X PERSONNES" patterns
2. **When manually creating recipes**, always set the servings field to match any "POUR X PERSONNES" text in the description or steps
3. Consider adding validation to warn users if there's a mismatch between the servings field and any "POUR X PERSONNES" text in the content

## Related Files

- [`RecipeDetail.tsx`](src/pages/RecipeDetail.tsx:15) - Displays the servings tag
- [`RecipeScaling.tsx`](src/components/RecipeScaling.tsx:21) - Uses servings for scaling calculations
- [`recipe.ts`](src/lib/types/recipe.ts:44) - Recipe type definition with servings field
- [`PORTION_SERVINGS_INTEGRATION.md`](PORTION_SERVINGS_INTEGRATION.md) - Documentation on how servings work

---

**Made with Bob** 🤖