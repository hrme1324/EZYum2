import { supabase } from '../api/supabase';

export type MealDbRecipe = {
  idMeal: string;
  strMeal: string;
  strMealThumb?: string;
  strInstructions?: string;
  strArea?: string;
  strCategory?: string;
  total_time_min?: number | null;
  ingredients?: Array<{ name: string; measure?: string }>;
  // Additional MealDB fields
  strYoutube?: string;
  strSource?: string;
  strTags?: string;
};

/**
 * Shadow-insert a MealDB recipe into local recipes table
 * This creates a minimal row to satisfy foreign key constraints
 */
export async function upsertRecipeFromMealDB(r: MealDbRecipe): Promise<string> {
  // Parse ingredients from MealDB format
  const ingredients = parseMealDbIngredients(r);

  // Minimal normalized row; user_id = null (global catalog row)
  const payload = {
    user_id: null,
    name: r.strMeal,
    image: r.strMealThumb ?? null,
    instructions: r.strInstructions ?? null,
    area: r.strArea ?? null,
    category: r.strCategory ?? null,
    ingredients: ingredients,
    ingredients_raw: ingredients,
    tags: r.strTags ? r.strTags.split(',').map(t => t.trim()) : [],
    video_url: r.strYoutube ?? null,
    website_url: r.strSource ?? null,
    source_type: 'api',
    source: 'mealdb',
    source_id: r.idMeal,
    mealdb_id: r.idMeal,
    total_time_min: r.total_time_min ?? null,
    has_video: !!r.strYoutube,
    ingredients_count: ingredients.length,
    steps_count: r.strInstructions ? r.strInstructions.split('.').filter(s => s.trim()).length : 0
  };

  const { data, error } = await supabase
    .from('recipes')
    .upsert(payload, { onConflict: 'mealdb_id' })
    .select('id')
    .limit(1);

  if (error) {
    console.error('Error upserting MealDB recipe:', error);
    throw error;
  }

  return data?.[0]?.id as string;
}

/**
 * Parse MealDB ingredients into normalized format
 */
function parseMealDbIngredients(meal: MealDbRecipe): Array<{ name: string; measure?: string }> {
  const ingredients: Array<{ name: string; measure?: string }> = [];

  // MealDB has ingredients in strIngredient1, strIngredient2, etc.
  // and measures in strMeasure1, strMeasure2, etc.
  for (let i = 1; i <= 20; i++) {
    const ingredient = (meal as any)[`strIngredient${i}`];
    const measure = (meal as any)[`strMeasure${i}`];

    if (ingredient && ingredient.trim()) {
      ingredients.push({
        name: ingredient.trim(),
        measure: measure ? measure.trim() : undefined
      });
    }
  }

  return ingredients;
}

/**
 * Save a MealDB recipe to user's favorites
 */
export async function saveMealDbRecipe(meal: MealDbRecipe, userId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const recipeId = await upsertRecipeFromMealDB(meal);

    const { error } = await supabase
      .from('saved_recipes')
      .upsert(
        { user_id: userId, recipe_id: recipeId },
        { onConflict: 'user_id,recipe_id' }
      );

    if (error) {
      console.error('Error saving MealDB recipe:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Error in saveMealDbRecipe:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to save recipe'
    };
  }
}

/**
 * Schedule a MealDB recipe in the planner
 */
export async function scheduleMealDbRecipe(
  meal: MealDbRecipe,
  userId: string,
  planDateISO: string,
  slot: 'breakfast' | 'lunch' | 'dinner' | 'snack',
  source: string = 'discovery'
): Promise<{ success: boolean; error?: string }> {
  try {
    const recipeId = await upsertRecipeFromMealDB(meal);

    const { error } = await supabase
      .from('meals')
      .upsert(
        {
          user_id: userId,
          date: planDateISO,
          meal_type: slot,
          recipe_id: recipeId,
          status: 'planned',
          notes: source
        },
        { onConflict: 'user_id,date,meal_type' }
      );

    if (error) {
      console.error('Error scheduling MealDB recipe:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    console.error('Error in scheduleMealDbRecipe:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to schedule recipe'
    };
  }
}

/**
 * Mark a MealDB recipe as cooked (drives streaks/awards/points)
 */
export async function markCookedFromMealDb(
  meal: MealDbRecipe,
  userId: string,
  source: string = 'manual'
): Promise<{ success: boolean; error?: string }> {
  try {
    const recipeId = await upsertRecipeFromMealDB(meal);

    const { error } = await supabase
      .from('recipe_completions')
      .insert({
        user_id: userId,
        recipe_id: recipeId,
        source
      });

    if (error) {
      console.error('Error marking MealDB recipe as cooked:', error);
      return { success: false, error: error.message };
    }

    // Optional: ensure immediate refresh of stats
    try {
      await supabase.rpc('recompute_my_stats');
    } catch {
      // Stats will update via trigger anyway, so this is just for immediate feedback
    }

    return { success: true };
  } catch (error) {
    console.error('Error in markCookedFromMealDb:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to mark recipe as cooked'
    };
  }
}

/**
 * Check if a MealDB recipe is already saved by the user
 */
export async function isMealDbRecipeSaved(meal: MealDbRecipe, userId: string): Promise<boolean> {
  try {
    const recipeId = await upsertRecipeFromMealDB(meal);

    const { count, error } = await supabase
      .from('saved_recipes')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('recipe_id', recipeId);

    if (error) {
      console.error('Error checking if recipe is saved:', error);
      return false;
    }

    return (count || 0) > 0;
  } catch (error) {
    console.error('Error in isMealDbRecipeSaved:', error);
    return false;
  }
}
