import { Recipe } from '../types';
import { logger } from '../utils/logger';
import { fromDbRecipe } from './mappers';
import { supabase } from './supabase';

export interface UserRecipe extends Recipe {
  user_id: string;
  sourceType: 'user' | 'mealdb';
  mealdbId?: string;
}

export class RecipeService {
  /**
   * Get user's saved recipes from Supabase
   */
  static async getUserRecipes(limit: number = 50): Promise<UserRecipe[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data: recipes, error } = await supabase
        .from('recipes')
        .select('id,name,category,area,instructions,image,tags,ingredients,video_url,website_url,cooking_time,difficulty,created_at,updated_at,user_id,source_type,mealdb_id')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })
        .limit(limit);

      if (error) {
        logger.error('Error fetching user recipes:', error);
        throw error;
      }

      return (
        recipes?.map((recipe: any) => ({
          ...fromDbRecipe(recipe),
          user_id: recipe.user_id || '',
          sourceType: recipe.source_type || 'user',
          mealdbId: recipe.mealdb_id,
        })) || []
      );
    } catch (error) {
      logger.error('Error getting user recipes:', error);
      return [];
    }
  }

  /**
   * Get recipes with pagination
   */
  static async getRandomDiscoveryRecipes(count: number = 10): Promise<Recipe[]> {
    try {
      logger.debug(`[discovery] Getting ${count} random discovery recipes`);

      // Random offset for variety
      const startOffset = Math.floor(Math.random() * 10000);
      logger.debug(`[discovery] Using random offset: ${startOffset}`);

      const { data: recipes, error } = await supabase
        .from('recipes')
        .select('id,name,image,category,area,tags,ingredients,cooking_time,difficulty,updated_at')
        .is('user_id', null)
        .eq('source_type', 'seed')
        .order('id', { ascending: true })
        .range(startOffset, startOffset + count - 1);

      if (error) {
        logger.error('Error fetching random discovery recipes:', error);
        throw error;
      }

      return recipes?.map((recipe: any) => fromDbRecipe(recipe)) || [];
    } catch (error) {
      logger.error('Error getting random discovery recipes:', error);
      return [];
    }
  }

  /**
   * Get Recipes Plus (MealDB API only; NOT from CSV)
   */
  static async getRecipesPlus(): Promise<Recipe[]> {
    try {
      const { data: recipes, error } = await supabase
        .from('recipes')
        .select('*')
        .eq('source_type', 'mealdb')
        .or('video_url.not.is.null,website_url.not.is.null')
        .order('created_at', { ascending: false })
        .limit(24);

      if (error) {
        logger.error('Error fetching recipes plus:', error);
        throw error;
      }

      return recipes?.map((recipe: any) => fromDbRecipe(recipe)) || [];
    } catch (error) {
      logger.error('Error getting recipes plus:', error);
      return [];
    }
  }

  /**
   * Get personalized "For You" recipes
   */
  static async getForYouRecipes(): Promise<Recipe[]> {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return [];

      // Get user settings and allergens
      const [settingsResult, allergensResult] = await Promise.all([
        supabase
          .from('user_settings')
          .select('time_budget, preferred_cuisines, max_ingredients, max_steps')
          .eq('user_id', user.id)
          .single(),
        supabase.from('user_allergens').select('allergen_name').eq('user_id', user.id),
      ]);

      const userSettings = settingsResult.data;
      const userAllergens = allergensResult.data || [];

      // Fetch recipes (user's own + global)
      const { data: recipes, error } = await supabase
        .from('recipes')
        .select('*')
        .or(`user_id.eq.${user.id},user_id.is.null`)
        .limit(100);

      if (error) {
        logger.error('Error fetching for you recipes:', error);
        throw error;
      }

      if (!recipes) return [];

      // Score and filter recipes
      const scoredRecipes = recipes
        .map((recipe: any) => {
          const mappedRecipe = fromDbRecipe(recipe);
          let score = 0;

          // +3 if recipe is "quick"
          const maxIngredients = userSettings?.max_ingredients || 10;
          const maxSteps = userSettings?.max_steps || 6;
          if (
            (mappedRecipe.ingredientsCount && mappedRecipe.ingredientsCount <= maxIngredients) ||
            (mappedRecipe.stepsCount && mappedRecipe.stepsCount <= maxSteps) ||
            (userSettings?.time_budget &&
              mappedRecipe.cookingTime &&
              parseInt(mappedRecipe.cookingTime) <= userSettings.time_budget)
          ) {
            score += 3;
          }

          // +2 if category or area matches preferred cuisines
          if (userSettings?.preferred_cuisines && (mappedRecipe.category || mappedRecipe.area)) {
            const categoryArea =
              `${mappedRecipe.category || ''} ${mappedRecipe.area || ''}`.toLowerCase();
            if (
              userSettings.preferred_cuisines.some((cuisine: string) =>
                categoryArea.includes(cuisine.toLowerCase()),
              )
            ) {
              score += 2;
            }
          }

          // +1 if has video
          if (mappedRecipe.hasVideo) {
            score += 1;
          }

          // +1 if any user appliances appear in tags
          // Note: This would require fetching user appliances and checking against tags
          // For now, we'll skip this scoring

          return { ...mappedRecipe, score };
        })
        .filter((recipe) => {
          // Exclude recipes with allergens
          if (userAllergens.length === 0) return true;

          const recipeTags = recipe.tags || [];
          const recipeText =
            `${recipe.name} ${recipe.category || ''} ${recipe.area || ''} ${recipeTags.join(' ')}`.toLowerCase();

          return !userAllergens.some((allergen) =>
            recipeText.includes(allergen.allergen_name.toLowerCase()),
          );
        })
        .sort((a, b) => {
          // Sort by score desc, then by createdAt desc
          if (b.score !== a.score) {
            return b.score - a.score;
          }
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        })
        .slice(0, 24);

      return scoredRecipes;
    } catch (error) {
      logger.error('Error getting for you recipes:', error);
      return [];
    }
  }

  /**
   * Save a recipe to user's collection
   */
  static async saveRecipe(recipe: Omit<Recipe, 'id'>): Promise<boolean> {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { error } = await supabase.from('recipes').insert({
        user_id: user.id,
        name: recipe.name,
        category: recipe.category,
        area: recipe.area,
        instructions: recipe.instructions,
        image: recipe.image,
        tags: recipe.tags,
        ingredients: recipe.ingredients,
        video_url: recipe.videoUrl,
        website_url: recipe.websiteUrl,
        cooking_time: recipe.cookingTime,
        difficulty: recipe.difficulty,
        source_type: 'user',
      });

      if (error) {
        logger.error('Error saving recipe:', error);
        throw error;
      }

      return true;
    } catch (error) {
      logger.error('Error saving recipe:', error);
      return false;
    }
  }

  /**
   * Save a MealDB recipe as favorite: shadow insert + saved_recipes
   */
  static async saveMealDBRecipe(mealdb: {
    mealdbId: string; name: string; image?: string; category?: string; area?: string;
  }): Promise<{ recipeId: string }> {
    try {
      const { data: rpc, error: rpcErr } = await supabase.rpc('upsert_mealdb_seed', {
        p_mealdb_id: mealdb.mealdbId,
        p_name: mealdb.name,
        p_image: mealdb.image ?? null,
        p_category: mealdb.category ?? null,
        p_area: mealdb.area ?? null
      });
      if (rpcErr) throw rpcErr;
      const recipeId: string = rpc;

      const user = (await supabase.auth.getUser()).data.user;
      if (!user) throw new Error('Not signed in');

      const { error } = await supabase.from('saved_recipes').insert({
        user_id: user.id, recipe_id: recipeId
      });
      if (error && error.code !== '23505') throw error; // ignore duplicate
      return { recipeId };
    } catch (error) {
      logger.error('Error saving MealDB recipe:', error);
      throw error;
    }
  }

  /**
   * Delete a recipe from user's collection
   */
  static async deleteRecipe(recipeId: string): Promise<boolean> {
    try {
      const { error } = await supabase.from('recipes').delete().eq('id', recipeId);

      if (error) {
        logger.error('Error deleting recipe:', error);
        throw error;
      }

      return true;
    } catch (error) {
      logger.error('Error deleting recipe:', error);
      return false;
    }
  }

  /**
   * Update a recipe in user's collection
   */
  static async updateRecipe(recipeId: string, updates: Partial<Recipe>): Promise<boolean> {
    try {
      const updateData: any = {};

      if (updates.name) updateData.name = updates.name;
      if (updates.category) updateData.category = updates.category;
      if (updates.area) updateData.area = updates.area;
      if (updates.instructions) updateData.instructions = updates.instructions;
      if (updates.image) updateData.image = updates.image;
      if (updates.tags) updateData.tags = updates.tags;
      if (updates.ingredients) updateData.ingredients = updates.ingredients;
      if (updates.videoUrl) updateData.video_url = updates.videoUrl;
      if (updates.websiteUrl) updateData.website_url = updates.websiteUrl;
      if (updates.cookingTime) updateData.cooking_time = updates.cookingTime;
      if (updates.difficulty) updateData.difficulty = updates.difficulty;

      updateData.updated_at = new Date().toISOString();

      const { error } = await supabase.from('recipes').update(updateData).eq('id', recipeId);

      if (error) {
        logger.error('Error updating recipe:', error);
        throw error;
      }

      return true;
    } catch (error) {
      logger.error('Error updating recipe:', error);
      return false;
    }
  }

  /**
   * Unsave by recipeId
   */
  static async unsaveRecipe(recipeId: string): Promise<boolean> {
    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) throw new Error('Not signed in');
      const { error } = await supabase
        .from('saved_recipes')
        .delete()
        .eq('user_id', user.id)
        .eq('recipe_id', recipeId);
      if (error) throw error;
      return true;
    } catch (error) {
      logger.error('Error unsaving recipe:', error);
      throw error;
    }
  }

  /**
   * Saved recipes (join)
   */
  static async getSavedRecipes(limit: number = 100): Promise<Recipe[]> {
    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) throw new Error('Not signed in');

      // Get saved list first (fast)
      const { data: saved, error: sErr } = await supabase
        .from('saved_recipes')
        .select('recipe_id, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(limit);
      if (sErr) throw sErr;

      const ids = (saved ?? []).map(r => r.recipe_id);
      if (ids.length === 0) return [];

      const { data: recipes, error: rErr } = await supabase
        .from('recipes')
        .select('id,name,category,area,instructions,image,tags,ingredients,video_url,website_url,cooking_time,difficulty,created_at,updated_at')
        .in('id', ids);
      if (rErr) throw rErr;

      const map = new Map(recipes.map(r => [r.id, r]));
      return (saved ?? []).map(s => {
        const recipe = map.get(s.recipe_id);
        if (recipe) {
          return fromDbRecipe(recipe);
        }
        return null;
      }).filter(Boolean) as Recipe[];
    } catch (error) {
      logger.error('Error getting saved recipes:', error);
      throw error;
    }
  }

  /**
   * Check if a MealDB recipe is already saved by the user
   */
  static async isRecipeSaved(mealdbId: string): Promise<boolean> {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return false;

      const { data, error } = await supabase
        .from('recipes')
        .select('id')
        .eq('user_id', user.id)
        .eq('mealdb_id', mealdbId)
        .eq('source_type', 'mealdb')
        .single();

      if (error && error.code !== 'PGRST116') {
        logger.error('Error checking if recipe is saved:', error);
        return false;
      }

      return !!data;
    } catch (error) {
      logger.error('Error checking if recipe is saved:', error);
      return false;
    }
  }

  /**
   * Get user's weekly meal plan recipes
   */
  static async getWeeklyRecipes(): Promise<UserRecipe[]> {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return [];

      // Get the current week's meals
      const startOfWeek = new Date();
      startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(endOfWeek.getDate() + 6);

      const { data: meals, error: mealsError } = await supabase
        .from('meals')
        .select(
          `
          *,
          recipes (*)
        `,
        )
        .eq('user_id', user.id)
        .gte('date', startOfWeek.toISOString().split('T')[0])
        .lte('date', endOfWeek.toISOString().split('T')[0]);

      if (mealsError) {
        logger.error('Error fetching weekly meals:', mealsError);
        return [];
      }

      // Extract recipes from meals
      const recipes: UserRecipe[] = [];
      meals?.forEach((meal: any) => {
        if (meal.recipes) {
          const recipe = meal.recipes as any;
          recipes.push({
            ...fromDbRecipe(recipe),
            user_id: recipe.user_id || '',
            sourceType: recipe.source_type || 'user',
            mealdbId: recipe.mealdb_id,
          });
        }
      });

      return recipes;
    } catch (error) {
      logger.error('Error getting weekly recipes:', error);
      return [];
    }
  }
}
