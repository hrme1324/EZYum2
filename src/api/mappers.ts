import { Recipe } from '../types';

export function fromDbRecipe(row: any): Recipe {
  return {
    id: row.id,
    user_id: row.user_id,
    name: row.name,
    category: row.category,
    area: row.area,
    instructions: row.instructions,
    image: row.image,
    tags: row.tags || [],
    ingredients: row.ingredients || [],
    videoUrl: row.video_url,
    websiteUrl: row.website_url,
    cookingTime: row.cooking_time,
    difficulty: row.difficulty,
    sourceType: row.source_type,
    mealdbId: row.mealdb_id,
    ingredientsCount: row.ingredients_count,
    stepsCount: row.steps_count,
    hasVideo: row.has_video,
    license: row.license,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}
