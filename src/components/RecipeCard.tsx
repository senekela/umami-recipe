import { useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Clock, Users, Star, Bookmark, ChevronDown } from 'lucide-react'
import type { Recipe } from '../lib/types/recipe'

const gradients = [
  'from-stone-900 via-neutral-700 to-amber-500',
  'from-zinc-950 via-stone-700 to-orange-300',
  'from-emerald-950 via-stone-700 to-lime-300',
  'from-slate-950 via-red-900 to-rose-300',
  'from-indigo-950 via-stone-700 to-blue-300',
  'from-purple-950 via-stone-700 to-pink-300',
]

const accents = [
  'bg-amber-400',
  'bg-orange-300',
  'bg-lime-300',
  'bg-rose-300',
  'bg-blue-300',
  'bg-pink-300',
]

function getRecipeGradient(id: number) {
  return gradients[id % gradients.length]
}

function getRecipeAccent(id: number) {
  return accents[id % accents.length]
}

export function RecipeCard({ recipe }: { recipe: Recipe }) {
  const publisherName = recipe.publisher?.nickname?.trim() || 'Umami cook'
  const [isExpanded, setIsExpanded] = useState(false)

  return (
    <Link to={`/recipes/${recipe.slug}`} className="block group">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ y: -4 }}
        transition={{ duration: 0.2 }}
        className="overflow-hidden rounded-[1.5rem] sm:rounded-[2rem] border border-black/10 bg-[#fbf7ef]/80 shadow-sm backdrop-blur-xl hover:shadow-xl hover:border-stone-950/20 transition-all"
      >
        {/* Recipe Image or Gradient */}
        {recipe.image_url ? (
          <div className="aspect-video overflow-hidden">
            <img
              src={recipe.image_url}
              alt={recipe.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            />
          </div>
        ) : (
          <div className={`aspect-video bg-gradient-to-br ${getRecipeGradient(recipe.id)} relative overflow-hidden`}>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,.2),transparent_50%)]" />
            <div className="absolute bottom-4 left-4">
              <span className={`h-6 w-6 rounded-full ${getRecipeAccent(recipe.id)} shadow-lg block`} />
            </div>
          </div>
        )}

        {/* Card Content */}
        <div className="p-4 sm:p-5 md:p-6">
          <div className="flex items-start justify-between gap-2 sm:gap-3 mb-2.5 sm:mb-3">
            <h3 className="font-display text-lg sm:text-xl font-semibold tracking-tight text-stone-950 line-clamp-2 flex-1 min-w-0">
              {recipe.title}
            </h3>
            <button
              onClick={(e) => {
                e.preventDefault()
              }}
              className="grid h-8 w-8 sm:h-9 sm:w-9 shrink-0 place-items-center rounded-full border border-black/10 bg-white/55 backdrop-blur transition hover:bg-white hover:border-stone-950"
              aria-label="Save recipe"
            >
              <Bookmark className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-stone-700" />
            </button>
          </div>

          {/* Description */}
          {recipe.description && (
            <div className="mb-3 sm:mb-4">
              <p className={`text-xs sm:text-sm text-stone-600 leading-relaxed ${isExpanded ? '' : 'line-clamp-5'}`}>
                {recipe.description}
              </p>
              {recipe.description.length > 200 && (
                <button
                  onClick={(e) => {
                    e.preventDefault()
                    setIsExpanded(!isExpanded)
                  }}
                  className="mt-1.5 sm:mt-2 flex items-center gap-0.5 sm:gap-1 text-[10px] sm:text-xs font-medium text-stone-600 hover:text-stone-950 transition-colors"
                >
                  {isExpanded ? 'Show less' : 'Read more'}
                  <ChevronDown className={`h-2.5 w-2.5 sm:h-3 sm:w-3 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                </button>
              )}
            </div>
          )}

          {/* Meta Information */}
          <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-3 sm:mb-4">
            {recipe.servings && (
              <div className="flex items-center gap-1 sm:gap-1.5 rounded-full bg-white/70 px-2.5 sm:px-3 py-1 sm:py-1.5 text-[10px] sm:text-xs text-stone-700 whitespace-nowrap">
                <Users className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                <span className="font-medium">{recipe.servings}</span>
              </div>
            )}
            <div className="flex items-center gap-1 sm:gap-1.5 rounded-full bg-white/70 px-2.5 sm:px-3 py-1 sm:py-1.5 text-[10px] sm:text-xs text-stone-700 whitespace-nowrap">
              <Star className="h-3 w-3 sm:h-3.5 sm:w-3.5 fill-amber-400 text-amber-400" />
              <span className="font-medium">4.8</span>
            </div>
          </div>

          {/* Tags */}
          {recipe.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 sm:gap-2 pt-2 border-t border-black/5">
              {recipe.tags.slice(0, 3).map((tag) => (
                <span
                  key={tag}
                  className="text-[9px] sm:text-[10px] px-2 sm:px-2.5 py-0.5 sm:py-1 bg-stone-950 text-white rounded-full font-semibold uppercase tracking-wider truncate max-w-[80px] sm:max-w-none"
                >
                  {tag}
                </span>
              ))}
              {recipe.tags.length > 3 && (
                <span className="text-[9px] sm:text-[10px] px-2 sm:px-2.5 py-0.5 sm:py-1 bg-stone-200 text-stone-600 rounded-full font-semibold whitespace-nowrap">
                  +{recipe.tags.length - 3}
                </span>
              )}
            </div>
          )}

          {/* Publisher Badge */}
          <div className="mt-3 sm:mt-4 pt-2.5 sm:pt-3 border-t border-black/5">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <div className="h-5 w-5 sm:h-6 sm:w-6 rounded-full bg-stone-950 flex items-center justify-center flex-shrink-0">
                <span className="text-[9px] sm:text-[10px] font-bold text-white">
                  {publisherName.slice(0, 1).toUpperCase()}
                </span>
              </div>
              <span className="text-[10px] sm:text-xs text-stone-500 font-medium truncate">
                by {publisherName}
              </span>
            </div>
          </div>
        </div>
      </motion.div>
    </Link>
  )
}
