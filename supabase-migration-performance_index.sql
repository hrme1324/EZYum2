-- ============================================
-- EZYUM / PANTRII: Performance Indexes
-- Safe to re-run (idempotent)
-- ============================================

BEGIN;

-- 1) Saved → Recipes cover index for "My Recipes" page
--    Supports: WHERE user_id = $1 ORDER BY updated_at DESC LIMIT N
--    and joins to recipes via recipe_id efficiently.
CREATE INDEX IF NOT EXISTS idx_saved_user_updated_recipe
  ON public.saved_recipes(user_id, updated_at DESC, recipe_id);

-- 2) Tie-break friendly feed index (optional but nice)
--    If you also do ORDER BY updated_at DESC, id DESC on recipes:
CREATE INDEX IF NOT EXISTS idx_recipes_updated_id
  ON public.recipes(updated_at DESC, id DESC);

-- 3) If you search by ILIKE without lower(), give Postgres a direct trigram on name:
--    (Keep your lower(name) index if some code uses lower(name) LIKE ...)
CREATE INDEX IF NOT EXISTS gin_recipes_name_trgm_direct
  ON public.recipes USING gin (name gin_trgm_ops);

-- 4) Make sure foreign keys used in joins are indexed (cheap safety nets)
CREATE INDEX IF NOT EXISTS idx_saved_recipe_id ON public.saved_recipes(recipe_id);
CREATE INDEX IF NOT EXISTS idx_pantry_user ON public.pantry_items(user_id);
CREATE INDEX IF NOT EXISTS idx_grocery_user ON public.grocery_lists(user_id);

-- 5) Discovery view optimization indexes
--    Fast filtering for discovery view (WHERE user_id IS NULL AND source_type = 'seed')
CREATE INDEX IF NOT EXISTS idx_recipes_discovery_base
  ON public.recipes(user_id, source_type, updated_at DESC)
  WHERE user_id IS NULL AND (source_type = 'seed' OR source_type IS NULL);

--    Fast sort_seed ordering (since sort_seed is derived from id)
CREATE INDEX IF NOT EXISTS idx_recipes_id_for_sort_seed
  ON public.recipes(id)
  WHERE user_id IS NULL AND (source_type = 'seed' OR source_type IS NULL);

-- 6) Composite index for source_type + category filtering
CREATE INDEX IF NOT EXISTS idx_recipes_source_category
  ON public.recipes(source_type, category, updated_at DESC);

-- 7) Composite index for user recipes with filtering
CREATE INDEX IF NOT EXISTS idx_recipes_user_category
  ON public.recipes(user_id, category, updated_at DESC);

COMMIT;
