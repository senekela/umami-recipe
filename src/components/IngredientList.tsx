import type { Ingredient } from '../lib/types/recipe'

export function IngredientList({ ingredients }: { ingredients: Ingredient[] }) {
  const grouped: Record<string, Ingredient[]> = {}

  ingredients.forEach(ing => {
    const group = ing.group || 'main'
    if (!grouped[group]) grouped[group] = []
    grouped[group].push(ing)
  })

  return (
    <div className="space-y-6">
      {Object.entries(grouped).map(([group, items]) => (
        <div key={group}>
          {group !== 'main' && (
            <h3 className="font-serif text-lg text-primary mb-3">{group}</h3>
          )}
          <ul className="space-y-2">
            {items.map((ing, idx) => (
              <li key={idx} className="ingredient flex items-start gap-3">
                <input
                  type="checkbox"
                  id={`ing-${group}-${idx}`}
                  className="mt-1 w-4 h-4 rounded border-gray-300 text-tertiary focus:ring-[#d97757]"
                />
                <label htmlFor={`ing-${group}-${idx}`} className="flex-1 cursor-pointer">
                  <span className="font-medium">{ing.amount} {ing.unit}</span> {ing.name}
                </label>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  )
}
