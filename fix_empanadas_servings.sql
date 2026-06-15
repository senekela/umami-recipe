-- Fix empanadas recipe servings to match "POUR 6 PERSONNES"
-- First, let's find the empanadas recipe
SELECT id, title, servings, slug 
FROM recipes 
WHERE title ILIKE '%empanada%' OR title ILIKE '%empenada%';

-- Update the servings to 6 to match "POUR 6 PERSONNES"
-- Uncomment and run this after verifying the recipe ID above:
-- UPDATE recipes 
-- SET servings = 6 
-- WHERE title ILIKE '%empanada%' OR title ILIKE '%empenada%';
