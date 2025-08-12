import { AnimatePresence, motion } from 'framer-motion';
import {
  ChevronRight,
  Clock,
  Gamepad2,
  Plus,
  Search,
  ShoppingBag,
  SkipForward,
  Sparkles,
  Timer,
  Trophy,
  User,
  X,
} from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { PantryService } from '../api/pantryService';
import { SettingsService } from '../api/settingsService';
import { useAuthStore } from '../state/authStore';
import { logger } from '../utils/logger';

interface Meal {
  id: string;
  name: string;
  category: 'breakfast' | 'lunch' | 'dinner';
  time: number;
  difficulty: 'easy' | 'medium' | 'hard';
}

interface PantryStaple {
  name: string;
  category: string;
  emoji: string;
}

const Onboarding: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [timeBudget, setTimeBudget] = useState(30);
  const [selectedPantryItems, setSelectedPantryItems] = useState<PantryStaple[]>([]);
  const [customPantryItems, setCustomPantryItems] = useState<string[]>([]);
  const [showAddCustomItem, setShowAddCustomItem] = useState(false);
  const [newCustomItem, setNewCustomItem] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'completed'>('idle');
  const [gameTime, setGameTime] = useState(30);
  const [selectedMeals, setSelectedMeals] = useState<Meal[]>([]);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const { signInWithGoogle, user } = useAuthStore();
  const navigate = useNavigate();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Comprehensive pantry staples with categories
  const pantryStaples: PantryStaple[] = [
    // Protein
    { name: 'Eggs', category: 'protein', emoji: '🥚' },
    { name: 'Chicken Breast', category: 'protein', emoji: '🍗' },
    { name: 'Ground Beef', category: 'protein', emoji: '🥩' },
    { name: 'Salmon', category: 'protein', emoji: '🐟' },
    { name: 'Tofu', category: 'protein', emoji: '🧈' },
    { name: 'Black Beans', category: 'protein', emoji: '🫘' },
    { name: 'Chickpeas', category: 'protein', emoji: '🫘' },

    // Grains
    { name: 'Rice', category: 'grains', emoji: '🍚' },
    { name: 'Pasta', category: 'grains', emoji: '🍝' },
    { name: 'Bread', category: 'grains', emoji: '🍞' },
    { name: 'Quinoa', category: 'grains', emoji: '🌾' },
    { name: 'Oats', category: 'grains', emoji: '🥣' },
    { name: 'Tortillas', category: 'grains', emoji: '🫓' },

    // Vegetables
    { name: 'Onions', category: 'vegetables', emoji: '🧅' },
    { name: 'Garlic', category: 'vegetables', emoji: '🧄' },
    { name: 'Tomatoes', category: 'vegetables', emoji: '🍅' },
    { name: 'Spinach', category: 'vegetables', emoji: '🥬' },
    { name: 'Bell Peppers', category: 'vegetables', emoji: '🫑' },
    { name: 'Carrots', category: 'vegetables', emoji: '🥕' },
    { name: 'Broccoli', category: 'vegetables', emoji: '🥦' },
    { name: 'Mushrooms', category: 'vegetables', emoji: '🍄' },

    // Fruits
    { name: 'Bananas', category: 'fruits', emoji: '🍌' },
    { name: 'Apples', category: 'fruits', emoji: '🍎' },
    { name: 'Lemons', category: 'fruits', emoji: '🍋' },
    { name: 'Avocados', category: 'fruits', emoji: '🥑' },
    { name: 'Berries', category: 'fruits', emoji: '🫐' },

    // Dairy
    { name: 'Milk', category: 'dairy', emoji: '🥛' },
    { name: 'Cheese', category: 'dairy', emoji: '🧀' },
    { name: 'Yogurt', category: 'dairy', emoji: '🥛' },
    { name: 'Butter', category: 'dairy', emoji: '🧈' },
    { name: 'Cream', category: 'dairy', emoji: '🥛' },

    // Condiments & Oils
    { name: 'Olive Oil', category: 'condiments', emoji: '🫒' },
    { name: 'Salt', category: 'condiments', emoji: '🧂' },
    { name: 'Black Pepper', category: 'condiments', emoji: '🌶️' },
    { name: 'Soy Sauce', category: 'condiments', emoji: '🍶' },
    { name: 'Hot Sauce', category: 'condiments', emoji: '🌶️' },
    { name: 'Ketchup', category: 'condiments', emoji: '🍅' },
    { name: 'Mustard', category: 'condiments', emoji: '🟡' },

    // Baking & Spices
    { name: 'Flour', category: 'baking', emoji: '🌾' },
    { name: 'Sugar', category: 'baking', emoji: '🍯' },
    { name: 'Baking Soda', category: 'baking', emoji: '🧂' },
    { name: 'Vanilla Extract', category: 'baking', emoji: '🌿' },
    { name: 'Cinnamon', category: 'baking', emoji: '🌿' },
    { name: 'Oregano', category: 'baking', emoji: '🌿' },
    { name: 'Basil', category: 'baking', emoji: '🌿' },
  ];

  const meals: Meal[] = [
    // Breakfast
    { id: 'b1', name: 'Oatmeal Bowl', category: 'breakfast', time: 10, difficulty: 'easy' },
    { id: 'b2', name: 'Scrambled Eggs', category: 'breakfast', time: 15, difficulty: 'easy' },
    { id: 'b3', name: 'Avocado Toast', category: 'breakfast', time: 8, difficulty: 'easy' },
    { id: 'b4', name: 'Smoothie Bowl', category: 'breakfast', time: 12, difficulty: 'medium' },
    { id: 'b5', name: 'Pancakes', category: 'breakfast', time: 20, difficulty: 'medium' },
    { id: 'b6', name: 'French Toast', category: 'breakfast', time: 18, difficulty: 'medium' },

    // Lunch
    { id: 'l1', name: 'Caesar Salad', category: 'lunch', time: 15, difficulty: 'easy' },
    { id: 'l2', name: 'Grilled Cheese', category: 'lunch', time: 12, difficulty: 'easy' },
    { id: 'l3', name: 'Pasta Carbonara', category: 'lunch', time: 25, difficulty: 'medium' },
    { id: 'l4', name: 'Chicken Wrap', category: 'lunch', time: 18, difficulty: 'medium' },
    { id: 'l5', name: 'Buddha Bowl', category: 'lunch', time: 22, difficulty: 'medium' },
    { id: 'l6', name: 'Soup & Sandwich', category: 'lunch', time: 20, difficulty: 'easy' },

    // Dinner
    { id: 'd1', name: 'Stir Fry', category: 'dinner', time: 25, difficulty: 'medium' },
    { id: 'd2', name: 'Pasta Primavera', category: 'dinner', time: 30, difficulty: 'medium' },
    { id: 'd3', name: 'Grilled Salmon', category: 'dinner', time: 35, difficulty: 'hard' },
    { id: 'd4', name: 'Taco Night', category: 'dinner', time: 28, difficulty: 'medium' },
    { id: 'd5', name: 'Sheet Pan Dinner', category: 'dinner', time: 40, difficulty: 'medium' },
    { id: 'd6', name: 'Risotto', category: 'dinner', time: 45, difficulty: 'hard' },
  ];

  // Calculate time savings based on realistic meal prep times
  const calculateTimeSavings = (budget: number) => {
    const avgMealPrepTime = 45; // Average time without planning
    const plannedMealTime = budget;
    const weeklyMeals = 21; // 3 meals × 7 days
    // Lower budget means more time savings (more efficient planning)
    const weeklySavings = ((avgMealPrepTime - plannedMealTime) * weeklyMeals) / 60; // Convert to hours
    return Math.max(0, Math.round(weeklySavings));
  };

  const timeSavings = calculateTimeSavings(timeBudget);

  // Game logic
  useEffect(() => {
    if (gameState === 'playing' && gameTime > 0) {
      timerRef.current = setTimeout(() => {
        setGameTime(gameTime - 1);
      }, 1000);
    } else if (gameTime === 0) {
      setGameState('completed');
    }

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, [gameState, gameTime]);

  const startGame = () => {
    setGameState('playing');
    setGameTime(30);
    setSelectedMeals([]);
    setScore(0);
    setStreak(0);
  };

  const handleMealSelect = (meal: Meal) => {
    if (selectedMeals.some((m) => m.category === meal.category)) return;

    const newSelectedMeals = [...selectedMeals, meal];
    setSelectedMeals(newSelectedMeals);

    // Calculate score based on time only
    let mealScore = 100;
    if (meal.time <= 15) mealScore += 100; // Bonus for quick meals
    if (meal.time <= 20) mealScore += 50; // Bonus for medium-quick meals
    if (meal.time <= 25) mealScore += 25; // Small bonus for reasonable time meals

    setScore(score + mealScore);
    setStreak(streak + 1);

    // Check if all categories are filled
    if (newSelectedMeals.length === 3) {
      setTimeout(() => {
        setGameState('completed');
      }, 500);
    }
  };

  const getAvailableMeals = (category: 'breakfast' | 'lunch' | 'dinner') => {
    return meals.filter((meal) => meal.category === category);
  };

  const saveUserPreferences = async () => {
    if (!user) return;

    try {
      // Save user settings
      await SettingsService.upsertUserSettings(user.id, {
        time_budget: timeBudget,
        notifications_enabled: true,
        dark_mode: false,
        meal_reminders: true,
        grocery_reminders: true,
      });

      // Save pantry items to database
      const allPantryItems = [
        ...selectedPantryItems.map((item) => ({
          name: item.name,
          category: item.category,
          quantity: 1,
          source: 'manual' as const,
        })),
        ...customPantryItems.map((name) => ({
          name,
          category: 'other',
          quantity: 1,
          source: 'manual' as const,
        })),
      ];

      // Add each pantry item to the database
      for (const item of allPantryItems) {
        await PantryService.addPantryItem(user.id, item);
      }

      toast.success('Preferences saved successfully!');
    } catch (error) {
      logger.error('Error saving onboarding data:', error);
      toast.error('Failed to save preferences');
    }
  };

  const addCustomPantryItem = () => {
    if (newCustomItem.trim() && !customPantryItems.includes(newCustomItem.trim())) {
      setCustomPantryItems([...customPantryItems, newCustomItem.trim()]);
      setNewCustomItem('');
      setShowAddCustomItem(false);
    }
  };

  const removeCustomPantryItem = (item: string) => {
    setCustomPantryItems(customPantryItems.filter((i) => i !== item));
  };

  const togglePantryItem = (item: PantryStaple) => {
    setSelectedPantryItems((prev) =>
      prev.some((i) => i.name === item.name)
        ? prev.filter((i) => i.name !== item.name)
        : [...prev, item],
    );
  };

  const steps = [
    {
      title: "What's in your pantry?",
      subtitle: 'Build your virtual pantry with ingredients you have',
      icon: <ShoppingBag className="w-8 h-8" />,
      component: (
        <div className="space-y-6">
          <div className="text-center">
            <h3 className="text-2xl font-lora mb-2">Your Pantry</h3>
            <p className="text-soft-taupe">Select ingredients you currently have at home</p>
          </div>

          {/* Custom item input */}
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowAddCustomItem(true)}
              className="btn-secondary flex items-center space-x-2 px-4 py-2"
            >
              <Plus className="w-4 h-4" />
              <span>Add Custom Item</span>
            </button>
          </div>

          {showAddCustomItem && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center space-x-2 p-3 bg-white rounded-lg border"
            >
              <input
                type="text"
                value={newCustomItem}
                onChange={(e) => setNewCustomItem(e.target.value)}
                placeholder="Enter ingredient name..."
                className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-coral-blush"
                onKeyPress={(e) => e.key === 'Enter' && addCustomPantryItem()}
              />
              <button
                onClick={addCustomPantryItem}
                className="px-3 py-2 bg-coral-blush text-white rounded-lg hover:bg-coral-blush/90"
              >
                Add
              </button>
              <button
                onClick={() => setShowAddCustomItem(false)}
                className="px-2 py-2 text-gray-500 hover:text-gray-700"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          )}

          {/* Custom items display */}
          {customPantryItems.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-medium text-rich-charcoal">Custom Items:</h4>
              <div className="flex flex-wrap gap-2">
                {customPantryItems.map((item) => (
                  <motion.div
                    key={item}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex items-center space-x-2 bg-coral-blush text-white px-3 py-2 rounded-lg"
                  >
                    <span>{item}</span>
                    <button
                      onClick={() => removeCustomPantryItem(item)}
                      className="hover:bg-white/20 rounded-full p-1"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {/* Search functionality */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search ingredients..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-coral-blush"
            />
          </div>

          {/* Pantry staples grid */}
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {['protein', 'grains', 'vegetables', 'fruits', 'dairy', 'condiments', 'baking'].map(
              (category) => {
                const categoryItems = pantryStaples.filter(
                  (item) =>
                    item.category === category &&
                    (searchTerm === '' ||
                      item.name.toLowerCase().includes(searchTerm.toLowerCase())),
                );
                const categoryEmoji = categoryItems[0]?.emoji || '📦';

                if (categoryItems.length === 0) return null;

                return (
                  <div key={category} className="space-y-2">
                    <h4 className="font-medium text-rich-charcoal capitalize flex items-center gap-2">
                      <span>{categoryEmoji}</span>
                      {category}
                      <span className="text-sm text-soft-taupe">({categoryItems.length})</span>
                    </h4>
                    <div className="grid grid-cols-3 gap-2">
                      {categoryItems.map((item) => (
                        <motion.button
                          key={item.name}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => togglePantryItem(item)}
                          className={`p-3 rounded-lg border-2 transition-all duration-200 text-sm ${
                            selectedPantryItems.some((i) => i.name === item.name)
                              ? 'border-coral-blush bg-coral-blush text-white shadow-lg'
                              : 'border-gray-200 hover:border-coral-blush hover:bg-coral-blush hover:bg-opacity-10'
                          }`}
                        >
                          <div className="text-lg mb-1">{item.emoji}</div>
                          <div className="font-medium">{item.name}</div>
                        </motion.button>
                      ))}
                    </div>
                  </div>
                );
              },
            )}
          </div>

          {selectedPantryItems.length > 0 || customPantryItems.length > 0 ? (
            <div className="text-center p-4 bg-sage-leaf/10 rounded-lg">
              <p className="text-sage-leaf font-medium">
                Selected {selectedPantryItems.length + customPantryItems.length} items
              </p>
              <p className="text-sm text-soft-taupe mt-1">
                Great start! This will help us suggest perfect recipes for you.
              </p>
            </div>
          ) : (
            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <p className="text-orange-600 font-medium">No items selected yet</p>
              <p className="text-sm text-soft-taupe mt-1">
                Select ingredients you have to get personalized recipe suggestions
              </p>
            </div>
          )}
        </div>
      ),
    },
    {
      title: 'Time Budget',
      subtitle: 'How much time do you want to spend cooking?',
      icon: <Clock className="w-8 h-8" />,
      component: (
        <div className="space-y-6">
          <div className="text-center">
            <h3 className="text-2xl font-lora mb-2">Your Cooking Time</h3>
            <p className="text-soft-taupe">Set your daily cooking time budget</p>
          </div>
          <div className="space-y-4">
            <div className="relative">
              <input
                type="range"
                min="15"
                max="60"
                step="5"
                value={timeBudget}
                onChange={(e) => setTimeBudget(Number(e.target.value))}
                className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
              />
              <div className="flex justify-between text-xs text-soft-taupe mt-2">
                <span>15 min</span>
                <span>60 min</span>
              </div>
            </div>
            <div className="text-center space-y-2">
              <div className="text-4xl font-bold text-coral-blush">{timeBudget} min</div>
              <div className="flex items-center justify-center space-x-2 text-sage-leaf">
                <Sparkles className="w-5 h-5" />
                <span className="font-medium">Save {timeSavings} hours per week!</span>
              </div>
              <p className="text-sm text-soft-taupe">
                That's {Math.round((timeSavings * 60) / 7)} minutes saved per day
              </p>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: 'Quick Meal Challenge!',
      subtitle: 'Plan 3 meals in under 30 seconds',
      icon: <Gamepad2 className="w-8 h-8" />,
      component: (
        <div className="space-y-6">
          <div className="text-center">
            <h3 className="text-2xl font-lora mb-2">30-Second Challenge</h3>
            <p className="text-soft-taupe">Select one meal for each category</p>
          </div>

          {gameState === 'idle' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <div className="bg-gradient-to-r from-coral-blush via-orange-400 to-yellow-400 p-6 rounded-xl text-white text-center shadow-lg">
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Trophy className="w-12 h-12 mx-auto mb-3" />
                </motion.div>
                <h4 className="text-xl font-bold mb-2">Ready to save time?</h4>
                <p className="text-sm opacity-90">Plan 3 meals in 30 seconds or less!</p>
                <div className="mt-3 flex justify-center space-x-2">
                  <span className="text-xs bg-white bg-opacity-20 px-2 py-1 rounded">
                    🏆 Fastest Time
                  </span>
                  <span className="text-xs bg-white bg-opacity-20 px-2 py-1 rounded">
                    ⚡ Quick Planning
                  </span>
                </div>
              </div>
              <motion.button
                onClick={startGame}
                className="btn-primary w-full text-lg py-4"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                🚀 Start Challenge
              </motion.button>
            </motion.div>
          )}

          {gameState === 'playing' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="space-y-4"
            >
              <div className="flex justify-between items-center bg-white p-4 rounded-xl border shadow-sm">
                <div className="flex items-center space-x-2">
                  <motion.div
                    animate={{ scale: [1, 1.1, 1] }}
                    transition={{ duration: 1, repeat: Infinity }}
                  >
                    <Timer className="w-5 h-5 text-coral-blush" />
                  </motion.div>
                  <span className="font-bold text-lg">{gameTime}s</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-soft-taupe">Score:</span>
                  <span className="font-bold text-coral-blush">{score}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-soft-taupe">Streak:</span>
                  <span className="font-bold text-sage-leaf">{streak}</span>
                </div>
              </div>

              <div className="space-y-4">
                {['breakfast', 'lunch', 'dinner'].map((category, index) => (
                  <motion.div
                    key={category}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-white rounded-xl p-4 border shadow-sm"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-bold capitalize text-rich-charcoal flex items-center gap-2">
                        {category === 'breakfast' && '🌅'}
                        {category === 'lunch' && '☀️'}
                        {category === 'dinner' && '🌙'}
                        {category}
                      </h4>
                      {selectedMeals.some((m) => m.category === category) && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center"
                        >
                          <span className="text-white text-xs">✓</span>
                        </motion.div>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      {getAvailableMeals(category as any).map((meal) => (
                        <motion.button
                          key={meal.id}
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => handleMealSelect(meal)}
                          disabled={selectedMeals.some((m) => m.category === category)}
                          className={`p-3 rounded-lg text-sm transition-all ${
                            selectedMeals.some((m) => m.category === category)
                              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                              : 'bg-gradient-to-r from-sage-leaf to-green-400 hover:from-coral-blush hover:to-orange-400 hover:text-white text-rich-charcoal shadow-sm'
                          }`}
                        >
                          <div className="font-medium">{meal.name}</div>
                          <div className="text-xs opacity-75">
                            {meal.time}min • {meal.difficulty}
                          </div>
                        </motion.button>
                      ))}
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {gameState === 'completed' && (
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-center space-y-4"
            >
              <motion.div
                animate={{
                  rotate: [0, 10, -10, 0],
                  scale: [1, 1.1, 1],
                }}
                transition={{ duration: 2, repeat: Infinity }}
                className="text-6xl mb-4"
              >
                {gameTime > 0 ? '🎉' : '⏰'}
              </motion.div>
              <h4 className="text-2xl font-bold text-coral-blush">
                {gameTime > 0 ? 'Challenge Complete!' : "Time's Up!"}
              </h4>
              <p className="text-soft-taupe">
                {gameTime > 0
                  ? `You finished in ${30 - gameTime} seconds!`
                  : 'Great effort! Try again for a better time.'}
              </p>
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="bg-gradient-to-r from-coral-blush to-orange-400 p-4 rounded-xl text-white shadow-lg"
              >
                <p className="font-bold text-lg">Final Score: {score}</p>
                <p className="text-sm opacity-90">Max Streak: {streak}</p>
                <div className="mt-2 flex justify-center space-x-4 text-xs">
                  <span className="bg-white bg-opacity-20 px-2 py-1 rounded">
                    Speed: {30 - gameTime}s
                  </span>
                  <span className="bg-white bg-opacity-20 px-2 py-1 rounded">
                    Time Bonus: +{Math.round((score / 300) * 100)}%
                  </span>
                </div>
              </motion.div>
              <motion.button
                onClick={startGame}
                className="btn-secondary"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                🔄 Try Again
              </motion.button>
            </motion.div>
          )}
        </div>
      ),
    },
    {
      title: 'Create Your Profile',
      subtitle: 'Sign in with Google to save your preferences',
      icon: <User className="w-8 h-8" />,
      component: (
        <div className="space-y-6">
          <div className="text-center">
            <h3 className="text-2xl font-lora mb-2">Chef Profile</h3>
            <p className="text-soft-taupe">Sign in with Google to sync all your plans</p>
          </div>
          <div className="space-y-4">
            <button
              onClick={signInWithGoogle}
              className="btn-primary w-full flex items-center justify-center space-x-2"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              <span>Continue with Google</span>
            </button>
            <p className="text-xs text-soft-taupe text-center">
              We'll save your preferences and sync across devices
            </p>
          </div>
        </div>
      ),
    },
  ];

  const nextStep = async () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      // Final step - save preferences and navigate to home
      await saveUserPreferences();
      navigate('/');
    }
  };

  const skipToSignIn = () => {
    signInWithGoogle();
  };

  return (
    <div className="min-h-screen bg-off-white flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full"
      >
        <div className="card">
          {/* Skip Button */}
          <div className="flex justify-end mb-4">
            <button
              onClick={skipToSignIn}
              className="flex items-center space-x-1 text-soft-taupe hover:text-coral-blush transition-colors"
            >
              <SkipForward className="w-4 h-4" />
              <span className="text-sm">Skip to Sign In</span>
            </button>
          </div>

          <div className="flex items-center justify-center mb-6">{steps[currentStep].icon}</div>

          <div className="text-center mb-8">
            <h2 className="text-3xl font-lora mb-2">{steps[currentStep].title}</h2>
            <p className="text-soft-taupe">{steps[currentStep].subtitle}</p>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {steps[currentStep].component}
            </motion.div>
          </AnimatePresence>

          <div className="flex justify-between items-center mt-8">
            <div className="flex space-x-2">
              {steps.map((_, index) => (
                <motion.div
                  key={index}
                  whileHover={{ scale: 1.2 }}
                  className={`w-2 h-2 rounded-full transition-colors ${
                    index === currentStep ? 'bg-coral-blush' : 'bg-gray-200'
                  }`}
                />
              ))}
            </div>

            {currentStep < steps.length - 1 && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={nextStep}
                className="btn-primary flex items-center space-x-2"
              >
                <span>Next</span>
                <ChevronRight className="w-4 h-4" />
              </motion.button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Onboarding;
