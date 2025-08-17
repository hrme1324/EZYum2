import { logger } from './logger';

export interface DiscoveryFilters {
  limit?: number;
  budget?: number;
  category?: string;
  area?: string;
}

export interface MealDbRecipe {
  idMeal: string;
  strMeal: string;
  strMealThumb?: string;
  strInstructions?: string;
  strArea?: string;
  strCategory?: string;
  total_time_min?: number | null;
  ingredients?: Array<{ name: string; measure?: string }>;
  strYoutube?: string;
  strSource?: string;
  strTags?: string;
}

/**
 * Fetch discovery recipes directly from MealDB API
 * This is the primary source for discovery/for-you content
 */
export async function getDiscoveryFromAPI(filters: DiscoveryFilters = {}): Promise<MealDbRecipe[]> {
  const { limit = 24, budget, category, area } = filters;

  try {
    logger.info('[discovery] API-first fetch', { limit, budget, category, area });

    // Call your own API route that proxies MealDB
    const params = new URLSearchParams();
    params.append('limit', limit.toString());
    if (budget) params.append('budget', budget.toString());
    if (category) params.append('category', category);
    if (area) params.append('area', area);

    const url = `/api/discovery?${params.toString()}`;
    const res = await fetch(url, {
      cache: 'no-store' // or let the route set s-maxage
    });

    if (!res.ok) {
      throw new Error(`Discovery API failed: ${res.status}`);
    }

    const items = await res.json();
    logger.info('[discovery] API response received', { count: items.length });

    return items;
  } catch (error) {
    logger.error('[discovery] API fetch failed:', error);
    throw error;
  }
}

/**
 * Fallback to CSV seeds if you still want to show them
 * This is optional and can be removed if you don't need it
 */
export async function getCsvSeeds(supabase: any, { limit = 24 }: { limit?: number } = {}) {
  try {
    const { data, error } = await supabase
      .from('recipes_discovery')
      .select('*')
      .order('sort_seed')
      .order('updated_at', { ascending: false })
      .limit(limit);

    if (error) {
      logger.error('[csv-seeds] Error fetching CSV seeds:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    logger.error('[csv-seeds] Error in getCsvSeeds:', error);
    return [];
  }
}

/**
 * Hybrid approach: try API first, fallback to CSV seeds
 * This ensures users always see content even if MealDB is down
 */
export async function getDiscoveryHybrid(
  supabase: any,
  filters: DiscoveryFilters = {}
): Promise<MealDbRecipe[]> {
  try {
    // Try API first
    const apiResults = await getDiscoveryFromAPI(filters);
    if (apiResults.length > 0) {
      logger.info('[discovery] Using API results', { count: apiResults.length });
      return apiResults;
    }
  } catch (error) {
    logger.warn('[discovery] API failed, falling back to CSV seeds:', error);
  }

  // Fallback to CSV seeds
  try {
    const csvResults = await getCsvSeeds(supabase, { limit: filters.limit });
    logger.info('[discovery] Using CSV fallback', { count: csvResults.length });
    return csvResults;
  } catch (error) {
    logger.error('[discovery] Both API and CSV failed:', error);
    return [];
  }
}

/**
 * Get a specific recipe by MealDB ID
 */
export async function getMealDbRecipeById(id: string): Promise<MealDbRecipe | null> {
  try {
    const res = await fetch(`/api/meal/${id}`);

    if (!res.ok) {
      if (res.status === 404) {
        return null; // Recipe not found
      }
      throw new Error(`Meal API failed: ${res.status}`);
    }

    const recipe = await res.json();
    return recipe;
  } catch (error) {
    logger.error('[meal-detail] API fetch failed:', error);
    return null;
  }
}

/**
 * Search recipes by query
 */
export async function searchMealDbRecipes(query: string, limit: number = 20): Promise<MealDbRecipe[]> {
  try {
    const params = new URLSearchParams();
    params.append('query', query);
    params.append('limit', limit.toString());

    const res = await fetch(`/api/search?${params.toString()}`);

    if (!res.ok) {
      throw new Error(`Search API failed: ${res.status}`);
    }

    const results = await res.json();
    return results;
  } catch (error) {
    logger.error('[search] API fetch failed:', error);
    return [];
  }
}

/**
 * Get random recipes for variety
 */
export async function getRandomMealDbRecipes(limit: number = 10): Promise<MealDbRecipe[]> {
  try {
    const params = new URLSearchParams();
    params.append('limit', limit.toString());

    const res = await fetch(`/api/random?${params.toString()}`);

    if (!res.ok) {
      throw new Error(`Random API failed: ${res.status}`);
    }

    const results = await res.json();
    return results;
  } catch (error) {
    logger.error('[random] API fetch failed:', error);
    return [];
  }
}

/**
 * Get recipes by category
 */
export async function getMealDbRecipesByCategory(category: string, limit: number = 20): Promise<MealDbRecipe[]> {
  try {
    const params = new URLSearchParams();
    params.append('category', category);
    params.append('limit', limit.toString());

    const res = await fetch(`/api/category/${category}?${params.toString()}`);

    if (!res.ok) {
      throw new Error(`Category API failed: ${res.status}`);
    }

    const results = await res.json();
    return results;
  } catch (error) {
    logger.error('[category] API fetch failed:', error);
    return [];
  }
}
