-- Add servings column to recipes table
ALTER TABLE recipes
ADD COLUMN IF NOT EXISTS servings INTEGER;

-- Add comment to explain the column
COMMENT ON COLUMN recipes.servings IS 'Number of servings the recipe makes (optional, used for scaling)';

-- Made with Bob
