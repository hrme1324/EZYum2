import { RecipeSource, UnifiedRecipe } from '../types/common';

export function fromMealDb(meal: any, source: RecipeSource): UnifiedRecipe {
  const externalId = meal.idMeal ?? meal.mealdbId ?? meal.mealdb_id;
  return {
    id: `mealdb:${externalId}`,
    externalId,
    sourceType: 'mealdb',
    source,
    name: meal.strMeal ?? meal.name ?? 'Unknown Recipe',
    image: meal.strMealThumb ?? meal.image ?? undefined,
    instructions: meal.strInstructions ?? meal.instructions ?? undefined,
    ingredients: meal.ingredients ?? [],
    created_at: meal.created_at ?? new Date().toISOString(),
    tags: meal.tags ?? [],
    total_time_min: meal.total_time_min ?? null,
    category: meal.strCategory ?? meal.category ?? undefined,
    area: meal.strArea ?? meal.area ?? undefined,
    video_url: meal.strYoutube ?? meal.video_url ?? undefined,
    website_url: meal.strSource ?? meal.website_url ?? undefined,
    has_video: !!(meal.strYoutube ?? meal.video_url),
    ingredients_count: meal.ingredients?.length ?? 0,
    steps_count: meal.instructions?.split('\n').filter((line: string) => line.trim()).length ?? 0,
  };
}

export function fromLocal(dbRow: any, source: RecipeSource): UnifiedRecipe {
  return {
    id: `local:${dbRow.id}`,     // stable key
    localId: dbRow.id,
    sourceType: 'local',
    source,
    name: dbRow.name ?? 'Unknown Recipe',
    image: dbRow.image ?? undefined,
    instructions: dbRow.instructions ?? undefined,
    ingredients: dbRow.ingredients ?? [],
    created_at: dbRow.created_at ?? new Date().toISOString(),
    tags: dbRow.tags ?? [],
    total_time_min: dbRow.total_time_min ?? null,
    category: dbRow.category ?? undefined,
    area: dbRow.area ?? undefined,
    video_url: dbRow.video_url ?? undefined,
    website_url: dbRow.website_url ?? undefined,
    has_video: dbRow.has_video ?? false,
    ingredients_count: dbRow.ingredients_count ?? 0,
    steps_count: dbRow.steps_count ?? 0,
    user_id: dbRow.user_id ?? undefined,
    updated_at: dbRow.updated_at ?? undefined,
  };
}

export function dedupe(recipes: UnifiedRecipe[]): UnifiedRecipe[] {
  const seen = new Set<string>();
  const result: UnifiedRecipe[] = [];

  for (const r of recipes) {
    const key = r.localId ? `local:${r.localId}` : `mealdb:${r.externalId}`;
    if (!seen.has(key)) {
      seen.add(key);
      result.push(r);
    }
  }

  return result;
}
