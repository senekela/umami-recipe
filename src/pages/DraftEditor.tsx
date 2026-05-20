import { useMemo, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useDraft } from '../hooks/useDraft'
import { supabase } from '../lib/supabase'
import slugify from 'slugify'
import { Save, Share2, Trash2, Eye, Check, AlertTriangle, FileText } from 'lucide-react'
import type { Ingredient, ImportFlagField } from '../lib/types/recipe'
import { Layout } from '../components/Layout'
import { Alert, AlertDescription, AlertTitle } from '../app/components/ui/alert'

export function DraftEditor() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { draft, updateField, save, saveStatus, loading } = useDraft(id!)
  const [showShare, setShowShare] = useState(false)

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
      ? 'w-full px-4 py-2 bg-amber-50 border border-amber-300 rounded-lg focus:ring-2 focus:ring-[#C0622F] focus:border-transparent'
      : 'w-full px-4 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C0622F] focus:border-transparent'
  }

  if (loading || !draft) {
    return (
      <Layout showBack onBack={() => navigate('/me')} title="Draft" hideNav>
        <div className="flex items-center justify-center py-24">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-[#C0622F] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-[#1A1A18]/60">Loading draft…</p>
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

  const handlePublish = async () => {
    if (!draft.title || draft.ingredients.length === 0 || draft.steps.length === 0) {
      alert('Please add a title, at least one ingredient, and at least one step before publishing.')
      return
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
          <span className="text-xs sm:text-sm text-[#1A1A18]/60 flex items-center gap-1">
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
        <div className="space-y-6">
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
                    <FileText size={18} className="text-[#C0622F]" />
                    <h2 className="font-medium text-[#1A1A18]">Flagged fields</h2>
                  </div>
                  <div className="space-y-2">
                    {draft.import_flags.map((flag, index) => (
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

              {!!draft.raw_text && (
                <div className="rounded-lg border border-gray-200 bg-white p-4">
                  <h2 className="font-medium text-[#1A1A18] mb-2">Raw OCR text</h2>
                  <p className="text-xs text-[#1A1A18]/60 mb-3">
                    Confidence: {Math.round((draft.import_confidence || 0) * 100)}%
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
            <label className="block text-sm font-medium text-[#1A1A18] mb-2">Title *</label>
            <input
              type="text"
              value={draft.title}
              onChange={(e) => updateField('title', e.target.value)}
              className={getFieldClassName('title')}
              placeholder="Enter recipe title"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-[#1A1A18] mb-2">Description</label>
            <textarea
              value={draft.description || ''}
              onChange={(e) => updateField('description', e.target.value)}
              rows={3}
              className={getFieldClassName('description')}
              placeholder="Describe your recipe"
            />
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#1A1A18] mb-2">Image URL</label>
              <input
                type="url"
                value={draft.image_url || ''}
                onChange={(e) => updateField('image_url', e.target.value)}
                className={getFieldClassName('image')}
                placeholder="https://…"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-[#1A1A18] mb-2">Source URL</label>
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
            <label className="block text-sm font-medium text-[#1A1A18] mb-2">Tags (comma-separated)</label>
            <input
              type="text"
              value={draft.tags.join(', ')}
              onChange={(e) => updateField('tags', e.target.value.split(',').map(t => t.trim()).filter(Boolean))}
              className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C0622F] focus:border-transparent"
              placeholder="dinner, Italian, vegetarian"
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-[#1A1A18]">Ingredients *</label>
              <button onClick={addIngredient} className="text-[#C0622F] text-sm hover:underline">
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
              <label className="block text-sm font-medium text-[#1A1A18]">Steps *</label>
              <button onClick={addStep} className="text-[#C0622F] text-sm hover:underline">
                + Add step
              </button>
            </div>
            <div className="space-y-2">
              {draft.steps.sort((a, b) => a.order - b.order).map((step, idx) => (
                <div key={idx} className="flex gap-2">
                  <span className="w-8 h-10 flex items-center justify-center bg-[#C0622F]/10 text-[#C0622F] rounded font-medium">
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
          <button onClick={handlePublish} className="flex-1 bg-[#C0622F] text-white py-3 rounded-lg font-medium hover:bg-[#A0522D] flex items-center justify-center gap-2">
            <Eye size={20} />
            Publish
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
              className="w-full bg-[#C0622F] text-white py-2 rounded-lg hover:bg-[#A0522D]"
            >
              Copy Link
            </button>
          </div>
        </div>
      )}
    </Layout>
  )
}
