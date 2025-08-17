import { logger } from '../utils/logger';
import { supabase } from './supabase';

export interface UserSettings {
  id: string;
  user_id: string;
  prefs: Record<string, any>;
  time_budget_minutes?: number;
  onboarded_at?: string;
  pantry_seeded_at?: string;
  created_at: string;
  updated_at: string;
}

export class UserSettingsService {
  /**
   * Get user settings
   */
  static async getUserSettings(userId: string): Promise<UserSettings | null> {
    try {
      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (error) {
        logger.error('Error fetching user settings:', error);
        return null;
      }

      return data;
    } catch (error) {
      logger.error('User settings service error:', error);
      return null;
    }
  }

  /**
   * Create or update user settings
   */
  static async upsertUserSettings(
    userId: string,
    settings: Partial<Omit<UserSettings, 'id' | 'user_id' | 'created_at' | 'updated_at'>>
  ): Promise<UserSettings | null> {
    try {
      const { data, error } = await supabase
        .from('user_settings')
        .upsert({
          user_id: userId,
          ...settings,
        }, {
          onConflict: 'user_id'
        })
        .select()
        .single();

      if (error) {
        logger.error('Error upserting user settings:', error);
        return null;
      }

      return data;
    } catch (error) {
      logger.error('User settings service error:', error);
      return null;
    }
  }

  /**
   * Update specific user settings
   */
  static async updateUserSettings(
    userId: string,
    updates: Partial<Omit<UserSettings, 'id' | 'user_id' | 'created_at' | 'updated_at'>>
  ): Promise<UserSettings | null> {
    try {
      const { data, error } = await supabase
        .from('user_settings')
        .update(updates)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        logger.error('Error updating user settings:', error);
        return null;
      }

      return data;
    } catch (error) {
      logger.error('User settings service error:', error);
      return null;
    }
  }

  /**
   * Set time budget
   */
  static async setTimeBudget(userId: string, timeBudgetMinutes: number): Promise<boolean> {
    try {
      const result = await this.updateUserSettings(userId, { time_budget_minutes: timeBudgetMinutes });
      return result !== null;
    } catch (error) {
      logger.error('Error setting time budget:', error);
      return false;
    }
  }

  /**
   * Get time budget
   */
  static async getTimeBudget(userId: string): Promise<number | null> {
    try {
      const settings = await this.getUserSettings(userId);
      return settings?.time_budget_minutes || null;
    } catch (error) {
      logger.error('Error getting time budget:', error);
      return null;
    }
  }

  /**
   * Mark user as onboarded
   */
  static async markOnboarded(userId: string): Promise<boolean> {
    try {
      const result = await this.updateUserSettings(userId, {
        onboarded_at: new Date().toISOString()
      });
      return result !== null;
    } catch (error) {
      logger.error('Error marking user as onboarded:', error);
      return false;
    }
  }

  /**
   * Check if user is onboarded
   */
  static async isOnboarded(userId: string): Promise<boolean> {
    try {
      const settings = await this.getUserSettings(userId);
      return !!settings?.onboarded_at;
    } catch (error) {
      logger.error('Error checking if user is onboarded:', error);
      return false;
    }
  }

  /**
   * Mark pantry as seeded
   */
  static async markPantrySeeded(userId: string): Promise<boolean> {
    try {
      const result = await this.updateUserSettings(userId, {
        pantry_seeded_at: new Date().toISOString()
      });
      return result !== null;
    } catch (error) {
      logger.error('Error marking pantry as seeded:', error);
      return false;
    }
  }

  /**
   * Check if pantry has been seeded
   */
  static async isPantrySeeded(userId: string): Promise<boolean> {
    try {
      const settings = await this.getUserSettings(userId);
      return !!settings?.pantry_seeded_at;
    } catch (error) {
      logger.error('Error checking if pantry is seeded:', error);
      return false;
    }
  }

  /**
   * Update user preferences
   */
  static async updatePreferences(
    userId: string,
    preferences: Record<string, any>
  ): Promise<boolean> {
    try {
      const currentSettings = await this.getUserSettings(userId);
      const currentPrefs = currentSettings?.prefs || {};

      const result = await this.updateUserSettings(userId, {
        prefs: { ...currentPrefs, ...preferences }
      });

      return result !== null;
    } catch (error) {
      logger.error('Error updating preferences:', error);
      return false;
    }
  }

  /**
   * Get user preferences
   */
  static async getPreferences(userId: string): Promise<Record<string, any>> {
    try {
      const settings = await this.getUserSettings(userId);
      return settings?.prefs || {};
    } catch (error) {
      logger.error('Error getting preferences:', error);
      return {};
    }
  }

  /**
   * Initialize user settings for new user
   */
  static async initializeUserSettings(userId: string): Promise<UserSettings | null> {
    try {
      const defaultSettings = {
        user_id: userId,
        prefs: {},
        time_budget_minutes: 30, // Default 30 minutes
      };

      return await this.upsertUserSettings(userId, defaultSettings);
    } catch (error) {
      logger.error('Error initializing user settings:', error);
      return null;
    }
  }
}
