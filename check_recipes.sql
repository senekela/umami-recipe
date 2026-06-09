-- Check if there are any published recipes
SELECT 
  r.id,
  r.title,
  r.status,
  r.published_at,
  r.owner_id,
  p.nickname
FROM recipes r
LEFT JOIN profiles p ON r.owner_id = p.id
WHERE r.status = 'published'
ORDER BY r.published_at DESC
LIMIT 5;
