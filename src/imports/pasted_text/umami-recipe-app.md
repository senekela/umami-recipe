# Umami — AI Build Prompt
**Stack:** Figma Make · Figma Sites · Supabase Auth · Supabase DB · Supabase Storage

---

## What You're Building

Umami is a mobile-first recipe web app. Anyone can browse and view published recipes without logging in. An account (email + magic link) is required to import, create, edit, and publish recipes. Logged-in users own their recipes; RLS enforces all access control. Draft sharing is lightweight: the owner generates a share link, recipients can view the draft and fork it into their own account. No social layer of any kind.

---

## Pre-resolved Ambiguities

| Question | Decision |
|---|---|
| Auth method | Supabase Auth — magic link only (one email input, no passwords, no reset flow) |
| Auth gates | Browse + recipe detail = public. Import, draft editor, My Recipes = login required. |
| Draft ownership | `owner_id UUID` FK to `auth.users`. RLS enforces edit rights — no custom token logic needed. |
| Share link | Owner generates `share_token` (UUID). `/share/:token` is public and read-only. |
| Fork behavior | Logged-in recipient duplicates draft: new row, `owner_id = auth.uid()`, no link to original. |
| Fork while logged out | Store token in redirect: `/login?next=/share/:token`. After login, auto-complete fork. |
| Publish | Sets `status = 'published'`; recipe becomes public. Unpublish returns to draft. Owner only. |
| OCR provider | Client-side Tesseract.js (runs in browser, no paid API). |
| URL scraper | Supabase Edge Function (Deno + Cheerio) — avoids client CORS restrictions. |
| Image storage | Supabase Storage — two buckets: `recipe-images` (public), `ocr-uploads` (private). |
| Search | Supabase full-text search via `tsvector`. No external service. |
| Routing | React Router v6, client-side only (Figma Sites = static CDN). |
| Styling | Tailwind CSS. Warm editorial tone: serif titles, sans-serif UI, off-white background. |
| Scope hard limit | No meal planning, grocery lists, comments, ratings, follows, feeds, notifications, or any social feature. |

---

## Stack Constraints for Figma Make

- Pure React SPA — no SSR, no `getServerSideProps`, no `fs` module.
- All Supabase calls use `@supabase/supabase-js` with the public anon key + user JWT.
- **Row Level Security is the only security layer** — no server middleware, no client-side role checks.
- Client writes directly to Supabase for all recipe CRUD; RLS enforces ownership automatically via `auth.uid()`.
- Edge Functions handle only URL scraping and OCR — both require server-side execution.
- Exposed env vars: `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` only.

---

## Database Schema

```sql
-- User profiles (extends auth.users)
CREATE TABLE public.profiles (
  id           UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  created_at   TIMESTAMPTZ DEFAULT now()
);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id)
  VALUES (NEW.id)
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- Recipes (drafts + published)
CREATE TABLE public.recipes (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug          TEXT UNIQUE NOT NULL,
  title         TEXT NOT NULL,
  description   TEXT,
  image_url     TEXT,
  source_url    TEXT,
  ingredients   JSONB NOT NULL DEFAULT '[]',
  steps         JSONB NOT NULL DEFAULT '[]',
  tags          TEXT[] NOT NULL DEFAULT '{}',
  status        TEXT NOT NULL DEFAULT 'draft'
                CHECK (status IN ('draft', 'published')),
  owner_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  share_token   UUID UNIQUE,
  share_enabled BOOLEAN NOT NULL DEFAULT false,
  import_method TEXT DEFAULT 'manual'
                CHECK (import_method IN ('manual', 'url', 'ocr', 'fork')),
  import_source TEXT,
  published_at  TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT now(),
  updated_at    TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX recipes_status_idx      ON public.recipes(status);
CREATE INDEX recipes_owner_idx       ON public.recipes(owner_id);
CREATE INDEX recipes_share_token_idx ON public.recipes(share_token)
  WHERE share_enabled = true;
CREATE INDEX recipes_tags_idx        ON public.recipes USING GIN(tags);
CREATE INDEX recipes_search_idx      ON public.recipes USING GIN(
  to_tsvector('english', coalesce(title,'') || ' ' || coalesce(description,''))
);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER recipes_updated_at
  BEFORE UPDATE ON public.recipes
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

---

## Row Level Security

```sql
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipes  ENABLE ROW LEVEL SECURITY;

-- Profiles
CREATE POLICY "Profiles readable by all"
  ON public.profiles FOR SELECT USING (true);

CREATE POLICY "Users manage their own profile"
  ON public.profiles FOR ALL
  USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

-- Recipes: public reads
CREATE POLICY "Published recipes readable by all"
  ON public.recipes FOR SELECT
  USING (status = 'published');

CREATE POLICY "Shared drafts readable via token"
  ON public.recipes FOR SELECT
  USING (share_enabled = true AND share_token IS NOT NULL);

-- Recipes: owners read their own (drafts + published)
CREATE POLICY "Owners read their own recipes"
  ON public.recipes FOR SELECT
  USING (auth.uid() = owner_id);

-- Recipes: authenticated writes (owner only)
CREATE POLICY "Authenticated users can create recipes"
  ON public.recipes FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners can update their recipes"
  ON public.recipes FOR UPDATE
  USING (auth.uid() = owner_id) WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Owners can delete their recipes"
  ON public.recipes FOR DELETE
  USING (auth.uid() = owner_id);
```

> With these policies the client writes directly to Supabase using the user's JWT. No Edge Function needed for recipe CRUD.

---

## Supabase Auth Configuration

In Supabase dashboard → Authentication → Settings:

- **Magic link** — enabled
- **Email + password** — disabled (magic link only keeps the auth surface minimal)
- **Site URL** — your Figma Sites domain
- **Redirect URLs** — `https://your-figma-site.com/*`
- Customise the magic link email template with the Umami name

Magic link flow: user enters email → receives link → clicks → lands on site → `supabase-js` exchanges token automatically via `supabase.auth.getSession()` on page load.

---

## Supabase Storage

```
Buckets:
  recipe-images   → public read; authenticated write
                    path: {owner_id}/{recipe_id}/{filename}
  ocr-uploads     → private; authenticated write, service-role read (Edge Function only)
                    path: {owner_id}/{timestamp}-{filename}

Storage RLS:
  recipe-images INSERT: auth.uid()::text = (storage.foldername(name))[1]
  ocr-uploads   INSERT: auth.uid() IS NOT NULL

Image transform URL (built-in Supabase):
  /storage/v1/render/image/public/recipe-images/{path}?width=600&quality=80
```

---

## Shared Types (TypeScript)

```typescript
// types/recipe.ts

export type Ingredient = {
  amount: string
  unit: string
  name: string
  group?: string        // e.g. "For the sauce"
}

export type Step = {
  order: number
  text: string
}

export type Recipe = {
  id: string
  slug: string
  title: string
  description: string | null
  image_url: string | null
  source_url: string | null
  ingredients: Ingredient[]
  steps: Step[]
  tags: string[]
  status: 'draft' | 'published'
  owner_id: string
  share_token: string | null
  share_enabled: boolean
  import_method: 'manual' | 'url' | 'ocr' | 'fork'
  import_source: string | null
  published_at: string | null
  created_at: string
  updated_at: string
}

// Returned by both import pipelines (URL + OCR)
export type DraftSchema = {
  title: string | null
  description: string | null
  image_url: string | null
  source_url: string | null
  ingredients: Ingredient[]
  steps: Step[]
  tags: string[]
  confidence: number        // 0–1; < 0.70 triggers OCR warning UI
  raw_text: string | null   // OCR raw output for low-confidence display
  errors: string[]          // Non-fatal parse warnings shown in editor
}
```

---

## Supabase Client Setup

```typescript
// lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
)

// Call an Edge Function, forwarding the user's auth token automatically
export async function callEdgeFunction<T>(
  name: string,
  body: object
): Promise<{ data: T | null; error: string | null }> {
  try {
    const res = await supabase.functions.invoke<T>(name, { body })
    if (res.error) return { data: null, error: res.error.message }
    return { data: res.data, error: null }
  } catch {
    return { data: null, error: 'Unexpected error. Please try again.' }
  }
}
```

---

## Core Hooks

### `useAuth`
```typescript
// hooks/useAuth.ts
export function useAuth() {
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session)
      setLoading(false)
    })
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_, session) => setSession(session)
    )
    return () => subscription.unsubscribe()
  }, [])

  const sendMagicLink = (email: string) =>
    supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: window.location.origin }
    })

  const logout = () => supabase.auth.signOut()

  return { session, user: session?.user ?? null, loading, sendMagicLink, logout }
}
```

### `useDraft` (auto-save)
```typescript
// hooks/useDraft.ts
export function useDraft(id: string) {
  const [draft, setDraft] = useState<Recipe | null>(null)
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved')
  const timer = useRef<ReturnType<typeof setTimeout>>()

  const updateField = (field: keyof Recipe, value: unknown) => {
    setDraft(prev => prev ? { ...prev, [field]: value } : prev)
    setSaveStatus('unsaved')
    clearTimeout(timer.current)
    timer.current = setTimeout(save, 20_000)
  }

  const save = async () => {
    if (!draft) return
    setSaveStatus('saving')
    await supabase.from('recipes').update(draft).eq('id', id)
    setSaveStatus('saved')
  }

  return { draft, updateField, save, saveStatus }
}
```

---

## Edge Functions

Only two Edge Functions are needed. All recipe CRUD goes directly from the client via RLS.

### `import-url`
```
POST { url: string }
Auth: Bearer token in header (user must be logged in — reject 401 otherwise)

1. Fetch URL server-side (avoids client CORS)
2. Parse HTML with Cheerio
3. Extract via schema.org/Recipe JSON-LD first; heuristic fallback second
4. Return DraftSchema | { error: string, partial: DraftSchema }
```

### `import-ocr`
```
POST { storage_path: string }
Auth: Bearer token required

1. Download image from ocr-uploads bucket (service-role key)
2. Run Tesseract WASM
3. Parse extracted text into ingredients/steps with regex + heuristics
4. Return DraftSchema with confidence score
```

---

## App Structure

```
src/
├── lib/
│   ├── supabase.ts           ← client + callEdgeFunction
│   └── types/recipe.ts       ← Recipe, DraftSchema, Ingredient, Step
├── hooks/
│   ├── useAuth.ts            ← session, sendMagicLink, logout
│   ├── useRecipes.ts         ← browse/search/filter (anon reads)
│   └── useDraft.ts           ← draft load, field updates, auto-save
├── components/
│   ├── AuthGuard.tsx         ← wraps protected pages; redirects to /login
│   ├── RecipeCard.tsx
│   ├── IngredientList.tsx    ← CSS-only checkable on mobile
│   ├── StepList.tsx
│   ├── TagFilter.tsx
│   ├── ImportUrlTab.tsx
│   ├── ImportOcrTab.tsx
│   ├── DraftEditorForm.tsx
│   ├── PublishBar.tsx        ← sticky bottom bar: Save · Publish · Share · Delete
│   ├── ShareModal.tsx        ← generate/copy/revoke share link
│   └── BottomNav.tsx         ← mobile tab bar
└── pages/
    ├── Home.tsx              ← /
    ├── RecipeDetail.tsx      ← /recipes/:slug
    ├── Import.tsx            ← /import  [auth required]
    ├── DraftEditor.tsx       ← /drafts/:id  [auth required, owner only]
    ├── ShareView.tsx         ← /share/:token  [public, read-only + fork CTA]
    ├── MyRecipes.tsx         ← /me  [auth required]
    ├── Login.tsx             ← /login
    └── NotFound.tsx
```

### `AuthGuard` pattern
```typescript
export function AuthGuard({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth()
  const location = useLocation()

  if (loading) return <LoadingSpinner />
  if (!user) return <Navigate to={`/login?next=${location.pathname}`} replace />
  return <>{children}</>
}

// In router:
<Route path="/import"    element={<AuthGuard><Import /></AuthGuard>} />
<Route path="/drafts/:id" element={<AuthGuard><DraftEditor /></AuthGuard>} />
<Route path="/me"        element={<AuthGuard><MyRecipes /></AuthGuard>} />
```

---

## Routing

| Route | Access | Notes |
|---|---|---|
| `/` | Public | Browse + search published recipes |
| `/recipes/:slug` | Public | Read-only recipe detail; owner sees Edit + Unpublish |
| `/import` | Auth required | URL + OCR tabs; creates draft, redirects to editor |
| `/drafts/:id` | Auth + owner only | Full editor; non-owners see 404 |
| `/share/:token` | Public | Read-only draft view; fork CTA prompts login if needed |
| `/me` | Auth required | Published + Drafts tabs |
| `/login` | Public | Magic link form; `?next=` param for post-login redirect |

---

## Key UX Flows

### Sign In (Magic Link)
1. User visits `/login` (or redirected there by `AuthGuard`)
2. Single input: email address. Single button: "Send me a link"
3. Confirmation screen: "Check your email — we sent you a sign-in link"
4. User clicks email link → returns to app → session established automatically
5. Redirect to `?next=` param or `/me`

### Create via URL Import
1. Logged-in user pastes URL on `/import` → URL tab
2. Client calls `import-url` Edge Function (JWT forwarded automatically)
3. Loading state: "Fetching recipe…" skeleton
4. On success → client inserts new draft: `{ ...DraftSchema, owner_id: user.id, status: 'draft' }`
5. Redirect to `/drafts/:id`
6. User reviews pre-filled fields, edits, publishes

### Create via Photo/OCR Import
1. User taps "Photograph a recipe" → `<input type="file" accept="image/*" capture="environment">`
2. Image uploaded to `ocr-uploads/{owner_id}/{timestamp}` via Supabase Storage
3. Client calls `import-ocr` Edge Function with storage path
4. If `confidence < 0.70` → split view: raw text (left, scrollable) + parsed fields (right); amber highlight on uncertain fields
5. User corrects fields and accepts → draft inserted → redirect to `/drafts/:id`

### Draft Editor Auto-save
- Debounced 20s after last keystroke
- Client calls `supabase.from('recipes').update(fields).eq('id', id)` — RLS enforces ownership
- Status bar: "Saved ✓" / "Saving…" / "Unsaved"
- `beforeunload` warning on unsaved changes

### Share a Draft
1. Owner taps "Share" in editor → `ShareModal` opens
2. If no `share_token` yet: client updates row with `share_token = crypto.randomUUID()`, `share_enabled = true`
3. Modal shows: `yoursite.com/share/:share_token` — tap to copy
4. "Disable link" toggle → sets `share_enabled = false`; existing token preserved but link is dead

### Fork a Draft
1. Recipient visits `/share/:token` → reads draft (RLS allows via `share_enabled = true`)
2. Taps "Fork this recipe"
3. If not logged in → redirect to `/login?next=/share/:token`; after login, auto-trigger fork
4. If logged in → client inserts copy: `{ ...draft, id: newUUID, owner_id: user.id, status: 'draft', import_method: 'fork', share_token: null, share_enabled: false }`
5. Redirect to `/drafts/:new_id`

### Publish
1. Owner taps "Publish" in editor
2. Client validates locally: title required, ≥1 ingredient, ≥1 step
3. On fail → inline red borders + error list; no network call made
4. On pass → client updates `status = 'published'`, `published_at = now()`
5. Redirect to `/recipes/:slug`

---

## Mobile-First UI Spec

**Viewport:** Design for 390px first. Desktop layout is an enhancement via breakpoints.

**Navigation (mobile):** Fixed bottom tab bar — Home · Search · + Import · Me

**Touch targets:** Minimum 48×48px on every interactive element.

**Visual tone:**

| Token | Value |
|---|---|
| Background | `#FAFAF7` |
| Text | `#1A1A18` |
| Accent | `#C0622F` (burnt sienna) |
| Surface | `#FFFFFF` with `box-shadow: 0 1px 3px rgba(0,0,0,0.06)` |
| Title font | Lora (serif) |
| UI font | DM Sans (sans-serif) |

Recipe cards: 16:9 image, title + tag chips below. No star ratings, no counts, no avatars.

**Ingredient checkoff — CSS-only, no JS:**
```css
.ingredient input[type="checkbox"]:checked + label {
  text-decoration: line-through;
  opacity: 0.45;
}
```

**OCR camera input:**
```html
<input type="file" accept="image/*" capture="environment" />
```
Show image preview immediately on selection, before processing begins.

**Login screen:** Full-screen centered card. App name. Email input. "Send me a link" button. Nothing else.

**Draft editor fields:** Title · Description · Image (upload or URL) · Tags (multi-select + create new) · Source URL · Ingredients (dynamic rows: amount + unit + name, add/remove) · Steps (dynamic numbered rows, drag handle to reorder)

---

## Error Handling

| Scenario | UI Response |
|---|---|
| Magic link not received | "Check your spam folder, or try again in 60 seconds" with countdown resend |
| URL unreachable | Inline: "Couldn't reach that URL — is it publicly accessible?" + retry |
| URL has no recipe data | Pre-fill title from `<title>` tag; all other fields empty; user fills manually |
| OCR confidence < 0.70 | Split view: raw text + parsed fields; amber highlight on uncertain tokens |
| Image unreadable | "Try a clearer, higher-contrast photo of the recipe page" |
| Non-owner visits `/drafts/:id` | 404 — do not reveal the draft exists |
| Share token revoked or invalid | Friendly page: "This link is no longer active" |
| Fork while logged out | Store token in `?next=` redirect; auto-complete fork after login |
| Publish with missing fields | Inline validation with field-level errors; no navigation |
| Session expired mid-edit | Toast: "Your session expired — sign in again to keep editing"; login modal |
| Supabase network error | Toast: "Connection issue — retrying…" with exponential backoff |

---

## Implementation Order

Each phase is independently shippable.

1. **Supabase setup** — schema SQL, RLS policies, Storage buckets, Auth config (magic link on, password off, redirect URL set)
2. **Auth** — Login page, `useAuth` hook, `AuthGuard`, magic link confirmation screen, post-login redirect
3. **Browse + Recipe Detail** — Home, RecipeCard, RecipeDetail, tag filter, full-text search; verify anon RLS reads
4. **My Recipes + Draft Editor** — CRUD client-side, auto-save, publish/unpublish, delete; verify owner RLS writes
5. **URL Import** — `import-url` Edge Function + `ImportUrlTab` UI + all error states
6. **OCR Import** — Storage upload + `import-ocr` Edge Function + confidence split-view + `ImportOcrTab` UI
7. **Share & Fork** — `ShareModal`, `ShareView` page, fork flow, login-redirect fork recovery
8. **Polish** — Bottom nav, image transforms, loading skeletons, empty states, toast system, `beforeunload` guard, `safe-area-inset` padding, accessibility pass

---

## Out of Scope — Reject All of This

Meal planning · grocery lists · comments · ratings · follows · activity feeds · notifications · collaborative editing · recipe versioning · ingredient scaling · unit conversion · print view · OAuth providers · password auth · any monetization