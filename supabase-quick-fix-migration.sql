-- ================== EZYUM QUICK FIX MIGRATION ==================
-- This migration adds missing columns and features without recreating existing tables
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
-- ADD MISSING COLUMNS TO EXISTING TABLES
-- ----------------------------------------------------------------

-- Add missing columns to recipes table if they don't exist
ALTER TABLE public.recipes ADD COLUMN IF NOT EXISTS source_type text;
ALTER TABLE public.recipes ADD COLUMN IF NOT EXISTS source text;
ALTER TABLE public.recipes ADD COLUMN IF NOT EXISTS source_id text;
ALTER TABLE public.recipes ADD COLUMN IF NOT EXISTS mealdb_id text;
ALTER TABLE public.recipes ADD COLUMN IF NOT EXISTS total_time_min int;
ALTER TABLE public.recipes ADD COLUMN IF NOT EXISTS ingredients_count int;
ALTER TABLE public.recipes ADD COLUMN IF NOT EXISTS steps_count int;
ALTER TABLE public.recipes ADD COLUMN IF NOT EXISTS has_video boolean;
ALTER TABLE public.recipes ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- Add missing columns to planner_entries (assuming it exists as 'meals' or 'planner_entries')
-- Try both possible table names
DO $$
BEGIN
  -- Check if planner_entries exists, if not check meals
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'planner_entries') THEN
    ALTER TABLE public.planner_entries ADD COLUMN IF NOT EXISTS name_cached text;
    ALTER TABLE public.planner_entries ADD COLUMN IF NOT EXISTS slot text;
    ALTER TABLE public.planner_entries ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();
  ELSIF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'meals') THEN
    ALTER TABLE public.meals ADD COLUMN IF NOT EXISTS name_cached text;
    ALTER TABLE public.meals ADD COLUMN IF NOT EXISTS slot text;
    ALTER TABLE public.meals ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

    -- Rename meals to planner_entries if needed
    ALTER TABLE public.meals RENAME TO planner_entries;
  ELSE
    -- Create planner_entries table if it doesn't exist
    CREATE TABLE public.planner_entries (
      id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id      uuid REFERENCES auth.users(id) ON DELETE CASCADE,
      date         date NOT NULL,
      slot         text NOT NULL CHECK (slot IN ('breakfast', 'lunch', 'dinner', 'snack')),
      recipe_id    uuid REFERENCES public.recipes(id) ON DELETE SET NULL,
      notes        text,
      name_cached  text,
      created_at   timestamptz DEFAULT now(),
      updated_at   timestamptz DEFAULT now()
    );
  END IF;
END $$;

-- ----------------------------------------------------------------
-- CREATE RECIPE_VIEWS TABLE FOR RECOMMENDATIONS
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.recipe_views (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  recipe_id  uuid REFERENCES public.recipes(id) ON DELETE CASCADE,
  viewed_at  timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now()
);

-- ----------------------------------------------------------------
-- CREATE SAVED_RECIPES TABLE
-- ----------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.saved_recipes (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  recipe_id  uuid REFERENCES public.recipes(id) ON DELETE CASCADE,
  note       text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- ----------------------------------------------------------------
-- ADD PERFORMANCE INDEXES
-- ----------------------------------------------------------------

-- Recipe indexes
CREATE INDEX IF NOT EXISTS gin_recipes_name_trgm_plain
  ON public.recipes USING gin (lower(name) gin_trgm_ops);

CREATE INDEX IF NOT EXISTS gin_recipes_ingredients
  ON public.recipes USING gin (ingredients);

CREATE INDEX IF NOT EXISTS idx_recipes_seeds_fast
  ON public.recipes(id)
  WHERE user_id IS NULL AND source_type = 'seed';

-- Planner indexes
CREATE INDEX IF NOT EXISTS idx_planner_user_date_slot
  ON public.planner_entries(user_id, date, slot);

-- Recipe views indexes
CREATE INDEX IF NOT EXISTS idx_recipe_views_user_recent
  ON public.recipe_views(user_id, viewed_at DESC);

-- Saved recipes indexes
CREATE UNIQUE INDEX IF NOT EXISTS ux_saved_user_recipe
  ON public.saved_recipes(user_id, recipe_id);

-- ----------------------------------------------------------------
-- ADD RLS POLICIES
-- ----------------------------------------------------------------

-- Enable RLS on all tables
ALTER TABLE public.recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.planner_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipe_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_recipes ENABLE ROW LEVEL SECURITY;

-- Recipe policies (allow public read for seeds)
CREATE POLICY IF NOT EXISTS recipes_select_all
  ON public.recipes FOR SELECT
  USING (true);

-- Planner policies
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

-- Recipe views policies
CREATE POLICY IF NOT EXISTS views_select_own
  ON public.recipe_views FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS views_insert_own
  ON public.recipe_views FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Saved recipes policies
CREATE POLICY IF NOT EXISTS saved_select_own
  ON public.saved_recipes FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS saved_insert_own
  ON public.saved_recipes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY IF NOT EXISTS saved_delete_own
  ON public.saved_recipes FOR DELETE
  USING (auth.uid() = user_id);

-- ----------------------------------------------------------------
-- ADD TRIGGERS
-- ----------------------------------------------------------------

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

-- Updated_at triggers
DROP TRIGGER IF EXISTS recipes_set_updated_at ON public.recipes;
CREATE TRIGGER recipes_set_updated_at
  BEFORE UPDATE ON public.recipes
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

DROP TRIGGER IF EXISTS planner_set_updated_at ON public.planner_entries;
CREATE TRIGGER planner_set_updated_at
  BEFORE UPDATE ON public.planner_entries
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

DROP TRIGGER IF EXISTS saved_set_updated_at ON public.saved_recipes;
CREATE TRIGGER saved_set_updated_at
  BEFORE UPDATE ON public.saved_recipes
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

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
