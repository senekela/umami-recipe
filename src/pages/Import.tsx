import { useRef, useState, useEffect } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { supabase, callEdgeFunction } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { Layout } from '../components/Layout'
import { Link as LinkIcon, Camera, Sparkles, AlertTriangle, RefreshCcw, CheckCircle2, FileText } from 'lucide-react'
import { Progress } from '../app/components/ui/progress'
import { Alert, AlertDescription, AlertTitle } from '../app/components/ui/alert'
import type { DraftSchema, ImportFlag } from '../lib/types/recipe'
import { z } from 'zod'
import { extractTextFromImage, parseRecipeText } from '../lib/ocr'
import { Swirling } from '../components/Swirling'

type ImportStage =
  | 'idle'
  | 'preparing'
  | 'ready'
  | 'uploading'
  | 'ocr'
  | 'parsing'
  | 'saving'

const OpenRouterRecipeSchema = z.object({
  title: z.string().nullable(),
  description: z.string().nullable(),
  ingredients: z.array(z.object({
    amount: z.string(),
    unit: z.string(),
    name: z.string()
  })),
  steps: z.array(z.object({
    order: z.number(),
    text: z.string()
  })),
  tags: z.array(z.string())
})

type OpenRouterRecipeDraft = z.infer<typeof OpenRouterRecipeSchema>

type ParsedDraft = DraftSchema & {
  warnings: string[]
  flags: ImportFlag[]
}

const MAX_FILE_SIZE = 500 * 1024 // 500 KB

export function Import() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const [tab, setTab] = useState<'url' | 'ocr'>('url')

  useEffect(() => {
    const tabParam = searchParams.get('tab')
    if (tabParam === 'ocr' || tabParam === 'url') {
      setTab(tabParam)
    }
  }, [searchParams])
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [scrapingLogs, setScrapingLogs] = useState<DraftSchema | null>(null)
  const [showLogs, setShowLogs] = useState(false)

  const [photoStage, setPhotoStage] = useState<ImportStage>('idle')
  const [photoProgress, setPhotoProgress] = useState(0)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [processedBlob, setProcessedBlob] = useState<Blob | null>(null)
  const [processedFileName, setProcessedFileName] = useState<string>('recipe-photo.jpg')
  const [ocrWarnings, setOcrWarnings] = useState<string[]>([])
  const [ocrFlags, setOcrFlags] = useState<ImportFlag[]>([])


  const resetPhotoFlow = () => {
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl)
    }
    setSelectedFile(null)
    setPreviewUrl(null)
    setProcessedBlob(null)
    setProcessedFileName('recipe-photo.jpg')
    setPhotoStage('idle')
    setPhotoProgress(0)
    setOcrWarnings([])
    setOcrFlags([])
    setError(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const handleUrlImport = async () => {
    if (!url || !user) return

    setLoading(true)
    setError(null)
    setSuccessMessage(null)
    setScrapingLogs(null)

    try {
      const { data, error: edgeError } = await callEdgeFunction<DraftSchema>('import-url', { url })

      if (edgeError) {
        let errorMessage = edgeError
        if (edgeError.includes('network') || edgeError.includes('fetch')) {
          errorMessage = 'Network error. Please check your connection and try again.'
        } else if (edgeError.includes('timeout')) {
          errorMessage = 'Request timed out. The website may be slow. Try again or use a different recipe.'
        } else if (edgeError.includes('parse') || edgeError.includes('extract')) {
          errorMessage = 'Could not extract recipe from this page. Try a different URL or import via photo.'
        }
        setError(errorMessage)
        setLoading(false)
        return
      }

      if (data) {
        setScrapingLogs(data)
        if (data.confidence && data.confidence >= 0.9) {
          setSuccessMessage('✨ Recipe imported with high confidence!')
        } else if (data.confidence && data.confidence >= 0.7) {
          setSuccessMessage('✓ Recipe imported successfully')
        }

        const title = data.title || 'Untitled Recipe'
        const baseSlug = title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-+|-+$/g, '')
        const slug = `${baseSlug}-${Date.now()}`

        const { data: recipe, error: insertError } = await supabase
          .from('recipes')
          .insert({
            title,
            description: data.description,
            image_url: data.image_url,
            source_url: url,
            ingredients: data.ingredients,
            steps: data.steps,
            tags: data.tags,
            servings: data.servings ?? null,
            owner_id: user.id,
            status: 'draft',
            import_method: 'url',
            import_source: url,
            raw_text: data.raw_text,
            import_confidence: data.confidence,
            import_errors: data.errors,
            import_warnings: data.warnings || [],
            import_flags: data.flags || [],
            slug
          })
          .select()
          .single()

        if (insertError) throw insertError

        setTimeout(() => {
          navigate(`/drafts/${recipe.id}`)
        }, 800)
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to import recipe'
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  const handlePhotoSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return

    setLoading(true)
    setError(null)
    setSuccessMessage(null)
    setOcrWarnings([])
    setOcrFlags([])
    setPhotoStage('preparing')
    setPhotoProgress(10)

    try {
      const processed = await preprocessImage(file)
      const objectUrl = URL.createObjectURL(processed.blob)

      if (previewUrl) {
        URL.revokeObjectURL(previewUrl)
      }

      setSelectedFile(file)
      setProcessedBlob(processed.blob)
      setProcessedFileName(processed.fileName)
      setPreviewUrl(objectUrl)
      setPhotoProgress(15)

      setPhotoStage('ocr')
      const ocrResult = await extractTextFromImage(processed.blob, (progress) => {
        setPhotoProgress(15 + progress.progress * 0.45) // 15-60%
      })

      if (!ocrResult.text || ocrResult.text.length < 20) {
        throw new Error('Could not extract enough text. Try a clearer, higher-contrast photo of the recipe page.')
      }

      setPhotoProgress(65)
      setPhotoStage('parsing')

      const basicParsed = parseRecipeText(ocrResult.text)

      const warnings: string[] = []
      const flags: ImportFlag[] = []
      const errors: string[] = []

      if (ocrResult.confidence < 0.7) {
        warnings.push('OCR confidence is moderate. Review the extracted text carefully.')
        flags.push({
          field: 'general',
          severity: 'warning',
          message: `OCR confidence is ${Math.round(ocrResult.confidence * 100)}%, below the recommended threshold.`,
        })
      }

      if (!basicParsed.title || basicParsed.title.length < 4) {
        warnings.push('Title may be incomplete.')
        flags.push({
          field: 'title',
          severity: 'warning',
          message: 'Could not confidently identify the recipe title.',
        })
      }

      if (basicParsed.ingredients.length === 0) {
        warnings.push('No ingredient lines were confidently extracted.')
        flags.push({
          field: 'ingredients',
          severity: 'error',
          message: 'Ingredients section could not be confidently detected.',
        })
      }

      if (basicParsed.steps.length === 0) {
        warnings.push('No preparation steps were confidently extracted.')
        flags.push({
          field: 'steps',
          severity: 'error',
          message: 'Steps section could not be confidently detected.',
        })
      }

      const baseDraft: ParsedDraft = {
        title: basicParsed.title,
        description: null,
        image_url: null,
        source_url: null,
        ingredients: basicParsed.ingredients,
        steps: basicParsed.steps,
        tags: [],
        confidence: ocrResult.confidence,
        raw_text: ocrResult.text,
        errors,
        warnings,
        flags,
      }

      setPhotoProgress(70)

      const parsedDraft = await parseRecipeWithGitHubModels(ocrResult.text)
      const mergedDraft = mergeDraftData(baseDraft, parsedDraft)

      setOcrWarnings(mergedDraft.warnings)
      setOcrFlags(mergedDraft.flags)

      setPhotoStage('saving')
      setPhotoProgress(88)

      const title = mergedDraft.title || 'Untitled Recipe'
      const baseSlug = title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
      const slug = `${baseSlug}-${Date.now()}`

      const { data: recipe, error: insertError } = await supabase
        .from('recipes')
        .insert({
          title,
          description: mergedDraft.description,
          image_url: null,
          source_url: null,
          ingredients: mergedDraft.ingredients,
          steps: mergedDraft.steps,
          tags: mergedDraft.tags,
          servings: mergedDraft.servings ?? null,
          owner_id: user.id,
          status: 'draft',
          import_method: 'ocr',
          import_source: file.name || processed.fileName,
          raw_text: mergedDraft.raw_text,
          import_confidence: mergedDraft.confidence,
          import_errors: mergedDraft.errors,
          import_warnings: mergedDraft.warnings,
          import_flags: mergedDraft.flags,
          slug
        })
        .select()
        .single()

      if (insertError) {
        throw new Error(`Failed to save recipe: ${insertError.message}`)
      }

      setPhotoProgress(100)
      
      if (mergedDraft.warnings.length > 0 || mergedDraft.flags.length > 0) {
        setSuccessMessage('Photo imported with warnings. Please review and correct flagged fields before publishing.')
      } else {
        setSuccessMessage('✨ Photo imported successfully! Review the recipe before publishing.')
      }
      
      setTimeout(() => {
        navigate(`/drafts/${recipe.id}`)
      }, 800)
    } catch (err) {
      setPhotoStage('idle')
      setPhotoProgress(0)
      
      let errorMessage = 'Failed to process photo'
      if (err instanceof Error) {
        if (err.message.includes('HEIC') || err.message.includes('heic2any')) {
          errorMessage = err.message
        } else if (err.message.includes('compress')) {
          errorMessage = 'Unable to compress image to required size. Try using a smaller image or crop it to just the recipe.'
        } else if (err.message.includes('processing')) {
          errorMessage = 'Image processing is not supported in this browser. Try using a modern browser like Chrome, Firefox, or Safari.'
        } else if (err.message.includes('extract')) {
          errorMessage = err.message
        } else {
          errorMessage = err.message
        }
      }
      
      setError(errorMessage)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Layout
      title="Import Recipe"
      belowHeader={
        <div className="flex gap-6 border-b border-gray-200 -mb-px">
          <button
            onClick={() => setTab('url')}
            className={`pb-3 px-1 font-medium transition-colors ${
              tab === 'url'
                ? 'text-tertiary border-b-2 border-tertiary'
                : 'text-primary/60 hover:text-primary'
            }`}
          >
            From URL
          </button>
          <button
            onClick={() => setTab('ocr')}
            className={`pb-3 px-1 font-medium transition-colors ${
              tab === 'ocr'
                ? 'text-tertiary border-b-2 border-tertiary'
                : 'text-primary/60 hover:text-primary'
            }`}
          >
            From Photo
          </button>
        </div>
      }
    >
      <div className="max-w-2xl">
        {error && (
          <Alert variant="destructive" className="mb-4 border-red-200 bg-red-50 text-red-800">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Import failed</AlertTitle>
            <AlertDescription>
              <p className="mb-3">{error}</p>
              <button
                onClick={() => {
                  setError(null)
                  if (tab === 'url' && url) {
                    handleUrlImport()
                  }
                }}
                className="inline-flex items-center gap-2 px-3 py-1.5 bg-red-700 text-white rounded-lg hover:bg-red-800 text-sm font-medium"
              >
                <RefreshCcw size={14} />
                Try Again
              </button>
            </AlertDescription>
          </Alert>
        )}

        {successMessage && (
          <Alert className="mb-4 border-green-200 bg-green-50 text-green-800">
            <CheckCircle2 className="h-4 w-4" />
            <AlertTitle>Ready for review</AlertTitle>
            <AlertDescription>{successMessage}</AlertDescription>
          </Alert>
        )}

        {tab === 'url' && (
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-primary mb-2">
                Recipe URL
              </label>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://example.com/recipe"
                  className="flex-1 px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#d97757] focus:border-transparent"
                />
                <button
                  onClick={handleUrlImport}
                  disabled={loading || !url}
                  className="px-6 py-3 bg-tertiary text-white rounded-lg hover:bg-[#c66647] active:bg-[#b85537] transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-tertiary flex items-center justify-center gap-2 min-w-[120px]"
                >
                  {loading ? (
                    <>
                      <Swirling className="w-5 h-5" />
                      <span>Importing…</span>
                    </>
                  ) : (
                    <>
                      <LinkIcon size={20} />
                      <span>Import</span>
                    </>
                  )}
                </button>
              </div>
            </div>

            {scrapingLogs && (
              <div className="flex justify-end">
                <button
                  onClick={() => setShowLogs(!showLogs)}
                  className="inline-flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  <FileText size={14} />
                  {showLogs ? 'Hide' : 'View'} Scraping Logs
                </button>
              </div>
            )}

            {showLogs && scrapingLogs && (
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-semibold text-gray-900">Scraping Results</h3>
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    scrapingLogs.confidence >= 0.9 ? 'bg-green-100 text-green-800' :
                    scrapingLogs.confidence >= 0.7 ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    Confidence: {Math.round((scrapingLogs.confidence || 0) * 100)}%
                  </span>
                </div>

                <div className="space-y-2 text-xs">
                  <div>
                    <span className="font-medium text-gray-700">Title:</span>
                    <span className="ml-2 text-gray-600">{scrapingLogs.title || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Ingredients Found:</span>
                    <span className="ml-2 text-gray-600">{scrapingLogs.ingredients?.length || 0}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-700">Steps Found:</span>
                    <span className="ml-2 text-gray-600">{scrapingLogs.steps?.length || 0}</span>
                  </div>
                  {scrapingLogs.servings && (
                    <div>
                      <span className="font-medium text-gray-700">Servings:</span>
                      <span className="ml-2 text-gray-600">{scrapingLogs.servings}</span>
                    </div>
                  )}
                  {scrapingLogs.warnings && scrapingLogs.warnings.length > 0 && (
                    <div>
                      <span className="font-medium text-gray-700">Warnings:</span>
                      <ul className="ml-4 mt-1 list-disc text-gray-600">
                        {scrapingLogs.warnings.map((warning: string, idx: number) => (
                          <li key={idx}>{warning}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {scrapingLogs.errors && scrapingLogs.errors.length > 0 && (
                    <div>
                      <span className="font-medium text-red-700">Errors:</span>
                      <ul className="ml-4 mt-1 list-disc text-red-600">
                        {scrapingLogs.errors.map((error: string, idx: number) => (
                          <li key={idx}>{error}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {scrapingLogs.raw_text && (
                    <details className="mt-2">
                      <summary className="font-medium text-gray-700 cursor-pointer hover:text-gray-900">
                        Raw Text (click to expand)
                      </summary>
                      <pre className="mt-2 p-2 bg-white border border-gray-200 rounded text-[10px] overflow-x-auto max-h-40 overflow-y-auto">
                        {scrapingLogs.raw_text}
                      </pre>
                    </details>
                  )}
                </div>
              </div>
            )}

            <p className="text-sm text-primary/60">
              Paste a link to a recipe from any website. We support 376+ recipe sites with high-accuracy extraction.
            </p>
            <div className="mt-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-xs text-blue-800">
                <strong>💡 Tip:</strong> Works best with popular sites like AllRecipes, Food Network, Bon Appétit, Serious Eats, and 370+ more!
              </p>
            </div>
          </div>
        )}

        {tab === 'ocr' && (
          <div className="space-y-4">
            {photoStage === 'idle' ? (
              <>
                <label className="block w-full cursor-pointer">
                  <div className="bg-white border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-tertiary transition-colors">
                    <Camera size={48} className="mx-auto mb-4 text-tertiary" />
                    <p className="text-lg font-medium text-primary mb-2">
                      Take a photo or choose from gallery
                    </p>
                    <p className="text-sm text-primary/60">
                      Photo will be processed automatically
                    </p>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoSelected}
                    disabled={loading}
                    className="hidden"
                  />
                </label>

                <div className="mt-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-xs text-amber-900">
                    <strong>📱 iPhone Users:</strong> Change your camera settings to save photos as JPG:
                    <br />
                    <span className="text-amber-800 font-medium">Settings → Camera → Formats → "Most Compatible"</span>
                    <br />
                    <span className="text-amber-700 text-[10px] mt-1 block">HEIC format is not supported for OCR processing</span>
                  </p>
                </div>
              </>
            ) : (
              <>
                <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-primary">Processing photo</span>
                    <span className="text-primary/60 capitalize">{photoStage}</span>
                  </div>
                  <Progress value={photoProgress} className="h-2 [&_[data-slot=progress-indicator]]:bg-tertiary" />
                  <p className="text-sm text-primary/60">
                    {photoStage === 'preparing' && 'Optimizing contrast and converting to OCR-friendly image…'}
                    {photoStage === 'ocr' && 'Recognizing text with Tesseract.js (client-side)…'}
                    {photoStage === 'parsing' && 'Parsing recipe structure with AI…'}
                    {photoStage === 'saving' && 'Saving draft for review…'}
                  </p>
                  
                  <div className="flex justify-end pt-2">
                    <button
                      type="button"
                      onClick={resetPhotoFlow}
                      disabled={loading}
                      className="inline-flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <RefreshCcw size={16} />
                      Retake Photo
                    </button>
                  </div>
                </div>

                {previewUrl && (
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <h3 className="text-sm font-medium text-primary mb-2">Processing preview</h3>
                    <img
                      src={previewUrl}
                      alt="Recipe photo being processed"
                      className="w-full rounded-lg border border-gray-200 object-contain max-h-[300px] bg-gray-50"
                    />
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </Layout>
  )
}

async function preprocessImage(file: File): Promise<{ blob: Blob; fileName: string }> {
  const isHeic = file.type === 'image/heic' ||
                 file.type === 'image/heif' ||
                 file.name.toLowerCase().endsWith('.heic') ||
                 file.name.toLowerCase().endsWith('.heif')
  
  if (isHeic) {
    throw new Error('HEIC format is not supported.\n\n📱 To change your iPhone camera settings:\n\n1. Open Settings app\n2. Scroll down and tap Camera\n3. Tap Formats\n4. Select "Most Compatible"\n\nThis will save all future photos as JPG instead of HEIC.\n\nFor this photo, please export it as JPG from the Photos app first.')
  }

  const image = await loadImage(file)
  const maxWidth = 1600
  const scale = Math.min(1, maxWidth / image.width)
  const width = Math.max(1, Math.round(image.width * scale))
  const height = Math.max(1, Math.round(image.height * scale))

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height

  const context = canvas.getContext('2d')
  if (!context) {
    throw new Error('Image processing is not supported in this browser.')
  }

  context.drawImage(image, 0, 0, width, height)
  const imageData = context.getImageData(0, 0, width, height)
  const { data } = imageData

  let min = 255
  let max = 0

  for (let index = 0; index < data.length; index += 4) {
    const grayscale = Math.round((data[index] + data[index + 1] + data[index + 2]) / 3)
    min = Math.min(min, grayscale)
    max = Math.max(max, grayscale)
  }

  const contrastRange = Math.max(1, max - min)

  for (let index = 0; index < data.length; index += 4) {
    const grayscale = Math.round((data[index] + data[index + 1] + data[index + 2]) / 3)
    const normalized = Math.max(0, Math.min(255, Math.round(((grayscale - min) / contrastRange) * 255)))
    data[index] = normalized
    data[index + 1] = normalized
    data[index + 2] = normalized
  }

  context.putImageData(imageData, 0, 0)

  const qualities = [0.85, 0.7, 0.5]
  let finalBlob: Blob | null = null

  for (const quality of qualities) {
    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob((canvasBlob) => {
        if (!canvasBlob) {
          reject(new Error('Failed to create processed image'))
          return
        }
        resolve(canvasBlob)
      }, 'image/jpeg', quality)
    })

    if (blob.size <= MAX_FILE_SIZE) {
      finalBlob = blob
      break
    }
  }

  if (!finalBlob) {
    throw new Error('Unable to compress image to required size. Try a smaller or simpler image.')
  }

  const sanitizedName = file.name
    .replace(/\.[^.]+$/i, '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]/g, '')
    .toLowerCase()
    .substring(0, 50)
  
  const fileName = (sanitizedName || `recipe${Date.now()}`) + '.jpg'
  return { blob: finalBlob, fileName }
}

function loadImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file)
    const image = new Image()

    image.onload = () => {
      URL.revokeObjectURL(objectUrl)
      resolve(image)
    }

    image.onerror = () => {
      URL.revokeObjectURL(objectUrl)
      reject(new Error('Failed to load selected image'))
    }

    image.src = objectUrl
  })
}

async function parseRecipeWithGitHubModels(rawText: string): Promise<OpenRouterRecipeDraft | null> {
  if (!rawText.trim()) {
    return null
  }

  const { data, error } = await callEdgeFunction<unknown>('parse-recipe', {
    raw_text: rawText
  })

  if (error || !data) {
    console.warn('GitHub Models parsing failed:', error || 'No data returned')
    return null
  }

  try {
    return OpenRouterRecipeSchema.parse(data)
  } catch (parseError) {
    console.warn('GitHub Models JSON validation failed, attempting normalization:', parseError)
    return normalizeOpenRouterDraft(data)
  }
}

function normalizeOpenRouterDraft(value: unknown): OpenRouterRecipeDraft | null {
  if (!value || typeof value !== 'object') {
    return null
  }

  const candidate = value as Record<string, unknown>
  const ingredients = Array.isArray(candidate.ingredients)
    ? candidate.ingredients
        .filter((ingredient): ingredient is Record<string, unknown> => !!ingredient && typeof ingredient === 'object')
        .map((ingredient) => ({
          amount: String(ingredient.amount ?? '').trim(),
          unit: String(ingredient.unit ?? '').trim(),
          name: String(ingredient.name ?? '').trim(),
        }))
        .filter((ingredient) => ingredient.name.length > 0)
    : []

  const steps = Array.isArray(candidate.steps)
    ? candidate.steps
        .filter((step): step is Record<string, unknown> => !!step && typeof step === 'object')
        .map((step, index) => ({
          order: Number.isFinite(Number(step.order)) ? Number(step.order) : index + 1,
          text: String(step.text ?? '').trim(),
        }))
        .filter((step) => step.text.length > 0)
    : []

  const tags = Array.isArray(candidate.tags)
    ? candidate.tags.map((tag) => String(tag).trim()).filter(Boolean)
    : []

  return {
    title: typeof candidate.title === 'string' && candidate.title.trim() ? candidate.title.trim() : null,
    description: typeof candidate.description === 'string' && candidate.description.trim() ? candidate.description.trim() : null,
    ingredients,
    steps,
    tags,
  }
}

function mergeDraftData(baseDraft: ParsedDraft, parsedDraft: OpenRouterRecipeDraft | null): ParsedDraft {
  const warnings = [...(baseDraft.warnings || [])]
  const flags = [...(baseDraft.flags || [])]
  const errors = [...baseDraft.errors]

  if (!parsedDraft) {
    warnings.push('Structured parsing was unavailable. Review the OCR draft manually.')
    flags.push({
      field: 'general',
      severity: 'warning',
      message: 'OpenRouter parsing did not return valid structured recipe JSON.',
    })

    return {
      ...baseDraft,
      warnings,
      flags,
      errors,
    }
  }

  const mergedIngredients = parsedDraft.ingredients.length > 0 ? parsedDraft.ingredients : baseDraft.ingredients
  const mergedSteps = parsedDraft.steps.length > 0 ? parsedDraft.steps : baseDraft.steps
  const mergedTitle = parsedDraft.title || baseDraft.title
  const mergedDescription = parsedDraft.description || baseDraft.description
  const mergedTags = parsedDraft.tags.length > 0 ? parsedDraft.tags : baseDraft.tags

  if (!parsedDraft.ingredients.length) {
    warnings.push('AI parsing did not improve ingredients. Using OCR-derived ingredients.')
  }

  if (!parsedDraft.steps.length) {
    warnings.push('AI parsing did not improve steps. Using OCR-derived steps.')
  }

  if (!mergedIngredients.length) {
    errors.push('Ingredients require manual review before publishing.')
  }

  if (!mergedSteps.length) {
    errors.push('Steps require manual review before publishing.')
  }

  return {
    ...baseDraft,
    title: mergedTitle,
    description: mergedDescription,
    ingredients: mergedIngredients,
    steps: mergedSteps,
    tags: mergedTags,
    warnings,
    flags,
    errors,
  }
}

