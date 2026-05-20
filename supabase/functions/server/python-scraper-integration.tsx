/**
 * Python Recipe Scraper Integration
 * 
 * This module provides a simple way to use the Python recipe-scrapers library
 * from your Supabase Edge Function. It automatically falls back to the existing
 * TypeScript scraper if the Python API is unavailable.
 */

const PYTHON_SCRAPER_URL = Deno.env.get('PYTHON_SCRAPER_URL') || 'https://umami-recipe.onrender.com';

interface PythonScraperResponse {
  success: boolean;
  data?: {
    title: string;
    ingredients: string[];
    instructions: string;
    total_time?: number;
    yields?: string;
    image?: string;
    host?: string;
    nutrients?: Record<string, any>;
    canonical_url?: string;
    confidence: number;
    source_url: string;
  };
  error?: string;
}

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

/**
 * Try to scrape recipe using Python API
 * Returns null if Python API is unavailable or fails
 */
export async function tryPythonScraper(url: string): Promise<RecipeData | null> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

    const response = await fetch(`${PYTHON_SCRAPER_URL}/scrape`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      console.log(`Python scraper returned ${response.status}`);
      return null;
    }

    const result: PythonScraperResponse = await response.json();

    if (!result.success || !result.data) {
      console.log('Python scraper failed:', result.error);
      return null;
    }

    // Transform Python scraper data to RecipeData format
    return transformPythonRecipe(result.data);
  } catch (error) {
    // Python API not available or timeout - this is expected in some environments
    console.log('Python scraper unavailable:', error.message);
    return null;
  }
}

/**
 * Transform Python scraper response to RecipeData format
 */
function transformPythonRecipe(data: PythonScraperResponse['data']): RecipeData {
  if (!data) {
    throw new Error('No data provided');
  }

  return {
    title: data.title || null,
    description: null, // Python scraper doesn't provide description
    image_url: data.image || null,
    source_url: data.source_url,
    ingredients: parseIngredients(data.ingredients || []),
    steps: parseInstructions(data.instructions || ''),
    tags: [],
    confidence: data.confidence || 0.95,
    yields: data.yields || null,
    total_time: data.total_time ? `${data.total_time}` : null,
    prep_time: null,
    cook_time: null,
    raw_text: null,
    errors: [],
  };
}

/**
 * Parse ingredient strings into structured format
 */
function parseIngredients(ingredients: string[]): Array<{ amount: string; unit: string; name: string }> {
  return ingredients.map(ing => {
    // Enhanced regex to handle fractions, decimals, and ranges
    const match = ing.match(/^([\d\/\.\s\-]+)?\s*([a-zA-Zéèêëàâäôöûüçñ]+)?\s*(.+)$/);
    
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

/**
 * Parse instruction text into structured steps
 */
function parseInstructions(instructions: string): Array<{ order: number; text: string }> {
  return instructions
    .split(/\n+/)
    .map((step, idx) => ({
      order: idx + 1,
      text: step.trim()
    }))
    .filter(s => s.text.length > 0);
}

/**
 * Check if Python scraper is available
 */
export async function isPythonScraperAvailable(): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000); // 2s timeout

    const response = await fetch(`${PYTHON_SCRAPER_URL}/health`, {
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Get list of supported sites from Python scraper
 */
export async function getSupportedSites(): Promise<string[]> {
  try {
    const response = await fetch(`${PYTHON_SCRAPER_URL}/supported-sites`);
    if (!response.ok) return [];
    
    const result = await response.json();
    return result.data?.all_sites || [];
  } catch {
    return [];
  }
}

// Made with Bob
