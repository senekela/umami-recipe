# Deploy Recipe Scraper to Render.com - Step by Step

This guide will walk you through deploying your Python recipe scraper to Render.com's free tier.

## Why Render.com?

- ✅ **750 hours/month free** (enough for continuous operation)
- ✅ **No credit card required** for free tier
- ✅ **Auto-deploys** from GitHub
- ✅ **Free SSL** certificate
- ✅ **Easy setup** - 5 minutes
- ✅ **Reliable** and production-ready

## Prerequisites

- GitHub account
- Your code pushed to GitHub

## Step 1: Push Your Code to GitHub

If you haven't already:

```bash
# Initialize git (if not already done)
git init

# Add all files
git add .

# Commit
git commit -m "Add Python recipe scraper"

# Create a new repository on GitHub, then:
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
git branch -M main
git push -u origin main
```

## Step 2: Create Render Account

1. Go to [render.com](https://render.com)
2. Click **"Get Started"**
3. Sign up with GitHub (recommended) or email
4. Verify your email if needed

## Step 3: Create New Web Service

1. From your Render dashboard, click **"New +"** button
2. Select **"Web Service"**
3. Click **"Connect account"** to link your GitHub
4. Find and select your repository
5. Click **"Connect"**

## Step 4: Configure Your Service

Fill in the following settings:

### Basic Settings
- **Name:** `recipe-scraper` (or your preferred name)
- **Region:** Choose closest to you (e.g., Oregon, Frankfurt)
- **Branch:** `main` (or your default branch)
- **Root Directory:** Leave empty (we'll use cd in commands)

### Build Settings
- **Runtime:** `Python 3`
- **Build Command:**
  ```
  cd python-scraper && pip install -r requirements.txt
  ```
- **Start Command:**
  ```
  cd python-scraper && gunicorn -w 4 -b 0.0.0.0:$PORT app:app
  ```

### Instance Settings
- **Instance Type:** `Free`

### Advanced Settings (Optional)
- **Auto-Deploy:** `Yes` (recommended - auto-deploys on git push)

## Step 5: Add Environment Variables (Optional)

Click **"Advanced"** and add:

| Key | Value |
|-----|-------|
| `PYTHON_VERSION` | `3.11.0` |
| `FLASK_ENV` | `production` |

## Step 6: Deploy!

1. Click **"Create Web Service"**
2. Render will start building your app
3. Watch the logs - build takes 2-3 minutes
4. Once deployed, you'll see: ✅ **"Live"**

## Step 7: Get Your URL

Your API will be available at:
```
https://recipe-scraper-XXXX.onrender.com
```

Copy this URL - you'll need it for integration!

## Step 8: Test Your Deployment

### Test 1: Health Check
```bash
curl https://YOUR-APP.onrender.com/health
```

Expected response:
```json
{"status": "healthy", "service": "recipe-scraper"}
```

### Test 2: Scrape a Recipe
```bash
curl -X POST https://YOUR-APP.onrender.com/scrape \
  -H "Content-Type: application/json" \
  -d '{"url": "https://www.allrecipes.com/recipe/158968/spinach-and-feta-turkey-burgers/"}'
```

You should get recipe data back!

## Step 9: Integrate with Your App

### Option A: Update Supabase Edge Function

Edit [`supabase/functions/server/import-url.tsx`](../supabase/functions/server/import-url.tsx:1):

```typescript
const PYTHON_SCRAPER_URL = 'https://umami-recipe.onrender.com';

export async function handleUrlImport(url: string) {
  try {
    // Try Python scraper first
    const response = await fetch(`${PYTHON_SCRAPER_URL}/scrape`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
    });
    
    if (!response.ok) {
      // Fallback to existing TypeScript scraper
      return await handleUrlImportFallback(url);
    }
    
    const result = await response.json();
    
    if (result.success) {
      return { 
        data: transformPythonRecipe(result.data), 
        error: null 
      };
    }
    
    // Fallback on error
    return await handleUrlImportFallback(url);
  } catch (err) {
    console.error('Python scraper error:', err);
    return await handleUrlImportFallback(url);
  }
}

function transformPythonRecipe(data: any) {
  return {
    title: data.title,
    description: data.description,
    image_url: data.image,
    source_url: data.source_url,
    ingredients: data.ingredients.map((ing: string, idx: number) => ({
      amount: '',
      unit: '',
      name: ing,
      order: idx + 1
    })),
    steps: data.instructions.split(/\n+/).map((step: string, idx: number) => ({
      order: idx + 1,
      text: step.trim()
    })).filter((s: any) => s.text),
    tags: [data.category, data.cuisine].filter(Boolean),
    confidence: data.confidence,
    yields: data.yields,
    total_time: data.total_time,
    prep_time: data.prep_time,
    cook_time: data.cook_time,
  };
}
```

### Option B: Direct Frontend Integration

Create [`src/lib/pythonScraper.ts`](../src/lib/pythonScraper.ts):

```typescript
const PYTHON_SCRAPER_URL = 'https://YOUR-APP.onrender.com';

export async function scrapePythonRecipe(url: string) {
  const response = await fetch(`${PYTHON_SCRAPER_URL}/scrape`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url }),
  });
  
  const result = await response.json();
  
  if (!result.success) {
    throw new Error(result.error || 'Failed to scrape recipe');
  }
  
  return result.data;
}
```

## Step 10: Handle Cold Starts

Render's free tier spins down after 15 minutes of inactivity. First request after sleep takes ~30 seconds.

### Solution: Keep-Alive Ping

Use a free service like [cron-job.org](https://cron-job.org):

1. Create account at cron-job.org
2. Create new cron job:
   - **URL:** `https://YOUR-APP.onrender.com/health`
   - **Schedule:** Every 14 minutes
   - **Method:** GET

This keeps your service warm!

## Monitoring Your Deployment

### View Logs
1. Go to your service in Render dashboard
2. Click **"Logs"** tab
3. See real-time logs

### Check Metrics
1. Click **"Metrics"** tab
2. View:
   - CPU usage
   - Memory usage
   - Request count
   - Response times

### Set Up Alerts
1. Click **"Settings"**
2. Scroll to **"Notifications"**
3. Add email for deploy notifications

## Updating Your Deployment

### Automatic Updates (Recommended)
Just push to GitHub:
```bash
git add .
git commit -m "Update recipe scraper"
git push
```

Render auto-deploys in ~2 minutes!

### Manual Deploy
1. Go to your service
2. Click **"Manual Deploy"**
3. Select branch
4. Click **"Deploy"**

## Troubleshooting

### "Application failed to start"
**Check logs** in Render dashboard. Common issues:
- Missing dependencies in `requirements.txt`
- Wrong start command
- Python version mismatch

**Solution:** Verify your `render.yaml` matches:
```yaml
services:
  - type: web
    name: recipe-scraper
    runtime: python
    region: oregon
    plan: free
    buildCommand: cd python-scraper && pip install -r requirements.txt
    startCommand: cd python-scraper && gunicorn -w 4 -b 0.0.0.0:$PORT app:app
    envVars:
      - key: PYTHON_VERSION
        value: 3.11.0
      - key: FLASK_ENV
        value: production
```

### "Port binding error"
**Cause:** Not using `$PORT` environment variable

**Solution:** Already fixed in [`app.py`](app.py:234):
```python
port = int(os.environ.get('PORT', 5001))
```

### "Cold start too slow"
**Cause:** Free tier spins down after inactivity

**Solutions:**
1. Set up keep-alive ping (see Step 10)
2. Upgrade to paid tier ($7/month for always-on)
3. Accept 30s first-request delay

### "CORS errors"
**Cause:** Frontend can't access API

**Solution:** Already enabled in [`app.py`](app.py:20):
```python
CORS(app)  # Enable CORS for all routes
```

### "Recipe not scraping"
**Test directly:**
```bash
curl -X POST https://YOUR-APP.onrender.com/scrape \
  -H "Content-Type: application/json" \
  -d '{"url": "YOUR_RECIPE_URL"}'
```

Check if site is supported:
```bash
curl https://YOUR-APP.onrender.com/supported-sites
```

## Cost & Limits

### Free Tier Includes:
- ✅ 750 hours/month (enough for 24/7 with keep-alive)
- ✅ 512 MB RAM
- ✅ 0.1 CPU
- ✅ Automatic SSL
- ✅ Custom domains
- ✅ Unlimited bandwidth

### Limitations:
- ⚠️ Spins down after 15 min inactivity
- ⚠️ 30s cold start time
- ⚠️ Shared resources

### Upgrade Options:
- **Starter:** $7/month - Always on, 512 MB RAM
- **Standard:** $25/month - 2 GB RAM, better performance

## Next Steps

1. ✅ Deploy to Render
2. ✅ Test your API
3. ✅ Set up keep-alive ping
4. ✅ Integrate with your app
5. ✅ Monitor performance
6. ✅ Enjoy 200+ recipe sites support!

## Support

- **Render Docs:** [render.com/docs](https://render.com/docs)
- **Render Community:** [community.render.com](https://community.render.com)
- **API Issues:** Check logs in Render dashboard
- **Integration Help:** See [`PYTHON_SCRAPER_INTEGRATION.md`](../PYTHON_SCRAPER_INTEGRATION.md)

## Quick Reference

| What | Where |
|------|-------|
| Dashboard | [dashboard.render.com](https://dashboard.render.com) |
| Logs | Service → Logs tab |
| Metrics | Service → Metrics tab |
| Settings | Service → Settings tab |
| Redeploy | Service → Manual Deploy |

---

**You're all set!** 🎉

Your recipe scraper is now live and ready to scrape 200+ recipe websites with 95%+ accuracy!