import { motion } from 'framer-motion';
import { Search } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { RecipeService } from '../api/aiService';
import { RecipeService as UserRecipeService } from '../api/recipeService';
import RecipeCard from '../components/RecipeCard';
import { Recipe } from '../types';
import { logger } from '../utils/logger';

const BrowseRecipes: React.FC = () => {
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState<'All' | 'Easy' | 'Medium' | 'Hard'>(
    'All',
  );

  const categories = [
    { id: 'all', name: 'All Recipes', emoji: '🍽️' },
    { id: 'beef', name: 'Beef', emoji: '🥩' },
    { id: 'chicken', name: 'Chicken', emoji: '🍗' },
    { id: 'seafood', name: 'Seafood', emoji: '🐟' },
    { id: 'vegetarian', name: 'Vegetarian', emoji: '🥬' },
    { id: 'dessert', name: 'Dessert', emoji: '🍰' },
    { id: 'breakfast', name: 'Breakfast', emoji: '🥞' },
  ];

  useEffect(() => {
    loadRandomRecipes();
  }, []);

  const loadRandomRecipes = async () => {
    setLoading(true);
    try {
      const randomRecipes = await Promise.all([
        RecipeService.getRandomRecipe(),
        RecipeService.getRandomRecipe(),
        RecipeService.getRandomRecipe(),
        RecipeService.getRandomRecipe(),
        RecipeService.getRandomRecipe(),
        RecipeService.getRandomRecipe(),
      ]);

      const validRecipes = randomRecipes
        .filter((recipe: any) => recipe !== null)
        .flatMap((recipe: any) => {
          if (Array.isArray(recipe)) {
            return recipe.map((r: any) => ({
              id: r.idMeal || r.id,
              name: r.strMeal || r.name,
              category: r.strCategory || r.category,
              area: r.strArea || r.area,
              instructions: r.strInstructions || r.instructions,
              image: r.strMealThumb || r.image,
              tags: r.tags || [],
              ingredients: r.ingredients || [],
              videoUrl: r.videoUrl || '',
              websiteUrl: r.websiteUrl || '',
              cookingTime: r.cookingTime || '',
              difficulty: r.difficulty || 'Easy',
              created_at: new Date().toISOString(),
            }));
          } else if (recipe) {
            return [
              {
                id: recipe.idMeal || recipe.id,
                name: recipe.strMeal || recipe.name,
                category: recipe.strCategory || recipe.category,
                area: recipe.strArea || recipe.area,
                instructions: recipe.strInstructions || recipe.instructions,
                image: recipe.strMealThumb || recipe.image,
                tags: recipe.tags || [],
                ingredients: recipe.ingredients || [],
                videoUrl: recipe.videoUrl || '',
                websiteUrl: recipe.websiteUrl || '',
                cookingTime: recipe.cookingTime || '',
                difficulty: recipe.difficulty || 'Easy',
                created_at: new Date().toISOString(),
              },
            ];
          }
          return [];
        });
      setRecipes(validRecipes);
    } catch (error) {
      logger.error('Error loading random recipes:', error);
      toast.error('Failed to load recipes');
    } finally {
      setLoading(false);
    }
  };

  const searchRecipes = async () => {
    if (!searchQuery.trim()) {
      loadRandomRecipes();
      return;
    }

    setLoading(true);
    try {
      const searchResults = await RecipeService.searchRecipes(searchQuery);
      // Convert the search results to the RecipeCard Recipe format
      const convertedRecipes: Recipe[] = (searchResults || []).map((recipe: any) => ({
        id: recipe.idMeal || recipe.id,
        name: recipe.strMeal || recipe.name,
        category: recipe.strCategory || recipe.category,
        area: recipe.strArea || recipe.area,
        instructions: recipe.strInstructions || recipe.instructions,
        image: recipe.strMealThumb || recipe.image,
        tags: recipe.tags || [],
        ingredients: recipe.ingredients || [],
        videoUrl: recipe.videoUrl || '',
        websiteUrl: recipe.websiteUrl || '',
        cookingTime: recipe.cookingTime || '',
        difficulty: recipe.difficulty || 'Easy',
        created_at: new Date().toISOString(), // Add missing created_at field
      }));
      setRecipes(convertedRecipes);
      if (convertedRecipes.length === 0) {
        toast.error('No recipes found for your search');
      }
    } catch (error) {
      logger.error('Error searching recipes:', error);
      toast.error('Failed to search recipes');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    searchRecipes();
  };

  const handleCategoryFilter = (category: string) => {
    setSelectedCategory(category);
    if (category === 'all') {
      loadRandomRecipes();
    } else {
      searchRecipes();
    }
  };

  const handleSaveRecipe = async (recipe: Recipe) => {
    try {
      const success = await UserRecipeService.saveMealDBRecipe({
        mealdbId: recipe.id,
        name: recipe.name,
        image: recipe.image,
        category: recipe.category,
        area: recipe.area
      });
      if (success) {
        toast.success('Recipe saved to your collection!');
      } else {
        toast.error('Failed to save recipe');
      }
    } catch (error) {
      logger.error('Error saving recipe:', error);
      toast.error('Failed to save recipe');
    }
  };

  const filteredRecipes =
    selectedCategory === 'all'
      ? recipes
      : recipes.filter(
          (recipe) =>
            recipe.category?.toLowerCase().includes(selectedCategory.toLowerCase()) ||
            recipe.name.toLowerCase().includes(selectedCategory.toLowerCase()),
        );

  const difficultyFiltered =
    selectedDifficulty === 'All'
      ? filteredRecipes
      : filteredRecipes.filter((r) => (r.difficulty || 'Medium') === selectedDifficulty);

  return (
    <div className="min-h-screen bg-off-white p-4">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <header className="mb-6">
          <h1 className="text-3xl font-lora text-rich-charcoal mb-2">Browse Recipes</h1>
          <p className="text-soft-taupe">Discover delicious recipes from around the world</p>
        </header>

        {/* Search Bar */}
        <div className="mb-6">
          <form onSubmit={handleSearch} className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for recipes..."
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

        {/* Category Filters */}
        <div className="mb-6">
          <div className="flex gap-2 overflow-x-auto pb-2">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => handleCategoryFilter(category.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
                  selectedCategory === category.id
                    ? 'bg-coral-blush text-white'
                    : 'bg-white text-rich-charcoal border border-gray-200'
                }`}
              >
                <span>{category.emoji}</span>
                <span className="text-sm font-medium">{category.name}</span>
              </button>
            ))}
          </div>
          <div className="flex gap-2 overflow-x-auto pt-3">
            {(['All', 'Easy', 'Medium', 'Hard'] as const).map((diff) => (
              <button
                key={diff}
                onClick={() => setSelectedDifficulty(diff)}
                className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                  selectedDifficulty === diff
                    ? 'bg-rich-charcoal text-white'
                    : 'bg-white text-rich-charcoal border border-gray-200'
                }`}
              >
                {diff}
              </button>
            ))}
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-coral-blush"></div>
          </div>
        )}

        {/* Recipes Grid */}
        {!loading && (
          <div className="space-y-4">
            {filteredRecipes.length === 0 ? (
              <div className="text-center py-12">
                <h3 className="text-lg font-medium text-rich-charcoal mb-2">No recipes found</h3>
                <p className="text-soft-taupe">
                  Try adjusting your search or browse our random recipes
                </p>
                <button
                  onClick={loadRandomRecipes}
                  className="mt-4 bg-coral-blush text-white px-6 py-2 rounded-lg hover:bg-opacity-90 transition-colors"
                >
                  Load Random Recipes
                </button>
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-medium text-rich-charcoal">
                    {difficultyFiltered.length} Recipes
                  </h2>
                  <button
                    onClick={loadRandomRecipes}
                    className="text-sm text-coral-blush hover:text-opacity-80"
                  >
                    Refresh
                  </button>
                </div>
                <div className="space-y-4">
                  {difficultyFiltered.map((recipe, index) => (
                    <motion.div
                      key={recipe.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <RecipeCard
                        recipe={recipe}
                        onSave={() => handleSaveRecipe(recipe)}
                        showActions={true}
                      />
                    </motion.div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default BrowseRecipes;
