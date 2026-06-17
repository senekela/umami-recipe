-- Revert servings column back to INTEGER (no decimal support)
-- Servings should always be whole numbers (1, 2, 3, 4, etc.)
-- This migration reverts the NUMERIC(4,1) change from 20260615

-- First, round any existing decimal values to nearest integer
UPDATE recipes
SET servings = ROUND(servings)
WHERE servings IS NOT NULL;

-- Change column type back to INTEGER
ALTER TABLE recipes
ALTER COLUMN servings TYPE INTEGER USING ROUND(servings);

-- Update comment to reflect integer-only support
COMMENT ON COLUMN recipes.servings IS 'Number of servings the recipe makes (integer only, optional, used for scaling)';

-- Made with Bob