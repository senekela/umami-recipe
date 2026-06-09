# HEIC Photo Format Support

## Overview
The Umami Recipe app fully supports iPhone's HEIC (High Efficiency Image Container) photo format for recipe imports via the OCR pipeline.

## Implementation Details

### Frontend Support (src/pages/Import.tsx)

#### 1. File Input Configuration
```tsx
<input
  type="file"
  accept="image/*,.heic,.HEIC"
  capture="environment"
  onChange={handlePhotoSelected}
/>
```
- Explicitly accepts `.heic` and `.HEIC` file extensions
- Works with iPhone camera and photo library

#### 2. Automatic HEIC Conversion
The `preprocessImage()` function (lines 563-653) handles HEIC conversion:

```typescript
// Step 1: Convert HEIC to PNG if needed
const isHeic = file.type === 'image/heic' || file.name.toLowerCase().endsWith('.heic')

if (isHeic) {
  const convertedBlob = await heic2any({
    blob: file,
    toType: 'image/png',
    quality: 0.9
  })
  // Handle both Blob and Blob[] responses
  const pngBlob = Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob
  processFile = new File([pngBlob], file.name.replace(/\.heic$/i, '.png'), { 
    type: 'image/png' 
  })
}
```

#### 3. Image Processing Pipeline
After HEIC conversion, all images go through:
1. **Resize**: Max width 1600px for optimal OCR performance
2. **Contrast Enhancement**: Improves text recognition accuracy
3. **Compression**: Reduces to ≤500KB JPEG with iterative quality reduction

### Dependencies

#### heic2any Library
- **Version**: 0.0.4
- **Purpose**: Client-side HEIC to PNG/JPEG conversion
- **Installation**: Already included in package.json
- **Browser Support**: Works in modern browsers (Chrome, Firefox, Safari, Edge)

### Backend Compatibility (python-scraper/app.py)

The Python OCR service uses PIL (Pillow) which handles all standard image formats including:
- PNG (converted from HEIC)
- JPEG
- WebP
- BMP
- TIFF

The service processes images through:
1. Grayscale conversion
2. Contrast enhancement (2.0x)
3. Resizing (max 2000px width)
4. Tesseract OCR text extraction

## User Experience

### Workflow
1. User selects HEIC photo from iPhone
2. Frontend automatically detects HEIC format
3. Converts to PNG transparently (no user action needed)
4. Processes image for OCR optimization
5. Uploads to Supabase storage
6. Extracts recipe text via Python OCR service

### Progress Indicators
Users see clear status updates:
- "Preparing photo…" - During HEIC conversion and preprocessing
- "Uploading processed image…"
- "Recognizing text from the recipe page…"
- "Parsing recipe structure with OpenRouter…"
- "Saving draft for review…"

### Error Handling
Specific error messages for HEIC issues:
```typescript
if (err.message.includes('HEIC')) {
  errorMessage = 'Failed to convert HEIC image. Try converting to JPG on your device first, or use a different photo format.'
}
```

## Testing HEIC Support

### Manual Testing
1. Take a photo with iPhone camera (saves as HEIC by default)
2. Navigate to Import → From Photo tab
3. Select the HEIC photo
4. Verify automatic conversion and processing
5. Check OCR results in draft editor

### Expected Behavior
- ✅ HEIC files are accepted
- ✅ Conversion happens automatically
- ✅ Preview shows processed image
- ✅ OCR extracts text successfully
- ✅ Recipe draft is created

### Common Issues
- **Browser compatibility**: Ensure using modern browser
- **File size**: Very large HEIC files may take longer to convert
- **Memory**: Conversion requires sufficient browser memory

## Technical Notes

### Why Convert to PNG?
- PNG is lossless and maintains quality for OCR
- Better compatibility with canvas processing
- Tesseract OCR works well with PNG format

### Performance Considerations
- HEIC conversion adds ~1-2 seconds to processing time
- Acceptable trade-off for iPhone user convenience
- Conversion happens client-side (no server load)

### Browser Support
The heic2any library works in:
- ✅ Chrome/Edge (Chromium-based)
- ✅ Firefox
- ✅ Safari (iOS and macOS)
- ❌ Internet Explorer (not supported)

## Future Enhancements

Potential improvements:
- [ ] Add HEIC support indicator in UI
- [ ] Show conversion progress percentage
- [ ] Support batch HEIC conversion
- [ ] Add HEIF format support (HEIC variant)
- [ ] Optimize conversion quality settings

## Related Files
- `src/pages/Import.tsx` - Main import page with HEIC handling
- `package.json` - heic2any dependency
- `python-scraper/app.py` - Backend OCR service
- `supabase/functions/server/import-ocr.tsx` - Edge function for OCR

## Conclusion
HEIC support is fully implemented and production-ready. iPhone users can seamlessly import recipes from photos without manual format conversion.

---
*Last Updated: 2026-06-09*
*Made with Bob*