// User types
export interface User {
  id: string;
  email: string;
  created_at: string;
}

// Settings types
export interface UserSettings {
  id: string;
  user_id: string;
  time_budget: number;
  preferred_cuisines?: string[];
  max_ingredients?: number;
  max_steps?: number;
  notifications_enabled: boolean;
  dark_mode: boolean;
  meal_reminders: boolean;
  grocery_reminders: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserAllergen {
  id: string;
  user_id: string;
  allergen_name: string;
  severity: 'mild' | 'moderate' | 'severe';
  created_at: string;
}

export interface UserAppliance {
  id: string;
  user_id: string;
  appliance_name: string;
  appliance_type: string;
  created_at: string;
}

// Pantry types
export interface PantryItem {
  id: string;
  user_id: string;
  name: string;
  category: string;
  quantity: number;
  expiration?: string;
  source: 'manual' | 'scan' | 'photo';
  created_at: string;
}

// Recipe types
export interface Recipe {
  id: string;
  user_id?: string;
  name: string;
  category?: string;
  area?: string;
  instructions?: string;
  image?: string;
  tags?: string[];
  ingredients: Ingredient[];
  videoUrl?: string;
  websiteUrl?: string;
  cookingTime?: string;
  difficulty?: 'Easy' | 'Medium' | 'Hard';
  sourceType?: 'user' | 'mealdb' | 'usda';
  mealdbId?: string;
  ingredientsCount?: number;
  stepsCount?: number;
  hasVideo?: boolean;
  license?: string;
  created_at: string;
  updated_at?: string;
}

export interface Ingredient {
  name: string;
  measure: string;
}

// Meal types (now using planner_entries table)
export interface Meal {
  id: string;
  user_id: string;
  date: string;
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack'; // Maps to 'slot' in DB
  recipe_id?: string;
  name_cached?: string; // Cached name for instant UI display
  notes?: string;
  created_at: string;
  updated_at?: string;
}

// Grocery list types
export interface GroceryList {
  id: string;
  user_id: string;
  items: GroceryItem[];
  status: 'active' | 'completed';
  created_at: string;
}

export interface GroceryItem {
  name: string;
  quantity: number;
  unit: string;
  category: string;
  checked: boolean;
}

// Social types (Phase 2)
export interface SocialPost {
  id: string;
  user_id: string;
  meal_id: string;
  image_url?: string;
  caption?: string;
  likes: number;
  comments: Comment[];
  created_at: string;
}

export interface Comment {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
}

// Gamification types
export interface UserStats {
  streak_days: number;
  total_xp: number;
  badges: Badge[];
  meals_cooked: number;
  time_saved: number; // in minutes
}

export interface Badge {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlocked_at?: string;
}

// AI Recommendation types
export interface MealRecommendation {
  recipe: Recipe;
  confidence: number;
  reason: string;
  missing_ingredients: Ingredient[];
}

// Onboarding types
export interface OnboardingData {
  time_budget: number;
  pantry_staples: string[];
  game_time?: number;
}

// Barcode scanning types
export interface BarcodeProduct {
  code: string;
  name: string;
  brand?: string;
  category: string;
  ingredients?: string[];
  allergens?: string[];
  nutrition?: {
    calories?: number;
    protein?: number;
    carbs?: number;
    fat?: number;
  };
}

export interface SmartSuggestion {
  id: string;
  user_id: string;
  suggestion_type: 'recipe' | 'meal_plan' | 'grocery';
  title: string;
  description: string;
  reasoning: string;
  ingredients_needed: string[];
  ingredients_available: string[];
  estimated_time: number;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  created_at: string;
  used: boolean;
}
