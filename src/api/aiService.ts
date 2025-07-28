const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001/api';

export interface RecipeSuggestion {
  name: string;
  ingredients: string[];
  instructions: string[];
  cookTime: number;
}

export interface FoodCategory {
  label: string;
  confidence: number;
}

export class AIService {
  /**
   * Get recipe suggestions based on ingredients and preferences
   */
  static async getRecipeSuggestions(
    ingredients: string[],
    preferences: string = '',
    dietary: string = ''
  ): Promise<RecipeSuggestion[]> {
    try {
      const response = await fetch(`${BACKEND_URL}/ai/recipe-suggestions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ingredients,
          preferences,
          dietary,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      return data.suggestions || [];
    } catch (error) {
      console.error('Error getting recipe suggestions:', error);
      return [];
    }
  }

  /**
   * Categorize food items using AI
   */
  static async categorizeFoodItems(foodItems: string[]): Promise<FoodCategory[]> {
    try {
      const response = await fetch(`${BACKEND_URL}/ai/food-categorization`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          foodItems,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      return data.categories || [];
    } catch (error) {
      console.error('Error categorizing food items:', error);
      return [];
    }
  }

  /**
   * Search recipes from MealDB
   */
  static async searchRecipes(query: string): Promise<any> {
    try {
      const response = await fetch(`${BACKEND_URL}/recipes/search?query=${encodeURIComponent(query)}`);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error searching recipes:', error);
      return { meals: [] };
    }
  }

  /**
   * Get random recipe from MealDB
   */
  static async getRandomRecipe(): Promise<any> {
    try {
      const response = await fetch(`${BACKEND_URL}/recipes/random`);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting random recipe:', error);
      return { meals: [] };
    }
  }

  /**
   * Check if backend is available
   */
  static async checkBackendHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${BACKEND_URL}/health`);
      return response.ok;
    } catch (error) {
      console.error('Backend health check failed:', error);
      return false;
    }
  }
}
