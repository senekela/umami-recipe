"""
Test script for the recipe scraper API
Run this to verify the scraper is working correctly
"""

import requests
import json
from typing import Dict, Any


def test_health_check():
    """Test the health check endpoint"""
    print("🏥 Testing health check...")
    response = requests.get('http://localhost:5001/health')
    
    if response.status_code == 200:
        print("✅ Health check passed")
        print(f"   Response: {response.json()}")
        return True
    else:
        print(f"❌ Health check failed: {response.status_code}")
        return False


def test_supported_sites():
    """Test the supported sites endpoint"""
    print("\n🌐 Testing supported sites...")
    response = requests.get('http://localhost:5001/supported-sites')
    
    if response.status_code == 200:
        data = response.json()
        print("✅ Supported sites retrieved")
        print(f"   Total supported: {data['data']['total_supported']}")
        print(f"   Sample sites: {', '.join(data['data']['popular_sites'][:5])}")
        return True
    else:
        print(f"❌ Failed to get supported sites: {response.status_code}")
        return False


def test_scrape_recipe(url: str):
    """Test scraping a specific recipe URL"""
    print(f"\n🍳 Testing recipe scraping...")
    print(f"   URL: {url}")
    
    response = requests.post(
        'http://localhost:5001/scrape',
        json={'url': url},
        headers={'Content-Type': 'application/json'}
    )
    
    if response.status_code == 200:
        data = response.json()
        
        if data['success']:
            recipe = data['data']
            print("✅ Recipe scraped successfully")
            print(f"   Title: {recipe['title']}")
            print(f"   Confidence: {recipe['confidence'] * 100}%")
            print(f"   Ingredients: {len(recipe['ingredients'])} items")
            print(f"   Instructions: {len(recipe['instructions'])} characters")
            
            if recipe.get('total_time'):
                print(f"   Total time: {recipe['total_time']} minutes")
            if recipe.get('yields'):
                print(f"   Yields: {recipe['yields']}")
            
            return True
        else:
            print(f"❌ Scraping failed: {data['error']}")
            return False
    else:
        print(f"❌ Request failed: {response.status_code}")
        if response.text:
            print(f"   Error: {response.text}")
        return False


def test_invalid_url():
    """Test error handling with invalid URL"""
    print("\n🚫 Testing error handling...")
    response = requests.post(
        'http://localhost:5001/scrape',
        json={'url': 'not-a-valid-url'},
        headers={'Content-Type': 'application/json'}
    )
    
    if response.status_code == 400:
        print("✅ Invalid URL correctly rejected")
        return True
    else:
        print(f"❌ Expected 400 status, got {response.status_code}")
        return False


def main():
    """Run all tests"""
    print("=" * 60)
    print("Recipe Scraper API Test Suite")
    print("=" * 60)
    
    # Test URLs from different popular sites
    test_urls = [
        "https://www.allrecipes.com/recipe/158968/spinach-and-feta-turkey-burgers/",
        "https://www.foodnetwork.com/recipes/alton-brown/baked-macaroni-and-cheese-recipe-1939524",
        "https://www.bonappetit.com/recipe/bas-best-chocolate-chip-cookies",
    ]
    
    results = []
    
    # Run tests
    results.append(("Health Check", test_health_check()))
    results.append(("Supported Sites", test_supported_sites()))
    
    for url in test_urls:
        site_name = url.split('/')[2].replace('www.', '')
        results.append((f"Scrape {site_name}", test_scrape_recipe(url)))
    
    results.append(("Error Handling", test_invalid_url()))
    
    # Summary
    print("\n" + "=" * 60)
    print("Test Summary")
    print("=" * 60)
    
    passed = sum(1 for _, result in results if result)
    total = len(results)
    
    for test_name, result in results:
        status = "✅ PASS" if result else "❌ FAIL"
        print(f"{status} - {test_name}")
    
    print(f"\nTotal: {passed}/{total} tests passed")
    
    if passed == total:
        print("\n🎉 All tests passed!")
        return 0
    else:
        print(f"\n⚠️  {total - passed} test(s) failed")
        return 1


if __name__ == '__main__':
    try:
        exit(main())
    except requests.exceptions.ConnectionError:
        print("\n❌ Error: Could not connect to the API")
        print("   Make sure the server is running: python app.py")
        exit(1)
    except KeyboardInterrupt:
        print("\n\n⚠️  Tests interrupted by user")
        exit(1)
    except Exception as e:
        print(f"\n❌ Unexpected error: {e}")
        exit(1)

# Made with Bob
