import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import type { Recipe } from '../lib/types/recipe'
import { IngredientList } from '../components/IngredientList'
import { StepList } from '../components/StepList'
import { Layout } from '../components/Layout'
import { Copy } from 'lucide-react'

export function ShareView() {
  const { token } = useParams<{ token: string }>()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [recipe, setRecipe] = useState<Recipe | null>(null)
  const [loading, setLoading] = useState(true)
  const [notFound, setNotFound] = useState(false)

  useEffect(() => {
    loadSharedRecipe()
  }, [token])

  async function loadSharedRecipe() {
    try {
      const { data, error } = await supabase
        .from('recipes')
        .select('*')
        .eq('share_token', token)
        .eq('share_enabled', true)
        .single()

      if (error || !data) {
        setNotFound(true)
      } else {
        setRecipe(data)
      }
    } catch {
      setNotFound(true)
    } finally {
      setLoading(false)
    }
  }

  async function handleFork() {
    if (!recipe) return

    if (!user) {
      navigate(`/login?next=/share/${token}`)
      return
    }

    try {
      const { data: forked, error } = await supabase
        .from('recipes')
        .insert({
          title: recipe.title,
          description: recipe.description,
          image_url: recipe.image_url,
          source_url: recipe.source_url,
          ingredients: recipe.ingredients,
          steps: recipe.steps,
          tags: recipe.tags,
          owner_id: user.id,
          status: 'draft',
          import_method: 'fork',
          import_source: recipe.id,
          slug: ''
        })
        .select()
        .single()

      if (error) throw error
      navigate(`/drafts/${forked.id}`)
    } catch (err) {
      console.error('Failed to fork recipe:', err)
    }
  }

  if (loading) {
    return (
      <Layout title="Shared recipe" contained={false}>
        <div className="flex items-center justify-center py-24">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-tertiary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-primary/60">Loading recipe…</p>
          </div>
        </div>
      </Layout>
    )
  }

  if (notFound || !recipe) {
    return (
      <Layout title="Shared recipe" contained={false}>
        <div className="text-center py-24">
          <p className="text-xl text-primary/60 mb-4">This link is no longer active.</p>
          <button onClick={() => navigate('/')} className="text-tertiary hover:underline">
            Go to home
          </button>
        </div>
      </Layout>
    )
  }

  return (
    <Layout
      title={recipe.title}
      contained={false}
      banner={
        <div className="bg-amber-50 border-b border-amber-200 px-4 py-3 text-center">
          <p className="text-sm text-amber-800">
            You're viewing a shared draft. Fork it to save your own copy.
          </p>
        </div>
      }
    >
      <article className="bg-white">
        {recipe.image_url && (
          <img
            src={recipe.image_url}
            alt={recipe.title}
            className="w-full aspect-video object-cover"
          />
        )}

        <div className="max-w-3xl mx-auto px-4 py-8">
          <h1 className="font-serif text-3xl md:text-4xl text-primary mb-4">{recipe.title}</h1>
          {recipe.description && (
            <p className="text-lg text-primary/80 mb-6">{recipe.description}</p>
          )}

          {recipe.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-6">
              {recipe.tags.map(tag => (
                <span key={tag} className="text-sm px-3 py-1 bg-tertiary/10 text-tertiary rounded-full">
                  {tag}
                </span>
              ))}
            </div>
          )}

          <button
            onClick={handleFork}
            className="w-full sm:w-auto mb-8 px-6 py-3 bg-tertiary text-white rounded-lg hover:bg-tertiary flex items-center justify-center gap-2"
          >
            <Copy size={20} />
            Fork this recipe
          </button>

          <div className="grid md:grid-cols-2 gap-8 pt-4 border-t border-gray-100">
            <div>
              <h2 className="font-serif text-2xl text-primary mb-4">Ingredients</h2>
              <IngredientList ingredients={recipe.ingredients} />
            </div>

            <div>
              <h2 className="font-serif text-2xl text-primary mb-4">Steps</h2>
              <StepList steps={recipe.steps} />
            </div>
          </div>
        </div>
      </article>
    </Layout>
  )
}
