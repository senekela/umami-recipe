# GitHub Models Recipe Verification

This document explains the AI-powered recipe verification system that validates and improves imported recipe data.

## Overview

After scraping recipe data from a URL (via Python scraper, Firecrawl, or TypeScript scraper), the system automatically verifies the data quality using **GitHub Models (GPT-4o mini)** to:

1. ✅ Validate data accuracy and completeness
2. 🔧 Fix parsing errors automatically
3. ⚠️ Flag issues that need manual review
4. 📊 Provide confidence scores and reasoning

## How It Works

### Workflow

```
URL Import → Scraping (Python/Firecrawl/TypeScript) → Verification (GitHub Models) → Save to Database
```

### Verification Process

1. **Initial Scraping**: Recipe data is extracted using the best available method
2. **AI Verification**: GitHub Models analyzes the scraped data for:
   - Title clarity and formatting
   - Ingredient parsing accuracy (amount, unit, name)
   - Step completeness and logical order
   - Servings validity
   - Tag relevance
3. **Automatic Improvements**: AI fixes common parsing errors
4. **Issue Flagging**: Problems are categorized by severity:
   - 🔴 **Error**: Critical issues preventing recipe use
   - 🟡 **Warning**: Issues that should be reviewed
   - 🔵 **Info**: Suggestions for improvement
5. **Enhanced Data**: Verified recipe is saved with improvements and flags

## Setup

### 1. Get GitHub Token

GitHub Models is free for developers with a GitHub account:

1. Go to https://github.com/settings/tokens
2. Click "Generate new token" → "Generate new token (classic)"
3. Name it: `Umami Recipe Verification`
4. Select scopes:
   - ✅ `repo` (if using private repos)
   - ✅ `read:user`
5. Click "Generate token"
6. **Copy the token immediately** (you won't see it again)

### 2. Configure Environment Variable

Add the token to your Supabase Edge Functions:

```bash
# Using Supabase CLI
supabase secrets set GITHUB_TOKEN=your_github_token_here

# Or via Supabase Dashboard
# Project Settings → Edge Functions → Add secret
# Name: GITHUB_TOKEN
# Value: your_github_token_here
```

### 3. Verify Setup

The verification system will automatically:
- ✅ Use GitHub Models if `GITHUB_TOKEN` is configured
- ⚠️ Fall back to basic validation if token is missing
- 📝 Log verification results in console

## Verification Prompt

The AI receives this structured prompt:

```
Verify and improve the following parsed recipe data. Analyze each field for accuracy, completeness, and proper formatting.

**Recipe Data:**
{
  "title": "...",
  "ingredients": [...],
  "steps": [...],
  ...
}

**Your Task:**
1. Verify the title is clear, concise, and properly formatted
2. Check if ingredients are properly parsed with amount, unit, and name
3. Validate that steps are in logical order and complete
4. Ensure servings is a reasonable number (if present)
5. Verify tags are relevant and properly categorized
6. Identify any missing or incorrect data

**Response Format (JSON only):**
{
  "verified": boolean,
  "confidence": number (0-1),
  "improvements": {
    "title": "improved title if needed",
    "ingredients": [...],
    "steps": [...],
    ...
  },
  "issues": [
    {
      "field": "ingredients",
      "severity": "error|warning|info",
      "message": "Description of the issue",
      "suggestion": "How to fix it"
    }
  ],
  "reasoning": "Brief explanation of your verification and improvements"
}
```

## Example Verification Results

### High Confidence (0.95+)

```json
{
  "verified": true,
  "confidence": 0.98,
  "improvements": {},
  "issues": [],
  "reasoning": "All fields are properly formatted and complete. No improvements needed."
}
```

### With Improvements (0.7-0.9)

```json
{
  "verified": true,
  "confidence": 0.85,
  "improvements": {
    "ingredients": [
      {
        "amount": "2",
        "unit": "cups",
        "name": "all-purpose flour"
      }
    ]
  },
  "issues": [
    {
      "field": "ingredients",
      "severity": "warning",
      "message": "Some ingredients had unclear units",
      "suggestion": "Standardized 'c' to 'cups' and 'tbsp' to 'tablespoons'"
    }
  ],
  "reasoning": "Fixed unit abbreviations for clarity. All other fields are accurate."
}
```

### Needs Review (< 0.7)

```json
{
  "verified": false,
  "confidence": 0.65,
  "improvements": {
    "title": "Chocolate Chip Cookies"
  },
  "issues": [
    {
      "field": "title",
      "severity": "warning",
      "message": "Title was truncated",
      "suggestion": "Removed trailing '...' from title"
    },
    {
      "field": "steps",
      "severity": "error",
      "message": "Steps 3 and 4 appear to be duplicates",
      "suggestion": "Review and remove duplicate instructions"
    }
  ],
  "reasoning": "Found parsing issues that require manual review before publishing."
}
```

## Benefits

### For Users
- 📈 **Higher Quality**: Automatic error correction improves data accuracy
- ⚡ **Faster Imports**: Less manual editing required
- 🎯 **Clear Guidance**: Specific suggestions for fixing issues
- 🔍 **Transparency**: See exactly what was verified and improved

### For Developers
- 🤖 **AI-Powered**: Leverages GPT-4o mini for intelligent validation
- 🔄 **Automatic**: No manual intervention needed
- 📊 **Detailed Logs**: Console output shows verification process
- 🛡️ **Fallback**: Works without GitHub token (basic validation)

## Cost & Limits

### GitHub Models (Free Tier)
- ✅ **Free for developers** with GitHub account
- 📊 Rate limits: Generous for personal/small projects
- 💰 Cost: $0 (included with GitHub account)
- 🚀 Model: GPT-4o mini (fast, accurate, cost-effective)

### Fallback Mode
If GitHub token is not configured:
- ✅ Basic validation still works
- ⚠️ No AI improvements
- 📝 Simple rule-based checks

## Monitoring

### Console Logs

```
✅ Python scraper succeeded with high confidence
🔍 Verifying recipe data (scraped via python-scraper)...
✓ Verification complete: PASSED
  Confidence: 92%
  Issues found: 1
  Reasoning: Fixed ingredient unit abbreviations for clarity
```

### Database Fields

Verification results are stored in the `recipes` table:
- `import_confidence`: Final confidence score (0-1)
- `import_warnings`: Array of warning messages
- `import_flags`: Array of flagged issues with severity
- `import_errors`: Array of critical errors

## Troubleshooting

### Verification Not Running

**Check:**
1. Is `GITHUB_TOKEN` environment variable set?
2. Is the token valid? (Test at https://api.github.com/user)
3. Check Supabase Edge Function logs for errors

**Solution:**
```bash
# Verify token is set
supabase secrets list

# Test token manually
curl -H "Authorization: Bearer YOUR_TOKEN" https://api.github.com/user
```

### Low Confidence Scores

**Common Causes:**
- Poorly structured source website
- Incomplete recipe data
- Unusual formatting or units

**Solution:**
- Review flagged issues in draft editor
- Manually correct identified problems
- Consider using a different source URL

### API Rate Limits

**If you hit rate limits:**
1. Wait a few minutes (limits reset quickly)
2. Consider upgrading GitHub account for higher limits
3. Fallback validation will still work

## Best Practices

### For Best Results

1. ✅ **Use Popular Recipe Sites**: Better structured data = higher confidence
2. 📝 **Review Warnings**: Even high-confidence imports may have minor issues
3. 🔍 **Check Flagged Fields**: Pay attention to severity levels
4. 💾 **Save as Draft**: Review before publishing

### For Developers

1. 🔐 **Secure Token**: Never commit `GITHUB_TOKEN` to version control
2. 📊 **Monitor Logs**: Watch console for verification insights
3. 🧪 **Test Fallback**: Ensure basic validation works without token
4. 📈 **Track Confidence**: Use scores to improve scraping logic

## Future Enhancements

Potential improvements:
- 🌍 Multi-language support
- 🍽️ Nutrition data extraction
- 📸 Image quality verification
- 🔗 Related recipe suggestions
- 📊 Confidence score trends

## Support

For issues or questions:
1. Check Supabase Edge Function logs
2. Review console output during import
3. Verify GitHub token is valid
4. Test with different recipe URLs

---

**Made with Bob** 🤖