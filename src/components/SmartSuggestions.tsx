import { motion } from 'framer-motion';
import { Brain, CheckCircle, ChefHat, Clock, ShoppingCart, Sparkles } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { SmartSuggestion, SmartSuggestionsService } from '../api/smartSuggestionsService';
import { useAuthStore } from '../state/authStore';

const SmartSuggestions: React.FC = () => {
  const { user } = useAuthStore();
  const [suggestions, setSuggestions] = useState<SmartSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalSuggestions: 0,
    usedSuggestions: 0,
    todaySuggestions: 0
  });

  useEffect(() => {
    if (user) {
      loadSuggestions();
      loadStats();
    }
  }, [user]);

  const loadSuggestions = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const dailySuggestions = await SmartSuggestionsService.getDailySuggestions(user.id);
      setSuggestions(dailySuggestions);
    } catch (error) {
      console.error('Error loading suggestions:', error);
      toast.error('Failed to load suggestions');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    if (!user) return;

    try {
      const suggestionStats = await SmartSuggestionsService.getSuggestionStats(user.id);
      setStats(suggestionStats);
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const handleUseSuggestion = async (suggestion: SmartSuggestion) => {
    try {
      await SmartSuggestionsService.markSuggestionAsUsed(suggestion.id);
      setSuggestions(prev =>
        prev.map(s =>
          s.id === suggestion.id ? { ...s, used: true } : s
        )
      );
      toast.success('Suggestion marked as used!');
      loadStats(); // Refresh stats
    } catch (error) {
      console.error('Error marking suggestion as used:', error);
      toast.error('Failed to mark suggestion as used');
    }
  };

  const getSuggestionIcon = (type: string) => {
    switch (type) {
      case 'recipe':
        return <ChefHat className="w-5 h-5" />;
      case 'meal_plan':
        return <Brain className="w-5 h-5" />;
      case 'grocery':
        return <ShoppingCart className="w-5 h-5" />;
      default:
        return <Sparkles className="w-5 h-5" />;
    }
  };

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

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Brain className="w-6 h-6 text-orange-500" />
          <h2 className="text-xl font-semibold text-gray-800">Smart Suggestions</h2>
        </div>
        <div className="text-sm text-gray-500">
          {stats.todaySuggestions}/2 today
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 p-4 bg-gradient-to-r from-orange-50 to-yellow-50 rounded-lg">
        <div className="text-center">
          <div className="text-2xl font-bold text-orange-600">{stats.totalSuggestions}</div>
          <div className="text-xs text-gray-600">Total</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">{stats.usedSuggestions}</div>
          <div className="text-xs text-gray-600">Used</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">{stats.todaySuggestions}</div>
          <div className="text-xs text-gray-600">Today</div>
        </div>
      </div>

      {/* Suggestions */}
      {suggestions.length === 0 ? (
        <div className="text-center py-8">
          <Sparkles className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500">No suggestions available yet.</p>
          <p className="text-sm text-gray-400 mt-2">Add items to your pantry to get personalized suggestions!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {suggestions.map((suggestion) => (
            <motion.div
              key={suggestion.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`bg-white rounded-lg border-2 p-4 transition-all duration-200 ${
                suggestion.used
                  ? 'border-green-200 bg-green-50'
                  : 'border-orange-200 hover:border-orange-300'
              }`}
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center space-x-2">
                  {getSuggestionIcon(suggestion.suggestion_type)}
                  <h3 className="font-semibold text-gray-800">{suggestion.title}</h3>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getDifficultyColor(suggestion.difficulty)}`}>
                    {suggestion.difficulty}
                  </span>
                  <div className="flex items-center text-gray-500 text-sm">
                    <Clock className="w-4 h-4 mr-1" />
                    {suggestion.estimated_time}min
                  </div>
                </div>
              </div>

              {/* Description */}
              <p className="text-gray-600 text-sm mb-3">{suggestion.description}</p>

              {/* Reasoning */}
              <div className="bg-blue-50 p-3 rounded-md mb-3">
                <p className="text-sm text-blue-800">
                  <strong>Why this suggestion?</strong> {suggestion.reasoning}
                </p>
              </div>

              {/* Ingredients */}
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Available</h4>
                  <div className="flex flex-wrap gap-1">
                    {suggestion.ingredients_available.map((ingredient, index) => (
                      <span key={index} className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded">
                        {ingredient}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">Needed</h4>
                  <div className="flex flex-wrap gap-1">
                    {suggestion.ingredients_needed.map((ingredient, index) => (
                      <span key={index} className="px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded">
                        {ingredient}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Action Button */}
              {!suggestion.used && (
                <button
                  onClick={() => handleUseSuggestion(suggestion)}
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white py-2 px-4 rounded-md transition-colors duration-200 flex items-center justify-center space-x-2"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>Use This Suggestion</span>
                </button>
              )}

              {suggestion.used && (
                <div className="flex items-center justify-center text-green-600 text-sm">
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Used
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}

      {/* Refresh Button */}
      {suggestions.length > 0 && (
        <div className="text-center">
          <button
            onClick={loadSuggestions}
            className="text-orange-500 hover:text-orange-600 text-sm font-medium"
          >
            Refresh Suggestions
          </button>
        </div>
      )}
    </div>
  );
};

export default SmartSuggestions;
