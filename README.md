# Umami — Recipe Web App

A mobile-first recipe web app built with React, Tailwind CSS, and Supabase. Browse published recipes anonymously, or sign in to import, create, edit, and share your own recipes.

## Features

- 📱 **Mobile-first design** — Optimized for touch interfaces with bottom navigation
- 🔐 **Magic link authentication** — No passwords, just email
- 🔍 **Search & filter** — Full-text search with tag filtering
- 📸 **Photo import with OCR** — Extract recipes from cookbook photos
- 🔗 **URL import** — Parse recipes from any website
- ✏️ **Draft editor** — Auto-save, publish, and share drafts
- 🍴 **Recipe detail** — Beautiful recipe display with checkable ingredients
- 🔒 **Row-level security** — Supabase RLS enforces all permissions

## Tech Stack

- **Frontend**: React 18, React Router 7, Tailwind CSS v4
- **Backend**: Supabase (Auth, Database, Storage, Edge Functions)
- **OCR**: Tesseract.js
- **Parsing**: Cheerio (for HTML/JSON-LD extraction)

## Prerequisites

Before you begin, make sure you:

1. ✅ Connected your Supabase project via the Make settings
2. ✅ Completed the database setup (see `SUPABASE_SETUP.md`)

## Getting Started

### 1. Database Setup

Follow all instructions in `SUPABASE_SETUP.md`:

- Run the SQL scripts to create tables
- Enable Row Level Security policies
- Create Storage buckets (`recipe-images` and `ocr-uploads`)
- Configure authentication (enable Magic Link, disable password auth)

### 2. Deploy the Edge Function

The Supabase server with import endpoints is already configured in `/supabase/functions/server/`. To deploy it:

1. Go to your Figma Make settings
2. Navigate to the Supabase section
3. Click "Deploy Edge Function"

This will deploy the server with:
- `/make-server-b410369f/import-url` — URL scraping endpoint
- `/make-server-b410369f/import-ocr` — OCR processing endpoint

### 3. Test the App

The app is now ready! Here's what you can do:

**Without signing in:**
- Browse published recipes on the home page
- Search and filter by tags
- View recipe details

**After signing in (magic link):**
- Import recipes from URLs
- Import recipes from photos (OCR)
- Create and edit drafts
- Publish recipes
- Share drafts with others
- Fork shared recipes

## App Structure

```
src/
├── lib/
│   ├── supabase.ts           # Supabase client
│   └── types/recipe.ts       # TypeScript types
├── hooks/
│   ├── useAuth.ts            # Authentication
│   ├── useRecipes.ts         # Recipe browsing
│   └── useDraft.ts           # Draft editing with auto-save
├── components/
│   ├── AuthGuard.tsx         # Protected route wrapper
│   ├── RecipeCard.tsx        # Recipe card component
│   ├── IngredientList.tsx    # Ingredient list with checkboxes
│   ├── StepList.tsx          # Step-by-step instructions
│   └── BottomNav.tsx         # Mobile navigation
└── pages/
    ├── Home.tsx              # Browse published recipes
    ├── Search.tsx            # Search with filters
    ├── Login.tsx             # Magic link login
    ├── RecipeDetail.tsx      # Recipe view
    ├── Import.tsx            # Import from URL/photo
    ├── DraftEditor.tsx       # Edit drafts
    ├── MyRecipes.tsx         # User's recipes
    └── ShareView.tsx         # Shared draft view

supabase/functions/server/
├── index.tsx                 # Main server entry
├── import-url.tsx            # URL scraping handler
└── import-ocr.tsx            # OCR processing handler
```

## Key Flows

### Magic Link Sign In
1. User enters email on `/login`
2. Receives magic link via email
3. Clicks link → automatically signed in
4. Redirected to My Recipes or original destination

### Import from URL
1. Paste recipe URL on `/import`
2. Server fetches and parses HTML
3. Extracts structured data (JSON-LD schema preferred)
4. Creates draft → redirects to editor

### Import from Photo (OCR)
1. Upload/photograph recipe on `/import`
2. Image uploaded to Supabase Storage
3. Server runs Tesseract OCR
4. Parses ingredients and steps
5. Creates draft → redirects to editor

### Share a Draft
1. Owner opens draft in editor
2. Clicks "Share" → generates UUID token
3. Copies share link
4. Recipient visits link, can fork into their own account

### Publish a Recipe
1. Complete draft with title, ingredients, steps
2. Click "Publish"
3. Recipe becomes publicly visible
4. Appears in browse/search results

## Design Tokens

The app uses a warm, editorial design system:

| Token | Value | Usage |
|-------|-------|-------|
| Background | `#FAFAF7` | Off-white page background |
| Text | `#1A1A18` | Near-black text |
| Accent | `#C0622F` | Burnt sienna (buttons, links, highlights) |
| Surface | `#FFFFFF` | Card backgrounds |
| Font (Titles) | Lora (serif) | Recipe titles, headings |
| Font (UI) | DM Sans (sans-serif) | Body text, UI elements |

## Environment Variables

No manual configuration needed! The Supabase connection is automatically configured when you connect your project in Make settings.

The following are auto-generated:
- `VITE_SUPABASE_URL` (via `projectId`)
- `VITE_SUPABASE_ANON_KEY` (via `publicAnonKey`)

## Notes

- **No dark mode** — Intentionally light-only for editorial warmth
- **Mobile-first** — Desktop layout is responsive enhancement
- **No social features** — No ratings, comments, follows, or feeds
- **Simple auth** — Magic link only (no password, no OAuth in this version)
- **Storage limits** — Free tier: 1GB storage, check Supabase quotas

## Troubleshooting

**Magic link not received?**
- Check spam folder
- Verify email is configured in Supabase Auth settings
- Confirm redirect URLs include your domain

**Import not working?**
- Ensure Edge Function is deployed
- Check browser console for errors
- Verify Storage buckets are created with correct RLS policies

**Can't see my drafts?**
- Verify you're signed in
- Check RLS policies are enabled
- Confirm `owner_id` matches your user ID

**OCR quality is poor?**
- Use high-contrast, well-lit photos
- Ensure text is clearly visible
- Try adjusting camera angle

## What's Out of Scope

Per the spec, these features are intentionally excluded:

- Meal planning
- Grocery lists
- Comments & ratings
- Social features (follows, feeds, notifications)
- Recipe versioning
- Ingredient scaling
- Unit conversion
- Print view
- OAuth providers (Google, Facebook, etc.)
- Password authentication

## Support

For Supabase-specific issues, refer to:
- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Auth Guide](https://supabase.com/docs/guides/auth)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)

---

Built with ❤️ using Figma Make
