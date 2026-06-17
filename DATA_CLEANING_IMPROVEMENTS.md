# Data Cleaning Improvements for Recipe Import

## Overview

The recipe verification system has been significantly enhanced to **aggressively remove unnecessary and irrelevant data** from scraped recipes. The system now uses a multi-layered approach combining AI-powered cleaning with client-side filtering.

## What's New

### 1. **Enhanced AI Prompt (GitHub Models)**

The AI verification prompt has been completely rewritten to be **ultra-aggressive** in filtering out non-culinary content:

#### What Gets REMOVED:
- ❌ **Links & URLs**: All markdown links `[text](url)`, full URLs (`http://`, `https://`, `www.`)
- ❌ **Navigation**: "Voir aussi", "Retour", "Suivant", "Menu", "Page précédente"
- ❌ **Social Media**: "Partager", "Commenter", "Liker", "Facebook", "Instagram", "Twitter"
- ❌ **Metadata**: "Commentaires (127)", "Avis", "Notes", "★★★★☆", "Imprimer", "PDF"
- ❌ **Advertising**: "Sponsorisé", "Publicité", "Annonce", "Promotion"
- ❌ **Calls to Action**: "Abonnez-vous", "Inscrivez-vous", "Newsletter", "Découvrez nos"
- ❌ **Promotional Text**: "Visitez notre site", "Plus de recettes", "Achetez maintenant"
- ❌ **HTML/Special Characters**: `<div>`, `</p>`, `�`, `□`, `▢`
- ❌ **Empty/Invalid Data**: Steps < 10 characters, ingredients without names

#### What Gets KEPT:
- ✅ **Culinary Actions**: "Préchauffer", "Mélanger", "Cuire", "Ajouter", "Battre"
- ✅ **Real Ingredients**: Food items with quantities and units
- ✅ **Cooking Instructions**: Steps describing actual food preparation
- ✅ **Clean Titles**: Recipe names without site suffixes

### 2. **Client-Side Filtering Functions**

Three new filtering functions provide a safety net even when AI cleaning isn't available:

#### `cleanTitle(title: string)`
Removes:
- Site suffixes: "- Marmiton", "| Journal des Femmes", "- Recette"
- Special characters: `�`, `□`, `▢`, `◊`
- Extra whitespace

#### `filterIngredients(ingredients)`
Removes ingredients containing:
- URLs or website references
- Markdown links
- Navigation text ("voir", "découvrez", "consultez")
- Social/metadata text ("commentaire", "partager", "avis")
- Section headers ("Ingrédients", "Liste", "Pour la")
- Empty or symbol-only entries

Keeps only:
- Entries with actual food names (≥2 characters)
- Entries containing letters (not just numbers/symbols)

#### `filterSteps(steps)`
Removes steps containing:
- URLs or website references
- Markdown links
- Navigation text
- Social media references
- Calls to action
- Print/download prompts
- Ratings/reviews
- Advertising
- Steps < 15 characters

Keeps only:
- Steps with culinary verbs (préchauffer, mélanger, cuire, etc.)
- Descriptive steps > 30 characters with meaningful content
- Steps are automatically reordered after filtering

### 3. **Always-Apply Strategy**

The `applyVerificationImprovements()` function now:
- **ALWAYS applies AI-cleaned data** when available (no conditional checks)
- **Falls back to client-side filtering** if AI cleaning isn't available
- **Applies both layers** for maximum data quality
- **Documents all changes** in the `issues` array

## Example Transformations

### Before Cleaning:
```json
{
  "title": "Tarte aux pommes - Recette facile | Marmiton",
  "steps": [
    {"order": 1, "text": "Préchauffer le four à 180°C"},
    {"order": 2, "text": "Voir aussi: [Quiche lorraine](https://site.com/quiche)"},
    {"order": 3, "text": "Commentaires (127)"},
    {"order": 4, "text": "Partager cette recette sur Facebook"},
    {"order": 5, "text": "Mélanger la farine et le sucre"},
    {"order": 6, "text": "Abonnez-vous à notre newsletter"}
  ],
  "ingredients": [
    {"amount": "200", "unit": "g", "name": "farine"},
    {"amount": "", "unit": "", "name": "Ingrédients pour 4 personnes:"},
    {"amount": "", "unit": "", "name": "[Sucre](https://boutique.com/sucre)"},
    {"amount": "3", "unit": "", "name": "œufs"}
  ]
}
```

### After Cleaning:
```json
{
  "title": "Tarte aux pommes",
  "steps": [
    {"order": 1, "text": "Préchauffer le four à 180°C"},
    {"order": 2, "text": "Mélanger la farine et le sucre"}
  ],
  "ingredients": [
    {"amount": "200", "unit": "g", "name": "farine"},
    {"amount": "3", "unit": "", "name": "œufs"}
  ]
}
```

**Result**: 4 out of 6 steps removed (67% reduction), 2 out of 4 ingredients removed (50% reduction), title cleaned.

## Configuration

### AI Model Settings
- **Model**: `gpt-4o-mini` (GitHub Models)
- **Temperature**: `0.2` (very low for consistent, conservative cleaning)
- **Max Tokens**: `2500`
- **Response Format**: JSON object

### Environment Variables
- `GITHUB_TOKEN`: Required for AI-powered verification
- Falls back to client-side filtering if not configured

## Quality Metrics

The system now prioritizes **quality over quantity**:

- **Confidence Scoring**: Adjusted based on data quality after cleaning
- **Issue Tracking**: Documents what was removed and why
- **Warnings**: Alerts users when significant data was filtered
- **Flags**: Marks fields that need manual review

## Testing Recommendations

Test with problematic recipe sites that include:
1. Heavy navigation elements
2. Social sharing buttons in content
3. Comment sections mixed with instructions
4. Promotional text and ads
5. Markdown links in steps/ingredients
6. Site metadata in titles

## Benefits

1. **Cleaner Drafts**: Users receive recipes with only relevant cooking information
2. **Better UX**: No need to manually remove navigation/social elements
3. **Higher Quality**: Focus on actual recipe content, not site chrome
4. **Consistent Results**: Both AI and client-side filtering ensure quality
5. **Transparent**: Users see what was removed in the verification logs

## Future Enhancements

Potential improvements:
- Add language-specific filtering patterns (English, Spanish, etc.)
- Machine learning to identify new spam patterns
- User feedback loop to improve filtering rules
- Whitelist for trusted recipe sites with clean data
- Custom filtering rules per user preference

---

**Made with Bob** - Aggressive data cleaning for pristine recipe imports