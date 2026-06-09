import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import type { Recipe } from '../lib/types/recipe'
import { RecipeCard } from '../components/RecipeCard'
import { Layout } from '../components/Layout'
import { LogOut, Settings, User as UserIcon } from 'lucide-react'

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

  return (
    <Layout
      title="My Recipes"
      rightSlot={
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigate('/profile')}
            className="flex items-center gap-2 px-3 py-2 rounded-full text-sm text-muted-foreground hover:text-primary hover:bg-primary/5"
            aria-label="Edit profile"
          >
            <Settings size={18} />
            <span className="hidden sm:inline">Profile</span>
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-3 py-2 rounded-full text-sm text-muted-foreground hover:text-primary hover:bg-primary/5"
          >
            <LogOut size={18} />
            <span className="hidden sm:inline">Sign out</span>
          </button>
        </div>
      }
      belowHeader={
        <div className="flex gap-6 border-b border-border/20 -mb-px">
          <button
            onClick={() => setTab('published')}
            className={`pb-3 px-1 font-semibold text-[11px] uppercase tracking-[1.65px] transition-colors ${
              tab === 'published'
                ? 'text-primary border-b-2 border-primary'
                : 'text-muted-foreground hover:text-primary'
            }`}
          >
            Published
          </button>
          <button
            onClick={() => setTab('drafts')}
            className={`pb-3 px-1 font-semibold text-[11px] uppercase tracking-[1.65px] transition-colors ${
              tab === 'drafts'
                ? 'text-primary border-b-2 border-primary'
                : 'text-muted-foreground hover:text-primary'
            }`}
          >
            Drafts
          </button>
        </div>
      }
    >
      {/* User Profile Header */}
      <div className="bg-background rounded-none shadow-elevated p-10 mb-8">
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 rounded-full overflow-hidden bg-muted/10 flex items-center justify-center flex-shrink-0">
            {profile?.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={profile.nickname || 'Profile'}
                className="w-full h-full object-cover"
              />
            ) : (
              <UserIcon className="w-10 h-10 text-muted-foreground" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-display text-3xl text-primary truncate font-normal">
              {profile?.nickname || user?.email?.split('@')[0] || 'User'}
            </h2>
            <p className="text-sm text-muted-foreground truncate font-light">{user?.email}</p>
          </div>
          <button
            onClick={() => navigate('/profile')}
            className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[1.65px] text-primary hover:bg-primary/5 rounded-full transition-colors border border-border/30"
          >
            Edit Profile
          </button>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2].map(i => (
            <div key={i} className="bg-background rounded-none overflow-hidden animate-pulse">
              <div className="aspect-video bg-muted/20"></div>
              <div className="p-10">
                <div className="h-6 bg-muted/20 rounded mb-2"></div>
                <div className="h-4 bg-muted/20 rounded w-2/3"></div>
              </div>
            </div>
          ))}
        </div>
      ) : recipes.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-muted-foreground mb-4 text-base">
            {tab === 'published' ? 'No published recipes yet.' : 'No drafts yet.'}
          </p>
          <button
            onClick={() => navigate('/import')}
            className="text-tertiary hover:underline font-medium"
          >
            Import your first recipe →
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {recipes.map(recipe => (
            <button
              key={recipe.id}
              onClick={() => navigate(tab === 'published' ? `/recipes/${recipe.slug}` : `/drafts/${recipe.id}`)}
              className="text-left"
            >
              <RecipeCard recipe={recipe} />
            </button>
          ))}
        </div>
      )}
    </Layout>
  )
}
