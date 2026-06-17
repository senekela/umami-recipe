# How to Verify AI Model is Being Called

This guide explains how to confirm that the GitHub Models AI is being used for recipe data cleaning.

## Quick Check: Look for Console Logs

When the AI model is called, you'll see these logs in your Supabase Edge Function logs:

### ✅ AI Model IS Being Called:
```
🤖 AI VERIFICATION STARTED
📊 Input: 12 ingredients, 8 steps
🔄 Calling GitHub Models API (gpt-4o-mini)...
✅ AI VERIFICATION COMPLETED
⏱️  Duration: 1234ms
📊 Output: 10 ingredients, 5 steps
🎯 Confidence: 85%
⚠️  Issues found: 3
🧹 Cleaned: 2 ingredients, 3 steps removed
```

### ❌ AI Model NOT Being Called (Fallback Mode):
```
⚠️ GitHub Models API key not configured (GITHUB_TOKEN missing)
⚠️ Falling back to client-side filtering only
⚠️ To enable AI cleaning: supabase secrets set GITHUB_TOKEN=your_token
```

## Step-by-Step Verification

### 1. Check if GITHUB_TOKEN is Set

Run this command to check your Supabase secrets:

```bash
supabase secrets list
```

You should see:
```
GITHUB_TOKEN | ****...****
```

If you don't see it, set it:

```bash
supabase secrets set GITHUB_TOKEN=your_github_token_here
```

### 2. View Real-Time Logs

#### Option A: Supabase Dashboard
1. Go to https://supabase.com/dashboard
2. Select your project
3. Navigate to **Edge Functions** → **Logs**
4. Import a recipe via URL
5. Watch for the AI verification logs

#### Option B: Supabase CLI
```bash
supabase functions logs import-url --follow
```

Then import a recipe and watch the logs in real-time.

### 3. Test with a Known Recipe URL

Import a recipe that typically has messy data:

```
https://cuisine.journaldesfemmes.fr/recette/1234567-tarte-aux-pommes
```

Check the logs for:
- `🤖 AI VERIFICATION STARTED`
- `🔄 Calling GitHub Models API`
- `✅ AI VERIFICATION COMPLETED`
- `🧹 Cleaned: X ingredients, Y steps removed`

### 4. Check the Draft Recipe

After import, check the draft recipe:
- **Title**: Should be clean (no "- Recette | Site Name")
- **Steps**: Should only contain cooking instructions (no "Voir aussi", "Partager", etc.)
- **Ingredients**: Should only contain real food items (no links or promotional text)

### 5. Verify API Response Time

AI verification typically takes **1-3 seconds**. If the import is instant (<500ms), the AI is likely not being called.

## Troubleshooting

### Issue: "GITHUB_TOKEN missing" Warning

**Solution:**
```bash
# Get a GitHub token
# 1. Go to https://github.com/settings/tokens
# 2. Generate new token (classic)
# 3. Select scope: read:user
# 4. Copy the token

# Set it in Supabase
supabase secrets set GITHUB_TOKEN=ghp_your_token_here

# Redeploy the function
supabase functions deploy import-url
```

### Issue: "GitHub Models API error: 401"

**Cause:** Invalid or expired GitHub token

**Solution:**
1. Generate a new token at https://github.com/settings/tokens
2. Update the secret: `supabase secrets set GITHUB_TOKEN=new_token`
3. Redeploy: `supabase functions deploy import-url`

### Issue: "GitHub Models API error: 429"

**Cause:** Rate limit exceeded (60 requests/hour for free tier)

**Solution:**
- Wait an hour for the rate limit to reset
- Or upgrade to GitHub Pro for higher limits
- The system will automatically fall back to client-side filtering

### Issue: No Logs Visible

**Solution:**
```bash
# Check if function is deployed
supabase functions list

# Redeploy if needed
supabase functions deploy import-url

# Check logs with verbose output
supabase functions logs import-url --follow
```

## Understanding the Logs

### Log Symbols Explained

| Symbol | Meaning |
|--------|---------|
| 🤖 | AI verification process started |
| 🔄 | Making API call to GitHub Models |
| ✅ | AI verification completed successfully |
| ❌ | Error occurred, falling back to client-side filtering |
| ⚠️ | Warning or important notice |
| 📊 | Data statistics (input/output counts) |
| 🎯 | Confidence score from AI |
| 🧹 | Data cleaning summary |
| ⏱️ | Timing information |

### Example Full Log Sequence

```
[2024-06-17 10:15:23] 🔍 Verifying recipe data (scraped via python-scraper)...
[2024-06-17 10:15:23] 🤖 AI VERIFICATION STARTED
[2024-06-17 10:15:23] 📊 Input: 15 ingredients, 12 steps
[2024-06-17 10:15:23] 🔄 Calling GitHub Models API (gpt-4o-mini)...
[2024-06-17 10:15:25] ✅ AI VERIFICATION COMPLETED
[2024-06-17 10:15:25] ⏱️  Duration: 1847ms
[2024-06-17 10:15:25] 📊 Output: 12 ingredients, 8 steps
[2024-06-17 10:15:25] 🎯 Confidence: 88%
[2024-06-17 10:15:25] ⚠️  Issues found: 2
[2024-06-17 10:15:25] 🧹 Cleaned: 3 ingredients, 4 steps removed
[2024-06-17 10:15:25] ✓ Verification complete: PASSED
```

## Performance Expectations

### With AI Verification (GITHUB_TOKEN set):
- **Duration**: 1-3 seconds
- **Cleaning Quality**: Excellent (AI-powered)
- **Logs**: Detailed with 🤖 symbols
- **Cost**: Free (60 requests/hour)

### Without AI Verification (Fallback):
- **Duration**: <100ms
- **Cleaning Quality**: Good (rule-based)
- **Logs**: Warning about missing token
- **Cost**: Free (no API calls)

## Best Practices

1. **Always set GITHUB_TOKEN** for production use
2. **Monitor logs** during initial testing
3. **Check draft recipes** to verify cleaning quality
4. **Set up alerts** for API errors in production
5. **Have fallback ready** (client-side filtering always works)

## Testing Checklist

- [ ] GITHUB_TOKEN is set in Supabase secrets
- [ ] Edge function is deployed
- [ ] Logs show "🤖 AI VERIFICATION STARTED"
- [ ] Logs show "✅ AI VERIFICATION COMPLETED"
- [ ] Import duration is 1-3 seconds
- [ ] Draft recipes are clean (no links, navigation, etc.)
- [ ] Confidence scores are displayed
- [ ] Cleaning statistics are logged

## Support

If you're still unsure whether the AI is being called:

1. Share your Supabase function logs
2. Check the draft recipe for cleaning quality
3. Verify GITHUB_TOKEN is set correctly
4. Ensure you're on the latest deployment

The enhanced logging makes it impossible to miss when AI verification is active!