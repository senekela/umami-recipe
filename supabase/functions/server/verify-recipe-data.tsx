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

const GITHUB_MODELS_API_KEY = Deno.env.get('GITHUB_MODELS_TOKEN');
const GITHUB_MODELS_ENDPOINT = 'https://models.inference.ai.azure.com/chat/completions';

/**
 * Verify and improve recipe data using GitHub Models
 */
export async function verifyRecipeData(recipeData: RecipeData): Promise<VerificationResult> {
  const startTime = Date.now();
  
  if (!GITHUB_MODELS_API_KEY) {
    console.warn('⚠️ GitHub Models API key not configured (GITHUB_MODELS_TOKEN missing)');
    console.warn('⚠️ Falling back to client-side filtering only');
    console.warn('⚠️ To enable AI cleaning: supabase secrets set GITHUB_MODELS_TOKEN=your_token');
    return createFallbackVerification(recipeData);
  }

  console.log('🤖 AI VERIFICATION STARTED');
  console.log(`📊 Input: ${recipeData.ingredients?.length || 0} ingredients, ${recipeData.steps?.length || 0} steps`);

  try {
    const prompt = buildVerificationPrompt(recipeData);
    
    console.log('🔄 Calling GitHub Models API (gpt-4o-mini)...');
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
            content: 'Tu es un filtre de données ultra-strict pour recettes de cuisine. MISSION: Éliminer TOUT ce qui n\'est pas une instruction culinaire pure ou un ingrédient alimentaire réel. SUPPRIMER SANS PITIÉ: liens, URLs, navigation, commentaires, partages sociaux, publicités, métadonnées, appels à l\'action, texte promotionnel. GARDER UNIQUEMENT: actions de cuisine concrètes (préchauffer, mélanger, cuire) et ingrédients alimentaires avec quantités. En cas de doute → SUPPRIMER. Qualité > Quantité. Sois IMPITOYABLE.'
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
      const errorText = await response.text();
      console.error('❌ GitHub Models API error:', response.status, errorText);
      console.error('❌ Falling back to client-side filtering');
      return createFallbackVerification(recipeData);
    }

    const result = await response.json();
    const content = result.choices?.[0]?.message?.content;
    
    if (!content) {
      console.error('❌ No content in GitHub Models response');
      console.error('❌ Falling back to client-side filtering');
      return createFallbackVerification(recipeData);
    }

    const verification = JSON.parse(content) as VerificationResult;
    const duration = Date.now() - startTime;
    
    console.log('✅ AI VERIFICATION COMPLETED');
    console.log(`⏱️  Duration: ${duration}ms`);
    console.log(`📊 Output: ${verification.improvements.ingredients?.length || 0} ingredients, ${verification.improvements.steps?.length || 0} steps`);
    console.log(`🎯 Confidence: ${Math.round(verification.confidence * 100)}%`);
    console.log(`⚠️  Issues found: ${verification.issues.length}`);
    
    // Calculate what was removed
    const ingredientsRemoved = (recipeData.ingredients?.length || 0) - (verification.improvements.ingredients?.length || 0);
    const stepsRemoved = (recipeData.steps?.length || 0) - (verification.improvements.steps?.length || 0);
    
    if (ingredientsRemoved > 0 || stepsRemoved > 0) {
      console.log(`🧹 Cleaned: ${ingredientsRemoved} ingredients, ${stepsRemoved} steps removed`);
    }
    
    // Ensure the verification result has the correct structure
    return normalizeVerificationResult(verification, recipeData);
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error('❌ Recipe verification error:', error);
    console.error(`⏱️  Failed after ${duration}ms`);
    console.error('❌ Falling back to client-side filtering');
    return createFallbackVerification(recipeData);
  }
}

/**
 * Build the verification prompt for GitHub Models
 */
function buildVerificationPrompt(recipeData: RecipeData): string {
  return `Tu es un expert en nettoyage de données de recettes. Ton rôle est d'ÉLIMINER IMPITOYABLEMENT toutes les données parasites et de ne garder QUE les informations culinaires pures.

**Données brutes à nettoyer:**
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

**RÈGLE ABSOLUE #0 - NE JAMAIS INVENTER DE DONNÉES:**
🚫 INTERDIT ABSOLU:
- N'AJOUTE JAMAIS de quantités qui ne sont pas dans les données d'origine
- N'INVENTE JAMAIS d'ingrédients supplémentaires
- NE MODIFIE JAMAIS les quantités existantes (200g reste 200g, pas 250g)
- NE COMPLÈTE JAMAIS les quantités manquantes par des suppositions
- Si une quantité est absente dans l'original → la laisser vide ("amount": "")
- Si un ingrédient n'a pas d'unité dans l'original → ne pas en inventer

✅ TON SEUL RÔLE: SUPPRIMER ce qui est invalide, PAS ajouter ou modifier

**MISSION CRITIQUE: FILTRAGE AGRESSIF (SUPPRESSION UNIQUEMENT)**

**1. ÉTAPES - SUPPRIMER TOUT CE QUI N'EST PAS UNE ACTION CULINAIRE:**
❌ SUPPRIMER IMMÉDIATEMENT:
- Liens et références: "Voir aussi", "Découvrez", "Consultez", "Retrouvez"
- Navigation: "Retour", "Suivant", "Page précédente", "Menu"
- Social/Partage: "Partager", "Commenter", "Liker", "Épingler", "Tweeter", "Facebook", "Instagram"
- Métadonnées: "Commentaires", "Avis", "Notes", "Évaluation", "Imprimer", "PDF"
- Publicité: "Sponsorisé", "Publicité", "Annonce", "Promotion"
- Appels à l'action: "Abonnez-vous", "Inscrivez-vous", "Newsletter", "S'inscrire"
- Texte promotionnel: "Découvrez nos", "Visitez notre", "Plus de recettes"
- Tout texte contenant des URLs (http://, https://, www.)
- Tout texte entre crochets avec parenthèses: [texte](url)
- Texte vide ou < 10 caractères
- Texte sans verbe d'action culinaire

✅ GARDER UNIQUEMENT:
- Actions culinaires claires: "Préchauffer", "Mélanger", "Cuire", "Ajouter", "Verser", "Battre"
- Instructions de préparation concrètes avec températures, durées, techniques
- Étapes qui décrivent une transformation d'ingrédients

**2. INGRÉDIENTS - SUPPRIMER TOUT CE QUI N'EST PAS ALIMENTAIRE:**
❌ SUPPRIMER IMMÉDIATEMENT:
- Tout texte contenant "http", "www", ".com", ".fr"
- Liens markdown: [texte](url)
- Texte promotionnel: "Découvrez", "Achetez", "Commandez"
- Métadonnées: "Ingrédients", "Liste", "Pour la recette"
- Texte vide ou sans nom d'ingrédient
- Lignes avec uniquement des chiffres ou symboles
- Tout ce qui n'est pas un aliment réel

✅ GARDER UNIQUEMENT (SANS MODIFICATION):
- Ingrédients alimentaires réels EXACTEMENT comme dans l'original
- Format: {amount: "200", unit: "g", name: "farine"}
- ⚠️ COPIE EXACTE des quantités: si l'original dit "200", tu écris "200" (pas "250", pas "2")
- ⚠️ Si amount est vide dans l'original → le laisser vide (ne pas inventer "1" ou "100")
- ⚠️ Si unit est vide dans l'original → le laisser vide (ne pas inventer "g" ou "pièce")
- Unités acceptées (si présentes): g, kg, ml, cl, l, cuillère à soupe, cuillère à café, tasse, pincée

**3. TITRE - NETTOYER AGRESSIVEMENT:**
❌ SUPPRIMER:
- URLs, liens, balises HTML
- Suffixes du site: "- Journal des Femmes", "| Marmiton", "- Recette"
- Caractères spéciaux: �, □, ▢, ◊
- Texte promotionnel

✅ GARDER:
- Nom de la recette uniquement, clair et concis

**4. DESCRIPTION - FILTRER:**
❌ SUPPRIMER:
- Appels à l'action marketing
- Liens vers d'autres recettes
- Métadonnées du site

✅ GARDER:
- Description culinaire pure de la recette
- Contexte culturel ou historique pertinent

**EXEMPLES CONCRETS:**

❌ ÉTAPES À SUPPRIMER:
- "Voir aussi: Tarte aux pommes facile"
- "Commentaires (127)"
- "Partagez cette recette sur Facebook"
- "Découvrez toutes nos recettes de desserts"
- "Retour aux recettes"
- "[Quiche lorraine](https://site.com/quiche)"
- "Abonnez-vous à notre newsletter"
- "★★★★☆ (4.5/5)"

❌ INGRÉDIENTS À SUPPRIMER:
- "Ingrédients pour 4 personnes:"
- "Découvrez nos produits sur https://..."
- "[Farine](https://boutique.com/farine)"
- "Pour la pâte:"
- ""
- "---"

✅ ÉTAPES À GARDER:
- "Préchauffer le four à 180°C (thermostat 6)"
- "Mélanger la farine et le sucre dans un saladier"
- "Battre les œufs en omelette et les incorporer"
- "Cuire 25 minutes jusqu'à ce que le dessus soit doré"

✅ INGRÉDIENTS À GARDER (COPIE EXACTE):
- Si original: {"amount": "200", "unit": "g", "name": "farine"} → GARDER TEL QUEL
- Si original: {"amount": "3", "unit": "", "name": "œufs"} → GARDER TEL QUEL (ne pas ajouter "pièces")
- Si original: {"amount": "", "unit": "", "name": "sel"} → GARDER TEL QUEL (ne pas inventer "1 pincée")
- Si original: {"amount": "1", "unit": "cuillère à soupe", "name": "sucre"} → GARDER TEL QUEL

❌ EXEMPLES D'HALLUCINATIONS INTERDITES:
- Original: {"amount": "", "unit": "", "name": "sel"} → ❌ NE PAS transformer en {"amount": "1", "unit": "pincée", "name": "sel"}
- Original: {"amount": "200", "unit": "g", "name": "farine"} → ❌ NE PAS changer en {"amount": "250", "unit": "g", "name": "farine"}
- Original: {"amount": "3", "unit": "", "name": "œufs"} → ❌ NE PAS ajouter {"amount": "3", "unit": "pièces", "name": "œufs"}

**FORMAT DE RÉPONSE (JSON strict):**
{
  "verified": true,
  "confidence": 0.85,
  "improvements": {
    "title": "Titre nettoyé (sans suffixes de site)",
    "description": "Description culinaire pure (ou null si vide)",
    "ingredients": [
      {"amount": "200", "unit": "g", "name": "farine"}
    ],
    "steps": [
      {"order": 1, "text": "Préchauffer le four à 180°C"}
    ],
    "servings": 4,
    "tags": ["dessert", "facile"]
  },
  "issues": [
    {
      "field": "steps",
      "severity": "info",
      "message": "Supprimé 3 étapes non-culinaires (liens, commentaires)",
      "suggestion": "Données nettoyées automatiquement"
    }
  ],
  "reasoning": "Nettoyage agressif: supprimé X étapes parasites, Y ingrédients invalides. Gardé uniquement les données culinaires pures."
}

**RÈGLES ABSOLUES:**
1. SUPPRIMER > 50% des données si nécessaire - qualité > quantité
2. En cas de MOINDRE doute → SUPPRIMER
3. Zéro tolérance pour: liens, URLs, navigation, social, publicité
4. Ne JAMAIS garder de texte promotionnel ou métadonnées
5. Chaque étape DOIT décrire une action culinaire concrète
6. Chaque ingrédient DOIT être un aliment réel
7. Renvoyer TOUJOURS les données nettoyées dans "improvements", même si peu de changements
8. Documenter dans "issues" ce qui a été supprimé et pourquoi
9. ⚠️ RÈGLE CRITIQUE: NE JAMAIS MODIFIER OU INVENTER des quantités/unités
10. ⚠️ COPIER EXACTEMENT les amount/unit des ingrédients valides (même si vides)

**RAPPEL FINAL - ANTI-HALLUCINATION:**
- Tu es un FILTRE (suppression), pas un GÉNÉRATEUR (ajout)
- COPIE les quantités exactes, N'INVENTE RIEN
- Si une donnée manque dans l'original → la laisser manquante
- Ton job: éliminer le bruit, PAS compléter les trous

**SOIS IMPITOYABLE DANS LA SUPPRESSION, MAIS FIDÈLE AUX DONNÉES ORIGINALES.**`;
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
 * Always applies AI-cleaned data and adds additional client-side filtering
 */
export function applyVerificationImprovements(
  originalData: RecipeData,
  verification: VerificationResult
): RecipeData {
  const improved = { ...originalData };
  
  // ALWAYS apply AI improvements if provided (AI has cleaned the data)
  if (verification.improvements.title) {
    improved.title = cleanTitle(verification.improvements.title);
  }
  
  if (verification.improvements.description !== undefined) {
    improved.description = verification.improvements.description;
  }
  
  // ALWAYS use AI-cleaned ingredients if provided
  if (verification.improvements.ingredients && verification.improvements.ingredients.length > 0) {
    improved.ingredients = filterIngredients(verification.improvements.ingredients);
  } else if (improved.ingredients) {
    // Fallback: apply client-side filtering to original ingredients
    improved.ingredients = filterIngredients(improved.ingredients);
  }
  
  // ALWAYS use AI-cleaned steps if provided
  if (verification.improvements.steps && verification.improvements.steps.length > 0) {
    improved.steps = filterSteps(verification.improvements.steps);
  } else if (improved.steps) {
    // Fallback: apply client-side filtering to original steps
    improved.steps = filterSteps(improved.steps);
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

/**
 * Clean title by removing site suffixes and unwanted characters
 */
function cleanTitle(title: string): string {
  return title
    .replace(/\s*[-|–—]\s*(Recette|Recipe|Marmiton|Journal des Femmes|Cuisine|AllRecipes).*$/i, '')
    .replace(/[�□▢◊]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Filter ingredients to remove non-food items and invalid entries
 */
function filterIngredients(
  ingredients: Array<{ amount: string; unit: string; name: string; group?: string }>
): Array<{ amount: string; unit: string; name: string; group?: string }> {
  const blacklistPatterns = [
    /https?:\/\//i,           // URLs
    /www\./i,                 // Website references
    /\[.*?\]\(.*?\)/,         // Markdown links
    /voir|découvr|consultez|retrouvez/i, // Navigation text
    /commentaire|partag|avis|note/i,     // Social/metadata
    /ingrédients?|liste|pour la/i,       // Section headers
    /^[-–—•*]+$/,             // Just symbols
    /^\s*$/,                  // Empty
  ];
  
  return ingredients.filter(ing => {
    // Must have a name
    if (!ing.name || ing.name.trim().length < 2) return false;
    
    // Check against blacklist patterns
    for (const pattern of blacklistPatterns) {
      if (pattern.test(ing.name)) return false;
    }
    
    // Must contain at least one letter
    if (!/[a-zA-Zàâäéèêëïîôöùûüÿç]/.test(ing.name)) return false;
    
    return true;
  }).map(ing => ({
    ...ing,
    name: ing.name.replace(/\[.*?\]\(.*?\)/g, '').trim(), // Remove any remaining markdown links
  }));
}

/**
 * Filter steps to remove non-cooking instructions
 */
function filterSteps(
  steps: Array<{ order: number; text: string }>
): Array<{ order: number; text: string }> {
  const blacklistPatterns = [
    /https?:\/\//i,                      // URLs
    /www\./i,                            // Website references
    /\[.*?\]\(.*?\)/,                    // Markdown links
    /voir aussi|découvrez|consultez|retrouvez|visitez/i, // Navigation
    /commentaire|partag|liker|épingl|tweet|facebook|instagram/i, // Social
    /abonn|inscri|newsletter|s'inscrire/i, // Calls to action
    /imprimer|pdf|télécharg/i,           // Print/download
    /★|☆|étoile|note|avis/i,             // Ratings
    /publicité|sponsorisé|annonce|promotion/i, // Ads
    /retour|suivant|précédent|menu|page/i, // Navigation
    /^[-–—•*]+$/,                        // Just symbols
  ];
  
  const culinaryVerbs = [
    /préchauff|chauff|cuir|mélang|ajout|vers|batt|fouett|incorpor|pétri|repos|refroid/i,
    /coup|hach|éminc|taill|râp|press|écras|mix|blend/i,
    /assaisonn|sal|poivr|épic|parfum|aromat/i,
    /enfour|grill|rôti|saut|fri|poêl|bouill|mijot|brais/i,
    /démoul|dress|serv|décor|garnir|napp|glac/i,
    /laiss|attend|vérifi|contrôl|surveill/i,
  ];
  
  return steps.filter(step => {
    const text = step.text.trim();
    
    // Must have substantial text
    if (text.length < 15) return false;
    
    // Check against blacklist patterns
    for (const pattern of blacklistPatterns) {
      if (pattern.test(text)) return false;
    }
    
    // Should contain at least one culinary verb (or be descriptive enough)
    const hasCulinaryVerb = culinaryVerbs.some(pattern => pattern.test(text));
    const isDescriptive = text.length > 30 && /[a-zA-Zàâäéèêëïîôöùûüÿç]{4,}/.test(text);
    
    if (!hasCulinaryVerb && !isDescriptive) return false;
    
    return true;
  })
  .map((step, index) => ({
    order: index + 1, // Reorder after filtering
    text: step.text.replace(/\[.*?\]\(.*?\)/g, '').trim(), // Remove markdown links
  }));
}

// Made with Bob