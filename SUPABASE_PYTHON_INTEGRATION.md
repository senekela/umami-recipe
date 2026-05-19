# Supabase + Python Scraper Integration

## Quick Setup (5 minutes)

Your Python scraper is now integrated with Supabase! Here's how to use it:

### 1. Start the Python API

```bash
cd python-scraper
source venv/bin/activate
python app.py
```

The API runs on `http://localhost:5001`

### 2. How It Works

The integration automatically:
1. **Tries Python scraper first** (95%+ confidence, 376+ sites)
2. **Falls back to TypeScript scraper** if Python API is unavailable
3. **No code changes needed** - it just works!

### 3. Test It

```bash
# Test the Python API directly
curl -X POST http://localhost:5001/scrape \
  -H "Content-Type: application/json" \
  -d '{"url": "https://www.marmiton.org/recettes/recette_pate-a-crepes_12372.aspx"}'
```

### 4. Use in Your App

Your existing import functionality now automatically uses the Python scraper when available:

```typescript
// In your Import page - no changes needed!
// The Edge Function automatically tries Python scraper first
const result = await supabase.functions.invoke('server', {
  body: { 
    action: 'import-url',
    url: 'https://www.marmiton.org/recettes/recette_pate-a-crepes_12372.aspx'
  }
});
```

## Architecture

```
┌─────────────────┐
│   React App     │
│  (Your Import   │
│     Page)       │
└────────┬────────┘
         │
         ▼
┌─────────────────┐      ┌──────────────────┐
│ Supabase Edge   │─────▶│  Python Flask    │
│   Function      │      │   Recipe API     │
│  (import-url)   │◀─────│  (port 5001)     │
└─────────────────┘      └──────────────────┘
         │                        │
         │ (fallback)             ▼
         ▼               ┌──────────────────┐
┌─────────────────┐     │ recipe-scrapers  │
│   TypeScript    │     │  (376+ sites)    │
│    Scraper      │     └──────────────────┘
└─────────────────┘
```

## What Changed

### ✅ Added Files
- `supabase/functions/server/python-scraper-integration.tsx` - Integration module
- `python-scraper/app.py` - Flask API with updated `scrape_html()` API

### ✅ Updated Files
- `supabase/functions/server/import-url.tsx` - Now tries Python scraper first

### ✅ No Breaking Changes
- Existing functionality still works
- TypeScript scraper remains as fallback
- No frontend changes required

## Supported Sites

The Python scraper supports **376 recipe sites** including:

### Popular Sites
- AllRecipes.com
- FoodNetwork.com
- BonAppetit.com
- Epicurious.com
- SeriousEats.com
- SimplyRecipes.com
- Tasty.co
- Delish.com
- Food.com
- **Marmiton.org** (French)
- And 366 more!

### Get Full List
```bash
curl http://localhost:5001/supported-sites
```

## Production Deployment

### Option 1: Deploy to Render.com (Recommended - Free Tier)

1. **Deploy Python API to Render**
   ```bash
   cd python-scraper
   # Follow RENDER_DEPLOYMENT.md for complete step-by-step guide
   ```
   
   **Quick steps:**
   - Push code to GitHub
   - Sign up at [render.com](https://render.com) (free, no credit card)
   - Create new Web Service from your GitHub repo
   - Set root directory to `python-scraper`
   - Deploy takes ~3 minutes

2. **Set Environment Variable in Supabase**
   ```bash
   # In Supabase Dashboard > Edge Functions > Environment Variables
   PYTHON_SCRAPER_URL=https://your-app.onrender.com
   ```

3. **Keep It Warm (Optional)**
   - Use [cron-job.org](https://cron-job.org) to ping `/health` every 14 minutes
   - Prevents cold starts on free tier

### Option 2: Docker Compose (Recommended)

```yaml
# docker-compose.yml
version: '3.8'
services:
  recipe-scraper:
    build: ./python-scraper
    ports:
      - "5001:5001"
    restart: unless-stopped
    environment:
      - FLASK_ENV=production
```

Run with:
```bash
docker-compose up -d
```

## Testing

### Test Python API
```bash
cd python-scraper
source venv/bin/activate
python test_scraper.py
```

### Test Integration
```bash
# Start Python API
cd python-scraper && python app.py &

# Test a URL
curl -X POST http://localhost:5001/scrape \
  -H "Content-Type: application/json" \
  -d '{"url": "https://www.allrecipes.com/recipe/158968/spinach-and-feta-turkey-burgers/"}'
```

## Troubleshooting

### Python API Not Running
```bash
# Check if running
curl http://localhost:5001/health

# Restart
cd python-scraper
source venv/bin/activate
python app.py
```

### Edge Function Not Finding Python API
- Make sure Python API is running on port 5001
- Check `PYTHON_SCRAPER_URL` environment variable
- The integration will automatically fall back to TypeScript scraper

### Import Still Using TypeScript Scraper
This is normal! The integration:
1. Tries Python scraper (2-3 seconds timeout)
2. Falls back to TypeScript if unavailable
3. Both methods work fine

## Benefits

### With Python Scraper
- ✅ 376+ supported sites
- ✅ 95%+ confidence
- ✅ Maintained by community
- ✅ Handles complex sites (Marmiton, etc.)

### TypeScript Fallback
- ✅ Works without Python API
- ✅ Handles any site with schema.org
- ✅ No external dependencies
- ✅ Fast and reliable

## Next Steps

1. ✅ Python API is running
2. ✅ Integration is complete
3. ✅ Test with your favorite recipe sites
4. 🚀 Deploy to production when ready

## Example: Testing Marmiton.org

```bash
# Start Python API
cd python-scraper && python app.py

# Test French recipe
curl -X POST http://localhost:5001/scrape \
  -H "Content-Type: application/json" \
  -d '{"url": "https://www.marmiton.org/recettes/recette_pate-a-crepes_12372.aspx"}' \
  | python3 -m json.tool
```

Result:
```json
{
  "success": true,
  "data": {
    "title": "La meilleure recette de pâte à crêpes",
    "ingredients": [
      "300 g de farine",
      "3 oeufs entiers",
      "3 cuillères à soupe de sucre",
      ...
    ],
    "total_time": 40,
    "yields": "15 servings",
    "confidence": 1.0
  }
}
```

## Resources

- [Python Scraper README](python-scraper/README.md)
- [Installation Complete](python-scraper/INSTALLATION_COMPLETE.md)
- [Deployment Guide](python-scraper/RENDER_DEPLOYMENT.md)
- [recipe-scrapers Library](https://github.com/hhursev/recipe-scrapers)