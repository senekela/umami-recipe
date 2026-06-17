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
            content: 'Tu es un expert en nettoyage et vérification de données de recettes. Ton rôle est de filtrer impitoyablement les données parasites (liens, commentaires, navigation, publicités) et de ne garder QUE les vraies instructions de cuisine et les vrais ingrédients. Supprime tout ce qui n\'est pas directement lié à la préparation de la recette.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.2, // Very low temperature for consistent, conservative cleaning
        max_tokens: 2500,
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
  return `Tu es un expert en vérification de données de recettes. Ton travail est de nettoyer, valider et améliorer les données de recettes extraites, en éliminant toutes les données corrompues ou illisibles.

**Données de recette brutes (peuvent contenir du bruit):**
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

**Ta mission:**
1. **NETTOYER les données corrompues:**
   - Supprimer TOUS les liens markdown: [texte](url) → garder uniquement "texte"
   - Supprimer les URLs complètes: https://...
   - Supprimer les balises HTML: <div>, </p>, etc.
   - Supprimer les caractères spéciaux illisibles: �, □, etc.
   - Supprimer les métadonnées du site: "Commentaires", "Partager", "Imprimer", etc.

2. **FILTRER les étapes:**
   - GARDER UNIQUEMENT les vraies instructions de cuisine
   - SUPPRIMER: commentaires, publicités, navigation, métadonnées
   - SUPPRIMER: "Voir les commentaires", "Partager la recette", "Imprimer", etc.
   - SUPPRIMER: textes promotionnels ou non-culinaires

3. **FILTRER les ingrédients:**
   - GARDER UNIQUEMENT les vrais ingrédients alimentaires
   - SUPPRIMER: liens, publicités, textes parasites
   - Standardiser les unités: c → tasse, cs → cuillère à soupe, cc → cuillère à café

4. **Vérifier le titre:**
   - Nettoyer les caractères parasites
   - Supprimer les URLs ou liens
   - Garder un titre clair et concis

**Exemples de nettoyage:**

❌ MAUVAIS (à supprimer):
- Étape: "Voir aussi: [quiche](https://cuisine.journaldesfemmes.fr/recette-quiche)"
- Étape: "Commentaires (45)"
- Étape: "Partager cette recette sur Facebook"
- Ingrédient: "Découvrez nos autres recettes sur https://..."

✅ BON (à garder):
- Étape: "Préchauffer le four à 180°C"
- Étape: "Mélanger la farine et le sucre dans un saladier"
- Ingrédient: "200 g de farine"
- Ingrédient: "3 œufs"

**Format de réponse (JSON uniquement):**
{
  "verified": boolean,
  "confidence": number (0-1),
  "improvements": {
    "title": "titre nettoyé si nécessaire",
    "description": "description nettoyée si nécessaire",
    "ingredients": [
      {"amount": "200", "unit": "g", "name": "farine"},
      {"amount": "3", "unit": "", "name": "œufs"}
    ],
    "steps": [
      {"order": 1, "text": "Préchauffer le four à 180°C"},
      {"order": 2, "text": "Mélanger la farine et le sucre"}
    ],
    "servings": number,
    "tags": ["dessert", "facile"]
  },
  "issues": [
    {
      "field": "steps",
      "severity": "error|warning|info",
      "message": "Description du problème",
      "suggestion": "Comment le corriger"
    }
  ],
  "reasoning": "Explication brève de la vérification et des améliorations"
}

**RÈGLES STRICTES:**
- Supprimer TOUTES les données non-culinaires (liens, commentaires, navigation)
- Ne garder QUE les vraies étapes de préparation
- Ne garder QUE les vrais ingrédients alimentaires
- Nettoyer tous les liens markdown et URLs
- Être impitoyable: en cas de doute, SUPPRIMER
- Focus sur la qualité, pas la quantité
- Si une étape ou un ingrédient semble suspect, le SUPPRIMER`;
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