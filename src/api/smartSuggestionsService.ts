import { UserSettings } from '../types';
import { AIService } from './aiService';
import { PantryService } from './pantryService';
import { supabase } from './supabase';

export interface SmartSuggestion {
  id: string;
  user_id: string;
  suggestion_type: 'recipe' | 'meal_plan' | 'grocery';
  title: string;
  description: string;
  reasoning: string;
  ingredients_needed: string[];
  ingredients_available: string[];
  estimated_time: number;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  created_at: string;
  used: boolean;
}

export class SmartSuggestionsService {
  private static readonly MAX_SUGGESTIONS_PER_DAY = 2;
  private static readonly SUGGESTION_CACHE_KEY = 'smart_suggestions_cache';

  /**
   * Get daily smart suggestions based on pantry and preferences
   */
  static async getDailySuggestions(userId: string): Promise<SmartSuggestion[]> {
    try {
      // Check if we've already given suggestions today
      const today = new Date().toISOString().split('T')[0];
      const existingSuggestions = await this.getTodaysSuggestions(userId, today);

      if (existingSuggestions.length >= this.MAX_SUGGESTIONS_PER_DAY) {
        return existingSuggestions;
      }

      // Get user data
      const [pantryItems, userSettings] = await Promise.all([
        PantryService.getPantryItems(userId),
        this.getUserSettings(userId)
      ]);

      if (pantryItems.length === 0) {
        return this.generateEmptyPantrySuggestions(userId);
      }

      // Generate new suggestions
      const newSuggestions = await this.generateSmartSuggestions(
        userId,
        pantryItems,
        userSettings,
        existingSuggestions.length
      );

      // Save new suggestions
      const savedSuggestions = await this.saveSuggestions(newSuggestions);

      return [...existingSuggestions, ...savedSuggestions];
    } catch (error) {
      console.error('Error getting daily suggestions:', error);
      return [];
    }
  }

  /**
   * Generate smart suggestions based on pantry items
   */
  private static async generateSmartSuggestions(
    userId: string,
    pantryItems: any[],
    userSettings: UserSettings | null,
    currentCount: number
  ): Promise<SmartSuggestion[]> {
    const suggestions: SmartSuggestion[] = [];
    const availableIngredients = pantryItems.map(item => item.name.toLowerCase());

    // Get AI recipe suggestions based on pantry
    try {
      const aiSuggestions = await AIService.getRecipeSuggestions(
        availableIngredients,
        userSettings?.time_budget ? `Quick meals under ${userSettings.time_budget} minutes` : '',
        ''
      );

      // Convert AI suggestions to smart suggestions
      for (const aiSuggestion of aiSuggestions.slice(0, 2)) {
        const suggestion: SmartSuggestion = {
          id: `suggestion_${Date.now()}_${Math.random()}`,
          user_id: userId,
          suggestion_type: 'recipe',
          title: aiSuggestion.name,
          description: aiSuggestion.description,
          reasoning: `Based on your pantry items: ${availableIngredients.slice(0, 3).join(', ')}`,
          ingredients_needed: aiSuggestion.ingredients.filter((ing: string) =>
            !availableIngredients.includes(ing.toLowerCase())
          ),
          ingredients_available: aiSuggestion.ingredients.filter((ing: string) =>
            availableIngredients.includes(ing.toLowerCase())
          ),
          estimated_time: this.parseTimeToMinutes(aiSuggestion.cookingTime),
          difficulty: aiSuggestion.difficulty,
          created_at: new Date().toISOString(),
          used: false
        };
        suggestions.push(suggestion);
      }
    } catch (error) {
      console.error('Error generating AI suggestions:', error);
    }

    // If we don't have enough AI suggestions, add pantry-based suggestions
    if (suggestions.length < (this.MAX_SUGGESTIONS_PER_DAY - currentCount)) {
      const pantrySuggestions = this.generatePantryBasedSuggestions(
        userId,
        pantryItems,
        userSettings
      );
      suggestions.push(...pantrySuggestions.slice(0, this.MAX_SUGGESTIONS_PER_DAY - currentCount - suggestions.length));
    }

    return suggestions;
  }

  /**
   * Generate suggestions for empty pantry
   */
  private static generateEmptyPantrySuggestions(userId: string): SmartSuggestion[] {
    return [
      {
        id: `suggestion_${Date.now()}_1`,
        user_id: userId,
        suggestion_type: 'grocery',
        title: 'Start Your Pantry',
        description: 'Add some basic ingredients to get started with meal planning',
        reasoning: 'Your pantry is empty. Here are some essential items to add:',
        ingredients_needed: ['Rice', 'Pasta', 'Canned tomatoes', 'Onions', 'Garlic', 'Olive oil'],
        ingredients_available: [],
        estimated_time: 15,
        difficulty: 'Easy',
        created_at: new Date().toISOString(),
        used: false
      },
      {
        id: `suggestion_${Date.now()}_2`,
        user_id: userId,
        suggestion_type: 'meal_plan',
        title: 'Quick Start Meal Plan',
        description: 'Simple meal ideas for beginners',
        reasoning: 'Perfect for getting started with meal planning',
        ingredients_needed: ['Chicken breast', 'Mixed vegetables', 'Quinoa'],
        ingredients_available: [],
        estimated_time: 30,
        difficulty: 'Easy',
        created_at: new Date().toISOString(),
        used: false
      }
    ];
  }

  /**
   * Generate pantry-based suggestions without AI
   */
  private static generatePantryBasedSuggestions(
    userId: string,
    pantryItems: any[],
    userSettings: UserSettings | null
  ): SmartSuggestion[] {
    const suggestions: SmartSuggestion[] = [];
    const categories = this.categorizePantryItems(pantryItems);

    // Suggest based on available ingredients
    if (categories.vegetables.length > 0 && categories.protein.length > 0) {
      suggestions.push({
        id: `suggestion_${Date.now()}_3`,
        user_id: userId,
        suggestion_type: 'recipe',
        title: 'Stir-Fry with Available Ingredients',
        description: `Quick stir-fry using your ${categories.protein[0]} and ${categories.vegetables[0]}`,
        reasoning: `You have protein and vegetables - perfect for a quick stir-fry!`,
        ingredients_needed: ['Soy sauce', 'Ginger'],
        ingredients_available: [...categories.protein, ...categories.vegetables],
        estimated_time: userSettings?.time_budget || 20,
        difficulty: 'Easy',
        created_at: new Date().toISOString(),
        used: false
      });
    }

    if (categories.grains.length > 0) {
      suggestions.push({
        id: `suggestion_${Date.now()}_4`,
        user_id: userId,
        suggestion_type: 'recipe',
        title: 'Grain Bowl',
        description: `Nutritious bowl using your ${categories.grains[0]}`,
        reasoning: `You have grains available - perfect for a healthy bowl!`,
        ingredients_needed: ['Fresh vegetables', 'Protein'],
        ingredients_available: categories.grains,
        estimated_time: 15,
        difficulty: 'Easy',
        created_at: new Date().toISOString(),
        used: false
      });
    }

    return suggestions;
  }

  /**
   * Categorize pantry items
   */
  private static categorizePantryItems(pantryItems: any[]): Record<string, string[]> {
    const categories: Record<string, string[]> = {
      protein: [],
      vegetables: [],
      grains: [],
      dairy: [],
      spices: [],
      other: []
    };

    const proteinKeywords = ['chicken', 'beef', 'pork', 'fish', 'tofu', 'eggs', 'beans'];
    const vegetableKeywords = ['carrot', 'onion', 'tomato', 'lettuce', 'spinach', 'broccoli'];
    const grainKeywords = ['rice', 'pasta', 'bread', 'quinoa', 'oats'];
    const dairyKeywords = ['milk', 'cheese', 'yogurt', 'butter'];
    const spiceKeywords = ['salt', 'pepper', 'garlic', 'ginger', 'cumin', 'oregano'];

    pantryItems.forEach(item => {
      const name = item.name.toLowerCase();
      if (proteinKeywords.some(keyword => name.includes(keyword))) {
        categories.protein.push(item.name);
      } else if (vegetableKeywords.some(keyword => name.includes(keyword))) {
        categories.vegetables.push(item.name);
      } else if (grainKeywords.some(keyword => name.includes(keyword))) {
        categories.grains.push(item.name);
      } else if (dairyKeywords.some(keyword => name.includes(keyword))) {
        categories.dairy.push(item.name);
      } else if (spiceKeywords.some(keyword => name.includes(keyword))) {
        categories.spices.push(item.name);
      } else {
        categories.other.push(item.name);
      }
    });

    return categories;
  }

  /**
   * Parse time string to minutes
   */
  private static parseTimeToMinutes(timeString: string): number {
    const time = timeString.toLowerCase();
    if (time.includes('min')) {
      const match = time.match(/(\d+)\s*min/);
      return match ? parseInt(match[1]) : 30;
    }
    if (time.includes('hour')) {
      const match = time.match(/(\d+)\s*hour/);
      return match ? parseInt(match[1]) * 60 : 60;
    }
    return 30; // Default
  }

  /**
   * Get today's suggestions
   */
  private static async getTodaysSuggestions(userId: string, date: string): Promise<SmartSuggestion[]> {
    try {
      const { data, error } = await supabase
        .from('smart_suggestions')
        .select('*')
        .eq('user_id', userId)
        .gte('created_at', `${date}T00:00:00`)
        .lte('created_at', `${date}T23:59:59`)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching today\'s suggestions:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error getting today\'s suggestions:', error);
      return [];
    }
  }

  /**
   * Save suggestions to database
   */
  private static async saveSuggestions(suggestions: SmartSuggestion[]): Promise<SmartSuggestion[]> {
    try {
      const { data, error } = await supabase
        .from('smart_suggestions')
        .insert(suggestions)
        .select();

      if (error) {
        console.error('Error saving suggestions:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error saving suggestions:', error);
      return [];
    }
  }

  /**
   * Get user settings
   */
  private static async getUserSettings(userId: string): Promise<UserSettings | null> {
    try {
      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        console.error('Error fetching user settings:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('Error getting user settings:', error);
      return null;
    }
  }

  /**
   * Mark suggestion as used
   */
  static async markSuggestionAsUsed(suggestionId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('smart_suggestions')
        .update({ used: true })
        .eq('id', suggestionId);

      if (error) {
        console.error('Error marking suggestion as used:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error marking suggestion as used:', error);
      return false;
    }
  }

  /**
   * Get suggestion statistics
   */
  static async getSuggestionStats(userId: string): Promise<{
    totalSuggestions: number;
    usedSuggestions: number;
    todaySuggestions: number;
  }> {
    try {
      const today = new Date().toISOString().split('T')[0];

      const [totalData, usedData, todayData] = await Promise.all([
        supabase.from('smart_suggestions').select('id', { count: 'exact' }).eq('user_id', userId),
        supabase.from('smart_suggestions').select('id', { count: 'exact' }).eq('user_id', userId).eq('used', true),
        supabase.from('smart_suggestions').select('id', { count: 'exact' }).eq('user_id', userId).gte('created_at', `${today}T00:00:00`)
      ]);

      return {
        totalSuggestions: totalData.count || 0,
        usedSuggestions: usedData.count || 0,
        todaySuggestions: todayData.count || 0
      };
    } catch (error) {
      console.error('Error getting suggestion stats:', error);
      return { totalSuggestions: 0, usedSuggestions: 0, todaySuggestions: 0 };
    }
  }
}
