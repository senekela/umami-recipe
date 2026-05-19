# Recipe Scraper Python API

A Flask-based REST API that uses the [recipe-scrapers](https://github.com/hhursev/recipe-scrapers) library to extract recipe data from 200+ recipe websites.

## Features

- ✅ Supports 200+ recipe websites out of the box
- ✅ Extracts structured recipe data (ingredients, instructions, timing, etc.)
- ✅ RESTful API with CORS support
- ✅ High confidence extraction (95%+)
- ✅ No bot protection circumvention - works with publicly accessible recipes
- ✅ Compatible with Python 3.8+

## Installation

### Prerequisites

- Python 3.8 or higher
- pip (Python package manager)

### Setup

1. Navigate to the python-scraper directory:
```bash
cd python-scraper
```

2. Create a virtual environment (recommended):
```bash
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
```

3. Install dependencies:
```bash
pip install -r requirements.txt
```

## Usage

### Development Server

Start the Flask development server:

```bash
python app.py
```

The API will be available at `http://localhost:5001`

### Production Server

For production, use Gunicorn:

```bash
gunicorn -w 4 -b 0.0.0.0:5001 app:app
```

## API Endpoints

### 1. Health Check

Check if the service is running.

**Endpoint:** `GET /health`

**Response:**
```json
{
  "status": "healthy",
  "service": "recipe-scraper"
}
```

### 2. Scrape Recipe

Extract recipe data from a URL.

**Endpoint:** `POST /scrape`

**Request Body:**
```json
{
  "url": "https://www.allrecipes.com/recipe/158968/spinach-and-feta-turkey-burgers/"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "title": "Spinach and Feta Turkey Burgers",
    "total_time": 30,
    "yields": "4 servings",
    "ingredients": [
      "1 pound ground turkey",
      "1 (10 ounce) package frozen chopped spinach, thawed and squeezed dry",
      "4 ounces crumbled feta cheese",
      "..."
    ],
    "instructions": "Step-by-step instructions...",
    "image": "https://example.com/image.jpg",
    "host": "allrecipes.com",
    "canonical_url": "https://www.allrecipes.com/recipe/158968/",
    "confidence": 0.95,
    "description": "Recipe description...",
    "prep_time": 15,
    "cook_time": 15,
    "nutrients": {
      "calories": "250",
      "protein": "25g",
      "..."
    },
    "ratings": 4.5,
    "author": "Chef Name",
    "cuisine": "American",
    "category": "Main Course"
  },
  "error": null
}
```

**Error Response:**
```json
{
  "success": false,
  "data": null,
  "error": "Error message here"
}
```

### 3. Supported Sites

Get a list of popular supported recipe sites.

**Endpoint:** `GET /supported-sites`

**Response:**
```json
{
  "success": true,
  "data": {
    "popular_sites": [
      "allrecipes.com",
      "foodnetwork.com",
      "..."
    ],
    "total_supported": "200+",
    "documentation": "https://github.com/hhursev/recipe-scrapers#scrapers-available-for"
  }
}
```

### 4. Test Endpoint

Test the scraper with a sample recipe.

**Endpoint:** `GET /test?url=<optional_url>`

**Example:**
```bash
curl "http://localhost:5001/test"
```

## Integration with Your App

### Option 1: Direct API Calls

Call the Python API from your TypeScript/JavaScript code:

```typescript
async function scrapeRecipe(url: string) {
  const response = await fetch('http://localhost:5001/scrape', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ url }),
  });
  
  const result = await response.json();
  return result;
}
```

### Option 2: Supabase Edge Function Integration

Update your `import-url.tsx` to call the Python API:

```typescript
// In supabase/functions/server/import-url.tsx
export async function handleUrlImport(url: string) {
  try {
    const response = await fetch('http://your-python-api:5001/scrape', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
    });
    
    const result = await response.json();
    
    if (result.success) {
      // Transform the data to match your RecipeData interface
      return { data: transformRecipeData(result.data), error: null };
    } else {
      return { error: result.error, partial: null };
    }
  } catch (err) {
    return { error: 'Failed to scrape recipe', partial: null };
  }
}
```

## Supported Websites

The recipe-scrapers library supports 200+ websites including:

- AllRecipes
- BBC Food
- Bon Appétit
- Budget Bytes
- Cookie and Kate
- Epicurious
- Food Network
- Jamie Oliver
- King Arthur Baking
- Minimalist Baker
- Serious Eats
- Simply Recipes
- Smitten Kitchen
- The Kitchn
- The Pioneer Woman
- And many more...

For the complete list, visit: https://github.com/hhursev/recipe-scrapers#scrapers-available-for

## Error Handling

The API handles various error scenarios:

- **Invalid URL format**: Returns 400 Bad Request
- **Scraping failure**: Returns 422 Unprocessable Entity with error details
- **Server errors**: Returns 500 Internal Server Error

## Deployment

### Docker (Recommended)

Create a `Dockerfile`:

```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY app.py .

EXPOSE 5001

CMD ["gunicorn", "-w", "4", "-b", "0.0.0.0:5001", "app:app"]
```

Build and run:
```bash
docker build -t recipe-scraper .
docker run -p 5001:5001 recipe-scraper
```

### Cloud Platforms

- **Heroku**: Add a `Procfile` with `web: gunicorn app:app`
- **Railway**: Automatically detects Python and runs the app
- **Render**: Configure with `gunicorn app:app` as the start command
- **AWS/GCP/Azure**: Deploy as a containerized application

## Environment Variables

Optional environment variables:

- `PORT`: Server port (default: 5001)
- `FLASK_ENV`: Set to `production` for production deployments
- `LOG_LEVEL`: Logging level (default: INFO)

## Limitations

- This package does **not** circumvent or bypass bot protection measures
- Only works with publicly accessible recipe pages
- Some websites may require specific user agents or headers
- Rate limiting may apply depending on the target website

## Troubleshooting

### Import errors during development

The import errors you see in VSCode are expected if you haven't installed the dependencies yet. Run:

```bash
pip install -r requirements.txt
```

### Connection refused

Make sure the Flask server is running:

```bash
python app.py
```

### CORS errors

The API has CORS enabled by default. If you still encounter CORS issues, check your request headers and origin.

## License

This API wrapper is provided as-is. The recipe-scrapers library is licensed under the MIT License.

## Contributing

To add new features or fix bugs:

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## Support

For issues with:
- **This API wrapper**: Open an issue in this repository
- **recipe-scrapers library**: Visit https://github.com/hhursev/recipe-scrapers/issues
- **Specific website scraping**: Check if the site is supported in the recipe-scrapers documentation