import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import type { Recipe } from '../lib/types/recipe'
import { IngredientList } from '../components/IngredientList'
import { StepList } from '../components/StepList'
import { Layout } from '../components/Layout'
import { RecipeScaling } from '../components/RecipeScaling'
import { Card, CardContent } from '../app/components/ui/card'
import { Edit, Globe, EyeOff, Users, Clock, Star, Bookmark, Share2 } from 'lucide-react'
import { scaleIngredients, type ScalingState } from '../lib/recipeScaling'

export function RecipeDetail() {
  const { slug } = useParams<{ slug: string }>()
  const { user, profile } = useAuth()
  const navigate = useNavigate()
  const [recipe, setRecipe] = useState<Recipe | null>(null)
  const [loading, setLoading] = useState(true)
  const [scalingState, setScalingState] = useState<ScalingState | null>(null)
  const [isSaved, setIsSaved] = useState(false)

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

  // Calculate scaled ingredients
  const scaledIngredients = scalingState
    ? scaleIngredients(
        recipe.ingredients,
        scalingState.scalingFactor,
        scalingState.anchorIngredientIndex
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
                <p className="text-lg text-stone-600 leading-relaxed mb-4">{recipe.description}</p>
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
              <div className="flex items-center gap-2 rounded-full border border-black/10 bg-white/70 px-4 py-2 text-sm">
                <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                <span className="font-medium text-stone-950">4.8</span>
              </div>
              <button
                onClick={() => setIsSaved(!isSaved)}
                className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition-colors ${
                  isSaved 
                    ? 'border-stone-950 bg-stone-950 text-white' 
                    : 'border-black/10 bg-white/70 text-stone-700 hover:bg-white'
                }`}
              >
                <Bookmark className={`h-4 w-4 ${isSaved ? 'fill-white' : ''}`} />
                {isSaved ? 'Saved' : 'Save'}
              </button>
              <button className="flex items-center gap-2 rounded-full border border-black/10 bg-white/70 px-4 py-2 text-sm text-stone-700 hover:bg-white transition-colors">
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
              <div className="flex flex-wrap gap-3 mb-6 pt-6 border-t border-black/10">
                <button
                  onClick={() => navigate(`/drafts/${recipe.id}`)}
                  className="flex items-center gap-2 px-5 py-2.5 bg-stone-950 text-white rounded-full hover:bg-stone-800 text-sm font-medium transition-colors"
                >
                  <Edit size={16} />
                  Edit Recipe
                </button>
                <button
                  onClick={unpublish}
                  className="flex items-center gap-2 px-5 py-2.5 border border-black/10 rounded-full hover:bg-white text-stone-700 text-sm font-medium transition-colors"
                >
                  <EyeOff size={16} />
                  Unpublish
                </button>
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

// Made with Bob
