"""
Simple test script for EasyOCR functionality
Tests the OCR implementation locally before deployment
"""

import sys
import os

# Add parent directory to path
sys.path.insert(0, os.path.dirname(__file__))

from PIL import Image, ImageDraw, ImageFont
from io import BytesIO
import numpy as np

def create_test_image():
    """Create a simple test image with recipe text"""
    # Create a white image
    img = Image.new('RGB', (800, 600), color='white')
    draw = ImageDraw.Draw(img)
    
    # Add some recipe text
    text = """
    Chocolate Chip Cookies
    
    Ingredients:
    2 cups flour
    1 cup sugar
    1/2 cup butter
    2 eggs
    1 tsp vanilla
    1 cup chocolate chips
    
    Instructions:
    1. Mix dry ingredients
    2. Add wet ingredients
    3. Fold in chocolate chips
    4. Bake at 350°F for 12 minutes
    """
    
    # Draw text (using default font)
    y_position = 50
    for line in text.strip().split('\n'):
        draw.text((50, y_position), line.strip(), fill='black')
        y_position += 30
    
    return img

def test_easyocr():
    """Test EasyOCR installation and basic functionality"""
    print("=" * 60)
    print("EasyOCR Test")
    print("=" * 60)
    
    # Test 1: Check if easyocr is installed
    print("\n1. Checking EasyOCR installation...")
    try:
        import easyocr
        print("   ✅ EasyOCR is installed")
    except ImportError:
        print("   ❌ EasyOCR is not installed")
        print("   Run: pip install easyocr")
        return False
    
    # Test 2: Initialize reader
    print("\n2. Initializing EasyOCR reader...")
    try:
        reader = easyocr.Reader(['en', 'fr'], gpu=False)
        print("   ✅ Reader initialized successfully")
    except Exception as e:
        print(f"   ❌ Failed to initialize reader: {e}")
        return False
    
    # Test 3: Create test image
    print("\n3. Creating test image...")
    try:
        test_img = create_test_image()
        print("   ✅ Test image created")
        
        # Save for inspection
        test_img.save('test_recipe_image.png')
        print("   📄 Saved as test_recipe_image.png")
    except Exception as e:
        print(f"   ❌ Failed to create test image: {e}")
        return False
    
    # Test 4: Perform OCR
    print("\n4. Performing OCR on test image...")
    try:
        img_array = np.array(test_img)
        results = reader.readtext(img_array, detail=0, paragraph=True)
        text = '\n'.join(results)
        
        print("   ✅ OCR completed successfully")
        print("\n   Extracted text:")
        print("   " + "-" * 50)
        for line in text.split('\n')[:10]:  # Show first 10 lines
            print(f"   {line}")
        if len(text.split('\n')) > 10:
            print(f"   ... ({len(text.split('\n')) - 10} more lines)")
        print("   " + "-" * 50)
        
        # Check if key words were detected
        keywords = ['chocolate', 'ingredients', 'flour', 'instructions']
        detected = [kw for kw in keywords if kw.lower() in text.lower()]
        
        if detected:
            print(f"\n   ✅ Detected keywords: {', '.join(detected)}")
        else:
            print(f"\n   ⚠️  Warning: No expected keywords detected")
            
    except Exception as e:
        print(f"   ❌ OCR failed: {e}")
        return False
    
    # Test 5: Test with app.py function
    print("\n5. Testing app.py integration...")
    try:
        from app import extract_text_with_easyocr
        
        # Convert image to bytes
        img_bytes = BytesIO()
        test_img.save(img_bytes, format='PNG')
        img_bytes = img_bytes.getvalue()
        
        extracted_text = extract_text_with_easyocr(img_bytes)
        
        print("   ✅ App integration works")
        print(f"   📝 Extracted {len(extracted_text)} characters")
        
    except Exception as e:
        print(f"   ❌ App integration failed: {e}")
        return False
    
    print("\n" + "=" * 60)
    print("✅ All tests passed!")
    print("=" * 60)
    return True

if __name__ == '__main__':
    try:
        success = test_easyocr()
        sys.exit(0 if success else 1)
    except KeyboardInterrupt:
        print("\n\n⚠️  Test interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n❌ Unexpected error: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

# Made with Bob
