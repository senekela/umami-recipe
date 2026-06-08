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
            className="flex items-center gap-2 px-3 py-2 rounded-full text-sm text-[#A9B8B5] hover:text-[#1C322D] hover:bg-[#1C322D]/5"
            aria-label="Edit profile"
          >
            <Settings size={18} />
            <span className="hidden sm:inline">Profile</span>
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-3 py-2 rounded-full text-sm text-[#A9B8B5] hover:text-[#1C322D] hover:bg-[#1C322D]/5"
          >
            <LogOut size={18} />
            <span className="hidden sm:inline">Sign out</span>
          </button>
        </div>
      }
      belowHeader={
        <div className="flex gap-6 border-b border-[#485E59]/20 -mb-px">
          <button
            onClick={() => setTab('published')}
            className={`pb-3 px-1 font-semibold text-[11px] uppercase tracking-[1.65px] transition-colors ${
              tab === 'published'
                ? 'text-[#1C322D] border-b-2 border-[#1C322D]'
                : 'text-[#A9B8B5] hover:text-[#1C322D]'
            }`}
          >
            Published
          </button>
          <button
            onClick={() => setTab('drafts')}
            className={`pb-3 px-1 font-semibold text-[11px] uppercase tracking-[1.65px] transition-colors ${
              tab === 'drafts'
                ? 'text-[#1C322D] border-b-2 border-[#1C322D]'
                : 'text-[#A9B8B5] hover:text-[#1C322D]'
            }`}
          >
            Drafts
          </button>
        </div>
      }
    >
      {/* User Profile Header */}
      <div className="bg-[#F8F3EE] rounded-none shadow-[rgba(28,50,45,0.15)_0px_40px_80px_-20px] p-10 mb-8">
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 rounded-full overflow-hidden bg-[#A9B8B5]/10 flex items-center justify-center flex-shrink-0">
            {profile?.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={profile.nickname || 'Profile'}
                className="w-full h-full object-cover"
              />
            ) : (
              <UserIcon className="w-10 h-10 text-[#A9B8B5]" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-display text-3xl text-[#1C322D] truncate font-normal">
              {profile?.nickname || user?.email?.split('@')[0] || 'User'}
            </h2>
            <p className="text-sm text-[#A9B8B5] truncate font-light">{user?.email}</p>
          </div>
          <button
            onClick={() => navigate('/profile')}
            className="px-4 py-3 text-[11px] font-semibold uppercase tracking-[1.65px] text-[#1C322D] hover:bg-[#1C322D]/5 rounded-full transition-colors border border-[#485E59]/30"
          >
            Edit Profile
          </button>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2].map(i => (
            <div key={i} className="bg-[#F8F3EE] rounded-none overflow-hidden animate-pulse">
              <div className="aspect-video bg-[#A9B8B5]/20"></div>
              <div className="p-10">
                <div className="h-6 bg-[#A9B8B5]/20 rounded mb-2"></div>
                <div className="h-4 bg-[#A9B8B5]/20 rounded w-2/3"></div>
              </div>
            </div>
          ))}
        </div>
      ) : recipes.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-[#A9B8B5] mb-4 text-base">
            {tab === 'published' ? 'No published recipes yet.' : 'No drafts yet.'}
          </p>
          <button
            onClick={() => navigate('/import')}
            className="text-[#EBB552] hover:underline font-medium"
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
