-- Fix foreign key relationship between meals and recipes
-- Run this in Supabase SQL Editor

-- First, let's check if the meals table exists and has the right structure
DO $$
BEGIN
    -- Check if meals table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'meals') THEN
        -- Check if recipe_id column exists
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                       WHERE table_name = 'meals' AND column_name = 'recipe_id') THEN
            -- Add recipe_id column if it doesn't exist
            ALTER TABLE public.meals ADD COLUMN recipe_id UUID;
        END IF;

        -- Add foreign key constraint if it doesn't exist
        IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints
                       WHERE constraint_name = 'meals_recipe_id_fkey'
                       AND table_name = 'meals') THEN
            ALTER TABLE public.meals
            ADD CONSTRAINT meals_recipe_id_fkey
            FOREIGN KEY (recipe_id) REFERENCES public.recipes(id) ON DELETE SET NULL;
        END IF;
    ELSE
        -- Create meals table if it doesn't exist
        CREATE TABLE public.meals (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
            date DATE NOT NULL,
            meal_type TEXT NOT NULL,
            recipe_id UUID REFERENCES public.recipes(id) ON DELETE SET NULL,
            status TEXT DEFAULT 'planned',
            notes TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );

        -- Enable RLS
        ALTER TABLE public.meals ENABLE ROW LEVEL SECURITY;

        -- Create RLS policy
        CREATE POLICY "Users can only access their own meals"
        ON public.meals FOR ALL USING (auth.uid() = user_id);

        -- Create index
        CREATE INDEX idx_meals_user_id_date ON public.meals(user_id, date);
    END IF;
END $$;

-- Verify the relationship
SELECT
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM
    information_schema.table_constraints AS tc
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY'
    AND tc.table_name='meals';
