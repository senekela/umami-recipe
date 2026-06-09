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
          <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={20} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by title or description…"
            className="w-full pl-12 pr-12 py-3 bg-background border border-border/30 rounded-full focus:ring-2 focus:ring-primary focus:border-primary text-primary placeholder:text-muted-foreground"
            autoFocus
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              aria-label="Clear search"
              className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary"
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
            <h3 className="text-[11px] font-semibold text-muted-foreground uppercase tracking-[1.65px]">Filter by tag</h3>
            {selectedTags.length > 0 && (
              <button
                onClick={() => setSelectedTags([])}
                className="text-[11px] font-semibold text-tertiary hover:underline uppercase tracking-[1.65px]"
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
                    ? 'bg-primary text-primary-foreground border border-primary'
                    : 'bg-background text-primary border border-border/30 hover:border-primary'
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
          <p className="text-muted-foreground text-base">
            {hasQuery
              ? 'No recipes match your search. Try different keywords or tags.'
              : 'Start typing to find recipes.'}
          </p>
        </div>
      ) : (
        <div>
          <p className="text-[11px] text-muted-foreground mb-4 font-semibold uppercase tracking-[1.65px]">
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
