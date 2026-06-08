import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import type { Recipe } from '../lib/types/recipe'

export function useRecipes(filters?: { search?: string; tags?: string[] }) {
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadRecipes()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters?.search, filters?.tags?.join(',')])

  async function loadRecipes() {
    try {
      setLoading(true)
      let query = supabase
        .from('recipes')
        .select(`
          *,
          publisher:profiles!recipes_owner_id_fkey(nickname)
        `)
        .eq('status', 'published')
        .order('published_at', { ascending: false })

      if (filters?.search) {
        query = query.textSearch('title', filters.search)
      }

      if (filters?.tags && filters.tags.length > 0) {
        query = query.contains('tags', filters.tags)
      }

      const { data, error } = await query

      if (error) throw error
      setRecipes(data || [])
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load recipes')
    } finally {
      setLoading(false)
    }
  }

  return { recipes, loading, error, reload: loadRecipes }
}
