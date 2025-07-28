import { AnimatePresence, motion } from 'framer-motion';
import {
    ArrowLeft,
    ArrowRight,
    Calendar,
    ChefHat,
    Clock,
    Plus,
    Sparkles,
    X
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { MealService } from '../api/mealService';
import { useAuthStore } from '../state/authStore';
import { Meal, Recipe } from '../types';

const MealPlanner: React.FC = () => {
  const { user } = useAuthStore();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showAddMeal, setShowAddMeal] = useState(false);
  const [selectedMealType, setSelectedMealType] = useState<
    'breakfast' | 'lunch' | 'dinner' | 'snack'
  >('breakfast');
  const [meals, setMeals] = useState<Meal[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [newMeal, setNewMeal] = useState({
    recipe_id: '',
    notes: '',
  });

  // Load meals and recipes
  useEffect(() => {
    if (user) {
      loadMealsAndRecipes();
    }
  }, [user, selectedDate]);

  const loadMealsAndRecipes = async () => {
    if (!user) return;

    // setLoading(true);
    try {
      const dateString = selectedDate.toISOString().split('T')[0];
      const [mealsData, recipesData] = await Promise.all([
        MealService.getMealsForDate(user.id, dateString),
        MealService.getUserRecipes(user.id),
      ]);

      setMeals(mealsData);
      setRecipes(recipesData);
    } catch (error) {
      console.error('Error loading meals and recipes:', error);
      toast.error('Failed to load meals');
    } finally {
      // setLoading(false);
    }
  };

  const addMeal = async () => {
    if (!user || !newMeal.recipe_id) {
      toast.error('Please select a recipe');
      return;
    }

    try {
      const dateString = selectedDate.toISOString().split('T')[0];
      const meal = await MealService.addMeal(user.id, {
        date: dateString,
        meal_type: selectedMealType,
        recipe_id: newMeal.recipe_id,
        notes: newMeal.notes,
        status: 'planned',
      });

      if (meal) {
        setMeals(prev => [...prev, meal]);
        setShowAddMeal(false);
        setNewMeal({ recipe_id: '', notes: '' });
        toast.success('Meal added successfully');
      }
    } catch (error) {
      console.error('Error adding meal:', error);
      toast.error('Failed to add meal');
    }
  };

  const deleteMeal = async (mealId: string) => {
    if (!user) return;

    try {
      const success = await MealService.deleteMeal(user.id, mealId);
      if (success) {
        setMeals(prev => prev.filter(m => m.id !== mealId));
        toast.success('Meal removed');
      }
    } catch (error) {
      console.error('Error deleting meal:', error);
      toast.error('Failed to remove meal');
    }
  };

  const mealTypes = [
    { id: 'breakfast', name: 'Breakfast', emoji: '🌅', color: 'bg-orange-100 text-orange-600' },
    { id: 'lunch', name: 'Lunch', emoji: '☀️', color: 'bg-yellow-100 text-yellow-600' },
    { id: 'dinner', name: 'Dinner', emoji: '🌙', color: 'bg-purple-100 text-purple-600' },
    { id: 'snack', name: 'Snack', emoji: '🍎', color: 'bg-green-100 text-green-600' },
  ];

  const getMealsForDate = (date: Date) => {
    const dateString = date.toISOString().split('T')[0];
    return meals.filter((meal) => meal.date === dateString);
  };

  const getRecipeName = (recipeId: string) => recipes.find((recipe) => recipe.id === recipeId)?.name || 'Unknown Recipe';

  const formatDate = (date: Date) => date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });

  const getWeekDates = (date: Date) => {
    const startOfWeek = new Date(date);
    startOfWeek.setDate(date.getDate() - date.getDay());

    const weekDates = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(startOfWeek);
      day.setDate(startOfWeek.getDate() + i);
      weekDates.push(day);
    }
    return weekDates;
  };

  const navigateWeek = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedDate);
    newDate.setDate(selectedDate.getDate() + (direction === 'next' ? 7 : -7));
    setSelectedDate(newDate);
  };

  return (
    <div className="min-h-screen bg-off-white p-4">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <header className="mb-6">
          <h1 className="text-3xl font-lora text-rich-charcoal mb-2">Meal Planner</h1>
          <p className="text-soft-taupe">Plan your meals for the week</p>
        </header>

        {/* Week Navigation */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigateWeek('prev')}
            className="p-2 text-soft-taupe hover:text-rich-charcoal transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div className="text-center">
            <h2 className="text-lg font-medium text-rich-charcoal">
              {formatDate(selectedDate)}
            </h2>
            <p className="text-sm text-soft-taupe">Week of {formatDate(getWeekDates(selectedDate)[0])}</p>
          </div>

          <button
            onClick={() => navigateWeek('next')}
            className="p-2 text-soft-taupe hover:text-rich-charcoal transition-colors"
          >
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>

        {/* Week Calendar */}
        <div className="bg-white rounded-xl p-4 mb-6 shadow-sm">
          <div className="grid grid-cols-7 gap-1">
            {getWeekDates(selectedDate).map((date, index) => (
              <button
                key={index}
                onClick={() => setSelectedDate(date)}
                className={`p-2 rounded-lg text-center transition-colors ${
                  date.toDateString() === selectedDate.toDateString()
                    ? 'bg-coral-blush text-white'
                    : 'hover:bg-gray-50'
                }`}
              >
                <div className="text-xs text-soft-taupe mb-1">
                  {date.toLocaleDateString('en-US', { weekday: 'short' })}
                </div>
                <div className="text-lg font-medium">
                  {date.getDate()}
                </div>
                <div className="text-xs">
                  {getMealsForDate(date).length} meals
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Selected Date Meals */}
        <div className="bg-white rounded-xl p-6 mb-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-rich-charcoal">
              {formatDate(selectedDate)}
            </h3>
            <button
              onClick={() => setShowAddMeal(true)}
              className="bg-coral-blush text-white p-2 rounded-lg hover:bg-opacity-90 transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-3">
            {mealTypes.map((mealType) => {
              const meal = getMealsForDate(selectedDate).find((m) => m.meal_type === mealType.id);

              return (
                <motion.div
                  key={mealType.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`p-4 rounded-xl border-2 border-dashed transition-all ${
                    meal ? 'border-gray-200 bg-white' : 'border-gray-200 bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-10 h-10 rounded-lg flex items-center justify-center ${mealType.color}`}
                      >
                        <span className="text-lg">{mealType.emoji}</span>
                      </div>
                      <div>
                        <h4 className="font-medium text-rich-charcoal">{mealType.name}</h4>
                        {meal
                          ? (
                            <p className="text-sm text-soft-taupe">
                              {getRecipeName(meal.recipe_id!)}
                            </p>
                          )
                          : (
                            <p className="text-sm text-soft-taupe">No meal planned</p>
                          )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {!meal && (
                        <button
                          onClick={() => {
                            setSelectedMealType(mealType.id as any);
                            setShowAddMeal(true);
                          }}
                          className="text-coral-blush hover:text-opacity-80 transition-colors"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      )}
                      {meal && (
                        <button
                          onClick={() => deleteMeal(meal.id)}
                          className="text-red-500 hover:text-red-700 transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  {meal && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      <div className="flex items-center gap-4 text-sm text-soft-taupe">
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          <span>{recipes.find(r => r.id === meal.recipe_id)?.cook_time || 15} min</span>
                        </div>
                        {meal.notes && (
                          <div className="flex items-center gap-1">
                            <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                              {meal.notes}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        </div>

        {/* AI Recommendations */}
        <div className="bg-gradient-to-r from-coral-blush to-orange-400 rounded-xl p-4 text-white mb-6">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-5 h-5" />
            <h3 className="font-medium">AI Recommendations</h3>
          </div>
          <p className="text-sm opacity-90 mb-3">
            Based on your pantry and preferences, here are some meal suggestions:
          </p>
          <div className="space-y-2">
            <div className="flex items-center justify-between bg-white bg-opacity-20 rounded-lg p-2">
              <span className="text-sm">Quick Chicken Stir-Fry</span>
              <button className="text-xs bg-white bg-opacity-30 px-2 py-1 rounded">Add</button>
            </div>
            <div className="flex items-center justify-between bg-white bg-opacity-20 rounded-lg p-2">
              <span className="text-sm">Vegetarian Pasta</span>
              <button className="text-xs bg-white bg-opacity-30 px-2 py-1 rounded">Add</button>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3">
          <button className="bg-white p-4 rounded-xl border border-gray-200 text-center hover:border-coral-blush transition-colors">
            <ChefHat className="w-8 h-8 mx-auto mb-2 text-coral-blush" />
            <span className="text-sm font-medium text-rich-charcoal">Browse Recipes</span>
          </button>
          <button className="bg-white p-4 rounded-xl border border-gray-200 text-center hover:border-coral-blush transition-colors">
            <Calendar className="w-8 h-8 mx-auto mb-2 text-sage-leaf" />
            <span className="text-sm font-medium text-rich-charcoal">Plan Week</span>
          </button>
        </div>
      </div>

      {/* Add Meal Modal */}
      <AnimatePresence>
        {showAddMeal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            onClick={() => setShowAddMeal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-xl p-6 w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-xl font-lora text-rich-charcoal mb-4">Add Meal</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-rich-charcoal mb-2">
                    Meal Type
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {mealTypes.map((type) => (
                      <button
                        key={type.id}
                        onClick={() => setSelectedMealType(type.id as any)}
                        className={`p-3 rounded-lg border-2 transition-all ${
                          selectedMealType === type.id
                            ? 'border-coral-blush bg-coral-blush text-white'
                            : 'border-gray-200 text-rich-charcoal'
                        }`}
                      >
                        <span className="text-lg">{type.emoji}</span>
                        <div className="text-sm font-medium">{type.name}</div>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-rich-charcoal mb-2">
                    Recipe
                  </label>
                  <select
                    value={newMeal.recipe_id}
                    onChange={(e) => setNewMeal(prev => ({ ...prev, recipe_id: e.target.value }))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:border-coral-blush focus:outline-none"
                  >
                    <option value="">Select a recipe...</option>
                    {recipes.map((recipe) => (
                      <option key={recipe.id} value={recipe.id}>
                        {recipe.name} ({recipe.cook_time} min)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-rich-charcoal mb-2">Notes</label>
                  <textarea
                    value={newMeal.notes}
                    onChange={(e) => setNewMeal(prev => ({ ...prev, notes: e.target.value }))}
                    placeholder="Any special notes or modifications..."
                    className="w-full p-3 border border-gray-300 rounded-lg focus:border-coral-blush focus:outline-none"
                    rows={3}
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button onClick={() => setShowAddMeal(false)} className="flex-1 btn-secondary">
                  Cancel
                </button>
                <button
                  onClick={addMeal}
                  className="flex-1 btn-primary"
                >
                  Add Meal
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MealPlanner;
