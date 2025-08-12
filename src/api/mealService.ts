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
        .from('meals')
        .select('*')
        .eq('user_id', userId)
        .eq('date', date)
        .order('meal_type');

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
        .from('meals')
        .select('*')
        .eq('user_id', userId)
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date')
        .order('meal_type');

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
        .from('meals')
        .select(
          `
          *,
          recipe:recipes(*)
        `,
        )
        .eq('user_id', userId)
        .order('date', { ascending: false })
        .order('meal_type');

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
   * Add a meal
   */
  static async addMeal(
    userId: string,
    meal: Omit<Meal, 'id' | 'user_id' | 'created_at'>,
  ): Promise<Meal | null> {
    try {
      // Handle MealDB recipe IDs (strings) vs UUID recipe IDs
      let recipeId = meal.recipe_id;

      // If recipe_id is a MealDB ID (numeric string), we need to find the corresponding recipe in our database
      if (recipeId && (/(^\d+$)/).test(recipeId)) {
        // This is a MealDB ID, find the corresponding recipe in our database
        const { data: recipeData } = await supabase
          .from('recipes')
          .select('id')
          .eq('mealdb_id', recipeId)
          .eq('user_id', userId)
          .single();

        if (recipeData) {
          recipeId = recipeData.id;
        } else {
          // Recipe not found in our database, skip adding the meal
          logger.warn(`Recipe with MealDB ID ${recipeId} not found in user's recipes`);
          return null;
        }
      }

      const { data, error } = await supabase
        .from('meals')
        .insert({
          user_id: userId,
          date: meal.date,
          meal_type: meal.meal_type,
          recipe_id: recipeId,
          status: meal.status || 'planned',
          notes: meal.notes,
        })
        .select()
        .single();

      if (error) {
        logger.error('Error adding meal:', error);
        return null;
      }

      return data;
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
      const { data, error } = await supabase
        .from('meals')
        .update(updates)
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
        .from('meals')
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
