-- Add foreign key relationship between recipes and profiles
-- This allows Supabase to automatically join the tables

-- First, check if the foreign key already exists and drop it if needed
DO $$ 
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'recipes_owner_id_fkey' 
        AND table_name = 'recipes'
    ) THEN
        ALTER TABLE public.recipes DROP CONSTRAINT recipes_owner_id_fkey;
    END IF;
END $$;

-- Add the foreign key constraint
-- Note: We use ON DELETE CASCADE so if a user is deleted, their recipes are too
ALTER TABLE public.recipes
ADD CONSTRAINT recipes_owner_id_fkey 
FOREIGN KEY (owner_id) 
REFERENCES public.profiles(id) 
ON DELETE CASCADE;

-- Reload the schema cache so PostgREST picks up the new relationship
NOTIFY pgrst, 'reload schema';

-- Made with Bob