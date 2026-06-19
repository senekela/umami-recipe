import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import type { Recipe } from '../lib/types/recipe'
import { IngredientList } from '../components/IngredientList'
import { StepList } from '../components/StepList'
import { Layout } from '../components/Layout'
import { RecipeScaling } from '../components/RecipeScaling'
import { Card, CardContent } from '../app/components/ui/card'
import { Edit, Globe, EyeOff, Users, Bookmark, Share2, ChevronDown, Trash2 } from 'lucide-react'
import { scaleIngredients, type ScalingState } from '../lib/recipeScaling'

export function RecipeDetail() {
  const { slug } = useParams<{ slug: string }>()
  const { user, profile } = useAuth()
  const navigate = useNavigate()
  const [recipe, setRecipe] = useState<Recipe | null>(null)
  const [loading, setLoading] = useState(true)
  const [scalingState, setScalingState] = useState<ScalingState | null>(null)
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [confirmUnpublish, setConfirmUnpublish] = useState(false)
  const [actionLoading, setActionLoading] = useState(false)

  useEffect(() => {
    loadRecipe()
  }, [slug])

  async function loadRecipe() {
    try {
      const { data, error } = await supabase
        .from('recipes')
        .select(`
          *,
          publisher:profiles!owner_id(nickname)
        `)
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
    if (!recipe) return
    setActionLoading(true)
    try {
      const { error } = await supabase
        .from('recipes')
        .update({ status: 'draft', published_at: null })
        .eq('id', recipe.id)
      if (error) throw error
      toast.success('Recipe moved back to drafts')
      navigate('/me')
    } catch (err) {
      console.error('Failed to unpublish recipe:', err)
      toast.error('Failed to unpublish. Please try again.')
    } finally {
      setActionLoading(false)
      setConfirmUnpublish(false)
    }
  }

  async function deleteRecipe() {
    if (!recipe) return
    setActionLoading(true)
    try {
      if (recipe.image_url) {
        const imagePath = recipe.image_url.split('/').slice(-2).join('/')
        await supabase.storage.from('recipe-images').remove([imagePath])
      }
      const { error } = await supabase.from('recipes').delete().eq('id', recipe.id)
      if (error) throw error
      toast.success('Recipe deleted')
      navigate('/me')
    } catch (err) {
      console.error('Failed to delete recipe:', err)
      toast.error('Failed to delete recipe. Please try again.')
    } finally {
      setActionLoading(false)
      setConfirmDelete(false)
    }
  }

  if (loading) {
    return (
      <Layout showBack avatarUrl={profile?.avatar_url}>
        <div className="flex items-center justify-center py-24">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-stone-950 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-stone-600">Loading recipe…</p>
          </div>
        </div>
      </Layout>
    )
  }

  if (!recipe) {
    return (
      <Layout showBack avatarUrl={profile?.avatar_url}>
        <div className="text-center py-24">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-stone-950 text-white mb-4">
            <EyeOff className="h-7 w-7" />
          </div>
          <h2 className="text-2xl font-semibold text-stone-950 mb-2">Recipe not found</h2>
          <p className="text-stone-600 mb-6">This recipe may have been removed or doesn't exist.</p>
          <button 
            onClick={() => navigate('/')} 
            className="rounded-full bg-stone-950 px-6 py-3 text-sm font-medium text-white hover:bg-stone-800 transition-colors"
          >
            Go to home
          </button>
        </div>
      </Layout>
    )
  }

  const isOwner = user?.id === recipe.owner_id

  const scaledIngredients = scalingState
    ? scaleIngredients(
        recipe.ingredients,
        scalingState.scalingFactor,
        scalingState.anchorIngredientIndex,
        scalingState.targetServings
      )
    : recipe.ingredients

  const isScaled = scalingState ? scalingState.scalingFactor !== 1 : false

  return (
    <Layout showBack avatarUrl={profile?.avatar_url}>
      <motion.article 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="max-w-5xl mx-auto"
      >
        {/* Hero Image Card */}
        {recipe.image_url && (
          <Card className="rounded-[2rem] border-black/10 bg-[#fbf7ef]/80 shadow-sm backdrop-blur-xl overflow-hidden mb-6">
            <img
              src={recipe.image_url}
              alt={recipe.title}
              className="w-full aspect-video object-cover"
            />
          </Card>
        )}

        {/* Main Content Card */}
        <Card className="rounded-[2rem] border-black/10 bg-[#fbf7ef]/80 shadow-sm backdrop-blur-xl mb-8">
          <CardContent className="p-6 md:p-8">
            {/* Title and Description */}
            <div className="mb-6">
              <h1 className="font-display text-4xl md:text-5xl text-stone-950 mb-4 font-semibold tracking-tight">
                {recipe.title}
              </h1>
              {recipe.description && (
                <div className="mb-4">
                  <p className={`text-lg text-stone-600 leading-relaxed ${isDescriptionExpanded ? '' : 'line-clamp-5'}`}>
                    {recipe.description}
                  </p>
                  {recipe.description.length > 200 && (
                    <button
                      onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                      className="mt-2 flex items-center gap-1 text-sm font-medium text-stone-600 hover:text-stone-950 transition-colors"
                    >
                      {isDescriptionExpanded ? 'Show less' : 'Read more'}
                      <ChevronDown className={`h-4 w-4 transition-transform ${isDescriptionExpanded ? 'rotate-180' : ''}`} />
                    </button>
                  )}
                </div>
              )}
              {/* Publisher Info */}
              {recipe.publisher && (
                <div className="flex items-center gap-3 pt-4 border-t border-black/5">
                  <div className="h-10 w-10 rounded-full bg-stone-950 flex items-center justify-center">
                    <span className="text-sm font-bold text-white">
                      {recipe.publisher.nickname?.slice(0, 1).toUpperCase() || 'U'}
                    </span>
                  </div>
                  <div>
                    <p className="text-xs text-stone-500 uppercase tracking-wider font-semibold">Recipe by</p>
                    <p className="text-sm font-medium text-stone-950">{recipe.publisher.nickname || 'Umami cook'}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Meta Stats */}
            <div className="flex flex-wrap gap-3 mb-6">
              {recipe.servings && (
                <div className="flex items-center gap-2 rounded-full border border-black/10 bg-white/70 px-4 py-2 text-sm">
                  <Users className="h-4 w-4 text-stone-700" />
                  <span className="font-medium text-stone-950">{recipe.servings}</span>
                  <span className="text-stone-600">servings</span>
                </div>
              )}
              <button
                onClick={() => {
                  navigator.clipboard?.writeText(window.location.href)
                  toast.success('Link copied to clipboard')
                }}
                className="flex items-center gap-2 rounded-full border border-black/10 bg-white/70 px-4 py-2 text-sm text-stone-700 hover:bg-white transition-colors"
              >
                <Share2 className="h-4 w-4" />
                Share
              </button>
            </div>

            {/* Tags */}
            {recipe.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-6">
                {recipe.tags.map((tag) => (
                  <span 
                    key={tag} 
                    className="text-xs px-3 py-1.5 bg-stone-950 text-white rounded-full font-semibold uppercase tracking-wide"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}

            {/* Source Link */}
            {recipe.source_url && (
              <a
                href={recipe.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-stone-950 hover:underline mb-6 font-medium"
              >
                <Globe size={16} />
                View original source
              </a>
            )}

            {/* Owner Actions */}
            {isOwner && (
              <div className="mb-6 pt-6 border-t border-black/10 space-y-3">
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => navigate(`/drafts/${recipe.id}`)}
                    className="flex items-center gap-2 px-5 py-2.5 bg-stone-950 text-white rounded-full hover:bg-stone-800 text-sm font-medium transition-colors"
                  >
                    <Edit size={16} />
                    Edit recipe
                  </button>
                  {recipe.status === 'published' && !confirmUnpublish && (
                    <button
                      onClick={() => setConfirmUnpublish(true)}
                      className="flex items-center gap-2 px-5 py-2.5 border border-black/10 rounded-full hover:bg-white text-stone-700 text-sm font-medium transition-colors"
                    >
                      <EyeOff size={16} />
                      Unpublish
                    </button>
                  )}
                  {!confirmDelete && (
                    <button
                      onClick={() => setConfirmDelete(true)}
                      className="flex items-center gap-2 px-5 py-2.5 border border-red-200 bg-red-50 rounded-full hover:bg-red-100 text-red-700 text-sm font-medium transition-colors"
                    >
                      <Trash2 size={16} />
                      Delete recipe
                    </button>
                  )}
                </div>

                {/* Inline unpublish confirmation */}
                {confirmUnpublish && (
                  <div className="flex items-center gap-3 rounded-2xl border border-black/10 bg-white/60 px-4 py-3 text-sm">
                    <span className="text-stone-700 flex-1">Move this recipe back to drafts?</span>
                    <button
                      onClick={() => setConfirmUnpublish(false)}
                      className="rounded-full px-3 py-1.5 text-stone-500 hover:bg-black/5 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={unpublish}
                      disabled={actionLoading}
                      className="rounded-full bg-stone-950 px-3 py-1.5 text-white hover:bg-stone-800 disabled:opacity-50 transition-colors"
                    >
                      {actionLoading ? 'Moving…' : 'Yes, unpublish'}
                    </button>
                  </div>
                )}

                {/* Inline delete confirmation */}
                {confirmDelete && (
                  <div className="flex items-center gap-3 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm">
                    <span className="text-red-700 flex-1">This cannot be undone. Delete permanently?</span>
                    <button
                      onClick={() => setConfirmDelete(false)}
                      className="rounded-full px-3 py-1.5 text-stone-500 hover:bg-black/5 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={deleteRecipe}
                      disabled={actionLoading}
                      className="rounded-full bg-red-600 px-3 py-1.5 text-white hover:bg-red-700 disabled:opacity-50 transition-colors"
                    >
                      {actionLoading ? 'Deleting…' : 'Yes, delete'}
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Recipe Scaling */}
            <div className="pt-6 border-t border-black/10">
              <RecipeScaling
                originalServings={recipe.servings}
                ingredients={recipe.ingredients}
                onScalingChange={setScalingState}
              />
            </div>
          </CardContent>
        </Card>

        {/* Ingredients and Steps Grid */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          {/* Ingredients Card */}
          <Card className="rounded-[2rem] border-black/10 bg-[#fbf7ef]/80 shadow-sm backdrop-blur-xl">
            <CardContent className="p-6 md:p-8">
              <h2 className="font-display text-2xl text-stone-950 mb-6 font-semibold tracking-tight">
                Ingredients
              </h2>
              <IngredientList ingredients={scaledIngredients} isScaled={isScaled} />
            </CardContent>
          </Card>

          {/* Steps Card */}
          <Card className="rounded-[2rem] border-black/10 bg-[#fbf7ef]/80 shadow-sm backdrop-blur-xl">
            <CardContent className="p-6 md:p-8">
              <h2 className="font-display text-2xl text-stone-950 mb-6 font-semibold tracking-tight">
                Instructions
              </h2>
              <StepList steps={recipe.steps} />
            </CardContent>
          </Card>
        </div>
      </motion.article>
    </Layout>
  )
}
