# Recipe Homepage Diagnosis

## Issue
Published recipes are not showing on the homepage (showing 0 recipes).

## Potential Causes

### 1. No Published Recipes in Database
Run this SQL in Supabase SQL Editor:
```sql
SELECT COUNT(*) as total_recipes, 
       COUNT(CASE WHEN status = 'published' THEN 1 END) as published_recipes,
       COUNT(CASE WHEN status = 'draft' THEN 1 END) as draft_recipes
FROM recipes;
```

### 2. Missing Profile Records
Run this SQL:
```sql
SELECT r.id, r.title, r.status, r.owner_id, p.id as profile_id, p.nickname
FROM recipes r
LEFT JOIN profiles p ON r.owner_id = p.id
WHERE r.status = 'published';
```

### 3. RLS Policy Issue
The query might be blocked by Row Level Security. Test with:
```sql
-- Check if RLS is enabled
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public' AND tablename IN ('recipes', 'profiles');

-- Check policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE schemaname = 'public' AND tablename IN ('recipes', 'profiles');
```

## Quick Fix to Test

Try this temporary fix in your browser console while on the homepage:
```javascript
// Check what the actual query returns
const { data, error } = await supabase
  .from('recipes')
  .select('*, profiles!owner_id(nickname)')
  .eq('status', 'published')
  .order('published_at', { ascending: false });

console.log('Query result:', { data, error });
```

## Next Steps
Please run the SQL queries above and share the results.
