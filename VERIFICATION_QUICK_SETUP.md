# Quick Setup: Recipe Verification with GitHub Models

Get AI-powered recipe verification running in 5 minutes.

## Prerequisites

- ✅ Supabase project set up
- ✅ GitHub account (free)
- ✅ Supabase CLI installed (optional but recommended)

## Step 1: Get GitHub Token (2 minutes)

1. Go to https://github.com/settings/tokens
2. Click **"Generate new token"** → **"Generate new token (classic)"**
3. Configure:
   - **Name**: `Umami Recipe Verification`
   - **Expiration**: 90 days (or No expiration)
   - **Scopes**: Select `read:user`
4. Click **"Generate token"**
5. **Copy the token** (you won't see it again!)

## Step 2: Add Token to Supabase (1 minute)

### Option A: Using Supabase CLI (Recommended)

```bash
supabase secrets set GITHUB_TOKEN=github_pat_YOUR_TOKEN_HERE
```

### Option B: Using Supabase Dashboard

1. Go to your Supabase project
2. Navigate to **Project Settings** → **Edge Functions**
3. Scroll to **Secrets**
4. Click **"Add secret"**
5. Enter:
   - **Name**: `GITHUB_TOKEN`
   - **Value**: Your GitHub token
6. Click **"Save"**

## Step 3: Deploy Edge Functions (2 minutes)

Deploy the verification function:

```bash
# Deploy all edge functions
supabase functions deploy

# Or deploy specific function
supabase functions deploy import-url
```

## Step 4: Test It! (1 minute)

1. Open your Umami Recipe app
2. Go to **Import Recipe** → **From URL**
3. Paste a recipe URL (e.g., from AllRecipes, Food Network)
4. Click **Import**
5. Watch the console for verification logs:

```
✅ Python scraper succeeded with high confidence
🔍 Verifying recipe data (scraped via python-scraper)...
✓ Verification complete: PASSED
  Confidence: 92%
  Issues found: 1
  Reasoning: Fixed ingredient unit abbreviations for clarity
```

## Verification in Action

### What You'll See

**Before Verification:**
```json
{
  "title": "Chocolate Chip Cook...",
  "ingredients": [
    {"amount": "2", "unit": "c", "name": "flour"},
    {"amount": "1", "unit": "tsp", "name": "salt"}
  ]
}
```

**After Verification:**
```json
{
  "title": "Chocolate Chip Cookies",
  "ingredients": [
    {"amount": "2", "unit": "cups", "name": "all-purpose flour"},
    {"amount": "1", "unit": "teaspoon", "name": "salt"}
  ],
  "warnings": ["Title was truncated - expanded for clarity"],
  "confidence": 0.92
}
```

## Troubleshooting

### "Verification skipped" in logs

**Cause**: GitHub token not configured

**Fix**:
```bash
# Check if token is set
supabase secrets list

# If missing, add it
supabase secrets set GITHUB_TOKEN=your_token_here
```

### "GitHub Models API error: 401"

**Cause**: Invalid or expired token

**Fix**:
1. Generate a new token at https://github.com/settings/tokens
2. Update the secret:
```bash
supabase secrets set GITHUB_TOKEN=new_token_here
```

### "Rate limit exceeded"

**Cause**: Too many requests to GitHub Models API

**Fix**:
- Wait 1-2 minutes (limits reset quickly)
- System will fall back to basic validation automatically

## What Gets Verified?

The AI checks and improves:

| Field | Checks | Example Fix |
|-------|--------|-------------|
| **Title** | Clarity, completeness | "Choc Chip Cook..." → "Chocolate Chip Cookies" |
| **Ingredients** | Amount, unit, name parsing | "2 c flour" → "2 cups all-purpose flour" |
| **Steps** | Order, completeness, duplicates | Removes duplicate steps |
| **Servings** | Validity, reasonable range | "0" → "4" (based on context) |
| **Tags** | Relevance, categorization | Adds missing cuisine/category tags |

## Confidence Scores

| Score | Meaning | Action |
|-------|---------|--------|
| **0.9-1.0** | ✅ Excellent | Ready to publish |
| **0.7-0.9** | ⚠️ Good | Review warnings |
| **0.5-0.7** | 🔍 Fair | Manual review needed |
| **< 0.5** | ❌ Poor | Significant editing required |

## Cost

**GitHub Models**: FREE for developers
- No credit card required
- Generous rate limits
- Included with GitHub account

## Next Steps

1. ✅ Import a few recipes to test
2. 📊 Check verification logs in console
3. 🔍 Review flagged issues in draft editor
4. 📖 Read full docs: [GITHUB_MODELS_VERIFICATION.md](./GITHUB_MODELS_VERIFICATION.md)

## Advanced Configuration

### Custom Verification Prompt

Edit `supabase/functions/server/verify-recipe-data.tsx`:

```typescript
function buildVerificationPrompt(recipeData: RecipeData): string {
  return `Your custom prompt here...`;
}
```

### Adjust Confidence Thresholds

Edit `supabase/functions/server/import-url.tsx`:

```typescript
// Current: Use Python scraper if confidence >= 0.9
if (pythonResult && pythonResult.confidence >= 0.9) {
  // Change to 0.8 for more lenient acceptance
}
```

### Disable Verification

Set environment variable:

```bash
supabase secrets set GITHUB_TOKEN=""
```

System will fall back to basic validation.

## Support

**Issues?**
1. Check Supabase Edge Function logs
2. Verify GitHub token is valid: `curl -H "Authorization: Bearer YOUR_TOKEN" https://api.github.com/user`
3. Review console output during import
4. See full documentation: [GITHUB_MODELS_VERIFICATION.md](./GITHUB_MODELS_VERIFICATION.md)

---

**Made with Bob** 🤖

Ready to import recipes with AI-powered verification! 🚀