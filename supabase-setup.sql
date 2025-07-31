-- Ezyum Food App Database Setup
-- Run this in Supabase SQL Editor

-- Create tables
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

-- Updated recipes table with new structure for recipe management
CREATE TABLE IF NOT EXISTS public.recipes (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT,
  area TEXT,
  instructions TEXT,
  image TEXT,
  tags TEXT[],
  ingredients JSONB NOT NULL,
  video_url TEXT,
  website_url TEXT,
  cooking_time TEXT,
  difficulty TEXT CHECK (difficulty IN ('Easy', 'Medium', 'Hard')),
  source_type TEXT DEFAULT 'user', -- 'user' or 'mealdb'
  mealdb_id TEXT, -- Store MealDB ID if from external API
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

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

CREATE TABLE IF NOT EXISTS public.grocery_lists (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  items JSONB NOT NULL,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- User settings and preferences tables
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

-- Smart suggestions table for AI recommendations
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

-- Enable RLS on all tables
ALTER TABLE public.pantry_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recipes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.grocery_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_allergens ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_appliances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.smart_suggestions ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can only access their own pantry items"
  ON public.pantry_items FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Users can only access their own recipes"
  ON public.recipes FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Users can only access their own meals"
  ON public.meals FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Users can only access their own grocery lists"
  ON public.grocery_lists FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Users can only access their own settings"
  ON public.user_settings FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Users can only access their own allergens"
  ON public.user_allergens FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Users can only access their own appliances"
  ON public.user_appliances FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Users can only access their own smart suggestions"
  ON public.smart_suggestions FOR ALL
  USING (auth.uid() = user_id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_recipes_user_id ON public.recipes(user_id);
CREATE INDEX IF NOT EXISTS idx_recipes_source_type ON public.recipes(source_type);
CREATE INDEX IF NOT EXISTS idx_recipes_mealdb_id ON public.recipes(mealdb_id);
CREATE INDEX IF NOT EXISTS idx_meals_user_id_date ON public.meals(user_id, date);
CREATE INDEX IF NOT EXISTS idx_pantry_items_user_id ON public.pantry_items(user_id);
CREATE INDEX IF NOT EXISTS idx_grocery_lists_user_id ON public.grocery_lists(user_id);
CREATE INDEX IF NOT EXISTS idx_smart_suggestions_user_id ON public.smart_suggestions(user_id);
