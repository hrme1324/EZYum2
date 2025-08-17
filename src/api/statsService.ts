import { supabase } from './supabase';

export interface UserStats {
  user_id: string;
  points: number;
  current_streak: number;
  longest_streak: number;
  last_cooked_on: string | null;
  updated_at: string;
}

export interface UserAward {
  id: string;
  user_id: string;
  award_key: string;
  earned_at: string;
}

export interface RecipeCompletion {
  id: string;
  user_id: string;
  recipe_id: string;
  completed_at: string;
  source?: string;
  notes?: string;
}

export class StatsService {
  /**
   * Mark a recipe as completed for a user
   */
  static async markRecipeCompleted(
    userId: string,
    recipeId: string,
    source?: string,
    notes?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('recipe_completions')
        .insert({
          user_id: userId,
          recipe_id: recipeId,
          source: source || 'manual',
          notes
        });

      if (error) {
        console.error('Error marking recipe completed:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Error marking recipe completed:', error);
      return { success: false, error: 'Failed to mark recipe as completed' };
    }
  }

  /**
   * Get user stats
   */
  static async getUserStats(userId: string): Promise<UserStats | null> {
    try {
      const { data, error } = await supabase
        .from('user_stats')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching user stats:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error fetching user stats:', error);
      return null;
    }
  }

  /**
   * Get user awards
   */
  static async getUserAwards(userId: string): Promise<UserAward[]> {
    try {
      const { data, error } = await supabase
        .from('user_awards')
        .select('*')
        .eq('user_id', userId)
        .order('earned_at', { ascending: false });

      if (error) {
        console.error('Error fetching user awards:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching user awards:', error);
      return [];
    }
  }

  /**
   * Get user recipe completions
   */
  static async getUserCompletions(
    userId: string,
    limit: number = 50
  ): Promise<RecipeCompletion[]> {
    try {
      const { data, error } = await supabase
        .from('recipe_completions')
        .select('*')
        .eq('user_id', userId)
        .order('completed_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching user completions:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error fetching user completions:', error);
      return [];
    }
  }

  /**
   * Manually recompute user stats (useful for debugging or ensuring consistency)
   */
  static async recomputeStats(_userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase.rpc('recompute_my_stats');

      if (error) {
        console.error('Error recomputing stats:', error);
        return { success: false, error: error.message };
      }

      return { success: true };
    } catch (error) {
      console.error('Error recomputing stats:', error);
      return { success: false, error: 'Failed to recompute stats' };
    }
  }

  /**
   * Get completion count for a specific recipe
   */
  static async getRecipeCompletionCount(
    userId: string,
    recipeId: string
  ): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('recipe_completions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('recipe_id', recipeId);

      if (error) {
        console.error('Error fetching recipe completion count:', error);
        return 0;
      }

      return count || 0;
    } catch (error) {
      console.error('Error fetching recipe completion count:', error);
      return 0;
    }
  }

  /**
   * Check if user has completed a recipe today
   */
  static async hasCompletedToday(userId: string): Promise<boolean> {
    try {
      const today = new Date().toISOString().split('T')[0];

      const { count, error } = await supabase
        .from('recipe_completions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .gte('completed_at', `${today}T00:00:00`)
        .lt('completed_at', `${today}T23:59:59`);

      if (error) {
        console.error('Error checking today completion:', error);
        return false;
      }

      return (count || 0) > 0;
    } catch (error) {
      console.error('Error checking today completion:', error);
      return false;
    }
  }
}
