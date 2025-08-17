import { logger } from '../utils/logger';
import { supabase } from './supabase';

export interface RecipeCompletion {
  id: string;
  user_id: string;
  recipe_id: string;
  completed_at: string;
  source: 'scheduled' | 'manual';
  notes?: string;
}

export interface UserStats {
  user_id: string;
  points: number;
  current_streak: number;
  longest_streak: number;
  last_cooked_on?: string;
  updated_at: string;
}

export class CompletionService {
  /**
   * Mark a recipe as completed
   */
  static async markRecipeCompleted(
    userId: string,
    recipeId: string,
    source: 'scheduled' | 'manual' = 'manual',
    notes?: string
  ): Promise<boolean> {
    try {
      // Insert completion record
      const { error: completionError } = await supabase
        .from('recipe_completions')
        .insert({
          user_id: userId,
          recipe_id: recipeId,
          source,
          notes,
          completed_at: new Date().toISOString(),
        });

      if (completionError) {
        logger.error('Error marking recipe as completed:', completionError);
        return false;
      }

      // Update user stats
      await this.updateUserStats(userId);

      return true;
    } catch (error) {
      logger.error('Error marking recipe as completed:', error);
      return false;
    }
  }

  /**
   * Get recipe completions for a user
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
        logger.error('Error fetching user completions:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      logger.error('Error getting user completions:', error);
      return [];
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
        logger.error('Error fetching user stats:', error);
        return null;
      }

      return data;
    } catch (error) {
      logger.error('Error getting user stats:', error);
      return null;
    }
  }

  /**
   * Update user stats based on completions
   */
  static async updateUserStats(userId: string): Promise<boolean> {
    try {
      // Get all completions for the user
      const { data: completions, error: completionsError } = await supabase
        .from('recipe_completions')
        .select('completed_at')
        .eq('user_id', userId)
        .order('completed_at', { ascending: false });

      if (completionsError) {
        logger.error('Error fetching completions for stats:', completionsError);
        return false;
      }

      if (!completions || completions.length === 0) {
        // No completions, set default stats
        await this.upsertUserStats(userId, {
          points: 0,
          current_streak: 0,
          longest_streak: 0,
        });
        return true;
      }

      // Calculate stats
      const stats = this.calculateStats(completions);

      // Update user stats
      await this.upsertUserStats(userId, stats);

      return true;
    } catch (error) {
      logger.error('Error updating user stats:', error);
      return false;
    }
  }

  /**
   * Calculate user stats from completions
   */
  private static calculateStats(completions: { completed_at: string }[]): {
    points: number;
    current_streak: number;
    longest_streak: number;
    last_cooked_on?: string;
  } {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 0;
    let lastCookedDate: Date | null = null;

    // Sort completions by date (newest first)
    const sortedCompletions = completions
      .map(c => new Date(c.completed_at))
      .sort((a, b) => b.getTime() - a.getTime());

    if (sortedCompletions.length > 0) {
      lastCookedDate = sortedCompletions[0];
    }

    // Calculate streaks
    for (let i = 0; i < sortedCompletions.length; i++) {
      const completionDate = new Date(sortedCompletions[i]);
      const completionDay = new Date(completionDate.getFullYear(), completionDate.getMonth(), completionDate.getDate());

      if (i === 0) {
        // First completion
        tempStreak = 1;
        if (completionDay.getTime() === today.getTime()) {
          currentStreak = 1;
        }
      } else {
        const prevCompletionDate = new Date(sortedCompletions[i - 1]);
        const prevCompletionDay = new Date(prevCompletionDate.getFullYear(), prevCompletionDate.getMonth(), prevCompletionDate.getDate());

        const dayDiff = Math.floor((prevCompletionDay.getTime() - completionDay.getTime()) / (1000 * 60 * 60 * 24));

        if (dayDiff === 1) {
          // Consecutive day
          tempStreak++;
          if (i === 0 && completionDay.getTime() === today.getTime()) {
            currentStreak = tempStreak;
          }
        } else {
          // Break in streak
          longestStreak = Math.max(longestStreak, tempStreak);
          tempStreak = 1;
        }
      }
    }

    // Update longest streak with final temp streak
    longestStreak = Math.max(longestStreak, tempStreak);

    // Calculate points (simple scoring: 10 points per completion + streak bonus)
    const basePoints = completions.length * 10;
    const streakBonus = Math.floor(currentStreak / 3) * 5; // Bonus every 3 days
    const points = basePoints + streakBonus;

    return {
      points,
      current_streak: currentStreak,
      longest_streak: longestStreak,
      last_cooked_on: lastCookedDate?.toISOString().split('T')[0],
    };
  }

  /**
   * Upsert user stats
   */
  private static async upsertUserStats(
    userId: string,
    stats: {
      points: number;
      current_streak: number;
      longest_streak: number;
      last_cooked_on?: string;
    }
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('user_stats')
        .upsert({
          user_id: userId,
          ...stats,
          updated_at: new Date().toISOString(),
        }, {
          onConflict: 'user_id'
        });

      if (error) {
        logger.error('Error upserting user stats:', error);
        return false;
      }

      return true;
    } catch (error) {
      logger.error('Error upserting user stats:', error);
      return false;
    }
  }

  /**
   * Get completion statistics for a user
   */
  static async getCompletionStats(userId: string): Promise<{
    totalCompletions: number;
    thisWeekCompletions: number;
    thisMonthCompletions: number;
    averageCompletionsPerWeek: number;
  }> {
    try {
      const { count: totalCompletions } = await supabase
        .from('recipe_completions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      // Get this week's completions
      const startOfWeek = new Date();
      startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(endOfWeek.getDate() + 6);

      const { count: thisWeekCompletions } = await supabase
        .from('recipe_completions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .gte('completed_at', startOfWeek.toISOString())
        .lte('completed_at', endOfWeek.toISOString());

      // Get this month's completions
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      const endOfMonth = new Date(startOfMonth.getFullYear(), startOfMonth.getMonth() + 1, 0);

      const { count: thisMonthCompletions } = await supabase
        .from('recipe_completions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .gte('completed_at', startOfMonth.toISOString())
        .lte('completed_at', endOfMonth.toISOString());

      // Calculate average per week (rough estimate)
      const totalCompletionsValue = totalCompletions || 0;
      const weeksSinceFirstCompletion = totalCompletionsValue > 0 ? Math.max(1, Math.ceil(totalCompletionsValue / 3)) : 1;
      const averageCompletionsPerWeek = totalCompletionsValue / weeksSinceFirstCompletion;

      return {
        totalCompletions: totalCompletions || 0,
        thisWeekCompletions: thisWeekCompletions || 0,
        thisMonthCompletions: thisMonthCompletions || 0,
        averageCompletionsPerWeek: Math.round(averageCompletionsPerWeek * 10) / 10,
      };
    } catch (error) {
      logger.error('Error getting completion stats:', error);
      return {
        totalCompletions: 0,
        thisWeekCompletions: 0,
        thisMonthCompletions: 0,
        averageCompletionsPerWeek: 0,
      };
    }
  }
}
