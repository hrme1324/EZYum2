# Supabase Migrations

## recipes difficulty and global catalog

Suggested migration (optional if you want stricter typing and license tracking):

```sql
-- migration: 2025-08-08_add_recipes_core
create type recipe_difficulty as enum ('easy','medium','hard');

alter table public.recipes
  add column if not exists license text,
  alter column difficulty type text using difficulty::text;

-- If you prefer enum:
-- alter table public.recipes alter column difficulty type recipe_difficulty using lower(difficulty)::recipe_difficulty;

-- Make user_id nullable to allow global seeds
alter table public.recipes alter column user_id drop not null;

-- RLS: allow read-all; writes limited to owner
drop policy if exists "Users can only access their own recipes" on public.recipes;
create policy recipes_select_all on public.recipes for select using (true);
create policy recipes_modify_owned on public.recipes for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
```

Note: If you keep `difficulty` as text ('Easy'|'Medium'|'Hard') in the UI, server may map from enum to titlecase on read.
