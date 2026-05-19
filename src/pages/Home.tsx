import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useRecipes } from '../hooks/useRecipes'
import { RecipeCard } from '../components/RecipeCard'
import { Layout } from '../components/Layout'
import { Search } from 'lucide-react'

export function Home() {
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const { recipes, loading } = useRecipes({ tags: selectedTags })

  const allTags = Array.from(new Set(recipes.flatMap(r => r.tags)))

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    )
  }

  return (
    <Layout
      rightSlot={
        <Link
          to="/search"
          aria-label="Search recipes"
          className="p-2 rounded-full text-[#1A1A18]/70 hover:text-[#1A1A18] hover:bg-gray-100 md:hidden"
        >
          <Search size={20} />
        </Link>
      }
    >
      <section className="mb-6">
        <h2 className="font-serif text-3xl text-[#1A1A18] mb-1">Discover recipes</h2>
        <p className="text-[#1A1A18]/60">A warm, hand-picked feed from the community.</p>
      </section>

      {allTags.length > 0 && (
        <div className="mb-6">
          <h3 className="text-sm font-medium text-[#1A1A18]/70 mb-3">Filter by tag</h3>
          <div className="flex flex-wrap gap-2">
            {allTags.map(tag => (
              <button
                key={tag}
                onClick={() => toggleTag(tag)}
                className={`px-3 py-1 rounded-full text-sm transition-colors ${
                  selectedTags.includes(tag)
                    ? 'bg-[#C0622F] text-white border border-[#C0622F]'
                    : 'bg-white text-[#1A1A18] border border-gray-300 hover:border-[#C0622F]'
                }`}
              >
                {tag}
              </button>
            ))}
          </div>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4].map(i => (
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
          <p className="text-[#1A1A18]/60 mb-3">No recipes yet.</p>
          <Link to="/import" className="text-[#C0622F] hover:underline">
            Import the first one →
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {recipes.map(recipe => (
            <RecipeCard key={recipe.id} recipe={recipe} />
          ))}
        </div>
      )}
    </Layout>
  )
}
