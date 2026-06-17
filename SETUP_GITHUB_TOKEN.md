# Setup GitHub Token for AI Verification

Your logs show: **"GitHub Models API key not configured, skipping verification"**

This means the AI model is NOT being called. Here's how to fix it:

## Quick Setup (5 minutes)

### Step 1: Get a GitHub Token

1. Go to https://github.com/settings/tokens
2. Click **"Generate new token"** → **"Generate new token (classic)"**
3. Give it a name: `Umami Recipe AI Verification`
4. Select expiration: **No expiration** (or 1 year)
5. Select scopes: **ONLY check `read:user`** (nothing else needed)
6. Click **"Generate token"**
7. **COPY THE TOKEN** (you won't see it again!)
   - It looks like: `ghp_xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

### Step 2: Add Token to Supabase

#### Option A: Via Supabase Dashboard (Easiest)

1. Go to https://supabase.com/dashboard
2. Select your project: **fadfplsbsvxxuwffqgxe**
3. Navigate to **Settings** → **Edge Functions** → **Secrets**
4. Click **"Add new secret"**
5. Name: `GITHUB_MODELS_TOKEN`
6. Value: Paste your token (starts with `ghp_`)
7. Click **"Save"**

#### Option B: Via Supabase CLI (If installed)

```bash
supabase secrets set GITHUB_MODELS_TOKEN=ghp_your_token_here
```

### Step 3: Redeploy the Function

The function needs to be redeployed to pick up the new secret:

#### Via Dashboard:
1. Go to **Edge Functions** → **import-url**
2. Click **"Deploy"** or **"Redeploy"**
3. Wait for deployment to complete

#### Via CLI (if installed):
```bash
supabase functions deploy import-url
```

### Step 4: Test It

1. Import a recipe via URL
2. Check the logs in **Edge Functions** → **Logs**
3. You should now see:
   ```
   🤖 AI VERIFICATION STARTED
   📊 Input: X ingredients, Y steps
   🔄 Calling GitHub Models API (gpt-4o-mini)...
   ✅ AI VERIFICATION COMPLETED
   ```

## Verification Checklist

- [ ] Generated GitHub token with `read:user` scope
- [ ] Added `GITHUB_MODELS_TOKEN` secret to Supabase
- [ ] Redeployed the `import-url` function
- [ ] Tested recipe import
- [ ] Logs show "🤖 AI VERIFICATION STARTED"
- [ ] No more "API key not configured" warning

## Troubleshooting

### "Still seeing 'API key not configured'"

**Solution**: Make sure you redeployed the function after adding the secret. Secrets are only loaded when the function is deployed.

### "GitHub Models API error: 401"

**Solution**: Your token is invalid or expired. Generate a new one and update the secret.

### "GitHub Models API error: 429"

**Solution**: Rate limit exceeded (60 requests/hour for free tier). Wait an hour or upgrade to GitHub Pro.

## What Happens Without the Token?

Without `GITHUB_MODELS_TOKEN`, the system uses **client-side filtering only**:
- ✅ Still works and cleans data
- ✅ Removes links, navigation, social media
- ❌ Less intelligent cleaning (rule-based only)
- ❌ No AI-powered context understanding
- ❌ Lower confidence scores

## What Happens With the Token?

With `GITHUB_MODELS_TOKEN`, you get **AI-powered verification**:
- ✅ Intelligent context-aware cleaning
- ✅ Better detection of irrelevant content
- ✅ Higher quality results
- ✅ Confidence scores from AI
- ✅ Detailed cleaning reports
- ✅ Free (60 requests/hour)

## Cost

**GitHub Models is FREE** with these limits:
- 60 requests per hour
- 15 requests per minute
- No credit card required

Perfect for recipe imports!

## Security Note

The `GITHUB_MODELS_TOKEN` with `read:user` scope can only:
- ✅ Read your public GitHub profile
- ✅ Access GitHub Models API
- ❌ Cannot access your repositories
- ❌ Cannot modify anything
- ❌ Cannot access private data

It's safe to use for this purpose.

## Next Steps

1. **Generate token** at https://github.com/settings/tokens
2. **Add to Supabase** via Dashboard → Settings → Edge Functions → Secrets
3. **Redeploy function** via Dashboard → Edge Functions → import-url → Deploy
4. **Test import** and check logs for 🤖 emoji

That's it! Your AI verification will be active.