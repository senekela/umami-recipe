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
            <div className="w-8 h-8 border-4 border-tertiary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading recipe…</p>
          </div>
        </div>
      </Layout>
    )
  }

  if (!recipe) {
    return (
      <Layout showBack title="Not found" contained={false}>
        <div className="text-center py-24">
          <p className="text-muted-foreground mb-4">Recipe not found.</p>
          <button onClick={() => navigate('/')} className="text-tertiary hover:underline font-medium">
            Go to home
          </button>
        </div>
      </Layout>
    )
  }

  const isOwner = user?.id === recipe.owner_id

  return (
    <Layout showBack title={recipe.title} contained={false}>
      <article className="bg-background">
        {recipe.image_url && (
          <img
            src={recipe.image_url}
            alt={recipe.title}
            className="w-full aspect-video object-cover"
          />
        )}

        <div className="max-w-3xl mx-auto px-4 py-12">
          <h1 className="font-display text-4xl md:text-5xl text-primary mb-4 font-normal">{recipe.title}</h1>
          {recipe.description && (
            <p className="text-base text-primary/80 mb-8 font-light leading-relaxed">{recipe.description}</p>
          )}

          {recipe.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-8">
              {recipe.tags.map(tag => (
                <span key={tag} className="text-[11px] px-3 py-1.5 bg-secondary/20 text-primary rounded-full font-semibold uppercase tracking-wide">
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
              className="inline-flex items-center gap-2 text-tertiary hover:underline mb-8 font-medium"
            >
              <Globe size={16} />
              View original source
            </a>
          )}

          {isOwner && (
            <div className="flex flex-wrap gap-3 mb-8">
              <button
                onClick={() => navigate(`/drafts/${recipe.id}`)}
                className="flex items-center gap-2 px-4 py-3 bg-primary text-primary-foreground rounded-full hover:bg-primary/90 text-[11px] font-semibold uppercase tracking-[1.65px]"
              >
                <Edit size={16} />
                Edit
              </button>
              <button
                onClick={unpublish}
                className="flex items-center gap-2 px-4 py-3 border border-border/30 rounded-full hover:bg-primary/5 text-primary text-[11px] font-semibold uppercase tracking-[1.65px]"
              >
                <EyeOff size={16} />
                Unpublish
              </button>
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-12 pt-8 border-t border-border/20">
            <div>
              <h2 className="font-display text-3xl text-primary mb-6 font-normal">Ingredients</h2>
              <IngredientList ingredients={recipe.ingredients} />
            </div>

            <div>
              <h2 className="font-display text-3xl text-primary mb-6 font-normal">Steps</h2>
              <StepList steps={recipe.steps} />
            </div>
          </div>
        </div>
      </article>
    </Layout>
  )
}
