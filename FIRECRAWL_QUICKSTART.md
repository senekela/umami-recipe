# Firecrawl Quick Start Guide

Get Firecrawl up and running in 5 minutes for better recipe scraping.

## ⚠️ IMPORTANT: Cost Information

**FREE TIER LIMITS:**
- **500 requests per month** (with API key)
- After 500 requests, you'll need to upgrade to a paid plan
- Monitor your usage at: https://firecrawl.dev/dashboard

**To stay within free limits:**
- Firecrawl only activates when Python scraper fails
- Most recipe sites work with Python scraper (no Firecrawl needed)
- Estimated usage: ~10-50 Firecrawl requests/month for typical use
- You can disable Firecrawl by removing the API key if needed

## What You Get

Firecrawl adds browser-based scraping to handle sites that don't work well with traditional scrapers, like:
- Cuisine des Femmes (journaldesfemmes.fr)
- JavaScript-heavy recipe sites
- Sites with anti-scraping measures

## Quick Setup

### 1. Already Installed ✅

Firecrawl CLI has been installed and configured. You're ready to go!

### 2. Optional: Add API Key for Higher Limits

**Without API key**: ~10 requests/minute (good for testing)  
**With API key**: 500 requests/month free tier

#### Get Your API Key

1. Visit [https://firecrawl.dev](https://firecrawl.dev)
2. Sign up (free)
3. Copy your API key (starts with `fc-`)

#### Add to Supabase

```bash
# Set the secret in Supabase
supabase secrets set FIRECRAWL_API_KEY=fc-your-api-key-here
```

Or via Supabase Dashboard:
1. Go to Project Settings → Edge Functions
2. Add `FIRECRAWL_API_KEY` as a secret

### 3. Test It

Try importing a recipe that previously failed:

```bash
# Example: Cuisine des Femmes recipe
https://cuisine.journaldesfemmes.fr/recette/1234-example
```

The system will automatically:
1. Try Python scraper first
2. Fall back to Firecrawl if needed
3. Extract ingredients and steps
4. Return structured recipe data

## How It Works

### Automatic Fallback Chain

```
User imports URL
    ↓
Python Scraper (376+ sites)
    ↓ (if fails)
Firecrawl (JS-heavy sites)
    ↓ (if fails)
TypeScript Scrapers (fallback)
```

### What Firecrawl Does

1. **Renders JavaScript**: Executes page scripts like a real browser
2. **Extracts Content**: Gets clean markdown and HTML
3. **Parses Recipe**: Finds ingredients, steps, servings
4. **Returns Data**: Structured recipe ready to save

## Monitoring

### Check Logs

Look for these messages in your Supabase logs:

```
✅ Python scraper succeeded with high confidence
⚠️ Trying Firecrawl browser-based scraping
🔥 Attempting Firecrawl scrape for: [url]
✅ Firecrawl successfully extracted recipe data
```

### Confidence Scores

- **0.9+**: High confidence (Python scraper)
- **0.7-0.9**: Good confidence (Firecrawl)
- **0.5-0.7**: Moderate (TypeScript scrapers)
- **<0.5**: Low (manual review recommended)

## Common Issues

### "Rate limit exceeded"

**Solution**: Add a Firecrawl API key (see step 2 above)

### "Could not extract recipe data"

**Possible reasons**:
- Page doesn't contain a recipe
- Recipe is behind a paywall
- Unusual site structure

**What happens**: System falls back to other scrapers automatically

### TypeScript errors in IDE

These are expected. The code runs in Deno (Supabase Edge Functions), not Node.js.

## Cost

### Free Tier (No API Key)
- ✅ Works immediately
- ✅ ~10 requests/minute
- ✅ Perfect for testing
- ❌ Rate limited

### Free Tier (With API Key)
- ✅ 500 requests/month
- ✅ No rate limits
- ✅ Perfect for personal use
- ✅ Free forever

### Paid Tiers
- Starter: $29/month (5,000 requests)
- Pro: $99/month (20,000 requests)

Most users never need paid tiers.

## Testing Checklist

- [ ] Import a recipe from a supported site (should use Python scraper)
- [ ] Import from Cuisine des Femmes (should use Firecrawl)
- [ ] Check Supabase logs for scraping method used
- [ ] Verify ingredients and steps are extracted
- [ ] Check confidence score in response

## Next Steps

1. **Test with problematic sites**: Try sites that previously failed
2. **Monitor usage**: Check Firecrawl dashboard for request counts
3. **Adjust as needed**: Add API key if you hit rate limits

## Files Modified

- ✅ `supabase/functions/server/firecrawl-integration.tsx` - New Firecrawl module
- ✅ `supabase/functions/server/import-url.tsx` - Updated with Firecrawl fallback
- ✅ `.env.example` - Added FIRECRAWL_API_KEY configuration
- ✅ `FIRECRAWL_SETUP.md` - Complete documentation

## Support

- **Firecrawl Docs**: https://docs.firecrawl.dev
- **Firecrawl API**: https://api.firecrawl.dev
- **Get API Key**: https://firecrawl.dev

## Summary

✅ **Installed**: Firecrawl CLI and integration  
✅ **Configured**: Automatic fallback in scraping chain  
✅ **Optional**: Add API key for higher limits  
✅ **Ready**: Start importing recipes from any site  

---

Made with Bob