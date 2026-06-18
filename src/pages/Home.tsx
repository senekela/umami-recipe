import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Search,
  Users,
  Star,
  Bookmark,
  Sparkles,
  X,
  ArrowRight,
  Clock,
  Leaf,
} from 'lucide-react'
import { useRecipes } from '../hooks/useRecipes'
import { useAuth } from '../hooks/useAuth'
import { Layout } from '../components/Layout'
import { Card, CardContent } from '../app/components/ui/card'
import { Button } from '../app/components/ui/button'
import type { Recipe } from '../lib/types/recipe'

const filters = ['All', 'Quick', 'Vegetarian', 'Healthy', 'Comfort food']
const quickSearches = ['Pasta', 'Chicken', 'Vegetarian', '30 min', 'Healthy', 'Easy']

function Stat({ icon: Icon, label, value }: { icon: any; label: string; value: string | number }) {
  return (
    <div className="flex items-center gap-2 rounded-full border border-black/10 bg-white/55 px-3 py-2 text-xs text-stone-700 backdrop-blur">
      <Icon className="h-3.5 w-3.5 text-stone-950" />
      <span className="font-medium text-stone-950">{value}</span>
      <span>{label}</span>
    </div>
  )
}

function MiniPill({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <span className={`rounded-full border border-white/15 bg-white/10 px-2.5 py-1 text-xs font-medium text-white/90 backdrop-blur ${className}`}>
      {children}
    </span>
  )
}

export function Home() {
  const navigate = useNavigate()
  const { profile } = useAuth()
  const [query, setQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState('All')
  const [saved, setSaved] = useState<number[]>([])
  const [isSearchFocused, setIsSearchFocused] = useState(false)
  const [selectedRecipe, setSelectedRecipe] = useState<Recipe | null>(null)
  const [quickFilterActive, setQuickFilterActive] = useState<'fast' | 'vegetarian' | null>(null)
  const { recipes, loading, error } = useRecipes({})

  const normalizedQuery = query.trim().toLowerCase()
  const hasSearch = normalizedQuery.length > 0
  const isSearching = isSearchFocused || hasSearch

  const filteredRecipes = useMemo(() => {
    return recipes.filter((recipe) => {
      const searchableText = `${recipe.title} ${recipe.description || ''} ${recipe.tags.join(' ')}`.toLowerCase()
      const matchesQuery = !normalizedQuery || searchableText.includes(normalizedQuery)
      const matchesFilter = activeFilter === 'All' || recipe.tags.some(tag => tag.toLowerCase().includes(activeFilter.toLowerCase()))
      
      let matchesQuickFilter = true
      if (quickFilterActive === 'fast') {
        matchesQuickFilter = recipe.tags.some(tag => tag.toLowerCase().includes('quick') || tag.toLowerCase().includes('fast'))
      } else if (quickFilterActive === 'vegetarian') {
        matchesQuickFilter = recipe.tags.some(tag => tag.toLowerCase().includes('vegetarian'))
      }
      
      return matchesQuery && matchesFilter && matchesQuickFilter
    })
  }, [recipes, normalizedQuery, activeFilter, quickFilterActive])

  const quickFilters = [
    {
      label: 'Fast',
      icon: Clock,
      active: quickFilterActive === 'fast',
      onClick: () => setQuickFilterActive(quickFilterActive === 'fast' ? null : 'fast'),
    },
    {
      label: 'Vegetarian',
      icon: Leaf,
      active: quickFilterActive === 'vegetarian',
      onClick: () => setQuickFilterActive(quickFilterActive === 'vegetarian' ? null : 'vegetarian'),
    },
  ]

  const searchSuggestions = useMemo(() => {
    if (!normalizedQuery) return quickSearches

    const terms = new Set<string>()
    recipes.forEach((recipe) => {
      [recipe.title, ...recipe.tags].forEach((term) => {
        if (term.toLowerCase().includes(normalizedQuery)) terms.add(term)
      })
    })

    return Array.from(terms).slice(0, 6)
  }, [normalizedQuery, recipes])

  const toggleSaved = (id: number) => {
    setSaved((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]))
  }

  const clearSearch = () => {
    setQuery('')
    setActiveFilter('All')
  }

  const chooseSuggestion = (suggestion: string) => {
    setQuery(suggestion)
    setIsSearchFocused(false)
  }

  const featuredRecipe = selectedRecipe || filteredRecipes[0]

  const getRecipeGradient = (index: number) => {
    const gradients = [
      'from-stone-900 via-neutral-700 to-amber-500',
      'from-zinc-950 via-stone-700 to-orange-300',
      'from-emerald-950 via-stone-700 to-lime-300',
      'from-slate-950 via-red-900 to-rose-300',
    ]
    return gradients[index % gradients.length]
  }

  const getRecipeAccent = (index: number) => {
    const accents = ['bg-amber-400', 'bg-orange-300', 'bg-lime-300', 'bg-rose-300']
    return accents[index % accents.length]
  }

  return (
    <Layout
      hideNav={false}
      quickFilters={quickFilters}
      avatarUrl={profile?.avatar_url}
    >
      <div className={`grid gap-4 sm:gap-6 transition-[grid-template-columns] duration-500 ${isSearching ? 'lg:grid-cols-1' : 'lg:grid-cols-[1.08fr_0.92fr]'}`}>
        {/* Featured Recipe Hero */}
        <AnimatePresence initial={false}>
          {!isSearching && featuredRecipe ? (
            <motion.header
              key="recipe-of-the-day"
              layout
              initial={{ opacity: 0, x: -28, scale: 0.985 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: -28, scale: 0.985 }}
              transition={{ duration: 0.35, ease: 'easeOut' }}
              className="relative min-h-[480px] sm:min-h-[560px] overflow-hidden rounded-[1.75rem] sm:rounded-[2.5rem] bg-stone-950 p-4 sm:p-5 text-white shadow-2xl shadow-stone-950/20 md:p-8"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${getRecipeGradient(0)} opacity-90`} />
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(255,255,255,.24),transparent_28%),radial-gradient(circle_at_85%_15%,rgba(255,255,255,.15),transparent_22%),linear-gradient(to_bottom,transparent,rgba(0,0,0,.45))]" />
              
              <div className="relative flex h-full flex-col justify-between gap-6 sm:gap-10">
                <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-3">
                  <div className="flex gap-2">
                    <MiniPill>Featured tonight</MiniPill>
                    {featuredRecipe.tags[0] && <MiniPill>{featuredRecipe.tags[0]}</MiniPill>}
                  </div>
                  <button
                    onClick={() => toggleSaved(featuredRecipe.id)}
                    className="grid h-11 w-11 place-items-center rounded-full border border-white/15 bg-white/10 backdrop-blur transition hover:bg-white/20"
                    aria-label="Save recipe"
                  >
                    <Bookmark className={`h-5 w-5 ${saved.includes(featuredRecipe.id) ? 'fill-white' : ''}`} />
                  </button>
                </div>

                <div className="max-w-2xl">
                  <motion.div key={featuredRecipe.id} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35 }}>
                    <div className="mb-3 sm:mb-5 inline-flex items-center gap-2 rounded-full bg-black/20 px-2.5 sm:px-3 py-1.5 sm:py-2 text-xs sm:text-sm backdrop-blur">
                      <Sparkles className="h-4 w-4 text-yellow-200" />
                      Community favorite
                    </div>
                    <h1 className="max-w-3xl line-clamp-2 text-3xl sm:text-5xl font-semibold tracking-[-0.08em] text-[#FFF7E8] md:text-7xl leading-tight">
                      {featuredRecipe.title}
                    </h1>
                    {featuredRecipe.description && (
                      <div className="mt-3 sm:mt-5 max-w-xl">
                        <p className="text-sm sm:text-base leading-6 sm:leading-7 text-white/76 md:text-lg line-clamp-2">
                          {featuredRecipe.description}
                        </p>
                        <button
                          type="button"
                          onClick={() => navigate(`/recipes/${featuredRecipe.slug}`)}
                          className="mt-2 inline-flex items-center text-sm font-medium text-white underline underline-offset-4 transition hover:text-white/80"
                        >
                          Read more
                        </button>
                      </div>
                    )}
                  </motion.div>

                  <div className="mt-4 sm:mt-8 flex flex-wrap gap-2">
                    <Stat icon={Users} value={featuredRecipe.servings || 4} label="portions" />
                    {featuredRecipe.tags.length > 0 && <Stat icon={Star} value="4.8" label="rating" />}
                  </div>
                </div>

                <Button
                  onClick={() => navigate(`/recipes/${featuredRecipe.slug}`)}
                  className="w-full rounded-full bg-white/90 text-stone-950 hover:bg-white sm:w-auto text-sm sm:text-base py-2.5 sm:py-3"
                >
                  View recipe <ArrowRight className="ml-1.5 sm:ml-2 h-3.5 w-3.5 sm:h-4 sm:w-4" />
                </Button>
              </div>
            </motion.header>
          ) : null}
        </AnimatePresence>

        {/* Search and Recipe List */}
        <motion.aside
          layout
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.55, delay: 0.08 }}
          className="grid gap-6"
        >
          {/* Search Card */}
          <Card className="rounded-[1.5rem] sm:rounded-[2rem] border-black/10 bg-[#fbf7ef]/80 shadow-sm backdrop-blur-xl">
            <CardContent className="p-2.5 sm:p-3 md:p-4 !pb-2.5 sm:!pb-3 md:!pb-4">
              <div className={`relative rounded-[1.25rem] sm:rounded-[1.75rem] border bg-white/70 p-1.5 sm:p-2 transition ${isSearchFocused ? 'border-stone-950 shadow-xl shadow-stone-950/10' : 'border-black/10'}`}>
                <div className="flex items-center gap-1.5 sm:gap-2">
                  <Search className="ml-1.5 sm:ml-2 h-4 w-4 sm:h-5 sm:w-5 text-stone-400 flex-shrink-0" />
                  <input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    onFocus={() => setIsSearchFocused(true)}
                    onBlur={() => window.setTimeout(() => setIsSearchFocused(false), 140)}
                    placeholder="Search dishes, ingredients…"
                    className="h-8 sm:h-10 flex-1 bg-transparent text-xs sm:text-sm outline-none placeholder:text-stone-400 min-w-0"
                    aria-label="Search recipes"
                  />
                  {query ? (
                    <button onClick={() => setQuery('')} className="grid h-7 w-7 sm:h-9 sm:w-9 place-items-center rounded-full hover:bg-black/5 flex-shrink-0" aria-label="Clear search">
                      <X className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    </button>
                  ) : null}
                </div>

                {/* Search Suggestions Dropdown */}
                <AnimatePresence>
                  {isSearchFocused ? (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 8 }}
                      className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-30 rounded-[1.25rem] sm:rounded-[1.5rem] border border-black/10 bg-[#fffaf2] p-2.5 sm:p-3 shadow-2xl shadow-stone-950/15"
                    >
                      <div className="mb-2 flex items-center justify-between px-1">
                        <p className="text-xs font-medium uppercase tracking-[0.12em] text-stone-400">{hasSearch ? 'Suggestions' : 'Popular searches'}</p>
                        {hasSearch ? <span className="text-xs text-stone-400">{filteredRecipes.length} match{filteredRecipes.length === 1 ? '' : 'es'}</span> : null}
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {searchSuggestions.length ? searchSuggestions.map((suggestion) => (
                          <button
                            key={suggestion}
                            onMouseDown={(event) => event.preventDefault()}
                            onClick={() => chooseSuggestion(suggestion)}
                            className="rounded-full bg-stone-950 px-3 py-2 text-xs font-medium text-white transition hover:bg-stone-800"
                          >
                            {suggestion}
                          </button>
                        )) : (
                          <p className="px-1 py-2 text-sm text-stone-500">No suggestions yet. Try a tag or ingredient.</p>
                        )}
                      </div>
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </div>

              {/* Active Filters */}
              {(hasSearch || activeFilter !== 'All') ? (
                <div className="mt-3 sm:mt-4 flex flex-wrap items-center gap-1.5 sm:gap-2 rounded-xl sm:rounded-2xl border border-black/10 bg-white/45 p-1.5 sm:p-2">
                  <span className="px-1.5 sm:px-2 text-[10px] sm:text-xs font-medium text-stone-500">Showing</span>
                  {hasSearch ? <span className="rounded-full bg-stone-950 px-2.5 sm:px-3 py-1 sm:py-1.5 text-[10px] sm:text-xs text-white truncate max-w-[120px] sm:max-w-none">"{query.trim()}"</span> : null}
                  {activeFilter !== 'All' ? <span className="rounded-full bg-black/5 px-2.5 sm:px-3 py-1 sm:py-1.5 text-[10px] sm:text-xs text-stone-700">{activeFilter}</span> : null}
                  <button onClick={clearSearch} className="ml-auto rounded-full px-2.5 sm:px-3 py-1 sm:py-1.5 text-[10px] sm:text-xs font-medium text-stone-500 transition hover:bg-black/5 hover:text-stone-950">
                    Clear all
                  </button>
                </div>
              ) : null}

              {/* Filter Pills - Mobile */}
              <div className="mt-3 sm:mt-4 flex gap-1.5 sm:gap-2 overflow-x-auto pb-1 md:hidden scrollbar-hide">
                {filters.map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setActiveFilter(filter)}
                    className={`whitespace-nowrap rounded-full px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm transition flex-shrink-0 ${
                      activeFilter === filter ? 'bg-stone-950 text-white' : 'bg-white/70 text-stone-600'
                    }`}
                  >
                    {filter}
                  </button>
                ))}
              </div>

              {/* Quick Searches - Desktop */}
              <div className="mt-3 sm:mt-4 hidden flex-wrap gap-1.5 sm:gap-2 md:flex">
                {quickSearches.slice(0, 5).map((term) => (
                  <button key={term} onClick={() => setQuery(term)} className="rounded-full bg-white/65 px-2.5 sm:px-3 py-1 sm:py-1.5 text-[10px] sm:text-xs text-stone-500 transition hover:bg-stone-950 hover:text-white">
                    {term}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recipe List */}
          <div className="grid gap-2.5 sm:gap-3">
            <div className="flex items-end justify-between px-0.5 sm:px-1">
              <div className="min-w-0 flex-1">
                <p className="text-xs sm:text-sm font-medium text-stone-500">Explore</p>
                <h2 className="text-xl sm:text-2xl font-semibold tracking-[-0.04em] truncate">Curated recipes</h2>
              </div>
              <span className="rounded-full bg-white/65 px-2.5 sm:px-3 py-0.5 sm:py-1 text-[10px] sm:text-xs text-stone-500 whitespace-nowrap flex-shrink-0">{filteredRecipes.length} results</span>
            </div>

            <motion.div layout className={`grid gap-2.5 sm:gap-3 ${isSearching ? 'lg:grid-cols-2' : 'grid-cols-1'}`}>
              <AnimatePresence mode="popLayout">
                {loading ? (
                  [1, 2, 3].map((i) => (
                    <motion.div
                      key={`skeleton-${i}`}
                      layout
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="overflow-hidden rounded-[1.25rem] sm:rounded-[1.75rem] border border-black/10 bg-[#fbf7ef]/75 p-2.5 sm:p-3"
                    >
                      <div className="flex gap-2.5 sm:gap-4">
                        <div className="h-20 w-20 sm:h-24 sm:w-24 shrink-0 animate-pulse rounded-[1rem] sm:rounded-[1.35rem] bg-stone-200" />
                        <div className="min-w-0 flex-1 space-y-2 sm:space-y-3 py-0.5 sm:py-1">
                          <div className="h-3.5 sm:h-4 w-3/4 animate-pulse rounded bg-stone-200" />
                          <div className="h-2.5 sm:h-3 w-full animate-pulse rounded bg-stone-200" />
                          <div className="h-2.5 sm:h-3 w-2/3 animate-pulse rounded bg-stone-200" />
                        </div>
                      </div>
                    </motion.div>
                  ))
                ) : filteredRecipes.length ? filteredRecipes.slice(0, 10).map((recipe, index) => (
                  <motion.button
                    layout
                    key={recipe.id}
                    initial={{ opacity: 0, scale: 0.96, y: 10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.96, y: 10 }}
                    transition={{
                      duration: 0.3,
                      ease: [0.4, 0, 0.2, 1],
                      layout: { duration: 0.3 }
                    }}
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => {
                      setSelectedRecipe(recipe)
                      navigate(`/recipes/${recipe.slug}`)
                    }}
                    className={`group overflow-hidden rounded-[1.25rem] sm:rounded-[1.75rem] border text-left transition-all duration-300 ${
                      selectedRecipe?.id === recipe.id
                        ? 'border-stone-950 bg-stone-950 text-white shadow-xl shadow-stone-950/15'
                        : 'border-black/10 bg-[#fbf7ef]/75 hover:bg-white/90 hover:shadow-lg hover:border-stone-300'
                    }`}
                  >
                    <div className="flex gap-2 sm:gap-2.5 items-center p-2 sm:p-2.5">
                      {recipe.image_url ? (
                        <div className="h-16 w-16 sm:h-20 sm:w-20 shrink-0 rounded-[1rem] sm:rounded-[1.35rem] overflow-hidden">
                          <img
                            src={recipe.image_url}
                            alt={recipe.title}
                            className="h-full w-full object-cover"
                          />
                        </div>
                      ) : (
                        <div className={`h-16 w-16 sm:h-20 sm:w-20 shrink-0 rounded-[1rem] sm:rounded-[1.35rem] bg-gradient-to-br ${getRecipeGradient(index)}`}>
                          <div className="flex h-full items-end justify-start p-2 sm:p-3">
                            <span className={`h-3 w-3 sm:h-4 sm:w-4 rounded-full ${getRecipeAccent(index)} shadow-lg`} />
                          </div>
                        </div>
                      )}
                      <div className="min-w-0 flex-1 self-start">
                        <div className="flex items-start justify-between gap-1.5 sm:gap-2">
                          <h3 className="line-clamp-1 text-sm sm:text-base font-semibold tracking-tight">{recipe.title}</h3>
                          {saved.includes(recipe.id) ? <Bookmark className="h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0 fill-current" /> : null}
                        </div>
                        {recipe.description && (
                          <p className={`mt-0.5 text-xs sm:text-sm line-clamp-1 ${selectedRecipe?.id === recipe.id ? 'text-white/65' : 'text-stone-500'}`}>
                            {recipe.description}
                          </p>
                        )}
                        {/* Publisher name */}
                        {recipe.publisher && (
                          <p className={`mt-0.5 sm:mt-1 text-[10px] sm:text-xs ${selectedRecipe?.id === recipe.id ? 'text-white/50' : 'text-stone-400'} truncate`}>
                            by {recipe.publisher.nickname || 'Umami cook'}
                          </p>
                        )}
                        <div className="mt-1 sm:mt-1.5 flex flex-wrap gap-1.5 sm:gap-2 text-[10px] sm:text-xs">
                          {recipe.servings && (
                            <span className={`rounded-full px-2 sm:px-2.5 py-0.5 sm:py-1 ${selectedRecipe?.id === recipe.id ? 'bg-white/10' : 'bg-black/5'} whitespace-nowrap`}>
                              {recipe.servings} portions
                            </span>
                          )}
                          {recipe.tags[0] && (
                            <span className={`rounded-full px-2 sm:px-2.5 py-0.5 sm:py-1 ${selectedRecipe?.id === recipe.id ? 'bg-white/10' : 'bg-black/5'} truncate max-w-[100px] sm:max-w-none`}>
                              {recipe.tags[0]}
                            </span>
                          )}
                          <span className={`rounded-full px-2 sm:px-2.5 py-0.5 sm:py-1 ${selectedRecipe?.id === recipe.id ? 'bg-white/10' : 'bg-black/5'} whitespace-nowrap`}>★ 4.8</span>
                        </div>
                      </div>
                    </div>
                  </motion.button>
                )) : (
                  <motion.div
                    key="empty-search"
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    className="rounded-[1.25rem] sm:rounded-[1.75rem] border border-dashed border-black/15 bg-[#fbf7ef]/75 p-4 sm:p-6 text-center lg:col-span-2"
                  >
                    <div className="mx-auto grid h-10 w-10 sm:h-12 sm:w-12 place-items-center rounded-xl sm:rounded-2xl bg-stone-950 text-white">
                      <Search className="h-4 w-4 sm:h-5 sm:w-5" />
                    </div>
                    <h3 className="mt-3 sm:mt-4 text-base sm:text-lg font-semibold tracking-tight">No recipes found</h3>
                    <p className="mx-auto mt-1.5 sm:mt-2 max-w-sm text-xs sm:text-sm leading-5 sm:leading-6 text-stone-500">Try a broader search or explore popular tags.</p>
                    <div className="mt-3 sm:mt-4 flex flex-wrap justify-center gap-1.5 sm:gap-2">
                      {quickSearches.slice(0, 4).map((term) => (
                        <button key={term} onClick={() => setQuery(term)} className="rounded-full bg-white px-2.5 sm:px-3 py-1.5 sm:py-2 text-[10px] sm:text-xs font-medium text-stone-600 transition hover:bg-stone-950 hover:text-white">
                          {term}
                        </button>
                      ))}
                    </div>
                    <button onClick={clearSearch} className="mt-3 sm:mt-4 text-xs sm:text-sm font-medium text-stone-950 underline underline-offset-4">Reset search</button>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </div>
        </motion.aside>
      </div>

    </Layout>
  )
}
