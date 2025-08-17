-- ============================================
-- EZYUM / PANTRII: Unified seed import + RLS + helpers
-- Safe to re-run (idempotent)
-- ============================================

begin;

-- ---------- 0) Extensions ----------
create extension if not exists pgcrypto;

-- ---------- 1) Core table: public.recipes ----------
-- Minimal base (won't overwrite your existing columns)
create table if not exists public.recipes (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users(id) on delete cascade,
  name        text not null,
  ingredients jsonb not null default '[]'::jsonb,
  created_at  timestamptz default now(),
  updated_at  timestamptz default now()
);

-- Ensure all columns referenced by importers exist
alter table public.recipes add column if not exists category            text;
alter table public.recipes add column if not exists area                text;
alter table public.recipes add column if not exists instructions        text;
alter table public.recipes add column if not exists image               text;
alter table public.recipes add column if not exists tags                text[];     -- array of text tags
alter table public.recipes add column if not exists video_url           text;
alter table public.recipes add column if not exists website_url         text;
alter table public.recipes add column if not exists cooking_time        text;
alter table public.recipes add column if not exists difficulty          text;
alter table public.recipes add column if not exists source_type         text;
alter table public.recipes add column if not exists source              text;
alter table public.recipes add column if not exists source_id           text;
alter table public.recipes add column if not exists mealdb_id           text;
alter table public.recipes add column if not exists total_time_min      int;
alter table public.recipes add column if not exists ingredients_count   int;
alter table public.recipes add column if not exists steps_count         int;
alter table public.recipes add column if not exists has_video           boolean;

-- Helpful index for user lookups
create index if not exists idx_recipes_user_id on public.recipes(user_id);

-- ---------- 2) RLS ----------
alter table public.recipes enable row level security;

-- Policies (guarded)
do $$
begin
  -- NOTE: This allows public SELECT of ALL recipes.
  if not exists (
    select 1 from pg_policies
    where schemaname='public' and tablename='recipes'
      and policyname='recipes_select_all'
  ) then
    create policy recipes_select_all
      on public.recipes
      for select
      using (true);
  end if;

  -- Public SELECT for seed recipes (redundant if the ALL policy exists)
  if not exists (
    select 1 from pg_policies
    where schemaname='public' and tablename='recipes'
      and policyname='recipes_select_seeds'
  ) then
    create policy recipes_select_seeds
      on public.recipes
      for select
      using (source_type = 'seed' and user_id is null);
  end if;

  -- Insert: only allow inserting rows owned by the user
  if not exists (
    select 1 from pg_policies
    where schemaname='public' and tablename='recipes'
      and policyname='recipes_insert_self'
  ) then
    create policy recipes_insert_self
      on public.recipes
      for insert
      with check (auth.uid() = user_id);
  end if;

  -- Update: only owner
  if not exists (
    select 1 from pg_policies
    where schemaname='public' and tablename='recipes'
      and policyname='recipes_update_owned'
  ) then
    create policy recipes_update_owned
      on public.recipes
      for update
      using (auth.uid() = user_id)
      with check (auth.uid() = user_id);
  end if;

  -- Delete: only owner
  if not exists (
    select 1 from pg_policies
    where schemaname='public' and tablename='recipes'
      and policyname='recipes_delete_owned'
  ) then
    create policy recipes_delete_owned
      on public.recipes
      for delete
      using (auth.uid() = user_id);
  end if;
end $$;

-- ---------- 3) Uniqueness for dedupe ----------
create unique index if not exists uq_recipes_source_source_id
  on public.recipes(source, source_id)
  where source is not null and source_id is not null;

create unique index if not exists uq_recipes_mealdb_id
  on public.recipes(mealdb_id)
  where mealdb_id is not null;

-- ---------- 4) Staging tables ----------
-- Flexible staging
create table if not exists public.staging_recipes (
  id bigserial primary key,
  name               text,
  instructions       text,
  category           text,
  area               text,
  image              text,
  tags_raw           text,        -- e.g. "Quick, Vegan"
  ingredients_json   text,        -- JSON array string: ["2 eggs","1 cup flour"] OR [{"name":"Egg","measure":"2"}]
  video_url          text,
  website_url        text,
  cooking_time       text,
  difficulty         text,
  source             text,        -- e.g. 'csv'
  source_id          text,        -- external id if any
  mealdb_id          text,        -- MealDB id if any
  total_time_min     int,
  ingredients_count  int,
  steps_count        int,
  has_video          boolean,
  imported_at        timestamptz default now()
);

-- CSV-shaped staging
create table if not exists public.staging_recipes_csv (
  id               text,
  name             text,
  description      text,
  ingredients      text,  -- JSON array string
  ingredients_raw  text,  -- JSON array string (preferred if present)
  steps            text,  -- JSON array string
  servings         text,
  serving_size     text,
  tags             text   -- JSON array string
);

-- ---------- 5) Helper function(s) ----------
create or replace function public.try_jsonb(p text)
returns jsonb
language plpgsql
immutable
as $$
begin
  return p::jsonb;
exception when others then
  return null;
end;
$$;

-- ---------- 6) Importers ----------
-- 6A) Staging -> recipes (strongest dedupe via MealDB; else by (source, source_id))
create or replace function public.finish_recipe_seed_import()
returns table(inserted int, updated int)
language plpgsql as $$
declare v_ins int:=0; v_upd int:=0;
begin
  -- A) Upsert by MealDB id
  with src as (
    select
      name, category, area, instructions, image, video_url, website_url,
      cooking_time, difficulty, mealdb_id, source, source_id,
      case when nullif(trim(tags_raw),'') is not null
        then regexp_split_to_array(tags_raw, '\s*[,;|]\s*') else null end as tags_arr,
      case when coalesce(ingredients_json,'')='' then '[]'::jsonb else ingredients_json::jsonb end as ingredients_j,
      total_time_min, ingredients_count, steps_count, has_video
    from public.staging_recipes s
    where mealdb_id is not null and trim(mealdb_id) <> ''
  ),
  up1 as (
    insert into public.recipes as r (
      user_id, name, category, area, instructions, image, tags, ingredients,
      video_url, website_url, cooking_time, difficulty,
      source_type, source, source_id, mealdb_id,
      total_time_min, ingredients_count, steps_count, has_video, updated_at
    )
    select
      null, name, category, area, instructions, image, tags_arr, ingredients_j,
      video_url, website_url, cooking_time, difficulty,
      'seed', source, source_id, mealdb_id,
      total_time_min, ingredients_count, steps_count, has_video, now()
    from src
    on conflict (mealdb_id) do update set
      name=excluded.name, category=excluded.category, area=excluded.area,
      instructions=excluded.instructions, image=excluded.image, tags=excluded.tags,
      ingredients=excluded.ingredients, video_url=excluded.video_url, website_url=excluded.website_url,
      cooking_time=excluded.cooking_time, difficulty=excluded.difficulty,
      source_type=excluded.source_type, source=excluded.source, source_id=excluded.source_id,
      total_time_min=excluded.total_time_min, ingredients_count=excluded.ingredients_count,
      steps_count=excluded.steps_count, has_video=excluded.has_video, updated_at=now()
    returning (xmax=0)::int as ins
  )
  select coalesce(sum(case when ins=1 then 1 else 0 end),0),
         coalesce(sum(case when ins=0 then 1 else 0 end),0)
  into v_ins, v_upd from up1;

  -- B) Upsert by (source, source_id) where no MealDB id
  with src as (
    select
      name, category, area, instructions, image, video_url, website_url,
      cooking_time, difficulty, source, source_id,
      case when nullif(trim(tags_raw),'') is not null
        then regexp_split_to_array(tags_raw, '\s*[,;|]\s*') else null end as tags_arr,
      case when coalesce(ingredients_json,'')='' then '[]'::jsonb else ingredients_json::jsonb end as ingredients_j,
      total_time_min, ingredients_count, steps_count, has_video
    from public.staging_recipes s
    where (mealdb_id is null or trim(mealdb_id)='')
      and source is not null and trim(source)<>'' and source_id is not null and trim(source_id)<>''
  ),
  up2 as (
    insert into public.recipes as r (
      user_id, name, category, area, instructions, image, tags, ingredients,
      video_url, website_url, cooking_time, difficulty,
      source_type, source, source_id,
      total_time_min, ingredients_count, steps_count, has_video, updated_at
    )
    select
      null, name, category, area, instructions, image, tags_arr, ingredients_j,
      video_url, website_url, cooking_time, difficulty,
      'seed', source, source_id,
      total_time_min, ingredients_count, steps_count, has_video, now()
    from src
    on conflict (source, source_id) where source is not null and source_id is not null do update set
      name=excluded.name, category=excluded.category, area=excluded.area,
      instructions=excluded.instructions, image=excluded.image, tags=excluded.tags,
      ingredients=excluded.ingredients, video_url=excluded.video_url,
      website_url=excluded.website_url, cooking_time=excluded.cooking_time,
      difficulty=excluded.difficulty, total_time_min=excluded.total_time_min,
      ingredients_count=excluded.ingredients_count, steps_count=excluded.steps_count,
      has_video=excluded.has_video, updated_at=now()
    returning (xmax=0)::int as ins
  )
  select v_ins + coalesce(sum(case when ins=1 then 1 else 0 end),0),
         v_upd + coalesce(sum(case when ins=0 then 1 else 0 end),0)
  into v_ins, v_upd from up2;

  return query select v_ins as inserted, v_upd as updated;
end;
$$;

-- 6B) CSV (easy-only) importer with robust JSON handling + dedupe by source_id
create or replace function public.finish_recipe_seed_import_csv_easy()
returns table(inserted int, updated int)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare v_ins int:=0; v_upd int:=0;
begin
  with base as (
    select s.*
    from public.staging_recipes_csv s
    where nullif(btrim(s.name),'') is not null
  ),
  only_easy as (
    select b.*
    from base b
    where
      (
        b.tags is not null
        and btrim(b.tags) <> ''
        and jsonb_typeof(try_jsonb(b.tags)) = 'array'
        and exists (
          select 1 from jsonb_array_elements_text(try_jsonb(b.tags)) t(tag)
          where tag ilike '%easy%'
             or tag ilike '%beginner-cook%'
             or tag ilike '%15-minutes-or-less%'
             or tag ilike '%30-minutes-or-less%'
        )
      )
      or (
        (b.steps is not null and btrim(b.steps) <> ''
         and jsonb_typeof(try_jsonb(b.steps)) = 'array'
         and jsonb_array_length(try_jsonb(b.steps)) <= 8)
        or
        (
          jsonb_array_length(
            coalesce(
              case when jsonb_typeof(try_jsonb(b.ingredients_raw)) = 'array'
                   then try_jsonb(b.ingredients_raw) end,
              case when jsonb_typeof(try_jsonb(b.ingredients)) = 'array'
                   then try_jsonb(b.ingredients) end,
              '[]'::jsonb
            )
          ) <= 12
        )
      )
  ),

  src_raw as (
    select
      e.id as source_id,
      nullif(btrim(e.name),'') as name,
      e.description,
      case
        when jsonb_typeof(try_jsonb(e.steps)) = 'array'
          then array_to_string( array(select jsonb_array_elements_text(try_jsonb(e.steps))), E'\n' )
        else null
      end as instructions_from_steps,
      coalesce(
        case when jsonb_typeof(try_jsonb(e.ingredients_raw))='array' then try_jsonb(e.ingredients_raw) end,
        case when jsonb_typeof(try_jsonb(e.ingredients))='array'     then try_jsonb(e.ingredients) end,
        '[]'::jsonb
      ) as ingredients_j,
      case
        when jsonb_typeof(try_jsonb(e.tags))='array'
          then (select array_agg(x) from jsonb_array_elements_text(try_jsonb(e.tags)) t(x))
        else null
      end as tags_arr,
      row_number() over (
        partition by e.id
        order by
          (case when e.description is not null and btrim(e.description)<>'' then 1 else 0 end) desc,
          (case when jsonb_typeof(try_jsonb(e.steps))='array' then jsonb_array_length(try_jsonb(e.steps)) else 0 end) desc,
          name asc
      ) as rn
    from only_easy e
  ),

  src as (
    select * from src_raw where rn = 1
  ),

  upsert as (
    insert into public.recipes as r (
      user_id, name, category, area, instructions, image, tags, ingredients,
      video_url, website_url, cooking_time, difficulty,
      source_type, source, source_id, mealdb_id,
      total_time_min, ingredients_count, steps_count, has_video, updated_at
    )
    select
      null,
      s.name,
      null, null,
      btrim(concat_ws(E'\n\n', s.instructions_from_steps,
        case when s.description is not null and btrim(s.description)<>'' then 'Notes: '||s.description end)),
      null,
      s.tags_arr,
      s.ingredients_j,
      null, null, null, null,
      'seed', 'csv', s.source_id, null,
      null, null, null, null, now()
    from src s
    on conflict (source, source_id) where source is not null and source_id is not null
    do update set
      name         = excluded.name,
      instructions = excluded.instructions,
      tags         = excluded.tags,
      ingredients  = excluded.ingredients,
      updated_at   = now()
    returning (xmax=0)::int as ins
  )
  select
    coalesce(sum(case when ins=1 then 1 else 0 end),0),
    coalesce(sum(case when ins=0 then 1 else 0 end),0)
  into v_ins, v_upd
  from upsert;

  return query select v_ins as inserted, v_upd as updated;
end;
$$;

-- ---------- 7) Updated_at trigger ----------
create or replace function public.tg_set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end $$;

drop trigger if exists set_updated_at on public.recipes;
create trigger set_updated_at
  before update on public.recipes
  for each row execute function public.tg_set_updated_at();

-- ---------- 8) Post-import normalization helpers ----------
-- (A) Normalize CSV seed ingredients into [{name, measure}] objects
update public.recipes r
set ingredients = sub.obj_array
from (
  select id,
         jsonb_agg(
           jsonb_build_object(
             'name',
               nullif(
                 btrim(
                   regexp_replace(val, '^\s*[0-9¼½¾⅓⅔⅛⅜⅝⅞/ .()\-]+', '')
                 ),
                 ''
               ),
             'measure',
               nullif(
                 btrim(
                   substring(val from '^\s*([0-9¼½¾⅓⅔⅛⅜⅝⅞/ .()\-]+)')
                 ),
                 ''
               )
           )
         ) as obj_array
  from (
    select r2.id, jsonb_array_elements_text(r2.ingredients) as val
    from public.recipes r2
    where r2.source = 'csv'
      and jsonb_typeof(r2.ingredients) = 'array'
      and not exists (
        select 1
        from jsonb_array_elements(r2.ingredients) e
        where jsonb_typeof(e.value) = 'object'
      )
  ) s
  group by id
) sub
where r.id = sub.id;

-- (B) Fix measures embedded in the 'name' field when measure is blank
with expanded as (
  select
    r.id,
    jsonb_agg(
      jsonb_build_object(
        'name',
          case when needs_fix then cleaned_name else name0 end,
        'measure',
          case when needs_fix then coalesce(extracted_measure, measure0, '') else coalesce(measure0, '') end
      )
    ) as new_arr
  from public.recipes r
  cross join lateral jsonb_array_elements(r.ingredients) elem
  cross join lateral (
    select
      elem->>'name'    as name0,
      elem->>'measure' as measure0,

      ((elem->>'measure') is null or btrim(elem->>'measure') = '')
      and (elem->>'name') ~* '^[[:space:]]*([0-9]|[¼½¾⅓⅔⅛⅜⅝⅞])'
        as needs_fix,

      (
        regexp_matches(
          elem->>'name',
          '^[[:space:]]*((?:[0-9]+(?:[[:space:]]*[0-9]+/[0-9]+)?|[0-9]+/[0-9]+|[¼½¾⅓⅔⅛⅜⅝⅞])(?:[[:space:]]*(?:to|-|–|—)[[:space:]]*(?:[0-9]+(?:[[:space:]]*[0-9]+/[0-9]+)?|[0-9]+/[0-9]+|[¼½¾⅓⅔⅛⅜⅝⅞]))?[[:space:]]*(?:x)?[[:space:]]*(?:cups?|cup|tsp|teaspoons?|tbsp|tablespoons?|oz|ounce|ounces|pounds?|lbs?|lb|grams?|g|kg|milliliters?|ml|liters?|l|dash|pinch|cloves?|cans?|packages?|package|pkg|bag|bags|sticks?|slices?|pieces?)?\\.?(?:[[:space:]]+of)?)',
          'i'
        )
      )[1] as extracted_measure,

      btrim(
        regexp_replace(
          elem->>'name',
          '^[[:space:]]*((?:[0-9]+(?:[[:space:]]*[0-9]+/[0-9]+)?|[0-9]+/[0-9]+|[¼½¾⅓⅔⅛⅜⅝⅞])(?:[[:space:]]*(?:to|-|–|—)[[:space:]]*(?:[0-9]+(?:[[:space:]]*[0-9]+/[0-9]+)?|[0-9]+/[0-9]+|[¼½¾⅓⅔⅛⅜⅝⅞]))?[[:space:]]*(?:x)?[[:space:]]*(?:cups?|cup|tsp|teaspoons?|tbsp|tablespoons?|oz|ounce|ounces|pounds?|lbs?|lb|grams?|g|kg|milliliters?|ml|liters?|l|dash|pinch|cloves?|cans?|packages?|package|pkg|bag|bags|sticks?|slices?|pieces?)?\\.?(?:[[:space:]]+of)?)',
          '',
          'i'
        )
      ) as cleaned_name
  ) x
  where jsonb_typeof(r.ingredients) = 'array'
  group by r.id
)
update public.recipes r
set ingredients = e.new_arr
from expanded e
where r.id = e.id;

-- (C) Backfill counts if missing
update public.recipes
set ingredients_count = jsonb_array_length(ingredients)
where (ingredients_count is null) and jsonb_typeof(ingredients) = 'array';

update public.recipes
set steps_count = case
  when coalesce(nullif(btrim(instructions), ''), '') = '' then null
  else array_length(regexp_split_to_array(instructions, E'\n+'), 1)
end
where steps_count is null;

-- (D) Mark has_video when applicable
update public.recipes
set has_video = (video_url is not null and btrim(video_url) <> '')
where has_video is distinct from (video_url is not null and btrim(video_url) <> '');

commit;

-- ---------- 9) OPTIONAL: Run the easy CSV importer now ----------
-- Returns a single row with (inserted, updated) counts
select * from public.finish_recipe_seed_import_csv_easy();

-- ---------- 10) Discovery view for random variety ----------
-- Create a view that provides random variety through a sortable seed column
-- This view is PostgREST compatible and provides fast random ordering
DO $$
BEGIN
  -- Create or update the view with a stable sort_seed
  EXECUTE $v$
    CREATE OR REPLACE VIEW public.recipes_discovery AS
    SELECT
      r.*,
      (('x' || substr(md5(r.id::text), 1, 8))::bit(32)::int) AS sort_seed
    FROM public.recipes r
    WHERE r.user_id IS NULL
      AND (r.source_type = 'seed' OR r.source_type IS NULL);
  $v$;
END$$;

-- Make sure clients can read the view
GRANT SELECT ON public.recipes_discovery TO anon, authenticated;

-- Note: Indexes on views are not supported in PostgreSQL
-- The view will use indexes on the underlying recipes table
