# 🚀 Quick Start: Deploy to Vercel in 5 Minutes

Your app is **ready to deploy**! Follow these simple steps.

## ✅ Pre-Deployment Checklist

- [x] Build tested successfully (447KB bundle, optimized)
- [x] Vercel configuration created ([`vercel.json`](vercel.json))
- [x] Supabase backend is running
- [x] Edge Functions deployed to Supabase

## 🎯 Deployment Steps

### 1. Push to GitHub (2 minutes)

```bash
# If you haven't initialized git yet:
git init
git add .
git commit -m "Ready for Vercel deployment"

# Create a new repository on GitHub.com, then:
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git branch -M main
git push -u origin main
```

### 2. Deploy to Vercel (3 minutes)

1. **Sign up**: Go to [vercel.com](https://vercel.com) → Click "Sign Up" → Choose "Continue with GitHub"

2. **Import project**: 
   - Click "Add New..." → "Project"
   - Select your repository
   - Click "Import"

3. **Configure** (auto-detected):
   - Framework: Vite ✓
   - Build Command: `pnpm build` ✓
   - Output Directory: `dist` ✓

4. **Deploy**: Click "Deploy" button

5. **Wait**: 2-3 minutes for build to complete

6. **Done!** Your app is live at `https://your-project-name.vercel.app`

### 3. Configure Supabase (1 minute)

After deployment, add your Vercel URL to Supabase:

1. Go to [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project → **Authentication** → **URL Configuration**
3. Add to **Redirect URLs**:
   ```
   https://your-project-name.vercel.app/**
   ```
4. Click **Save**

**Why?** This allows magic link authentication to work on your deployed site.

## 🎉 You're Live!

Your app is now deployed and accessible worldwide. Every push to GitHub will automatically deploy updates.

## 📊 What You Get (Free)

- ✅ Unlimited bandwidth
- ✅ Automatic HTTPS
- ✅ Global CDN
- ✅ Auto-deployments from GitHub
- ✅ Preview URLs for branches
- ✅ Custom domain support

## 🧪 Test Your Deployment

Visit your Vercel URL and test:

1. **Browse recipes** (no login) - Should load published recipes
2. **Sign in** - Enter email → Check inbox → Click magic link
3. **Import recipe** - Paste a recipe URL → Should create draft
4. **Create recipe** - Add ingredients/steps → Publish → Should appear on home

## 🐛 Troubleshooting

**Build fails?**
- Check the build logs in Vercel dashboard
- Verify all dependencies are in [`package.json`](package.json)

**Magic link doesn't work?**
- Make sure you added Vercel URL to Supabase redirect URLs (Step 3)

**Import features broken?**
- Verify Edge Functions are deployed in Supabase dashboard

## 📚 Full Documentation

For detailed instructions, see [`VERCEL_DEPLOYMENT.md`](VERCEL_DEPLOYMENT.md)

## 🔄 Deploy Updates

```bash
git add .
git commit -m "Your changes"
git push
# Vercel automatically deploys!
```

## 💰 Cost

**Total: $0/month** (within free tier limits)

- Vercel: Unlimited bandwidth, 6,000 build minutes/month
- Supabase: 500MB database, 1GB storage, 500K function calls/month

---

**Need help?** Check [`VERCEL_DEPLOYMENT.md`](VERCEL_DEPLOYMENT.md) for detailed troubleshooting.