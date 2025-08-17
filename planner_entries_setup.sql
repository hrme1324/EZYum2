create table if not exists public.planner_entries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  recipe_id uuid not null references public.recipes(id) on delete cascade,
  date date not null,
  slot text,
  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.planner_entries enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='planner_entries' and policyname='planner_select_own') then
    create policy planner_select_own on public.planner_entries for select using (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='planner_entries' and policyname='planner_insert_own') then
    create policy planner_insert_own on public.planner_entries for insert with check (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='planner_entries' and policyname='planner_update_own') then
    create policy planner_update_own on public.planner_entries for update using (auth.uid() = user_id) with check (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public' and tablename='planner_entries' and policyname='planner_delete_own') then
    create policy planner_delete_own on public.planner_entries for delete using (auth.uid() = user_id);
  end if;
end $$;
