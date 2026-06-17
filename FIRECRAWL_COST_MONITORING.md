# Firecrawl Cost Monitoring Guide

## How to Stay Within Free Limits (500 requests/month)

### 1. Check Your Usage Monthly

Visit your Firecrawl dashboard:
```
https://firecrawl.dev/dashboard
```

Look for:
- **Current month usage**: X / 500 requests
- **Usage trend**: Daily/weekly breakdown
- **Remaining requests**: 500 - X

### 2. Set Up Alerts (Recommended)

**Option A: Firecrawl Dashboard Alerts**
1. Go to https://firecrawl.dev/dashboard
2. Navigate to Settings → Notifications
3. Enable email alerts at 80% usage (400 requests)

**Option B: Manual Monthly Check**
- Set a calendar reminder for the 1st of each month
- Check usage and reset expectations

### 3. Understand When Firecrawl Runs

Firecrawl ONLY activates when:
1. Python scraper fails (confidence < 0.9)
2. Site is JavaScript-heavy or has anti-scraping
3. No structured data found

**Most common sites that trigger Firecrawl:**
- journaldesfemmes.fr (Cuisine des Femmes)
- Some modern SPA recipe sites
- Sites with heavy JavaScript

**Sites that DON'T use Firecrawl:**
- allrecipes.com ✅ (Python scraper)
- foodnetwork.com ✅ (Python scraper)
- bonappetit.com ✅ (Python scraper)
- 370+ other supported sites ✅ (Python scraper)

### 4. Monitor Supabase Logs

Check which scraper is being used:

```bash
# View recent logs
supabase functions logs import-url

# Look for these messages:
✅ Python scraper succeeded with high confidence  # No Firecrawl used
🔥 Attempting Firecrawl scrape for: [url]        # Firecrawl used
⚠️ Falling back to TypeScript scraper            # No Firecrawl used
```

### 5. Estimated Usage

**Typical personal use:**
- 10-20 recipe imports per month
- 1-3 require Firecrawl (10-15%)
- **Total Firecrawl requests: 1-3/month**
- **Well within 500 limit** ✅

**Heavy use:**
- 100 recipe imports per month
- 10-20 require Firecrawl (10-20%)
- **Total Firecrawl requests: 10-20/month**
- **Still within 500 limit** ✅

**Extreme use:**
- 500+ recipe imports per month
- 50-100 require Firecrawl (10-20%)
- **Total Firecrawl requests: 50-100/month**
- **Still within 500 limit** ✅

### 6. What to Do If Approaching Limit

#### At 400 requests (80% of limit):

**Option 1: Remove API Key (Recommended)**
```bash
# Remove from Supabase
supabase secrets unset FIRECRAWL_API_KEY
```

Effect:
- Firecrawl will stop working
- System falls back to TypeScript scrapers
- No costs incurred
- Most sites still work fine

**Option 2: Wait Until Next Month**
- Usage resets on the 1st of each month
- Continue using normally

**Option 3: Upgrade to Paid Plan**
- Starter: $29/month (5,000 requests)
- Only if you need Firecrawl for many imports

#### At 500 requests (100% of limit):

Firecrawl will stop working automatically:
- No additional charges
- System falls back to other scrapers
- Remove API key to avoid confusion

### 7. How to Disable Firecrawl Completely

If you want to avoid any risk of costs:

```bash
# Remove API key from Supabase
supabase secrets unset FIRECRAWL_API_KEY

# Or via Supabase Dashboard:
# 1. Go to Project Settings → Edge Functions
# 2. Delete FIRECRAWL_API_KEY secret
```

Effect:
- Firecrawl integration still exists in code
- But won't make any API calls
- Falls back to TypeScript scrapers immediately
- Zero cost, zero risk

### 8. Cost Breakdown

| Plan | Cost | Requests | Cost per Request |
|------|------|----------|------------------|
| Free | $0 | 500/month | $0 |
| Starter | $29/month | 5,000/month | $0.0058 |
| Pro | $99/month | 20,000/month | $0.00495 |

**For personal use, free tier is sufficient.**

### 9. Monthly Checklist

- [ ] Check Firecrawl dashboard usage
- [ ] Review Supabase logs for Firecrawl usage
- [ ] Confirm usage is under 400 requests
- [ ] If over 400, consider removing API key
- [ ] Usage resets automatically on 1st of month

### 10. Emergency: Disable Immediately

If you see unexpected high usage:

```bash
# Quick disable
supabase secrets unset FIRECRAWL_API_KEY

# Verify it's removed
supabase secrets list
```

The system will continue working with other scrapers.

## Summary

✅ **Free tier is generous**: 500 requests/month  
✅ **Typical usage is low**: 1-20 requests/month  
✅ **Easy to monitor**: Dashboard + logs  
✅ **Easy to disable**: Remove API key anytime  
✅ **No surprise charges**: Free tier has hard limit  
✅ **Automatic fallback**: Other scrapers still work  

**Bottom line:** You're very unlikely to exceed the free tier with normal personal use.

---

Made with Bob