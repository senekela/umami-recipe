# Portion-Servings Integration

## Overview

Le système de portions a été intégré avec les servings (nombre de personnes) dans la fonctionnalité de mise à l'échelle des recettes. Les quantités d'ingrédients affichent maintenant pour combien de personnes elles sont prévues, en se basant directement sur le champ `servings` de la recette.

## Data Model Changes

### Ingredient Type
Le type [`Ingredient`](src/lib/types/recipe.ts:1) reste simple sans champ portion séparé:

```typescript
export type Ingredient = {
  amount: string
  unit: string
  name: string
  group?: string
}
```

### ScaledIngredient Type
L'interface [`ScaledIngredient`](src/lib/recipeScaling.ts:10) inclut maintenant `servings`:

```typescript
export interface ScaledIngredient extends Ingredient {
  originalAmount: number
  scaledAmount: number
  displayAmount: string
  isAnchor?: boolean
  canBeAnchor?: boolean
  servings?: number // Number of servings (people) these quantities are for
}
```

## Implementation Details

### 1. Recipe Scaling Utilities

La fonction [`scaleIngredients()`](src/lib/recipeScaling.ts:129) maintenant:
- Accepte un paramètre optionnel `targetServings`
- Assigne directement `servings` à chaque ingrédient mis à l'échelle
- Les servings correspondent toujours au nombre de personnes (targetServings)

```typescript
return {
  ...ingredient,
  originalAmount,
  scaledAmount,
  displayAmount: `${formatAmount(roundedAmount)} ${ingredient.unit}`,
  isAnchor,
  canBeAnchor: canBeAnchor(ingredient),
  servings: targetServings // Always matches the target number of people
}
```

### 2. RecipeDetail Component

The [`RecipeDetail`](src/pages/RecipeDetail.tsx:15) component now passes `targetServings` to the scaling function:

```typescript
const scaledIngredients = scalingState
  ? scaleIngredients(
      recipe.ingredients,
      scalingState.scalingFactor,
      scalingState.anchorIngredientIndex,
      scalingState.targetServings  // ← New parameter
    )
  : recipe.ingredients
```

### 3. IngredientList Component

Le composant [`IngredientList`](src/components/IngredientList.tsx:9) affiche maintenant le nombre de personnes:

**Quand mis à l'échelle:**
```tsx
{scaledIng.servings && (
  <div className="text-xs text-muted-foreground">
    Pour {scaledIng.servings} personne{scaledIng.servings > 1 ? 's' : ''}
  </div>
)}
```

Cela affiche clairement pour combien de personnes les quantités adaptées sont prévues.

### 4. RecipeScaling Component

Le composant [`RecipeScaling`](src/components/RecipeScaling.tsx:21) affiche maintenant le feedback en termes de personnes:

**En mode servings:**
```tsx
{isScaled && (
  <p className="text-xs font-medium text-tertiary mt-1">
    Quantités adaptées pour {targetServings} personne{targetServings > 1 ? 's' : ''}
  </p>
)}
```

**En mode ingrédient:**
```tsx
{isScaled && (
  <p className="text-xs font-medium text-tertiary mt-1">
    Quantités adaptées pour environ {formatAmount(estimatedServings)} personne{estimatedServings > 1 ? 's' : ''}
  </p>
)}
```

## Usage Examples

### Example 1: Recette avec Servings

```json
{
  "title": "Gâteau au Chocolat",
  "servings": 8,
  "ingredients": [
    {
      "amount": "200",
      "unit": "g",
      "name": "farine"
    },
    {
      "amount": "150",
      "unit": "g",
      "name": "sucre"
    }
  ]
}
```

Quand mis à l'échelle pour 4 personnes (facteur: 0.5):
- Farine: 100g (pour 4 personnes)
- Sucre: 75g (pour 4 personnes)

### Example 2: Mode Ingrédient

Recette originale pour 6 personnes avec 300g de farine.
L'utilisateur a 450g de farine disponible.

Facteur d'échelle: 450/300 = 1.5
Personnes estimées: 6 × 1.5 = 9 personnes

Tous les ingrédients sont multipliés par 1.5x, et l'UI affiche "Quantités adaptées pour environ 9 personnes"

## Avantages

1. **Clarté**: Les utilisateurs voient exactement pour combien de personnes les quantités sont prévues
2. **Simplicité**: Le nombre de personnes correspond directement aux servings de la recette
3. **Calcul Automatique**: Le nombre de personnes est calculé automatiquement lors de la mise à l'échelle
4. **Cohérence**: "Portions" = "Personnes" = "Servings" dans toute l'application
5. **Feedback Clair**: L'UI affiche toujours le nombre de personnes, jamais de confusion

## Database Considerations

Aucune modification de base de données n'est nécessaire. Le système utilise directement le champ `servings` existant de la table `recipes`. Les ingrédients n'ont pas besoin de champ `portion` séparé.

## Améliorations Futures

Améliorations potentielles:
1. Ajouter des icônes de personnes dans l'UI
2. Permettre des demi-personnes (0.5, 1.5, etc.)
3. Afficher des suggestions de portions courantes (2, 4, 6, 8 personnes)
4. Sauvegarder les préférences de portions de l'utilisateur
5. Support des plages de personnes (ex: "pour 4-6 personnes")

## Testing

Pour tester l'intégration:
1. Créer ou éditer une recette avec des servings définis
2. Ajouter des ingrédients
3. Utiliser la fonctionnalité de mise à l'échelle dans les deux modes:
   - **Mode servings**: Ajuster le nombre de personnes cible
   - **Mode ingrédient**: Définir une quantité d'ingrédient de référence
4. Vérifier que le nombre de personnes s'affiche correctement sous chaque ingrédient
5. Vérifier que le nombre de personnes correspond toujours aux servings

---

**Made with Bob** 🤖