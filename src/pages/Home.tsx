import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useRecipes } from '../hooks/useRecipes'
import { RecipeCard } from '../components/RecipeCard'
import { Layout } from '../components/Layout'
import { Search } from 'lucide-react'

export function Home() {
  const navigate = useNavigate()
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
          className="p-2 rounded-full text-primary/70 hover:text-primary hover:bg-primary/5 md:hidden"
        >
          <Search size={20} />
        </Link>
      }
    >
      <section className="mb-8">
        <h2 className="font-display text-5xl text-primary-foreground mb-2 font-normal">Discover recipes</h2>
        <p className="text-muted-foreground text-base font-light">A warm, hand-picked feed from the community.</p>
      </section>

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
        <div className="max-w-2xl mx-auto">
          <div className="p-10 text-center">
            <div className="w-16 h-16 bg-tertiary/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-tertiary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <h2 className="font-display text-3xl text-primary mb-3 font-normal">Welcome to Umami</h2>
            <p className="text-muted-foreground mb-8 text-base font-light leading-relaxed">
              Your personal recipe collection starts here. Import recipes from any website or snap a photo of a recipe card to get started.
            </p>
            <div className="grid sm:grid-cols-2 gap-4">
              <button
                onClick={() => navigate('/import')}
                className="bg-white border border-border/20 rounded-lg p-6 text-left hover:border-primary hover:shadow-lg transition-all cursor-pointer group"
              >
                <div className="w-10 h-10 bg-secondary/20 rounded-full flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                  </svg>
                </div>
                <h3 className="font-semibold text-primary mb-2">Import from URL</h3>
                <p className="text-sm text-muted-foreground font-light">
                  Paste a link from 376+ supported recipe sites. We'll extract everything automatically.
                </p>
              </button>
              <button
                onClick={() => navigate('/import')}
                className="bg-white border border-border/20 rounded-lg p-6 text-left hover:border-primary hover:shadow-lg transition-all cursor-pointer group"
              >
                <div className="w-10 h-10 bg-secondary/20 rounded-full flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <svg className="w-5 h-5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-primary mb-2">Scan a Photo</h3>
                <p className="text-sm text-muted-foreground font-light">
                  Take a picture of a recipe card or cookbook page. OCR will extract the text.
                </p>
              </button>
            </div>
          </div>
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
