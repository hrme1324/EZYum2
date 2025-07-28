// User types
export interface User {
  id: string
  email: string
  created_at: string
}

// Pantry types
export interface PantryItem {
  id: string
  user_id: string
  name: string
  category: string
  quantity: number
  expiration?: string
  source: 'manual' | 'scan' | 'photo'
  created_at: string
}

// Recipe types
export interface Recipe {
  id: string
  user_id: string
  name: string
  source_url?: string
  ingredients: Ingredient[]
  cook_time: number // in minutes
  equipment: string[]
  instructions: string[]
  image_url?: string
  created_at: string
}

export interface Ingredient {
  name: string
  amount: number
  unit: string
}

// Meal types
export interface Meal {
  id: string
  user_id: string
  date: string
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack'
  recipe_id?: string
  status: 'planned' | 'cooked' | 'skipped'
  notes?: string
  created_at: string
}

// Grocery list types
export interface GroceryList {
  id: string
  user_id: string
  items: GroceryItem[]
  status: 'active' | 'completed'
  created_at: string
}

export interface GroceryItem {
  name: string
  quantity: number
  unit: string
  category: string
  checked: boolean
}

// Social types (Phase 2)
export interface SocialPost {
  id: string
  user_id: string
  meal_id: string
  image_url?: string
  caption?: string
  likes: number
  comments: Comment[]
  created_at: string
}

export interface Comment {
  id: string
  user_id: string
  content: string
  created_at: string
}

// Gamification types
export interface UserStats {
  streak_days: number
  total_xp: number
  badges: Badge[]
  meals_cooked: number
  time_saved: number // in minutes
}

export interface Badge {
  id: string
  name: string
  description: string
  icon: string
  unlocked_at?: string
}

// AI Recommendation types
export interface MealRecommendation {
  recipe: Recipe
  confidence: number
  reason: string
  missing_ingredients: Ingredient[]
}

// Onboarding types
export interface OnboardingData {
  time_budget: number
  pantry_staples: string[]
  game_time?: number
} 