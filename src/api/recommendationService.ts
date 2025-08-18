import { Recipe } from '../types';
import { logger } from '../utils/logger';
import { fromDbRecipe } from './mappers';
import { supabase } from './supabase';

interface UserPreferences {
  favoriteIngredients: string[];
  favoriteCuisines: string[];
  dietaryRestrictions: string[];
  skillLevel: 'beginner' | 'intermediate' | 'advanced';
  cookingTime: 'quick' | 'medium' | 'long';
  spiceLevel: 'mild' | 'medium' | 'hot';
}

interface RecommendationContext {
  userId: string;
  lastSeenRecipes: string[]; // Recipe IDs user has seen recently
  userPreferences: UserPreferences;
  currentSession: string; // Unique session ID for variety
}

export class RecommendationService {
  private static readonly RECIPE_POOL_SIZE = 1000; // Pre-cached pool size
  private static readonly VARIETY_WINDOW = 50; // How many recipes to avoid repeating

  /**
   * Get intelligent, varied recommendations based on user preferences
   * Uses multiple strategies to ensure variety without performance impact
   */
  static async getPersonalizedRecommendations(
    userId: string,
    count: number = 12,
    forceVariety: boolean = true
  ): Promise<Recipe[]> {
    try {
      logger.debug(`[recommendations] Getting ${count} personalized recipes for user ${userId}`);

      // Get user preferences and context
      const context = await this.getRecommendationContext(userId);

      // Strategy 1: Preference-based recommendations (fastest)
      const preferenceRecipes = await this.getPreferenceBasedRecipes(context, count);

      // Strategy 2: Variety enhancement (ensures no repeats)
      const variedRecipes = forceVariety
        ? await this.applyVarietyEnhancement(preferenceRecipes, context)
        : preferenceRecipes;

      // Strategy 3: Session-based rotation (ensures fresh experience)
      const finalRecipes = await this.applySessionRotation(variedRecipes, context);

      logger.debug(`[recommendations] Generated ${finalRecipes.length} varied recommendations`);
      return finalRecipes;

    } catch (error) {
      logger.error('[recommendations] Error getting personalized recommendations:', error);
      // Fallback to random discovery if recommendation fails
      return this.getFallbackRecipes(count);
    }
  }

  /**
   * Get recipes based on user preferences (fastest strategy)
   */
  private static async getPreferenceBasedRecipes(
    context: RecommendationContext,
    count: number
  ): Promise<Recipe[]> {
    const { userPreferences } = context;

    // Build preference-based query
    let query = supabase
      .from('recipes')
      .select('id,name,image,category,area,tags,ingredients,cooking_time,difficulty,created_at,updated_at')
      .is('user_id', null) // Only public seeds
      .eq('source_type', 'seed')
      .limit(count * 3); // Get more to allow for variety filtering

    // Apply preference filters
    if (userPreferences.favoriteIngredients.length > 0) {
      // Use GIN index on ingredients for fast search
      const ingredientFilter = userPreferences.favoriteIngredients
        .map(ing => `"${ing.toLowerCase()}"`)
        .join(' | ');
      query = query.textSearch('ingredients', ingredientFilter, {
        type: 'websearch',
        config: 'english'
      });
    }

    if (userPreferences.favoriteCuisines.length > 0) {
      query = query.in('area', userPreferences.favoriteCuisines);
    }

    if (userPreferences.dietaryRestrictions.length > 0) {
      // Exclude recipes with restricted ingredients
      const restrictions = userPreferences.dietaryRestrictions.join(' | ');
      query = query.not('ingredients', 'ilike', `%${restrictions}%`);
    }

    // Apply skill level filter
    if (userPreferences.skillLevel === 'beginner') {
      query = query.eq('difficulty', 'Easy');
    } else if (userPreferences.skillLevel === 'intermediate') {
      query = query.in('difficulty', ['Easy', 'Medium']);
    }

    // Apply cooking time filter
    if (userPreferences.cookingTime === 'quick') {
      query = query.lte('total_time_min', 30);
    } else if (userPreferences.cookingTime === 'medium') {
      query = query.lte('total_time_min', 60);
    }

    // Use session-based offset for variety
    const sessionOffset = this.getSessionOffset(context.currentSession);
    query = query.range(sessionOffset, (sessionOffset + (count * 3)) - 1);

    const { data: recipes, error } = await query;

    if (error) {
      logger.error('[recommendations] Error in preference-based query:', error);
      throw error;
    }

    return (recipes || []).map(fromDbRecipe);
  }

  /**
   * Apply variety enhancement to avoid recent repeats
   */
  private static async applyVarietyEnhancement(
    recipes: Recipe[],
    context: RecommendationContext
  ): Promise<Recipe[]> {
    if (recipes.length === 0) return recipes;

    // Get recently seen recipes to avoid
    const recentRecipes = await this.getRecentlySeenRecipes(context.userId, this.VARIETY_WINDOW);
    const seenIds = new Set(recentRecipes.map(r => r.recipe_id));

    // Filter out recently seen recipes
    const uniqueRecipes = recipes.filter(recipe => !seenIds.has(recipe.id));

    // If we don't have enough unique recipes, fetch more
    if (uniqueRecipes.length < 12) {
      const additionalRecipes = await this.getAdditionalVarietyRecipes(
        context,
        12 - uniqueRecipes.length,
        seenIds
      );
      uniqueRecipes.push(...additionalRecipes);
    }

    return uniqueRecipes.slice(0, 12);
  }

  /**
   * Apply session-based rotation for fresh experience
   */
  private static async applySessionRotation(
    recipes: Recipe[],
    context: RecommendationContext
  ): Promise<Recipe[]> {
    if (recipes.length === 0) return recipes;

    // Use session hash to determine rotation pattern
    const sessionHash = this.hashString(context.currentSession);
    const rotationIndex = sessionHash % recipes.length;

    // Rotate recipes based on session
    const rotated = [
      ...recipes.slice(rotationIndex),
      ...recipes.slice(0, rotationIndex)
    ];

    // Shuffle within groups for additional variety
    return this.shuffleArray(rotated);
  }

  /**
   * Get additional variety recipes when needed
   */
  private static async getAdditionalVarietyRecipes(
    context: RecommendationContext,
    count: number,
    excludeIds: Set<string>
  ): Promise<Recipe[]> {
    // Use different offset strategy for variety
    const varietyOffset = this.getVarietyOffset(context.currentSession);

    const { data: recipes, error } = await supabase
      .from('recipes')
      .select('id,name,image,category,area,tags,ingredients,cooking_time,difficulty,created_at,updated_at')
      .is('user_id', null)
      .eq('source_type', 'seed')
      .not('id', 'in', `(${Array.from(excludeIds).join(',')})`)
      .range(varietyOffset, varietyOffset + count - 1);

    if (error) {
      logger.error('[recommendations] Error getting variety recipes:', error);
      return [];
    }

    return (recipes || []).map(fromDbRecipe);
  }

  /**
   * Get recommendation context for user
   */
  private static async getRecommendationContext(userId: string): Promise<RecommendationContext> {
    // Get user preferences (you'll need to implement this based on your user settings)
    const userPreferences = await this.getUserPreferences(userId);

    // Generate unique session ID for this login/refresh
    const currentSession = this.generateSessionId();

    // Get recently seen recipes
    const lastSeenRecipes = await this.getRecentlySeenRecipes(userId, 20);

    return {
      userId,
      lastSeenRecipes: lastSeenRecipes.map(r => r.recipe_id),
      userPreferences,
      currentSession
    };
  }

  /**
   * Get user preferences (implement based on your user settings system)
   */
  private static async getUserPreferences(_userId: string): Promise<UserPreferences> {
    try {
      // This should query your user preferences table
      // For now, returning default preferences
      return {
        favoriteIngredients: ['chicken', 'tomato', 'onion', 'garlic'],
        favoriteCuisines: ['indian', 'italian', 'mexican'],
        dietaryRestrictions: [],
        skillLevel: 'intermediate',
        cookingTime: 'medium',
        spiceLevel: 'medium'
      };
    } catch (error) {
      logger.warn('[recommendations] Could not load user preferences, using defaults:', error);
      return {
        favoriteIngredients: ['chicken', 'tomato', 'onion'],
        favoriteCuisines: ['indian', 'italian'],
        dietaryRestrictions: [],
        skillLevel: 'intermediate',
        cookingTime: 'medium',
        spiceLevel: 'medium'
      };
    }
  }

  /**
   * Get recently seen recipes for variety
   */
  private static async getRecentlySeenRecipes(userId: string, limit: number) {
    try {
      const { data, error } = await supabase
        .from('recipe_views') // You'll need to create this table
        .select('recipe_id, viewed_at')
        .eq('user_id', userId)
        .order('viewed_at', { ascending: false })
        .limit(limit);

      if (error) {
        logger.warn('[recommendations] Could not load recent views:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      logger.warn('[recommendations] Error loading recent views:', error);
      return [];
    }
  }

  /**
   * Generate unique session ID for variety
   */
  private static generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get session-based offset for variety
   */
  private static getSessionOffset(sessionId: string): number {
    const hash = this.hashString(sessionId);
    return hash % this.RECIPE_POOL_SIZE;
  }

  /**
   * Get variety offset for additional recipes
   */
  private static getVarietyOffset(sessionId: string): number {
    const hash = this.hashString(sessionId);
    return (hash * 2) % this.RECIPE_POOL_SIZE;
  }

  /**
   * Simple string hash function
   */
  private static hashString(str: string): number {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash * 31) + char) >>> 0; // Use unsigned right shift instead of bitwise AND
    }
    return Math.abs(hash);
  }

  /**
   * Shuffle array for additional variety
   */
  private static shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  /**
   * Fallback to random recipes if recommendation fails
   */
  private static async getFallbackRecipes(count: number): Promise<Recipe[]> {
    logger.warn('[recommendations] Using fallback random recipes');

    const { data: recipes, error } = await supabase
      .from('recipes')
      .select('id,name,image,category,area,tags,ingredients,cooking_time,difficulty,created_at,updated_at')
      .is('user_id', null)
      .eq('source_type', 'seed')
      .range(0, count - 1);

    if (error) {
      logger.error('[recommendations] Fallback also failed:', error);
      return [];
    }

    return (recipes || []).map(fromDbRecipe);
  }

  /**
   * Track recipe view for variety algorithm
   */
  static async trackRecipeView(userId: string, recipeId: string): Promise<void> {
    try {
      await supabase
        .from('recipe_views')
        .upsert({
          user_id: userId,
          recipe_id: recipeId,
          viewed_at: new Date().toISOString()
        });
    } catch (error) {
      logger.warn('[recommendations] Could not track recipe view:', error);
    }
  }
}
