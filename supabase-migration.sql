-- Ezyum Food App Database Migration
-- Run this in Supabase SQL Editor to update existing recipes table

-- Add missing columns to recipes table
DO $$
BEGIN
    -- Add category column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'recipes' AND column_name = 'category') THEN
        ALTER TABLE public.recipes ADD COLUMN category TEXT;
    END IF;

    -- Add area column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'recipes' AND column_name = 'area') THEN
        ALTER TABLE public.recipes ADD COLUMN area TEXT;
    END IF;

    -- Add instructions column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'recipes' AND column_name = 'instructions') THEN
        ALTER TABLE public.recipes ADD COLUMN instructions TEXT;
    END IF;

    -- Add image column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'recipes' AND column_name = 'image') THEN
        ALTER TABLE public.recipes ADD COLUMN image TEXT;
    END IF;

    -- Add tags column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'recipes' AND column_name = 'tags') THEN
        ALTER TABLE public.recipes ADD COLUMN tags TEXT[];
    END IF;

    -- Add video_url column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'recipes' AND column_name = 'video_url') THEN
        ALTER TABLE public.recipes ADD COLUMN video_url TEXT;
    END IF;

    -- Add website_url column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'recipes' AND column_name = 'website_url') THEN
        ALTER TABLE public.recipes ADD COLUMN website_url TEXT;
    END IF;

    -- Add cooking_time column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'recipes' AND column_name = 'cooking_time') THEN
        ALTER TABLE public.recipes ADD COLUMN cooking_time TEXT;
    END IF;

    -- Add difficulty column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'recipes' AND column_name = 'difficulty') THEN
        ALTER TABLE public.recipes ADD COLUMN difficulty TEXT CHECK (difficulty IN ('Easy', 'Medium', 'Hard'));
    END IF;

    -- Add source_type column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'recipes' AND column_name = 'source_type') THEN
        ALTER TABLE public.recipes ADD COLUMN source_type TEXT DEFAULT 'user';
    END IF;

    -- Add mealdb_id column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'recipes' AND column_name = 'mealdb_id') THEN
        ALTER TABLE public.recipes ADD COLUMN mealdb_id TEXT;
    END IF;

    -- Add updated_at column if it doesn't exist
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'recipes' AND column_name = 'updated_at') THEN
        ALTER TABLE public.recipes ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    END IF;

    -- Rename existing columns if they exist with old names
    -- Rename source_url to website_url if source_url exists and website_url doesn't
    IF EXISTS (SELECT 1 FROM information_schema.columns
               WHERE table_name = 'recipes' AND column_name = 'source_url')
       AND NOT EXISTS (SELECT 1 FROM information_schema.columns
                       WHERE table_name = 'recipes' AND column_name = 'website_url') THEN
        ALTER TABLE public.recipes RENAME COLUMN source_url TO website_url;
    END IF;

    -- Rename cook_time to cooking_time if cook_time exists and cooking_time doesn't
    IF EXISTS (SELECT 1 FROM information_schema.columns
               WHERE table_name = 'recipes' AND column_name = 'cook_time')
       AND NOT EXISTS (SELECT 1 FROM information_schema.columns
                       WHERE table_name = 'recipes' AND column_name = 'cooking_time') THEN
        ALTER TABLE public.recipes RENAME COLUMN cook_time TO cooking_time;
    END IF;

    -- Rename image_url to image if image_url exists and image doesn't
    IF EXISTS (SELECT 1 FROM information_schema.columns
               WHERE table_name = 'recipes' AND column_name = 'image_url')
       AND NOT EXISTS (SELECT 1 FROM information_schema.columns
                       WHERE table_name = 'recipes' AND column_name = 'image') THEN
        ALTER TABLE public.recipes RENAME COLUMN image_url TO image;
    END IF;

    -- Rename instructions array to instructions text if instructions column is array type
    IF EXISTS (SELECT 1 FROM information_schema.columns
               WHERE table_name = 'recipes' AND column_name = 'instructions'
               AND data_type = 'ARRAY') THEN
        -- Create a temporary column
        ALTER TABLE public.recipes ADD COLUMN instructions_temp TEXT;
        -- Copy data from array to text (join with newlines)
        UPDATE public.recipes SET instructions_temp = array_to_string(instructions, E'\n') WHERE instructions IS NOT NULL;
        -- Drop the old array column
        ALTER TABLE public.recipes DROP COLUMN instructions;
        -- Rename temp column to instructions
        ALTER TABLE public.recipes RENAME COLUMN instructions_temp TO instructions;
    END IF;

    -- Rename equipment array to tags if equipment exists and tags doesn't
    IF EXISTS (SELECT 1 FROM information_schema.columns
               WHERE table_name = 'recipes' AND column_name = 'equipment')
       AND NOT EXISTS (SELECT 1 FROM information_schema.columns
                       WHERE table_name = 'recipes' AND column_name = 'tags') THEN
        ALTER TABLE public.recipes RENAME COLUMN equipment TO tags;
    END IF;

END $$;

-- Create indexes for better performance (if they don't exist)
DO $$
BEGIN
    -- Index for user_id
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_recipes_user_id') THEN
        CREATE INDEX idx_recipes_user_id ON public.recipes(user_id);
    END IF;

    -- Index for source_type
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_recipes_source_type') THEN
        CREATE INDEX idx_recipes_source_type ON public.recipes(source_type);
    END IF;

    -- Index for mealdb_id
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_recipes_mealdb_id') THEN
        CREATE INDEX idx_recipes_mealdb_id ON public.recipes(mealdb_id);
    END IF;
END $$;

-- Verify the migration
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'recipes'
ORDER BY ordinal_position;
