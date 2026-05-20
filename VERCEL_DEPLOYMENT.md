# Deploy Umami Recipe App to Vercel (Free)

This guide will help you deploy your Umami Recipe app to Vercel's free tier in under 10 minutes.

## Prerequisites

✅ Your Supabase project is already set up and running  
✅ Edge Functions are deployed to Supabase  
✅ Your code is ready to deploy

## What You'll Get (Free Tier)

- ✅ Unlimited bandwidth
- ✅ Automatic HTTPS
- ✅ Custom domain support
- ✅ Automatic deployments from GitHub
- ✅ Preview deployments for pull requests
- ✅ Global CDN (fast worldwide)

## Step-by-Step Deployment

### Step 1: Push Your Code to GitHub

If you haven't already, push your code to GitHub:

```bash
# Initialize git (if not already done)
git init

# Add all files
git add .

# Commit
git commit -m "Initial commit - Ready for Vercel deployment"

# Create a new repository on GitHub, then:
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git branch -M main
git push -u origin main
```

### Step 2: Sign Up for Vercel

1. Go to [vercel.com](https://vercel.com)
2. Click **"Sign Up"**
3. Choose **"Continue with GitHub"** (recommended)
4. Authorize Vercel to access your GitHub account

### Step 3: Import Your Project

1. On the Vercel dashboard, click **"Add New..."** → **"Project"**
2. Find your repository in the list (search if needed)
3. Click **"Import"**

### Step 4: Configure Build Settings

Vercel will auto-detect your Vite project. Verify these settings:

- **Framework Preset**: Vite
- **Build Command**: `pnpm build` (or `npm run build`)
- **Output Directory**: `dist`
- **Install Command**: `pnpm install` (or `npm install`)

**Important**: Your app doesn't need environment variables because Supabase credentials are auto-injected via `/utils/supabase/info.tsx` from Figma Make.

### Step 5: Deploy

1. Click **"Deploy"**
2. Wait 2-3 minutes for the build to complete
3. You'll see a success screen with your live URL!

Your app will be live at: `https://your-project-name.vercel.app`

### Step 6: Configure Supabase Redirect URLs

After deployment, you need to add your Vercel URL to Supabase:

1. Go to your [Supabase Dashboard](https://supabase.com/dashboard)
2. Select your project
3. Go to **Authentication** → **URL Configuration**
4. Add your Vercel URL to **Redirect URLs**:
   ```
   https://your-project-name.vercel.app/**
   ```
5. Click **Save**

This allows magic link authentication to work on your deployed site.

## Automatic Deployments

Every time you push to GitHub:
- **Main branch** → Automatically deploys to production
- **Other branches** → Creates preview deployments

## Custom Domain (Optional)

To use your own domain:

1. Go to your project in Vercel
2. Click **"Settings"** → **"Domains"**
3. Add your domain (e.g., `recipes.yourdomain.com`)
4. Follow DNS configuration instructions
5. Vercel automatically provisions SSL certificate

## Testing Your Deployment

After deployment, test these features:

1. **Browse recipes** (no login required)
   - Visit your Vercel URL
   - Check that published recipes load

2. **Magic link login**
   - Click "Sign In"
   - Enter your email
   - Check your inbox for magic link
   - Click link → should redirect back and sign you in

3. **Import from URL**
   - Sign in
   - Go to Import page
   - Paste a recipe URL
   - Verify it creates a draft

4. **Create a recipe**
   - Create a new draft
   - Add ingredients and steps
   - Publish it
   - Verify it appears on home page

## Troubleshooting

### Build Fails

**Error**: `Command "pnpm" not found`
- **Fix**: Change build command to `npm run build` in Vercel settings

**Error**: `Module not found`
- **Fix**: Make sure all dependencies are in `package.json`
- Run `pnpm install` locally to verify

### Magic Link Not Working

**Error**: "Invalid redirect URL"
- **Fix**: Add your Vercel URL to Supabase redirect URLs (see Step 6)

### Import Features Not Working

**Error**: "Failed to fetch"
- **Fix**: Verify Edge Functions are deployed to Supabase
- Check Supabase function logs for errors

### Images Not Loading

**Error**: 404 on images
- **Fix**: Verify Storage buckets exist in Supabase
- Check RLS policies allow public read access

## Monitoring & Logs

View deployment logs and analytics:

1. Go to your project in Vercel
2. Click **"Deployments"** to see build logs
3. Click **"Analytics"** to see traffic (free tier includes basic analytics)

## Cost Breakdown

**Vercel Free Tier:**
- Bandwidth: Unlimited
- Build minutes: 6,000 minutes/month
- Deployments: Unlimited
- Team members: 1 (you)

**Supabase Free Tier:**
- Database: 500MB
- Storage: 1GB
- Edge Functions: 500K invocations/month
- Auth users: Unlimited

**Total monthly cost: $0** 🎉

## Updating Your App

To deploy updates:

```bash
# Make your changes
git add .
git commit -m "Your update message"
git push

# Vercel automatically deploys!
```

## Advanced: Environment Variables (If Needed Later)

If you need to add environment variables:

1. Go to Vercel project → **Settings** → **Environment Variables**
2. Add variables (e.g., `VITE_API_KEY`)
3. Redeploy for changes to take effect

**Note**: Your current app doesn't need this because Supabase credentials are handled by Figma Make.

## Next Steps

- ✅ Share your live URL with friends
- ✅ Add a custom domain
- ✅ Monitor usage in Vercel dashboard
- ✅ Set up preview deployments for testing

## Support

- **Vercel Docs**: [vercel.com/docs](https://vercel.com/docs)
- **Vercel Community**: [github.com/vercel/vercel/discussions](https://github.com/vercel/vercel/discussions)
- **Supabase Docs**: [supabase.com/docs](https://supabase.com/docs)

---

**Deployment time**: ~5 minutes  
**Difficulty**: Beginner-friendly  
**Cost**: Free forever (within limits)