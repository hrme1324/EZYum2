-- Ezyum Food App Complete Database Migration
-- Run this in Supabase SQL Editor to fix all database issues

-- 1. Fix recipes table schema
DO $$
BEGIN
    -- Add missing columns to recipes table
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'recipes' AND column_name = 'category') THEN
        ALTER TABLE public.recipes ADD COLUMN category TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'recipes' AND column_name = 'area') THEN
        ALTER TABLE public.recipes ADD COLUMN area TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'recipes' AND column_name = 'instructions') THEN
        ALTER TABLE public.recipes ADD COLUMN instructions TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'recipes' AND column_name = 'image') THEN
        ALTER TABLE public.recipes ADD COLUMN image TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'recipes' AND column_name = 'tags') THEN
        ALTER TABLE public.recipes ADD COLUMN tags TEXT[];
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'recipes' AND column_name = 'video_url') THEN
        ALTER TABLE public.recipes ADD COLUMN video_url TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'recipes' AND column_name = 'website_url') THEN
        ALTER TABLE public.recipes ADD COLUMN website_url TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'recipes' AND column_name = 'cooking_time') THEN
        ALTER TABLE public.recipes ADD COLUMN cooking_time TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'recipes' AND column_name = 'difficulty') THEN
        ALTER TABLE public.recipes ADD COLUMN difficulty TEXT CHECK (difficulty IN ('Easy', 'Medium', 'Hard'));
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'recipes' AND column_name = 'source_type') THEN
        ALTER TABLE public.recipes ADD COLUMN source_type TEXT DEFAULT 'user';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'recipes' AND column_name = 'mealdb_id') THEN
        ALTER TABLE public.recipes ADD COLUMN mealdb_id TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'recipes' AND column_name = 'updated_at') THEN
        ALTER TABLE public.recipes ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;

    -- Rename existing columns if they exist with old names
    IF EXISTS (SELECT 1 FROM information_schema.columns
               WHERE table_name = 'recipes' AND column_name = 'source_url')
       AND NOT EXISTS (SELECT 1 FROM information_schema.columns
                       WHERE table_name = 'recipes' AND column_name = 'website_url') THEN
        ALTER TABLE public.recipes RENAME COLUMN source_url TO website_url;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns
               WHERE table_name = 'recipes' AND column_name = 'cook_time')
       AND NOT EXISTS (SELECT 1 FROM information_schema.columns
                       WHERE table_name = 'recipes' AND column_name = 'cooking_time') THEN
        ALTER TABLE public.recipes RENAME COLUMN cook_time TO cooking_time;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns
               WHERE table_name = 'recipes' AND column_name = 'image_url')
       AND NOT EXISTS (SELECT 1 FROM information_schema.columns
                       WHERE table_name = 'recipes' AND column_name = 'image') THEN
        ALTER TABLE public.recipes RENAME COLUMN image_url TO image;
    END IF;

    -- Convert instructions array to text if needed
    IF EXISTS (SELECT 1 FROM information_schema.columns
               WHERE table_name = 'recipes' AND column_name = 'instructions'
               AND data_type = 'ARRAY') THEN
        ALTER TABLE public.recipes ADD COLUMN instructions_temp TEXT;
        UPDATE public.recipes SET instructions_temp = array_to_string(instructions, E'\n') WHERE instructions IS NOT NULL;
        ALTER TABLE public.recipes DROP COLUMN instructions;
        ALTER TABLE public.recipes RENAME COLUMN instructions_temp TO instructions;
    END IF;

    -- Rename equipment to tags if needed
    IF EXISTS (SELECT 1 FROM information_schema.columns
               WHERE table_name = 'recipes' AND column_name = 'equipment')
       AND NOT EXISTS (SELECT 1 FROM information_schema.columns
                       WHERE table_name = 'recipes' AND column_name = 'tags') THEN
        ALTER TABLE public.recipes RENAME COLUMN equipment TO tags;
    END IF;

END $$;

-- 2. Create missing tables if they don't exist
CREATE TABLE IF NOT EXISTS public.meals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  meal_type TEXT NOT NULL,
  recipe_id UUID REFERENCES public.recipes(id),
  status TEXT DEFAULT 'planned',
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.pantry_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  quantity INTEGER DEFAULT 1,
  expiration DATE,
  source TEXT DEFAULT 'manual',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.grocery_lists (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  items JSONB NOT NULL,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.user_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  time_budget INTEGER DEFAULT 30,
  notifications_enabled BOOLEAN DEFAULT true,
  dark_mode BOOLEAN DEFAULT false,
  meal_reminders BOOLEAN DEFAULT true,
  grocery_reminders BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.user_allergens (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  allergen_name TEXT NOT NULL,
  severity TEXT DEFAULT 'moderate' CHECK (severity IN ('mild', 'moderate', 'severe')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.user_appliances (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  appliance_name TEXT NOT NULL,
  appliance_type TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.smart_suggestions (
  id TEXT PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  suggestion_type TEXT NOT NULL CHECK (suggestion_type IN ('recipe', 'meal_plan', 'grocery')),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  reasoning TEXT NOT NULL,
  ingredients_needed TEXT[] DEFAULT '{}',
  ingredients_available TEXT[] DEFAULT '{}',
  estimated_time INTEGER NOT NULL,
  difficulty TEXT NOT NULL CHECK (difficulty IN ('Easy', 'Medium', 'Hard')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  used BOOLEAN DEFAULT FALSE
);

-- 3. Enable RLS on all tables
ALTER TABLE public.recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pantry_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grocery_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_allergens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_appliances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.smart_suggestions ENABLE ROW LEVEL SECURITY;

-- 4. Create RLS policies
DO $$
BEGIN
    -- Recipes policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'recipes' AND policyname = 'Users can only access their own recipes') THEN
        CREATE POLICY "Users can only access their own recipes" ON public.recipes FOR ALL USING (auth.uid() = user_id);
    END IF;

    -- Meals policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'meals' AND policyname = 'Users can only access their own meals') THEN
        CREATE POLICY "Users can only access their own meals" ON public.meals FOR ALL USING (auth.uid() = user_id);
    END IF;

    -- Pantry policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'pantry_items' AND policyname = 'Users can only access their own pantry items') THEN
        CREATE POLICY "Users can only access their own pantry items" ON public.pantry_items FOR ALL USING (auth.uid() = user_id);
    END IF;

    -- Grocery lists policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'grocery_lists' AND policyname = 'Users can only access their own grocery lists') THEN
        CREATE POLICY "Users can only access their own grocery lists" ON public.grocery_lists FOR ALL USING (auth.uid() = user_id);
    END IF;

    -- User settings policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_settings' AND policyname = 'Users can only access their own settings') THEN
        CREATE POLICY "Users can only access their own settings" ON public.user_settings FOR ALL USING (auth.uid() = user_id);
    END IF;

    -- User allergens policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_allergens' AND policyname = 'Users can only access their own allergens') THEN
        CREATE POLICY "Users can only access their own allergens" ON public.user_allergens FOR ALL USING (auth.uid() = user_id);
    END IF;

    -- User appliances policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'user_appliances' AND policyname = 'Users can only access their own appliances') THEN
        CREATE POLICY "Users can only access their own appliances" ON public.user_appliances FOR ALL USING (auth.uid() = user_id);
    END IF;

    -- Smart suggestions policies
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'smart_suggestions' AND policyname = 'Users can only access their own smart suggestions') THEN
        CREATE POLICY "Users can only access their own smart suggestions" ON public.smart_suggestions FOR ALL USING (auth.uid() = user_id);
    END IF;

END $$;

-- 5. Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_recipes_user_id ON public.recipes(user_id);
CREATE INDEX IF NOT EXISTS idx_recipes_source_type ON public.recipes(source_type);
CREATE INDEX IF NOT EXISTS idx_recipes_mealdb_id ON public.recipes(mealdb_id);
CREATE INDEX IF NOT EXISTS idx_meals_user_id_date ON public.meals(user_id, date);
CREATE INDEX IF NOT EXISTS idx_pantry_items_user_id ON public.pantry_items(user_id);
CREATE INDEX IF NOT EXISTS idx_grocery_lists_user_id ON public.grocery_lists(user_id);
CREATE INDEX IF NOT EXISTS idx_smart_suggestions_user_id ON public.smart_suggestions(user_id);

-- 6. Verify the migration
SELECT
    table_name,
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name IN ('recipes', 'meals', 'pantry_items', 'grocery_lists', 'user_settings', 'user_allergens', 'user_appliances', 'smart_suggestions')
ORDER BY table_name, ordinal_position;
