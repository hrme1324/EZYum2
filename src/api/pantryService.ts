import { PantryItem } from '../types';
import { supabase } from './supabase';

export class PantryService {
  /**
   * Get all pantry items for a user
   */
  static async getPantryItems(userId: string): Promise<PantryItem[]> {
    try {
      const { data, error } = await supabase
        .from('pantry_items')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching pantry items:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Pantry service error:', error);
      return [];
    }
  }

  /**
   * Add a new pantry item
   */
  static async addPantryItem(
    userId: string,
    item: Omit<PantryItem, 'id' | 'user_id' | 'created_at'>
  ): Promise<PantryItem | null> {
    try {
      const { data, error } = await supabase
        .from('pantry_items')
        .insert({
          user_id: userId,
          name: item.name,
          category: item.category,
          quantity: item.quantity,
          expiration: item.expiration || null,
          source: item.source || 'manual',
        })
        .select()
        .single();

      if (error) {
        console.error('Error adding pantry item:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Pantry service error:', error);
      return null;
    }
  }

  /**
   * Update a pantry item
   */
  static async updatePantryItem(
    userId: string,
    itemId: string,
    updates: Partial<PantryItem>
  ): Promise<PantryItem | null> {
    try {
      const { data, error } = await supabase
        .from('pantry_items')
        .update(updates)
        .eq('id', itemId)
        .eq('user_id', userId)
        .select()
        .single();

      if (error) {
        console.error('Error updating pantry item:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Pantry service error:', error);
      return null;
    }
  }

  /**
   * Delete a pantry item
   */
  static async deletePantryItem(userId: string, itemId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('pantry_items')
        .delete()
        .eq('id', itemId)
        .eq('user_id', userId);

      if (error) {
        console.error('Error deleting pantry item:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Pantry service error:', error);
      return false;
    }
  }

  /**
   * Get pantry statistics
   */
  static async getPantryStats(userId: string): Promise<{
    totalItems: number;
    expiringSoon: number;
    categories: Record<string, number>;
  }> {
    try {
      const items = await this.getPantryItems(userId);

      const today = new Date();
      const expiringSoon = items.filter((item) => {
        if (!item.expiration) return false;
        const expiration = new Date(item.expiration);
        const diffDays = Math.ceil(
          (expiration.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
        );
        return diffDays <= 7 && diffDays >= 0;
      }).length;

      const categories = items.reduce(
        (acc, item) => {
          acc[item.category] = (acc[item.category] || 0) + 1;
          return acc;
        },
        {} as Record<string, number>
      );

      return {
        totalItems: items.length,
        expiringSoon,
        categories,
      };
    } catch (error) {
      console.error('Error getting pantry stats:', error);
      return {
        totalItems: 0,
        expiringSoon: 0,
        categories: {},
      };
    }
  }
}
