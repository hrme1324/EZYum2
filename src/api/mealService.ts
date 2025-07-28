import { Meal, Recipe } from '../types';
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
        console.error('Error fetching meals:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Meal service error:', error);
      return [];
    }
  }

  /**
   * Get meals for a date range
   */
  static async getMealsForDateRange(userId: string, startDate: string, endDate: string): Promise<Meal[]> {
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
        console.error('Error fetching meals for date range:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Meal service error:', error);
      return [];
    }
  }

  /**
   * Add a meal
   */
  static async addMeal(userId: string, meal: Omit<Meal, 'id' | 'user_id' | 'created_at'>): Promise<Meal | null> {
    try {
      const { data, error } = await supabase
        .from('meals')
        .insert({
          user_id: userId,
          date: meal.date,
          meal_type: meal.meal_type,
          recipe_id: meal.recipe_id,
          status: meal.status || 'planned',
          notes: meal.notes,
        })
        .select()
        .single();

      if (error) {
        console.error('Error adding meal:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Meal service error:', error);
      return null;
    }
  }

  /**
   * Update a meal
   */
  static async updateMeal(userId: string, mealId: string, updates: Partial<Meal>): Promise<Meal | null> {
    try {
      const { data, error } = await supabase
        .from('meals')
        .update(updates)
        .eq('id', mealId)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        console.error('Error updating meal:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Meal service error:', error);
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
        console.error('Error deleting meal:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Meal service error:', error);
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
        console.error('Error fetching recipes:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Meal service error:', error);
      return [];
    }
  }

  /**
   * Add a recipe
   */
  static async addRecipe(userId: string, recipe: Omit<Recipe, 'id' | 'user_id' | 'created_at'>): Promise<Recipe | null> {
    try {
      const { data, error } = await supabase
        .from('recipes')
        .insert({
          user_id: userId,
          name: recipe.name,
          source_url: recipe.source_url,
          ingredients: recipe.ingredients,
          cook_time: recipe.cook_time,
          equipment: recipe.equipment,
          instructions: recipe.instructions,
          image_url: recipe.image_url,
        })
        .select()
        .single();

      if (error) {
        console.error('Error adding recipe:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Meal service error:', error);
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
      const { data, error } = await supabase
        .from('meals')
        .select('status')
        .eq('user_id', userId);

      if (error) {
        console.error('Error fetching meal stats:', error);
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
        plannedMeals: meals.filter(m => m.status === 'planned').length,
        cookedMeals: meals.filter(m => m.status === 'cooked').length,
        skippedMeals: meals.filter(m => m.status === 'skipped').length,
      };
    } catch (error) {
      console.error('Meal service error:', error);
      return {
        totalMeals: 0,
        plannedMeals: 0,
        cookedMeals: 0,
        skippedMeals: 0,
      };
    }
  }
}
