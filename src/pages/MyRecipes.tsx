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
            className="flex items-center gap-2 px-3 py-2 rounded-md text-sm text-[#1A1A18]/60 hover:text-[#1A1A18] hover:bg-gray-100"
            aria-label="Edit profile"
          >
            <Settings size={18} />
            <span className="hidden sm:inline">Profile</span>
          </button>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 px-3 py-2 rounded-md text-sm text-[#1A1A18]/60 hover:text-[#1A1A18] hover:bg-gray-100"
          >
            <LogOut size={18} />
            <span className="hidden sm:inline">Sign out</span>
          </button>
        </div>
      }
      belowHeader={
        <div className="flex gap-6 border-b border-gray-200 -mb-px">
          <button
            onClick={() => setTab('published')}
            className={`pb-3 px-1 font-medium transition-colors ${
              tab === 'published'
                ? 'text-[#C0622F] border-b-2 border-[#C0622F]'
                : 'text-[#1A1A18]/60 hover:text-[#1A1A18]'
            }`}
          >
            Published
          </button>
          <button
            onClick={() => setTab('drafts')}
            className={`pb-3 px-1 font-medium transition-colors ${
              tab === 'drafts'
                ? 'text-[#C0622F] border-b-2 border-[#C0622F]'
                : 'text-[#1A1A18]/60 hover:text-[#1A1A18]'
            }`}
          >
            Drafts
          </button>
        </div>
      }
    >
      {/* User Profile Header */}
      <div className="bg-white rounded-2xl shadow-sm p-6 mb-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center flex-shrink-0">
            {profile?.avatar_url ? (
              <img
                src={profile.avatar_url}
                alt={profile.nickname || 'Profile'}
                className="w-full h-full object-cover"
              />
            ) : (
              <UserIcon className="w-8 h-8 text-gray-400" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="font-serif text-2xl text-[#1A1A18] truncate">
              {profile?.nickname || user?.email?.split('@')[0] || 'User'}
            </h2>
            <p className="text-sm text-[#1A1A18]/60 truncate">{user?.email}</p>
          </div>
          <button
            onClick={() => navigate('/profile')}
            className="px-4 py-2 text-sm text-[#C0622F] hover:bg-[#C0622F]/10 rounded-lg transition-colors"
          >
            Edit Profile
          </button>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2].map(i => (
            <div key={i} className="bg-white rounded-lg shadow-sm overflow-hidden animate-pulse">
              <div className="aspect-video bg-gray-200"></div>
              <div className="p-4">
                <div className="h-6 bg-gray-200 rounded mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-2/3"></div>
              </div>
            </div>
          ))}
        </div>
      ) : recipes.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-[#1A1A18]/60 mb-4">
            {tab === 'published' ? 'No published recipes yet.' : 'No drafts yet.'}
          </p>
          <button
            onClick={() => navigate('/import')}
            className="text-[#C0622F] hover:underline"
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
