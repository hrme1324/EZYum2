import { motion } from 'framer-motion';
import { ChefHat, Edit3, Globe, Play, Plus, Trash2, X } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { RecipeService } from '../api/recipeService';
import { useAuthStore } from '../state/authStore';
import { Recipe } from '../types';
import { logger } from '../utils/logger';

interface MyRecipe extends Recipe {
  videoUrl?: string;
  websiteUrl?: string;
  prepTime?: string;
  servings?: number;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  tags: string[];
}

const MyRecipes: React.FC = () => {
  const { user } = useAuthStore();
  const [recipes, setRecipes] = useState<MyRecipe[]>([]);
  const [loading, setLoading] = useState(false);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingRecipe, setEditingRecipe] = useState<MyRecipe | null>(null);
  const [newRecipe, setNewRecipe] = useState({
    name: '',
    category: '',
    area: '',
    instructions: '',
    ingredients: [{ name: '', measure: '' }],
    tags: [] as string[],
    videoUrl: '',
    websiteUrl: '',
    prepTime: '',
    servings: 4,
    difficulty: 'Easy' as 'Easy' | 'Medium' | 'Hard',
    cookingTime: '30 min',
    image: '',
  });

  const loadRecipes = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const recipesData = await RecipeService.getUserRecipes();
      // Transform UserRecipe to MyRecipe format
      const transformedRecipes: MyRecipe[] = (recipesData || []).map((recipe) => ({
        ...recipe,
        difficulty: recipe.difficulty || 'Easy',
        tags: recipe.tags || [],
        videoUrl: recipe.videoUrl || '',
        websiteUrl: recipe.websiteUrl || '',
        prepTime: '',
        servings: 4,
        created_at: recipe.created_at,
      }));
      setRecipes(transformedRecipes);
    } catch (error) {
      logger.error('Error loading recipes:', error);
      toast.error('Failed to load recipes');
    } finally {
      setLoading(false);
    }
  };

  // Load recipes when user changes
  useEffect(() => {
    if (user) {
      loadRecipes();
    }
  }, [user, loadRecipes]);

  const handleCreateRecipe = async () => {
    if (!user) return;

    try {
      const recipeData = {
        user_id: user.id,
        ingredients: newRecipe.ingredients,
        tags: newRecipe.tags,
        name: newRecipe.name,
        category: newRecipe.category,
        area: newRecipe.area,
        instructions: newRecipe.instructions,
        videoUrl: newRecipe.videoUrl,
        websiteUrl: newRecipe.websiteUrl,
        prepTime: newRecipe.prepTime,
        servings: newRecipe.servings,
        difficulty: newRecipe.difficulty,
        cookingTime: newRecipe.cookingTime,
        image: newRecipe.image,
        created_at: new Date().toISOString(), // Add missing created_at field
      };

      const success = await RecipeService.saveRecipe(recipeData);
      if (success) {
        await loadRecipes();
        setShowCreateForm(false);
        resetForm();
        toast.success('Recipe created successfully!');
      } else {
        toast.error('Failed to create recipe');
      }
    } catch (error) {
      logger.error('Error creating recipe:', error);
      toast.error('Failed to create recipe');
    }
  };

  const handleUpdateRecipe = async () => {
    if (!user || !editingRecipe) return;

    try {
      const recipeData = {
        ...newRecipe,
        id: editingRecipe.id,
        user_id: user.id,
        ingredients: newRecipe.ingredients.filter((ing) => ing.name.trim() && ing.measure.trim()),
        tags: newRecipe.tags.filter((tag) => tag.trim()),
      };

      const success = await RecipeService.updateRecipe(editingRecipe.id, recipeData);
      if (success) {
        await loadRecipes();
        setEditingRecipe(null);
        setShowCreateForm(false);
        resetForm();
        toast.success('Recipe updated successfully!');
      } else {
        toast.error('Failed to update recipe');
      }
    } catch (error) {
      logger.error('Error updating recipe:', error);
      toast.error('Failed to update recipe');
    }
  };

  const handleDeleteRecipe = async (recipeId: string) => {
    if (!user) return;

    try {
      const success = await RecipeService.deleteRecipe(recipeId);
      if (success) {
        await loadRecipes();
        toast.success('Recipe deleted successfully!');
      } else {
        toast.error('Failed to delete recipe');
      }
    } catch (error) {
      logger.error('Error deleting recipe:', error);
      toast.error('Failed to delete recipe');
    }
  };

  const resetForm = () => {
    setNewRecipe({
      name: '',
      category: '',
      area: '',
      instructions: '',
      ingredients: [{ name: '', measure: '' }],
      tags: [],
      videoUrl: '',
      websiteUrl: '',
      prepTime: '',
      servings: 4,
      difficulty: 'Easy',
      cookingTime: '30 min',
      image: '',
    });
  };

  const startEditing = (recipe: MyRecipe) => {
    setEditingRecipe(recipe);
    setNewRecipe({
      name: recipe.name || '',
      category: recipe.category || '',
      area: recipe.area || '',
      instructions: recipe.instructions || '',
      ingredients: recipe.ingredients || [{ name: '', measure: '' }],
      tags: recipe.tags || [],
      videoUrl: recipe.videoUrl || '',
      websiteUrl: recipe.websiteUrl || '',
      prepTime: recipe.prepTime || '',
      servings: recipe.servings || 4,
      difficulty: recipe.difficulty || 'Easy',
      cookingTime: recipe.cookingTime || '30 min',
      image: recipe.image || '',
    });
    setShowCreateForm(true);
  };

  const addIngredient = () => {
    setNewRecipe((prev) => ({
      ...prev,
      ingredients: [...prev.ingredients, { name: '', measure: '' }],
    }));
  };

  const removeIngredient = (index: number) => {
    setNewRecipe((prev) => ({
      ...prev,
      ingredients: prev.ingredients.filter((_, i) => i !== index),
    }));
  };

  const updateIngredient = (index: number, field: 'name' | 'measure', value: string) => {
    setNewRecipe((prev) => ({
      ...prev,
      ingredients: prev.ingredients.map((ing, i) =>
        i === index ? { ...ing, [field]: value } : ing,
      ),
    }));
  };

  const addTag = (tag: string) => {
    if (tag.trim() && !newRecipe.tags.includes(tag.trim())) {
      setNewRecipe((prev) => ({
        ...prev,
        tags: [...prev.tags, tag.trim()],
      }));
    }
  };

  const removeTag = (tagToRemove: string) => {
    setNewRecipe((prev) => ({
      ...prev,
      tags: prev.tags.filter((tag) => tag !== tagToRemove),
    }));
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy':
        return 'text-green-600 bg-green-100';
      case 'Medium':
        return 'text-yellow-600 bg-yellow-100';
      case 'Hard':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-off-white p-4">
        <div className="max-w-md mx-auto">
          <div className="text-center py-12">
            <p className="text-soft-taupe">Please log in to access your recipes</p>
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
          <h1 className="text-3xl font-lora text-rich-charcoal mb-2">My Recipes</h1>
          <p className="text-soft-taupe">Create and manage your personal recipe collection</p>
        </header>

        {/* Create Recipe Button */}
        <div className="mb-6">
          <button
            onClick={() => {
              setEditingRecipe(null);
              resetForm();
              setShowCreateForm(true);
            }}
            className="w-full bg-coral-blush text-white py-3 px-4 rounded-xl hover:bg-opacity-90 transition-colors font-medium flex items-center justify-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Create New Recipe
          </button>
        </div>

        {/* Create/Edit Recipe Modal */}
        {showCreateForm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium text-rich-charcoal">
                  {editingRecipe ? 'Edit Recipe' : 'Create New Recipe'}
                </h3>
                <button
                  onClick={() => {
                    setShowCreateForm(false);
                    setEditingRecipe(null);
                    resetForm();
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                {/* Basic Info */}
                <div>
                  <label className="block text-sm font-medium text-rich-charcoal mb-2">
                    Recipe Name *
                  </label>
                  <input
                    type="text"
                    value={newRecipe.name}
                    onChange={(e) => setNewRecipe({ ...newRecipe, name: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-coral-blush focus:border-transparent"
                    placeholder="e.g., Grandma's Chocolate Cake"
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
                      onChange={(e) => setNewRecipe({ ...newRecipe, category: e.target.value })}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-coral-blush focus:border-transparent"
                      placeholder="e.g., Dessert"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-rich-charcoal mb-2">
                      Cuisine
                    </label>
                    <input
                      type="text"
                      value={newRecipe.area}
                      onChange={(e) => setNewRecipe({ ...newRecipe, area: e.target.value })}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-coral-blush focus:border-transparent"
                      placeholder="e.g., Italian"
                    />
                  </div>
                </div>

                {/* Time and Difficulty */}
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-rich-charcoal mb-2">
                      Prep Time
                    </label>
                    <input
                      type="text"
                      value={newRecipe.prepTime}
                      onChange={(e) => setNewRecipe({ ...newRecipe, prepTime: e.target.value })}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-coral-blush focus:border-transparent"
                      placeholder="15 min"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-rich-charcoal mb-2">
                      Cook Time
                    </label>
                    <input
                      type="text"
                      value={newRecipe.cookingTime}
                      onChange={(e) => setNewRecipe({ ...newRecipe, cookingTime: e.target.value })}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-coral-blush focus:border-transparent"
                      placeholder="30 min"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-rich-charcoal mb-2">
                      Difficulty
                    </label>
                    <select
                      value={newRecipe.difficulty}
                      onChange={(e) =>
                        setNewRecipe({
                          ...newRecipe,
                          difficulty: e.target.value as 'Easy' | 'Medium' | 'Hard',
                        })
                      }
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-coral-blush focus:border-transparent"
                    >
                      <option value="Easy">Easy</option>
                      <option value="Medium">Medium</option>
                      <option value="Hard">Hard</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-rich-charcoal mb-2">
                    Servings
                  </label>
                  <input
                    type="number"
                    value={newRecipe.servings}
                    onChange={(e) =>
                      setNewRecipe({ ...newRecipe, servings: parseInt(e.target.value) || 4 })
                    }
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-coral-blush focus:border-transparent"
                    min="1"
                  />
                </div>

                {/* Ingredients */}
                <div>
                  <label className="block text-sm font-medium text-rich-charcoal mb-2">
                    Ingredients *
                  </label>
                  <div className="space-y-2">
                    {newRecipe.ingredients.map((ingredient, index) => (
                      <div key={index} className="flex gap-2">
                        <input
                          type="text"
                          value={ingredient.name}
                          onChange={(e) => updateIngredient(index, 'name', e.target.value)}
                          placeholder="Ingredient name"
                          className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-coral-blush focus:border-transparent"
                        />
                        <input
                          type="text"
                          value={ingredient.measure}
                          onChange={(e) => updateIngredient(index, 'measure', e.target.value)}
                          placeholder="Amount"
                          className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-coral-blush focus:border-transparent"
                        />
                        {newRecipe.ingredients.length > 1 && (
                          <button
                            onClick={() => removeIngredient(index)}
                            className="p-3 text-red-500 hover:bg-red-50 rounded-lg"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                    <button
                      onClick={addIngredient}
                      className="w-full p-3 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-coral-blush hover:text-coral-blush transition-colors"
                    >
                      + Add Ingredient
                    </button>
                  </div>
                </div>

                {/* Instructions */}
                <div>
                  <label className="block text-sm font-medium text-rich-charcoal mb-2">
                    Instructions *
                  </label>
                  <textarea
                    value={newRecipe.instructions}
                    onChange={(e) => setNewRecipe({ ...newRecipe, instructions: e.target.value })}
                    placeholder="Step-by-step cooking instructions..."
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-coral-blush focus:border-transparent resize-none"
                    rows={6}
                  />
                </div>

                {/* Tags */}
                <div>
                  <label className="block text-sm font-medium text-rich-charcoal mb-2">Tags</label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {newRecipe.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="flex items-center gap-1 px-3 py-1 bg-coral-blush text-white rounded-full text-sm"
                      >
                        {tag}
                        <button
                          onClick={() => removeTag(tag)}
                          className="text-white hover:text-red-200"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Add tag..."
                      className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-coral-blush focus:border-transparent"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          addTag(e.currentTarget.value);
                          e.currentTarget.value = '';
                        }
                      }}
                    />
                    <button
                      onClick={() => {
                        const input = document.querySelector(
                          'input[placeholder="Add tag..."]',
                        ) as HTMLInputElement;
                        if (input && input.value.trim()) {
                          addTag(input.value);
                          input.value = '';
                        }
                      }}
                      className="px-4 py-3 bg-coral-blush text-white rounded-lg hover:bg-opacity-90"
                    >
                      Add
                    </button>
                  </div>
                </div>

                {/* Links */}
                <div className="grid grid-cols-1 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-rich-charcoal mb-2">
                      <Globe className="w-4 h-4 inline mr-1" />
                      Website URL
                    </label>
                    <input
                      type="url"
                      value={newRecipe.websiteUrl}
                      onChange={(e) => setNewRecipe({ ...newRecipe, websiteUrl: e.target.value })}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-coral-blush focus:border-transparent"
                      placeholder="https://example.com/recipe"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-rich-charcoal mb-2">
                      <Play className="w-4 h-4 inline mr-1" />
                      YouTube Video URL
                    </label>
                    <input
                      type="url"
                      value={newRecipe.videoUrl}
                      onChange={(e) => setNewRecipe({ ...newRecipe, videoUrl: e.target.value })}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-coral-blush focus:border-transparent"
                      placeholder="https://youtube.com/watch?v=..."
                    />
                  </div>
                </div>

                {/* Image URL */}
                <div>
                  <label className="block text-sm font-medium text-rich-charcoal mb-2">
                    Image URL
                  </label>
                  <input
                    type="url"
                    value={newRecipe.image}
                    onChange={(e) => setNewRecipe({ ...newRecipe, image: e.target.value })}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-coral-blush focus:border-transparent"
                    placeholder="https://example.com/image.jpg"
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowCreateForm(false);
                    setEditingRecipe(null);
                    resetForm();
                  }}
                  className="flex-1 bg-gray-200 text-rich-charcoal py-2 px-4 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={editingRecipe ? handleUpdateRecipe : handleCreateRecipe}
                  disabled={!newRecipe.name.trim() || !newRecipe.instructions.trim()}
                  className="flex-1 bg-coral-blush text-white py-2 px-4 rounded-lg hover:bg-opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {editingRecipe ? 'Update Recipe' : 'Create Recipe'}
                </button>
              </div>
            </motion.div>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-coral-blush mx-auto"></div>
            <p className="text-soft-taupe mt-2">Loading recipes...</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && recipes.length === 0 && (
          <div className="text-center py-12">
            <ChefHat className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-rich-charcoal mb-2">No recipes yet</h3>
            <p className="text-soft-taupe mb-4">Start creating your personal recipe collection</p>
            <button
              onClick={() => {
                setEditingRecipe(null);
                resetForm();
                setShowCreateForm(true);
              }}
              className="bg-coral-blush text-white px-6 py-2 rounded-lg hover:bg-opacity-90 transition-colors"
            >
              Create Your First Recipe
            </button>
          </div>
        )}

        {/* Recipes List */}
        {!loading && recipes.length > 0 && (
          <div className="space-y-4">
            {recipes.map((recipe) => (
              <motion.div
                key={recipe.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-white rounded-xl p-4 shadow-sm border border-gray-100"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h3 className="font-medium text-rich-charcoal mb-1">{recipe.name}</h3>
                    <div className="flex items-center gap-2 text-sm text-soft-taupe">
                      {recipe.category && <span>{recipe.category}</span>}
                      {recipe.area && <span>• {recipe.area}</span>}
                      {recipe.cookingTime && <span>• {recipe.cookingTime}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(recipe.difficulty)}`}
                    >
                      {recipe.difficulty}
                    </span>
                  </div>
                </div>

                {/* Recipe Details */}
                <div className="space-y-2 mb-3">
                  {recipe.ingredients && recipe.ingredients.length > 0 && (
                    <div className="text-sm text-soft-taupe">
                      <strong>Ingredients:</strong>{' '}
                      {recipe.ingredients
                        .slice(0, 3)
                        .map((ing) => `${ing.name} (${ing.measure})`)
                        .join(', ')}
                      {recipe.ingredients.length > 3 && '...'}
                    </div>
                  )}

                  {recipe.instructions && (
                    <div className="text-sm text-soft-taupe line-clamp-2">
                      {recipe.instructions}
                    </div>
                  )}
                </div>

                {/* Tags */}
                {recipe.tags && recipe.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mb-3">
                    {recipe.tags.map((tag, index) => (
                      <span
                        key={index}
                        className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Links */}
                <div className="flex items-center gap-2 mb-3">
                  {recipe.videoUrl && (
                    <a
                      href={recipe.videoUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-red-500 hover:text-red-600 text-sm"
                    >
                      <Play className="w-4 h-4" />
                      Watch Video
                    </a>
                  )}
                  {recipe.websiteUrl && (
                    <a
                      href={recipe.websiteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-blue-500 hover:text-blue-600 text-sm"
                    >
                      <Globe className="w-4 h-4" />
                      Visit Website
                    </a>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => startEditing(recipe)}
                    className="flex-1 py-2 px-3 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium"
                  >
                    <Edit3 className="w-4 h-4 inline mr-1" />
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteRecipe(recipe.id)}
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

export default MyRecipes;
