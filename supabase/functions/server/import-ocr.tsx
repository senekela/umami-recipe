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
  ocr_engine?: string;
};

type PythonOcrResponse = {
  success: boolean;
  data?: OcrDraft;
  error?: string;
};

export async function handleOcrImport(storagePath: string, supabaseUrl: string, serviceRoleKey: string) {
  try {
    const pythonApiUrl = Deno.env.get('PYTHON_SCRAPER_URL') || 'https://umami-recipe.onrender.com';
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

    const formData = new FormData();
    formData.append('image', fileData, 'recipe-photo.jpg');

    let response: Response;
    try {
      response = await fetch(`${pythonApiUrl.replace(/\/$/, '')}/ocr`, {
        method: 'POST',
        body: formData,
      });
    } catch (fetchError) {
      console.error('PaddleOCR service network error:', fetchError);
      return {
        error: 'PaddleOCR service is unreachable. Verify PYTHON_SCRAPER_URL and that the Python OCR service is running.',
        partial: null
      };
    }

    const contentType = response.headers.get('content-type') || '';
    const isJson = contentType.includes('application/json');

    if (!isJson) {
      const text = await response.text();
      return {
        error: text || 'PaddleOCR service returned an invalid response',
        partial: null
      };
    }

    const result = await response.json() as PythonOcrResponse;

    if (!response.ok || !result.success || !result.data) {
      return {
        error: result.error || 'Failed to process image with PaddleOCR',
        partial: null
      };
    }

    return { data: result.data, error: null };
  } catch (err) {
    console.error('OCR import error:', err);
    return {
      error: err instanceof Error ? err.message : 'Failed to process image. Please try again.',
      partial: null
    };
  }
}
