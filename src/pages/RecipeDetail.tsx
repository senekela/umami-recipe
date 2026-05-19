import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import type { Recipe } from '../lib/types/recipe'
import { IngredientList } from '../components/IngredientList'
import { StepList } from '../components/StepList'
import { Layout } from '../components/Layout'
import { Edit, Globe, EyeOff } from 'lucide-react'

export function RecipeDetail() {
  const { slug } = useParams<{ slug: string }>()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [recipe, setRecipe] = useState<Recipe | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadRecipe()
  }, [slug])

  async function loadRecipe() {
    try {
      const { data, error } = await supabase
        .from('recipes')
        .select('*')
        .eq('slug', slug)
        .single()

      if (error) throw error
      setRecipe(data)
    } catch (err) {
      console.error('Failed to load recipe:', err)
    } finally {
      setLoading(false)
    }
  }

  async function unpublish() {
    if (!recipe || !confirm('Unpublish this recipe?')) return

    const { error } = await supabase
      .from('recipes')
      .update({ status: 'draft', published_at: null })
      .eq('id', recipe.id)

    if (!error) {
      navigate('/me')
    }
  }

  if (loading) {
    return (
      <Layout showBack title="Loading…" contained={false}>
        <div className="flex items-center justify-center py-24">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-[#C0622F] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-[#1A1A18]/60">Loading recipe…</p>
          </div>
        </div>
      </Layout>
    )
  }

  if (!recipe) {
    return (
      <Layout showBack title="Not found" contained={false}>
        <div className="text-center py-24">
          <p className="text-[#1A1A18]/60 mb-4">Recipe not found.</p>
          <button onClick={() => navigate('/')} className="text-[#C0622F] hover:underline">
            Go to home
          </button>
        </div>
      </Layout>
    )
  }

  const isOwner = user?.id === recipe.owner_id

  return (
    <Layout showBack title={recipe.title} contained={false}>
      <article className="bg-white">
        {recipe.image_url && (
          <img
            src={recipe.image_url}
            alt={recipe.title}
            className="w-full aspect-video object-cover"
          />
        )}

        <div className="max-w-3xl mx-auto px-4 py-8">
          <h1 className="font-serif text-3xl md:text-4xl text-[#1A1A18] mb-4">{recipe.title}</h1>
          {recipe.description && (
            <p className="text-lg text-[#1A1A18]/80 mb-6">{recipe.description}</p>
          )}

          {recipe.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-6">
              {recipe.tags.map(tag => (
                <span key={tag} className="text-sm px-3 py-1 bg-[#C0622F]/10 text-[#C0622F] rounded-full">
                  {tag}
                </span>
              ))}
            </div>
          )}

          {recipe.source_url && (
            <a
              href={recipe.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-[#C0622F] hover:underline mb-8"
            >
              <Globe size={16} />
              View original source
            </a>
          )}

          {isOwner && (
            <div className="flex flex-wrap gap-3 mb-8">
              <button
                onClick={() => navigate(`/drafts/${recipe.id}`)}
                className="flex items-center gap-2 px-4 py-2 bg-[#C0622F] text-white rounded-lg hover:bg-[#A0522D]"
              >
                <Edit size={16} />
                Edit
              </button>
              <button
                onClick={unpublish}
                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                <EyeOff size={16} />
                Unpublish
              </button>
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-8 pt-4 border-t border-gray-100">
            <div>
              <h2 className="font-serif text-2xl text-[#1A1A18] mb-4">Ingredients</h2>
              <IngredientList ingredients={recipe.ingredients} />
            </div>

            <div>
              <h2 className="font-serif text-2xl text-[#1A1A18] mb-4">Steps</h2>
              <StepList steps={recipe.steps} />
            </div>
          </div>
        </div>
      </article>
    </Layout>
  )
}
