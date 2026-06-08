# French Language Support

The recipe scraper has been configured to fully support French recipes from both URLs and photos.

## Features

### 1. French OCR Support
- Tesseract OCR configured with French language data (`fra+eng`)
- Recognizes French accented characters: àâäéèêëïîôùûüÿç
- Processes both French and English text simultaneously

### 2. French Recipe Pattern Recognition

#### Ingredient Headers
Recognizes both English and French:
- `Ingrédients` / `Ingrédient`
- `Ingredients` / `Ingredient`

#### Step Headers
Recognizes:
- `Préparation`
- `Étapes` / `Étape`
- `Recette`
- `Instructions`
- `Directions`
- `Method`
- `Steps`

#### French Units
Supports common French cooking units:
- `cuillère` / `cuillères` (spoon/spoons)
- `c.à.s` / `càs` / `cs` (tablespoon)
- `c.à.c` / `càc` / `cc` (teaspoon)
- `gramme` / `grammes` (gram/grams)
- `litre` / `litres` (liter/liters)
- `millilitre` / `millilitres` (milliliter/milliliters)
- `cl` (centiliter)
- `dl` (deciliter)
- `pincée` (pinch)
- `gousse` / `gousses` (clove/cloves)
- `tranche` / `tranches` (slice/slices)

Plus all standard metric units: g, kg, ml, l

## Configuration

### Environment Variables
- `TESSERACT_LANG`: Set to `fra+eng` (default) for French+English support
- Can be changed to `fra` for French-only or `eng` for English-only

### System Requirements
The deployment installs:
- `tesseract-ocr` (base OCR engine)
- `tesseract-ocr-fra` (French language data)
- `tesseract-ocr-eng` (English language data)

## Usage

### URL Scraping
Works automatically with French recipe websites. The `recipe-scrapers` library supports many French cooking sites.

### Photo OCR
Simply upload a photo of a French recipe. The system will:
1. Detect French text with accents
2. Recognize French ingredient and step headers
3. Parse French cooking units
4. Extract recipe structure

## Examples

### French Recipe Headers Detected
```
Ingrédients:
- 200g de farine
- 3 cuillères à soupe de sucre
- 1 pincée de sel

Préparation:
1. Mélanger la farine et le sucre
2. Ajouter le sel
```

### Mixed Language Support
The system can handle recipes that mix French and English terms, which is common in modern French cooking blogs.

## Testing

To test French OCR locally:
```bash
# Install Tesseract with French support
# macOS:
brew install tesseract tesseract-lang

# Ubuntu/Debian:
sudo apt-get install tesseract-ocr tesseract-ocr-fra

# Test the API
curl -X POST http://localhost:5001/ocr \
  -F "image=@french_recipe.jpg"