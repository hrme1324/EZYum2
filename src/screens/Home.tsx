import { motion } from 'framer-motion';
import { BookOpen, Calendar, ChefHat, ShoppingBag, Target } from 'lucide-react';
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../state/authStore';

const Home: React.FC = () => {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  const handleQuickAction = (path: string) => {
    navigate(path);
  };

  const quickActions = [
    {
      title: 'Pantry',
      description: 'Manage your ingredients',
      icon: <Target className="w-6 h-6" />,
      path: '/pantry',
      color: 'bg-coral-blush',
    },
    {
      title: 'Meal Planner',
      description: 'Plan your weekly meals',
      icon: <Calendar className="w-6 h-6" />,
      path: '/meal-planner',
      color: 'bg-sage-leaf',
    },
    {
      title: 'Grocery List',
      description: 'Shopping list manager',
      icon: <ShoppingBag className="w-6 h-6" />,
      path: '/grocery-list',
      color: 'bg-orange-400',
    },
    {
      title: 'Browse Recipes',
      description: 'Discover new recipes',
      icon: <ChefHat className="w-6 h-6" />,
      path: '/recipes',
      color: 'bg-purple-400',
    },
    {
      title: 'Recipe Hub',
      description: 'Discover, save, and organize your favorite recipes',
      icon: <BookOpen className="w-6 h-6" />,
      path: '/recipes',
      color: 'bg-indigo-400',
    },
  ];

  return (
    <div className="min-h-screen bg-off-white p-4">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <header className="mb-8">
          <h1 className="text-3xl font-lora text-rich-charcoal mb-2">
            Welcome back, {user?.user_metadata?.full_name || 'Chef'}! 👋
          </h1>
          <p className="text-soft-taupe">What would you like to cook today?</p>
        </header>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          {quickActions.slice(0, 4).map((action, index) => (
            <motion.button
              key={action.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white p-4 rounded-xl border border-gray-200 text-center hover:border-coral-blush transition-colors group"
              onClick={() => handleQuickAction(action.path)}
            >
              <div className={`w-12 h-12 ${action.color} rounded-lg flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform`}>
                <div className="text-white">
                  {action.icon}
                </div>
              </div>
              <h3 className="font-medium text-rich-charcoal mb-1">{action.title}</h3>
              <p className="text-xs text-soft-taupe">{action.description}</p>
            </motion.button>
          ))}
        </div>

        {/* Recipe Library Button - Full Width */}
        <div className="mb-8">
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="w-full bg-white p-4 rounded-xl border border-gray-200 text-center hover:border-coral-blush transition-colors group"
            onClick={() => handleQuickAction('/recipes')}
          >
            <div className="w-12 h-12 bg-indigo-400 rounded-lg flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
              <div className="text-white">
                <BookOpen className="w-6 h-6" />
              </div>
            </div>
            <h3 className="font-medium text-rich-charcoal mb-1">Recipe Library</h3>
            <p className="text-xs text-soft-taupe">Your personal recipes</p>
          </motion.button>
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-xl p-6 shadow-sm">
          <h2 className="text-lg font-medium text-rich-charcoal mb-4">Recent Activity</h2>
          <div className="space-y-3">
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="w-8 h-8 bg-coral-blush bg-opacity-20 rounded-lg flex items-center justify-center">
                <ChefHat className="w-4 h-4 text-coral-blush" />
              </div>
              <div>
                <p className="text-sm font-medium text-rich-charcoal">Meal Planning</p>
                <p className="text-xs text-soft-taupe">Plan your weekly meals</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
              <div className="w-8 h-8 bg-sage-leaf bg-opacity-20 rounded-lg flex items-center justify-center">
                <ShoppingBag className="w-4 h-4 text-sage-leaf" />
              </div>
              <div>
                <p className="text-sm font-medium text-rich-charcoal">Grocery Shopping</p>
                <p className="text-xs text-soft-taupe">Manage your shopping list</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
