"""
Recipe Scraper API
A Flask-based REST API for scraping recipes from various cooking websites
"""

from flask import Flask, request, jsonify
from flask_cors import CORS
from recipe_scrapers import scrape_html
import requests
from typing import Dict, Any
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)

# Configuration
app.config['JSON_SORT_KEYS'] = False
app.config['MAX_CONTENT_LENGTH'] = 16 * 1024 * 1024


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


@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'service': 'recipe-scraper',
        'version': '1.0.0'
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


@app.errorhandler(404)
def not_found(error):
    return jsonify({'success': False, 'error': 'Endpoint not found'}), 404


@app.errorhandler(500)
def internal_error(error):
    logger.error(f"Internal server error: {str(error)}")
    return jsonify({'success': False, 'error': 'Internal server error'}), 500


if __name__ == '__main__':
    port = 5001
    logger.info(f"Starting Recipe Scraper API on port {port}")
    logger.info("Available endpoints:")
    logger.info("  GET  /health - Health check")
    logger.info("  GET  /supported-sites - List supported recipe sites")
    logger.info("  POST /scrape - Scrape a recipe from URL")
    
    app.run(host='0.0.0.0', port=port, debug=True)

# Made with Bob
