#!/usr/bin/env python3
"""Quick test to verify recipe-scrapers is working with the new API"""

from recipe_scrapers import scrape_html
import requests

print("Testing recipe-scrapers with scrape_html...")

# Test URL
url = "https://www.allrecipes.com/recipe/158968/spinach-and-feta-turkey-burgers/"

try:
    # Fetch HTML
    print(f"\n1. Fetching URL: {url}")
    headers = {'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'}
    response = requests.get(url, headers=headers, timeout=10)
    response.raise_for_status()
    print("   ✅ HTML fetched successfully")
    
    # Parse with recipe-scrapers
    print("\n2. Parsing recipe...")
    scraper = scrape_html(html=response.content, org_url=url)
    print("   ✅ Recipe parsed successfully")
    
    # Extract data
    print("\n3. Extracting recipe data...")
    print(f"   Title: {scraper.title()}")
    print(f"   Total Time: {scraper.total_time()} minutes")
    print(f"   Yields: {scraper.yields()}")
    print(f"   Ingredients: {len(scraper.ingredients())} items")
    print(f"   Instructions length: {len(scraper.instructions())} characters")
    
    print("\n✅ All tests passed! The scraper is working correctly.")
    
except Exception as e:
    print(f"\n❌ Error: {e}")
    import traceback
    traceback.print_exc()

# Made with Bob
