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
      <div className="bg-[#F8F3EE] rounded-none overflow-hidden border-0 hover:shadow-[rgba(28,50,45,0.15)_0px_40px_80px_-20px] hover:-translate-y-1 transition-all duration-300">
        {recipe.image_url ? (
          <div className="aspect-video bg-[#A9B8B5]/10">
            <img
              src={recipe.image_url}
              alt={recipe.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </div>
        ) : (
          <div className="aspect-video bg-gradient-to-br from-[#EBB552]/10 to-[#A2C2B3]/10 flex items-center justify-center">
            <svg className="w-12 h-12 text-[#1C322D]/20" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
        )}
        <div className="p-10 space-y-3">
          {/* Title and publisher badge grouped together */}
          <div className="space-y-2">
            <h3 className="font-display text-2xl text-[#1C322D] line-clamp-2 leading-tight font-normal">
              {recipe.title}
            </h3>
            
            {/* Publisher badge - tiny tag under title */}
            <div className="inline-flex items-center gap-1.5 px-2 py-1 rounded-full bg-[#1C322D]/5 border border-[#485E59]/20">
              <Avatar className="h-4 w-4">
                <AvatarFallback className="bg-[#1C322D] text-[#F8F3EE] text-[8px] font-semibold">
                  {getPublisherInitials(publisherName)}
                </AvatarFallback>
              </Avatar>
              <span className="text-[10px] text-[#A9B8B5] font-semibold uppercase tracking-[1.5px]">
                {publisherName}
              </span>
            </div>
          </div>

          {/* Tags */}
          {recipe.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-2">
              {recipe.tags.slice(0, 3).map(tag => (
                <span key={tag} className="text-[11px] px-3 py-1.5 bg-[#A2C2B3]/20 text-[#1C322D] rounded-full font-semibold uppercase tracking-wide">
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
