-- Make user_id nullable for global catalog seeds
ALTER TABLE public.recipes ALTER COLUMN user_id DROP NOT NULL;

-- Add license column if missing
ALTER TABLE public.recipes ADD COLUMN IF NOT EXISTS license text;

-- Relax RLS to allow select all, but restrict writes to owner
DO $$
BEGIN
  -- Drop old policy if it exists
  IF EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'recipes'
      AND policyname = 'Users can only access their own recipes'
  ) THEN
    DROP POLICY "Users can only access their own recipes" ON public.recipes;
  END IF;

  -- Create new policies if they don't already exist
  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'recipes'
      AND policyname = 'recipes_select_all'
  ) THEN
    CREATE POLICY recipes_select_all ON public.recipes
      FOR SELECT USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename = 'recipes'
      AND policyname = 'recipes_modify_owned'
  ) THEN
    CREATE POLICY recipes_modify_owned ON public.recipes
      FOR ALL USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;
END $$;

-- Optional indices
CREATE INDEX IF NOT EXISTS idx_recipes_difficulty ON public.recipes(difficulty);
