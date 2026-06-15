-- Update servings column to support decimal values (e.g., 2.5 portions)
-- Change from INTEGER to NUMERIC(4,1) to allow one decimal place
-- This supports servings like 0.5, 2.5, 4.5, etc. up to 999.9

ALTER TABLE recipes
ALTER COLUMN servings TYPE NUMERIC(4,1);

-- Update comment to reflect decimal support
COMMENT ON COLUMN recipes.servings IS 'Number of servings the recipe makes (supports decimals like 2.5, optional, used for scaling)';

-- Made with Bob