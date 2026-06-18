import type { Ingredient } from './types/recipe'

export type ScalingMode = 'servings' | 'ingredient'

export interface ScaledIngredient extends Ingredient {
  originalAmount: number
  scaledAmount: number
  displayAmount: string
  isAnchor?: boolean
  canBeAnchor?: boolean
  servings?: number // Number of servings these quantities are for
}

export interface ScalingState {
  mode: ScalingMode
  originalServings: number | null
  targetServings: number
  anchorIngredientIndex: number | null
  anchorTargetAmount: number | null
  scalingFactor: number
}

export function roundAmount(amount: number, unit: string): number {
  if (unit !== 'g') {
    if (unit === 'pièce' || unit === 'pièces' || unit === 'unité' || unit === 'unités') {
      return Math.round(amount)
    }
    return Math.round(amount * 10) / 10
  }

  if (amount < 10) {
    return Math.round(amount * 10) / 10
  } else if (amount < 100) {
    return Math.round(amount * 2) / 2
  } else {
    return Math.round(amount)
  }
}

export function parseAmount(amountStr: string): number | null {
  const cleaned = amountStr.trim().replace(',', '.')
  
  const match = cleaned.match(/^(\d+\.?\d*)/)
  if (match) {
    const num = parseFloat(match[1])
    return isNaN(num) ? null : num
  }
  
  return null
}

export function formatAmount(amount: number): string {
  if (amount === Math.floor(amount)) {
    return amount.toString()
  }
  return amount.toFixed(amount < 10 ? 1 : (amount < 100 ? 1 : 0)).replace(/\.0$/, '')
}

export function canBeAnchor(ingredient: Ingredient): boolean {
  const amount = parseAmount(ingredient.amount)
  if (amount === null || amount <= 0) return false
  
  const preciseUnits = ['g', 'ml', 'cl', 'L', 'l']
  if (!preciseUnits.includes(ingredient.unit)) return false
  
  const vague = ['pincée', 'peu', 'goût', 'selon', 'environ']
  const lowerAmount = ingredient.amount.toLowerCase()
  if (vague.some(word => lowerAmount.includes(word))) return false
  
  return true
}

export function calculateScalingFactor(
  mode: ScalingMode,
  originalServings: number | null,
  targetServings: number,
  ingredients: Ingredient[],
  anchorIndex: number | null,
  anchorTargetAmount: number | null
): number {
  if (mode === 'servings') {
    if (!originalServings || originalServings <= 0) return 1
    return targetServings / originalServings
  }
  
  if (anchorIndex === null || anchorTargetAmount === null) return 1
  
  const anchorIngredient = ingredients[anchorIndex]
  if (!anchorIngredient) return 1
  
  const originalAmount = parseAmount(anchorIngredient.amount)
  if (!originalAmount || originalAmount <= 0) return 1
  
  return anchorTargetAmount / originalAmount
}

export function scaleIngredients(
  ingredients: Ingredient[],
  scalingFactor: number,
  anchorIndex: number | null,
  targetServings?: number
): ScaledIngredient[] {
  return ingredients.map((ingredient, index) => {
    const originalAmount = parseAmount(ingredient.amount)
    const isAnchor = index === anchorIndex
    
    if (originalAmount === null || originalAmount <= 0) {
      return {
        ...ingredient,
        originalAmount: 0,
        scaledAmount: 0,
        displayAmount: ingredient.amount,
        isAnchor: false,
        canBeAnchor: false,
        servings: targetServings
      }
    }
    
    const scaledAmount = originalAmount * scalingFactor
    const roundedAmount = roundAmount(scaledAmount, ingredient.unit)
    
    return {
      ...ingredient,
      originalAmount,
      scaledAmount,
      displayAmount: `${formatAmount(roundedAmount)} ${ingredient.unit}`,
      isAnchor,
      canBeAnchor: canBeAnchor(ingredient),
      servings: targetServings
    }
  })
}

export function calculateEstimatedServings(
  originalServings: number | null,
  scalingFactor: number
): number | null {
  if (!originalServings) return null
  return originalServings * scalingFactor
}

export function validateServings(value: number): { valid: boolean; error?: string } {
  if (value <= 0) {
    return { valid: false, error: 'Le nombre de portions doit être supérieur à 0' }
  }
  if (value > 50) {
    return { valid: false, error: 'Le nombre de portions ne peut pas dépasser 50' }
  }
  return { valid: true }
}

export function validateAnchorAmount(value: number): { valid: boolean; error?: string } {
  if (value <= 0) {
    return { valid: false, error: 'La quantité doit être supérieure à 0 g' }
  }
  if (value > 99999) {
    return { valid: false, error: 'La quantité est trop élevée' }
  }
  return { valid: true }
}
