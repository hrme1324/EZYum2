export type SourceType = 'local' | 'mealdb';
export type RecipeSource = 'discovery' | 'saved' | 'my-recipes' | 'plus' | 'for-you';

export type UnifiedRecipe = {
  id: string;                 // UI key, unique across sources
  localId?: string;           // UUID in public.recipes (when known)
  externalId?: string;        // MealDB id (when applicable)
  sourceType: SourceType;     // 'local' or 'mealdb'
  source: RecipeSource;       // tab origin
  name: string;
  image?: string;
  instructions?: string;
  ingredients?: Array<{name: string; measure?: string;}>;
  created_at?: string;
  tags?: string[];
  difficulty?: string;
  total_time_min?: number | null;
  category?: string;
  area?: string;
  video_url?: string;
  website_url?: string;
  has_video?: boolean;
  ingredients_count?: number;
  steps_count?: number;
  user_id?: string;
  updated_at?: string;
  // UI state
  isSaved?: boolean;
};
