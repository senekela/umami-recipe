# Configure OpenRouter API Key for Vercel Deployment

## Overview

To enable AI-powered recipe parsing from photos in your deployed Vercel app, you need to add the OpenRouter API key as an environment variable.

## Steps to Configure

### 1. Get Your OpenRouter API Key

Your API key is already configured in `.env.local`. To find it:
```bash
cat .env.local
```

Copy the value that starts with `sk-or-v1-...`

### 2. Add to Vercel

1. Go to your Vercel dashboard: [vercel.com/dashboard](https://vercel.com/dashboard)
2. Select your project
3. Click **"Settings"** in the top navigation
4. Click **"Environment Variables"** in the left sidebar
5. Add a new environment variable:
   - **Key**: `VITE_OPENROUTER_KEY`
   - **Value**: Paste your API key from `.env.local` (starts with `sk-or-v1-...`)
   - **Environments**: Check all three boxes:
     - ✅ Production
     - ✅ Preview
     - ✅ Development
6. Click **"Save"**

### 3. Redeploy

After adding the environment variable, you need to trigger a new deployment:

**Option A: Redeploy from Vercel Dashboard**
1. Go to **"Deployments"** tab
2. Click the three dots (...) on the latest deployment
3. Click **"Redeploy"**
4. Confirm the redeployment

**Option B: Push a new commit**
```bash
git commit --allow-empty -m "Add OpenRouter API key"
git push
```

### 4. Verify

After redeployment completes (2-3 minutes):

1. Visit your Vercel URL
2. Sign in to your account
3. Go to **Import** → **From Photo** tab
4. Upload a recipe photo
5. The console should no longer show "OpenRouter API key not configured"
6. AI parsing should work automatically after OCR extraction

## What This Enables

With the OpenRouter API key configured:

- ✅ **Better recipe parsing**: AI intelligently structures OCR text into title, ingredients, and steps
- ✅ **Error correction**: Handles common OCR mistakes (e.g., "I cup" → "1 cup")
- ✅ **Smart extraction**: Identifies recipe sections even without clear headers
- ✅ **Tag generation**: Automatically suggests relevant tags (dessert, quick, vegetarian, etc.)

## Free Tier Limits

OpenRouter offers free tier access to models:
- **nvidia/nemotron-3-ultra-550b-a55b:free** (primary)
- **google/gemma-4-31b-it:free** (fallback)

Check your usage at: [openrouter.ai/activity](https://openrouter.ai/activity)

## Troubleshooting

### Environment variable not working?

1. **Check spelling**: Must be exactly `VITE_OPENROUTER_KEY`
2. **Verify value**: Should start with `sk-or-v1-`
3. **Redeploy**: Environment variables only apply to new deployments
4. **Check logs**: Go to Vercel → Deployments → Click deployment → View Function Logs

### Still seeing "API key not configured"?

1. Open browser console (F12) on your deployed site
2. Check for the warning message
3. Verify the environment variable is loaded:
   ```javascript
   console.log(import.meta.env.VITE_OPENROUTER_KEY)
   ```
4. If it shows `undefined`, the environment variable wasn't properly set in Vercel

### API calls failing?

1. Check OpenRouter status: [status.openrouter.ai](https://status.openrouter.ai)
2. Verify your API key is valid at [openrouter.ai/keys](https://openrouter.ai/keys)
3. Check if you've exceeded free tier limits

## Security Note

The `VITE_` prefix means this variable is exposed to the browser. This is intentional for client-side API calls. OpenRouter API keys are designed to be used client-side with rate limiting and domain restrictions.

To add domain restrictions:
1. Go to [openrouter.ai/keys](https://openrouter.ai/keys)
2. Click on your API key
3. Add your Vercel domain to allowed origins

---

**Estimated time**: 5 minutes  
**Cost**: Free (within OpenRouter free tier)