// App constants
export const APP_NAME = 'Ezyum';
export const APP_DESCRIPTION = 'Smart meal planning for students';

// API endpoints
export const API_ENDPOINTS = {
  MEALDB: 'https://www.themealdb.com/api/json/v1/1',
  OPENFOODFACTS: 'https://world.openfoodfacts.org/api/v0/product',
} as const;

// Meal types
export const MEAL_TYPES = {
  BREAKFAST: 'breakfast',
  LUNCH: 'lunch',
  DINNER: 'dinner',
  SNACK: 'snack',
} as const;

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
} as const;

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
} as const;

// Time budgets (in minutes)
export const TIME_BUDGETS = {
  QUICK: 15,
  MEDIUM: 30,
  LONG: 45,
  EXTENDED: 60,
} as const;

// Gamification constants
export const XP_VALUES = {
  COOK_MEAL: 50,
  PLAN_MEAL: 25,
  SHARE_RECIPE: 30,
  COMPLETE_STREAK: 100,
} as const;

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
} as const;

// UI constants
export const ANIMATION_DURATIONS = {
  FAST: 150,
  NORMAL: 300,
  SLOW: 500,
} as const;

export const BREAKPOINTS = {
  MOBILE: 640,
  TABLET: 768,
  DESKTOP: 1024,
} as const;

// Error messages
export const ERROR_MESSAGES = {
  NETWORK_ERROR: 'Network error. Please check your connection.',
  AUTH_ERROR: 'Authentication failed. Please try again.',
  GENERIC_ERROR: 'Something went wrong. Please try again.',
  RATE_LIMIT: 'Too many requests. Please wait a moment.',
} as const;

// Success messages
export const SUCCESS_MESSAGES = {
  MEAL_SAVED: 'Meal saved successfully!',
  RECIPE_ADDED: 'Recipe added to your collection!',
  GROCERY_UPDATED: 'Grocery list updated!',
  PROFILE_UPDATED: 'Profile updated successfully!',
} as const;

// Development flags
export const IS_OFFLINE_MODE = import.meta.env.VITE_OFFLINE_MODE === 'true';

/**
 * Get the correct base URL for authentication redirects
 * Handles mobile devices, different domains, and development vs production
 */
export const getAuthBaseUrl = (): string => {
  // Check for environment variable first
  if (import.meta.env.VITE_SITE_URL) {
    return import.meta.env.VITE_SITE_URL;
  }

  const isDev = import.meta.env.DEV;

  if (isDev) {
    return 'http://localhost:3000';
  }

  // In production, determine the correct domain
  const currentHostname = window.location.hostname;
  const currentOrigin = window.location.origin;
  const userAgent = navigator.userAgent.toLowerCase();

  // Check if this is a mobile device
  const isMobile = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(userAgent);

  // Known production domains
  if (currentHostname === 'ezyum.com' || currentHostname === 'www.ezyum.com') {
    return `https://${currentHostname}`;
  }

  // Vercel deployments
  if (currentHostname.includes('vercel.app')) {
    return currentOrigin;
  }

  // Local development (fallback)
  if (currentHostname === 'localhost' || currentHostname === '127.0.0.1') {
    return 'http://localhost:3000';
  }

  // For mobile devices, if we can't determine the domain, default to ezyum.com
  if (isMobile && (currentHostname === '' || currentHostname === 'localhost')) {
    console.log('📱 Mobile device detected, using default ezyum.com domain');
    return 'https://ezyum.com';
  }

  // Default fallback to ezyum.com
  return 'https://ezyum.com';
};

// Mock data for offline development
export const MOCK_RECIPES = [
  {
    id: 'mock-1',
    name: 'Chicken Pasta',
    category: 'Italian',
    area: 'Italy',
    instructions: 'Cook pasta, add chicken, serve hot.',
    image: '',
    tags: ['pasta', 'chicken'],
    ingredients: [
      { name: 'Pasta', measure: '200g' },
      { name: 'Chicken', measure: '150g' },
    ],
    videoUrl: '',
    websiteUrl: '',
    cookingTime: '30 min',
    difficulty: 'Easy' as const,
    source_type: 'discovery',
    mealdb_id: 'mock-1',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'mock-2',
    name: 'Greek Salad',
    category: 'Mediterranean',
    area: 'Greece',
    instructions: 'Mix vegetables, add feta, drizzle with olive oil.',
    image: '',
    tags: ['salad', 'vegetarian'],
    ingredients: [
      { name: 'Cucumber', measure: '1' },
      { name: 'Tomatoes', measure: '2' },
    ],
    videoUrl: '',
    websiteUrl: '',
    cookingTime: '10 min',
    difficulty: 'Easy' as const,
    source_type: 'discovery',
    mealdb_id: 'mock-2',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'mock-3',
    name: 'Beef Tacos',
    category: 'Mexican',
    area: 'Mexico',
    instructions: 'Cook beef with spices, serve in tortillas with toppings.',
    image: '',
    tags: ['tacos', 'beef', 'mexican'],
    ingredients: [
      { name: 'Ground Beef', measure: '300g' },
      { name: 'Tortillas', measure: '6' },
    ],
    videoUrl: '',
    websiteUrl: '',
    cookingTime: '25 min',
    difficulty: 'Medium' as const,
    source_type: 'discovery',
    mealdb_id: 'mock-3',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'mock-4',
    name: 'Chocolate Cake',
    category: 'Dessert',
    area: 'International',
    instructions: 'Mix ingredients, bake at 350°F for 30 minutes.',
    image: '',
    tags: ['dessert', 'chocolate', 'cake'],
    ingredients: [
      { name: 'Flour', measure: '2 cups' },
      { name: 'Cocoa', measure: '1/2 cup' },
    ],
    videoUrl: '',
    websiteUrl: '',
    cookingTime: '45 min',
    difficulty: 'Medium' as const,
    source_type: 'discovery',
    mealdb_id: 'mock-4',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'mock-5',
    name: 'Vegetable Stir Fry',
    category: 'Asian',
    area: 'China',
    instructions: 'Stir fry vegetables with soy sauce and ginger.',
    image: '',
    tags: ['vegetarian', 'asian', 'stir-fry'],
    ingredients: [
      { name: 'Broccoli', measure: '2 cups' },
      { name: 'Soy Sauce', measure: '2 tbsp' },
    ],
    videoUrl: '',
    websiteUrl: '',
    cookingTime: '15 min',
    difficulty: 'Easy' as const,
    source_type: 'discovery',
    mealdb_id: 'mock-5',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export const MOCK_MEALS = [
  {
    id: 'meal-1',
    user_id: 'mock-user',
    date: new Date().toISOString().split('T')[0],
    meal_type: 'breakfast' as const,
    recipe_id: 'mock-1',
    status: 'planned' as const,
    notes: 'Quick breakfast option',
    created_at: new Date().toISOString(),
  },
  {
    id: 'meal-2',
    user_id: 'mock-user',
    date: new Date().toISOString().split('T')[0],
    meal_type: 'lunch' as const,
    recipe_id: 'mock-2',
    status: 'cooked' as const,
    notes: 'Healthy lunch choice',
    created_at: new Date().toISOString(),
  },
];
