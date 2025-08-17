// Simple API endpoint for MealDB discovery
// This can be called from your frontend: fetch('/api/discovery?limit=24&budget=30')

interface MealDbResponse {
  meals: Array<{
    idMeal: string;
    strMeal: string;
    strMealThumb?: string;
    strInstructions?: string;
    strArea?: string;
    strCategory?: string;
    strYoutube?: string;
    strSource?: string;
    strTags?: string;
    [key: string]: any; // For ingredients and measures
  }> | null;
}

/**
 * Fetch meals from MealDB with optional filtering
 */
async function fetchMealsFromMealDb(limit: number, budget?: number): Promise<any[]> {
  try {
    // Fetch random meals from MealDB
    const response = await fetch('https://www.themealdb.com/api/json/v1/1/random.php');

    if (!response.ok) {
      throw new Error(`MealDB API failed: ${response.status}`);
    }

    const data: MealDbResponse = await response.json();

    if (!data.meals || data.meals.length === 0) {
      return [];
    }

    // For random endpoint, we get one meal, so we need to fetch multiple
    const meals: any[] = [];
    const seenIds = new Set<string>();

    // Fetch multiple random meals to get variety
    for (let i = 0; i < Math.min(limit * 2, 20); i++) {
      try {
        const randomResponse = await fetch('https://www.themealdb.com/api/json/v1/1/random.php');
        if (randomResponse.ok) {
          const randomData: MealDbResponse = await randomResponse.json();
          if (randomData.meals && randomData.meals[0]) {
            const meal = randomData.meals[0];
            if (!seenIds.has(meal.idMeal)) {
              seenIds.add(meal.idMeal);
              meals.push(meal);

              if (meals.length >= limit) break;
            }
          }
        }
      } catch (error) {
        console.warn('Failed to fetch random meal:', error);
        continue;
      }
    }

    // Normalize and filter meals
    const normalizedMeals = meals.map(meal => {
      // Parse ingredients
      const ingredients: Array<{ name: string; measure?: string }> = [];
      for (let i = 1; i <= 20; i++) {
        const ingredient = meal[`strIngredient${i}`];
        const measure = meal[`strMeasure${i}`];

        if (ingredient && ingredient.trim()) {
          ingredients.push({
            name: ingredient.trim(),
            measure: measure ? measure.trim() : undefined
          });
        }
      }

      // Estimate cooking time based on ingredients and complexity
      let estimatedTime: number | null = null;
      if (ingredients.length > 0) {
        if (ingredients.length <= 5) estimatedTime = 15;
        else if (ingredients.length <= 10) estimatedTime = 30;
        else if (ingredients.length <= 15) estimatedTime = 45;
        else estimatedTime = 60;
      }

      return {
        idMeal: meal.idMeal,
        strMeal: meal.strMeal,
        strMealThumb: meal.strMealThumb,
        strInstructions: meal.strInstructions,
        strArea: meal.strArea,
        strCategory: meal.strCategory,
        strYoutube: meal.strYoutube,
        strSource: meal.strSource,
        strTags: meal.strTags,
        ingredients,
        total_time_min: estimatedTime
      };
    });

    // Apply budget filter if specified
    if (budget) {
      return normalizedMeals.filter(meal =>
        !meal.total_time_min || meal.total_time_min <= budget
      );
    }

    return normalizedMeals;
  } catch (error) {
    console.error('Error fetching from MealDB:', error);
    return [];
  }
}

// Simple API handler for Vite
export async function handleDiscoveryAPI(request: Request): Promise<Response> {
  try {
    const url = new URL(request.url);
    const limit = Number(url.searchParams.get('limit') ?? 24);
    const budget = url.searchParams.get('budget') ? Number(url.searchParams.get('budget')) : undefined;

    // Validate parameters
    if (limit > 50) {
      return new Response(JSON.stringify({ error: 'Limit too high' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Fetch meals from MealDB
    const meals = await fetchMealsFromMealDb(limit, budget);

    // Return with caching headers
    return new Response(JSON.stringify(meals), {
      headers: {
        'Cache-Control': 's-maxage=60, stale-while-revalidate=120',
        'Content-Type': 'application/json'
      }
    });
  } catch (error) {
    console.error('Discovery API error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
}

// Export for use in your Vite setup
export { fetchMealsFromMealDb };
