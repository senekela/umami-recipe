import { load } from 'npm:cheerio';
import { tryPythonScraper } from './python-scraper-integration.tsx';
import { tryFirecrawl } from './firecrawl-integration.tsx';
import { verifyRecipeData, applyVerificationImprovements } from './verify-recipe-data.tsx';

/**
 * Enhanced URL import with multiple scraping methods
 *
 * This implementation tries multiple methods in order:
 * 1. Python recipe-scrapers library (highest accuracy, 376+ sites)
 * 2. Firecrawl browser-based scraping (for JS-heavy sites)
 * 3. JSON-LD structured data (TypeScript fallback)
 * 4. Microdata/RDFa markup (TypeScript fallback)
 * 5. Common HTML patterns (TypeScript fallback)
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
  servings?: number | null;
  total_time?: string;
  prep_time?: string;
  cook_time?: string;
}

export async function handleUrlImport(url: string) {
  try {
    let scrapedData: RecipeData | null = null;
    let scrapingMethod = '';
    const logs: string[] = [];

    // Try Python scraper first (highest confidence for supported sites)
    logs.push('🔍 Attempting Python scraper (recipe-scrapers library)...');
    const pythonResult = await tryPythonScraper(url);
    if (pythonResult && pythonResult.confidence >= 0.9) {
      logs.push('✅ Python scraper succeeded with high confidence');
      console.log('✅ Python scraper succeeded with high confidence');
      scrapedData = pythonResult;
      scrapingMethod = 'python-scraper';
    } else if (pythonResult) {
      logs.push(`⚠️ Python scraper returned low confidence (${Math.round(pythonResult.confidence * 100)}%)`);
    } else {
      logs.push('❌ Python scraper failed or site not supported');
    }

    // Try Firecrawl for JavaScript-heavy sites or when Python fails
    if (!scrapedData) {
      logs.push('🔍 Attempting Firecrawl browser-based scraping...');
      console.log('⚠️ Trying Firecrawl browser-based scraping');
      const firecrawlResult = await tryFirecrawl(url);
      if (firecrawlResult && firecrawlResult.confidence >= 0.7) {
        logs.push('✅ Firecrawl succeeded');
        console.log('✅ Firecrawl succeeded');
        scrapedData = firecrawlResult;
        scrapingMethod = 'firecrawl';
      } else if (firecrawlResult) {
        logs.push(`⚠️ Firecrawl returned low confidence (${Math.round(firecrawlResult.confidence * 100)}%)`);
      } else {
        logs.push('❌ Firecrawl failed');
      }
    }

    // Fallback to TypeScript scraper
    if (!scrapedData) {
      logs.push('🔍 Falling back to TypeScript scraper...');
      console.log('⚠️ Falling back to TypeScript scraper');
      scrapingMethod = 'typescript-scraper';
      
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
      logs.push('  → Trying JSON-LD structured data...');
      const jsonLdData = extractJsonLd($);
      if (jsonLdData) {
        logs.push('  ✅ Found JSON-LD data (confidence: 95%)');
        result = { ...result, ...jsonLdData };
        result.confidence = 0.95;
        scrapedData = result;
      } else {
        logs.push('  ❌ No JSON-LD data found');
      }

      // Method 2: Try Microdata/RDFa
      if (!scrapedData) {
        logs.push('  → Trying Microdata/RDFa...');
        const microdataResult = extractMicrodata($);
        if (microdataResult) {
          logs.push('  ✅ Found Microdata (confidence: 85%)');
          result = { ...result, ...microdataResult };
          result.confidence = 0.85;
          scrapedData = result;
        } else {
          logs.push('  ❌ No Microdata found');
        }
      }

      // Method 3: Try site-specific extractors
      if (!scrapedData) {
        const hostname = new URL(url).hostname;
        logs.push(`  → Trying site-specific extractor for ${hostname}...`);
        if (hostname.includes('journaldesfemmes.fr')) {
          const jdfResult = extractJournalDesFemmes($);
          if (jdfResult) {
            logs.push('  ✅ Site-specific extractor succeeded (confidence: 75%)');
            result = { ...result, ...jdfResult };
            result.confidence = 0.75;
            scrapedData = result;
          } else {
            logs.push('  ❌ Site-specific extractor failed');
          }
        } else {
          logs.push('  ⚠️ No site-specific extractor available');
        }
      }

      // Method 4: Try common HTML patterns (fallback)
      if (!scrapedData) {
        logs.push('  → Trying common HTML patterns...');
        const htmlPatternResult = extractFromHtmlPatterns($);
        if (htmlPatternResult) {
          logs.push('  ✅ Found data via HTML patterns (confidence: 60%)');
          result = { ...result, ...htmlPatternResult };
          result.confidence = 0.6;
          scrapedData = result;
        } else {
          logs.push('  ❌ No HTML patterns matched');
        }
      }

      // Method 5: Basic metadata extraction
      if (!scrapedData) {
        logs.push('  → Extracting basic metadata only...');
        result.title = $('title').text().split('|')[0].split('-')[0].trim() || 'Untitled Recipe';
        result.description = $('meta[name="description"]').attr('content') ||
                            $('meta[property="og:description"]').attr('content') || null;
        result.image_url = $('meta[property="og:image"]').attr('content') ||
                          $('meta[name="twitter:image"]').attr('content') || null;
        result.confidence = 0.3;
        result.errors.push('No structured recipe data found. Please fill in the fields manually.');
        logs.push('  ⚠️ Only basic metadata extracted (confidence: 30%)');
        scrapedData = result;
      }
    }

    // If we still don't have data, return error
    if (!scrapedData) {
      return {
        error: 'Could not extract recipe data from this URL',
        partial: null
      };
    }

    // Step: Verify and improve the scraped data with GitHub Models
    logs.push(`\n🔍 Verifying recipe data (scraped via ${scrapingMethod})...`);
    console.log(`🔍 Verifying recipe data (scraped via ${scrapingMethod})...`);
    const verification = await verifyRecipeData(scrapedData);
    
    logs.push(`✓ Verification complete: ${verification.verified ? 'PASSED' : 'NEEDS REVIEW'}`);
    logs.push(`  Confidence: ${Math.round(verification.confidence * 100)}%`);
    logs.push(`  Issues found: ${verification.issues.length}`);
    if (verification.reasoning) {
      logs.push(`  Reasoning: ${verification.reasoning}`);
    }
    
    console.log(`✓ Verification complete: ${verification.verified ? 'PASSED' : 'NEEDS REVIEW'}`);
    console.log(`  Confidence: ${Math.round(verification.confidence * 100)}%`);
    console.log(`  Issues found: ${verification.issues.length}`);
    console.log(`  Reasoning: ${verification.reasoning}`);

    // Apply verification improvements
    const verifiedData = applyVerificationImprovements(scrapedData, verification);
    
    // Add scraping logs to the warnings array
    verifiedData.errors = [...(verifiedData.errors || []), ...logs];

    return { data: verifiedData, error: null };
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
          servings: parseServings(recipe.recipeYield || recipe.yield || null),
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

function parseServings(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return Math.max(1, Math.round(value));
  }

  if (typeof value === 'string') {
    const match = value.match(/\d+(?:[.,]\d+)?/);
    if (!match) return null;

    const parsed = Number.parseFloat(match[0].replace(',', '.'));
    if (!Number.isFinite(parsed)) return null;

    return Math.max(1, Math.round(parsed));
  }

  if (Array.isArray(value)) {
    for (const item of value) {
      const parsed = parseServings(item);
      if (parsed) return parsed;
    }
  }

  return null;
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

function extractJournalDesFemmes($: any): Partial<RecipeData> | null {
  // Journal des Femmes specific extraction
  const ingredients: string[] = [];
  const instructions: string[] = [];
  
  // Find ingredients section - look for container with ingredient data
  const ingredientContainer = $('.recipe-ingredients, .ingredients-list, [class*="ingredient"]').first();
  if (ingredientContainer.length > 0) {
    // Try to find individual ingredient rows/items
    const ingredientItems = ingredientContainer.find('li, .ingredient-item, [class*="ingredient-line"]');
    if (ingredientItems.length > 0) {
      ingredientItems.each((_: number, el: any) => {
        const text = $(el).text().trim();
        // Filter out headers and empty items
        if (text &&
            text.length > 2 &&
            !text.toLowerCase().includes('ingrédient') &&
            /[a-zA-Zàâäéèêëïîôöùûüÿç]/.test(text)) {
          ingredients.push(text);
        }
      });
    } else {
      // Fallback: try to extract from text content
      const fullText = ingredientContainer.text();
      const lines = fullText.split(/\n+/).map((line: string) => line.trim()).filter(Boolean);
      for (const line of lines) {
        if (line.length > 2 &&
            !line.toLowerCase().includes('ingrédient') &&
            /[a-zA-Zàâäéèêëïîôöùûüÿç]/.test(line) &&
            (/\d/.test(line) || /\b(g|kg|ml|cl|l|cuillère|botte|tranche|pincée)\b/i.test(line))) {
          ingredients.push(line);
        }
      }
    }
  }
  
  // Find instructions section
  const instructionContainer = $('.recipe-instructions, .preparation, [class*="instruction"], [class*="preparation"]').first();
  if (instructionContainer.length > 0) {
    // Try to find individual instruction steps
    const instructionItems = instructionContainer.find('li, p, .step, [class*="step"]');
    if (instructionItems.length > 0) {
      instructionItems.each((_: number, el: any) => {
        const text = $(el).text().trim();
        // Filter out headers and short items
        if (text &&
            text.length > 20 &&
            !text.toLowerCase().includes('préparation') &&
            !text.toLowerCase().includes('étape')) {
          instructions.push(text);
        }
      });
    } else {
      // Fallback: split text content into sentences
      const fullText = instructionContainer.text();
      const sentences = fullText.split(/[.!?]+/).map((s: string) => s.trim()).filter(Boolean);
      for (const sentence of sentences) {
        if (sentence.length > 20) {
          instructions.push(sentence);
        }
      }
    }
  }
  
  // If we didn't find much, try alternative selectors
  if (ingredients.length === 0) {
    // Look for any elements that might contain ingredient info
    $('[class*="ingredient"], [id*="ingredient"]').each((_: number, el: any) => {
      const text = $(el).text().trim();
      if (text &&
          text.length > 5 &&
          text.length < 200 &&
          !text.toLowerCase().includes('ingrédient') &&
          /[a-zA-Zàâäéèêëïîôöùûüÿç]/.test(text) &&
          (/\d/.test(text) || /\b(g|kg|ml|cl|l|cuillère|botte|tranche|pincée)\b/i.test(text))) {
        ingredients.push(text);
      }
    });
  }
  
  if (instructions.length === 0) {
    // Look for any elements that might contain instruction info
    $('[class*="step"], [class*="instruction"], [class*="preparation"]').each((_: number, el: any) => {
      const text = $(el).text().trim();
      if (text &&
          text.length > 30 &&
          text.length < 1000 &&
          !text.toLowerCase().includes('préparation') &&
          !text.toLowerCase().includes('étape')) {
        instructions.push(text);
      }
    });
  }
  
  // Deduplicate and clean up
  const uniqueIngredients = [...new Set(ingredients)].slice(0, 20); // Limit to reasonable number
  const uniqueInstructions = [...new Set(instructions)].slice(0, 15);
  
  if (uniqueIngredients.length === 0 && uniqueInstructions.length === 0) {
    return null;
  }
  
  return {
    ingredients: parseIngredientsFrench(uniqueIngredients),
    steps: parseInstructions(uniqueInstructions),
  };
}

function parseIngredientsFrench(ingredients: string[]): Array<{ amount: string; unit: string; name: string }> {
  return ingredients.map(ing => {
    // Enhanced regex for French ingredients
    // Handles patterns like: "300 g de farine", "1 botte d'asperges", "2 cuillères à soupe de sucre"
    const match = ing.match(/^([\d\/\.\s\-¼½¾⅓⅔⅛⅜⅝⅞]+)?\s*(g|kg|ml|cl|l|cuillères?\s+à\s+soupe|cuillères?\s+à\s+café|c\.?\s*à\s*s\.?|c\.?\s*à\s*c\.?|botte|tranche|tranches|pincée|pincées|gousse|gousses|pot|pots)?\s*(?:de\s+|d')?(.+)$/i);
    
    if (match) {
      return {
        amount: match[1]?.trim() || '',
        unit: match[2]?.trim() || '',
        name: match[3]?.trim() || ing
      };
    }
    
    // Fallback: simpler pattern without "de/d'"
    const simpleMatch = ing.match(/^([\d\/\.\s\-¼½¾⅓⅔⅛⅜⅝⅞]+)?\s*([a-zA-Zàâäéèêëïîôöùûüÿç\.]+)?\s*(.+)$/);
    if (simpleMatch && simpleMatch[3]) {
      return {
        amount: simpleMatch[1]?.trim() || '',
        unit: simpleMatch[2]?.trim() || '',
        name: simpleMatch[3]?.trim()
      };
    }
    
    // If no pattern matches, return the whole string as the ingredient name
    return { amount: '', unit: '', name: ing.trim() };
  });
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
