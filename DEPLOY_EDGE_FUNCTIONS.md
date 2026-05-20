# Deploy Your Updated Edge Functions

Your ingredients and steps are empty because the updated Edge Function hasn't been deployed to Supabase yet.

## Quick Deploy (Recommended)

```bash
# Make sure you're logged in to Supabase CLI
supabase login

# Link your project (if not already linked)
supabase link --project-ref fadfplsbsvxxuwffqgxe

# Deploy the server function with the updated Python scraper integration
supabase functions deploy server

# Set the Python scraper URL as an environment variable
supabase secrets set PYTHON_SCRAPER_URL=https://umami-recipe.onrender.com
```

## What This Will Do:

1. ✅ Deploy your updated [`import-url.tsx`](supabase/functions/server/import-url.tsx:1) with Python scraper integration
2. ✅ Deploy the improved [`python-scraper-integration.tsx`](supabase/functions/server/python-scraper-integration.tsx:1) with French ingredient parsing
3. ✅ Set the Render URL as an environment variable

## After Deployment:

### Test the Edge Function:

```bash
curl -X POST https://fadfplsbsvxxuwffqgxe.supabase.co/functions/v1/make-server-b410369f/import-url \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -d '{"url": "https://www.marmiton.org/recettes/recette_pate-a-crepes_12372.aspx"}'
```

### Try Importing in Your App:

1. Go to your Import page
2. Enter: `https://www.marmiton.org/recettes/recette_pate-a-crepes_12372.aspx`
3. Click Import
4. You should now see:
   - ✅ 7 ingredients properly parsed (amount, unit, name)
   - ✅ 4 steps numbered and separated
   - ✅ Title, image, and metadata

## Troubleshooting:

### If `supabase` command not found:

Install Supabase CLI:
```bash
# macOS
brew install supabase/tap/supabase

# Or via npm
npm install -g supabase
```

### If deployment fails:

Check your Supabase project settings:
1. Go to https://supabase.com/dashboard/project/fadfplsbsvxxuwffqgxe
2. Settings → API
3. Verify your project reference ID

### If ingredients still empty after deployment:

1. Check Edge Function logs:
   ```bash
   supabase functions logs server
   ```

2. Or in Supabase Dashboard:
   - Go to Edge Functions
   - Click on "server"
   - View logs tab

## Alternative: Deploy via Supabase Dashboard

If CLI doesn't work:

1. Go to https://supabase.com/dashboard/project/fadfplsbsvxxuwffqgxe/functions
2. Click on your "server" function
3. Click "Deploy new version"
4. Upload your `supabase/functions/server` directory
5. Add environment variable:
   - Key: `PYTHON_SCRAPER_URL`
   - Value: `https://umami-recipe.onrender.com`

---

**Once deployed, your recipe imports will work perfectly with full ingredient and step parsing!** 🎉