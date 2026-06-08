import { Link } from 'react-router-dom'
import { Avatar, AvatarFallback } from '../app/components/ui/avatar'
import type { Recipe } from '../lib/types/recipe'

function getPublisherInitials(name: string | null | undefined) {
  if (!name) return 'U'

  const trimmed = name.trim()
  if (trimmed.length === 0) return 'U'

  // Return first 2 letters of the nickname (or 1 if nickname is only 1 character)
  return trimmed.slice(0, 2).toUpperCase()
}

export function RecipeCard({ recipe }: { recipe: Recipe }) {
  const publisherName = recipe.publisher?.nickname?.trim() || 'Umami cook'

  return (
    <Link to={`/recipes/${recipe.slug}`} className="block group">
      <div className="bg-white rounded-2xl overflow-hidden border border-stone-200/80 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300">
        {recipe.image_url ? (
          <div className="aspect-video bg-gray-100">
            <img
              src={recipe.image_url}
              alt={recipe.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </div>
        ) : (
          <div className="aspect-video bg-gradient-to-br from-[#C0622F]/10 to-[#C0622F]/5 flex items-center justify-center">
            <svg className="w-12 h-12 text-[#C0622F]/30" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
        )}
        <div className="p-4 space-y-2">
          {/* Title and publisher badge grouped together */}
          <div className="space-y-1.5">
            <h3 className="font-serif text-xl text-[#1A1A18] line-clamp-2 leading-tight">
              {recipe.title}
            </h3>
            
            {/* Publisher badge - tiny tag under title */}
            <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-[#C0622F]/5 border border-[#C0622F]/10">
              <Avatar className="h-3.5 w-3.5">
                <AvatarFallback className="bg-[#C0622F] text-white text-[8px] font-semibold">
                  {getPublisherInitials(publisherName)}
                </AvatarFallback>
              </Avatar>
              <span className="text-[10px] text-[#1A1A18]/60 font-medium uppercase tracking-wide">
                {publisherName}
              </span>
            </div>
          </div>

          {/* Tags */}
          {recipe.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-1">
              {recipe.tags.slice(0, 3).map(tag => (
                <span key={tag} className="text-xs px-2 py-1 bg-[#C0622F]/10 text-[#C0622F] rounded-full">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </div>
    </Link>
  )
}
