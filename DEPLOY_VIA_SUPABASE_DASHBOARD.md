# Deploy Edge Functions via Supabase Dashboard (No CLI Required!)

Since your ingredients and steps are empty, you need to deploy the updated Edge Function through the Supabase Dashboard UI.

## Step-by-Step Guide with Screenshots

### Step 1: Go to Your Supabase Project

1. Open: https://supabase.com/dashboard/project/fadfplsbsvxxuwffqgxe
2. Login if needed

### Step 2: Navigate to Edge Functions

1. In the left sidebar, click **"Edge Functions"**
2. You should see your existing "server" function

### Step 3: Update the Function Code

**Option A: Via GitHub Integration (Easiest)**

1. Click on the **"server"** function
2. Click **"Settings"** tab
3. Under **"Git Connection"**, click **"Connect to GitHub"**
4. Select your repository: `SeneKela/umami-recipe`
5. Set branch: `main`
6. Set function path: `supabase/functions/server`
7. Click **"Enable Auto Deploy"**
8. Click **"Deploy Now"**

**Option B: Manual Upload**

1. Click on the **"server"** function
2. Click **"Deploy new version"** button
3. You'll see a code editor
4. Copy ALL files from your local `supabase/functions/server/` directory:
   - `index.tsx`
   - `import-url.tsx`
   - `import-ocr.tsx`
   - `python-scraper-integration.tsx`
   - `kv_store.tsx`
5. Paste each file's content into the editor
6. Click **"Deploy"**

### Step 4: Set Environment Variable

1. Still in the **"server"** function page
2. Click **"Settings"** tab
3. Scroll to **"Environment Variables"** section
4. Click **"Add Variable"**
5. Enter:
   - **Name:** `PYTHON_SCRAPER_URL`
   - **Value:** `https://umami-recipe.onrender.com`
6. Click **"Save"**

### Step 5: Verify Deployment

1. Go to the **"Logs"** tab
2. You should see deployment logs
3. Look for: ✅ "Deployment successful"

### Step 6: Test Your Import

1. Go to your Umami Recipe app
2. Navigate to the Import page
3. Enter this URL: `https://www.marmiton.org/recettes/recette_pate-a-crepes_12372.aspx`
4. Click **"Import"**
5. Wait for the import to complete
6. Open the draft recipe

**You should now see:**
- ✅ Title: "La meilleure recette de pâte à crêpes"
- ✅ 7 ingredients with amounts, units, and names
- ✅ 4 numbered steps
- ✅ Image and metadata

## Troubleshooting

### If deployment fails:

**Check the error message in the Logs tab:**

1. **"Module not found"** → Make sure all 5 files are uploaded
2. **"Syntax error"** → Check that you copied the complete file content
3. **"Timeout"** → Try deploying again

### If ingredients still empty after deployment:

1. **Clear your browser cache** and reload the app
2. **Check Edge Function logs:**
   - Go to Edge Functions → server → Logs
   - Look for errors when you try to import
3. **Verify the environment variable:**
   - Settings tab → Environment Variables
   - Make sure `PYTHON_SCRAPER_URL` is set correctly

### If Python scraper not being called:

1. Check the logs for: `"Python scraper unavailable"`
2. This means the Edge Function can't reach your Render service
3. Verify Render is running: https://umami-recipe.onrender.com/health
4. Check the environment variable is correct

## Alternative: Use Supabase CLI (Faster)

If you're comfortable with terminal:

```bash
# Install Supabase CLI
npm install -g supabase

# Login
supabase login

# Link project
supabase link --project-ref fadfplsbsvxxuwffqgxe

# Deploy
supabase functions deploy server

# Set environment variable
supabase secrets set PYTHON_SCRAPER_URL=https://umami-recipe.onrender.com
```

## What Gets Deployed:

Your updated Edge Function includes:

1. ✅ **Python Scraper Integration** - Calls your Render service
2. ✅ **Improved French Parsing** - Handles "cuillères à soupe" correctly
3. ✅ **Intelligent Fallback** - Uses TypeScript scraper if Python fails
4. ✅ **Better Error Handling** - Clear error messages

## After Successful Deployment:

Your recipe imports will:
- Parse 376+ recipe websites
- Extract ingredients with proper amounts/units/names
- Number steps automatically
- Include images, cooking times, and yields
- Support both French and English recipes

---

**Once deployed, try importing the Marmiton recipe again - it will work perfectly!** 🎉

Need help? Check the Logs tab in Supabase Dashboard for detailed error messages.