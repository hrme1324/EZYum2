import { GroceryItem } from '../types';
import { supabase } from './supabase';

export class GroceryService {
  /**
   * Get user's grocery list
   */
  static async getGroceryList(userId: string): Promise<GroceryItem[]> {
    try {
      console.log('Fetching grocery list for user:', userId);

      const { data, error } = await supabase
        .from('grocery_lists')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle(); // Changed from .single() to .maybeSingle()

      if (error) {
        console.error('Error fetching grocery list:', error);
        return [];
      }

      console.log('Grocery list data:', data);
      return data?.items || [];
    } catch (error) {
      console.error('Grocery service error:', error);
      return [];
    }
  }

  /**
   * Save grocery list
   */
  static async saveGroceryList(userId: string, items: GroceryItem[]): Promise<boolean> {
    try {
      console.log('Saving grocery list for user:', userId, 'with items:', items.length);

      // First, mark any existing active lists as inactive
      const { error: updateError } = await supabase
        .from('grocery_lists')
        .update({ status: 'inactive' })
        .eq('user_id', userId)
        .eq('status', 'active');

      if (updateError) {
        console.error('Error updating existing lists:', updateError);
        // Continue anyway, might be no existing lists
      }

      // Create new active list
      const { error } = await supabase
        .from('grocery_lists')
        .insert({
          user_id: userId,
          items: items,
          status: 'active',
        });

      if (error) {
        console.error('Error saving grocery list:', error);
        return false;
      }

      console.log('Grocery list saved successfully');
      return true;
    } catch (error) {
      console.error('Grocery service error:', error);
      return false;
    }
  }

  /**
   * Update grocery item
   */
  static async updateGroceryItem(userId: string, items: GroceryItem[]): Promise<boolean> {
    return this.saveGroceryList(userId, items);
  }

  /**
   * Add item to grocery list
   */
  static async addGroceryItem(userId: string, item: GroceryItem): Promise<boolean> {
    try {
      const currentItems = await this.getGroceryList(userId);
      const updatedItems = [...currentItems, item];
      return await this.saveGroceryList(userId, updatedItems);
    } catch (error) {
      console.error('Error adding grocery item:', error);
      return false;
    }
  }

  /**
   * Remove item from grocery list
   */
  static async removeGroceryItem(userId: string, itemIndex: number): Promise<boolean> {
    try {
      const currentItems = await this.getGroceryList(userId);
      const updatedItems = currentItems.filter((_, index) => index !== itemIndex);
      return await this.saveGroceryList(userId, updatedItems);
    } catch (error) {
      console.error('Error removing grocery item:', error);
      return false;
    }
  }

  /**
   * Toggle item checked status
   */
  static async toggleGroceryItem(userId: string, itemIndex: number): Promise<boolean> {
    try {
      const currentItems = await this.getGroceryList(userId);
      const updatedItems = currentItems.map((item, index) =>
        index === itemIndex ? { ...item, checked: !item.checked } : item
      );
      return await this.saveGroceryList(userId, updatedItems);
    } catch (error) {
      console.error('Error toggling grocery item:', error);
      return false;
    }
  }

  /**
   * Clear completed items
   */
  static async clearCompletedItems(userId: string): Promise<boolean> {
    try {
      const currentItems = await this.getGroceryList(userId);
      const updatedItems = currentItems.filter(item => !item.checked);
      return await this.saveGroceryList(userId, updatedItems);
    } catch (error) {
      console.error('Error clearing completed items:', error);
      return false;
    }
  }
}
