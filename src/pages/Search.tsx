import { useState } from 'react'
import { useRecipes } from '../hooks/useRecipes'
import { RecipeCard } from '../components/RecipeCard'
import { Layout } from '../components/Layout'
import { Search as SearchIcon, X } from 'lucide-react'

export function Search() {
  const [search, setSearch] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const { recipes, loading } = useRecipes({ search, tags: selectedTags })

  const allTags = Array.from(new Set(recipes.flatMap(r => r.tags)))
  const hasQuery = search.trim().length > 0 || selectedTags.length > 0

  const toggleTag = (tag: string) => {
    setSelectedTags(prev =>
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    )
  }

  return (
    <Layout
      title="Search"
      belowHeader={
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title or description…"
            className="w-full pl-10 pr-10 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#C0622F] focus:border-transparent"
            autoFocus
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              aria-label="Clear search"
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X size={20} />
            </button>
          )}
        </div>
      }
    >
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
          <p className="text-[#1A1A18]/60">
            {hasQuery
              ? 'No recipes match your search. Try different keywords or tags.'
              : 'Start typing to find recipes.'}
          </p>
        </div>
      ) : (
        <div>
          <p className="text-sm text-[#1A1A18]/60 mb-4">
            {recipes.length} {recipes.length === 1 ? 'recipe' : 'recipes'} found
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {recipes.map(recipe => (
              <RecipeCard key={recipe.id} recipe={recipe} />
            ))}
          </div>
        </div>
      )}
    </Layout>
  )
}
