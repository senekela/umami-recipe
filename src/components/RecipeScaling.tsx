import { useState, useEffect } from 'react'
import { Minus, Plus, RotateCcw } from 'lucide-react'
import type { Ingredient } from '../lib/types/recipe'
import {
  type ScalingMode,
  type ScalingState,
  calculateScalingFactor,
  calculateEstimatedServings,
  validateServings,
  validateAnchorAmount,
  canBeAnchor,
  formatAmount
} from '../lib/recipeScaling'

interface RecipeScalingProps {
  originalServings: number | null
  ingredients: Ingredient[]
  onScalingChange: (state: ScalingState) => void
}

export function RecipeScaling({ originalServings, ingredients, onScalingChange }: RecipeScalingProps) {
  const [mode, setMode] = useState<ScalingMode>('servings')
  const [targetServings, setTargetServings] = useState(originalServings || 4)
  const [anchorIndex, setAnchorIndex] = useState<number | null>(null)
  const [anchorAmount, setAnchorAmount] = useState<string>('')
  const [servingsError, setServingsError] = useState<string>('')
  const [anchorError, setAnchorError] = useState<string>('')

  const eligibleAnchors = ingredients
    .map((ing, idx) => ({ ingredient: ing, index: idx }))
    .filter(({ ingredient }) => canBeAnchor(ingredient))

  const scalingFactor = calculateScalingFactor(
    mode,
    originalServings,
    targetServings,
    ingredients,
    anchorIndex,
    anchorAmount ? parseFloat(anchorAmount) : null
  )

  const estimatedServings = mode === 'ingredient'
    ? calculateEstimatedServings(originalServings, scalingFactor)
    : null

  useEffect(() => {
    onScalingChange({
      mode,
      originalServings,
      targetServings,
      anchorIngredientIndex: anchorIndex,
      anchorTargetAmount: anchorAmount ? parseFloat(anchorAmount) : null,
      scalingFactor
    })
  }, [mode, targetServings, anchorIndex, anchorAmount, scalingFactor, originalServings, onScalingChange])

  const handleServingsChange = (value: number) => {
    const validation = validateServings(value)
    if (!validation.valid) {
      setServingsError(validation.error || '')
      return
    }
    setServingsError('')
    setTargetServings(value)
  }

  const handleAnchorAmountChange = (value: string) => {
    setAnchorAmount(value)
    const numValue = parseFloat(value)
    if (value && !isNaN(numValue)) {
      const validation = validateAnchorAmount(numValue)
      setAnchorError(validation.valid ? '' : validation.error || '')
    } else {
      setAnchorError('')
    }
  }

  const handleReset = () => {
    setMode('servings')
    setTargetServings(originalServings || 4)
    setAnchorIndex(null)
    setAnchorAmount('')
    setServingsError('')
    setAnchorError('')
  }

  const handleModeChange = (newMode: ScalingMode) => {
    setMode(newMode)
    if (newMode === 'servings') {
      setAnchorIndex(null)
      setAnchorAmount('')
      setAnchorError('')
    } else {
      if (eligibleAnchors.length > 0 && anchorIndex === null) {
        setAnchorIndex(eligibleAnchors[0].index)
      }
    }
  }

  const isScaled = scalingFactor !== 1

  return (
    <div className="bg-secondary/10 rounded-2xl p-6 space-y-6">
      {/* Mode Selector */}
      <div className="space-y-3">
        <label className="text-sm font-medium text-primary">Mode d'adaptation</label>
        <div className="flex gap-2">
          <button
            onClick={() => handleModeChange('servings')}
            disabled={!originalServings}
            className={`flex-1 px-4 py-3 rounded-full text-[11px] font-semibold uppercase tracking-[1.65px] transition-all ${
              mode === 'servings'
                ? 'bg-primary text-primary-foreground'
                : 'bg-background border border-border/30 text-primary hover:bg-primary/5'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            Par portions
          </button>
          <button
            onClick={() => handleModeChange('ingredient')}
            disabled={eligibleAnchors.length === 0}
            className={`flex-1 px-4 py-3 rounded-full text-[11px] font-semibold uppercase tracking-[1.65px] transition-all ${
              mode === 'ingredient'
                ? 'bg-primary text-primary-foreground'
                : 'bg-background border border-border/30 text-primary hover:bg-primary/5'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            Par ingrédient
          </button>
        </div>
        {!originalServings && mode === 'servings' && (
          <p className="text-xs text-muted-foreground">Cette recette n'a pas de nombre de portions défini</p>
        )}
        {eligibleAnchors.length === 0 && mode === 'ingredient' && (
          <p className="text-xs text-muted-foreground">Aucun ingrédient éligible pour l'adaptation</p>
        )}
      </div>

      {/* Servings Mode Controls */}
      {mode === 'servings' && originalServings && (
        <div className="space-y-3">
          <label className="text-sm font-medium text-primary">Portions</label>
          <div className="flex items-center gap-3">
            <button
              onClick={() => handleServingsChange(Math.max(1, targetServings - 1))}
              className="w-10 h-10 rounded-full bg-background border border-border/30 flex items-center justify-center hover:bg-primary/5 transition-colors"
              aria-label="Diminuer les portions"
            >
              <Minus size={16} className="text-primary" />
            </button>
            <div className="flex-1 text-center">
              <input
                type="number"
                value={targetServings}
                onChange={(e) => handleServingsChange(parseInt(e.target.value) || 0)}
                className="w-full text-center text-2xl font-semibold bg-transparent border-none outline-none text-primary"
                min="1"
                max="50"
                step="1"
              />
              <p className="text-xs text-muted-foreground mt-1">
                Recette originale : {originalServings} personne{originalServings > 1 ? 's' : ''}
              </p>
              {isScaled && (
                <p className="text-xs font-medium text-tertiary mt-1">
                  Quantités adaptées pour {targetServings} personne{targetServings > 1 ? 's' : ''}
                </p>
              )}
            </div>
            <button
              onClick={() => handleServingsChange(Math.min(50, targetServings + 1))}
              className="w-10 h-10 rounded-full bg-background border border-border/30 flex items-center justify-center hover:bg-primary/5 transition-colors"
              aria-label="Augmenter les portions"
            >
              <Plus size={16} className="text-primary" />
            </button>
          </div>
          {servingsError && (
            <p className="text-xs text-destructive">{servingsError}</p>
          )}
        </div>
      )}

      {/* Ingredient Mode Controls */}
      {mode === 'ingredient' && eligibleAnchors.length > 0 && (
        <div className="space-y-4">
          {/* Ingredient Selector */}
          <div className="space-y-3">
            <label htmlFor="anchor-ingredient" className="text-sm font-medium text-primary">
              Ingrédient de référence
            </label>
            <select
              id="anchor-ingredient"
              value={anchorIndex ?? ''}
              onChange={(e) => setAnchorIndex(e.target.value ? parseInt(e.target.value) : null)}
              className="w-full px-5 py-4 rounded-full bg-background border border-border/30 text-primary focus:outline-none focus:ring-2 focus:ring-tertiary/20"
            >
              {eligibleAnchors.map(({ ingredient, index }) => (
                <option key={index} value={index}>
                  {ingredient.name} ({ingredient.amount} {ingredient.unit})
                </option>
              ))}
            </select>
          </div>

          {/* Amount Input */}
          {anchorIndex !== null && (
            <div className="space-y-3">
              <label htmlFor="anchor-amount" className="text-sm font-medium text-primary">
                Quantité disponible
              </label>
              <div className="relative">
                <input
                  id="anchor-amount"
                  type="number"
                  value={anchorAmount}
                  onChange={(e) => handleAnchorAmountChange(e.target.value)}
                  placeholder="Ex : 250"
                  className="w-full px-4 py-3 pr-12 rounded-full bg-background border border-border/30 text-primary focus:outline-none focus:ring-2 focus:ring-tertiary/20"
                  min="0.1"
                  max="99999"
                  step="0.1"
                  inputMode="decimal"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground">
                  {ingredients[anchorIndex].unit}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Quantité originale : {ingredients[anchorIndex].amount} {ingredients[anchorIndex].unit}
              </p>
              {anchorError && (
                <p className="text-xs text-destructive">{anchorError}</p>
              )}
            </div>
          )}

          {/* Estimated Servings */}
          {estimatedServings !== null && anchorAmount && !anchorError && (
            <div className="pt-2 border-t border-border/20">
              <p className="text-sm text-muted-foreground">
                Personnes estimées : <span className="font-semibold text-primary">{formatAmount(estimatedServings)}</span>
              </p>
              {isScaled && (
                <p className="text-xs font-medium text-tertiary mt-1">
                  Quantités adaptées pour environ {formatAmount(estimatedServings)} personne{estimatedServings > 1 ? 's' : ''}
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Scaling Factor Display */}
      {isScaled && (
        <div className="pt-4 border-t border-border/20 flex items-center justify-between">
          <div>
            <p className="text-xs text-muted-foreground mb-1">Facteur d'échelle</p>
            <p className="text-lg font-semibold text-tertiary">
              ×{formatAmount(scalingFactor)}
            </p>
          </div>
          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-4 py-2 text-[11px] font-semibold uppercase tracking-[1.65px] text-primary hover:text-tertiary transition-colors"
          >
            <RotateCcw size={14} />
            Réinitialiser
          </button>
        </div>
      )}
    </div>
  )
}
