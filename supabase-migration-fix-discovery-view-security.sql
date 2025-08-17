BEGIN;

-- Fix security definer warning on recipes_discovery view
-- Recreate the view with invoker semantics + barrier for better security
CREATE OR REPLACE VIEW public.recipes_discovery
WITH (security_invoker = true, security_barrier = true) AS
SELECT r.*,
       (('x' || substr(md5(r.id::text), 1, 8))::bit(32)::int) AS sort_seed
FROM public.recipes r
WHERE r.user_id IS NULL
  AND (r.source_type = 'seed' OR r.source_type IS NULL);

-- Ensure the roles your API uses can read it
GRANT SELECT ON public.recipes_discovery TO anon, authenticated;

COMMIT;
