import { AnimatePresence, motion } from 'framer-motion';
import { ChevronRight, Clock, Gamepad2, ShoppingBag, SkipForward, Sparkles, Timer, Trophy, User } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { SettingsService } from '../api/settingsService';
import { useAuthStore } from '../state/authStore';

interface Meal {
  id: string;
  name: string;
  category: 'breakfast' | 'lunch' | 'dinner';
  time: number;
  difficulty: 'easy' | 'medium' | 'hard';
}

const Onboarding: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [timeBudget, setTimeBudget] = useState(30);
  const [selectedStaples, setSelectedStaples] = useState<string[]>([]);
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'completed'>('idle');
  const [gameTime, setGameTime] = useState(30);
  const [selectedMeals, setSelectedMeals] = useState<Meal[]>([]);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const { signInWithGoogle, user } = useAuthStore();
  const navigate = useNavigate();
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const staples = [
    'Eggs', 'Rice', 'Pasta', 'Beans', 'Chicken', 'Ground Beef',
    'Onions', 'Garlic', 'Tomatoes', 'Cheese', 'Bread', 'Milk',
    'Olive Oil', 'Butter', 'Flour', 'Sugar', 'Salt', 'Pepper'
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
    { id: 'd6', name: 'Risotto', category: 'dinner', time: 45, difficulty: 'hard' }
  ];

  // Calculate time savings based on realistic meal prep times
  const calculateTimeSavings = (budget: number) => {
    const avgMealPrepTime = 45; // Average time without planning
    const plannedMealTime = budget;
    const weeklyMeals = 21; // 3 meals × 7 days
    // Lower budget means more time savings (more efficient planning)
    const weeklySavings = (avgMealPrepTime - plannedMealTime) * weeklyMeals / 60; // Convert to hours
    return Math.max(0, Math.round(weeklySavings));
  };

  const timeSavings = calculateTimeSavings(timeBudget);

  // Game logic
  useEffect(() => {
    if (gameState === 'playing') {
      timerRef.current = setInterval(() => {
        setGameTime((prev) => {
          if (prev <= 1) {
            setGameState('completed');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [gameState]);

  const startGame = () => {
    setGameState('playing');
    setGameTime(30);
    setSelectedMeals([]);
    setScore(0);
    setStreak(0);
  };

  const handleMealSelect = (meal: Meal) => {
    if (gameState !== 'playing') return;

    const existingMeal = selectedMeals.find(m => m.category === meal.category);
    if (existingMeal) {
      setSelectedMeals(prev => prev.map(m => m.category === meal.category ? meal : m));
    } else {
      setSelectedMeals(prev => [...prev, meal]);
    }

    // Calculate score based on time and difficulty
    const timeBonus = Math.max(0, 30 - meal.time);
    const difficultyBonus = meal.difficulty === 'easy' ? 10 : meal.difficulty === 'medium' ? 20 : 30;
    const newScore = score + timeBonus + difficultyBonus;
    setScore(newScore);

    // Check if all categories are selected
    if (selectedMeals.length >= 2) {
      setGameState('completed');
    }
  };

  const getAvailableMeals = (category: 'breakfast' | 'lunch' | 'dinner') => {
    return meals.filter(meal => meal.category === category);
  };

  // Save user preferences when onboarding is completed
  const saveUserPreferences = async () => {
    if (!user) return;

    try {
      // Save time budget setting
      await SettingsService.upsertUserSettings(user.id, {
        time_budget: timeBudget,
        notifications_enabled: true,
        dark_mode: false,
        meal_reminders: true,
        grocery_reminders: true,
      });

      // Save selected staples as pantry items (you might want to create a pantry service for this)
      // For now, we'll just save the preferences

      toast.success('Preferences saved successfully!');
    } catch (error) {
      console.error('Error saving preferences:', error);
      toast.error('Failed to save preferences');
    }
  };

  const steps = [
    {
      title: 'How much time do you have?',
      subtitle: "We'll help you save time in the kitchen",
      icon: <Clock className="w-8 h-8" />,
      component: (
        <div className="space-y-6">
          <div className="text-center">
            <h3 className="text-2xl font-lora mb-2">Time Budget</h3>
            <p className="text-soft-taupe">How long does meal prep usually take?</p>
          </div>
          <div className="space-y-6">
            <div className="relative">
              <input
                type="range"
                min="15"
                max="60"
                step="5"
                value={timeBudget}
                onChange={(e) => setTimeBudget(Number(e.target.value))}
                className="w-full slider"
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
                That's {Math.round(timeSavings * 60 / 7)} minutes saved per day
              </p>
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "What's in your pantry?",
      subtitle: 'Select your staple ingredients',
      icon: <ShoppingBag className="w-8 h-8" />,
      component: (
        <div className="space-y-6">
          <div className="text-center">
            <h3 className="text-2xl font-lora mb-2">Pantry Staples</h3>
            <p className="text-soft-taupe">Select what you usually have on hand</p>
          </div>
          <div className="grid grid-cols-3 gap-3 max-h-64 overflow-y-auto">
            {staples.map((staple) => (
              <motion.button
                key={staple}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  setSelectedStaples((prev) =>
                    prev.includes(staple)
                      ? prev.filter((s) => s !== staple)
                      : [...prev, staple]
                  );
                }}
                className={`p-3 rounded-lg border-2 transition-all duration-200 ${
                  selectedStaples.includes(staple)
                    ? 'border-coral-blush bg-coral-blush text-white shadow-lg'
                    : 'border-gray-200 hover:border-coral-blush hover:bg-coral-blush hover:bg-opacity-10'
                }`}
              >
                {staple}
              </motion.button>
            ))}
          </div>
          {selectedStaples.length > 0 && (
            <div className="text-center">
              <p className="text-sm text-soft-taupe">
                Selected {selectedStaples.length} staples
              </p>
            </div>
          )}
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
                  <span className="text-xs bg-white bg-opacity-20 px-2 py-1 rounded">🏆 Fastest Time</span>
                  <span className="text-xs bg-white bg-opacity-20 px-2 py-1 rounded">⚡ Quick Planning</span>
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
                      {selectedMeals.some(m => m.category === category) && (
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
                          disabled={selectedMeals.some(m => m.category === category)}
                          className={`p-3 rounded-lg text-sm transition-all ${
                            selectedMeals.some(m => m.category === category)
                              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                              : 'bg-gradient-to-r from-sage-leaf to-green-400 hover:from-coral-blush hover:to-orange-400 hover:text-white text-rich-charcoal shadow-sm'
                          }`}
                        >
                          <div className="font-medium">{meal.name}</div>
                          <div className="text-xs opacity-75">{meal.time}min • {meal.difficulty}</div>
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
                  scale: [1, 1.1, 1]
                }}
                transition={{ duration: 2, repeat: Infinity }}
                className="text-6xl mb-4"
              >
                {gameTime > 0 ? '🎉' : '⏰'}
              </motion.div>
              <h4 className="text-2xl font-bold text-coral-blush">
                {gameTime > 0 ? 'Challenge Complete!' : 'Time\'s Up!'}
              </h4>
              <p className="text-soft-taupe">
                {gameTime > 0
                  ? `You finished in ${30 - gameTime} seconds!`
                  : 'Great effort! Try again for a better time.'
                }
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
                  <span className="bg-white bg-opacity-20 px-2 py-1 rounded">Speed: {30 - gameTime}s</span>
                  <span className="bg-white bg-opacity-20 px-2 py-1 rounded">Accuracy: {Math.round((score / 300) * 100)}%</span>
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

          <div className="flex items-center justify-center mb-6">
            {steps[currentStep].icon}
          </div>

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
