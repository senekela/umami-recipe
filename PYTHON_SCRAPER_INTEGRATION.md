# Python Recipe Scraper Integration Guide

This guide explains how to integrate the Python `recipe-scrapers` library with your Umami Recipe application.

## Overview

The Python scraper provides a REST API that uses the [recipe-scrapers](https://github.com/hhursev/recipe-scrapers) library to extract recipe data from 200+ websites with high accuracy (95%+ confidence).

## Architecture

```
┌─────────────────┐
│   React App     │
│  (TypeScript)   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐      ┌──────────────────┐
│ Supabase Edge   │─────▶│  Python Flask    │
│   Function      │      │   Recipe API     │
│  (import-url)   │◀─────│  (port 5001)     │
└─────────────────┘      └──────────────────┘
                                  │
                                  ▼
                         ┌──────────────────┐
                         │ recipe-scrapers  │
                         │    Library       │
                         └──────────────────┘
```

## Setup

### 1. Install Python Dependencies

```bash
cd python-scraper
./setup.sh
```

Or manually:
```bash
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### 2. Start the Python API

```bash
cd python-scraper
source venv/bin/activate
python app.py
```

The API will run on `http://localhost:5001`

### 3. Test the API

```bash
# Health check
curl http://localhost:5001/health

# Test scraping
curl http://localhost:5001/test

# Or run the test suite
python test_scraper.py
```

## Integration Options

### Option A: Direct API Calls (Recommended for Development)

Call the Python API directly from your frontend:

```typescript
// src/lib/pythonScraper.ts
export async function scrapePythonRecipe(url: string) {
  try {
    const response = await fetch('http://localhost:5001/scrape', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
    });
    
    const result = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Failed to scrape recipe');
    }
    
    return transformPythonRecipe(result.data);
  } catch (error) {
    console.error('Python scraper error:', error);
    throw error;
  }
}

function transformPythonRecipe(data: any) {
  return {
    title: data.title,
    description: data.description,
    image_url: data.image,
    source_url: data.source_url,
    ingredients: data.ingredients.map((ing: string, idx: number) => ({
      amount: '',
      unit: '',
      name: ing,
      order: idx + 1
    })),
    steps: parseInstructions(data.instructions),
    tags: [data.category, data.cuisine].filter(Boolean),
    confidence: data.confidence,
    yields: data.yields,
    total_time: data.total_time,
    prep_time: data.prep_time,
    cook_time: data.cook_time,
  };
}

function parseInstructions(instructions: string) {
  return instructions
    .split(/\n+/)
    .map((step, idx) => ({
      order: idx + 1,
      text: step.trim()
    }))
    .filter(s => s.text.length > 0);
}
```

Then use it in your Import page:

```typescript
// src/pages/Import.tsx
import { scrapePythonRecipe } from '../lib/pythonScraper';

async function handleImport(url: string) {
  try {
    const recipeData = await scrapePythonRecipe(url);
    // Create draft with the scraped data
    await createDraft(recipeData);
  } catch (error) {
    console.error('Import failed:', error);
  }
}
```

### Option B: Via Supabase Edge Function (Recommended for Production)

Update your existing Edge Function to use the Python API:

```typescript
// supabase/functions/server/import-url.tsx

const PYTHON_SCRAPER_URL = Deno.env.get('PYTHON_SCRAPER_URL') || 'http://localhost:5001';

export async function handleUrlImport(url: string) {
  try {
    // Try Python scraper first (highest confidence)
    const pythonResult = await tryPythonScraper(url);
    if (pythonResult) {
      return { data: pythonResult, error: null };
    }
    
    // Fallback to existing TypeScript scraper
    return await handleUrlImportFallback(url);
  } catch (err) {
    console.error('URL import error:', err);
    return {
      error: 'Failed to import recipe',
      partial: null
    };
  }
}

async function tryPythonScraper(url: string) {
  try {
    const response = await fetch(`${PYTHON_SCRAPER_URL}/scrape`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
    });
    
    if (!response.ok) {
      return null;
    }
    
    const result = await response.json();
    
    if (!result.success) {
      return null;
    }
    
    // Transform Python scraper data to RecipeData format
    return {
      title: result.data.title,
      description: result.data.description,
      image_url: result.data.image,
      source_url: result.data.source_url,
      ingredients: result.data.ingredients.map((ing: string, idx: number) => {
        // Parse ingredient string
        const match = ing.match(/^([\d\/\.\s\-]+)?\s*([a-zA-Z]+)?\s*(.+)$/);
        return {
          amount: match?.[1]?.trim() || '',
          unit: match?.[2]?.trim() || '',
          name: match?.[3]?.trim() || ing,
          order: idx + 1
        };
      }),
      steps: result.data.instructions.split(/\n+/).map((step: string, idx: number) => ({
        order: idx + 1,
        text: step.trim()
      })).filter((s: any) => s.text),
      tags: [result.data.category, result.data.cuisine].filter(Boolean),
      confidence: result.data.confidence,
      yields: result.data.yields,
      total_time: result.data.total_time,
      prep_time: result.data.prep_time,
      cook_time: result.data.cook_time,
      raw_text: null,
      errors: []
    };
  } catch (error) {
    console.error('Python scraper error:', error);
    return null;
  }
}

// Keep existing TypeScript scraper as fallback
async function handleUrlImportFallback(url: string) {
  // Your existing implementation from import-url.tsx
  // ...
}
```

### Option C: Hybrid Approach (Best of Both Worlds)

Use Python scraper for supported sites, TypeScript scraper for others:

```typescript
export async function handleUrlImport(url: string) {
  const hostname = new URL(url).hostname;
  
  // Check if site is well-supported by Python scraper
  const pythonSupportedSites = [
    'allrecipes.com',
    'foodnetwork.com',
    'bonappetit.com',
    'seriouseats.com',
    // ... add more
  ];
  
  const usePythonScraper = pythonSupportedSites.some(site => 
    hostname.includes(site)
  );
  
  if (usePythonScraper) {
    const result = await tryPythonScraper(url);
    if (result) return { data: result, error: null };
  }
  
  // Fallback to TypeScript scraper
  return await handleUrlImportFallback(url);
}
```

## Deployment

### Development

Run both servers locally:

```bash
# Terminal 1: Python API
cd python-scraper
source venv/bin/activate
python app.py

# Terminal 2: React app
pnpm dev
```

### Production

#### Option 1: Docker Compose

Create `docker-compose.yml` in project root:

```yaml
version: '3.8'
services:
  recipe-scraper:
    build: ./python-scraper
    ports:
      - "5001:5001"
    restart: unless-stopped
    environment:
      - FLASK_ENV=production
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:5001/health"]
      interval: 30s
      timeout: 3s
      retries: 3
```

Run with:
```bash
docker-compose up -d
```

#### Option 2: Separate Deployment

Deploy Python API to:
- **Railway**: Auto-detects Python and runs the app
- **Render**: Configure with `gunicorn app:app`
- **Heroku**: Add `Procfile` with `web: gunicorn app:app`
- **AWS/GCP/Azure**: Deploy as containerized service

Set environment variable in your Edge Function:
```bash
PYTHON_SCRAPER_URL=https://your-python-api.railway.app
```

## API Reference

### POST /scrape

Scrape a recipe from a URL.

**Request:**
```json
{
  "url": "https://example.com/recipe"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "title": "Recipe Title",
    "ingredients": ["1 cup flour", "2 eggs"],
    "instructions": "Step 1...\nStep 2...",
    "total_time": 30,
    "yields": "4 servings",
    "confidence": 0.95,
    "image": "https://...",
    "description": "...",
    "prep_time": 15,
    "cook_time": 15,
    "nutrients": {...},
    "author": "Chef Name",
    "category": "Main Course",
    "cuisine": "Italian"
  },
  "error": null
}
```

### GET /health

Health check endpoint.

### GET /supported-sites

Get list of supported recipe sites.

### GET /test

Test with a sample recipe URL.

## Comparison: Python vs TypeScript Scraper

| Feature | Python Scraper | TypeScript Scraper |
|---------|---------------|-------------------|
| Supported Sites | 200+ | Any with schema.org |
| Confidence | 95%+ | 60-95% |
| Maintenance | Library maintained | Custom code |
| Setup | Requires Python | Native to project |
| Performance | Slightly slower | Faster |
| Reliability | Very high | Good |

## Troubleshooting

### Python API not responding

```bash
# Check if running
curl http://localhost:5001/health

# Restart the server
cd python-scraper
source venv/bin/activate
python app.py
```

### CORS errors

The API has CORS enabled. If issues persist, check your request origin.

### Import errors in VSCode

These are expected if dependencies aren't installed. Run:
```bash
cd python-scraper
pip install -r requirements.txt
```

### Recipe not scraping correctly

1. Test directly with Python API:
```bash
curl -X POST http://localhost:5001/scrape \
  -H "Content-Type: application/json" \
  -d '{"url": "YOUR_URL"}'
```

2. Check if site is supported:
```bash
curl http://localhost:5001/supported-sites
```

3. Fall back to TypeScript scraper for unsupported sites

## Best Practices

1. **Use Python scraper for known sites**: Higher accuracy and reliability
2. **Keep TypeScript scraper as fallback**: Handles edge cases
3. **Cache results**: Avoid re-scraping the same URL
4. **Handle errors gracefully**: Show user-friendly messages
5. **Monitor API health**: Set up health checks in production
6. **Rate limiting**: Respect website rate limits

## Next Steps

1. ✅ Set up Python API locally
2. ✅ Test with sample recipes
3. ✅ Integrate with your app
4. ✅ Deploy to production
5. ✅ Monitor and optimize

## Resources

- [Python Scraper README](python-scraper/README.md)
- [Quick Start Guide](python-scraper/QUICKSTART.md)
- [recipe-scrapers Documentation](https://github.com/hhursev/recipe-scrapers)
- [Existing TypeScript Implementation](RECIPE_SCRAPER_INTEGRATION.md)