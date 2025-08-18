-- ================== EZYUM UNIFIED FIX MIGRATION ==================
BEGIN;

-- Extensions (safe to re-run)
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Shared updated_at trigger
CREATE OR REPLACE FUNCTION public.tg_set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END $$;

-- ----------------------------------------------------------------
-- RECIPES (base + commonly used columns)
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.recipes (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  name        text NOT NULL,
  ingredients jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);

-- Frequently used/search/sort columns (no-ops if exist)
ALTER TABLE public.recipes ADD COLUMN IF NOT EXISTS category          text;
ALTER TABLE public.recipes ADD COLUMN IF NOT EXISTS area              text;
ALTER TABLE public.recipes ADD COLUMN IF NOT EXISTS instructions      text;
ALTER TABLE public.recipes ADD COLUMN IF NOT EXISTS image             text;
ALTER TABLE public.recipes ADD COLUMN IF NOT EXISTS tags              text[];
ALTER TABLE public.recipes ADD COLUMN IF NOT EXISTS video_url         text;
ALTER TABLE public.recipes ADD COLUMN IF NOT EXISTS website_url       text;
ALTER TABLE public.recipes ADD COLUMN IF NOT EXISTS cooking_time      text;
ALTER TABLE public.recipes ADD COLUMN IF NOT EXISTS difficulty        text;
ALTER TABLE public.recipes ADD COLUMN IF NOT EXISTS source_type       text;   -- 'seed'|'user'|'mealdb'
ALTER TABLE public.recipes ADD COLUMN IF NOT EXISTS source            text;   -- 'csv'|'mealdb'|'api'
ALTER TABLE public.recipes ADD COLUMN IF NOT EXISTS source_id         text;
ALTER TABLE public.recipes ADD COLUMN IF NOT EXISTS mealdb_id         text;
ALTER TABLE public.recipes ADD COLUMN IF NOT EXISTS total_time_min    int;
ALTER TABLE public.recipes ADD COLUMN IF NOT EXISTS ingredients_count int;
ALTER TABLE public.recipes ADD COLUMN IF NOT EXISTS steps_count       int;
ALTER TABLE public.recipes ADD COLUMN IF NOT EXISTS has_video         boolean;

-- RLS
ALTER TABLE public.recipes ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='recipes' AND policyname='recipes_select_all'
  ) THEN
    -- Public can read (if you prefer seeds-only, tighten this)
    CREATE POLICY recipes_select_all
      ON public.recipes FOR SELECT
      USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='recipes' AND policyname='recipes_insert_self'
  ) THEN
    CREATE POLICY recipes_insert_self
      ON public.recipes FOR INSERT
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='recipes' AND policyname='recipes_update_owned'
  ) THEN
    CREATE POLICY recipes_update_owned
      ON public.recipes FOR UPDATE
      USING (auth.uid() = user_id)
      WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname='public' AND tablename='recipes' AND policyname='recipes_delete_owned'
  ) THEN
    CREATE POLICY recipes_delete_owned
      ON public.recipes FOR DELETE
      USING (auth.uid() = user_id);
  END IF;
END $$;

-- Updated_at trigger
DROP TRIGGER IF EXISTS recipes_set_updated_at ON public.recipes;
CREATE TRIGGER recipes_set_updated_at
  BEFORE UPDATE ON public.recipes
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- Dedupe indexes
CREATE UNIQUE INDEX IF NOT EXISTS uq_recipes_source_source_id
  ON public.recipes(source, source_id)
  WHERE source IS NOT NULL AND source_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS uq_recipes_mealdb_id
  ON public.recipes(mealdb_id)
  WHERE mealdb_id IS NOT NULL;

-- Performance indexes
CREATE INDEX IF NOT EXISTS gin_recipes_name_trgm_plain
  ON public.recipes USING gin (lower(name) gin_trgm_ops);

CREATE INDEX IF NOT EXISTS gin_recipes_ingredients
  ON public.recipes USING gin (ingredients);

CREATE INDEX IF NOT EXISTS gin_recipes_tags
  ON public.recipes USING gin (tags);

CREATE INDEX IF NOT EXISTS idx_recipes_source_type_updated
  ON public.recipes(source_type, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_recipes_user_updated
  ON public.recipes(user_id, updated_at DESC);

-- Fast seed index for recommendations
CREATE INDEX IF NOT EXISTS idx_recipes_seeds_fast
  ON public.recipes(id)
  WHERE user_id IS NULL AND source_type = 'seed';

-- ----------------------------------------------------------------
-- SAVED RECIPES (favorites)
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.saved_recipes (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  recipe_id  uuid REFERENCES public.recipes(id) ON DELETE CASCADE,
  note       text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Uniqueness
CREATE UNIQUE INDEX IF NOT EXISTS ux_saved_user_recipe
  ON public.saved_recipes(user_id, recipe_id);

-- Performance
CREATE INDEX IF NOT EXISTS idx_saved_user_created
  ON public.saved_recipes(user_id, created_at DESC);

-- RLS
ALTER TABLE public.saved_recipes ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS saved_select_own
  ON public.saved_recipes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS saved_insert_own
  ON public.saved_recipes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS saved_delete_own
  ON public.saved_recipes FOR DELETE
  USING (auth.uid() = user_id);

-- Updated_at trigger
DROP TRIGGER IF EXISTS saved_set_updated_at ON public.saved_recipes;
CREATE TRIGGER saved_set_updated_at
  BEFORE UPDATE ON public.saved_recipes
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- ----------------------------------------------------------------
-- PLANNER ENTRIES (meal planning)
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.planner_entries (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_date    date NOT NULL,
  slot         text NOT NULL CHECK (slot IN ('breakfast', 'lunch', 'dinner', 'snack')),
  recipe_id    uuid REFERENCES public.recipes(id) ON DELETE SET NULL,
  notes        text,
  name_cached  text, -- Critical: shows recipe name instantly in UI
  created_at   timestamptz DEFAULT now(),
  updated_at   timestamptz DEFAULT now()
);

-- Performance index
CREATE INDEX IF NOT EXISTS idx_planner_user_date_slot
  ON public.planner_entries(user_id, plan_date, slot);

-- RLS
ALTER TABLE public.planner_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS planner_select_own
  ON public.planner_entries FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS planner_insert_own
  ON public.planner_entries FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS planner_update_own
  ON public.planner_entries FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS planner_delete_own
  ON public.planner_entries FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger to fill name_cached from recipes.name
CREATE OR REPLACE FUNCTION public.planner_fill_name()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.recipe_id IS NOT NULL AND NEW.name_cached IS NULL THEN
    SELECT name INTO NEW.name_cached
    FROM public.recipes
    WHERE id = NEW.recipe_id;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS planner_fill_name_trigger ON public.planner_entries;
CREATE TRIGGER planner_fill_name_trigger
  BEFORE INSERT OR UPDATE ON public.planner_entries
  FOR EACH ROW EXECUTE FUNCTION public.planner_fill_name();

-- Updated_at trigger
DROP TRIGGER IF EXISTS planner_set_updated_at ON public.planner_entries;
CREATE TRIGGER planner_set_updated_at
  BEFORE UPDATE ON public.planner_entries
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- ----------------------------------------------------------------
-- RECIPE VIEWS (for recommendation variety)
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.recipe_views (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  recipe_id  uuid REFERENCES public.recipes(id) ON DELETE CASCADE,
  viewed_at  timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- Performance indexes for recommendations
CREATE INDEX IF NOT EXISTS idx_recipe_views_user_recent
  ON public.recipe_views(user_id, viewed_at DESC);

CREATE INDEX IF NOT EXISTS idx_recipe_views_recipe_user
  ON public.recipe_views(recipe_id, user_id);

-- RLS
ALTER TABLE public.recipe_views ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS views_select_own
  ON public.recipe_views FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS views_insert_own
  ON public.recipe_views FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ----------------------------------------------------------------
-- MEALDB SHADOW INSERT RPC
-- ----------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.upsert_mealdb_seed(
  p_mealdb_id text,
  p_name text,
  p_image text DEFAULT NULL,
  p_category text DEFAULT NULL,
  p_area text DEFAULT NULL
) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_recipe_id uuid;
BEGIN
  -- Try to insert, on conflict update
  INSERT INTO public.recipes (
    mealdb_id, name, image, category, area,
    source_type, source, ingredients, tags,
    created_at, updated_at
  ) VALUES (
    p_mealdb_id, p_name, p_image, p_category, p_area,
    'mealdb', 'api', '[]'::jsonb, ARRAY[p_category, p_area],
    now(), now()
  )
  ON CONFLICT (mealdb_id) DO UPDATE SET
    name = EXCLUDED.name,
    image = EXCLUDED.image,
    category = EXCLUDED.category,
    area = EXCLUDED.area,
    updated_at = now()
  RETURNING id INTO v_recipe_id;

  RETURN v_recipe_id;
END $$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION public.upsert_mealdb_seed TO authenticated;

COMMIT;
-- ================= END UNIFIED FIX MIGRATION =====================
