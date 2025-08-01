import { motion } from 'framer-motion';
import { Clock, ExternalLink, Play, X } from 'lucide-react';
import React, { useState } from 'react';

export interface Recipe {
  id: string;
  name: string;
  category?: string;
  area?: string;
  instructions?: string;
  image?: string;
  tags?: string[];
  ingredients?: Array<{ name: string; measure: string }>;
  videoUrl?: string;
  websiteUrl?: string;
  cookingTime?: string;
  difficulty?: 'Easy' | 'Medium' | 'Hard';
}

interface QuickAction {
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  action: () => void;
  className?: string;
}

interface RecipeCardProps {
  recipe: Recipe;
  onSave?: (recipe: Recipe) => void;
  onDelete?: (recipeId: string) => void;
  showActions?: boolean;
  quickActions?: QuickAction[];
}

const RecipeCard: React.FC<RecipeCardProps> = ({
  recipe,
  onSave,
  onDelete,
  showActions = true,
  quickActions,
}) => {
  const [showDetails, setShowDetails] = useState(false);
  const [showVideo, setShowVideo] = useState(false);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Easy':
        return 'bg-green-100 text-green-700';
      case 'Medium':
        return 'bg-yellow-100 text-yellow-700';
      case 'Hard':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const extractVideoId = (url?: string) => {
    if (!url) return null;
    const match = url.match(
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/
    );
    return match ? match[1] : null;
  };

  const videoId = extractVideoId(recipe.videoUrl);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
    >
      {/* Recipe Image */}
      {recipe.image && (
        <div className="relative h-48 bg-gray-200">
          <img
            src={recipe.image}
            alt={recipe.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
            }}
          />
          {videoId && (
            <button
              onClick={() => setShowVideo(true)}
              className="absolute top-2 right-2 bg-black bg-opacity-50 text-white p-2 rounded-full hover:bg-opacity-70 transition-all"
            >
              <Play className="w-4 h-4" />
            </button>
          )}
        </div>
      )}

      {/* Recipe Content */}
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <h3 className="font-bold text-rich-charcoal text-lg mb-1">{recipe.name}</h3>
            <div className="flex items-center gap-2 text-sm text-soft-taupe">
              {recipe.category && (
                <span className="bg-sage-leaf bg-opacity-20 text-sage-leaf px-2 py-1 rounded-full">
                  {recipe.category}
                </span>
              )}
              {recipe.area && (
                <span className="bg-coral-blush bg-opacity-20 text-coral-blush px-2 py-1 rounded-full">
                  {recipe.area}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Recipe Info */}
        <div className="flex items-center gap-4 mb-3 text-sm text-soft-taupe">
          {recipe.cookingTime && (
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              <span>{recipe.cookingTime}</span>
            </div>
          )}
          {recipe.difficulty && (
            <span
              className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(recipe.difficulty)}`}
            >
              {recipe.difficulty}
            </span>
          )}
        </div>

        {/* Instructions Preview */}
        {recipe.instructions && (
          <p className="text-sm text-soft-taupe mb-3 line-clamp-3">
            {recipe.instructions.length > 150
              ? `${recipe.instructions.substring(0, 150)}...`
              : recipe.instructions}
          </p>
        )}

        {/* Ingredients Preview */}
        {recipe.ingredients && recipe.ingredients.length > 0 && (
          <div className="mb-3">
            <h4 className="text-sm font-medium text-rich-charcoal mb-2">Ingredients</h4>
            <div className="flex flex-wrap gap-1">
              {recipe.ingredients.slice(0, 5).map((ingredient, index) => (
                <span
                  key={index}
                  className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full"
                >
                  {ingredient.name}
                </span>
              ))}
              {recipe.ingredients.length > 5 && (
                <span className="text-xs text-soft-taupe">
                  +{recipe.ingredients.length - 5} more
                </span>
              )}
            </div>
          </div>
        )}

        {/* Actions */}
        {showActions && (
          <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="flex-1 bg-coral-blush text-white py-2 px-4 rounded-lg hover:bg-opacity-90 transition-colors text-sm font-medium"
            >
              {showDetails ? 'Hide Details' : 'View Details'}
            </button>
            {onSave && (
              <button
                onClick={() => onSave(recipe)}
                className="bg-sage-leaf text-white py-2 px-4 rounded-lg hover:bg-opacity-90 transition-colors text-sm font-medium"
              >
                Save Recipe
              </button>
            )}
            {onDelete && (
              <button
                onClick={() => onDelete(recipe.id)}
                className="bg-red-500 text-white py-2 px-4 rounded-lg hover:bg-opacity-90 transition-colors text-sm font-medium"
              >
                Delete
              </button>
            )}
          </div>
        )}

        {/* Quick Actions */}
        {quickActions && quickActions.length > 0 && (
          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
            {quickActions.map((action, index) => {
              const IconComponent = action.icon;
              return (
                <button
                  key={index}
                  onClick={action.action}
                  className={`flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors hover:bg-gray-50 ${action.className || 'text-gray-600'}`}
                >
                  <IconComponent className="w-4 h-4" />
                  <span>{action.label}</span>
                </button>
              );
            })}
          </div>
        )}

        {/* External Links */}
        {(recipe.videoUrl || recipe.websiteUrl) && (
          <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100">
            {recipe.videoUrl && (
              <a
                href={recipe.videoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 transition-colors"
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
                className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800 transition-colors"
              >
                <ExternalLink className="w-4 h-4" />
                Visit Website
              </a>
            )}
          </div>
        )}
      </div>

      {/* Detailed View */}
      {showDetails && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          exit={{ opacity: 0, height: 0 }}
          className="border-t border-gray-100 p-4 bg-gray-50"
        >
          {recipe.instructions && (
            <div className="mb-4">
              <h4 className="font-medium text-rich-charcoal mb-2">Instructions</h4>
              <p className="text-sm text-soft-taupe leading-relaxed">{recipe.instructions}</p>
            </div>
          )}

          {recipe.ingredients && recipe.ingredients.length > 0 && (
            <div>
              <h4 className="font-medium text-rich-charcoal mb-2">Ingredients</h4>
              <div className="space-y-1">
                {recipe.ingredients.map((ingredient, index) => (
                  <div key={index} className="flex justify-between text-sm">
                    <span className="text-rich-charcoal">{ingredient.name}</span>
                    <span className="text-soft-taupe">{ingredient.measure}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* Video Modal */}
      {showVideo && videoId && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
            <div className="p-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="font-medium text-rich-charcoal">{recipe.name}</h3>
              <button
                onClick={() => setShowVideo(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="relative pb-[56.25%]">
              <iframe
                src={`https://www.youtube.com/embed/${videoId}`}
                title={recipe.name}
                className="absolute top-0 left-0 w-full h-full"
                allowFullScreen
              />
            </div>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default RecipeCard;
