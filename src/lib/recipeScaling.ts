/**
 * Recipe Scaling Utilities
 * Based on RECIPE_SCALING_SPECIFICATION.md
 */

import type { Ingredient } from './types/recipe'

export type ScalingMode = 'servings' | 'ingredient'

export interface ScaledIngredient extends Ingredient {
  originalAmount: number
  scaledAmount: number
  displayAmount: string
  isAnchor?: boolean
  canBeAnchor?: boolean
}

export interface ScalingState {
  mode: ScalingMode
  originalServings: number | null
  targetServings: number
  anchorIngredientIndex: number | null
  anchorTargetAmount: number | null
  scalingFactor: number
}

/**
 * Round amount according to specification rules
 */
export function roundAmount(amount: number, unit: string): number {
  if (unit !== 'g') {
    // For non-gram units, round to 1 decimal or nearest integer
    if (unit === 'pièce' || unit === 'pièces' || unit === 'unité' || unit === 'unités') {
      return Math.round(amount)
    }
    return Math.round(amount * 10) / 10
  }

  // Rules for grams
  if (amount < 10) {
    // Round to 1 decimal
    return Math.round(amount * 10) / 10
  } else if (amount < 100) {
    // Round to nearest 0.5g
    return Math.round(amount * 2) / 2
  } else {
    // Round to nearest gram
    return Math.round(amount)
  }
}

/**
 * Parse amount string to number
 */
export function parseAmount(amountStr: string): number | null {
  // Remove spaces and replace comma with dot
  const cleaned = amountStr.trim().replace(',', '.')
  
  // Try to extract first number
  const match = cleaned.match(/^(\d+\.?\d*)/)
  if (match) {
    const num = parseFloat(match[1])
    return isNaN(num) ? null : num
  }
  
  return null
}

/**
 * Format amount for display
 */
export function formatAmount(amount: number): string {
  // Remove trailing zeros and unnecessary decimals
  if (amount === Math.floor(amount)) {
    return amount.toString()
  }
  return amount.toFixed(amount < 10 ? 1 : (amount < 100 ? 1 : 0)).replace(/\.0$/, '')
}

/**
 * Check if ingredient can be used as anchor
 */
export function canBeAnchor(ingredient: Ingredient): boolean {
  const amount = parseAmount(ingredient.amount)
  if (amount === null || amount <= 0) return false
  
  // Only allow gram-based ingredients as anchors
  if (ingredient.unit !== 'g') return false
  
  // Exclude vague quantities
  const vague = ['pincée', 'peu', 'goût', 'selon', 'environ']
  const lowerAmount = ingredient.amount.toLowerCase()
  if (vague.some(word => lowerAmount.includes(word))) return false
  
  return true
}

/**
 * Calculate scaling factor based on mode
 */
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
  
  // Mode: ingredient
  if (anchorIndex === null || anchorTargetAmount === null) return 1
  
  const anchorIngredient = ingredients[anchorIndex]
  if (!anchorIngredient) return 1
  
  const originalAmount = parseAmount(anchorIngredient.amount)
  if (!originalAmount || originalAmount <= 0) return 1
  
  return anchorTargetAmount / originalAmount
}

/**
 * Scale ingredients based on current state
 */
export function scaleIngredients(
  ingredients: Ingredient[],
  scalingFactor: number,
  anchorIndex: number | null
): ScaledIngredient[] {
  return ingredients.map((ingredient, index) => {
    const originalAmount = parseAmount(ingredient.amount)
    const isAnchor = index === anchorIndex
    
    if (originalAmount === null || originalAmount <= 0) {
      // Non-scalable ingredient
      return {
        ...ingredient,
        originalAmount: 0,
        scaledAmount: 0,
        displayAmount: ingredient.amount,
        isAnchor: false,
        canBeAnchor: false
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
      canBeAnchor: canBeAnchor(ingredient)
    }
  })
}

/**
 * Calculate estimated servings when using ingredient mode
 */
export function calculateEstimatedServings(
  originalServings: number | null,
  scalingFactor: number
): number | null {
  if (!originalServings) return null
  return originalServings * scalingFactor
}

/**
 * Validate target servings input
 */
export function validateServings(value: number): { valid: boolean; error?: string } {
  if (value <= 0) {
    return { valid: false, error: 'Le nombre de portions doit être supérieur à 0' }
  }
  if (value > 50) {
    return { valid: false, error: 'Le nombre de portions ne peut pas dépasser 50' }
  }
  return { valid: true }
}

/**
 * Validate anchor amount input
 */
export function validateAnchorAmount(value: number): { valid: boolean; error?: string } {
  if (value <= 0) {
    return { valid: false, error: 'La quantité doit être supérieure à 0 g' }
  }
  if (value > 99999) {
    return { valid: false, error: 'La quantité est trop élevée' }
  }
  return { valid: true }
}

// Made with Bob
