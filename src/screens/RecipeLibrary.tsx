import { AnimatePresence, motion } from 'framer-motion';
import {
    ChefHat,
    ExternalLink,
    Link,
    Plus,
    Search,
    Trash2,
    X,
    Youtube
} from 'lucide-react';
import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { RecipeService, UserRecipe } from '../api/recipeService';
import { useAuthStore } from '../state/authStore';

const RecipeLibrary: React.FC = () => {
  const { user } = useAuthStore();
  const [recipes, setRecipes] = useState<UserRecipe[]>([]);
  const [showAddRecipe, setShowAddRecipe] = useState(false);
  const [showRecipeDetails, setShowRecipeDetails] = useState(false);
  const [selectedRecipe, setSelectedRecipe] = useState<UserRecipe | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);

  const [newRecipe, setNewRecipe] = useState({
    name: '',
    category: '',
    area: '',
    instructions: '',
    ingredients: [] as Array<{ name: string; measure: string }>,
    image: '',
    videoUrl: '',
    websiteUrl: '',
    cookingTime: '',
    difficulty: 'Easy' as 'Easy' | 'Medium' | 'Hard',
    tags: [] as string[],
  });

  const [currentIngredient, setCurrentIngredient] = useState('');
  const [currentMeasure, setCurrentMeasure] = useState('');
  const [currentTag, setCurrentTag] = useState('');

  useEffect(() => {
    if (user) {
      loadUserRecipes();
    }
  }, [user]);

  const loadUserRecipes = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const userRecipes = await RecipeService.getUserRecipes();
      setRecipes(userRecipes);
    } catch (error) {
      console.error('Error loading user recipes:', error);
      toast.error('Failed to load recipes');
    } finally {
      setLoading(false);
    }
  };

  const addIngredient = () => {
    if (currentIngredient.trim() && currentMeasure.trim()) {
      setNewRecipe(prev => ({
        ...prev,
        ingredients: [...prev.ingredients, {
          name: currentIngredient.trim(),
          measure: currentMeasure.trim()
        }]
      }));
      setCurrentIngredient('');
      setCurrentMeasure('');
    }
  };

  const removeIngredient = (index: number) => {
    setNewRecipe(prev => ({
      ...prev,
      ingredients: prev.ingredients.filter((_, i) => i !== index)
    }));
  };

  const addTag = () => {
    if (currentTag.trim()) {
      setNewRecipe(prev => ({
        ...prev,
        tags: [...prev.tags, currentTag.trim()]
      }));
      setCurrentTag('');
    }
  };

  const removeTag = (index: number) => {
    setNewRecipe(prev => ({
      ...prev,
      tags: prev.tags.filter((_, i) => i !== index)
    }));
  };

  const saveRecipe = async () => {
    if (!user || !newRecipe.name.trim()) {
      toast.error('Please enter a recipe name');
      return;
    }

    try {
      const success = await RecipeService.saveRecipe(newRecipe);
      if (success) {
        await loadUserRecipes(); // Reload recipes from database
        setShowAddRecipe(false);
        setNewRecipe({
          name: '',
          category: '',
          area: '',
          instructions: '',
          ingredients: [],
          image: '',
          videoUrl: '',
          websiteUrl: '',
          cookingTime: '',
          difficulty: 'Easy',
          tags: [],
        });
        toast.success('Recipe saved successfully!');
      } else {
        toast.error('Failed to save recipe');
      }
    } catch (error) {
      console.error('Error saving recipe:', error);
      toast.error('Failed to save recipe');
    }
  };

  const deleteRecipe = async (recipeId: string) => {
    try {
      const success = await RecipeService.deleteRecipe(recipeId);
      if (success) {
        await loadUserRecipes(); // Reload recipes from database
        toast.success('Recipe deleted successfully!');
      } else {
        toast.error('Failed to delete recipe');
      }
    } catch (error) {
      console.error('Error deleting recipe:', error);
      toast.error('Failed to delete recipe');
    }
  };

  const viewRecipeDetails = (recipe: UserRecipe) => {
    setSelectedRecipe(recipe);
    setShowRecipeDetails(true);
  };

  const filteredRecipes = recipes.filter(recipe =>
    recipe.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (recipe.category && recipe.category.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (recipe.area && recipe.area.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (!user) {
    return (
      <div className="min-h-screen bg-off-white p-4">
        <div className="max-w-md mx-auto">
          <div className="text-center py-12">
            <p className="text-soft-taupe">Please log in to access your recipe library</p>
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
          <h1 className="text-3xl font-lora text-rich-charcoal mb-2">Recipe Library</h1>
          <p className="text-soft-taupe">Your personal collection of recipes</p>
        </header>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search your recipes..."
              className="w-full p-4 pr-12 border border-gray-300 rounded-xl focus:ring-2 focus:ring-coral-blush focus:border-transparent"
            />
            <Search className="absolute right-4 top-1/2 transform -translate-y-1/2 text-coral-blush w-5 h-5" />
          </div>
        </div>

        {/* Add Recipe Button */}
        <div className="mb-6">
          <button
            onClick={() => setShowAddRecipe(true)}
            className="w-full bg-coral-blush text-white p-4 rounded-xl hover:bg-opacity-90 transition-colors flex items-center justify-center gap-2"
          >
            <Plus className="w-5 h-5" />
            <span className="font-medium">Add New Recipe</span>
          </button>
        </div>

        {/* Recipes List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-coral-blush"></div>
          </div>
        ) : filteredRecipes.length === 0 ? (
          <div className="text-center py-12">
            <ChefHat className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-rich-charcoal mb-2">No recipes yet</h3>
            <p className="text-soft-taupe mb-4">Start building your recipe collection</p>
            <button
              onClick={() => setShowAddRecipe(true)}
              className="bg-coral-blush text-white px-6 py-2 rounded-lg hover:bg-opacity-90 transition-colors"
            >
              Add Your First Recipe
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredRecipes.map((recipe) => (
              <motion.div
                key={recipe.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-xl p-4 shadow-sm cursor-pointer hover:shadow-md transition-shadow"
                onClick={() => viewRecipeDetails(recipe)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-medium text-rich-charcoal mb-1">{recipe.name}</h3>
                    <p className="text-sm text-soft-taupe">{recipe.category} • {recipe.area}</p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      deleteRecipe(recipe.id);
                    }}
                    className="text-red-500 hover:text-red-700 transition-colors p-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex items-center gap-4 text-xs text-soft-taupe mb-3">
                  <span>{recipe.cookingTime}</span>
                  <span>{recipe.difficulty}</span>
                  {recipe.videoUrl && (
                    <span className="flex items-center gap-1">
                      <Youtube className="w-3 h-3" />
                      Video
                    </span>
                  )}
                  {recipe.websiteUrl && (
                    <span className="flex items-center gap-1">
                      <Link className="w-3 h-3" />
                      Link
                    </span>
                  )}
                </div>

                {recipe.ingredients && recipe.ingredients.length > 0 && (
                  <div className="mb-2">
                    <p className="text-xs font-medium text-rich-charcoal mb-1">Ingredients:</p>
                    <p className="text-xs text-soft-taupe">
                      {recipe.ingredients.slice(0, 3).map(ing => `${ing.name} (${ing.measure})`).join(', ')}
                      {recipe.ingredients.length > 3 && '...'}
                    </p>
                  </div>
                )}

                {recipe.instructions && (
                  <p className="text-xs text-soft-taupe line-clamp-2">
                    {recipe.instructions.length > 100
                      ? recipe.instructions.substring(0, 100) + '...'
                      : recipe.instructions
                    }
                  </p>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Recipe Details Modal */}
      <AnimatePresence>
        {showRecipeDetails && selectedRecipe && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-lora text-rich-charcoal">{selectedRecipe.name}</h2>
                <button
                  onClick={() => setShowRecipeDetails(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Recipe Info */}
                <div className="flex items-center gap-4 text-sm text-soft-taupe">
                  <span>{selectedRecipe.cookingTime}</span>
                  <span>{selectedRecipe.difficulty}</span>
                  <span>{selectedRecipe.category} • {selectedRecipe.area}</span>
                </div>

                {/* Video and Website Links */}
                <div className="flex gap-2">
                  {selectedRecipe.videoUrl && (
                    <a
                      href={selectedRecipe.videoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                    >
                      <Youtube className="w-4 h-4" />
                      Watch Video
                    </a>
                  )}
                  {selectedRecipe.websiteUrl && (
                    <a
                      href={selectedRecipe.websiteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Visit Website
                    </a>
                  )}
                </div>

                {/* Ingredients */}
                {selectedRecipe.ingredients && selectedRecipe.ingredients.length > 0 && (
                  <div>
                    <h3 className="font-medium text-rich-charcoal mb-2">Ingredients</h3>
                    <div className="space-y-1">
                      {selectedRecipe.ingredients.map((ingredient, index) => (
                        <div key={index} className="flex justify-between text-sm">
                          <span className="text-rich-charcoal">{ingredient.name}</span>
                          <span className="text-soft-taupe">{ingredient.measure}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Instructions */}
                {selectedRecipe.instructions && (
                  <div>
                    <h3 className="font-medium text-rich-charcoal mb-2">Instructions</h3>
                    <p className="text-sm text-soft-taupe whitespace-pre-line">
                      {selectedRecipe.instructions}
                    </p>
                  </div>
                )}

                {/* Tags */}
                {selectedRecipe.tags && selectedRecipe.tags.length > 0 && (
                  <div>
                    <h3 className="font-medium text-rich-charcoal mb-2">Tags</h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedRecipe.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-sage-leaf bg-opacity-20 text-sage-leaf rounded-full text-xs"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Add Recipe Modal */}
      <AnimatePresence>
        {showAddRecipe && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-lora text-rich-charcoal">Add New Recipe</h2>
                <button
                  onClick={() => setShowAddRecipe(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-rich-charcoal mb-2">
                    Recipe Name *
                  </label>
                  <input
                    type="text"
                    value={newRecipe.name}
                    onChange={(e) => setNewRecipe(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Enter recipe name..."
                    className="w-full p-3 border border-gray-300 rounded-lg focus:border-coral-blush focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-rich-charcoal mb-2">
                      Category
                    </label>
                    <input
                      type="text"
                      value={newRecipe.category}
                      onChange={(e) => setNewRecipe(prev => ({ ...prev, category: e.target.value }))}
                      placeholder="e.g., Italian, Asian..."
                      className="w-full p-3 border border-gray-300 rounded-lg focus:border-coral-blush focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-rich-charcoal mb-2">
                      Cuisine
                    </label>
                    <input
                      type="text"
                      value={newRecipe.area}
                      onChange={(e) => setNewRecipe(prev => ({ ...prev, area: e.target.value }))}
                      placeholder="e.g., Italy, Thailand..."
                      className="w-full p-3 border border-gray-300 rounded-lg focus:border-coral-blush focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-rich-charcoal mb-2">
                    Instructions
                  </label>
                  <textarea
                    value={newRecipe.instructions}
                    onChange={(e) => setNewRecipe(prev => ({ ...prev, instructions: e.target.value }))}
                    placeholder="Enter cooking instructions..."
                    className="w-full p-3 border border-gray-300 rounded-lg focus:border-coral-blush focus:outline-none"
                    rows={4}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-rich-charcoal mb-2">
                    Ingredients
                  </label>
                  <div className="grid grid-cols-2 gap-2 mb-2">
                    <input
                      type="text"
                      value={currentIngredient}
                      onChange={(e) => setCurrentIngredient(e.target.value)}
                      placeholder="Ingredient name..."
                      className="p-2 border border-gray-300 rounded-lg focus:border-coral-blush focus:outline-none"
                      onKeyPress={(e) => e.key === 'Enter' && addIngredient()}
                    />
                    <input
                      type="text"
                      value={currentMeasure}
                      onChange={(e) => setCurrentMeasure(e.target.value)}
                      placeholder="e.g., 200g, 2 tbsp..."
                      className="p-2 border border-gray-300 rounded-lg focus:border-coral-blush focus:outline-none"
                      onKeyPress={(e) => e.key === 'Enter' && addIngredient()}
                    />
                  </div>
                  <button
                    onClick={addIngredient}
                    className="w-full px-3 py-2 bg-coral-blush text-white rounded-lg hover:bg-opacity-90 transition-colors"
                  >
                    Add Ingredient
                  </button>
                  {newRecipe.ingredients.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {newRecipe.ingredients.map((ingredient, index) => (
                        <span
                          key={index}
                          className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-lg text-xs"
                        >
                          {ingredient.name} ({ingredient.measure})
                          <button
                            onClick={() => removeIngredient(index)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-rich-charcoal mb-2">
                      Cooking Time
                    </label>
                    <input
                      type="text"
                      value={newRecipe.cookingTime}
                      onChange={(e) => setNewRecipe(prev => ({ ...prev, cookingTime: e.target.value }))}
                      placeholder="e.g., 30 min"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:border-coral-blush focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-rich-charcoal mb-2">
                      Difficulty
                    </label>
                    <select
                      value={newRecipe.difficulty}
                      onChange={(e) => setNewRecipe(prev => ({ ...prev, difficulty: e.target.value as 'Easy' | 'Medium' | 'Hard' }))}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:border-coral-blush focus:outline-none"
                    >
                      <option value="Easy">Easy</option>
                      <option value="Medium">Medium</option>
                      <option value="Hard">Hard</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-rich-charcoal mb-2">
                    YouTube Video URL
                  </label>
                  <input
                    type="url"
                    value={newRecipe.videoUrl}
                    onChange={(e) => setNewRecipe(prev => ({ ...prev, videoUrl: e.target.value }))}
                    placeholder="https://www.youtube.com/watch?v=..."
                    className="w-full p-3 border border-gray-300 rounded-lg focus:border-coral-blush focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-rich-charcoal mb-2">
                    Website URL
                  </label>
                  <input
                    type="url"
                    value={newRecipe.websiteUrl}
                    onChange={(e) => setNewRecipe(prev => ({ ...prev, websiteUrl: e.target.value }))}
                    placeholder="https://example.com/recipe..."
                    className="w-full p-3 border border-gray-300 rounded-lg focus:border-coral-blush focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-rich-charcoal mb-2">
                    Tags
                  </label>
                  <div className="flex gap-2 mb-2">
                    <input
                      type="text"
                      value={currentTag}
                      onChange={(e) => setCurrentTag(e.target.value)}
                      placeholder="Add tag..."
                      className="flex-1 p-2 border border-gray-300 rounded-lg focus:border-coral-blush focus:outline-none"
                      onKeyPress={(e) => e.key === 'Enter' && addTag()}
                    />
                    <button
                      onClick={addTag}
                      className="px-3 py-2 bg-sage-leaf text-white rounded-lg hover:bg-opacity-90 transition-colors"
                    >
                      Add
                    </button>
                  </div>
                  {newRecipe.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {newRecipe.tags.map((tag, index) => (
                        <span
                          key={index}
                          className="flex items-center gap-1 px-2 py-1 bg-sage-leaf bg-opacity-20 rounded-lg text-xs"
                        >
                          {tag}
                          <button
                            onClick={() => removeTag(index)}
                            className="text-sage-leaf hover:text-opacity-80"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => setShowAddRecipe(false)}
                  className="flex-1 py-3 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={saveRecipe}
                  className="flex-1 bg-coral-blush text-white py-3 px-4 rounded-lg hover:bg-opacity-90 transition-colors"
                >
                  Save Recipe
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default RecipeLibrary;
