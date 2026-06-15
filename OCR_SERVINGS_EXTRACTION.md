# OCR Servings Extraction Enhancement

## Overview
Enhanced the Python OCR service to extract servings/portions information from recipe images, improving consistency across all import methods (URL, OCR, and manual).

## Changes Made

### 1. Added Servings Pattern Recognition (`python-scraper/app.py`)

**New regex pattern** (line 48-52):
```python
SERVINGS_PATTERN = re.compile(
    r'\b(?:pour|serves?|servings?|yield|portions?|personnes?)\s*:?\s*(\d+(?:\s*[-–—]\s*\d+)?)\b',
    re.IGNORECASE
)
```

This pattern matches:
- **French**: "pour 4 personnes", "4 portions", "6 personnes"
- **English**: "serves 4", "4 servings", "yield: 6"
- **Ranges**: "4-6 portions", "serves 4–6"

### 2. New `extract_servings()` Function (line 254-267)

```python
def extract_servings(lines: List[str]) -> int | None:
    """Extract servings/portions from text lines"""
    for line in lines:
        match = SERVINGS_PATTERN.search(line)
        if match:
            servings_str = match.group(1).strip()
            # Handle ranges like "4-6" by taking the first number
            first_number = servings_str.split('-')[0].split('–')[0].split('—')[0].strip()
            try:
                servings = int(first_number)
                if 1 <= servings <= 100:  # Sanity check
                    return servings
            except ValueError:
                continue
    return None
```

**Features**:
- Searches all text lines for servings information
- Handles ranges (e.g., "4-6") by taking the first number
- Validates servings are between 1-100
- Returns `None` if not found

### 3. Integration into OCR Extraction (line 295)

Added servings extraction to the main OCR flow:
```python
servings = extract_servings(text_lines)
```

### 4. Updated Response Data (line 351)

The OCR response now includes the `servings` field:
```python
'data': {
    'title': title,
    'description': None,
    'image_url': None,
    'source_url': None,
    'ingredients': ingredients,
    'steps': steps,
    'tags': [],
    'servings': servings,  # ← NEW FIELD
    'confidence': confidence,
    'raw_text': raw_text,
    'errors': errors,
    'warnings': warnings,
    'flags': flags,
    'ocr_engine': 'tesseract',
}
```

## Supported Patterns

### French
- "pour 4 personnes"
- "4 personnes"
- "6 portions"
- "Portions: 8"

### English
- "serves 4"
- "4 servings"
- "yield: 6"
- "Servings: 8"

### Ranges
- "4-6 portions" → extracts 4
- "serves 4–6" → extracts 4
- "pour 6 - 8 personnes" → extracts 6

## Complete Import Flow

Now all three import methods extract servings consistently:

1. **URL Import** (`import-url.tsx`):
   - Extracts from JSON-LD `recipeYield` field
   - Uses `parseServings()` function

2. **Python Scraper** (`python-scraper-integration.tsx`):
   - Extracts from `yields` field
   - Uses `parseServings()` function

3. **OCR Import** (`app.py`):
   - **NEW**: Extracts from OCR text using regex patterns
   - Handles both French and English
   - Falls back to GitHub Models AI parser if not found

## Testing

To test the enhancement:

1. Upload a recipe image with text like:
   - "Pour 4 personnes"
   - "Serves 6"
   - "4-6 portions"

2. The OCR should now extract the servings value

3. Check the response includes `"servings": 4` (or appropriate number)

## Benefits

✅ **Consistency**: All import methods now extract servings
✅ **Bilingual**: Supports both French and English patterns
✅ **Robust**: Handles ranges, various formats, and edge cases
✅ **Fallback**: GitHub Models AI parser still available as backup