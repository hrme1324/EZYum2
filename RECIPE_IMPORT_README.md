# Ezyum Food App - Recipe Import System

## Overview
This system provides a comprehensive recipe import and management solution for the Ezyum Food App, built on Supabase with PostgreSQL.

## New Migration Structure (4 Files)

### 1. `supabase-migration-main.sql` - Core System Setup
**Purpose:** Main database schema, RLS policies, import functions, and data normalization
**Contains:**
- Core `recipes` table with all necessary columns
- Row Level Security (RLS) policies for public/private access
- Staging tables for flexible recipe import
- Import functions with deduplication logic
- Advanced ingredient parsing and normalization
- CSV import function for easy recipes

### 2. `supabase-migration-performance_index.sql` - Performance Optimization
**Purpose:** Database indexes to prevent timeouts and speed up queries
**Contains:**
- Keyset pagination indexes (`source_type + updated_at`, `user_id + updated_at`)
- Text search optimization (trigram indexes on recipe names)
- JSON array filtering indexes for ingredients and tags
- Performance indexes for pantry, grocery, and user settings

### 3. `supabase-migration-recipe-bookmarking.sql` - Recipe Saving System
**Purpose:** User recipe bookmarking and favorites functionality
**Contains:**
- `saved_recipes` table for user recipe bookmarks
- RLS policies for secure access
- Indexes for fast user recipe lookups
- Auto-updating timestamps

### 4. `supabase-migration-timestamp.sql` - Timestamp Management
**Purpose:** Consistent timestamp handling across all tables
**Contains:**
- Reusable `updated_at` trigger function
- Timestamp columns and triggers for all major tables
- Performance indexes for timestamp-based queries

## Execution Order

**IMPORTANT:** Run these files in this exact order:

1. **`supabase-migration-main.sql`** - Core system setup
2. **`supabase-migration-performance_index.sql`** - Performance optimization
3. **`supabase-migration-recipe-bookmarking.sql`** - Bookmarking system
4. **`supabase-migration-timestamp.sql`** - Timestamp management

## Key Features

### Recipe Import System
- **Flexible staging tables** for different data formats
- **Intelligent deduplication** by MealDB ID or source/source_id
- **CSV import function** specifically for easy recipes
- **Automatic ingredient parsing** from text to structured JSON

### Data Normalization
- **Ingredient standardization** with measure extraction
- **Tag processing** from comma-separated strings to arrays
- **Automatic count backfilling** for ingredients and steps
- **Video detection** and metadata enhancement

### Performance Features
- **Keyset pagination** support for infinite scrolling
- **Text search optimization** with trigram indexes
- **JSON query optimization** for ingredient filtering
- **Timeout prevention** with efficient query patterns

### Security
- **Row Level Security (RLS)** on all tables
- **Public read access** for seed recipes
- **User isolation** for private recipes
- **Secure import functions** with proper access controls

## Usage Examples

### Import CSV Recipes
```sql
-- Load your CSV data into staging_recipes_csv table
-- Then run the easy recipe importer:
SELECT * FROM public.finish_recipe_seed_import_csv_easy();
```

### Import from Staging
```sql
-- Load data into staging_recipes table
-- Then run the main importer:
SELECT * FROM public.finish_recipe_seed_import();
```

### Query Recipes by Source
```sql
-- Get all seed recipes
SELECT * FROM recipes WHERE source_type = 'seed';

-- Get user recipes
SELECT * FROM recipes WHERE source_type = 'user' AND user_id = auth.uid();

-- Get MealDB recipes
SELECT * FROM recipes WHERE source_type = 'mealdb';
```

## Database Schema

### Core Tables
- **`recipes`** - Main recipe storage with full metadata
- **`staging_recipes`** - Flexible import staging
- **`staging_recipes_csv`** - CSV-specific staging
- **`saved_recipes`** - User recipe bookmarks

### Key Columns
- **`source_type`** - 'seed', 'user', 'mealdb', 'usda'
- **`ingredients`** - JSONB array of ingredient objects
- **`tags`** - Text array for categorization
- **`updated_at`** - Timestamp for keyset pagination

## Performance Considerations

### Indexes
- **Composite indexes** for common query patterns
- **Trigram indexes** for text search
- **JSON indexes** for ingredient filtering
- **Timestamp indexes** for pagination

### Query Optimization
- **Keyset pagination** instead of offset pagination
- **Efficient JSON operations** with proper indexing
- **Minimal data transfer** with selective columns
- **Timeout prevention** with optimized query plans

## Troubleshooting

### Common Issues
1. **Import failures** - Check staging table data format
2. **Performance issues** - Verify indexes are created
3. **RLS errors** - Ensure policies are properly configured
4. **Duplicate recipes** - Check deduplication logic

### Debug Queries
```sql
-- Check table structure
SELECT column_name, data_type FROM information_schema.columns
WHERE table_name = 'recipes' ORDER BY ordinal_position;

-- Verify indexes
SELECT indexname, indexdef FROM pg_indexes
WHERE tablename = 'recipes';

-- Check RLS policies
SELECT * FROM pg_policies WHERE tablename = 'recipes';
```

## Migration Notes

- **Safe to re-run** - All scripts are idempotent
- **No data loss** - Existing recipes are preserved
- **Backward compatible** - Works with existing data
- **Incremental updates** - Can be run multiple times safely
