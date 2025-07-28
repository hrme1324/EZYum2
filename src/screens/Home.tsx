import React from 'react';
import { motion } from 'framer-motion';
import { Calendar, ShoppingBag, ChefHat, TrendingUp, Star, Target } from 'lucide-react';
import { useAuthStore } from '../state/authStore';

const Home: React.FC = () => {
  const { user } = useAuthStore();

  // Mock data
  const todayStats = {
    mealsPlanned: 3,
    pantryItems: 12,
    groceryItems: 8,
    streak: 7,
    xp: 1250,
    level: 3,
  };

  const todayMeals = [
    { type: 'breakfast', name: 'Oatmeal with Berries', time: '8:00 AM', status: 'planned' },
    { type: 'lunch', name: 'Chicken Salad', time: '12:30 PM', status: 'planned' },
    { type: 'dinner', name: 'Pasta Carbonara', time: '7:00 PM', status: 'planned' },
  ];

  const quickActions = [
    { title: 'Add to Pantry', icon: ShoppingBag, color: 'bg-blue-500', path: '/pantry' },
    { title: 'Plan Meals', icon: Calendar, color: 'bg-green-500', path: '/meal-planner' },
    { title: 'Grocery List', icon: ChefHat, color: 'bg-purple-500', path: '/grocery-list' },
  ];

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
  };

  const getMealTypeEmoji = (type: string) => {
    switch (type) {
    case 'breakfast':
      return '🌅';
    case 'lunch':
      return '☀️';
    case 'dinner':
      return '🌙';
    default:
      return '🍽️';
    }
  };

  return (
    <div className="min-h-screen bg-off-white p-4">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <header className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h1 className="text-2xl font-lora text-rich-charcoal">
                {getGreeting()}, {user?.email?.split('@')[0] || 'Chef'}!
              </h1>
              <p className="text-soft-taupe">Ready to cook something amazing?</p>
            </div>
            <div className="w-12 h-12 bg-coral-blush rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-lg">
                {user?.email?.charAt(0).toUpperCase() || 'C'}
              </span>
            </div>
          </div>
        </header>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white rounded-xl p-4 border border-gray-100"
          >
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 bg-orange-100 rounded-lg flex items-center justify-center">
                <Target className="w-4 h-4 text-orange-600" />
              </div>
              <span className="text-xs text-soft-taupe">Streak</span>
            </div>
            <div className="text-2xl font-bold text-rich-charcoal">{todayStats.streak} days</div>
            <div className="text-xs text-green-600">🔥 On fire!</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white rounded-xl p-4 border border-gray-100"
          >
            <div className="flex items-center gap-2 mb-2">
              <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                <TrendingUp className="w-4 h-4 text-purple-600" />
              </div>
              <span className="text-xs text-soft-taupe">Level</span>
            </div>
            <div className="text-2xl font-bold text-rich-charcoal">{todayStats.level}</div>
            <div className="text-xs text-purple-600">⭐ {todayStats.xp} XP</div>
          </motion.div>
        </div>

        {/* Quick Actions */}
        <div className="mb-6">
          <h2 className="text-lg font-medium text-rich-charcoal mb-3">Quick Actions</h2>
          <div className="grid grid-cols-3 gap-3">
            {quickActions.map((action, index) => (
              <motion.button
                key={action.title}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 + index * 0.1 }}
                className="bg-white rounded-xl p-4 border border-gray-100 text-center hover:border-coral-blush transition-all group"
              >
                <div
                  className={`w-10 h-10 ${action.color} rounded-lg flex items-center justify-center mx-auto mb-2 group-hover:scale-110 transition-transform`}
                >
                  <action.icon className="w-5 h-5 text-white" />
                </div>
                <span className="text-xs font-medium text-rich-charcoal">{action.title}</span>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Today's Plan */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-medium text-rich-charcoal">Today's Plan</h2>
            <span className="text-sm text-soft-taupe">{todayMeals.length} meals</span>
          </div>

          <div className="space-y-3">
            {todayMeals.map((meal, index) => (
              <motion.div
                key={meal.type}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + index * 0.1 }}
                className="bg-white rounded-xl p-4 border border-gray-100"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-sage-leaf rounded-lg flex items-center justify-center">
                      <span className="text-lg">{getMealTypeEmoji(meal.type)}</span>
                    </div>
                    <div>
                      <h3 className="font-medium text-rich-charcoal capitalize">{meal.type}</h3>
                      <p className="text-sm text-soft-taupe">{meal.name}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-rich-charcoal">{meal.time}</div>
                    <div className="text-xs text-green-600">Planned</div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Progress Summary */}
        <div className="mb-6">
          <h2 className="text-lg font-medium text-rich-charcoal mb-3">This Week</h2>
          <div className="bg-white rounded-xl p-4 border border-gray-100">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-rich-charcoal">
                  {todayStats.mealsPlanned}
                </div>
                <div className="text-xs text-soft-taupe">Meals Planned</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-rich-charcoal">
                  {todayStats.pantryItems}
                </div>
                <div className="text-xs text-soft-taupe">Pantry Items</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-rich-charcoal">
                  {todayStats.groceryItems}
                </div>
                <div className="text-xs text-soft-taupe">Grocery Items</div>
              </div>
            </div>
          </div>
        </div>

        {/* AI Suggestions */}
        <div className="bg-gradient-to-r from-coral-blush to-orange-400 rounded-xl p-4 text-white">
          <div className="flex items-center gap-2 mb-2">
            <Star className="w-5 h-5" />
            <h3 className="font-medium">Smart Suggestions</h3>
          </div>
          <p className="text-sm opacity-90 mb-3">
            Based on your pantry, here are some quick meal ideas:
          </p>
          <div className="space-y-2">
            <div className="flex items-center justify-between bg-white bg-opacity-20 rounded-lg p-2">
              <span className="text-sm">Chicken Stir-Fry (15 min)</span>
              <button className="text-xs bg-white bg-opacity-30 px-2 py-1 rounded">Cook Now</button>
            </div>
            <div className="flex items-center justify-between bg-white bg-opacity-20 rounded-lg p-2">
              <span className="text-sm">Pasta Carbonara (20 min)</span>
              <button className="text-xs bg-white bg-opacity-30 px-2 py-1 rounded">Cook Now</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
