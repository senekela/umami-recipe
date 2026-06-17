/**
 * Firecrawl Integration for Recipe Scraping
 * 
 * Firecrawl provides browser-based scraping with JavaScript rendering,
 * making it ideal for sites that don't work well with traditional scrapers.
 * 
 * Usage:
 * - No API key needed for basic usage (rate limited)
 * - Add FIRECRAWL_API_KEY environment variable for higher limits
 */

interface FirecrawlResponse {
  success: boolean;
  data?: {
    markdown?: string;
    html?: string;
    metadata?: {
      title?: string;
      description?: string;
      ogImage?: string;
      [key: string]: any;
    };
  };
  error?: string;
}

interface RecipeData {
  title: string | null;
  description: string | null;
  image_url: string | null;
  source_url: string;
  ingredients: Array<{ amount: string; unit: string; name: string }>;
  steps: Array<{ order: number; text: string }>;
  tags: string[];
  confidence: number;
  raw_text: string | null;
  errors: string[];
  servings?: number | null;
}

/**
 * Try to scrape a recipe using Firecrawl
 * This is useful for JavaScript-heavy sites or sites with anti-scraping measures
 */
export async function tryFirecrawl(url: string): Promise<RecipeData | null> {
  try {
    console.log('🔥 Attempting Firecrawl scrape for:', url);
    
    const apiKey = Deno.env.get('FIRECRAWL_API_KEY');
    const apiUrl = 'https://api.firecrawl.dev/v1/scrape';
    
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    if (apiKey) {
      headers['Authorization'] = `Bearer ${apiKey}`;
    }
    
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        url,
        formats: ['markdown', 'html'],
        onlyMainContent: true,
      }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Firecrawl API error:', response.status, errorText);
      
      // If it's a rate limit or auth issue, return null to try other methods
      if (response.status === 429 || response.status === 401) {
        console.log('⚠️ Firecrawl rate limit or auth issue, falling back');
        return null;
      }
      
      return null;
    }
    
    const result: FirecrawlResponse = await response.json();
    
    if (!result.success || !result.data) {
      console.log('⚠️ Firecrawl returned unsuccessful result');
      return null;
    }
    
    const { markdown, html, metadata } = result.data;
    
    // Extract recipe data from markdown and HTML
    const recipeData = extractRecipeFromFirecrawl(
      markdown || '',
      html || '',
      metadata || {},
      url
    );
    
    if (recipeData && (recipeData.ingredients.length > 0 || recipeData.steps.length > 0)) {
      console.log('✅ Firecrawl successfully extracted recipe data');
      return recipeData;
    }
    
    console.log('⚠️ Firecrawl did not find sufficient recipe data');
    return null;
    
  } catch (error) {
    console.error('Firecrawl error:', error);
    return null;
  }
}

/**
 * Extract recipe data from Firecrawl's markdown and HTML output
 */
function extractRecipeFromFirecrawl(
  markdown: string,
  html: string,
  metadata: Record<string, any>,
  sourceUrl: string
): RecipeData {
  const lines = markdown.split('\n').map(line => line.trim()).filter(Boolean);
  
  const result: RecipeData = {
    title: metadata.title || extractTitle(lines) || 'Untitled Recipe',
    description: metadata.description || null,
    image_url: metadata.ogImage || null,
    source_url: sourceUrl,
    ingredients: extractIngredientsFromMarkdown(lines),
    steps: extractStepsFromMarkdown(lines),
    tags: [],
    confidence: 0.7, // Firecrawl provides good content but may need parsing
    raw_text: markdown,
    errors: [],
    servings: extractServings(markdown),
  };
  
  // Adjust confidence based on what we found
  if (result.ingredients.length >= 3 && result.steps.length >= 2) {
    result.confidence = 0.85;
  } else if (result.ingredients.length === 0 && result.steps.length === 0) {
    result.confidence = 0.3;
    result.errors.push('Could not extract ingredients or steps from page content');
  }
  
  return result;
}

/**
 * Extract title from markdown lines
 */
function extractTitle(lines: string[]): string | null {
  // Look for markdown headers
  for (const line of lines) {
    if (line.startsWith('# ')) {
      return line.substring(2).trim();
    }
  }
  
  // Look for first substantial line
  for (const line of lines) {
    if (line.length >= 10 && line.length <= 100 && !line.includes('http')) {
      return line;
    }
  }
  
  return null;
}

/**
 * Extract ingredients from markdown content
 */
function extractIngredientsFromMarkdown(lines: string[]): Array<{ amount: string; unit: string; name: string }> {
  const ingredients: Array<{ amount: string; unit: string; name: string }> = [];
  let inIngredientsSection = false;
  
  const ingredientHeaders = /^#+\s*(ingredients?|ingrédients?)/i;
  const stepHeaders = /^#+\s*(instructions?|directions?|method|steps?|préparation|étapes?)/i;
  
  for (const line of lines) {
    // Check for section headers
    if (ingredientHeaders.test(line)) {
      inIngredientsSection = true;
      continue;
    }
    
    if (stepHeaders.test(line)) {
      inIngredientsSection = false;
      continue;
    }
    
    if (!inIngredientsSection) continue;
    
    // Parse ingredient lines (usually start with -, *, or numbers)
    const cleanLine = line.replace(/^[-*•]\s*/, '').replace(/^\d+\.\s*/, '').trim();
    
    if (cleanLine.length < 3) continue;
    
    // Try to parse amount, unit, and name
    const match = cleanLine.match(/^([\d\/\.\s\-¼½¾⅓⅔⅛⅜⅝⅞]+)?\s*([a-zA-Zàâäéèêëïîôöùûüÿç\.]+)?\s*(?:de\s+|d')?(.+)$/i);
    
    if (match) {
      ingredients.push({
        amount: match[1]?.trim() || '',
        unit: match[2]?.trim() || '',
        name: match[3]?.trim() || cleanLine,
      });
    } else {
      ingredients.push({
        amount: '',
        unit: '',
        name: cleanLine,
      });
    }
  }
  
  return ingredients;
}

/**
 * Extract steps from markdown content
 */
function extractStepsFromMarkdown(lines: string[]): Array<{ order: number; text: string }> {
  const steps: Array<{ order: number; text: string }> = [];
  let inStepsSection = false;
  let stepOrder = 1;
  
  const stepHeaders = /^#+\s*(instructions?|directions?|method|steps?|préparation|étapes?)/i;
  
  for (const line of lines) {
    // Check for section headers
    if (stepHeaders.test(line)) {
      inStepsSection = true;
      continue;
    }
    
    if (!inStepsSection) continue;
    
    // Parse step lines (usually start with -, *, or numbers)
    const cleanLine = line.replace(/^[-*•]\s*/, '').replace(/^\d+\.\s*/, '').trim();
    
    // Steps should be substantial text
    if (cleanLine.length < 20) continue;
    
    steps.push({
      order: stepOrder++,
      text: cleanLine,
    });
  }
  
  return steps;
}

/**
 * Extract servings from text
 */
function extractServings(text: string): number | null {
  const servingsPattern = /\b(?:pour|serves?|servings?|yield|portions?|personnes?)\s*:?\s*(\d+(?:\s*[-–—]\s*\d+)?)\b/i;
  const match = text.match(servingsPattern);
  
  if (match) {
    const servingsStr = match[1].trim();
    const firstNumber = servingsStr.split(/[-–—]/)[0].trim();
    const servings = parseInt(firstNumber, 10);
    
    if (servings >= 1 && servings <= 100) {
      return servings;
    }
  }
  
  return null;
}

// Made with Bob