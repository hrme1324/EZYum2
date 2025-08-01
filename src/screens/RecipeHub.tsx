import { motion } from 'framer-motion';
import { BookOpen, Calendar, Heart, RefreshCw, Search, Star } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { RecipeService as MealDBService } from '../api/aiService';
import { MealService } from '../api/mealService';
import { RecipeService as UserRecipeService } from '../api/recipeService';
import RecipeCard, { Recipe } from '../components/RecipeCard';
import { useAuthStore } from '../state/authStore';
import { IS_OFFLINE_MODE, MOCK_MEALS, MOCK_RECIPES } from '../utils/constants';

type RecipeSource = 'discovery' | 'saved' | 'my-recipes' | 'all';

interface RecipeWithSource extends Recipe {
  id: string;
  source: RecipeSource;
  isSaved?: boolean;
}

const RecipeHub: React.FC = () => {
  const { user } = useAuthStore();
  const [recipes, setRecipes] = useState<RecipeWithSource[]>([]);
  const [savedRecipes, setSavedRecipes] = useState<RecipeWithSource[]>([]);
  const [weeklyRecipes, setWeeklyRecipes] = useState<RecipeWithSource[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<RecipeSource>('all');

  useEffect(() => {
    if (user) {
      loadAllRecipes();
    }
  }, [user]);

  const loadAllRecipes = async () => {
    if (!user) return;

    try {
      setLoading(true);

      if (IS_OFFLINE_MODE) {
        // Use mock data when offline
        const mockSavedRecipes = MOCK_RECIPES.map((recipe) => ({
          ...recipe,
          source: 'saved' as RecipeSource,
          isSaved: true,
        }));
        setSavedRecipes(mockSavedRecipes);

        const mockMealsWithSource = MOCK_MEALS.map((meal) => ({
          id: meal.id,
          name: meal.recipe_id === 'mock-1' ? 'Chicken Pasta' : 'Greek Salad',
          category: 'Meal',
          area: '',
          instructions: meal.notes || '',
          image: '',
          tags: [meal.meal_type, meal.status],
          ingredients: [],
          videoUrl: '',
          websiteUrl: '',
          cookingTime: '',
          difficulty: 'Easy' as const,
          source: 'my-recipes' as RecipeSource,
          isSaved: true,
        }));
        setWeeklyRecipes(mockMealsWithSource);

        const mockDiscoveryRecipes = MOCK_RECIPES.map((recipe) => ({
          ...recipe,
          source: 'discovery' as RecipeSource,
          isSaved: false,
        }));
        setRecipes(mockDiscoveryRecipes);
      } else {
        // Load saved recipes
        const savedRecipes = await UserRecipeService.getUserRecipes();
        const savedWithSource = savedRecipes.map((recipe) => ({
          ...recipe,
          source: 'saved' as RecipeSource,
          isSaved: true,
        }));
        setSavedRecipes(savedWithSource);

        // Load meals
        const meals = await MealService.getAllMeals(user.id);
        const mealsWithSource = meals.map((meal) => ({
          id: meal.id,
          name:
            meal.recipe_name || `${meal.meal_type} on ${new Date(meal.date).toLocaleDateString()}`,
          category: 'Meal',
          area: '',
          instructions: meal.notes || '',
          image: '',
          tags: [meal.meal_type, meal.status],
          ingredients: [],
          videoUrl: '',
          websiteUrl: '',
          cookingTime: '',
          difficulty: 'Easy' as const,
          source: 'my-recipes' as RecipeSource,
          isSaved: true,
        }));
        setWeeklyRecipes(mealsWithSource);

        // Load discovery recipes
        await loadDiscoveryRecipes();
      }
    } catch (error) {
      console.error('Error loading recipes:', error);
      toast.error('Failed to load recipes');
    } finally {
      setLoading(false);
    }
  };

  const loadDiscoveryRecipes = async () => {
    if (IS_OFFLINE_MODE) {
      const mockDiscoveryRecipes = MOCK_RECIPES.map((recipe) => ({
        ...recipe,
        source: 'discovery' as RecipeSource,
        isSaved: false,
      }));
      setRecipes(mockDiscoveryRecipes);
      return;
    }

    try {
      // Load 5 random recipes instead of 1
      const discoveryRecipes = await Promise.all([
        MealDBService.getRandomRecipe(),
        MealDBService.getRandomRecipe(),
        MealDBService.getRandomRecipe(),
        MealDBService.getRandomRecipe(),
        MealDBService.getRandomRecipe(),
      ]);

      // Filter out null results and flatten
      const validRecipes = discoveryRecipes
        .filter((recipe) => recipe !== null)
        .flatMap((recipe) => {
          if (Array.isArray(recipe)) {
            return recipe.map((r: Recipe) => ({
              ...r,
              source: 'discovery' as RecipeSource,
              isSaved: false,
            }));
          } else if (recipe) {
            return [
              {
                ...(recipe as Recipe),
                source: 'discovery' as RecipeSource,
                isSaved: false,
              },
            ];
          }
          return [];
        });

      setRecipes(validRecipes);
    } catch (error) {
      console.error('Error loading discovery recipes:', error);
      toast.error('Failed to load discovery recipes');
    }
  };

  const handleSaveRecipe = async (recipe: RecipeWithSource) => {
    if (IS_OFFLINE_MODE) {
      // Simulate saving in offline mode
      setRecipes((prev) => prev.map((r) => (r.id === recipe.id ? { ...r, isSaved: true } : r)));
      setSavedRecipes((prev) => [...prev, { ...recipe, isSaved: true }]);
      toast.success('Recipe saved! (Offline mode)');
      return;
    }

    try {
      const success = await UserRecipeService.saveMealDBRecipe(recipe, recipe.id);
      if (success) {
        setRecipes((prev) => prev.map((r) => (r.id === recipe.id ? { ...r, isSaved: true } : r)));
        setSavedRecipes((prev) => [...prev, { ...recipe, isSaved: true }]);
        toast.success('Recipe saved successfully!');
      } else {
        toast.error('Failed to save recipe');
      }
    } catch (error) {
      console.error('Error saving recipe:', error);
      toast.error('Failed to save recipe');
    }
  };

  const handleUnsaveRecipe = async (recipeId: string) => {
    if (IS_OFFLINE_MODE) {
      // Simulate unsaving in offline mode
      setRecipes((prev) => prev.filter((r) => r.id !== recipeId));
      setSavedRecipes((prev) => prev.filter((r) => r.id !== recipeId));
      toast.success('Recipe removed! (Offline mode)');
      return;
    }

    try {
      const success = await UserRecipeService.deleteRecipe(recipeId);
      if (success) {
        setRecipes((prev) => prev.filter((r) => r.id !== recipeId));
        setSavedRecipes((prev) => prev.filter((r) => r.id !== recipeId));
        toast.success('Recipe removed successfully!');
      } else {
        toast.error('Failed to remove recipe');
      }
    } catch (error) {
      console.error('Error removing recipe:', error);
      toast.error('Failed to remove recipe');
    }
  };

  const handleAddToWeekly = async () => {
    // Placeholder for future weekly meal plan integration
    toast.success('Added to weekly plan! (Coming soon)');
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      await loadDiscoveryRecipes();
      return;
    }

    if (IS_OFFLINE_MODE) {
      // Filter mock data in offline mode
      const filtered = MOCK_RECIPES.filter(
        (recipe) =>
          recipe.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (recipe.category && recipe.category.toLowerCase().includes(searchQuery.toLowerCase()))
      );
      const filteredWithSource = filtered.map((recipe) => ({
        ...recipe,
        source: 'discovery' as RecipeSource,
        isSaved: false,
      }));
      setRecipes(filteredWithSource);
      return;
    }

    try {
      const searchResults = await MealDBService.searchRecipes(searchQuery);
      if (searchResults) {
        const searchWithSource = searchResults.map((recipe) => ({
          ...recipe,
          source: 'discovery' as RecipeSource,
          isSaved: false,
        }));
        setRecipes(searchWithSource);
      }
    } catch (error) {
      console.error('Error searching recipes:', error);
      toast.error('Failed to search recipes');
    }
  };

  // Combine all recipes based on filter
  const allRecipes = [...savedRecipes, ...weeklyRecipes, ...recipes];
  const filteredRecipes = allRecipes.filter((recipe) => {
    if (activeFilter === 'all') return true;
    if (activeFilter === 'saved') return recipe.source === 'saved';
    if (activeFilter === 'my-recipes') return recipe.source === 'my-recipes';
    if (activeFilter === 'discovery') return recipe.source === 'discovery';
    return true;
  });

  const getFilterCount = (filter: RecipeSource) => {
    if (filter === 'all') return allRecipes.length;
    if (filter === 'saved') return savedRecipes.length;
    if (filter === 'my-recipes') return weeklyRecipes.length;
    if (filter === 'discovery') return recipes.length;
    return 0;
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-off-white p-4">
        <div className="max-w-md mx-auto">
          <div className="text-center py-12">
            <p className="text-soft-taupe">Please log in to access your recipe hub</p>
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
          <h1 className="text-3xl font-lora text-rich-charcoal mb-2">Recipe Hub</h1>
          <p className="text-soft-taupe">Discover, save, and organize your favorite recipes</p>
        </header>

        {/* Search Bar */}
        <div className="mb-6">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSearch();
            }}
            className="relative"
          >
            <input
              type="text"
              placeholder="Search recipes..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full p-4 pr-12 border border-gray-300 rounded-xl focus:ring-2 focus:ring-coral-blush focus:border-transparent"
            />
            <button
              type="submit"
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-coral-blush hover:text-opacity-80"
            >
              <Search className="w-5 h-5" />
            </button>
          </form>
        </div>

        {/* Filter Buttons */}
        <div className="mb-6">
          <div className="flex gap-2 overflow-x-auto pb-2">
            <button
              onClick={() => setActiveFilter('all')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
                activeFilter === 'all'
                  ? 'bg-coral-blush text-white'
                  : 'bg-white text-rich-charcoal border border-gray-200'
              }`}
            >
              <BookOpen className="w-4 h-4" />
              <span className="text-sm font-medium">All ({getFilterCount('all')})</span>
            </button>

            <button
              onClick={() => setActiveFilter('saved')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
                activeFilter === 'saved'
                  ? 'bg-coral-blush text-white'
                  : 'bg-white text-rich-charcoal border border-gray-200'
              }`}
            >
              <Heart className="w-4 h-4" />
              <span className="text-sm font-medium">Saved ({getFilterCount('saved')})</span>
            </button>

            <button
              onClick={() => setActiveFilter('my-recipes')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
                activeFilter === 'my-recipes'
                  ? 'bg-coral-blush text-white'
                  : 'bg-white text-rich-charcoal border border-gray-200'
              }`}
            >
              <Calendar className="w-4 h-4" />
              <span className="text-sm font-medium">
                My Recipes ({getFilterCount('my-recipes')})
              </span>
            </button>

            <button
              onClick={() => setActiveFilter('discovery')}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
                activeFilter === 'discovery'
                  ? 'bg-coral-blush text-white'
                  : 'bg-white text-rich-charcoal border border-gray-200'
              }`}
            >
              <Star className="w-4 h-4" />
              <span className="text-sm font-medium">Discover ({getFilterCount('discovery')})</span>
            </button>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-coral-blush mx-auto"></div>
            <p className="text-soft-taupe mt-2">Loading recipes...</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && filteredRecipes.length === 0 && (
          <div className="text-center py-12">
            <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-rich-charcoal mb-2">No recipes found</h3>
            <p className="text-soft-taupe mb-4">
              {searchQuery
                ? `No recipes match "${searchQuery}"`
                : 'Start exploring to discover amazing recipes'}
            </p>
            {!searchQuery && (
              <button
                onClick={loadDiscoveryRecipes}
                className="bg-coral-blush text-white px-6 py-2 rounded-lg hover:bg-opacity-90 transition-colors"
              >
                Discover Recipes
              </button>
            )}
          </div>
        )}

        {/* Recipes List */}
        {!loading && filteredRecipes.length > 0 && (
          <div className="space-y-4">
            {filteredRecipes.map((recipe, index) => (
              <motion.div
                key={recipe.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <RecipeCard
                  recipe={recipe}
                  onSave={() => handleSaveRecipe(recipe)}
                  onDelete={recipe.isSaved ? () => handleUnsaveRecipe(recipe.id) : undefined}
                  showActions={true}
                  quickActions={[
                    {
                      label: recipe.isSaved ? 'Remove' : 'Save',
                      icon: recipe.isSaved ? Heart : Heart,
                      action: recipe.isSaved
                        ? () => handleUnsaveRecipe(recipe.id)
                        : () => handleSaveRecipe(recipe),
                      className: recipe.isSaved
                        ? 'text-red-500 hover:text-red-600'
                        : 'text-coral-blush hover:text-opacity-80',
                    },
                    {
                      label: 'Add to Weekly',
                      icon: Calendar,
                      action: () => handleAddToWeekly(),
                      className: 'text-blue-500 hover:text-blue-600',
                    },
                  ]}
                />
              </motion.div>
            ))}
          </div>
        )}

        {/* Refresh Button for All and Discovery */}
        {(activeFilter === 'all' || activeFilter === 'discovery') && !loading && (
          <div className="mt-6 text-center">
            <button
              onClick={loadDiscoveryRecipes}
              className="flex items-center gap-2 mx-auto bg-coral-blush text-white px-6 py-3 rounded-lg hover:bg-opacity-90 transition-colors font-medium"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Load More Recipes</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default RecipeHub;
