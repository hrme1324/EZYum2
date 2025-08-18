import { Meal, Recipe } from '../types';
import { logger } from '../utils/logger';
import { supabase } from './supabase';

export class MealService {
  /**
   * Get meals for a specific date
   */
  static async getMealsForDate(userId: string, date: string): Promise<Meal[]> {
    try {
      const { data, error } = await supabase
        .from('planner_entries')
        .select('*')
        .eq('user_id', userId)
        .eq('date', date)
        .order('slot');

      if (error) {
        logger.error('Error fetching meals:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      logger.error('Meal service error:', error);
      return [];
    }
  }

  /**
   * Get meals for a date range
   */
  static async getMealsForDateRange(
    userId: string,
    startDate: string,
    endDate: string,
  ): Promise<Meal[]> {
    try {
      const { data, error } = await supabase
        .from('planner_entries')
        .select('*')
        .eq('user_id', userId)
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date')
        .order('slot');

      if (error) {
        logger.error('Error fetching meals for date range:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      logger.error('Meal service error:', error);
      return [];
    }
  }

  /**
   * Get all meals for a user
   */
  static async getAllMeals(userId: string): Promise<Meal[]> {
    try {
      const { data, error } = await supabase
        .from('planner_entries')
        .select(
          `
          *,
          recipe:recipes(*)
        `,
        )
        .eq('user_id', userId)
        .order('date', { ascending: false })
        .order('slot');

      if (error) {
        logger.error('Error fetching all meals:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      logger.error('Meal service error:', error);
      return [];
    }
  }

  /**
   * Schedule a recipe to planner (shows name in UI)
   */
  static async scheduleRecipe(opts: {
    recipeId: string;
    recipeName: string;      // use to fill name_cached immediately
    date: string;            // 'YYYY-MM-DD'
    slot: 'breakfast' | 'lunch' | 'dinner' | 'snack';
    notes?: string;
  }): Promise<Meal | null> {
    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) throw new Error('Not signed in');

      // Get recipe name for name_cached
      let recipeName = opts.recipeName;
      if (!recipeName && opts.recipeId) {
        const { data: recipeData } = await supabase
          .from('recipes')
          .select('name')
          .eq('id', opts.recipeId)
          .single();
        recipeName = recipeData?.name || '';
      }

      const { data, error } = await supabase
        .from('planner_entries')
        .insert({
          user_id: user.id,
          date: opts.date,
          slot: opts.slot,
          recipe_id: opts.recipeId,
          notes: opts.notes ?? null,
          name_cached: recipeName, // critical for UI
        })
        .select('id');

      if (error) {
        console.error('[planner insert error]', error, {
          user_id: user.id,
          date: opts.date,
          slot: opts.slot,
          recipe_id: opts.recipeId,
          name_cached: recipeName
        });
        throw error;
      }
      return data?.[0] ? { id: data[0].id } as Meal : null;
    } catch (error) {
      logger.error('Meal service error:', error);
      return null;
    }
  }

  /**
   * Update a meal
   */
  static async updateMeal(
    userId: string,
    mealId: string,
    updates: Partial<Meal>,
  ): Promise<Meal | null> {
    try {
      // Convert meal_type to slot if present
      const plannerUpdates: any = { ...updates };
      if (updates.meal_type) {
        plannerUpdates.slot = updates.meal_type;
        delete plannerUpdates.meal_type;
      }

      const { data, error } = await supabase
        .from('planner_entries')
        .update(plannerUpdates)
        .eq('id', mealId)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        logger.error('Error updating meal:', error);
        return null;
      }

      return data;
    } catch (error) {
      logger.error('Meal service error:', error);
      return null;
    }
  }

  /**
   * Delete a meal
   */
  static async deleteMeal(userId: string, mealId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('planner_entries')
        .delete()
        .eq('id', mealId)
        .eq('user_id', userId);

      if (error) {
        logger.error('Error deleting meal:', error);
        return false;
      }

      return true;
    } catch (error) {
      logger.error('Meal service error:', error);
      return false;
    }
  }

  /**
   * Get user recipes
   */
  static async getUserRecipes(userId: string): Promise<Recipe[]> {
    try {
      const { data, error } = await supabase
        .from('recipes')
        .select('*')
        .eq('user_id', userId)
        .order('name');

      if (error) {
        logger.error('Error fetching recipes:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      logger.error('Meal service error:', error);
      return [];
    }
  }

  /**
   * Add a recipe
   */
  static async addRecipe(
    userId: string,
    recipe: Omit<Recipe, 'id' | 'user_id' | 'created_at'>,
  ): Promise<Recipe | null> {
    try {
      const recipeData = {
        user_id: userId,
        name: recipe.name,
        category: recipe.category,
        area: recipe.area,
        instructions: recipe.instructions,
        ingredients: recipe.ingredients,
        image: recipe.image,
        videoUrl: recipe.videoUrl,
        websiteUrl: recipe.websiteUrl,
        cookingTime: recipe.cookingTime,
        difficulty: recipe.difficulty,
        tags: recipe.tags,
        created_at: new Date().toISOString(), // Add missing created_at field
      };
      const { data, error } = await supabase.from('recipes').insert(recipeData).select().single();

      if (error) {
        logger.error('Error adding recipe:', error);
        return null;
      }

      return data;
    } catch (error) {
      logger.error('Meal service error:', error);
      return null;
    }
  }

  /**
   * Get meal statistics
   */
  static async getMealStats(userId: string): Promise<{
    totalMeals: number;
    plannedMeals: number;
    cookedMeals: number;
    skippedMeals: number;
  }> {
    try {
      const { data, error } = await supabase.from('meals').select('status').eq('user_id', userId);

      if (error) {
        logger.error('Error fetching meal stats:', error);
        return {
          totalMeals: 0,
          plannedMeals: 0,
          cookedMeals: 0,
          skippedMeals: 0,
        };
      }

      const meals = data || [];
      return {
        totalMeals: meals.length,
        plannedMeals: meals.filter((m: any) => m.status === 'planned').length,
        cookedMeals: meals.filter((m: any) => m.status === 'cooked').length,
        skippedMeals: meals.filter((m: any) => m.status === 'skipped').length,
      };
    } catch (error) {
      logger.error('Meal service error:', error);
      return {
        totalMeals: 0,
        plannedMeals: 0,
        cookedMeals: 0,
        skippedMeals: 0,
      };
    }
  }
}
