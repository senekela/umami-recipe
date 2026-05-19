import { load } from 'npm:cheerio';
import { tryPythonScraper } from './python-scraper-integration.tsx';

/**
 * Enhanced URL import with Python recipe-scrapers integration
 *
 * This implementation tries multiple methods in order:
 * 1. Python recipe-scrapers library (highest accuracy, 376+ sites)
 * 2. JSON-LD structured data (TypeScript fallback)
 * 3. Microdata/RDFa markup (TypeScript fallback)
 * 4. Common HTML patterns (TypeScript fallback)
 */

interface RecipeData {
  title: string | null;
  description: string | null;
  image_url: string | null;
  source_url: string;
  ingredients: Array<{ amount: string; unit: string; name: string; group?: string }>;
  steps: Array<{ order: number; text: string }>;
  tags: string[];
  confidence: number;
  raw_text: string | null;
  errors: string[];
  yields?: string;
  total_time?: string;
  prep_time?: string;
  cook_time?: string;
}

export async function handleUrlImport(url: string) {
  try {
    // Try Python scraper first (highest confidence for supported sites)
    const pythonResult = await tryPythonScraper(url);
    if (pythonResult && pythonResult.confidence >= 0.9) {
      console.log('✅ Python scraper succeeded with high confidence');
      return { data: pythonResult, error: null };
    }

    // Fallback to TypeScript scraper
    console.log('⚠️ Falling back to TypeScript scraper');
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; UmamiBot/1.0; +https://umami.app/bot)',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
      }
    });

    if (!response.ok) {
      return {
        error: `Couldn't reach that URL (${response.status}). Is it publicly accessible?`,
        partial: null
      };
    }

    const html = await response.text();
    const $ = load(html);

    let result: RecipeData = {
      title: null,
      description: null,
      image_url: null,
      source_url: url,
      ingredients: [],
      steps: [],
      tags: [],
      confidence: 0.5,
      raw_text: null,
      errors: []
    };

    // Method 1: Try JSON-LD structured data (most reliable)
    const jsonLdData = extractJsonLd($);
    if (jsonLdData) {
      result = { ...result, ...jsonLdData };
      result.confidence = 0.95;
      return { data: result, error: null };
    }

    // Method 2: Try Microdata/RDFa
    const microdataResult = extractMicrodata($);
    if (microdataResult) {
      result = { ...result, ...microdataResult };
      result.confidence = 0.85;
      return { data: result, error: null };
    }

    // Method 3: Try common HTML patterns (fallback)
    const htmlPatternResult = extractFromHtmlPatterns($);
    if (htmlPatternResult) {
      result = { ...result, ...htmlPatternResult };
      result.confidence = 0.6;
      return { data: result, error: null };
    }

    // Method 4: Basic metadata extraction
    result.title = $('title').text().split('|')[0].split('-')[0].trim() || 'Untitled Recipe';
    result.description = $('meta[name="description"]').attr('content') || 
                        $('meta[property="og:description"]').attr('content') || null;
    result.image_url = $('meta[property="og:image"]').attr('content') || 
                      $('meta[name="twitter:image"]').attr('content') || null;
    result.confidence = 0.3;
    result.errors.push('No structured recipe data found. Please fill in the fields manually.');

    return { data: result, error: null };
  } catch (err) {
    console.error('URL import error:', err);
    return {
      error: 'Unexpected error while importing recipe. Please try again.',
      partial: null
    };
  }
}

function extractJsonLd($: any): Partial<RecipeData> | null {
  const jsonLdScripts = $('script[type="application/ld+json"]').toArray();
  
  for (const script of jsonLdScripts) {
    try {
      const data = JSON.parse($(script).html() || '{}');
      
      // Handle @graph arrays
      const recipes = data['@graph'] 
        ? data['@graph'].filter((item: any) => item['@type'] === 'Recipe')
        : [data];
      
      const recipe = recipes.find((item: any) => item['@type'] === 'Recipe');
      
      if (recipe) {
        return {
          title: recipe.name || null,
          description: recipe.description || null,
          image_url: extractImageUrl(recipe.image),
          ingredients: parseIngredients(recipe.recipeIngredient || []),
          steps: parseInstructions(recipe.recipeInstructions || []),
          tags: extractTags(recipe),
          yields: recipe.recipeYield || recipe.yield || null,
          total_time: recipe.totalTime || null,
          prep_time: recipe.prepTime || null,
          cook_time: recipe.cookTime || null,
        };
      }
    } catch (e) {
      // Continue to next script tag
      continue;
    }
  }
  
  return null;
}

function extractMicrodata($: any): Partial<RecipeData> | null {
  const recipeEl = $('[itemtype*="schema.org/Recipe"]').first();
  
  if (recipeEl.length === 0) return null;
  
  const getItemprop = (prop: string) => 
    recipeEl.find(`[itemprop="${prop}"]`).first().text().trim();
  
  const ingredients = recipeEl.find('[itemprop="recipeIngredient"]')
    .toArray()
    .map((el: any) => $(el).text().trim())
    .filter(Boolean);
  
  const instructions = recipeEl.find('[itemprop="recipeInstructions"]')
    .toArray()
    .map((el: any) => $(el).text().trim())
    .filter(Boolean);
  
  if (ingredients.length === 0 && instructions.length === 0) return null;
  
  return {
    title: getItemprop('name') || null,
    description: getItemprop('description') || null,
    image_url: recipeEl.find('[itemprop="image"]').attr('src') || null,
    ingredients: parseIngredients(ingredients),
    steps: parseInstructions(instructions),
  };
}

function extractFromHtmlPatterns($: any): Partial<RecipeData> | null {
  // Common class/id patterns for ingredients
  const ingredientSelectors = [
    '.ingredient', '.ingredients li', '[class*="ingredient"]',
    '#ingredients li', '.recipe-ingredients li'
  ];
  
  // Common class/id patterns for instructions
  const instructionSelectors = [
    '.instruction', '.instructions li', '[class*="instruction"]',
    '#instructions li', '.recipe-instructions li', '.step'
  ];
  
  let ingredients: string[] = [];
  let instructions: string[] = [];
  
  for (const selector of ingredientSelectors) {
    const items = $(selector).toArray().map((el: any) => $(el).text().trim()).filter(Boolean);
    if (items.length > 0) {
      ingredients = items;
      break;
    }
  }
  
  for (const selector of instructionSelectors) {
    const items = $(selector).toArray().map((el: any) => $(el).text().trim()).filter(Boolean);
    if (items.length > 0) {
      instructions = items;
      break;
    }
  }
  
  if (ingredients.length === 0 && instructions.length === 0) return null;
  
  return {
    ingredients: parseIngredients(ingredients),
    steps: parseInstructions(instructions),
  };
}

function extractImageUrl(image: any): string | null {
  if (!image) return null;
  if (typeof image === 'string') return image;
  if (Array.isArray(image)) return image[0]?.url || image[0] || null;
  return image.url || image['@id'] || null;
}

function parseIngredients(ingredients: string[]): Array<{ amount: string; unit: string; name: string }> {
  return ingredients.map(ing => {
    // Enhanced regex to handle fractions, decimals, and ranges
    const match = ing.match(/^([\d\/\.\s\-]+)?\s*([a-zA-Z]+)?\s*(.+)$/);
    
    if (match) {
      return {
        amount: match[1]?.trim() || '',
        unit: match[2]?.trim() || '',
        name: match[3]?.trim() || ing
      };
    }
    
    return { amount: '', unit: '', name: ing.trim() };
  });
}

function parseInstructions(instructions: any[]): Array<{ order: number; text: string }> {
  return instructions.map((step: any, idx: number) => {
    let text = '';
    
    if (typeof step === 'string') {
      text = step;
    } else if (step.text) {
      text = step.text;
    } else if (step['@type'] === 'HowToStep') {
      text = step.text || step.name || '';
    } else if (step['@type'] === 'HowToSection') {
      // Handle sections with multiple steps
      const sectionSteps = step.itemListElement || [];
      text = sectionSteps.map((s: any) => s.text || s.name || '').join(' ');
    }
    
    return {
      order: idx + 1,
      text: text.trim()
    };
  }).filter(step => step.text.length > 0);
}

function extractTags(recipe: any): string[] {
  const tags: string[] = [];
  
  if (recipe.recipeCategory) {
    const categories = Array.isArray(recipe.recipeCategory) 
      ? recipe.recipeCategory 
      : [recipe.recipeCategory];
    tags.push(...categories);
  }
  
  if (recipe.recipeCuisine) {
    const cuisines = Array.isArray(recipe.recipeCuisine)
      ? recipe.recipeCuisine
      : [recipe.recipeCuisine];
    tags.push(...cuisines);
  }
  
  if (recipe.keywords) {
    const keywords = typeof recipe.keywords === 'string'
      ? recipe.keywords.split(',').map((k: string) => k.trim())
      : recipe.keywords;
    tags.push(...keywords);
  }
  
  return [...new Set(tags)].filter(Boolean);
}

// Made with Bob
