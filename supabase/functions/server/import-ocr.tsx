import { createClient } from 'npm:@supabase/supabase-js@2';

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
  servings?: number | null;
  ocr_engine?: string;
};

type PythonOcrResponse = {
  success: boolean;
  data?: OcrDraft;
  error?: string;
};

type OcrImportResult = {
  data: OcrDraft | null;
  error: string | null;
  partial: null;
  status: number;
};

type ParsedRecipeDraft = {
  title: string | null;
  description: string | null;
  ingredients: Array<{ amount: string; unit: string; name: string }>;
  steps: Array<{ order: number; text: string }>;
  tags: string[];
  servings?: number | null;
};

type RecipeParseResult = {
  data: ParsedRecipeDraft | null;
  error: string | null;
  status: number;
};

export async function handleOcrImport(storagePath: string, supabaseUrl: string, serviceRoleKey: string): Promise<OcrImportResult> {
  try {
    const pythonApiUrl = Deno.env.get('PYTHON_SCRAPER_URL') || 'https://umami-recipe.onrender.com';
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    console.log('Attempting to download file from storage:', storagePath);

    const { data: fileData, error: downloadError } = await supabase.storage
      .from('ocr-uploads')
      .download(storagePath);

    if (downloadError || !fileData) {
      console.error('Storage download error:', downloadError);
      return {
        data: null,
        error: `Failed to download image from storage bucket "ocr-uploads". ${downloadError?.message || 'Unknown error'}. Path: ${storagePath}`,
        partial: null,
        status: 500
      };
    }

    console.log('File downloaded successfully, size:', fileData.size, 'type:', fileData.type || 'unknown');

    const formData = new FormData();
    formData.append('image', fileData, 'recipe-photo.jpg');

    let response: Response;
    try {
      response = await fetch(`${pythonApiUrl.replace(/\/$/, '')}/ocr`, {
        method: 'POST',
        body: formData,
      });
    } catch (fetchError) {
      console.error('OCR service network error:', fetchError);
      return {
        data: null,
        error: 'OCR service is unreachable. Verify PYTHON_SCRAPER_URL and that the Python OCR service is running.',
        partial: null,
        status: 502
      };
    }

    const contentType = response.headers.get('content-type') || '';
    const isJson = contentType.includes('application/json');

    if (!isJson) {
      const text = await response.text();
      console.error('OCR service returned non-JSON response:', response.status, text);
      return {
        data: null,
        error: text || `OCR service returned an invalid response (HTTP ${response.status})`,
        partial: null,
        status: 502
      };
    }

    const result = await response.json() as PythonOcrResponse;

    if (!response.ok || !result.success || !result.data) {
      const downstreamError = result.error || `OCR service failed with HTTP ${response.status}`;

      console.error('OCR service error:', {
        status: response.status,
        error: downstreamError,
        storagePath,
      });

      const normalizedError = downstreamError.includes('Tesseract OCR binary not found')
        ? 'OCR service is deployed without the Tesseract system package. Install tesseract-ocr on the Python service host.'
        : downstreamError.includes('pytesseract is not installed')
          ? 'OCR service is deployed without the pytesseract Python package. Add pytesseract to python-scraper/requirements.txt and redeploy.'
          : downstreamError;

      return {
        data: null,
        error: normalizedError,
        partial: null,
        status: response.status >= 500 ? 502 : 422
      };
    }

    return { data: result.data, error: null, partial: null, status: 200 };
  } catch (err) {
    console.error('OCR import error:', err);
    return {
      data: null,
      error: err instanceof Error ? err.message : 'Failed to process image. Please try again.',
      partial: null,
      status: 500
    };
  }
}

export async function handleRecipeParse(rawText: string, githubToken: string): Promise<RecipeParseResult> {
  const model = 'openai/gpt-4.1-nano';

  const systemPrompt = [
    'Tu es un expert en extraction de recettes spécialisé dans l’analyse de texte issu de l’OCR.',
    'Le texte peut contenir des erreurs OCR, des problèmes de mise en forme ou une structure ambiguë.',
    'Ta mission est d’extraire intelligemment les informations de la recette malgré ces défauts.',
    '',
    'SCHÉMA JSON OBLIGATOIRE :',
    '{',
    '  "title": string | null,',
    '  "description": string | null,',
    '  "ingredients": [{ "amount": string, "unit": string, "name": string }],',
    '  "steps": [{ "order": number, "text": string }],',
    '  "tags": string[],',
    '  "servings": number | null',
    '}',
    '',
    'RÈGLES D’EXTRACTION :',
    '- Retourne UNIQUEMENT du JSON valide, sans balises markdown ni commentaire',
    '- Respecte exactement les types du schéma JSON demandé',
    '- Tous les champs amount, unit, name et text doivent toujours être des chaînes de caractères',
    '- Ne retourne jamais null, number, boolean ou object pour amount, unit, name ou text',
    '- Si une unité est absente ou inconnue, retourne "" pour unit',
    '- Si une quantité est absente ou inconnue, retourne "" pour amount',
    '- Si un nom d’ingrédient est partiel, retourne la meilleure chaîne possible pour name',
    '- Cherche le titre de la recette au début du texte',
    '- Extrais les ingrédients avec amount, unit et name',
    '- Extrais les étapes avec un ordre séquentiel à partir de 1',
    '- Extrais aussi le nombre de portions si le texte mentionne portions, personnes, servings, yield ou équivalent',
    '- Le champ servings doit être un nombre entier ou null si inconnu',
    '- Si un champ est inconnu, utilise null ou un tableau vide selon le schéma',
    '',
    'EXEMPLE VALIDE D’INGRÉDIENT :',
    '{ "amount": "1", "unit": "", "name": "oignon" }',
    '{ "amount": "", "unit": "", "name": "sel" }'
  ].join('\n');

  try {
    const response = await fetch('https://models.github.ai/inference/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${githubToken}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: systemPrompt },
          {
            role: 'user',
            content: [
              'Extrais la recette à partir de ce texte OCR.',
              'Respecte strictement le schéma JSON demandé.',
              'Important : chaque ingrédient doit toujours avoir des chaînes pour amount, unit et name.',
              'Si unit est inconnu, retourne "" et jamais null.',
              'Extrais aussi le nombre de portions dans le champ servings quand il est présent.',
              '',
              'TEXTE OCR :',
              '---',
              rawText,
              '---',
              '',
              'Retourne uniquement un objet JSON valide respectant exactement le schéma demandé.'
            ].join('\n')
          }
        ],
        temperature: 0.2,
        max_tokens: 2000,
        response_format: { type: 'json_object' }
      }),
    });

    const contentType = response.headers.get('content-type') || '';
    const isJson = contentType.includes('application/json');

    if (!response.ok) {
      const errorText = isJson ? JSON.stringify(await response.json()) : await response.text();
      return {
        data: null,
        error: `GitHub Models request failed (${response.status}): ${errorText}`,
        status: response.status === 429 ? 429 : 502
      };
    }

    const json = await response.json();
    const content = json?.choices?.[0]?.message?.content;

    if (!content || typeof content !== 'string') {
      return {
        data: null,
        error: 'GitHub Models returned an invalid response payload.',
        status: 502
      };
    }

    const parsed = JSON.parse(content) as ParsedRecipeDraft;

    return {
      data: parsed,
      error: null,
      status: 200
    };
  } catch (err) {
    console.error('GitHub Models parse error:', err);
    return {
      data: null,
      error: err instanceof Error ? err.message : 'Failed to parse recipe text with GitHub Models.',
      status: 500
    };
  }
}
