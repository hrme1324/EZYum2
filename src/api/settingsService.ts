import { UserAllergen, UserAppliance, UserSettings } from '../types';
import { logger } from '../utils/logger';
import { supabase } from './supabase';

export class SettingsService {
  /**
   * Get user settings
   */
  static async getUserSettings(userId: string): Promise<UserSettings | null> {
    try {
      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle(); // Use maybeSingle instead of single to handle no rows

      if (error) {
        logger.error('Error fetching user settings:', error);
        return null;
      }

      // If no settings exist, create default settings
      if (!data) {
        const defaultSettings = await this.upsertUserSettings(userId, {
          time_budget: 30,
          notifications_enabled: true,
          dark_mode: false,
          meal_reminders: true,
          grocery_reminders: true,
        });
        return defaultSettings;
      }

      return data;
    } catch (error) {
      logger.error('Settings service error:', error);
      return null;
    }
  }

  /**
   * Create or update user settings
   */
  static async upsertUserSettings(
    userId: string,
    settings: Partial<UserSettings>,
  ): Promise<UserSettings | null> {
    try {
      const { data, error } = await supabase
        .from('user_settings')
        .upsert({
          user_id: userId,
          ...settings,
          updated_at: new Date().toISOString(),
        })
        .select()
        .single();

      if (error) {
        logger.error('Error upserting user settings:', error);
        return null;
      }

      return data;
    } catch (error) {
      logger.error('Settings service error:', error);
      return null;
    }
  }

  /**
   * Initialize default settings for a user
   */
  static async initializeDefaultSettings(userId: string): Promise<UserSettings | null> {
    try {
      const defaultSettings = {
        user_id: userId,
        time_budget: 30,
        notifications_enabled: true,
        dark_mode: false,
        meal_reminders: true,
        grocery_reminders: true,
      };

      const { data, error } = await supabase
        .from('user_settings')
        .insert(defaultSettings)
        .select()
        .single();

      if (error) {
        logger.error('Error initializing default settings:', error);
        return null;
      }

      return data;
    } catch (error) {
      logger.error('Settings service error:', error);
      return null;
    }
  }

  /**
   * Get user allergens
   */
  static async getUserAllergens(userId: string): Promise<UserAllergen[]> {
    try {
      const { data, error } = await supabase
        .from('user_allergens')
        .select('*')
        .eq('user_id', userId)
        .order('allergen_name');

      if (error) {
        logger.error('Error fetching user allergens:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      logger.error('Settings service error:', error);
      return [];
    }
  }

  /**
   * Add user allergen
   */
  static async addUserAllergen(
    userId: string,
    allergen: Omit<UserAllergen, 'id' | 'user_id' | 'created_at'>,
  ): Promise<UserAllergen | null> {
    try {
      const { data, error } = await supabase
        .from('user_allergens')
        .insert({
          user_id: userId,
          allergen_name: allergen.allergen_name,
          severity: allergen.severity,
        })
        .select()
        .single();

      if (error) {
        logger.error('Error adding user allergen:', error);
        return null;
      }

      return data;
    } catch (error) {
      logger.error('Settings service error:', error);
      return null;
    }
  }

  /**
   * Remove user allergen
   */
  static async removeUserAllergen(userId: string, allergenId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('user_allergens')
        .delete()
        .eq('id', allergenId)
        .eq('user_id', userId);

      if (error) {
        logger.error('Error removing user allergen:', error);
        return false;
      }

      return true;
    } catch (error) {
      logger.error('Settings service error:', error);
      return false;
    }
  }

  /**
   * Get user appliances
   */
  static async getUserAppliances(userId: string): Promise<UserAppliance[]> {
    try {
      const { data, error } = await supabase
        .from('user_appliances')
        .select('*')
        .eq('user_id', userId)
        .order('appliance_name');

      if (error) {
        logger.error('Error fetching user appliances:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      logger.error('Settings service error:', error);
      return [];
    }
  }

  /**
   * Add user appliance
   */
  static async addUserAppliance(
    userId: string,
    appliance: Omit<UserAppliance, 'id' | 'user_id' | 'created_at'>,
  ): Promise<UserAppliance | null> {
    try {
      const { data, error } = await supabase
        .from('user_appliances')
        .insert({
          user_id: userId,
          appliance_name: appliance.appliance_name,
          appliance_type: appliance.appliance_type,
        })
        .select()
        .single();

      if (error) {
        logger.error('Error adding user appliance:', error);
        return null;
      }

      return data;
    } catch (error) {
      logger.error('Settings service error:', error);
      return null;
    }
  }

  /**
   * Remove user appliance
   */
  static async removeUserAppliance(userId: string, applianceId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('user_appliances')
        .delete()
        .eq('id', applianceId)
        .eq('user_id', userId);

      if (error) {
        logger.error('Error removing user appliance:', error);
        return false;
      }

      return true;
    } catch (error) {
      logger.error('Settings service error:', error);
      return false;
    }
  }

  /**
   * Get common allergens for suggestions
   */
  static getCommonAllergens(): string[] {
    return [
      'Peanuts',
      'Tree Nuts',
      'Milk',
      'Eggs',
      'Soy',
      'Wheat',
      'Fish',
      'Shellfish',
      'Gluten',
      'Lactose',
      'Sulfites',
      'Mustard',
      'Celery',
      'Sesame',
    ];
  }

  /**
   * Get common appliances for suggestions
   */
  static getCommonAppliances(): Array<{ name: string; type: string }> {
    return [
      { name: 'Microwave', type: 'cooking' },
      { name: 'Oven', type: 'cooking' },
      { name: 'Stovetop', type: 'cooking' },
      { name: 'Blender', type: 'preparation' },
      { name: 'Food Processor', type: 'preparation' },
      { name: 'Slow Cooker', type: 'cooking' },
      { name: 'Air Fryer', type: 'cooking' },
      { name: 'Instant Pot', type: 'cooking' },
      { name: 'Toaster', type: 'cooking' },
      { name: 'Coffee Maker', type: 'beverage' },
      { name: 'Stand Mixer', type: 'preparation' },
      { name: 'Hand Mixer', type: 'preparation' },
    ];
  }
}
