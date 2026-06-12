"""
Recipe Scraper API
A Flask-based REST API for scraping recipes from various cooking websites
and extracting recipe text from images with Tesseract OCR.
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
from recipe_scrapers import scrape_html
import requests
from typing import Dict, Any, List
import logging
import os
import re
from io import BytesIO

from PIL import Image, ImageOps, ImageEnhance

try:
    import pytesseract
except ImportError:  # pragma: no cover - handled at runtime
    pytesseract = None

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

# Configuration
app.config['JSON_SORT_KEYS'] = False
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024

# Support both English and French patterns
INGREDIENT_HEADER_PATTERN = re.compile(
    r'\b(ingredients?|ingrédients?)\b',
    re.IGNORECASE
)
STEP_HEADER_PATTERN = re.compile(
    r'\b(directions?|instructions?|method|steps?|préparation|étapes?|recette)\b',
    re.IGNORECASE
)
INGREDIENT_LINE_PATTERN = re.compile(r'^([\d¼½¾⅓⅔⅛⅜⅝⅞\/\.\s]+)?\s*([a-zA-Zàâäéèêëïîôùûüÿç]+)?\s+(.+)$')
NUMBERED_STEP_PATTERN = re.compile(r'^(\d+)[\.\):]\s*(.+)$')
UNIT_HINT_PATTERN = re.compile(
    r'\b(cup|cups|tbsp|tablespoon|tablespoons|tsp|teaspoon|teaspoons|oz|ounce|ounces|lb|lbs|pound|pounds|'
    r'g|gram|grams|kg|ml|l|cl|dl|pinch|clove|cloves|'
    r'cuillère|cuillères|c\.à\.s|c\.à\.c|càs|càc|cs|cc|'
    r'gramme|grammes|litre|litres|millilitre|millilitres|'
    r'pincée|gousse|gousses|tranche|tranches)\b',
    re.IGNORECASE,
)

def check_tesseract_available():
    """Check if Tesseract OCR is available"""
    if pytesseract is None:
        raise RuntimeError(
            'pytesseract is not installed. Add pytesseract to python-scraper/requirements.txt.'
        )
    
    try:
        # Test if tesseract binary is available
        pytesseract.get_tesseract_version()
    except Exception as e:
        raise RuntimeError(
            f'Tesseract OCR binary not found. Install tesseract-ocr system package. Error: {str(e)}'
        )


def scrape_recipe(url: str) -> Dict[str, Any]:
    """Scrape a recipe from the given URL"""
    try:
        headers = {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
        }
        response = requests.get(url, headers=headers, timeout=10)
        response.raise_for_status()

        scraper = scrape_html(html=response.content, org_url=url)

        recipe_data = {
            'title': scraper.title(),
            'total_time': scraper.total_time(),
            'yields': scraper.yields(),
            'ingredients': scraper.ingredients(),
            'instructions': scraper.instructions(),
            'image': scraper.image(),
            'host': scraper.host(),
            'nutrients': scraper.nutrients(),
            'canonical_url': scraper.canonical_url(),
            'confidence': 1.0,
            'source_url': url
        }

        recipe_data = {k: v for k, v in recipe_data.items() if v is not None}

        return {'success': True, 'data': recipe_data}

    except Exception as e:
        logger.error(f"Error scraping recipe from {url}: {str(e)}")
        return {'success': False, 'error': str(e), 'url': url}


def preprocess_image_bytes(image_bytes: bytes) -> Image.Image:
    """Preprocess image for better OCR results"""
    image = Image.open(BytesIO(image_bytes))
    
    # Convert to grayscale
    image = image.convert('L')
    
    # Enhance contrast
    enhancer = ImageEnhance.Contrast(image)
    image = enhancer.enhance(2.0)
    
    # Resize if too large
    max_width = 2000
    if image.width > max_width:
        ratio = max_width / float(image.width)
        new_height = max(1, int(image.height * ratio))
        image = image.resize((max_width, new_height), Image.Resampling.LANCZOS)
    
    return image


def extract_text_with_tesseract(image: Image.Image) -> str:
    """Extract text from image using Tesseract OCR with French language support"""
    check_tesseract_available()
    
    # Use pytesseract to extract text
    # PSM 6 = Assume a single uniform block of text
    # Support both French and English (fra+eng)
    lang = os.environ.get('TESSERACT_LANG', 'fra+eng')
    custom_config = r'--oem 3 --psm 6'
    text = pytesseract.image_to_string(image, lang=lang, config=custom_config)
    
    return text.strip()


def find_title(lines: List[str]):
    return next((
        line for line in lines
        if 4 <= len(line) <= 90
        and not INGREDIENT_HEADER_PATTERN.search(line)
        and not STEP_HEADER_PATTERN.search(line)
    ), None)


def dedupe_ingredients(ingredients: List[Dict[str, str]]):
    seen = set()
    deduped = []

    for ingredient in ingredients:
        key = f"{ingredient['amount']}|{ingredient['unit']}|{ingredient['name']}".lower()
        if key in seen:
            continue
        seen.add(key)
        deduped.append(ingredient)

    return deduped


def dedupe_steps(steps: List[Dict[str, Any]]):
    seen = set()
    deduped = []

    for step in steps:
        key = step['text'].lower()
        if key in seen:
            continue
        seen.add(key)
        deduped.append(step)

    return [{**step, 'order': index + 1} for index, step in enumerate(deduped)]


def extract_ingredients(lines: List[str]):
    ingredients: List[Dict[str, str]] = []
    in_ingredients_section = False

    for line in lines:
        if INGREDIENT_HEADER_PATTERN.search(line):
            in_ingredients_section = True
            continue

        if STEP_HEADER_PATTERN.search(line):
            in_ingredients_section = False

        if not in_ingredients_section:
            continue

        match = INGREDIENT_LINE_PATTERN.match(line)
        if not match:
            continue

        amount = (match.group(1) or '').strip()
        unit = (match.group(2) or '').strip()
        name = (match.group(3) or line).strip()

        if amount or UNIT_HINT_PATTERN.search(line) or len(name) > 2:
            ingredients.append({
                'amount': amount,
                'unit': unit,
                'name': name,
            })

    return dedupe_ingredients(ingredients)


def extract_steps(lines: List[str]):
    steps: List[Dict[str, Any]] = []
    in_steps_section = False

    for line in lines:
        if STEP_HEADER_PATTERN.search(line):
            in_steps_section = True
            continue

        if not in_steps_section:
            continue

        numbered_match = NUMBERED_STEP_PATTERN.match(line)
        if numbered_match:
            steps.append({
                'order': int(numbered_match.group(1)),
                'text': numbered_match.group(2).strip(),
            })
            continue

        if len(line) >= 30:
            steps.append({
                'order': len(steps) + 1,
                'text': line.strip(),
            })

    return dedupe_steps(steps)


def score_heuristics(lines: List[str], ingredient_count: int, step_count: int, title: str | None):
    score = 0.2

    if len(lines) >= 6:
        score += 0.1
    if title:
        score += 0.15
    if ingredient_count >= 3:
        score += 0.25
    if step_count >= 2:
        score += 0.25
    if any(INGREDIENT_HEADER_PATTERN.search(line) for line in lines):
        score += 0.025
    if any(STEP_HEADER_PATTERN.search(line) for line in lines):
        score += 0.025

    return min(score, 0.95)


def extract_recipe_from_image_bytes(image_bytes: bytes) -> Dict[str, Any]:
    """Extract recipe from image using Tesseract OCR"""
    try:
        image = preprocess_image_bytes(image_bytes)
        raw_text = extract_text_with_tesseract(image)

        if len(raw_text) < 20:
            return {
                'success': False,
                'error': 'Could not extract enough text. Try a clearer, higher-contrast photo of the recipe page',
            }

        text_lines = [line.strip() for line in raw_text.split('\n') if line.strip()]

        warnings: List[str] = []
        errors: List[str] = []
        flags: List[Dict[str, str]] = []

        title = find_title(text_lines)
        ingredients = extract_ingredients(text_lines)
        steps = extract_steps(text_lines)
        
        # Calculate confidence based on heuristics
        heuristic_confidence = score_heuristics(text_lines, len(ingredients), len(steps), title)
        confidence = heuristic_confidence

        if confidence < 0.7:
            warnings.append('OCR confidence is moderate. Review the extracted text carefully.')
            flags.append({
                'field': 'general',
                'severity': 'warning',
                'message': f'OCR confidence is {round(confidence * 100)}%, below the recommended threshold.',
            })

        if not title or len(title) < 4:
            warnings.append('Title may be incomplete.')
            flags.append({
                'field': 'title',
                'severity': 'warning',
                'message': 'Could not confidently identify the recipe title.',
            })

        if len(ingredients) == 0:
            warnings.append('No ingredient lines were confidently extracted.')
            flags.append({
                'field': 'ingredients',
                'severity': 'error',
                'message': 'Ingredients section could not be confidently detected.',
            })

        if len(steps) == 0:
            warnings.append('No preparation steps were confidently extracted.')
            flags.append({
                'field': 'steps',
                'severity': 'error',
                'message': 'Steps section could not be confidently detected.',
            })

        if ingredients and steps and confidence >= 0.7:
            flags.append({
                'field': 'general',
                'severity': 'info',
                'message': 'OCR text looks usable for recipe parsing.',
            })

        if confidence < 0.7:
            errors.append('Moderate confidence OCR result. Please review and correct the extracted data.')

        return {
            'success': True,
            'data': {
                'title': title,
                'description': None,
                'image_url': None,
                'source_url': None,
                'ingredients': ingredients,
                'steps': steps,
                'tags': [],
                'confidence': confidence,
                'raw_text': raw_text,
                'errors': errors,
                'warnings': warnings,
                'flags': flags,
                'ocr_engine': 'tesseract',
            }
        }
    except RuntimeError as e:
        return {
            'success': False,
            'error': str(e)
        }


@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    ocr_status = 'unavailable'
    if pytesseract is not None:
        try:
            pytesseract.get_tesseract_version()
            ocr_status = 'tesseract'
        except:
            ocr_status = 'unavailable'
    
    return jsonify({
        'status': 'healthy',
        'service': 'recipe-scraper',
        'version': '1.5.0',
        'ocr_engine': ocr_status,
    })


@app.route('/supported-sites', methods=['GET'])
def supported_sites():
    """Return list of supported recipe sites"""
    from recipe_scrapers import SCRAPERS

    supported = sorted([scraper.host() for scraper in SCRAPERS.values()])

    popular = [
        'allrecipes.com', 'foodnetwork.com', 'bonappetit.com',
        'epicurious.com', 'seriouseats.com', 'simplyrecipes.com',
        'tasty.co', 'delish.com', 'food.com', 'cookieandkate.com'
    ]

    return jsonify({
        'success': True,
        'data': {
            'total_supported': len(supported),
            'popular_sites': [site for site in popular if site in supported],
            'all_sites': supported
        }
    })


@app.route('/scrape', methods=['POST'])
def scrape():
    """Scrape a recipe from the provided URL"""
    try:
        if not request.is_json:
            return jsonify({
                'success': False,
                'error': 'Content-Type must be application/json'
            }), 400

        data = request.get_json()
        url = data.get('url')

        if not url:
            return jsonify({'success': False, 'error': 'URL is required'}), 400

        if not url.startswith(('http://', 'https://')):
            return jsonify({
                'success': False,
                'error': 'Invalid URL format. Must start with http:// or https://'
            }), 400

        result = scrape_recipe(url)

        if result['success']:
            return jsonify(result), 200
        else:
            return jsonify(result), 422

    except Exception as e:
        logger.error(f"Error processing request: {str(e)}")
        return jsonify({
            'success': False,
            'error': f'Internal server error: {str(e)}'
        }), 500


@app.route('/ocr', methods=['POST'])
def ocr_import():
    """Extract recipe text and structure from an uploaded image using PaddleOCR"""
    try:
        image_file = request.files.get('image')

        if image_file is None:
            return jsonify({
                'success': False,
                'error': 'Image file is required under form field "image"'
            }), 400

        image_bytes = image_file.read()
        if not image_bytes:
            return jsonify({
                'success': False,
                'error': 'Uploaded image is empty'
            }), 400

        result = extract_recipe_from_image_bytes(image_bytes)

        if result['success']:
            return jsonify(result), 200

        return jsonify(result), 422
    except Exception as e:
        logger.exception("Error processing OCR request")
        return jsonify({
            'success': False,
            'error': f'Internal server error: {str(e)}'
        }), 500


@app.errorhandler(404)
def not_found(error):
    return jsonify({'success': False, 'error': 'Endpoint not found'}), 404


@app.errorhandler(500)
def internal_error(error):
    logger.error(f"Internal server error: {str(error)}")
    return jsonify({'success': False, 'error': 'Internal server error'}), 500


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5001))
    logger.info(f"Starting Recipe Scraper API on port {port}")
    logger.info("Available endpoints:")
    logger.info("  GET  /health - Health check")
    logger.info("  GET  /supported-sites - List supported recipe sites")
    logger.info("  POST /scrape - Scrape a recipe from URL")
    logger.info("  POST /ocr - Extract recipe text from image with Tesseract OCR")

    app.run(host='0.0.0.0', port=port, debug=False)

# Made with Bob
