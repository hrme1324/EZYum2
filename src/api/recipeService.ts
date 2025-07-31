import { Recipe } from '../components/RecipeCard';
import { supabase } from './supabase';

export interface UserRecipe extends Recipe {
  user_id: string;
  source_type: 'user' | 'mealdb';
  mealdb_id?: string;
  created_at: string;
  updated_at: string;
}

export class RecipeService {
  /**
   * Get user's saved recipes from Supabase
   */
  static async getUserRecipes(): Promise<UserRecipe[]> {
    try {
      const { data: recipes, error } = await supabase
        .from('recipes')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching user recipes:', error);
        throw error;
      }

      return recipes?.map(recipe => ({
        id: recipe.id,
        name: recipe.name,
        category: recipe.category,
        area: recipe.area,
        instructions: recipe.instructions,
        image: recipe.image,
        tags: recipe.tags || [],
        ingredients: recipe.ingredients || [],
        videoUrl: recipe.video_url,
        websiteUrl: recipe.website_url,
        cookingTime: recipe.cooking_time,
        difficulty: recipe.difficulty as 'Easy' | 'Medium' | 'Hard',
        user_id: recipe.user_id,
        source_type: recipe.source_type,
        mealdb_id: recipe.mealdb_id,
        created_at: recipe.created_at,
        updated_at: recipe.updated_at,
      })) || [];
    } catch (error) {
      console.error('Error getting user recipes:', error);
      return [];
    }
  }

  /**
   * Save a recipe to user's collection
   */
  static async saveRecipe(recipe: Omit<Recipe, 'id'>): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { error } = await supabase
        .from('recipes')
        .insert({
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
        console.error('Error saving recipe:', error);
        throw error;
      }

      return true;
    } catch (error) {
      console.error('Error saving recipe:', error);
      return false;
    }
  }

  /**
   * Save a MealDB recipe to user's collection
   */
  static async saveMealDBRecipe(recipe: Recipe, mealdbId: string): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      const { error } = await supabase
        .from('recipes')
        .insert({
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
          source_type: 'mealdb',
          mealdb_id: mealdbId,
        });

      if (error) {
        console.error('Error saving MealDB recipe:', error);
        throw error;
      }

      return true;
    } catch (error) {
      console.error('Error saving MealDB recipe:', error);
      return false;
    }
  }

  /**
   * Delete a recipe from user's collection
   */
  static async deleteRecipe(recipeId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('recipes')
        .delete()
        .eq('id', recipeId);

      if (error) {
        console.error('Error deleting recipe:', error);
        throw error;
      }

      return true;
    } catch (error) {
      console.error('Error deleting recipe:', error);
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

      const { error } = await supabase
        .from('recipes')
        .update(updateData)
        .eq('id', recipeId);

      if (error) {
        console.error('Error updating recipe:', error);
        throw error;
      }

      return true;
    } catch (error) {
      console.error('Error updating recipe:', error);
      return false;
    }
  }

  /**
   * Check if a MealDB recipe is already saved by the user
   */
  static async isRecipeSaved(mealdbId: string): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return false;

      const { data, error } = await supabase
        .from('recipes')
        .select('id')
        .eq('user_id', user.id)
        .eq('mealdb_id', mealdbId)
        .eq('source_type', 'mealdb')
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('Error checking if recipe is saved:', error);
        return false;
      }

      return !!data;
    } catch (error) {
      console.error('Error checking if recipe is saved:', error);
      return false;
    }
  }

  /**
   * Get user's weekly meal plan recipes
   */
  static async getWeeklyRecipes(): Promise<UserRecipe[]> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      // Get the current week's meals
      const startOfWeek = new Date();
      startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(endOfWeek.getDate() + 6);

      const { data: meals, error: mealsError } = await supabase
        .from('meals')
        .select(`
          *,
          recipes (*)
        `)
        .eq('user_id', user.id)
        .gte('date', startOfWeek.toISOString().split('T')[0])
        .lte('date', endOfWeek.toISOString().split('T')[0]);

      if (mealsError) {
        console.error('Error fetching weekly meals:', mealsError);
        return [];
      }

      // Extract recipes from meals
      const recipes: UserRecipe[] = [];
      meals?.forEach(meal => {
        if (meal.recipes) {
          const recipe = meal.recipes as any;
          recipes.push({
            id: recipe.id,
            name: recipe.name,
            category: recipe.category,
            area: recipe.area,
            instructions: recipe.instructions,
            image: recipe.image,
            tags: recipe.tags || [],
            ingredients: recipe.ingredients || [],
            videoUrl: recipe.video_url,
            websiteUrl: recipe.website_url,
            cookingTime: recipe.cooking_time,
            difficulty: recipe.difficulty as 'Easy' | 'Medium' | 'Hard',
            user_id: recipe.user_id,
            source_type: recipe.source_type,
            mealdb_id: recipe.mealdb_id,
            created_at: recipe.created_at,
            updated_at: recipe.updated_at,
          });
        }
      });

      return recipes;
    } catch (error) {
      console.error('Error getting weekly recipes:', error);
      return [];
    }
  }
}
