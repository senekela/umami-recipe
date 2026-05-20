import { createClient } from 'npm:@supabase/supabase-js@2';
import Tesseract from 'npm:tesseract.js';

type ImportFlag = {
  field: 'title' | 'description' | 'ingredients' | 'steps' | 'image' | 'source' | 'general';
  severity: 'info' | 'warning' | 'error';
  message: string;
};

type OcrDraft = {
  title: string | null;
  description: string | null;
  image_url: string | null;
  source_url: string | null;
  ingredients: Array<{ amount: string; unit: string; name: string }>;
  steps: Array<{ order: number; text: string }>;
  tags: string[];
  confidence: number;
  raw_text: string | null;
  errors: string[];
  warnings: string[];
  flags: ImportFlag[];
};

const INGREDIENT_HEADER_PATTERN = /\bingredients?\b/i;
const STEP_HEADER_PATTERN = /\b(directions?|instructions?|method|steps?)\b/i;
const INGREDIENT_LINE_PATTERN = /^([\d¼½¾⅓⅔⅛⅜⅝⅞\/\.\s]+)?\s*([a-zA-Z]+)?\s+(.+)$/;
const NUMBERED_STEP_PATTERN = /^(\d+)[\.\):]\s*(.+)$/;
const UNIT_HINT_PATTERN = /\b(cup|cups|tbsp|tablespoon|tablespoons|tsp|teaspoon|teaspoons|oz|ounce|ounces|lb|lbs|pound|pounds|g|gram|grams|kg|ml|l|pinch|clove|cloves)\b/i;

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

    const { data } = await Tesseract.recognize(buffer, 'eng', {
      logger: () => undefined,
    });

    const text = data?.text?.trim() || '';
    const meanConfidence = Number.isFinite(data?.confidence) ? data.confidence : 0;

    if (text.length < 20) {
      return {
        error: 'Try a clearer, higher-contrast photo of the recipe page',
        partial: null
      };
    }

    const lines = text
      .split('\n')
      .map((line: string) => line.replace(/\s+/g, ' ').trim())
      .filter((line: string) => line.length > 0);

    const flags: ImportFlag[] = [];
    const warnings: string[] = [];
    const errors: string[] = [];

    const result: OcrDraft = {
      title: findTitle(lines),
      description: null,
      image_url: null,
      source_url: null,
      ingredients: extractIngredients(lines),
      steps: extractSteps(lines),
      tags: [],
      confidence: 0,
      raw_text: text,
      errors,
      warnings,
      flags,
    };

    const heuristicConfidence = scoreHeuristics(lines, result.ingredients.length, result.steps.length, result.title);
    result.confidence = Math.max(0, Math.min(0.99, ((meanConfidence / 100) * 0.65) + (heuristicConfidence * 0.35)));

    if (meanConfidence < 70) {
      warnings.push('Low OCR confidence. Review the extracted text carefully.');
      flags.push({
        field: 'general',
        severity: 'warning',
        message: `OCR confidence is ${Math.round(meanConfidence)}%, below the recommended threshold.`,
      });
    }

    if (!result.title || result.title.length < 4) {
      warnings.push('Title may be incomplete.');
      flags.push({
        field: 'title',
        severity: 'warning',
        message: 'Could not confidently identify the recipe title.',
      });
    }

    if (result.ingredients.length === 0) {
      warnings.push('No ingredient lines were confidently extracted.');
      flags.push({
        field: 'ingredients',
        severity: 'error',
        message: 'Ingredients section could not be confidently detected.',
      });
    }

    if (result.steps.length === 0) {
      warnings.push('No preparation steps were confidently extracted.');
      flags.push({
        field: 'steps',
        severity: 'error',
        message: 'Steps section could not be confidently detected.',
      });
    }

    if (result.ingredients.length > 0 && result.steps.length > 0 && result.confidence >= 0.7) {
      flags.push({
        field: 'general',
        severity: 'info',
        message: 'OCR text looks usable for recipe parsing.',
      });
    }

    if (result.confidence < 0.7) {
      errors.push('Low confidence OCR result. Please review and correct the extracted data.');
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

function findTitle(lines: string[]) {
  return lines.find((line) => {
    const lower = line.toLowerCase();
    return (
      line.length >= 4 &&
      line.length <= 90 &&
      !INGREDIENT_HEADER_PATTERN.test(lower) &&
      !STEP_HEADER_PATTERN.test(lower)
    );
  }) || null;
}

function extractIngredients(lines: string[]) {
  const ingredients: Array<{ amount: string; unit: string; name: string }> = [];
  let inIngredientsSection = false;

  for (const line of lines) {
    if (INGREDIENT_HEADER_PATTERN.test(line)) {
      inIngredientsSection = true;
      continue;
    }

    if (STEP_HEADER_PATTERN.test(line)) {
      inIngredientsSection = false;
    }

    if (!inIngredientsSection) continue;

    const match = line.match(INGREDIENT_LINE_PATTERN);
    if (!match) continue;

    const amount = match[1]?.trim() || '';
    const unit = match[2]?.trim() || '';
    const name = match[3]?.trim() || line.trim();

    if (amount || UNIT_HINT_PATTERN.test(line) || name.length > 2) {
      ingredients.push({ amount, unit, name });
    }
  }

  return dedupeIngredients(ingredients);
}

function extractSteps(lines: string[]) {
  const steps: Array<{ order: number; text: string }> = [];
  let inStepsSection = false;

  for (const line of lines) {
    if (STEP_HEADER_PATTERN.test(line)) {
      inStepsSection = true;
      continue;
    }

    if (!inStepsSection) continue;

    const numberedMatch = line.match(NUMBERED_STEP_PATTERN);
    if (numberedMatch) {
      steps.push({
        order: Number.parseInt(numberedMatch[1], 10),
        text: numberedMatch[2].trim(),
      });
      continue;
    }

    if (line.length >= 30) {
      steps.push({
        order: steps.length + 1,
        text: line.trim(),
      });
    }
  }

  return dedupeSteps(steps);
}

function dedupeIngredients(ingredients: Array<{ amount: string; unit: string; name: string }>) {
  const seen = new Set<string>();
  return ingredients.filter((ingredient) => {
    const key = `${ingredient.amount}|${ingredient.unit}|${ingredient.name}`.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function dedupeSteps(steps: Array<{ order: number; text: string }>) {
  const seen = new Set<string>();
  return steps
    .filter((step) => {
      const key = step.text.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .map((step, index) => ({ ...step, order: index + 1 }));
}

function scoreHeuristics(lines: string[], ingredientCount: number, stepCount: number, title: string | null) {
  let score = 0.2;

  if (lines.length >= 6) score += 0.1;
  if (title) score += 0.15;
  if (ingredientCount >= 3) score += 0.25;
  if (stepCount >= 2) score += 0.25;
  if (lines.some((line) => INGREDIENT_HEADER_PATTERN.test(line))) score += 0.025;
  if (lines.some((line) => STEP_HEADER_PATTERN.test(line))) score += 0.025;

  return Math.min(score, 0.95);
}
