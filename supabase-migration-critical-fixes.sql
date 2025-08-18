-- ============================================
-- EZYUM: CRITICAL FIXES MIGRATION
-- Run this to fix the main issues identified
-- Safe to re-run (idempotent)
-- ============================================

BEGIN;

-- Extensions
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- ========== 1. PLANNER ENTRIES FIXES ==========
-- Ensure planner_entries has name_cached and proper structure
CREATE TABLE IF NOT EXISTS public.planner_entries (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipe_id  uuid NULL REFERENCES public.recipes(id) ON DELETE SET NULL,
  date       date NOT NULL,
  slot       text NOT NULL,        -- Breakfast/Lunch/Dinner/Snack
  notes      text,
  name_cached text,                -- Cached name for instant UI display
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Add missing columns if they don't exist
ALTER TABLE public.planner_entries
  ADD COLUMN IF NOT EXISTS name_cached text,
  ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- Ensure proper indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_planner_user_date ON public.planner_entries(user_id, date DESC);
CREATE INDEX IF NOT EXISTS idx_planner_user_slot ON public.planner_entries(user_id, date DESC, slot);
CREATE INDEX IF NOT EXISTS idx_planner_recipe_id ON public.planner_entries(recipe_id);

-- RLS policies
ALTER TABLE public.planner_entries ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='planner_entries' AND policyname='planner_select_own') THEN
    CREATE POLICY planner_select_own ON public.planner_entries FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='planner_entries' AND policyname='planner_insert_self') THEN
    CREATE POLICY planner_insert_self ON public.planner_entries FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='planner_entries' AND policyname='planner_update_own') THEN
    CREATE POLICY planner_update_own ON public.planner_entries FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='planner_entries' AND policyname='planner_delete_own') THEN
    CREATE POLICY planner_delete_own ON public.planner_entries FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;

-- ========== 2. UPDATED_AT TRIGGERS ==========
-- Reusable trigger function
CREATE OR REPLACE FUNCTION public.tg_set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END $$;

-- Apply updated_at trigger to planner_entries
DROP TRIGGER IF EXISTS set_updated_at_planner ON public.planner_entries;
CREATE TRIGGER set_updated_at_planner
  BEFORE UPDATE ON public.planner_entries
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- ========== 3. NAME_CACHED AUTO-FILL TRIGGER ==========
-- Function to automatically fill name_cached from recipes
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

-- Apply the trigger
DROP TRIGGER IF EXISTS fill_name_cached_planner ON public.planner_entries;
CREATE TRIGGER fill_name_cached_planner
  BEFORE INSERT OR UPDATE ON public.planner_entries
  FOR EACH ROW EXECUTE FUNCTION public.tg_planner_fill_name_cached();

-- ========== 4. BACKFILL EXISTING PLANNER ENTRIES ==========
-- Fill name_cached for existing entries that don't have it
UPDATE public.planner_entries p
SET name_cached = r.name
FROM public.recipes r
WHERE p.recipe_id = r.id AND (p.name_cached IS NULL OR btrim(p.name_cached)='');

-- ========== 5. CRITICAL PERFORMANCE INDEXES ==========
-- Fast discovery queries (WHERE user_id IS NULL AND source_type = 'seed')
CREATE INDEX IF NOT EXISTS idx_recipes_discovery_base
  ON public.recipes(user_id, source_type, updated_at DESC)
  WHERE user_id IS NULL AND (source_type = 'seed' OR source_type IS NULL);

-- Fast sort_seed ordering for discovery
CREATE INDEX IF NOT EXISTS idx_recipes_id_for_sort_seed
  ON public.recipes(id)
  WHERE user_id IS NULL AND (source_type = 'seed' OR source_type IS NULL);

-- Cover index for saved recipes JOINs
CREATE INDEX IF NOT EXISTS idx_saved_user_updated_recipe
  ON public.saved_recipes(user_id, updated_at DESC, recipe_id);

-- Fast text search
CREATE INDEX IF NOT EXISTS gin_recipes_name_trgm_direct
  ON public.recipes USING gin (name gin_trgm_ops);

-- ========== 6. ENSURE RECIPES HAS UPDATED_AT ==========
-- Add updated_at to recipes if missing
ALTER TABLE public.recipes ADD COLUMN IF NOT EXISTS updated_at timestamptz DEFAULT now();

-- Apply updated_at trigger to recipes
DROP TRIGGER IF EXISTS set_updated_at ON public.recipes;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.recipes
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- ========== 7. FAST SEED INDEX ==========
-- Optional but recommended for discovery performance
CREATE INDEX IF NOT EXISTS idx_recipes_seeds_fast
  ON public.recipes(id)
  WHERE user_id IS NULL AND source_type = 'seed';

COMMIT;
