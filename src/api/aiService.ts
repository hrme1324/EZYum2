import { Recipe } from '../components/RecipeCard';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001/api';

// Helper function to extract ingredients from MealDB response
const extractIngredients = (meal: any): Array<{ name: string; measure: string }> => {
  const ingredients = [];
  for (let i = 1; i <= 20; i++) {
    const ingredient = meal[`strIngredient${i}`];
    const measure = meal[`strMeasure${i}`];
    if (ingredient && ingredient.trim()) {
      ingredients.push({
        name: ingredient.trim(),
        measure: measure ? measure.trim() : ''
      });
    }
  }
  return ingredients;
};

// Helper function to format MealDB meal to Recipe format
const formatMealDBMeal = (meal: any): Recipe => {
  return {
    id: meal.idMeal,
    name: meal.strMeal,
    category: meal.strCategory,
    area: meal.strArea,
    instructions: meal.strInstructions,
    image: meal.strMealThumb,
    tags: meal.strTags ? meal.strTags.split(',').map((tag: string) => tag.trim()) : [],
    videoUrl: meal.strYoutube || null,
    websiteUrl: meal.strSource || null,
    ingredients: extractIngredients(meal),
    cookingTime: '30 min', // Default since MealDB doesn't provide this
    difficulty: 'Medium' as 'Easy' | 'Medium' | 'Hard', // Default since MealDB doesn't provide this
  };
};

export class RecipeService {
  /**
   * Search for recipes using MealDB
   */
  static async searchRecipes(query: string): Promise<Recipe[]> {
    try {
      const response = await fetch(`${BACKEND_URL}/recipes/search?query=${encodeURIComponent(query)}`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // Handle both MealDB format and our custom format
      if (data.meals) {
        // MealDB format
        return data.meals.map(formatMealDBMeal);
      } else if (Array.isArray(data)) {
        // Our custom format
        return data;
      } else {
        return [];
      }
    } catch (error) {
      console.error('Error searching recipes:', error);
      return [];
    }
  }

  /**
   * Get a random recipe from MealDB
   */
  static async getRandomRecipe(): Promise<Recipe | null> {
    try {
      const response = await fetch(`${BACKEND_URL}/recipes/random`);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      // Handle both MealDB format and our custom format
      if (data.meals && data.meals[0]) {
        // MealDB format
        return formatMealDBMeal(data.meals[0]);
      } else if (data.id) {
        // Our custom format
        return data;
      } else {
        return null;
      }
    } catch (error) {
      console.error('Error getting random recipe:', error);
      return null;
    }
  }

  /**
   * Health check for the backend
   */
  static async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${BACKEND_URL}/health`);
      return response.ok;
    } catch (error) {
      console.error('Backend health check failed:', error);
      return false;
    }
  }
}

// Keep the old name for backward compatibility
export const AIService = RecipeService;
