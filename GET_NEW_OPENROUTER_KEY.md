# Get a New OpenRouter API Key

## The Problem

Your current API key is returning a 401 "User not found" error, which means:
- The API key is invalid or expired
- The OpenRouter account associated with it may have been deleted
- The key may have been revoked

## Solution: Get a New Free API Key

### Step 1: Go to OpenRouter
Visit: **https://openrouter.ai/keys**

### Step 2: Sign Up or Sign In
- If you don't have an account: Click **"Sign Up"** (it's free!)
- If you have an account: Click **"Sign In"**
- You can sign in with:
  - Google account
  - GitHub account
  - Email

### Step 3: Create a New API Key
1. Once logged in, you'll see the API Keys page
2. Click **"Create Key"** or **"New Key"**
3. Give it a name (e.g., "Umami Recipe App")
4. Click **"Create"**
5. **IMPORTANT**: Copy the key immediately - it starts with `sk-or-v1-`

### Step 4: Update Your Local Environment
Replace the old key in `.env.local`:

```bash
# Open the file
nano .env.local

# Or use VS Code
code .env.local
```

Replace the value with your new key:
```
VITE_OPENROUTER_KEY=sk-or-v1-YOUR_NEW_KEY_HERE
```

Save the file.

### Step 5: Restart Your Dev Server
The dev server should auto-restart, but if not:
```bash
# Stop the current server (Ctrl+C)
# Then restart:
npm run dev
```

### Step 6: Update Vercel
1. Go to **https://vercel.com/dashboard**
2. Select your project
3. Go to **Settings** → **Environment Variables**
4. Find `VITE_OPENROUTER_KEY`
5. Click **"Edit"** (pencil icon)
6. Replace with your new API key
7. Click **"Save"**
8. Go to **Deployments** → Click (...) → **"Redeploy"**

## Free Tier Limits

OpenRouter's free tier includes:
- **nvidia/nemotron-3-ultra-550b-a55b:free** - Unlimited requests
- **google/gemma-4-31b-it:free** - Unlimited requests
- Rate limits apply (reasonable usage)

## Verify Your New Key Works

### Test Locally:
1. Go to http://localhost:5174/
2. Sign in
3. Go to Import → From Photo
4. Upload a recipe photo
5. Check browser console (F12)
6. Should see: "✅ Successfully parsed recipe with nvidia/nemotron..."

### Test Online (after Vercel update):
1. Visit your Vercel URL
2. Same steps as above
3. AI parsing should work without errors

## Troubleshooting

**Can't create an account?**
- Try a different browser
- Use incognito/private mode
- Try signing up with Google or GitHub instead of email

**Key still not working?**
- Make sure you copied the entire key (starts with `sk-or-v1-`)
- Check for extra spaces before/after the key
- Verify the key is active at https://openrouter.ai/keys

**Rate limit errors?**
- Free tier has reasonable rate limits
- Wait a few minutes and try again
- Consider upgrading to paid tier if needed (very cheap)

## Alternative: Use a Different Free Model

If you prefer not to create a new account, you can modify the code to use different free AI models. Let me know if you want to explore this option.

---

**Time required**: 5 minutes  
**Cost**: Free forever (within usage limits)