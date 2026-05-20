import { useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase, callEdgeFunction } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { Layout } from '../components/Layout'
import { Link as LinkIcon, Camera, Sparkles, AlertTriangle, RefreshCcw, CheckCircle2 } from 'lucide-react'
import { Progress } from '../app/components/ui/progress'
import { Alert, AlertDescription, AlertTitle } from '../app/components/ui/alert'
import type { DraftSchema, ImportFlag } from '../lib/types/recipe'

type ImportStage =
  | 'idle'
  | 'preparing'
  | 'ready'
  | 'uploading'
  | 'ocr'
  | 'parsing'
  | 'saving'

type OpenRouterRecipeDraft = {
  title: string | null
  description: string | null
  ingredients: Array<{ amount: string; unit: string; name: string }>
  steps: Array<{ order: number; text: string }>
  tags: string[]
}

type ParsedDraft = DraftSchema & {
  warnings: string[]
  flags: ImportFlag[]
}

const OPENROUTER_MODELS = ['google/gemma-3-27b-it:free', 'mistralai/mistral-7b-instruct:free']

export function Import() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const [tab, setTab] = useState<'url' | 'ocr'>('url')
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  const [photoStage, setPhotoStage] = useState<ImportStage>('idle')
  const [photoProgress, setPhotoProgress] = useState(0)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [processedBlob, setProcessedBlob] = useState<Blob | null>(null)
  const [processedFileName, setProcessedFileName] = useState<string>('recipe-photo.jpg')
  const [ocrWarnings, setOcrWarnings] = useState<string[]>([])
  const [ocrFlags, setOcrFlags] = useState<ImportFlag[]>([])

  const openRouterKey = (import.meta as ImportMeta & { env?: Record<string, string> }).env?.NEXT_PUBLIC_OPENROUTER_KEY || ''

  const canConfirmPhoto = useMemo(() => {
    return !loading && !!processedBlob && !!user
  }, [loading, processedBlob, user])

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

    try {
      const { data, error: edgeError } = await callEdgeFunction<DraftSchema>('import-url', { url })

      if (edgeError) {
        setError(edgeError)
        setLoading(false)
        return
      }

      if (data) {
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
      setError(err instanceof Error ? err.message : 'Failed to import recipe')
    } finally {
      setLoading(false)
    }
  }

  const handlePhotoSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setLoading(false)
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
      setPhotoStage('ready')
      setPhotoProgress(100)
    } catch (err) {
      setPhotoStage('idle')
      setPhotoProgress(0)
      setError(err instanceof Error ? err.message : 'Failed to prepare photo')
    }
  }

  const handleConfirmPhoto = async () => {
    if (!processedBlob || !user) return

    setLoading(true)
    setError(null)
    setSuccessMessage(null)
    setOcrWarnings([])
    setOcrFlags([])

    try {
      setPhotoStage('uploading')
      setPhotoProgress(15)

      const uploadFile = new File([processedBlob], processedFileName, { type: processedBlob.type || 'image/jpeg' })
      const filePath = `${user.id}/${Date.now()}-${processedFileName}`

      const { error: uploadError } = await supabase.storage
        .from('ocr-uploads')
        .upload(filePath, uploadFile, { upsert: false })

      if (uploadError) throw uploadError

      setPhotoStage('ocr')
      setPhotoProgress(45)

      const { data: ocrData, error: edgeError } = await callEdgeFunction<ParsedDraft>('import-ocr', {
        storage_path: filePath
      })

      if (edgeError || !ocrData) {
        throw new Error(edgeError || 'Failed to process image')
      }

      setPhotoProgress(68)
      setPhotoStage('parsing')

      const parsedDraft = await parseRecipeWithOpenRouter(ocrData.raw_text || '', openRouterKey)
      const mergedDraft = mergeDraftData(ocrData, parsedDraft)

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
          owner_id: user.id,
          status: 'draft',
          import_method: 'ocr',
          import_source: selectedFile?.name || processedFileName,
          raw_text: mergedDraft.raw_text,
          import_confidence: mergedDraft.confidence,
          import_errors: mergedDraft.errors,
          import_warnings: mergedDraft.warnings,
          import_flags: mergedDraft.flags,
          slug
        })
        .select()
        .single()

      if (insertError) throw insertError

      setPhotoProgress(100)
      setSuccessMessage('Photo imported. Review flagged fields before publishing.')
      navigate(`/drafts/${recipe.id}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process image')
      setPhotoStage('ready')
      setPhotoProgress(0)
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
                ? 'text-[#C0622F] border-b-2 border-[#C0622F]'
                : 'text-[#1A1A18]/60 hover:text-[#1A1A18]'
            }`}
          >
            From URL
          </button>
          <button
            onClick={() => setTab('ocr')}
            className={`pb-3 px-1 font-medium transition-colors ${
              tab === 'ocr'
                ? 'text-[#C0622F] border-b-2 border-[#C0622F]'
                : 'text-[#1A1A18]/60 hover:text-[#1A1A18]'
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
            <AlertDescription>{error}</AlertDescription>
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
              <label className="block text-sm font-medium text-[#1A1A18] mb-2">
                Recipe URL
              </label>
              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="https://example.com/recipe"
                  className="flex-1 px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C0622F] focus:border-transparent"
                />
                <button
                  onClick={handleUrlImport}
                  disabled={loading || !url}
                  className="px-6 py-3 bg-[#C0622F] text-white rounded-lg hover:bg-[#A0522D] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <LinkIcon size={20} />
                  {loading ? 'Importing…' : 'Import'}
                </button>
              </div>
            </div>
            <p className="text-sm text-[#1A1A18]/60">
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
            <label className="block w-full cursor-pointer">
              <div className="bg-white border-2 border-dashed border-gray-300 rounded-lg p-12 text-center hover:border-[#C0622F] transition-colors">
                <Camera size={48} className="mx-auto mb-4 text-[#C0622F]" />
                <p className="text-lg font-medium text-[#1A1A18] mb-2">
                  {photoStage === 'preparing' ? 'Preparing photo…' : 'Take or upload a photo'}
                </p>
                <p className="text-sm text-[#1A1A18]/60">
                  Photograph a printed recipe page, then confirm before OCR runs
                </p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handlePhotoSelected}
                disabled={loading}
                className="hidden"
              />
            </label>

            {photoStage !== 'idle' && (
              <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-[#1A1A18]">Import progress</span>
                  <span className="text-[#1A1A18]/60 capitalize">{photoStage}</span>
                </div>
                <Progress value={photoProgress} className="h-2 [&_[data-slot=progress-indicator]]:bg-[#C0622F]" />
                <p className="text-sm text-[#1A1A18]/60">
                  {photoStage === 'preparing' && 'Optimizing contrast and converting to OCR-friendly image…'}
                  {photoStage === 'ready' && 'Preview the processed image and confirm when it looks readable.'}
                  {photoStage === 'uploading' && 'Uploading processed image…'}
                  {photoStage === 'ocr' && 'Recognizing text from the recipe page…'}
                  {photoStage === 'parsing' && 'Parsing recipe structure with OpenRouter…'}
                  {photoStage === 'saving' && 'Saving draft for review…'}
                </p>
              </div>
            )}

            {previewUrl && (
              <div className="bg-white border border-gray-200 rounded-lg p-4 space-y-4">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h2 className="font-medium text-[#1A1A18]">Processed preview</h2>
                    <p className="text-sm text-[#1A1A18]/60">
                      Confirm this looks clean before OCR starts.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={resetPhotoFlow}
                    className="inline-flex items-center gap-2 px-3 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
                  >
                    <RefreshCcw size={16} />
                    Retake
                  </button>
                </div>

                <img
                  src={previewUrl}
                  alt="Processed recipe preview"
                  className="w-full rounded-lg border border-gray-200 object-contain max-h-[420px] bg-gray-50"
                />

                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    type="button"
                    onClick={handleConfirmPhoto}
                    disabled={!canConfirmPhoto}
                    className="flex-1 px-4 py-3 bg-[#C0622F] text-white rounded-lg hover:bg-[#A0522D] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? 'Processing…' : 'Use this photo'}
                  </button>
                  <button
                    type="button"
                    onClick={resetPhotoFlow}
                    className="px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}

            {(ocrWarnings.length > 0 || ocrFlags.length > 0) && (
              <div className="space-y-3">
                {ocrWarnings.length > 0 && (
                  <Alert className="border-amber-200 bg-amber-50 text-amber-900">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertTitle>Review needed</AlertTitle>
                    <AlertDescription>
                      <ul className="list-disc pl-5 space-y-1">
                        {ocrWarnings.map((warning) => (
                          <li key={warning}>{warning}</li>
                        ))}
                      </ul>
                    </AlertDescription>
                  </Alert>
                )}

                {ocrFlags.length > 0 && (
                  <div className="bg-white border border-gray-200 rounded-lg p-4">
                    <h3 className="font-medium text-[#1A1A18] mb-2">Flagged fields</h3>
                    <div className="space-y-2">
                      {ocrFlags.map((flag, index) => (
                        <div
                          key={`${flag.field}-${flag.message}-${index}`}
                          className="rounded-md border border-gray-200 px-3 py-2 text-sm"
                        >
                          <span className="font-medium capitalize">{flag.field}</span>
                          <span className="mx-2 text-[#1A1A18]/40">•</span>
                          <span className="uppercase text-xs tracking-wide text-[#1A1A18]/60">{flag.severity}</span>
                          <p className="mt-1 text-[#1A1A18]/70">{flag.message}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  )
}

async function preprocessImage(file: File): Promise<{ blob: Blob; fileName: string }> {
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

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((canvasBlob) => {
      if (!canvasBlob) {
        reject(new Error('Failed to create processed image'))
        return
      }
      resolve(canvasBlob)
    }, 'image/jpeg', 0.92)
  })

  const fileName = file.name.replace(/\.[^.]+$/, '') + '-processed.jpg'
  return { blob, fileName }
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

async function parseRecipeWithOpenRouter(rawText: string, apiKey: string): Promise<OpenRouterRecipeDraft | null> {
  if (!rawText.trim()) {
    return null
  }

  if (!apiKey) {
    return null
  }

  const systemPrompt = [
    'Extract a printed recipe page into strict JSON.',
    'Return only valid JSON with keys: title, description, ingredients, steps, tags.',
    'ingredients must be an array of objects with amount, unit, name.',
    'steps must be an array of objects with order and text.',
    'If a field is unknown, use null for title/description and empty arrays for ingredients/steps/tags.',
    'Do not include markdown fences or commentary.'
  ].join(' ')

  for (const model of OPENROUTER_MODELS) {
    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model,
          response_format: { type: 'json_object' },
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: rawText }
          ]
        })
      })

      if (!response.ok) {
        continue
      }

      const json = await response.json()
      const content = json?.choices?.[0]?.message?.content

      if (!content || typeof content !== 'string') {
        continue
      }

      const candidate = JSON.parse(content)
      return normalizeOpenRouterDraft(candidate)
    } catch {
      continue
    }
  }

  return null
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

// Made with Bob
