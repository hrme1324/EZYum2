export type RecipeDifficulty = 'easy' | 'medium' | 'hard';

export interface IngestedRecipe {
  title: string;
  ingredients: string[];
  instructions: string[];
  cook_time_min?: number | null;
  difficulty: RecipeDifficulty;
  image_url?: string | null;
  source_url?: string | null;
  video_url?: string | null;
  license: string; // e.g. 'Public Domain', 'CC0', 'CC-BY 4.0'
}
