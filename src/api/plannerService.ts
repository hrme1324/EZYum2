import { logger } from '../utils/logger';
import { supabase } from './supabase';

export interface PlannerEntry {
  id: string;
  user_id: string;
  plan_date: string;
  meal_slot: string;
  recipe_id: string;
  source: 'manual' | 'max_streak' | 'suggested';
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface PlannerEntryWithRecipe extends PlannerEntry {
  recipe: {
    id: string;
    name: string;
    image?: string;
    category?: string;
    area?: string;
    ingredients: any[];
    instructions?: string;
    total_time_min?: number;
    difficulty?: string;
  };
}

export class PlannerService {
  /**
   * Get planner entries for a specific date
   */
  static async getPlannerEntriesForDate(userId: string, date: string): Promise<PlannerEntryWithRecipe[]> {
    try {
      const { data, error } = await supabase
        .from('planner_entries')
        .select(`
          *,
          recipe:recipes (
            id, name, image, category, area, ingredients, instructions,
            total_time_min, difficulty
          )
        `)
        .eq('user_id', userId)
        .eq('plan_date', date)
        .order('meal_slot');

      if (error) {
        logger.error('Error fetching planner entries for date:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      logger.error('Planner service error:', error);
      return [];
    }
  }

  /**
   * Get planner entries for a date range
   */
  static async getPlannerEntriesForDateRange(
    userId: string,
    startDate: string,
    endDate: string
  ): Promise<PlannerEntryWithRecipe[]> {
    try {
      const { data, error } = await supabase
        .from('planner_entries')
        .select(`
          *,
          recipe:recipes (
            id, name, image, category, area, ingredients, instructions,
            total_time_min, difficulty
          )
        `)
        .eq('user_id', userId)
        .gte('plan_date', startDate)
        .lte('plan_date', endDate)
        .order('plan_date')
        .order('meal_slot');

      if (error) {
        logger.error('Error fetching planner entries for date range:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      logger.error('Planner service error:', error);
      return [];
    }
  }

  /**
   * Add a recipe to the planner
   */
  static async addToPlanner(
    userId: string,
    planDate: string,
    mealSlot: string,
    recipeId: string,
    source: 'manual' | 'max_streak' | 'suggested' = 'manual',
    notes?: string
  ): Promise<PlannerEntry> {
    try {
      const { data, error } = await supabase
        .from('planner_entries')
        .upsert({
          user_id: userId,
          plan_date: planDate,
          meal_slot: mealSlot,
          recipe_id: recipeId,
          source,
          notes,
        }, {
          onConflict: 'user_id,plan_date,meal_slot'
        })
        .select()
        .single();

      if (error) {
        console.error('[planner insert error]', {
          message: error.message, code: error.code, details: error.details, hint: error.hint
        });
        throw new Error(error.message || 'Planner insert failed');
      }

      return data;
    } catch (error) {
      logger.error('Planner service error:', error);
      throw error;
    }
  }

  /**
   * Update a planner entry
   */
  static async updatePlannerEntry(
    userId: string,
    entryId: string,
    updates: Partial<PlannerEntry>
  ): Promise<PlannerEntry | null> {
    try {
      const { data, error } = await supabase
        .from('planner_entries')
        .update(updates)
        .eq('id', entryId)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        logger.error('Error updating planner entry:', error);
        return null;
      }

      return data;
    } catch (error) {
      logger.error('Planner service error:', error);
      return null;
    }
  }

  /**
   * Remove a recipe from the planner
   */
  static async removeFromPlanner(userId: string, entryId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('planner_entries')
        .delete()
        .eq('id', entryId)
        .eq('user_id', userId);

      if (error) {
        logger.error('Error removing from planner:', error);
        return false;
      }

      return true;
    } catch (error) {
      logger.error('Planner service error:', error);
      return false;
    }
  }

  /**
   * Get the current week's planner entries
   */
  static async getCurrentWeekPlanner(userId: string): Promise<PlannerEntryWithRecipe[]> {
    try {
      const startOfWeek = new Date();
      startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(endOfWeek.getDate() + 6);

      return await this.getPlannerEntriesForDateRange(
        userId,
        startOfWeek.toISOString().split('T')[0],
        endOfWeek.toISOString().split('T')[0]
      );
    } catch (error) {
      logger.error('Error getting current week planner:', error);
      return [];
    }
  }

  /**
   * Get planner statistics
   */
  static async getPlannerStats(userId: string): Promise<{
    totalPlanned: number;
    plannedThisWeek: number;
    plannedToday: number;
  }> {
    try {
      const today = new Date().toISOString().split('T')[0];

      // Get total planned
      const { count: totalPlanned } = await supabase
        .from('planner_entries')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      // Get planned this week
      const startOfWeek = new Date();
      startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(endOfWeek.getDate() + 6);

      const { count: plannedThisWeek } = await supabase
        .from('planner_entries')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .gte('plan_date', startOfWeek.toISOString().split('T')[0])
        .lte('plan_date', endOfWeek.toISOString().split('T')[0]);

      // Get planned today
      const { count: plannedToday } = await supabase
        .from('planner_entries')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('plan_date', today);

      return {
        totalPlanned: totalPlanned || 0,
        plannedThisWeek: plannedThisWeek || 0,
        plannedToday: plannedToday || 0,
      };
    } catch (error) {
      logger.error('Error getting planner stats:', error);
      return {
        totalPlanned: 0,
        plannedThisWeek: 0,
        plannedToday: 0,
      };
    }
  }
}
