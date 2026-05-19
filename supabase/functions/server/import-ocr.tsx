import { createClient } from 'npm:@supabase/supabase-js@2';
import Tesseract from 'npm:tesseract.js';

export async function handleOcrImport(storagePath: string, supabaseUrl: string, serviceRoleKey: string) {
  try {
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    const { data: fileData, error: downloadError } = await supabase.storage
      .from('ocr-uploads')
      .download(storagePath);

    if (downloadError || !fileData) {
      return {
        error: 'Failed to download image from storage',
        partial: null
      };
    }

    const arrayBuffer = await fileData.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);

    const { data: { text } } = await Tesseract.recognize(buffer, 'eng');

    if (!text || text.trim().length < 10) {
      return {
        error: 'Try a clearer, higher-contrast photo of the recipe page',
        partial: null
      };
    }

    const lines = text.split('\n').filter(line => line.trim().length > 0);

    let result: any = {
      title: null,
      description: null,
      image_url: null,
      source_url: null,
      ingredients: [],
      steps: [],
      tags: [],
      confidence: 0,
      raw_text: text,
      errors: []
    };

    const titleMatch = lines[0];
    if (titleMatch) {
      result.title = titleMatch.trim();
    }

    const ingredientPatterns = [
      /^[\d\/\.\s]+(cup|tbsp|tsp|oz|lb|g|kg|ml|l|piece|clove|pinch)/i,
      /^\d+/
    ];

    const ingredients: any[] = [];
    const steps: any[] = [];
    let inIngredientsSection = false;
    let inStepsSection = false;

    for (const line of lines) {
      const lower = line.toLowerCase();

      if (lower.includes('ingredient')) {
        inIngredientsSection = true;
        inStepsSection = false;
        continue;
      }

      if (lower.includes('direction') || lower.includes('instruction') || lower.includes('step')) {
        inStepsSection = true;
        inIngredientsSection = false;
        continue;
      }

      if (inIngredientsSection) {
        const match = line.match(/^([\d\/\.\s]+)\s*([a-zA-Z]+)?\s*(.+)$/);
        if (match) {
          ingredients.push({
            amount: match[1].trim(),
            unit: match[2]?.trim() || '',
            name: match[3].trim()
          });
        } else if (ingredientPatterns.some(p => p.test(line))) {
          ingredients.push({ amount: '', unit: '', name: line.trim() });
        }
      }

      if (inStepsSection) {
        const stepMatch = line.match(/^(\d+)[\.:\)]\s*(.+)$/);
        if (stepMatch) {
          steps.push({ order: parseInt(stepMatch[1]), text: stepMatch[2].trim() });
        } else if (line.length > 20) {
          steps.push({ order: steps.length + 1, text: line.trim() });
        }
      }
    }

    result.ingredients = ingredients;
    result.steps = steps;

    const totalParsed = ingredients.length + steps.length;
    const totalLines = lines.length;
    result.confidence = Math.min(0.9, totalParsed / Math.max(1, totalLines / 2));

    if (result.confidence < 0.7) {
      result.errors.push('Low confidence OCR result. Please review and correct the extracted data.');
    }

    return { data: result, error: null };
  } catch (err) {
    console.error('OCR import error:', err);
    return {
      error: 'Failed to process image. Please try again.',
      partial: null
    };
  }
}
