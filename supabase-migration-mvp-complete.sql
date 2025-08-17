BEGIN;

-- Extensions
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Reusable updated_at trigger
CREATE OR REPLACE FUNCTION public.tg_set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at := now(); RETURN NEW; END $$;

-- ============ USER SETTINGS (flags for onboarding/pantry/time budget) ============
CREATE TABLE IF NOT EXISTS public.user_settings (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  prefs       jsonb NOT NULL DEFAULT '{}'::jsonb,
  time_budget_minutes int,
  onboarded_at timestamptz,
  pantry_seeded_at timestamptz,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
DO $$BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname='user_settings_select_own' AND tablename='user_settings') THEN
    CREATE POLICY user_settings_select_own  ON public.user_settings FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname='user_settings_upsert_own' AND tablename='user_settings') THEN
    CREATE POLICY user_settings_upsert_own ON public.user_settings FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname='user_settings_update_own' AND tablename='user_settings') THEN
    CREATE POLICY user_settings_update_own ON public.user_settings FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
END$$;
DROP TRIGGER IF EXISTS set_updated_at_user_settings ON public.user_settings;
CREATE TRIGGER set_updated_at_user_settings BEFORE UPDATE ON public.user_settings
FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE INDEX IF NOT EXISTS idx_user_settings_user ON public.user_settings(user_id);

-- ============ RECIPES (ensure columns + indexes exist) ============
-- Add missing columns to existing recipes table
ALTER TABLE public.recipes ADD COLUMN IF NOT EXISTS steps jsonb DEFAULT '[]'::jsonb;
ALTER TABLE public.recipes ADD COLUMN IF NOT EXISTS ingredients_raw jsonb DEFAULT '[]'::jsonb;

-- Ensure all required columns exist
DO $$
BEGIN
  -- Add missing columns if they don't exist
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='recipes' AND column_name='steps') THEN
    ALTER TABLE public.recipes ADD COLUMN steps jsonb DEFAULT '[]'::jsonb;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='recipes' AND column_name='ingredients_raw') THEN
    ALTER TABLE public.recipes ADD COLUMN ingredients_raw jsonb DEFAULT '[]'::jsonb;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='recipes' AND column_name='tags') THEN
    ALTER TABLE public.recipes ADD COLUMN tags text[] DEFAULT '{}';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='recipes' AND column_name='video_url') THEN
    ALTER TABLE public.recipes ADD COLUMN video_url text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='recipes' AND column_name='website_url') THEN
    ALTER TABLE public.recipes ADD COLUMN website_url text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='recipes' AND column_name='cooking_time') THEN
    ALTER TABLE public.recipes ADD COLUMN cooking_time text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='recipes' AND column_name='difficulty') THEN
    ALTER TABLE public.recipes ADD COLUMN difficulty text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='recipes' AND column_name='source_type') THEN
    ALTER TABLE public.recipes ADD COLUMN source_type text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='recipes' AND column_name='mealdb_id') THEN
    ALTER TABLE public.recipes ADD COLUMN mealdb_id text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='recipes' AND column_name='total_time_min') THEN
    ALTER TABLE public.recipes ADD COLUMN total_time_min int;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='recipes' AND column_name='ingredients_count') THEN
    ALTER TABLE public.recipes ADD COLUMN ingredients_count int;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='recipes' AND column_name='steps_count') THEN
    ALTER TABLE public.recipes ADD COLUMN steps_count int;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='recipes' AND column_name='has_video') THEN
    ALTER TABLE public.recipes ADD COLUMN has_video boolean DEFAULT false;
  END IF;
END$$;

-- Ensure RLS is enabled
ALTER TABLE public.recipes ENABLE ROW LEVEL SECURITY;

-- Ensure all policies exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname='recipes_select_all' AND tablename='recipes') THEN
    CREATE POLICY recipes_select_all
      ON public.recipes FOR SELECT USING (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname='recipes_insert_self' AND tablename='recipes') THEN
    CREATE POLICY recipes_insert_self
      ON public.recipes FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname='recipes_update_owned' AND tablename='recipes') THEN
    CREATE POLICY recipes_update_owned
      ON public.recipes FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname='recipes_delete_owned' AND tablename='recipes') THEN
    CREATE POLICY recipes_delete_owned
      ON public.recipes FOR DELETE USING (auth.uid() = user_id);
  END IF;
END$$;

-- Ensure updated_at trigger exists
DROP TRIGGER IF EXISTS set_updated_at ON public.recipes;
CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.recipes
FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- Perf + search indexes (only create if they don't exist)
CREATE INDEX IF NOT EXISTS idx_recipes_user_updated     ON public.recipes(user_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_recipes_source_type_upd  ON public.recipes(source_type, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_recipes_updated_id       ON public.recipes(updated_at DESC, id DESC);
CREATE INDEX IF NOT EXISTS gin_recipes_name_trgm        ON public.recipes USING gin (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS gin_recipes_ingredients      ON public.recipes USING gin (ingredients);
CREATE INDEX IF NOT EXISTS gin_recipes_tags             ON public.recipes USING gin (tags);
CREATE UNIQUE INDEX IF NOT EXISTS uq_recipes_source_source_id ON public.recipes(source, source_id)
  WHERE source IS NOT NULL AND source_id IS NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS uq_recipes_mealdb_id  ON public.recipes(mealdb_id)
  WHERE mealdb_id IS NOT NULL;

-- ============ SAVED RECIPES (ensure exists and has proper indexes) ============
-- Ensure saved_recipes table exists with proper structure
CREATE TABLE IF NOT EXISTS public.saved_recipes (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipe_id  uuid NOT NULL REFERENCES public.recipes(id) ON DELETE CASCADE,
  note       text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (user_id, recipe_id)
);

-- Ensure RLS is enabled
ALTER TABLE public.saved_recipes ENABLE ROW LEVEL SECURITY;

-- Ensure all policies exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname='saved_select_own' AND tablename='saved_recipes') THEN
    CREATE POLICY saved_select_own  ON public.saved_recipes FOR SELECT USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname='saved_insert_self' AND tablename='saved_recipes') THEN
    CREATE POLICY saved_insert_self ON public.saved_recipes FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname='saved_delete_own' AND tablename='saved_recipes') THEN
    CREATE POLICY saved_delete_own  ON public.saved_recipes FOR DELETE USING (auth.uid() = user_id);
  END IF;
END$$;

-- Ensure updated_at trigger exists
DROP TRIGGER IF EXISTS set_updated_at_saved ON public.saved_recipes;
CREATE TRIGGER set_updated_at_saved BEFORE UPDATE ON public.saved_recipes
FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- Ensure all indexes exist
CREATE INDEX IF NOT EXISTS idx_saved_user_updated       ON public.saved_recipes(user_id, updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_saved_user_updated_recipe ON public.saved_recipes(user_id, updated_at DESC, recipe_id);
CREATE INDEX IF NOT EXISTS idx_saved_recipe_id          ON public.saved_recipes(recipe_id);

-- ============ WEEKLY PLANNER ============
CREATE TABLE IF NOT EXISTS public.planner_entries (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_date   date NOT NULL,                         -- calendar date
  meal_slot   text NOT NULL,                         -- breakfast/lunch/dinner/snack
  recipe_id   uuid NOT NULL REFERENCES public.recipes(id) ON DELETE CASCADE,
  source      text,                                  -- 'manual' | 'max_streak' | 'suggested'
  notes       text,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now(),
  UNIQUE (user_id, plan_date, meal_slot)
);
ALTER TABLE public.planner_entries ENABLE ROW LEVEL SECURITY;
DO $$BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname='planner_select_own' AND tablename='planner_entries') THEN
    CREATE POLICY planner_select_own  ON public.planner_entries FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname='planner_insert_self' AND tablename='planner_entries') THEN
    CREATE POLICY planner_insert_self ON public.planner_entries FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname='planner_update_own' AND tablename='planner_entries') THEN
    CREATE POLICY planner_update_own  ON public.planner_entries FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname='planner_delete_own' AND tablename='planner_entries') THEN
    CREATE POLICY planner_delete_own  ON public.planner_entries FOR DELETE USING (auth.uid() = user_id);
  END IF;
END$$;
DROP TRIGGER IF EXISTS set_updated_at_planner ON public.planner_entries;
CREATE TRIGGER set_updated_at_planner BEFORE UPDATE ON public.planner_entries
FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
CREATE INDEX IF NOT EXISTS idx_planner_user_date   ON public.planner_entries(user_id, plan_date);
CREATE INDEX IF NOT EXISTS idx_planner_user_slot   ON public.planner_entries(user_id, plan_date, meal_slot);

-- ============ COMPLETIONS / STATS / AWARDS ============
CREATE TABLE IF NOT EXISTS public.recipe_completions (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipe_id   uuid NOT NULL REFERENCES public.recipes(id) ON DELETE CASCADE,
  completed_at timestamptz NOT NULL DEFAULT now(),
  source      text,   -- 'scheduled' | 'manual'
  notes       text
);
ALTER TABLE public.recipe_completions ENABLE ROW LEVEL SECURITY;
DO $$BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname='rc_select_own' AND tablename='recipe_completions') THEN
    CREATE POLICY rc_select_own  ON public.recipe_completions FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname='rc_insert_self' AND tablename='recipe_completions') THEN
    CREATE POLICY rc_insert_self ON public.recipe_completions FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
END$$;
CREATE INDEX IF NOT EXISTS idx_rc_user_time ON public.recipe_completions(user_id, completed_at DESC);

CREATE TABLE IF NOT EXISTS public.user_stats (
  user_id         uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  points          int  NOT NULL DEFAULT 0,
  current_streak  int  NOT NULL DEFAULT 0,
  longest_streak  int  NOT NULL DEFAULT 0,
  last_cooked_on  date,
  updated_at      timestamptz DEFAULT now()
);
ALTER TABLE public.user_stats ENABLE ROW LEVEL SECURITY;
DO $$BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname='stats_select_own' AND tablename='user_stats') THEN
    CREATE POLICY stats_select_own  ON public.user_stats FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname='stats_upsert_own' AND tablename='user_stats') THEN
    CREATE POLICY stats_upsert_own ON public.user_stats FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname='stats_update_own' AND tablename='user_stats') THEN
    CREATE POLICY stats_update_own ON public.user_stats FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
END$$;

CREATE TABLE IF NOT EXISTS public.user_awards (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  award_key   text NOT NULL,
  earned_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, award_key)
);
ALTER TABLE public.user_awards ENABLE ROW LEVEL SECURITY;
DO $$BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname='awards_select_own' AND tablename='user_awards') THEN
    CREATE POLICY awards_select_own  ON public.user_awards FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname='awards_insert_self' AND tablename='user_awards') THEN
    CREATE POLICY awards_insert_self ON public.user_awards FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
END$$;
CREATE INDEX IF NOT EXISTS idx_awards_user_key ON public.user_awards(user_id, award_key);

-- ============ DISCOVERY VIEW (no expression ordering) ============
CREATE OR REPLACE VIEW public.recipes_discovery AS
SELECT r.*,
       (('x' || substr(md5(r.id::text), 1, 8))::bit(32)::int) AS sort_seed
FROM public.recipes r
WHERE r.user_id IS NULL AND (r.source_type = 'seed' OR r.source_type IS NULL);
GRANT SELECT ON public.recipes_discovery TO anon, authenticated;

-- ============ FIX EXISTING MEALS TABLE REFERENCES ============
-- Create a meals table if it doesn't exist (for backward compatibility)
CREATE TABLE IF NOT EXISTS public.meals (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  date        date NOT NULL,
  meal_type   text NOT NULL,
  recipe_id   uuid REFERENCES public.recipes(id) ON DELETE SET NULL,
  recipe_name text,
  status      text DEFAULT 'planned',
  notes       text,
  created_at  timestamptz DEFAULT now(),
  updated_at  timestamptz DEFAULT now()
);

-- Enable RLS on meals
ALTER TABLE public.meals ENABLE ROW LEVEL SECURITY;

-- Add policies for meals
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname='meals_select_own' AND tablename='meals') THEN
    CREATE POLICY meals_select_own ON public.meals FOR SELECT USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname='meals_insert_self' AND tablename='meals') THEN
    CREATE POLICY meals_insert_self ON public.meals FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname='meals_update_own' AND tablename='meals') THEN
    CREATE POLICY meals_update_own ON public.meals FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname='meals_delete_own' AND tablename='meals') THEN
    CREATE POLICY meals_delete_own ON public.meals FOR DELETE USING (auth.uid() = user_id);
  END IF;
END$$;

-- Add indexes for meals
CREATE INDEX IF NOT EXISTS idx_meals_user_date ON public.meals(user_id, date);
CREATE INDEX IF NOT EXISTS idx_meals_user_type ON public.meals(user_id, meal_type);

-- ============ ADD MISSING COLUMNS TO EXISTING TABLES ============
-- Add missing columns to recipes table that the code expects
DO $$
BEGIN
  -- Add missing columns that the TypeScript code expects
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='recipes' AND column_name='area') THEN
    ALTER TABLE public.recipes ADD COLUMN area text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='recipes' AND column_name='category') THEN
    ALTER TABLE public.recipes ADD COLUMN category text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='recipes' AND column_name='instructions') THEN
    ALTER TABLE public.recipes ADD COLUMN instructions text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='recipes' AND column_name='image') THEN
    ALTER TABLE public.recipes ADD COLUMN image text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='recipes' AND column_name='source') THEN
    ALTER TABLE public.recipes ADD COLUMN source text;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='recipes' AND column_name='source_id') THEN
    ALTER TABLE public.recipes ADD COLUMN source_id text;
  END IF;
END$$;

COMMIT;
