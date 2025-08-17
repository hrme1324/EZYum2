-- ============================================
-- EZYUM: Stats, Awards, Streaks Migration
-- Safe to re-run (idempotent)
-- ============================================

BEGIN;

-- Tables (create if missing)
CREATE TABLE IF NOT EXISTS public.recipe_completions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipe_id uuid NOT NULL REFERENCES public.recipes(id) ON DELETE CASCADE,
  completed_at timestamptz NOT NULL DEFAULT now(),
  source text,
  notes text
);
ALTER TABLE public.recipe_completions ENABLE ROW LEVEL SECURITY;
DO $$BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='recipe_completions' AND policyname='rc_select_own') THEN
    CREATE POLICY rc_select_own ON public.recipe_completions FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='recipe_completions' AND policyname='rc_insert_self') THEN
    CREATE POLICY rc_insert_self ON public.recipe_completions FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
END$$;

CREATE INDEX IF NOT EXISTS idx_rc_user_time ON public.recipe_completions(user_id, completed_at DESC);

CREATE TABLE IF NOT EXISTS public.user_stats (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  points int NOT NULL DEFAULT 0,
  current_streak int NOT NULL DEFAULT 0,
  longest_streak int NOT NULL DEFAULT 0,
  last_cooked_on date,
  updated_at timestamptz DEFAULT now()
);
ALTER TABLE public.user_stats ENABLE ROW LEVEL SECURITY;
DO $$BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='user_stats' AND policyname='stats_select_own') THEN
    CREATE POLICY stats_select_own ON public.user_stats FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='user_stats' AND policyname='stats_upsert_own') THEN
    CREATE POLICY stats_upsert_own ON public.user_stats FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='user_stats' AND policyname='stats_update_own') THEN
    CREATE POLICY stats_update_own ON public.user_stats FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
  END IF;
END$$;

CREATE TABLE IF NOT EXISTS public.user_awards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  award_key text NOT NULL,
  earned_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, award_key)
);
ALTER TABLE public.user_awards ENABLE ROW LEVEL SECURITY;
DO $$BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='user_awards' AND policyname='awards_select_own') THEN
    CREATE POLICY awards_select_own ON public.user_awards FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename='user_awards' AND policyname='awards_insert_self') THEN
    CREATE POLICY awards_insert_self ON public.user_awards FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
END$$;

-- Core computation (server-side; safe, fast)
CREATE OR REPLACE FUNCTION public.compute_user_stats_and_awards(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE v_meals int; v_days int; v_last date; v_current int; v_longest int; v_points int;
BEGIN
  -- Distinct completion dates (UTC date is fine for MVP)
  WITH days AS (
    SELECT DISTINCT (completed_at AT TIME ZONE 'UTC')::date d
    FROM public.recipe_completions
    WHERE user_id = p_user_id
  ),
  seq AS (
    SELECT d, d - row_number() OVER (ORDER BY d) AS grp FROM days
  ),
  groups AS (
    SELECT grp, min(d) start_d, max(d) end_d, count(*) len FROM seq GROUP BY grp
  ),
  agg AS (
    SELECT
      (SELECT count(*) FROM public.recipe_completions WHERE user_id=p_user_id) AS meals,
      (SELECT count(*) FROM days) AS days_count,
      (SELECT max(d) FROM days) AS last_d,
      COALESCE((SELECT len FROM groups g WHERE g.end_d = (SELECT max(d) FROM days)), 0) AS curr_streak,
      COALESCE((SELECT max(len) FROM groups), 0) AS longest_streak
  )
  SELECT meals, days_count, last_d, curr_streak, longest_streak
  INTO v_meals, v_days, v_last, v_current, v_longest
  FROM agg;

  -- Points rule (MVP): 10 per meal + small streak bonus
  v_points := COALESCE(v_meals,0)*10 + GREATEST(v_current-1,0)*2 + GREATEST(v_longest-3,0);

  -- Upsert stats
  INSERT INTO public.user_stats (user_id, points, current_streak, longest_streak, last_cooked_on, updated_at)
  VALUES (p_user_id, COALESCE(v_points,0), COALESCE(v_current,0), COALESCE(v_longest,0), v_last, now())
  ON CONFLICT (user_id) DO UPDATE
    SET points=EXCLUDED.points,
        current_streak=EXCLUDED.current_streak,
        longest_streak=EXCLUDED.longest_streak,
        last_cooked_on=EXCLUDED.last_cooked_on,
        updated_at=now();

  -- Awards (insert if thresholds met)
  IF COALESCE(v_meals,0) >= 1 THEN
    INSERT INTO public.user_awards(user_id, award_key) VALUES (p_user_id,'first_meal') ON CONFLICT DO NOTHING;
  END IF;
  IF COALESCE(v_meals,0) >= 5 THEN
    INSERT INTO public.user_awards(user_id, award_key) VALUES (p_user_id,'five_meals') ON CONFLICT DO NOTHING;
  END IF;
  IF COALESCE(v_meals,0) >= 10 THEN
    INSERT INTO public.user_awards(user_id, award_key) VALUES (p_user_id,'ten_meals') ON CONFLICT DO NOTHING;
  END IF;
  IF COALESCE(v_current,0) >= 3 THEN
    INSERT INTO public.user_awards(user_id, award_key) VALUES (p_user_id,'streak_3') ON CONFLICT DO NOTHING;
  END IF;
  IF COALESCE(v_longest,0) >= 7 THEN
    INSERT INTO public.user_awards(user_id, award_key) VALUES (p_user_id,'streak_7') ON CONFLICT DO NOTHING;
  END IF;
END;
$$;

-- Trigger after a completion to recompute automatically
CREATE OR REPLACE FUNCTION public.tg_after_completion_update_stats()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  PERFORM public.compute_user_stats_and_awards(NEW.user_id);
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS after_completion_update_stats ON public.recipe_completions;
CREATE TRIGGER after_completion_update_stats
AFTER INSERT ON public.recipe_completions
FOR EACH ROW EXECUTE FUNCTION public.tg_after_completion_update_stats();

-- Optional: RPC for client to recompute their own stats on demand
CREATE OR REPLACE FUNCTION public.recompute_my_stats()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE v_uid uuid;
BEGIN
  v_uid := NULLIF(current_setting('request.jwt.claim.sub', true),'')::uuid;
  IF v_uid IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  PERFORM public.compute_user_stats_and_awards(v_uid);
END;
$$;

COMMIT;
