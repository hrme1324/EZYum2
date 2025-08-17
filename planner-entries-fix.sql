BEGIN;

-- Extensions
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 1) Ensure planner_entries exists (minimal)
CREATE TABLE IF NOT EXISTS public.planner_entries (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipe_id  uuid NULL REFERENCES public.recipes(id) ON DELETE SET NULL,
  date       date NOT NULL,
  slot       text NOT NULL,        -- Breakfast/Lunch/Dinner/Snack
  notes      text,
  -- cached name so UI doesn't need a join
  name_cached text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 2) Add any missing columns (no-ops if present)
ALTER TABLE public.planner_entries
  ADD COLUMN IF NOT EXISTS recipe_id  uuid,
  ADD COLUMN IF NOT EXISTS date       date,
  ADD COLUMN IF NOT EXISTS slot       text,
  ADD COLUMN IF NOT EXISTS notes      text,
  ADD COLUMN IF NOT EXISTS name_cached text,
  ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- 3) Ensure FK to recipes
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE table_schema='public' AND table_name='planner_entries'
      AND constraint_type='FOREIGN KEY'
  ) THEN
    ALTER TABLE public.planner_entries
      ADD CONSTRAINT planner_entries_recipe_id_fkey
      FOREIGN KEY (recipe_id) REFERENCES public.recipes(id) ON DELETE SET NULL;
  END IF;
END $$;

-- 4) Indexes
CREATE INDEX IF NOT EXISTS idx_planner_user_date    ON public.planner_entries(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_planner_user_slot    ON public.planner_entries(user_id, date DESC, slot);
CREATE INDEX IF NOT EXISTS idx_planner_recipe_id    ON public.planner_entries(recipe_id);

-- 5) RLS
ALTER TABLE public.planner_entries ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='planner_entries' AND policyname='planner_select_own'
  ) THEN
    CREATE POLICY planner_select_own
      ON public.planner_entries FOR SELECT
      USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='planner_entries' AND policyname='planner_insert_self'
  ) THEN
    CREATE POLICY planner_insert_self
      ON public.planner_entries FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='planner_entries' AND policyname='planner_update_own'
  ) THEN
    CREATE POLICY planner_update_own
      ON public.planner_entries FOR UPDATE
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='planner_entries' AND policyname='planner_delete_own'
  ) THEN
    CREATE POLICY planner_delete_own
      ON public.planner_entries FOR DELETE
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- 6) Auto-touch updated_at
CREATE OR REPLACE FUNCTION public.tg_set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS set_updated_at_planner ON public.planner_entries;
CREATE TRIGGER set_updated_at_planner
  BEFORE UPDATE ON public.planner_entries
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- 7) Fill name_cached automatically from recipes on insert/update
CREATE OR REPLACE FUNCTION public.tg_planner_fill_name_cached()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.name_cached IS NULL OR btrim(NEW.name_cached) = '' THEN
    IF NEW.recipe_id IS NOT NULL THEN
      SELECT r.name INTO NEW.name_cached FROM public.recipes r WHERE r.id = NEW.recipe_id;
    END IF;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS fill_name_cached_planner ON public.planner_entries;
CREATE TRIGGER fill_name_cached_planner
  BEFORE INSERT OR UPDATE ON public.planner_entries
  FOR EACH ROW EXECUTE FUNCTION public.tg_planner_fill_name_cached();

-- 8) Backfill existing rows
UPDATE public.planner_entries p
SET name_cached = r.name
FROM public.recipes r
WHERE p.recipe_id = r.id AND (p.name_cached IS NULL OR btrim(p.name_cached)='');

COMMIT;
