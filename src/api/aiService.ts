const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || '/api';

export interface RecipeSuggestion {
  name: string;
  description: string;
  cookingTime: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  ingredients: string[];
}

export interface FoodCategory {
  item: string;
  category: string;
  confidence: number;
}

export class AIService {
  static async getRecipeSuggestions(ingredients: string[], preferences: string = '', dietary: string = ''): Promise<RecipeSuggestion[]> {
    try {
      const response = await fetch(`${BACKEND_URL}/ai/recipe-suggestions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ingredients, preferences, dietary }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting recipe suggestions:', error);
      return [];
    }
  }

  static async categorizeFoodItems(foodItems: string[]): Promise<FoodCategory[]> {
    try {
      const response = await fetch(`${BACKEND_URL}/ai/food-categorization`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ foodItems }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error categorizing food items:', error);
      return [];
    }
  }

  static async searchRecipes(query: string): Promise<any> {
    try {
      const response = await fetch(`${BACKEND_URL}/recipes/search?query=${encodeURIComponent(query)}`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error searching recipes:', error);
      return [];
    }
  }

  static async getRandomRecipe(): Promise<any> {
    try {
      const response = await fetch(`${BACKEND_URL}/recipes/random`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting random recipe:', error);
      return null;
    }
  }

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
