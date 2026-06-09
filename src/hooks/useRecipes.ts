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
      
      // Query recipes with owner profile join using the correct foreign key syntax
      let query = supabase
        .from('recipes')
        .select(`
          *,
          profiles(nickname)
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

      if (error) {
        console.error('Recipe query error:', error)
        console.error('Error details:', JSON.stringify(error, null, 2))
        throw error
      }
      
      console.log('Raw query result:', data)
      
      // Map the profiles data to publisher format
      const recipesWithPublisher = data?.map(recipe => ({
        ...recipe,
        publisher: recipe.profiles ? { nickname: recipe.profiles.nickname } : null
      })) || []
      
      console.log('Loaded recipes:', recipesWithPublisher.length, 'recipes')
      console.log('First recipe:', recipesWithPublisher[0])
      setRecipes(recipesWithPublisher)
      setError(null)
    } catch (err) {
      console.error('Failed to load recipes:', err)
      setError(err instanceof Error ? err.message : 'Failed to load recipes')
    } finally {
      setLoading(false)
    }
  }

  return { recipes, loading, error, reload: loadRecipes }
}
