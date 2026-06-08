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
          <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-[#A9B8B5]" size={20} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title or description…"
            className="w-full pl-12 pr-12 py-3 bg-[#F8F3EE] border border-[#485E59]/30 rounded-full focus:ring-2 focus:ring-[#1C322D] focus:border-[#1C322D] text-[#1C322D] placeholder:text-[#A9B8B5]"
            autoFocus
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              aria-label="Clear search"
              className="absolute right-4 top-1/2 -translate-y-1/2 text-[#A9B8B5] hover:text-[#1C322D]"
            >
              <X size={20} />
            </button>
          )}
        </div>
      }
    >
      {allTags.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-[11px] font-semibold text-[#A9B8B5] uppercase tracking-[1.65px]">Filter by tag</h3>
            {selectedTags.length > 0 && (
              <button
                onClick={() => setSelectedTags([])}
                className="text-[11px] font-semibold text-[#EBB552] hover:underline uppercase tracking-[1.65px]"
              >
                Clear all ({selectedTags.length})
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {allTags.map(tag => (
              <button
                key={tag}
                onClick={() => toggleTag(tag)}
                className={`px-4 py-2 rounded-full text-[11px] font-semibold uppercase tracking-[1.65px] transition-all ${
                  selectedTags.includes(tag)
                    ? 'bg-[#1C322D] text-[#F8F3EE] border border-[#1C322D]'
                    : 'bg-[#F8F3EE] text-[#1C322D] border border-[#485E59]/30 hover:border-[#1C322D]'
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
          <p className="text-[#A9B8B5] text-base">
            {hasQuery
              ? 'No recipes match your search. Try different keywords or tags.'
              : 'Start typing to find recipes.'}
          </p>
        </div>
      ) : (
        <div>
          <p className="text-[11px] text-[#A9B8B5] mb-4 font-semibold uppercase tracking-[1.65px]">
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
