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
    
    // Cleanup timer on unmount
    return () => {
      if (timer.current) {
        clearTimeout(timer.current)
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      const { error } = await supabase
        .from('recipes')
        .update(draft)
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
