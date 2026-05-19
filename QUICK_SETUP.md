# Quick Setup Guide - 5 Minutes

Your Supabase credentials are already configured! Just follow these steps:

## Step 1: Install Dependencies (1 min)

```bash
pnpm install
```

## Step 2: Set Up Supabase Database (2 min)

1. Go to your Supabase dashboard: https://supabase.com/dashboard/project/fadfplsbsvxxuwffqgxe
2. Click **SQL Editor** in the left sidebar
3. Copy and paste the SQL from [`SUPABASE_SETUP.md`](SUPABASE_SETUP.md:1) sections 1-2
4. Run each SQL block (click "Run" button)

**Quick Copy-Paste:**
- Section 1: Creates `profiles` and `recipes` tables
- Section 2: Sets up security policies

## Step 3: Create Storage Buckets (1 min)

1. Go to **Storage** in your Supabase dashboard
2. Click **New bucket**
3. Create two buckets:
   - `recipe-images` (make it **public**)
   - `ocr-uploads` (keep it **private**)
4. Run the storage policies from [`SUPABASE_SETUP.md`](SUPABASE_SETUP.md:131) section 3

## Step 4: Enable Authentication (1 min)

1. Go to **Authentication → Settings**
2. Enable **Magic Link** (Email OTP)
3. Add redirect URL: `http://localhost:5173/**`

## Step 5: Start Development Server

```bash
pnpm dev
```

Visit http://localhost:5173 and you're done! 🎉

---

## Already Have Data?

If you've already set up the database, just run:

```bash
pnpm install
pnpm dev
```

## Troubleshooting

### "Command not found: pnpm"
Install pnpm first:
```bash
npm install -g pnpm
```

### "Cannot find module 'react'"
Run the install command:
```bash
pnpm install
```

### Database errors
Make sure you ran all SQL commands from [`SUPABASE_SETUP.md`](SUPABASE_SETUP.md:1)

---

## What's Already Configured

✅ Supabase connection (project ID and API key)  
✅ TypeScript configuration  
✅ React and all dependencies  
✅ Enhanced URL import with recipe-scrapers  
✅ Error boundaries and code quality tools  

## What You Need to Do

☐ Run `pnpm install`  
☐ Set up database tables (copy-paste SQL)  
☐ Create storage buckets  
☐ Enable magic link auth  
☐ Run `pnpm dev`  

That's it! The app is ready to use.