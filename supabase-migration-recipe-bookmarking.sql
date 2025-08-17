BEGIN;

-- Minimal saved_recipes table
CREATE TABLE IF NOT EXISTS public.saved_recipes (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipe_id  uuid NOT NULL REFERENCES public.recipes(id) ON DELETE CASCADE,
  note       text,                    -- optional: user note on the save
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Uniqueness: a user can save a given recipe only once
CREATE UNIQUE INDEX IF NOT EXISTS ux_saved_user_recipe
  ON public.saved_recipes(user_id, recipe_id);

-- Helpful sorts/indexes
CREATE INDEX IF NOT EXISTS idx_saved_user_created
  ON public.saved_recipes(user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_saved_user_updated
  ON public.saved_recipes(user_id, updated_at DESC);

-- Enable RLS
ALTER TABLE public.saved_recipes ENABLE ROW LEVEL SECURITY;

-- RLS policies (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='saved_recipes' AND policyname='saved_select_own'
  ) THEN
    CREATE POLICY saved_select_own
      ON public.saved_recipes
      FOR SELECT
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='saved_recipes' AND policyname='saved_insert_self'
  ) THEN
    CREATE POLICY saved_insert_self
      ON public.saved_recipes
      FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='saved_recipes' AND policyname='saved_delete_own'
  ) THEN
    CREATE POLICY saved_delete_own
      ON public.saved_recipes
      FOR DELETE
      USING (auth.uid() = user_id);
  END IF;
END$$;

-- Auto-update updated_at on updates (idempotent)
CREATE OR REPLACE FUNCTION public.tg_set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS set_updated_at_saved ON public.saved_recipes;
CREATE TRIGGER set_updated_at_saved
  BEFORE UPDATE ON public.saved_recipes
  FOR EACH ROW
  EXECUTE FUNCTION public.tg_set_updated_at();

COMMIT;
