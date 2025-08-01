import { motion } from 'framer-motion';
import {
    ChefHat,
    ChevronLeft,
    ChevronRight,
    Clock,
    Search,
    Trash2,
    X
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { RecipeService } from '../api/aiService';
import { MealService } from '../api/mealService';
import { Recipe } from '../components/RecipeCard';
import { useAuthStore } from '../state/authStore';
import { Meal } from '../types';

const MealPlanner: React.FC = () => {
  const { user } = useAuthStore();
  const [meals, setMeals] = useState<Meal[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showBrowseRecipes, setShowBrowseRecipes] = useState(false);

  const [searchQuery, setSearchQuery] = useState('');
  const [browseRecipes, setBrowseRecipes] = useState<Recipe[]>([]);
  const [browseLoading, setBrowseLoading] = useState(false);
  const [draggedRecipe, setDraggedRecipe] = useState<Recipe | null>(null);

  const mealTypes = [
    { id: 'breakfast', name: 'Breakfast', emoji: '🌅', color: 'bg-orange-100' },
    { id: 'lunch', name: 'Lunch', emoji: '☀️', color: 'bg-yellow-100' },
    { id: 'dinner', name: 'Dinner', emoji: '🌙', color: 'bg-purple-100' },
    { id: 'snack', name: 'Snack', emoji: '🍎', color: 'bg-green-100' },
  ];

  useEffect(() => {
    if (user) {
      loadMeals();
    }
  }, [user, selectedDate]);

  const loadMeals = async () => {
    if (!user) return;

    try {
      const mealsData = await MealService.getMealsForDateRange(
        user.id,
        selectedDate.toISOString().split('T')[0],
        selectedDate.toISOString().split('T')[0]
      );
      setMeals(mealsData || []);
    } catch (error) {
      console.error('Error loading meals:', error);
      toast.error('Failed to load meals');
    }
  };

  const searchRecipes = async () => {
    if (!searchQuery.trim()) return;

    try {
      setBrowseLoading(true);
      const recipesData = await RecipeService.searchRecipes(searchQuery);
      setBrowseRecipes(recipesData || []);
    } catch (error) {
      console.error('Error searching recipes:', error);
      toast.error('Failed to search recipes');
    } finally {
      setBrowseLoading(false);
    }
  };

  const handleDragStart = (recipe: Recipe) => {
    setDraggedRecipe(recipe);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (mealType: string) => {
    if (!draggedRecipe || !user) return;

    try {
      const mealData = {
        date: selectedDate.toISOString().split('T')[0],
        meal_type: mealType as 'breakfast' | 'lunch' | 'dinner' | 'snack',
        recipe_id: draggedRecipe.id,
        recipe_name: draggedRecipe.name,
        notes: 'Added from recipe search',
        status: 'planned' as const,
      };

      const success = await MealService.addMeal(user.id, mealData);
      if (success) {
        await loadMeals();
        toast.success(`${draggedRecipe.name} added to ${mealType}`);
      } else {
        toast.error('Failed to add meal');
      }
    } catch (error) {
      console.error('Error adding meal:', error);
      toast.error('Failed to add meal');
    } finally {
      setDraggedRecipe(null);
    }
  };

  const deleteMeal = async (mealId: string) => {
    if (!user) return;

    try {
      const success = await MealService.deleteMeal(user.id, mealId);
      if (success) {
        await loadMeals();
        toast.success('Meal deleted successfully');
      } else {
        toast.error('Failed to delete meal');
      }
    } catch (error) {
      console.error('Error deleting meal:', error);
      toast.error('Failed to delete meal');
    }
  };

  const getMealsForType = (mealType: string) => {
    return meals.filter(meal => meal.meal_type === mealType);
  };

  const formatDate = (date: Date) => date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric'
  });

  const navigateDate = (direction: 'prev' | 'next') => {
    const newDate = new Date(selectedDate);
    if (direction === 'prev') {
      newDate.setDate(newDate.getDate() - 1);
    } else {
      newDate.setDate(newDate.getDate() + 1);
    }
    setSelectedDate(newDate);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-off-white p-4">
        <div className="max-w-md mx-auto">
          <div className="text-center py-12">
            <p className="text-soft-taupe">Please log in to access meal planner</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-off-white p-4">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <header className="mb-6">
          <h1 className="text-3xl font-lora text-rich-charcoal mb-2">Meal Planner</h1>
          <p className="text-soft-taupe">Plan your meals for the day</p>
        </header>

        {/* Date Navigation */}
        <div className="flex items-center justify-between mb-6">
          <button
            onClick={() => navigateDate('prev')}
            className="p-2 text-coral-blush hover:bg-coral-blush hover:text-white rounded-lg transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="text-center">
            <h2 className="text-lg font-medium text-rich-charcoal">{formatDate(selectedDate)}</h2>
            <p className="text-sm text-soft-taupe">Today's meals</p>
          </div>
          <button
            onClick={() => navigateDate('next')}
            className="p-2 text-coral-blush hover:bg-coral-blush hover:text-white rounded-lg transition-colors"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Browse Recipes Button */}
        <div className="mb-6">
          <button
            onClick={() => setShowBrowseRecipes(true)}
            className="w-full bg-coral-blush text-white py-3 px-4 rounded-xl hover:bg-opacity-90 transition-colors font-medium flex items-center justify-center gap-2"
          >
            <Search className="w-5 h-5" />
            Browse & Add Recipes
          </button>
        </div>

        {/* Meal Types */}
        <div className="space-y-4">
          {mealTypes.map((mealType) => (
            <motion.div
              key={mealType.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`${mealType.color} rounded-xl p-4 border-2 border-dashed border-gray-300 min-h-[120px] transition-colors ${
                draggedRecipe ? 'border-coral-blush bg-opacity-80' : ''
              }`}
              onDragOver={handleDragOver}
              onDrop={() => handleDrop(mealType.id)}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <span className="text-2xl">{mealType.emoji}</span>
                  <h3 className="font-medium text-rich-charcoal">{mealType.name}</h3>
                </div>
                <Clock className="w-4 h-4 text-soft-taupe" />
              </div>

              {/* Meals for this type */}
              <div className="space-y-2">
                {getMealsForType(mealType.id).map((meal) => (
                  <motion.div
                    key={meal.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="bg-white rounded-lg p-3 shadow-sm border border-gray-100"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-rich-charcoal">{meal.recipe_name}</h4>
                        {meal.notes && (
                          <p className="text-sm text-soft-taupe mt-1">{meal.notes}</p>
                        )}
                      </div>
                      <button
                        onClick={() => deleteMeal(meal.id)}
                        className="p-1 text-red-500 hover:bg-red-50 rounded transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.div>
                ))}

                {getMealsForType(mealType.id).length === 0 && (
                  <div className="text-center py-4 text-soft-taupe">
                    <p className="text-sm">Drop a recipe here</p>
                  </div>
                )}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Browse Recipes Modal */}
        {showBrowseRecipes && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-xl p-6 w-full max-w-md max-h-[80vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-rich-charcoal">Browse Recipes</h3>
                <button
                  onClick={() => setShowBrowseRecipes(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Search */}
              <div className="mb-4">
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search recipes..."
                    className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-coral-blush focus:border-transparent"
                    onKeyPress={(e) => e.key === 'Enter' && searchRecipes()}
                  />
                  <button
                    onClick={searchRecipes}
                    disabled={browseLoading}
                    className="px-4 py-3 bg-coral-blush text-white rounded-lg hover:bg-opacity-90 transition-colors disabled:opacity-50"
                  >
                    {browseLoading ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    ) : (
                      <Search className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Recipe Results */}
              <div className="space-y-3">
                {browseRecipes.map((recipe) => (
                  <motion.div
                    key={recipe.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    draggable
                    onDragStart={() => handleDragStart(recipe)}
                    className="bg-gray-50 rounded-lg p-3 cursor-move hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-rich-charcoal">{recipe.name}</h4>
                        <div className="flex items-center gap-2 text-sm text-soft-taupe mt-1">
                          {recipe.category && <span>{recipe.category}</span>}
                          {recipe.cookingTime && <span>• {recipe.cookingTime}</span>}
                          {recipe.difficulty && <span>• {recipe.difficulty}</span>}
                        </div>
                      </div>
                      <ChefHat className="w-4 h-4 text-coral-blush" />
                    </div>
                  </motion.div>
                ))}

                {browseRecipes.length === 0 && searchQuery && !browseLoading && (
                  <div className="text-center py-8">
                    <p className="text-soft-taupe">No recipes found</p>
                  </div>
                )}

                {!searchQuery && (
                  <div className="text-center py-8">
                    <p className="text-soft-taupe">Search for recipes to add to your meal plan</p>
                  </div>
                )}
              </div>

              <div className="mt-6 text-center">
                <p className="text-sm text-soft-taupe">
                  💡 Drag recipes to meal slots to add them to your plan
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MealPlanner;
