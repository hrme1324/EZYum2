BEGIN;

-- Reusable trigger function (safe to redefine)
CREATE OR REPLACE FUNCTION public.tg_set_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at := now();
  RETURN NEW;
END $$;

-- Helper to check column existence
CREATE OR REPLACE FUNCTION public.has_column(p_table regclass, p_col text)
RETURNS boolean LANGUAGE sql STABLE AS $$
  SELECT EXISTS (
    SELECT 1
    FROM pg_attribute
    WHERE attrelid = p_table
      AND attname  = p_col
      AND NOT attisdropped
  );
$$;

-- ========== recipes ==========
DO $$
BEGIN
  IF to_regclass('public.recipes') IS NOT NULL THEN
    IF NOT public.has_column('public.recipes','updated_at') THEN
      ALTER TABLE public.recipes
        ADD COLUMN updated_at timestamptz DEFAULT now();
    END IF;

    -- ensure trigger
    DROP TRIGGER IF EXISTS set_updated_at ON public.recipes;
    CREATE TRIGGER set_updated_at
      BEFORE UPDATE ON public.recipes
      FOR EACH ROW
      EXECUTE FUNCTION public.tg_set_updated_at();

    -- updated_at index used by your feed queries
    CREATE INDEX IF NOT EXISTS idx_recipes_source_type_updated
      ON public.recipes(source_type, updated_at DESC);

    -- (optional but commonly used)
    CREATE INDEX IF NOT EXISTS idx_recipes_user_updated
      ON public.recipes(user_id, updated_at DESC);
  END IF;
END$$;

-- ========== saved_recipes ==========
DO $$
BEGIN
  IF to_regclass('public.saved_recipes') IS NOT NULL THEN
    IF NOT public.has_column('public.saved_recipes','updated_at') THEN
      ALTER TABLE public.saved_recipes
        ADD COLUMN updated_at timestamptz DEFAULT now();
    END IF;

    DROP TRIGGER IF EXISTS set_updated_at_saved ON public.saved_recipes;
    CREATE TRIGGER set_updated_at_saved
      BEFORE UPDATE ON public.saved_recipes
      FOR EACH ROW
      EXECUTE FUNCTION public.tg_set_updated_at();

    CREATE INDEX IF NOT EXISTS idx_saved_user_updated
      ON public.saved_recipes(user_id, updated_at DESC);
  END IF;
END$$;

-- ========== pantry_items ==========
DO $$
BEGIN
  IF to_regclass('public.pantry_items') IS NOT NULL THEN
    IF NOT public.has_column('public.pantry_items','updated_at') THEN
      ALTER TABLE public.pantry_items
        ADD COLUMN updated_at timestamptz DEFAULT now();
    END IF;

    DROP TRIGGER IF EXISTS set_updated_at_pantry ON public.pantry_items;
    CREATE TRIGGER set_updated_at_pantry
      BEFORE UPDATE ON public.pantry_items
      FOR EACH ROW
      EXECUTE FUNCTION public.tg_set_updated_at();

    CREATE INDEX IF NOT EXISTS idx_pantry_user_updated
      ON public.pantry_items(user_id, updated_at DESC);
  END IF;
END$$;

-- ========== grocery_lists ==========
DO $$
BEGIN
  IF to_regclass('public.grocery_lists') IS NOT NULL THEN
    IF NOT public.has_column('public.grocery_lists','updated_at') THEN
      ALTER TABLE public.grocery_lists
        ADD COLUMN updated_at timestamptz DEFAULT now();
    END IF;

    DROP TRIGGER IF EXISTS set_updated_at_grocery ON public.grocery_lists;
    CREATE TRIGGER set_updated_at_grocery
      BEFORE UPDATE ON public.grocery_lists
      FOR EACH ROW
      EXECUTE FUNCTION public.tg_set_updated_at();

    CREATE INDEX IF NOT EXISTS idx_grocery_user_updated
      ON public.grocery_lists(user_id, updated_at DESC);
  END IF;
END$$;

COMMIT;
