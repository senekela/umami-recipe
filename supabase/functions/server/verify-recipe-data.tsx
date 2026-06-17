/**
 * Recipe Data Verification with GitHub Models (GPT-4.1 micro)
 * 
 * This module verifies and improves parsed recipe data after initial scraping.
 * It acts as a quality control layer to ensure data accuracy and completeness.
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
  warnings?: string[];
  flags?: Array<{ field: string; severity: string; message: string }>;
}

interface VerificationResult {
  verified: boolean;
  confidence: number;
  improvements: {
    title?: string;
    description?: string;
    ingredients?: Array<{ amount: string; unit: string; name: string; group?: string }>;
    steps?: Array<{ order: number; text: string }>;
    servings?: number;
    tags?: string[];
  };
  issues: Array<{
    field: string;
    severity: 'error' | 'warning' | 'info';
    message: string;
    suggestion?: string;
  }>;
  reasoning: string;
}

const GITHUB_MODELS_API_KEY = Deno.env.get('GITHUB_TOKEN');
const GITHUB_MODELS_ENDPOINT = 'https://models.inference.ai.azure.com/chat/completions';

/**
 * Verify and improve recipe data using GitHub Models
 */
export async function verifyRecipeData(recipeData: RecipeData): Promise<VerificationResult> {
  if (!GITHUB_MODELS_API_KEY) {
    console.warn('GitHub Models API key not configured, skipping verification');
    return createFallbackVerification(recipeData);
  }

  try {
    const prompt = buildVerificationPrompt(recipeData);
    
    const response = await fetch(GITHUB_MODELS_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${GITHUB_MODELS_API_KEY}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini', // Using GPT-4o mini (similar to 4.1 micro)
        messages: [
          {
            role: 'system',
            content: 'You are a recipe data verification expert. Your job is to validate and improve parsed recipe data, ensuring accuracy, completeness, and proper formatting.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.3, // Low temperature for consistent verification
        max_tokens: 2000,
        response_format: { type: 'json_object' }
      }),
    });

    if (!response.ok) {
      console.error('GitHub Models API error:', response.status, await response.text());
      return createFallbackVerification(recipeData);
    }

    const result = await response.json();
    const content = result.choices?.[0]?.message?.content;
    
    if (!content) {
      console.error('No content in GitHub Models response');
      return createFallbackVerification(recipeData);
    }

    const verification = JSON.parse(content) as VerificationResult;
    
    // Ensure the verification result has the correct structure
    return normalizeVerificationResult(verification, recipeData);
  } catch (error) {
    console.error('Recipe verification error:', error);
    return createFallbackVerification(recipeData);
  }
}

/**
 * Build the verification prompt for GitHub Models
 */
function buildVerificationPrompt(recipeData: RecipeData): string {
  return `Verify and improve the following parsed recipe data. Analyze each field for accuracy, completeness, and proper formatting.

**Recipe Data:**
\`\`\`json
${JSON.stringify({
  title: recipeData.title,
  description: recipeData.description,
  ingredients: recipeData.ingredients,
  steps: recipeData.steps,
  servings: recipeData.servings,
  tags: recipeData.tags,
  source_url: recipeData.source_url
}, null, 2)}
\`\`\`

**Your Task:**
1. Verify the title is clear, concise, and properly formatted
2. Check if ingredients are properly parsed with amount, unit, and name
3. Validate that steps are in logical order and complete
4. Ensure servings is a reasonable number (if present)
5. Verify tags are relevant and properly categorized
6. Identify any missing or incorrect data

**Response Format (JSON only):**
{
  "verified": boolean,
  "confidence": number (0-1),
  "improvements": {
    "title": "improved title if needed",
    "description": "improved description if needed",
    "ingredients": [{"amount": "1", "unit": "cup", "name": "flour"}],
    "steps": [{"order": 1, "text": "improved step"}],
    "servings": number,
    "tags": ["tag1", "tag2"]
  },
  "issues": [
    {
      "field": "ingredients",
      "severity": "error|warning|info",
      "message": "Description of the issue",
      "suggestion": "How to fix it"
    }
  ],
  "reasoning": "Brief explanation of your verification and improvements"
}

**Important:**
- Only include fields in "improvements" that need changes
- Be conservative - don't change data that's already correct
- Focus on fixing parsing errors, not rewriting content
- Identify critical issues that would prevent recipe from working
- Provide actionable suggestions for manual review`;
}

/**
 * Normalize verification result to ensure proper structure
 */
function normalizeVerificationResult(
  verification: Partial<VerificationResult>,
  originalData: RecipeData
): VerificationResult {
  return {
    verified: verification.verified ?? true,
    confidence: Math.max(0, Math.min(1, verification.confidence ?? originalData.confidence)),
    improvements: verification.improvements ?? {},
    issues: Array.isArray(verification.issues) ? verification.issues : [],
    reasoning: verification.reasoning ?? 'Verification completed'
  };
}

/**
 * Create a fallback verification when GitHub Models is unavailable
 */
function createFallbackVerification(recipeData: RecipeData): VerificationResult {
  const issues: VerificationResult['issues'] = [];
  
  // Basic validation checks
  if (!recipeData.title || recipeData.title.length < 3) {
    issues.push({
      field: 'title',
      severity: 'error',
      message: 'Title is missing or too short',
      suggestion: 'Add a descriptive recipe title'
    });
  }
  
  if (!recipeData.ingredients || recipeData.ingredients.length === 0) {
    issues.push({
      field: 'ingredients',
      severity: 'error',
      message: 'No ingredients found',
      suggestion: 'Add recipe ingredients manually'
    });
  } else {
    // Check for ingredients without names
    const invalidIngredients = recipeData.ingredients.filter(ing => !ing.name || ing.name.trim().length === 0);
    if (invalidIngredients.length > 0) {
      issues.push({
        field: 'ingredients',
        severity: 'warning',
        message: `${invalidIngredients.length} ingredient(s) missing names`,
        suggestion: 'Review and complete ingredient information'
      });
    }
  }
  
  if (!recipeData.steps || recipeData.steps.length === 0) {
    issues.push({
      field: 'steps',
      severity: 'error',
      message: 'No preparation steps found',
      suggestion: 'Add recipe instructions manually'
    });
  }
  
  if (!recipeData.servings || recipeData.servings < 1) {
    issues.push({
      field: 'servings',
      severity: 'warning',
      message: 'Servings information missing or invalid',
      suggestion: 'Specify number of servings'
    });
  }
  
  return {
    verified: issues.filter(i => i.severity === 'error').length === 0,
    confidence: recipeData.confidence,
    improvements: {},
    issues,
    reasoning: 'Basic validation performed (GitHub Models unavailable)'
  };
}

/**
 * Apply verification improvements to recipe data
 */
export function applyVerificationImprovements(
  originalData: RecipeData,
  verification: VerificationResult
): RecipeData {
  const improved = { ...originalData };
  
  // Apply improvements
  if (verification.improvements.title) {
    improved.title = verification.improvements.title;
  }
  
  if (verification.improvements.description) {
    improved.description = verification.improvements.description;
  }
  
  if (verification.improvements.ingredients && verification.improvements.ingredients.length > 0) {
    improved.ingredients = verification.improvements.ingredients;
  }
  
  if (verification.improvements.steps && verification.improvements.steps.length > 0) {
    improved.steps = verification.improvements.steps;
  }
  
  if (verification.improvements.servings) {
    improved.servings = verification.improvements.servings;
  }
  
  if (verification.improvements.tags && verification.improvements.tags.length > 0) {
    improved.tags = verification.improvements.tags;
  }
  
  // Update confidence based on verification
  improved.confidence = verification.confidence;
  
  // Add verification warnings and flags
  improved.warnings = improved.warnings || [];
  improved.flags = improved.flags || [];
  
  for (const issue of verification.issues) {
    if (issue.severity === 'warning' || issue.severity === 'error') {
      improved.warnings.push(`${issue.field}: ${issue.message}`);
      improved.flags.push({
        field: issue.field,
        severity: issue.severity,
        message: issue.suggestion || issue.message
      });
    }
  }
  
  // Add verification metadata
  improved.errors = improved.errors || [];
  if (!verification.verified) {
    improved.errors.push('Recipe data verification found critical issues. Manual review required.');
  }
  
  return improved;
}

// Made with Bob