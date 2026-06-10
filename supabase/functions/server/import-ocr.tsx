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

type OcrImportResult = {
  data: OcrDraft | null;
  error: string | null;
  partial: null;
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
