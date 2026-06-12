# Tesseract.js OCR Integration

## Overview

The UMAMI Recipe app now uses **Tesseract.js** for client-side OCR (Optical Character Recognition) instead of server-side processing. This provides significant improvements in speed, privacy, and cost-effectiveness.

## What Changed

### Before (Python Backend OCR)
- Images uploaded to Supabase Storage
- Server-side Tesseract OCR processing
- Network latency for OCR results
- Server costs for OCR processing
- Privacy concerns (images sent to server)

### After (Tesseract.js Client-Side)
- ✅ **Client-side processing** - OCR runs in the browser
- ✅ **No server upload needed** - Images stay on your device
- ✅ **Faster processing** - No network round-trip
- ✅ **Better privacy** - Images never leave your browser
- ✅ **Cost-effective** - No backend OCR costs
- ✅ **Offline-capable** - Works without internet (after initial load)

## Technical Implementation

### New Files Created

1. **`src/lib/ocr.ts`** - Client-side OCR utility
   - `extractTextFromImage()` - Main OCR function
   - `parseRecipeText()` - Basic recipe structure parser
   - `terminateOcrWorker()` - Cleanup function
   - Supports French + English languages

### Modified Files

1. **`src/pages/Import.tsx`**
   - Removed backend OCR call (`import-ocr` edge function)
   - Added client-side OCR with progress tracking
   - Improved error handling and user feedback
   - Updated progress messages

2. **`OCR_IMPORT_SETUP.md`**
   - Updated documentation to reflect client-side OCR
   - Added troubleshooting for Tesseract.js
   - Highlighted privacy and performance benefits

### Dependencies Added

```json
{
  "tesseract.js": "^7.0.0"
}
```

## How It Works

### OCR Flow

```
1. User selects/captures photo
   ↓
2. Image preprocessing (contrast, grayscale, compression)
   ↓
3. Tesseract.js worker initialization (fra+eng languages)
   ↓
4. Client-side OCR extraction with progress tracking
   ↓
5. Basic recipe parsing (title, ingredients, steps)
   ↓
6. AI enhancement with OpenRouter (optional)
   ↓
7. Save draft to database
```

### Key Features

- **Multi-language**: Recognizes French and English text
- **Progress tracking**: Real-time OCR progress updates
- **Worker reuse**: Efficient worker management for performance
- **Error handling**: Graceful fallbacks and user-friendly messages
- **Confidence scoring**: OCR confidence metrics for quality assessment

## Performance Characteristics

### First Load
- Downloads Tesseract.js core (~500 KB)
- Downloads language data for French + English (~2-3 MB)
- One-time download, cached for future use

### Subsequent Uses
- Instant worker initialization (cached)
- OCR processing: 2-5 seconds for typical recipe photo
- No network latency

## Browser Compatibility

Tesseract.js works in all modern browsers:
- ✅ Chrome/Edge (Chromium)
- ✅ Firefox
- ✅ Safari
- ✅ Mobile browsers (iOS Safari, Chrome Mobile)

## Privacy Benefits

### Before
- Images uploaded to Supabase Storage
- Processed on remote server
- Stored in cloud bucket

### After
- Images processed entirely in browser
- Never transmitted over network
- No server-side storage needed
- Complete user privacy

## Cost Savings

### Backend Costs Eliminated
- No Supabase Storage costs for OCR uploads
- No server compute costs for OCR processing
- No bandwidth costs for image uploads

### Client-Side Benefits
- One-time CDN cost for Tesseract.js library
- Cached on user's device
- Scales infinitely without server costs

## Usage Example

```typescript
import { extractTextFromImage, parseRecipeText } from '../lib/ocr'

// Extract text from image
const result = await extractTextFromImage(imageBlob, (progress) => {
  console.log(`OCR Progress: ${progress.progress}%`)
})

console.log('Extracted text:', result.text)
console.log('Confidence:', result.confidence)

// Parse recipe structure
const recipe = parseRecipeText(result.text)
console.log('Title:', recipe.title)
console.log('Ingredients:', recipe.ingredients)
console.log('Steps:', recipe.steps)
```

## Troubleshooting

### Slow First Load
**Normal behavior**: First-time users download language data (~2-3 MB). Subsequent loads are instant due to browser caching.

### Low OCR Accuracy
**Solutions**:
- Ensure good lighting and focus
- Use high-contrast images
- Avoid glossy pages with glare
- Make sure text is large enough

### Memory Issues
**Solution**: Call `terminateOcrWorker()` when OCR is no longer needed to free up resources.

## Future Enhancements

Potential improvements for future versions:

1. **Additional Languages**: Add support for more languages (Spanish, Italian, German)
2. **OCR Preprocessing**: Advanced image preprocessing for better accuracy
3. **Batch Processing**: Process multiple recipe photos at once
4. **OCR Cache**: Cache OCR results to avoid re-processing
5. **Progressive Loading**: Show partial results as OCR progresses

## Migration Notes

### Backend OCR Still Available
The Python backend OCR (`/ocr` endpoint) is still available but no longer used by the frontend. It can be removed in a future cleanup if desired.

### Edge Function Deprecation
The `import-ocr` edge function is no longer called. Consider deprecating it to reduce maintenance burden.

### Storage Bucket
The `ocr-uploads` Supabase Storage bucket is no longer used for new imports. Existing uploads can be cleaned up.

## Testing

To test the new OCR implementation:

1. Navigate to Import Recipe → From Photo
2. Upload or capture a recipe photo
3. Observe the progress indicator showing "Recognizing text with Tesseract.js"
4. Verify OCR results in the draft editor
5. Check browser console for any errors

## Conclusion

The migration to Tesseract.js provides significant benefits:
- ⚡ **Faster** - No server round-trip
- 🔒 **More private** - Images stay on device
- 💰 **Cost-effective** - No backend processing
- 🌐 **Offline-capable** - Works without internet

This is a major improvement to the OCR import feature!

---

**Made with Bob** 🤖