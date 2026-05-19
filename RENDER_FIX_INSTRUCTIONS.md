# Fix Render.com Deployment - Step by Step

## Problem Identified ✅

Your deployment is failing with:
```
ModuleNotFoundError: No module named 'app'
```

**Root Cause:** The start command is running from the wrong directory. Gunicorn can't find `app.py` because it's inside the `python-scraper` folder.

---

## Solution 1: Automatic Fix (Recommended)

I've updated your [`render.yaml`](python-scraper/render.yaml:1) file with the correct configuration. The key change is adding `rootDir: python-scraper` which tells Render to run commands from inside that directory.

### Deploy the Fix:

1. **Commit and push the updated render.yaml:**
   ```bash
   git add python-scraper/render.yaml
   git commit -m "Fix Render deployment - set correct root directory"
   git push
   ```

2. **Render will auto-deploy** (if auto-deploy is enabled)
   - Or manually trigger deploy from the Render dashboard

3. **Wait 2-3 minutes** for the build to complete

4. **Test your deployment:**
   ```bash
   curl https://umami-recipe.onrender.com/health
   ```

---

## Solution 2: Manual Dashboard Fix (Backup Method)

If the automatic fix doesn't work, update settings manually:

### Step-by-Step Dashboard Instructions:

1. **Go to Render Dashboard**
   - Visit: https://dashboard.render.com
   - Find your `umami-recipe` service
   - Click on it

2. **Update Settings**
   - Click **"Settings"** in the left sidebar
   - Scroll to **"Build & Deploy"** section

3. **Change Root Directory**
   - Find **"Root Directory"** field
   - Change from: (empty or `/`)
   - Change to: `python-scraper`
   - Click **"Save Changes"**

4. **Verify Build Command**
   - Should be: `pip install -r requirements.txt`
   - (The `cd python-scraper &&` is no longer needed)

5. **Verify Start Command**
   - Should be: `gunicorn -w 4 -b 0.0.0.0:$PORT app:app`
   - (The `cd python-scraper &&` is no longer needed)

6. **Manual Deploy**
   - Click **"Manual Deploy"** button at top
   - Select **"Deploy latest commit"**
   - Click **"Deploy"**

7. **Monitor Logs**
   - Click **"Logs"** tab
   - Watch for successful startup
   - Should see: `Listening at: http://0.0.0.0:XXXX`

---

## Verification

Once deployed successfully, test these endpoints:

### 1. Health Check
```bash
curl https://umami-recipe.onrender.com/health
```

**Expected Response:**
```json
{"status": "healthy", "service": "recipe-scraper"}
```

### 2. Supported Sites
```bash
curl https://umami-recipe.onrender.com/supported-sites
```

**Expected:** List of 200+ supported recipe websites

### 3. Test Scrape
```bash
curl -X POST https://umami-recipe.onrender.com/scrape \
  -H "Content-Type: application/json" \
  -d '{"url": "https://www.allrecipes.com/recipe/158968/spinach-and-feta-turkey-burgers/"}'
```

**Expected:** Recipe data in JSON format

---

## What Changed in render.yaml

**Before (Incorrect):**
```yaml
buildCommand: cd python-scraper && pip install -r requirements.txt
startCommand: cd python-scraper && gunicorn -w 4 -b 0.0.0.0:$PORT app:app
```

**After (Correct):**
```yaml
rootDir: python-scraper
buildCommand: pip install -r requirements.txt
startCommand: gunicorn -w 4 -b 0.0.0.0:$PORT app:app
```

The `rootDir` setting tells Render to execute all commands from inside the `python-scraper` directory, so we don't need the `cd` prefix anymore.

---

## Troubleshooting

### If deployment still fails:

1. **Check Logs in Render Dashboard**
   - Look for any new error messages
   - Common issues: missing dependencies, port binding errors

2. **Verify File Structure**
   ```
   python-scraper/
   ├── app.py          ← Must exist
   ├── requirements.txt ← Must exist
   └── render.yaml     ← Updated file
   ```

3. **Check Python Version**
   - Render is using Python 3.14.3 (from logs)
   - render.yaml specifies 3.11.0
   - This should be fine, but if issues persist, remove the PYTHON_VERSION env var

4. **Cold Start Issue**
   - First request after 15 min inactivity takes ~30 seconds
   - Set up a keep-alive ping (see main deployment docs)

---

## Next Steps After Fix

1. ✅ **Verify deployment is live**
2. ✅ **Test all endpoints**
3. ✅ **Set up keep-alive ping** (optional, prevents cold starts)
4. ✅ **Integrate with your Umami Recipe app**

---

## Need Help?

- **Render Docs:** https://render.com/docs/troubleshooting-deploys
- **Render Community:** https://community.render.com
- **Check Logs:** Always check the Logs tab in Render dashboard for detailed error messages

---

**Status:** Ready to deploy! 🚀

Push the updated render.yaml file to trigger the fix.