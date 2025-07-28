// App constants
export const APP_NAME = 'Ezyum'
export const APP_DESCRIPTION = 'Smart meal planning for students'

// API endpoints
export const API_ENDPOINTS = {
  MEALDB: 'https://www.themealdb.com/api/json/v1/1',
  OPENFOODFACTS: 'https://world.openfoodfacts.org/api/v0/product',
} as const

// Meal types
export const MEAL_TYPES = {
  BREAKFAST: 'breakfast',
  LUNCH: 'lunch',
  DINNER: 'dinner',
  SNACK: 'snack',
} as const

// Pantry categories
export const PANTRY_CATEGORIES = {
  PROTEIN: 'protein',
  GRAINS: 'grains',
  VEGETABLES: 'vegetables',
  FRUITS: 'fruits',
  DAIRY: 'dairy',
  SPICES: 'spices',
  CONDIMENTS: 'condiments',
  FROZEN: 'frozen',
  CANNED: 'canned',
  OTHER: 'other',
} as const

// Cooking equipment
export const COOKING_EQUIPMENT = {
  STOVE: 'stove',
  OVEN: 'oven',
  MICROWAVE: 'microwave',
  BLENDER: 'blender',
  FOOD_PROCESSOR: 'food_processor',
  SLOW_COOKER: 'slow_cooker',
  AIR_FRYER: 'air_fryer',
  INSTANT_POT: 'instant_pot',
} as const

// Time budgets (in minutes)
export const TIME_BUDGETS = {
  QUICK: 15,
  MEDIUM: 30,
  LONG: 45,
  EXTENDED: 60,
} as const

// Gamification constants
export const XP_VALUES = {
  COOK_MEAL: 50,
  PLAN_MEAL: 25,
  SHARE_RECIPE: 30,
  COMPLETE_STREAK: 100,
} as const

export const BADGES = {
  FIRST_MEAL: {
    id: 'first_meal',
    name: 'First Steps',
    description: 'Cooked your first meal',
    icon: '🍳',
  },
  WEEK_STREAK: {
    id: 'week_streak',
    name: 'Consistency King',
    description: '7-day cooking streak',
    icon: '🔥',
  },
  SHARER: {
    id: 'sharer',
    name: 'Community Chef',
    description: 'Shared 5 recipes',
    icon: '👥',
  },
} as const

// UI constants
export const ANIMATION_DURATIONS = {
  FAST: 150,
  NORMAL: 300,
  SLOW: 500,
} as const

export const BREAKPOINTS = {
  MOBILE: 640,
  TABLET: 768,
  DESKTOP: 1024,
} as const

// Error messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your connection.',
  AUTH_ERROR: 'Authentication failed. Please try again.',
  GENERIC_ERROR: 'Something went wrong. Please try again.',
  RATE_LIMIT: 'Too many requests. Please wait a moment.',
} as const

// Success messages
export const SUCCESS_MESSAGES = {
  MEAL_SAVED: 'Meal saved successfully!',
  RECIPE_ADDED: 'Recipe added to your collection!',
  GROCERY_UPDATED: 'Grocery list updated!',
  PROFILE_UPDATED: 'Profile updated successfully!',
} as const 