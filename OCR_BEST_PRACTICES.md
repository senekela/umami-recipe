# OCR Best Practices for Recipe Import

## Understanding OCR Results

When you see warnings like "No ingredient lines were confidently extracted," it means:
- ✅ **OCR is working** - Text was extracted from your photo
- ⚠️ **Parsing needs help** - The recipe structure wasn't clear enough
- 📝 **Manual review needed** - You'll need to format the recipe in the draft editor

This is **normal and expected** for many recipe photos!

## Why OCR Might Struggle

### Common Issues

1. **Unclear Recipe Format**
   - Recipe doesn't have clear "Ingredients" and "Instructions" headers
   - Text is mixed together without clear sections
   - Handwritten recipes (OCR works best with printed text)

2. **Photo Quality**
   - Blurry or out-of-focus images
   - Poor lighting or shadows
   - Glossy pages with glare
   - Text too small to read clearly

3. **Complex Layouts**
   - Multi-column layouts
   - Text wrapped around images
   - Decorative fonts or backgrounds
   - Recipes in unusual formats

## How to Get Better Results

### 1. Take Better Photos

✅ **Do:**
- Use good, even lighting
- Hold camera steady (avoid blur)
- Fill frame with recipe text
- Use flat surface (no curves)
- Ensure text is in focus
- Use high contrast (dark text on light background)

❌ **Don't:**
- Take photos in dim lighting
- Photograph glossy pages with glare
- Include unnecessary background
- Use photos of curved pages
- Photograph very small text

### 2. Prepare Your Recipe

✅ **Best formats for OCR:**
```
Recipe Title

Ingredients:
- 2 cups flour
- 1 cup sugar
- 1/2 cup butter

Instructions:
1. Mix dry ingredients
2. Add wet ingredients
3. Bake at 350°F
```

❌ **Difficult formats:**
- Recipes without clear headers
- Ingredients mixed into paragraph text
- Handwritten notes
- Decorative or script fonts

### 3. Use the Right Tool

**When to use OCR:**
- Printed recipes from books/magazines
- Recipe cards with clear text
- Printed web pages
- Clear, structured recipes

**When to use URL import instead:**
- Recipes from websites (use "From URL" tab)
- Digital recipes you can copy/paste
- Recipes in your email

**When to type manually:**
- Handwritten recipes
- Very short recipes (faster to type)
- Recipes with complex formatting

## Working with OCR Results

### If Parsing Fails

When you see "No ingredients/steps extracted," the OCR still captured the text! Here's what to do:

1. **Check the Raw Text**
   - The draft editor will show the extracted text
   - Verify the OCR read the text correctly

2. **Manual Formatting**
   - Copy ingredients from raw text
   - Paste into ingredients section
   - Format as needed (amount, unit, name)
   - Do the same for steps

3. **Use AI Assistance**
   - If you have an OpenRouter API key configured
   - The system will try to parse the structure automatically
   - This works even when basic parsing fails

### Example Workflow

```
1. Take photo of recipe
   ↓
2. OCR extracts text (may have warnings)
   ↓
3. Review raw text in draft editor
   ↓
4. Manually format ingredients and steps
   ↓
5. Add title, description, tags
   ↓
6. Publish recipe
```

## Improving OCR Accuracy

### Tesseract.js Settings

The app uses these optimized settings:
- **Languages**: French + English
- **Mode**: Automatic text detection
- **Preprocessing**: Contrast enhancement, grayscale

### When to Retry

Consider retaking the photo if:
- Raw text is mostly gibberish
- Large portions of text are missing
- Numbers are consistently wrong
- Text is severely jumbled

### Alternative Approaches

If OCR consistently fails:

1. **Screenshot Method**
   - Take screenshot of digital recipe
   - Often clearer than photographing a screen

2. **PDF Export**
   - Export recipe as PDF
   - Take screenshot of PDF
   - Usually has better contrast

3. **Text Enhancement**
   - Use photo editing to increase contrast
   - Convert to black and white
   - Crop to just the recipe text

## Understanding Confidence Scores

The system provides confidence metrics:

- **High (>70%)**: Recipe structure detected, minimal review needed
- **Medium (50-70%)**: Some structure detected, review recommended
- **Low (<50%)**: Manual formatting required

Low confidence doesn't mean OCR failed - it means the recipe format was unclear!

## Tips for Specific Recipe Types

### Cookbook Recipes
✅ Usually work well (clear structure)
- Photograph full page
- Ensure good lighting
- Avoid page curves

### Magazine Recipes
⚠️ Can be tricky (multi-column)
- Crop to single column if possible
- May need to photograph in sections
- Watch for text wrapping around images

### Recipe Cards
✅ Usually work well (simple format)
- Lay flat on contrasting surface
- Fill frame with card
- Ensure all text is visible

### Handwritten Recipes
❌ Not recommended for OCR
- OCR works best with printed text
- Consider typing these manually
- Or use as reference while typing

## Troubleshooting

### "Could not extract enough text"
**Cause**: Photo too blurry or text too small  
**Fix**: Retake photo with better focus and lighting

### "No ingredients detected"
**Cause**: Recipe doesn't have clear "Ingredients" header  
**Fix**: Manually format from raw text in draft editor

### "Low OCR confidence"
**Cause**: Unclear text or complex layout  
**Fix**: Review and correct in draft editor (this is normal!)

### "OpenRouter parsing failed"
**Cause**: AI couldn't understand recipe structure  
**Fix**: Manual formatting (raw text is still available)

## Summary

**Remember:**
- OCR is a **starting point**, not a magic solution
- Manual review is **expected and normal**
- The goal is to **save time**, not be 100% automatic
- Even partial OCR results are helpful!

**Best results come from:**
1. Clear, well-lit photos
2. Printed text (not handwritten)
3. Simple, structured recipe formats
4. Willingness to manually format when needed

---

**Made with Bob** 🤖