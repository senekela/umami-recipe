import type { Ingredient } from '../lib/types/recipe'
import type { ScaledIngredient } from '../lib/recipeScaling'

interface IngredientListProps {
  ingredients: Ingredient[] | ScaledIngredient[]
  isScaled?: boolean
}

export function IngredientList({ ingredients, isScaled = false }: IngredientListProps) {
  const grouped: Record<string, (Ingredient | ScaledIngredient)[]> = {}

  ingredients.forEach(ing => {
    const group = ing.group || 'main'
    if (!grouped[group]) grouped[group] = []
    grouped[group].push(ing)
  })

  const isScaledIngredient = (ing: Ingredient | ScaledIngredient): ing is ScaledIngredient => {
    return 'scaledAmount' in ing
  }

  return (
    <div className="space-y-6">
      {Object.entries(grouped).map(([group, items]) => (
        <div key={group}>
          {group !== 'main' && (
            <h3 className="font-serif text-lg text-primary mb-3">{group}</h3>
          )}
          <ul className="space-y-3">
            {items.map((ing, idx) => {
              const scaledIng = isScaledIngredient(ing) ? ing : null
              const showScaling = isScaled && scaledIng && scaledIng.originalAmount > 0
              
              return (
                <li key={idx} className="ingredient flex items-start gap-3">
                  <input
                    type="checkbox"
                    id={`ing-${group}-${idx}`}
                    className="mt-1 w-4 h-4 rounded border-gray-300 text-tertiary focus:ring-[#d97757]"
                  />
                  <label htmlFor={`ing-${group}-${idx}`} className="flex-1 cursor-pointer">
                    {showScaling ? (
                      <div className="space-y-1">
                        <div className="flex items-baseline gap-2 flex-wrap">
                          <span className="text-sm text-muted-foreground line-through">
                            {ing.amount} {ing.unit}
                          </span>
                          <span className="text-muted-foreground">→</span>
                          <span className="font-semibold text-primary">
                            {scaledIng.displayAmount}
                          </span>
                          <span className="text-primary">{ing.name}</span>
                        </div>
                        {scaledIng.isAnchor && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-800 text-[10px] font-semibold uppercase tracking-wide rounded-full">
                            📌 Ingrédient de référence
                          </span>
                        )}
                      </div>
                    ) : (
                      <div>
                        <span className="font-medium">{ing.amount} {ing.unit}</span> {ing.name}
                        {scaledIng && scaledIng.originalAmount === 0 && (
                          <span className="block text-xs text-muted-foreground mt-1">
                            À ajuster selon le goût
                          </span>
                        )}
                      </div>
                    )}
                  </label>
                </li>
              )
            })}
          </ul>
        </div>
      ))}
    </div>
  )
}
