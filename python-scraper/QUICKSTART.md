# Recipe Scraper - Quick Start Guide

Get the Python recipe scraper API running in 5 minutes.

## Prerequisites

- Python 3.8+ installed
- pip package manager

## Quick Setup (Automated)

Run the setup script:

```bash
cd python-scraper
./setup.sh
```

This will:
1. ✅ Check Python version
2. ✅ Create virtual environment
3. ✅ Install all dependencies
4. ✅ Verify installation

## Quick Setup (Manual)

If you prefer manual setup:

```bash
cd python-scraper

# Create virtual environment
python3 -m venv venv

# Activate it
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

## Start the Server

```bash
# Make sure virtual environment is activated
source venv/bin/activate

# Run the development server
python app.py
```

The API will be available at **http://localhost:5001**

## Test It Out

### 1. Health Check

```bash
curl http://localhost:5001/health
```

Expected response:
```json
{"status": "healthy", "service": "recipe-scraper"}
```

### 2. Test with Sample Recipe

```bash
curl http://localhost:5001/test
```

This will scrape a sample AllRecipes URL and return the recipe data.

### 3. Scrape Your Own Recipe

```bash
curl -X POST http://localhost:5001/scrape \
  -H "Content-Type: application/json" \
  -d '{"url": "https://www.allrecipes.com/recipe/158968/spinach-and-feta-turkey-burgers/"}'
```

## Integration with Your App

### From TypeScript/JavaScript

```typescript
async function scrapeRecipe(url: string) {
  const response = await fetch('http://localhost:5001/scrape', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url }),
  });
  
  const result = await response.json();
  
  if (result.success) {
    console.log('Recipe:', result.data.title);
    console.log('Ingredients:', result.data.ingredients);
    console.log('Instructions:', result.data.instructions);
  } else {
    console.error('Error:', result.error);
  }
}
```

### From Supabase Edge Function

Update [`supabase/functions/server/import-url.tsx`](../supabase/functions/server/import-url.tsx:1):

```typescript
export async function handleUrlImport(url: string) {
  try {
    // Call Python API
    const response = await fetch('http://localhost:5001/scrape', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
    });
    
    const result = await response.json();
    
    if (result.success) {
      // Transform to your RecipeData format
      const recipeData = {
        title: result.data.title,
        description: result.data.description,
        image_url: result.data.image,
        source_url: result.data.source_url,
        ingredients: result.data.ingredients.map((ing: string, idx: number) => ({
          amount: '',
          unit: '',
          name: ing,
          order: idx + 1
        })),
        steps: result.data.instructions.split('\n').map((step: string, idx: number) => ({
          order: idx + 1,
          text: step.trim()
        })).filter((s: any) => s.text),
        tags: [result.data.category, result.data.cuisine].filter(Boolean),
        confidence: result.data.confidence,
        yields: result.data.yields,
        total_time: result.data.total_time,
        prep_time: result.data.prep_time,
        cook_time: result.data.cook_time,
      };
      
      return { data: recipeData, error: null };
    } else {
      return { error: result.error, partial: null };
    }
  } catch (err) {
    return { error: 'Failed to scrape recipe', partial: null };
  }
}
```

## Docker Deployment

### Build the Image

```bash
cd python-scraper
docker build -t recipe-scraper .
```

### Run the Container

```bash
docker run -p 5001:5001 recipe-scraper
```

### Docker Compose

Create `docker-compose.yml`:

```yaml
version: '3.8'
services:
  recipe-scraper:
    build: ./python-scraper
    ports:
      - "5001:5001"
    restart: unless-stopped
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

## Production Deployment

For production, use Gunicorn with multiple workers:

```bash
gunicorn -w 4 -b 0.0.0.0:5001 app:app
```

### Environment Variables

```bash
export PORT=5001
export FLASK_ENV=production
export LOG_LEVEL=INFO
```

## Troubleshooting

### "Module not found" errors

Make sure the virtual environment is activated:
```bash
source venv/bin/activate
```

### Port already in use

Change the port in [`app.py`](app.py:213):
```python
app.run(host='0.0.0.0', port=5002, debug=True)
```

### CORS errors

The API has CORS enabled by default. If issues persist, check your request origin.

## Next Steps

- Read the full [README.md](README.md) for detailed API documentation
- Check [supported sites](http://localhost:5001/supported-sites)
- Explore the [recipe-scrapers documentation](https://github.com/hhursev/recipe-scrapers)

## Support

- **API Issues**: Check the logs with `python app.py`
- **Library Issues**: Visit [recipe-scrapers GitHub](https://github.com/hhursev/recipe-scrapers/issues)
- **Integration Help**: See the main [RECIPE_SCRAPER_INTEGRATION.md](../RECIPE_SCRAPER_INTEGRATION.md)