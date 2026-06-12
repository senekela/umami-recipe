import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import type { Recipe } from '../lib/types/recipe'
import { RecipeCard } from '../components/RecipeCard'
import { Layout } from '../components/Layout'
import { LogOut, Settings, User as UserIcon, Plus, BookOpen, FileEdit } from 'lucide-react'
import { Card, CardContent } from '../app/components/ui/card'
import { Button } from '../app/components/ui/button'

export function MyRecipes() {
  const { user, profile, logout } = useAuth()
  const navigate = useNavigate()
  const [tab, setTab] = useState<'published' | 'drafts'>('published')
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadRecipes()
  }, [tab, user])

  async function loadRecipes() {
    if (!user) return

    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('recipes')
        .select('*')
        .eq('owner_id', user.id)
        .eq('status', tab === 'published' ? 'published' : 'draft')
        .order('updated_at', { ascending: false })

      if (error) throw error
      setRecipes(data || [])
    } catch (err) {
      console.error('Failed to load recipes:', err)
    } finally {
      setLoading(false)
    }
  }

  async function handleLogout() {
    await logout()
    navigate('/login')
  }

  const stats = {
    published: recipes.filter(r => r.status === 'published').length,
    drafts: recipes.filter(r => r.status === 'draft').length,
    total: recipes.length,
  }

  return (
    <Layout
      hideNav={false}
      avatarUrl={profile?.avatar_url}
      onAvatarClick={() => navigate('/profile')}
    >
      {/* Profile Header Card */}
      <Card className="rounded-[2rem] border-black/10 bg-[#fbf7ef]/80 shadow-sm backdrop-blur-xl mb-6">
        <CardContent className="p-6 md:p-8">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            <div className="relative">
              <div className="w-20 h-20 rounded-full overflow-hidden bg-stone-950 flex items-center justify-center flex-shrink-0 ring-4 ring-white/50">
                {profile?.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt={profile.nickname || 'Profile'}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <UserIcon className="w-10 h-10 text-white" />
                )}
              </div>
              <div className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-lime-400 border-2 border-white" />
            </div>
            
            <div className="flex-1 min-w-0">
              <h1 className="font-display text-3xl md:text-4xl text-stone-950 truncate font-semibold tracking-tight">
                {profile?.nickname || user?.email?.split('@')[0] || 'User'}
              </h1>
              <p className="text-sm text-stone-500 truncate mt-1">{user?.email}</p>
              
              {/* Stats */}
              <div className="flex flex-wrap gap-4 mt-4">
                <div className="flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-stone-400" />
                  <span className="text-sm">
                    <span className="font-semibold text-stone-950">{recipes.length}</span>
                    <span className="text-stone-500"> recipes</span>
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <FileEdit className="h-4 w-4 text-stone-400" />
                  <span className="text-sm">
                    <span className="font-semibold text-stone-950">{recipes.filter(r => r.status === 'draft').length}</span>
                    <span className="text-stone-500"> drafts</span>
                  </span>
                </div>
              </div>
            </div>

            <div className="flex gap-2 w-full sm:w-auto">
              <Button
                onClick={() => navigate('/profile')}
                variant="outline"
                className="flex-1 sm:flex-none rounded-full border-black/10 bg-white/55 hover:bg-white"
              >
                <Settings className="h-4 w-4 mr-2" />
                Edit Profile
              </Button>
              <Button
                onClick={() => navigate('/import')}
                className="flex-1 sm:flex-none rounded-full bg-stone-950 text-white hover:bg-stone-800"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Recipe
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button
          onClick={() => setTab('published')}
          className={`flex-1 sm:flex-none rounded-full px-6 py-3 text-sm font-medium transition-all ${
            tab === 'published'
              ? 'bg-stone-950 text-white shadow-lg'
              : 'bg-white/70 text-stone-600 hover:bg-white border border-black/10'
          }`}
        >
          Published
          {recipes.filter(r => r.status === 'published').length > 0 && (
            <span className={`ml-2 rounded-full px-2 py-0.5 text-xs ${
              tab === 'published' ? 'bg-white/20' : 'bg-stone-950/10'
            }`}>
              {recipes.filter(r => r.status === 'published').length}
            </span>
          )}
        </button>
        <button
          onClick={() => setTab('drafts')}
          className={`flex-1 sm:flex-none rounded-full px-6 py-3 text-sm font-medium transition-all ${
            tab === 'drafts'
              ? 'bg-stone-950 text-white shadow-lg'
              : 'bg-white/70 text-stone-600 hover:bg-white border border-black/10'
          }`}
        >
          Drafts
          {recipes.filter(r => r.status === 'draft').length > 0 && (
            <span className={`ml-2 rounded-full px-2 py-0.5 text-xs ${
              tab === 'drafts' ? 'bg-white/20' : 'bg-stone-950/10'
            }`}>
              {recipes.filter(r => r.status === 'draft').length}
            </span>
          )}
        </button>
      </div>

      {/* Recipe Grid */}
      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {[1, 2, 3].map(i => (
              <div key={i} className="overflow-hidden rounded-[2rem] border border-black/10 bg-[#fbf7ef]/75 p-3">
                <div className="aspect-video animate-pulse rounded-[1.35rem] bg-stone-200 mb-4" />
                <div className="space-y-3 p-3">
                  <div className="h-5 w-3/4 animate-pulse rounded bg-stone-200" />
                  <div className="h-4 w-full animate-pulse rounded bg-stone-200" />
                  <div className="h-4 w-2/3 animate-pulse rounded bg-stone-200" />
                </div>
              </div>
            ))}
          </motion.div>
        ) : recipes.length === 0 ? (
          <motion.div
            key="empty"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="text-center py-16"
          >
            <Card className="rounded-[2rem] border-black/10 bg-[#fbf7ef]/80 shadow-sm backdrop-blur-xl max-w-md mx-auto">
              <CardContent className="p-8">
                <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-stone-950 text-white mb-4">
                  {tab === 'published' ? <BookOpen className="h-7 w-7" /> : <FileEdit className="h-7 w-7" />}
                </div>
                <h3 className="text-xl font-semibold text-stone-950 mb-2">
                  {tab === 'published' ? 'No published recipes yet' : 'No drafts yet'}
                </h3>
                <p className="text-stone-600 mb-6">
                  {tab === 'published' 
                    ? 'Start building your recipe collection by importing or creating your first recipe.'
                    : 'Your draft recipes will appear here. Import a recipe to get started.'}
                </p>
                <Button
                  onClick={() => navigate('/import')}
                  className="rounded-full bg-stone-950 text-white hover:bg-stone-800"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Import your first recipe
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        ) : (
          <motion.div
            key="recipes"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {recipes.map((recipe, index) => (
              <motion.div
                key={recipe.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <button
                  onClick={() => navigate(tab === 'published' ? `/recipes/${recipe.slug}` : `/drafts/${recipe.id}`)}
                  className="text-left w-full"
                >
                  <RecipeCard recipe={recipe} />
                </button>
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </Layout>
  )
}

// Made with Bob
