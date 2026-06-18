import { useState, useEffect, useRef } from 'react'
import { supabase } from '../lib/supabase'
import type { Recipe } from '../lib/types/recipe'

export function useDraft(id: string) {
  const [draft, setDraft] = useState<Recipe | null>(null)
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'unsaved'>('saved')
  const [loading, setLoading] = useState(true)
  const timer = useRef<ReturnType<typeof setTimeout>>()

  useEffect(() => {
    loadDraft()
    
    return () => {
      if (timer.current) {
        clearTimeout(timer.current)
      }
    }
  }, [id])

  async function loadDraft() {
    try {
      const { data, error } = await supabase
        .from('recipes')
        .select('*')
        .eq('id', id)
        .single()

      if (error) throw error
      setDraft(data)
    } catch (err) {
      console.error('Failed to load draft:', err)
    } finally {
      setLoading(false)
    }
  }

  const updateField = (field: keyof Recipe, value: unknown) => {
    setDraft((prev: Recipe | null) => prev ? { ...prev, [field]: value } : prev)
    setSaveStatus('unsaved')
    clearTimeout(timer.current)
    timer.current = setTimeout(save, 20_000)
  }

  const save = async () => {
    if (!draft) return
    setSaveStatus('saving')
    try {
      const payload = {
        slug: draft.slug,
        title: draft.title,
        description: draft.description,
        image_url: draft.image_url,
        source_url: draft.source_url,
        ingredients: draft.ingredients,
        steps: draft.steps,
        tags: draft.tags,
        servings: draft.servings,
        status: draft.status,
        share_token: draft.share_token,
        share_enabled: draft.share_enabled,
        import_method: draft.import_method,
        import_source: draft.import_source,
        raw_text: draft.raw_text ?? null,
        import_confidence: draft.import_confidence ?? null,
        import_errors: draft.import_errors ?? [],
        import_warnings: draft.import_warnings ?? [],
        import_flags: draft.import_flags ?? [],
        import_reviewed_at: draft.import_reviewed_at ?? null,
        published_at: draft.published_at,
      }

      const { error } = await supabase
        .from('recipes')
        .update(payload)
        .eq('id', id)

      if (error) throw error
      setSaveStatus('saved')
    } catch (err) {
      console.error('Failed to save draft:', err)
      setSaveStatus('unsaved')
    }
  }

  return { draft, updateField, save, saveStatus, loading }
}
