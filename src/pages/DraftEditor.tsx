import { useMemo, useRef, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useDraft } from '../hooks/useDraft'
import { supabase, callEdgeFunction } from '../lib/supabase'
import slugify from 'slugify'
import { Save, Share2, Trash2, Eye, Check, AlertTriangle, FileText, Camera, RefreshCcw } from 'lucide-react'
import type { Ingredient, ImportFlagField, OcrImportResult } from '../lib/types/recipe'
import { Layout } from '../components/Layout'
import { Alert, AlertDescription, AlertTitle } from '../app/components/ui/alert'
import { Progress } from '../app/components/ui/progress'
import heic2any from 'heic2any'
import { z } from 'zod'

type ImportStage =
  | 'idle'
  | 'preparing'
  | 'ready'
  | 'uploading'
  | 'ocr'
  | 'parsing'
  | 'saving'

const OPENROUTER_MODELS = ['nvidia/nemotron-3-ultra-550b-a55b:free', 'google/gemma-4-31b-it:free']
const MAX_FILE_SIZE = 500 * 1024

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

export function DraftEditor() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { draft, updateField, save, saveStatus, loading } = useDraft(id!)
  const [showShare, setShowShare] = useState(false)
  const [photoStage, setPhotoStage] = useState<ImportStage>('idle')
  const [photoProgress, setPhotoProgress] = useState(0)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [processedBlob, setProcessedBlob] = useState<Blob | null>(null)
  const [processedFileName, setProcessedFileName] = useState<string>('recipe-photo.jpg')
  const [photoError, setPhotoError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const openRouterKey = (import.meta as ImportMeta & { env?: Record<string, string> }).env?.NEXT_PUBLIC_OPENROUTER_KEY || ''

  // Validation state
  const validation = useMemo(() => {
    const hasTitle = !!draft?.title?.trim()
    const hasIngredients = (draft?.ingredients?.length || 0) > 0
    const hasSteps = (draft?.steps?.length || 0) > 0
    const hasValidIngredients = draft?.ingredients?.every(ing => ing.name.trim())
    const hasValidSteps = draft?.steps?.every(step => step.text.trim())
    
    const requiredFields = [
      { field: 'title', valid: hasTitle, label: 'Title' },
      { field: 'ingredients', valid: hasIngredients && hasValidIngredients, label: 'At least one ingredient' },
      { field: 'steps', valid: hasSteps && hasValidSteps, label: 'At least one step' },
    ]
    
    const completedCount = requiredFields.filter(f => f.valid).length
    const isReadyToPublish = completedCount === requiredFields.length
    
    return {
      requiredFields,
      completedCount,
      totalCount: requiredFields.length,
      isReadyToPublish,
      percentage: Math.round((completedCount / requiredFields.length) * 100)
    }
  }, [draft])

  const flaggedFields = useMemo(() => {
    const grouped = new Map<ImportFlagField, string[]>()

    for (const flag of draft?.import_flags || []) {
      const messages = grouped.get(flag.field) || []
      messages.push(flag.message)
      grouped.set(flag.field, messages)
    }

    return grouped
  }, [draft?.import_flags])

  const getFieldClassName = (field: ImportFlagField) => {
    return flaggedFields.has(field)
      ? 'w-full px-4 py-2 bg-amber-50 border border-amber-300 rounded-lg focus:ring-2 focus:ring-[#d97757] focus:border-transparent'
      : 'w-full px-4 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#d97757] focus:border-transparent'
  }

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
    setPhotoError(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  if (loading || !draft) {
    return (
      <Layout showBack onBack={() => navigate('/me')} title="Draft" hideNav>
        <div className="flex items-center justify-center py-24">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-tertiary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-primary/60">Loading draft…</p>
          </div>
        </div>
      </Layout>
    )
  }

  const addIngredient = () => {
    updateField('ingredients', [...draft.ingredients, { amount: '', unit: '', name: '' }])
  }

  const updateIngredient = (idx: number, field: keyof Ingredient, value: string) => {
    const updated = [...draft.ingredients]
    updated[idx] = { ...updated[idx], [field]: value }
    updateField('ingredients', updated)
  }

  const removeIngredient = (idx: number) => {
    updateField('ingredients', draft.ingredients.filter((_, i) => i !== idx))
  }

  const addStep = () => {
    const nextOrder = draft.steps.length > 0 ? Math.max(...draft.steps.map(s => s.order)) + 1 : 1
    updateField('steps', [...draft.steps, { order: nextOrder, text: '' }])
  }

  const updateStep = (idx: number, text: string) => {
    const updated = [...draft.steps]
    updated[idx] = { ...updated[idx], text }
    updateField('steps', updated)
  }

  const removeStep = (idx: number) => {
    updateField('steps', draft.steps.filter((_, i) => i !== idx))
  }

  const handlePhotoSelected = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setPhotoError(null)
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
      setPhotoError(err instanceof Error ? err.message : 'Failed to prepare photo')
    }
  }

  const handleApplyPhotoOcr = async () => {
    if (!processedBlob) return

    setPhotoError(null)

    try {
      setPhotoStage('uploading')
      setPhotoProgress(15)

      const uploadFile = new File([processedBlob], processedFileName, { type: processedBlob.type || 'image/jpeg' })
      const filePath = `${draft.owner_id}/${Date.now()}-${processedFileName}`

      const { error: uploadError } = await supabase.storage
        .from('ocr-uploads')
        .upload(filePath, uploadFile, { upsert: false })

      if (uploadError) {
        throw new Error(`Upload failed: ${uploadError.message}`)
      }

      setPhotoStage('ocr')
      setPhotoProgress(45)

      const { data: ocrData, error: edgeError } = await callEdgeFunction<OcrImportResult>('import-ocr', {
        storage_path: filePath
      })

      if (edgeError || !ocrData) {
        throw new Error(edgeError || 'Failed to process image')
      }

      setPhotoStage('parsing')
      setPhotoProgress(68)

      const parsedDraft = await parseRecipeWithOpenRouter(ocrData.raw_text || '', openRouterKey)
      const mergedDraft = mergeDraftData(ocrData, parsedDraft)

      setPhotoStage('saving')
      setPhotoProgress(88)

      updateField('title', mergedDraft.title || draft.title)
      updateField('description', mergedDraft.description ?? draft.description)
      updateField('ingredients', mergedDraft.ingredients)
      updateField('steps', mergedDraft.steps)
      updateField('tags', mergedDraft.tags)
      updateField('raw_text', mergedDraft.raw_text)
      updateField('import_confidence', mergedDraft.confidence)
      updateField('import_errors', mergedDraft.errors)
      updateField('import_warnings', mergedDraft.warnings ?? [])
      updateField('import_flags', mergedDraft.flags ?? [])
      updateField('import_method', 'ocr')
      updateField('import_source', selectedFile?.name || processedFileName)
      updateField('ocr_engine', mergedDraft.ocr_engine ?? 'paddleocr')

      await supabase
        .from('recipes')
        .update({
          title: mergedDraft.title || draft.title,
          description: mergedDraft.description ?? draft.description,
          ingredients: mergedDraft.ingredients,
          steps: mergedDraft.steps,
          tags: mergedDraft.tags,
          raw_text: mergedDraft.raw_text,
          import_confidence: mergedDraft.confidence,
          import_errors: mergedDraft.errors,
          import_warnings: mergedDraft.warnings ?? [],
          import_flags: mergedDraft.flags ?? [],
          import_method: 'ocr',
          import_source: selectedFile?.name || processedFileName,
          ocr_engine: mergedDraft.ocr_engine ?? 'paddleocr',
        })
        .eq('id', draft.id)

      setPhotoProgress(100)
      resetPhotoFlow()
    } catch (err) {
      setPhotoError(err instanceof Error ? err.message : 'Failed to update recipe from photo')
      setPhotoStage('ready')
      setPhotoProgress(0)
    }
  }

  const handlePublish = async () => {
    if (!validation.isReadyToPublish) {
      return // Button should be disabled, but double-check
    }

    const reviewedAt = new Date().toISOString()
    updateField('import_reviewed_at', reviewedAt)
    await save()

    const slug = slugify(draft.title, { lower: true, strict: true })
    const { error } = await supabase
      .from('recipes')
      .update({
        status: 'published',
        published_at: new Date().toISOString(),
        import_reviewed_at: reviewedAt,
        slug
      })
      .eq('id', draft.id)

    if (!error) {
      navigate(`/recipes/${slug}`)
    }
  }

  const handleDelete = async () => {
    if (!confirm('Delete this recipe?')) return

    const { error } = await supabase.from('recipes').delete().eq('id', draft.id)
    if (!error) navigate('/me')
  }

  const generateShareLink = async () => {
    if (!draft.share_token) {
      const shareToken = crypto.randomUUID()
      const { error } = await supabase
        .from('recipes')
        .update({ share_token: shareToken, share_enabled: true })
        .eq('id', draft.id)

      if (!error) {
        updateField('share_token', shareToken)
        updateField('share_enabled', true)
      }
    }
    setShowShare(true)
  }

  return (
    <Layout
      showBack
      onBack={() => navigate('/me')}
      title="Edit Draft"
      hideNav
      rightSlot={
        <div className="flex items-center gap-2">
          <span className="text-xs sm:text-sm text-primary/60 flex items-center gap-1">
            {saveStatus === 'saved' && (<><Check size={14} className="text-green-600" /> Saved</>)}
            {saveStatus === 'saving' && 'Saving…'}
            {saveStatus === 'unsaved' && 'Unsaved'}
          </span>
          <button onClick={save} aria-label="Save now" className="p-2 hover:bg-gray-100 rounded">
            <Save size={20} />
          </button>
        </div>
      }
    >
      <div className="max-w-3xl pb-28">
        {/* Validation Progress Card */}
        <div className={`mb-6 rounded-lg border p-4 ${
          validation.isReadyToPublish
            ? 'bg-green-50 border-green-200'
            : 'bg-amber-50 border-amber-200'
        }`}>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              {validation.isReadyToPublish ? (
                <Check className="w-5 h-5 text-green-600" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-amber-600" />
              )}
              <h3 className={`font-medium ${
                validation.isReadyToPublish ? 'text-green-900' : 'text-amber-900'
              }`}>
                {validation.isReadyToPublish ? 'Ready to publish!' : 'Complete required fields'}
              </h3>
            </div>
            <span className={`text-sm font-semibold ${
              validation.isReadyToPublish ? 'text-green-700' : 'text-amber-700'
            }`}>
              {validation.completedCount}/{validation.totalCount}
            </span>
          </div>
          <div className="space-y-2">
            {validation.requiredFields.map(field => (
              <div key={field.field} className="flex items-center gap-2 text-sm">
                {field.valid ? (
                  <Check className="w-4 h-4 text-green-600 flex-shrink-0" />
                ) : (
                  <div className="w-4 h-4 rounded-full border-2 border-amber-400 flex-shrink-0" />
                )}
                <span className={field.valid ? 'text-green-800' : 'text-amber-800'}>
                  {field.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="rounded-lg border border-gray-200 bg-white p-4 space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="font-medium text-primary">Update from photo</h2>
                <p className="text-sm text-primary/60">
                  Upload a new recipe photo to re-run OCR with PaddleOCR and replace the current draft fields.
                </p>
              </div>
              <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-gray-300 px-3 py-2 text-sm hover:bg-gray-50">
                <Camera size={16} />
                Choose photo
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*,.heic,.HEIC"
                  capture="environment"
                  onChange={handlePhotoSelected}
                  className="hidden"
                />
              </label>
            </div>

            {photoError && (
              <Alert variant="destructive" className="border-red-200 bg-red-50 text-red-800">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Photo update failed</AlertTitle>
                <AlertDescription>{photoError}</AlertDescription>
              </Alert>
            )}

            {photoStage !== 'idle' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="font-medium text-primary">Photo OCR progress</span>
                  <span className="capitalize text-primary/60">{photoStage}</span>
                </div>
                <Progress value={photoProgress} className="h-2 [&_[data-slot=progress-indicator]]:bg-tertiary" />
              </div>
            )}

            {previewUrl && (
              <div className="space-y-4">
                <img
                  src={previewUrl}
                  alt="Processed recipe preview"
                  className="w-full rounded-lg border border-gray-200 object-contain max-h-[420px] bg-gray-50"
                />
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    type="button"
                    onClick={handleApplyPhotoOcr}
                    disabled={!processedBlob || photoStage === 'uploading' || photoStage === 'ocr' || photoStage === 'parsing' || photoStage === 'saving'}
                    className="flex-1 px-4 py-3 bg-tertiary text-white rounded-lg hover:bg-tertiary disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Apply OCR to this draft
                  </button>
                  <button
                    type="button"
                    onClick={resetPhotoFlow}
                    className="inline-flex items-center justify-center gap-2 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    <RefreshCcw size={16} />
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>

          {draft.import_method === 'ocr' && (
            <div className="space-y-4">
              {(draft.import_warnings?.length || 0) > 0 && (
                <Alert className="border-amber-200 bg-amber-50 text-amber-900">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>OCR review recommended</AlertTitle>
                  <AlertDescription>
                    <ul className="list-disc pl-5 space-y-1">
                      {(draft.import_warnings || []).map((warning) => (
                        <li key={warning}>{warning}</li>
                      ))}
                    </ul>
                  </AlertDescription>
                </Alert>
              )}

              {!!draft.import_flags?.length && (
                <div className="rounded-lg border border-gray-200 bg-white p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <FileText size={18} className="text-tertiary" />
                    <h2 className="font-medium text-primary">Flagged fields</h2>
                  </div>
                  <div className="space-y-2">
                    {draft.import_flags.map((flag, index) => (
                      <div
                        key={`${flag.field}-${flag.message}-${index}`}
                        className="rounded-md border border-gray-200 px-3 py-2 text-sm"
                      >
                        <span className="font-medium capitalize">{flag.field}</span>
                        <span className="mx-2 text-primary/40">•</span>
                        <span className="uppercase text-xs tracking-wide text-primary/60">{flag.severity}</span>
                        <p className="mt-1 text-primary/70">{flag.message}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {!!draft.raw_text && (
                <div className="rounded-lg border border-gray-200 bg-white p-4">
                  <h2 className="font-medium text-primary mb-2">Raw OCR text</h2>
                  <p className="text-xs text-primary/60 mb-3">
                    Confidence: {Math.round((draft.import_confidence || 0) * 100)}%{draft.ocr_engine ? ` • Engine: ${draft.ocr_engine}` : ''}
                  </p>
                  <textarea
                    value={draft.raw_text}
                    onChange={(e) => updateField('raw_text', e.target.value)}
                    rows={10}
                    className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm"
                  />
                </div>
              )}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-primary mb-2">Title *</label>
            <input
              type="text"
              value={draft.title}
              onChange={(e) => updateField('title', e.target.value)}
              className={getFieldClassName('title')}
              placeholder="Enter recipe title"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-primary mb-2">Description</label>
            <textarea
              value={draft.description || ''}
              onChange={(e) => updateField('description', e.target.value)}
              rows={3}
              className={getFieldClassName('description')}
              placeholder="Describe your recipe"
            />
          <div>
            <label className="block text-sm font-medium text-primary mb-2">Servings</label>
            <input
              type="number"
              value={draft.servings || ''}
              onChange={(e) => updateField('servings', e.target.value ? parseInt(e.target.value) : null)}
              className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#d97757] focus:border-transparent"
              placeholder="4"
              min="1"
              max="50"
            />
            <p className="text-xs text-primary/60 mt-1">Number of servings this recipe makes (optional, used for scaling)</p>
          </div>

          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-primary mb-2">Image URL</label>
              <input
                type="url"
                value={draft.image_url || ''}
                onChange={(e) => updateField('image_url', e.target.value)}
                className={getFieldClassName('image')}
                placeholder="https://…"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-primary mb-2">Source URL</label>
              <input
                type="url"
                value={draft.source_url || ''}
                onChange={(e) => updateField('source_url', e.target.value)}
                className={getFieldClassName('source')}
                placeholder="https://…"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-primary mb-2">Tags (comma-separated)</label>
            <input
              type="text"
              value={draft.tags.join(', ')}
              onChange={(e) => updateField('tags', e.target.value.split(',').map(t => t.trim()).filter(Boolean))}
              className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#d97757] focus:border-transparent"
              placeholder="dinner, Italian, vegetarian"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-primary">Ingredients *</label>
              <button onClick={addIngredient} className="text-tertiary text-sm hover:underline">
                + Add ingredient
              </button>
            </div>
            <div className="space-y-2">
              {draft.ingredients.map((ing, idx) => (
                <div key={idx} className="flex gap-2">
                  <input
                    type="text"
                    value={ing.amount}
                    onChange={(e) => updateIngredient(idx, 'amount', e.target.value)}
                    placeholder="1"
                    className="w-16 px-3 py-2 bg-white border border-gray-300 rounded-lg"
                  />
                  <input
                    type="text"
                    value={ing.unit}
                    onChange={(e) => updateIngredient(idx, 'unit', e.target.value)}
                    placeholder="cup"
                    className="w-20 px-3 py-2 bg-white border border-gray-300 rounded-lg"
                  />
                  <input
                    type="text"
                    value={ing.name}
                    onChange={(e) => updateIngredient(idx, 'name', e.target.value)}
                    placeholder="flour"
                    className="flex-1 px-3 py-2 bg-white border border-gray-300 rounded-lg"
                  />
                  <button onClick={() => removeIngredient(idx)} aria-label="Remove ingredient" className="p-2 text-red-600 hover:bg-red-50 rounded">
                    <Trash2 size={20} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-primary">Steps *</label>
              <button onClick={addStep} className="text-tertiary text-sm hover:underline">
                + Add step
              </button>
            </div>
            <div className="space-y-2">
              {draft.steps.sort((a, b) => a.order - b.order).map((step, idx) => (
                <div key={idx} className="flex gap-2">
                  <span className="w-8 h-10 flex items-center justify-center bg-tertiary/10 text-tertiary rounded font-medium">
                    {step.order}
                  </span>
                  <textarea
                    value={step.text}
                    onChange={(e) => updateStep(idx, e.target.value)}
                    rows={2}
                    placeholder="Describe this step"
                    className="flex-1 px-3 py-2 bg-white border border-gray-300 rounded-lg"
                  />
                  <button onClick={() => removeStep(idx)} aria-label="Remove step" className="p-2 text-red-600 hover:bg-red-50 rounded">
                    <Trash2 size={20} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 pb-[max(env(safe-area-inset-bottom),1rem)] z-30">
        <div className="max-w-3xl mx-auto flex gap-3">
          <button
            onClick={handlePublish}
            disabled={!validation.isReadyToPublish}
            className="flex-1 bg-tertiary text-white py-3 rounded-lg font-medium hover:bg-tertiary flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            title={!validation.isReadyToPublish ? 'Complete all required fields to publish' : 'Publish recipe'}
          >
            <Eye size={20} />
            {validation.isReadyToPublish ? 'Publish' : `Publish (${validation.completedCount}/${validation.totalCount})`}
          </button>
          <button onClick={generateShareLink} aria-label="Share draft" className="px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50">
            <Share2 size={20} />
          </button>
          <button onClick={handleDelete} aria-label="Delete draft" className="px-4 py-3 border border-red-300 text-red-600 rounded-lg hover:bg-red-50">
            <Trash2 size={20} />
          </button>
        </div>
      </div>

      {showShare && draft.share_token && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" onClick={() => setShowShare(false)}>
          <div className="bg-white rounded-lg p-6 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
            <h2 className="font-serif text-2xl mb-4">Share Draft</h2>
            <div className="bg-gray-100 p-3 rounded mb-4 break-all text-sm">
              {window.location.origin}/share/{draft.share_token}
            </div>
            <button
              onClick={() => {
                navigator.clipboard.writeText(`${window.location.origin}/share/${draft.share_token}`)
                alert('Link copied!')
              }}
              className="w-full bg-tertiary text-white py-2 rounded-lg hover:bg-tertiary"
            >
              Copy Link
            </button>
          </div>
        </div>
      )}
    </Layout>
  )
}

async function preprocessImage(file: File): Promise<{ blob: Blob; fileName: string }> {
  let processFile = file
  const isHeic = file.type === 'image/heic' || file.name.toLowerCase().endsWith('.heic')

  if (isHeic) {
    const convertedBlob = await heic2any({
      blob: file,
      toType: 'image/png',
      quality: 0.9
    })

    const pngBlob = Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob
    processFile = new File([pngBlob], file.name.replace(/\.heic$/i, '.png'), { type: 'image/png' })
  }

  const image = await loadImage(processFile)
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

  const fileName = file.name.replace(/\.[^.]+$/i, '') + '-processed.jpg'
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

async function parseRecipeWithOpenRouter(rawText: string, apiKey: string): Promise<OpenRouterRecipeDraft | null> {
  if (!rawText.trim() || !apiKey) {
    return null
  }

  const systemPrompt = [
    'Tu es un expert en extraction de recettes. Extrais la recette à partir du texte OCR dans un format JSON strict.',
    'SCHÉMA JSON OBLIGATOIRE :',
    '{',
    '  "title": string | null,',
    '  "description": string | null,',
    '  "ingredients": [{ "amount": string, "unit": string, "name": string }],',
    '  "steps": [{ "order": number, "text": string }],',
    '  "tags": string[]',
    '}',
    'RÈGLES :',
    '- Retourne UNIQUEMENT du JSON valide, sans balises markdown ni commentaire',
    '- Si un champ est inconnu, utilise null pour title/description et des tableaux vides pour ingredients/steps/tags',
    '- Chaque ingrédient doit contenir amount, unit et name (utilise des chaînes vides si nécessaire)',
    '- Les étapes doivent avoir des numéros d’ordre séquentiels à partir de 1',
    '- Extrais des tags liés à la cuisine et au type de recette'
  ].join('\n')

  for (const model of OPENROUTER_MODELS) {
    try {
      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
          'HTTP-Referer': window.location.origin,
          'X-Title': 'Umami Recipe App'
        },
        body: JSON.stringify({
          model,
          response_format: { type: 'json_object' },
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: `Extrais la recette à partir de ce texte OCR :\n\n${rawText}` }
          ],
          temperature: 0.3,
          max_tokens: 2000
        })
      })

      if (!response.ok) {
        const errorText = await response.text()
        if (response.status === 429) {
          console.warn(`OpenRouter ${model} rate limited (429). Trying next model.`)
        } else {
          console.warn(`OpenRouter ${model} failed:`, response.status, errorText)
        }
        continue
      }

      const json = await response.json()
      const content = json?.choices?.[0]?.message?.content

      if (!content || typeof content !== 'string') {
        const apiError = json?.error?.message
        if (apiError) {
          console.warn(`OpenRouter ${model} returned API error:`, apiError)
        } else {
          console.warn(`OpenRouter ${model} returned invalid content:`, json)
        }
        continue
      }

      return OpenRouterRecipeSchema.parse(JSON.parse(content))
    } catch (error) {
      console.warn(`OpenRouter ${model} request or parsing failed:`, error)
      continue
    }
  }

  console.warn('All OpenRouter models failed or were rate-limited. Falling back to OCR-only draft.')
  return null
}

function mergeDraftData(baseDraft: OcrImportResult, parsedDraft: OpenRouterRecipeDraft | null): OcrImportResult {
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
