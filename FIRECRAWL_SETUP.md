# Firecrawl Integration Setup

This document explains how to set up and use Firecrawl for web scraping in the Umami Recipe app.

## ⚠️ COST WARNING

**Firecrawl has usage limits:**
- **FREE TIER**: 500 requests/month with API key
- **After 500 requests**: Requires paid plan ($29-99/month)
- **Monitor usage**: https://firecrawl.dev/dashboard

**Good news:**
- Firecrawl only runs when Python scraper fails (rare)
- Most sites work with free Python scraper
- Typical usage: 10-50 Firecrawl requests/month
- You can remove API key anytime to disable Firecrawl

**To avoid costs:**
1. Monitor your Firecrawl dashboard monthly
2. Remove API key if approaching 500 requests
3. System will fall back to other scrapers automatically

## What is Firecrawl?

Firecrawl is a browser-based web scraping service that excels at scraping JavaScript-heavy websites and sites with anti-scraping measures. It's particularly useful for recipe sites that don't work well with traditional scrapers.

## Why Use Firecrawl?

The Umami Recipe app uses a multi-tier scraping approach:

1. **Python recipe-scrapers** (highest accuracy for 376+ supported sites)
2. **Firecrawl** (for JavaScript-heavy sites or when Python fails)
3. **TypeScript scrapers** (fallback for structured data)

Firecrawl is especially useful for sites like:
- Cuisine des Femmes (journaldesfemmes.fr)
- Sites with heavy JavaScript rendering
- Sites with anti-scraping measures
- Modern single-page applications (SPAs)

## Installation

### 1. Install Firecrawl CLI (Already Done)

The Firecrawl CLI has been installed globally:

```bash
npx -y firecrawl-cli@latest init --all --browser
```

This command:
- Installs the Firecrawl CLI globally
- Sets up MCP (Model Context Protocol) integration
- Configures browser-based scraping capabilities

### 2. Get a Firecrawl API Key (Optional)

Firecrawl works without an API key for basic usage, but adding one increases rate limits.

1. Visit [https://firecrawl.dev](https://firecrawl.dev)
2. Sign up for a free account
3. Get your API key from the dashboard
4. Add it to your environment variables

### 3. Configure Environment Variables

Add the Firecrawl API key to your Supabase Edge Functions:

#### For Local Development:

Create or update `.env.local`:

```bash
FIRECRAWL_API_KEY=fc-your-api-key-here
```

#### For Supabase Production:

Set the environment variable in your Supabase project:

```bash
# Using Supabase CLI
supabase secrets set FIRECRAWL_API_KEY=fc-your-api-key-here

# Or via Supabase Dashboard:
# 1. Go to Project Settings > Edge Functions
# 2. Add FIRECRAWL_API_KEY as a secret
```

#### For Vercel (if using Vercel deployment):

```bash
vercel env add FIRECRAWL_API_KEY
# Enter your API key when prompted
```

## How It Works

### Scraping Flow

When you import a recipe URL, the system tries methods in this order:

```
1. Python recipe-scrapers
   ↓ (if confidence < 0.9)
2. Firecrawl browser scraping
   ↓ (if confidence < 0.7)
3. TypeScript JSON-LD extraction
   ↓ (if no data found)
4. TypeScript Microdata extraction
   ↓ (if no data found)
5. TypeScript HTML pattern matching
```

### Firecrawl Features

The integration uses Firecrawl's scraping API with:

- **Markdown extraction**: Clean, structured content
- **HTML extraction**: Full page HTML for fallback parsing
- **Metadata extraction**: Title, description, images
- **Main content only**: Filters out navigation, ads, etc.

### Code Structure

```
supabase/functions/server/
├── import-url.tsx              # Main import handler
├── firecrawl-integration.tsx   # Firecrawl scraping logic
└── python-scraper-integration.tsx  # Python scraper integration
```

## Usage

### Basic Usage (No API Key)

The integration works out of the box without an API key:

```typescript
import { tryFirecrawl } from './firecrawl-integration.tsx';

const result = await tryFirecrawl('https://example.com/recipe');
```

Rate limits without API key:
- ~10 requests per minute
- Suitable for personal use

### With API Key (Higher Limits)

Set the `FIRECRAWL_API_KEY` environment variable:

```bash
export FIRECRAWL_API_KEY=fc-your-api-key-here
```

Rate limits with API key:
- Free tier: 500 requests/month
- Paid tiers: Higher limits available

## Testing

### Test Firecrawl Integration

You can test the Firecrawl integration with a problematic site:

```bash
# Test with a JavaScript-heavy recipe site
curl -X POST http://localhost:54321/functions/v1/import-url \
  -H "Content-Type: application/json" \
  -d '{"url": "https://cuisine.journaldesfemmes.fr/recette/1234-example"}'
```

### Check Logs

Monitor the scraping process:

```bash
# Supabase local development
supabase functions serve --debug

# Look for these log messages:
# 🔥 Attempting Firecrawl scrape for: [url]
# ✅ Firecrawl successfully extracted recipe data
# ⚠️ Firecrawl rate limit or auth issue, falling back
```

## Troubleshooting

### Issue: "Firecrawl rate limit or auth issue"

**Solution**: Add a Firecrawl API key to increase rate limits.

### Issue: "Could not extract ingredients or steps"

**Possible causes**:
1. The page doesn't contain recipe data
2. The recipe is behind a paywall
3. The site structure is unusual

**Solution**: The system will automatically fall back to other scraping methods.

### Issue: "Firecrawl API error: 401"

**Solution**: Check that your API key is correctly set in environment variables.

### Issue: TypeScript errors in IDE

The TypeScript errors for `Deno.env.get()` are expected. The code runs in Deno (Supabase Edge Functions), not Node.js.

## API Reference

### `tryFirecrawl(url: string)`

Attempts to scrape a recipe using Firecrawl.

**Parameters:**
- `url`: The recipe URL to scrape

**Returns:**
- `RecipeData | null`: Extracted recipe data or null if scraping failed

**Example:**

```typescript
const recipe = await tryFirecrawl('https://example.com/recipe');

if (recipe) {
  console.log('Title:', recipe.title);
  console.log('Ingredients:', recipe.ingredients.length);
  console.log('Steps:', recipe.steps.length);
  console.log('Confidence:', recipe.confidence);
}
```

## Cost Considerations

### Free Tier
- No API key needed for basic usage
- ~10 requests/minute
- Best for: Personal use, testing

### Paid Tiers
- Free: 500 requests/month
- Starter: $29/month for 5,000 requests
- Pro: $99/month for 20,000 requests

For most users, the free tier is sufficient.

## Best Practices

1. **Let the system choose**: The multi-tier approach automatically selects the best scraper
2. **Monitor confidence scores**: Low confidence (<0.7) means manual review recommended
3. **Use API key for production**: Avoid rate limits in production environments
4. **Cache results**: Store scraped recipes to avoid re-scraping

## Related Documentation

- [Python Scraper Integration](./PYTHON_SCRAPER_INTEGRATION.md)
- [Recipe Scraper Integration](./RECIPE_SCRAPER_INTEGRATION.md)
- [Supabase Setup](./SUPABASE_SETUP.md)

## Support

- Firecrawl Documentation: https://docs.firecrawl.dev
- Firecrawl GitHub: https://github.com/mendableai/firecrawl
- Umami Recipe Issues: [Your GitHub Issues URL]

---

Made with Bob