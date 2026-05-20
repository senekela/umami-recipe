# OCR Import Setup Guide

This guide explains how to set up and use the photo-based recipe import feature with AI-powered parsing.

## Features

- ✅ **HEIC Support** - Automatically converts iPhone HEIC photos to PNG
- ✅ **Smart Compression** - Reduces images to ≤500 KB while maintaining OCR quality
- ✅ **Tesseract.js OCR** - Extracts text from recipe photos
- ✅ **AI Parsing** - Uses OpenRouter's free models to structure recipe data
- ✅ **Fallback Chain** - Tries multiple models for best results
- ✅ **Manual Review** - Highlights uncertain fields for user verification

## Setup Instructions

### 1. Get an OpenRouter API Key (Free)

1. Visit [https://openrouter.ai](https://openrouter.ai)
2. Sign up for a free account
3. Navigate to **Keys** in your dashboard
4. Create a new API key
5. Copy the key (starts with `sk-or-v1-...`)

### 2. Configure Environment Variable

Create a `.env.local` file in the project root:

```bash
NEXT_PUBLIC_OPENROUTER_KEY=sk-or-v1-your-actual-key-here
```

**Important Notes:**
- The key must start with `NEXT_PUBLIC_` to be accessible in the browser
- Never commit `.env.local` to version control (already in `.gitignore`)
- The app will work without the key, but AI parsing will be skipped

### 3. Restart Development Server

After adding the environment variable:

```bash
npm run dev
```

## How It Works

### Import Flow

```
User uploads photo (HEIC/JPG/PNG)
    ↓
Convert HEIC → PNG (if needed)
    ↓
Enhance contrast & grayscale
    ↓
Compress to ≤500 KB
    ↓
Upload to Supabase Storage
    ↓
Tesseract.js OCR extraction
    ↓
OpenRouter AI parsing (gemma-3-27b)
    ↓
Fallback to mistral-7b (if needed)
    ↓
Save draft with flags
    ↓
User reviews in DraftEditor
```

### AI Models Used

1. **Primary**: `google/gemma-3-27b-it:free`
   - Best accuracy for recipe extraction
   - Structured JSON output
   
2. **Fallback**: `mistralai/mistral-7b-instruct:free`
   - Backup if primary fails
   - Still provides good results

3. **Manual Review**: OCR-only draft
   - Used if both AI models fail
   - User manually structures the recipe

### Validation

The app uses **Zod** for runtime validation of AI responses:

```typescript
{
  title: string | null,
  description: string | null,
  ingredients: [{ amount, unit, name }],
  steps: [{ order, text }],
  tags: string[]
}
```

If validation fails, the next model in the chain is tried automatically.

## Usage

### Taking a Photo

1. Navigate to **Import Recipe** → **From Photo** tab
2. Click the upload area or use camera button
3. Take/select a clear photo of the recipe
4. Wait for preprocessing (contrast enhancement)
5. Review the processed preview
6. Click **Use this photo** to start OCR

### Best Practices for Photos

✅ **Good Photos:**
- Well-lit, even lighting
- Recipe fills most of the frame
- Text is in focus and readable
- High contrast between text and background
- Flat surface (no curves or folds)

❌ **Avoid:**
- Blurry or out-of-focus images
- Poor lighting or shadows
- Glossy pages with glare
- Handwritten recipes (OCR works best with printed text)
- Very small text

### Reviewing Imported Recipes

After import, you'll be redirected to the **Draft Editor** where:

- **Amber-highlighted fields** = Flagged for review (low confidence)
- **White fields** = Parsed successfully
- **Warnings** = Shown at the top of the page
- **Flags** = Listed with severity (info/warning/error)

Review and correct any flagged fields before publishing.

## Troubleshooting

### "OpenRouter API key not configured"

**Solution**: Add `NEXT_PUBLIC_OPENROUTER_KEY` to `.env.local` and restart the dev server.

### "Failed to convert HEIC image"

**Solution**: 
- Try converting the HEIC to JPG on your device first
- Or use a different photo format

### "Unable to compress image to required size"

**Solution**:
- Use a smaller image
- Crop the image to just the recipe
- Reduce image resolution before uploading

### "Low OCR confidence"

**Solution**:
- Retake the photo with better lighting
- Ensure text is in focus
- Use a flat surface without curves
- Increase contrast if possible

### AI parsing returns empty results

**Solution**:
- Check that your API key is valid
- Verify the OCR text contains recipe-like content
- The app will fall back to manual review mode

## API Costs

**OpenRouter Free Tier:**
- `gemma-3-27b-it:free` - Completely free
- `mistral-7b-instruct:free` - Completely free
- No credit card required
- Rate limits apply (sufficient for personal use)

## Technical Details

### Dependencies

- `heic2any` - Browser-based HEIC conversion
- `tesseract.js` - OCR engine
- `zod` - Runtime validation
- `@supabase/supabase-js` - Storage and database

### Storage

Photos are stored in the `ocr-uploads` Supabase Storage bucket:
- Path: `{user_id}/{timestamp}-{filename}`
- Format: JPEG (after processing)
- Max size: 500 KB

### Database

Imported recipes are saved with:
- `import_method: 'ocr'`
- `import_source`: Original filename
- `raw_text`: OCR extracted text
- `import_confidence`: 0-1 score
- `import_warnings`: Array of warning messages
- `import_flags`: Array of flagged fields

## Support

For issues or questions:
1. Check the browser console for detailed error messages
2. Verify your API key is correctly configured
3. Ensure you have a stable internet connection
4. Try a different photo if OCR quality is poor

---

**Made with Bob** 🤖