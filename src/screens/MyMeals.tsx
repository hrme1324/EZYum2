import { motion } from 'framer-motion';
import {
    CheckCircle,
    Clock,
    Plus,
    Trash2,
    Utensils,
    XCircle
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { MealService } from '../api/mealService';
import { RecipeService } from '../api/recipeService';
import { Recipe } from '../components/RecipeCard';
import { useAuthStore } from '../state/authStore';

interface Meal {
  id: string;
  user_id: string;
  date: string;
  meal_type: string;
  recipe_id?: string;
  status: 'planned' | 'cooked' | 'skipped';
  notes?: string;
  created_at: string;
  recipe?: Recipe;
}

const MyMeals: React.FC = () => {
  const { user } = useAuthStore();
  const [meals, setMeals] = useState<Meal[]>([]);
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddMeal, setShowAddMeal] = useState(false);
  const [newMeal, setNewMeal] = useState({
    date: new Date().toISOString().split('T')[0],
    meal_type: 'breakfast' as 'breakfast' | 'lunch' | 'dinner' | 'snack',
    recipe_id: '',
    notes: '',
    status: 'planned' as const
  });

  useEffect(() => {
    if (user) {
      loadMeals();
      loadRecipes();
    }
  }, [user]);

  const loadMeals = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const allMeals = await MealService.getAllMeals(user.id);
      setMeals(allMeals || []);
    } catch (error) {
      console.error('Error loading meals:', error);
      toast.error('Failed to load meals');
    } finally {
      setLoading(false);
    }
  };

  const loadRecipes = async () => {
    if (!user) return;

    try {
      const userRecipes = await RecipeService.getUserRecipes();
      setRecipes(userRecipes || []);
    } catch (error) {
      console.error('Error loading recipes:', error);
    }
  };

  const handleAddMeal = async () => {
    if (!user) return;

    try {
      const success = await MealService.addMeal(user.id, {
        date: newMeal.date,
        meal_type: newMeal.meal_type,
        recipe_id: newMeal.recipe_id || undefined,
        notes: newMeal.notes,
        status: newMeal.status
      });

      if (success) {
        await loadMeals();
        setShowAddMeal(false);
        setNewMeal({
          date: new Date().toISOString().split('T')[0],
          meal_type: 'breakfast',
          recipe_id: '',
          notes: '',
          status: 'planned'
        });
        toast.success('Meal added successfully!');
      } else {
        toast.error('Failed to add meal');
      }
    } catch (error) {
      console.error('Error adding meal:', error);
      toast.error('Failed to add meal');
    }
  };

  const handleUpdateMealStatus = async (mealId: string, status: 'planned' | 'cooked' | 'skipped') => {
    if (!user) return;

    try {
      const success = await MealService.updateMeal(user.id, mealId, { status });
      if (success) {
        await loadMeals();
        toast.success('Meal status updated!');
      } else {
        toast.error('Failed to update meal status');
      }
    } catch (error) {
      console.error('Error updating meal status:', error);
      toast.error('Failed to update meal status');
    }
  };

  const handleDeleteMeal = async (mealId: string) => {
    if (!user) return;

    try {
      const success = await MealService.deleteMeal(user.id, mealId);
      if (success) {
        await loadMeals();
        toast.success('Meal deleted successfully!');
      } else {
        toast.error('Failed to delete meal');
      }
    } catch (error) {
      console.error('Error deleting meal:', error);
      toast.error('Failed to delete meal');
    }
  };

  const getMealTypeIcon = (mealType: string) => {
    switch (mealType.toLowerCase()) {
      case 'breakfast':
        return '🌅';
      case 'lunch':
        return '🌞';
      case 'dinner':
        return '🌙';
      case 'snack':
        return '🍎';
      default:
        return '🍽️';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'cooked':
        return 'text-green-600 bg-green-100';
      case 'skipped':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-blue-600 bg-blue-100';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'cooked':
        return <CheckCircle className="w-4 h-4" />;
      case 'skipped':
        return <XCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric'
    });
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-off-white p-4">
        <div className="max-w-md mx-auto">
          <div className="text-center py-12">
            <p className="text-soft-taupe">Please log in to access your meals</p>
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
          <h1 className="text-3xl font-lora text-rich-charcoal mb-2">My Meals</h1>
          <p className="text-soft-taupe">Track and manage your meal planning</p>
        </header>

        {/* Add Meal Button */}
        <div className="mb-6">
          <button
            onClick={() => setShowAddMeal(true)}
            className="w-full bg-coral-blush text-white py-3 px-4 rounded-xl hover:bg-opacity-90 transition-colors font-medium flex items-center justify-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Add New Meal
          </button>
        </div>

        {/* Add Meal Modal */}
        {showAddMeal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-xl p-6 w-full max-w-md"
            >
              <h3 className="text-lg font-medium text-rich-charcoal mb-4">Add New Meal</h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-rich-charcoal mb-2">Date</label>
                  <input
                    type="date"
                    value={newMeal.date}
                    onChange={(e) => setNewMeal({ ...newMeal, date: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-coral-blush focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-rich-charcoal mb-2">Meal Type</label>
                  <select
                    value={newMeal.meal_type}
                    onChange={(e) => setNewMeal({ ...newMeal, meal_type: e.target.value as 'breakfast' | 'lunch' | 'dinner' | 'snack' })}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-coral-blush focus:border-transparent"
                  >
                    <option value="breakfast">Breakfast</option>
                    <option value="lunch">Lunch</option>
                    <option value="dinner">Dinner</option>
                    <option value="snack">Snack</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-rich-charcoal mb-2">Recipe (Optional)</label>
                  <select
                    value={newMeal.recipe_id}
                    onChange={(e) => setNewMeal({ ...newMeal, recipe_id: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-coral-blush focus:border-transparent"
                  >
                    <option value="">No recipe selected</option>
                    {recipes.map((recipe) => (
                      <option key={recipe.id} value={recipe.id}>
                        {recipe.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-rich-charcoal mb-2">Notes (Optional)</label>
                  <textarea
                    value={newMeal.notes}
                    onChange={(e) => setNewMeal({ ...newMeal, notes: e.target.value })}
                    placeholder="Add any notes about this meal..."
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-coral-blush focus:border-transparent resize-none"
                    rows={3}
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowAddMeal(false)}
                  className="flex-1 bg-gray-200 text-rich-charcoal py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAddMeal}
                  className="flex-1 bg-coral-blush text-white py-2 px-4 rounded-lg hover:bg-opacity-90 transition-colors"
                >
                  Add Meal
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-coral-blush mx-auto"></div>
            <p className="text-soft-taupe mt-2">Loading meals...</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && meals.length === 0 && (
          <div className="text-center py-12">
            <Utensils className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-rich-charcoal mb-2">No meals yet</h3>
            <p className="text-soft-taupe mb-4">Start adding meals to track your eating habits</p>
            <button
              onClick={() => setShowAddMeal(true)}
              className="bg-coral-blush text-white px-6 py-2 rounded-lg hover:bg-opacity-90 transition-colors"
            >
              Add Your First Meal
            </button>
          </div>
        )}

        {/* Meals List */}
        {!loading && meals.length > 0 && (
          <div className="space-y-4">
            {meals.map((meal) => (
              <motion.div
                key={meal.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-xl p-4 shadow-sm border border-gray-100"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{getMealTypeIcon(meal.meal_type)}</span>
                    <div>
                      <h3 className="font-medium text-rich-charcoal capitalize">
                        {meal.meal_type}
                      </h3>
                      <p className="text-sm text-soft-taupe">{formatDate(meal.date)}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getStatusColor(meal.status)}`}>
                      {getStatusIcon(meal.status)}
                      {meal.status}
                    </span>
                  </div>
                </div>

                {meal.recipe && (
                  <div className="mb-3 p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm font-medium text-rich-charcoal">{meal.recipe.name}</p>
                    {meal.recipe.category && (
                      <p className="text-xs text-soft-taupe">{meal.recipe.category}</p>
                    )}
                  </div>
                )}

                {meal.notes && (
                  <p className="text-sm text-soft-taupe mb-3 italic">"{meal.notes}"</p>
                )}

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleUpdateMealStatus(meal.id, 'cooked')}
                    className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-colors ${
                      meal.status === 'cooked'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-600 hover:bg-green-100 hover:text-green-700'
                    }`}
                  >
                    Mark Cooked
                  </button>
                  <button
                    onClick={() => handleUpdateMealStatus(meal.id, 'skipped')}
                    className={`flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-colors ${
                      meal.status === 'skipped'
                        ? 'bg-red-100 text-red-700'
                        : 'bg-gray-100 text-gray-600 hover:bg-red-100 hover:text-red-700'
                    }`}
                  >
                    Mark Skipped
                  </button>
                  <button
                    onClick={() => handleDeleteMeal(meal.id)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyMeals;
