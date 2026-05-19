# Recipe Scraper Integration Guide

## Overview

The URL import functionality has been enhanced to use recipe-scrapers methodology for extracting recipe data from websites. This implementation follows the approach from [hhursev/recipe-scrapers](https://github.com/hhursev/recipe-scrapers).

## Implementation Details

### Enhanced Import Strategy

The [`import-url.tsx`](supabase/functions/server/import-url.tsx:1) edge function now uses a multi-layered extraction approach:

1. **JSON-LD Structured Data** (95% confidence)
   - Primary method for extracting recipe data
   - Supports `@type: "Recipe"` schema.org markup
   - Handles `@graph` arrays and nested structures
   - Extracts: title, description, image, ingredients, instructions, tags, timing

2. **Microdata/RDFa** (85% confidence)
   - Fallback for sites using `itemtype="schema.org/Recipe"`
   - Parses `itemprop` attributes for recipe data

3. **HTML Pattern Matching** (60% confidence)
   - Searches for common CSS classes and IDs
   - Patterns: `.ingredient`, `.instruction`, `#ingredients`, etc.

4. **Basic Metadata** (30% confidence)
   - Last resort: extracts title, description, and image from meta tags
   - Requires manual data entry

## Key Features

### Ingredient Parsing
Enhanced regex pattern handles:
- Fractions: "1/2 cup flour"
- Decimals: "1.5 cups sugar"
- Ranges: "2-3 cloves garlic"
- Units: cups, tbsp, tsp, oz, etc.
- Plain text: "Salt to taste"

### Instruction Parsing
Supports multiple formats:
- Plain text strings
- `HowToStep` objects
- `HowToSection` with nested steps
- Numbered or bulleted lists

### Tag Extraction
Automatically extracts:
- Recipe categories (e.g., "Dessert", "Main Course")
- Cuisines (e.g., "Italian", "Mexican")
- Keywords from recipe metadata

## Usage

The import functionality is already integrated into the app:

1. Navigate to `/import`
2. Enter a recipe URL
3. Click "Import"
4. The system will extract recipe data and create a draft

## Supported Sites

This implementation works with any site that uses:
- Schema.org Recipe markup (JSON-LD or Microdata)
- Common recipe HTML patterns
- Standard meta tags

Popular recipe sites typically supported:
- AllRecipes
- Food Network
- Bon Appétit
- Serious Eats
- NYT Cooking
- And many more...

## Error Handling

The system provides clear feedback:
- **95% confidence**: Full recipe data extracted successfully
- **85% confidence**: Most data extracted, minor gaps possible
- **60% confidence**: Partial data, review recommended
- **30% confidence**: Minimal data, manual entry required

## Future Enhancements

Potential improvements:
1. Add support for more HTML patterns
2. Implement nutrition data extraction
3. Add recipe rating/review extraction
4. Support for video instructions
5. Multi-language recipe support

## Technical Notes

- Runs as a Supabase Edge Function (Deno runtime)
- Uses Cheerio for HTML parsing
- Follows recipe-scrapers extraction patterns
- Handles various schema.org Recipe formats
- Graceful degradation for unsupported sites

## Testing

To test the import functionality:

```bash
# Start the development server
pnpm dev

# Navigate to http://localhost:5173/import
# Try importing from popular recipe sites
```

## Related Files

- [`supabase/functions/server/import-url.tsx`](supabase/functions/server/import-url.tsx:1) - Main import logic
- [`src/pages/Import.tsx`](src/pages/Import.tsx:1) - Import UI component
- [`src/lib/types/recipe.ts`](src/lib/types/recipe.ts:1) - Recipe type definitions

## References

- [recipe-scrapers GitHub](https://github.com/hhursev/recipe-scrapers)
- [Schema.org Recipe](https://schema.org/Recipe)
- [JSON-LD](https://json-ld.org/)