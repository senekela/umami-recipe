# Add OpenRouter API Key to Vercel

## Quick Setup (2 minutes)

Your code is already configured to read the OpenRouter API key from environment variables. You just need to add it to Vercel:

### Step 1: Get Your API Key

1. Check your local `.env.local` file for the API key
2. Or get a new one from [openrouter.ai/keys](https://openrouter.ai/keys)

### Step 2: Add to Vercel Environment Variables

1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Select your project
3. Click **Settings** → **Environment Variables**
4. Click **Add New**
5. Enter:
   - **Key**: `VITE_OPENROUTER_KEY`
   - **Value**: Your OpenRouter API key (starts with `sk-or-v1-...`)
   - **Environments**: Check all three boxes (Production, Preview, Development)
6. Click **Save**

### Step 3: Redeploy

After adding the environment variable:

**Option A: Redeploy from Dashboard**
1. Go to **Deployments** tab
2. Click (...) on the latest deployment
3. Click **Redeploy**

**Option B: Push a commit**
```bash
git commit --allow-empty -m "Trigger redeploy with env vars"
git push
```

### Step 4: Verify

After redeployment (2-3 minutes):
1. Visit your Vercel URL
2. Sign in
3. Go to Import → From Photo
4. Upload a recipe photo
5. Check browser console (F12) - the warning should be gone
6. AI parsing should work automatically

## How It Works

The code in `src/pages/Import.tsx` reads the environment variable:
```typescript
const openRouterKey = import.meta.env.VITE_OPENROUTER_KEY || ''
```

Vite automatically exposes environment variables prefixed with `VITE_` to the client-side code. When you add `VITE_OPENROUTER_KEY` in Vercel, it becomes available as `import.meta.env.VITE_OPENROUTER_KEY` in your deployed app.

## Troubleshooting

**Still seeing "API key not configured"?**
1. Verify the variable name is exactly `VITE_OPENROUTER_KEY` (case-sensitive)
2. Make sure you redeployed after adding the variable
3. Check browser console for the actual error message
4. Verify the API key is valid at [openrouter.ai/keys](https://openrouter.ai/keys)

**API calls failing?**
1. Check OpenRouter status: [status.openrouter.ai](https://status.openrouter.ai)
2. Verify you haven't exceeded free tier limits
3. Check Vercel function logs for detailed errors

## Security Note

Environment variables with the `VITE_` prefix are exposed to the browser. This is intentional - OpenRouter API keys are designed for client-side use with built-in rate limiting and domain restrictions.

To add extra security, configure allowed domains in your OpenRouter dashboard.

---

**Time required**: 2 minutes  
**Cost**: Free (within OpenRouter free tier)