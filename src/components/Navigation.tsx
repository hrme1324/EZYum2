import { BookOpen, Calendar, Home, ShoppingBag, ShoppingCart, User, Utensils } from 'lucide-react';
import React from 'react';
import { Link, useLocation } from 'react-router-dom';

const Navigation: React.FC = () => {
  const location = useLocation();

  const navItems = [
    { path: '/', icon: Home, label: 'Home', emoji: '🏠' },
    { path: '/recipes', icon: BookOpen, label: 'Recipes', emoji: '📖' },
    { path: '/my-recipes', icon: Utensils, label: 'My Recipes', emoji: '👨‍🍳' },
    { path: '/pantry', icon: ShoppingBag, label: 'Pantry', emoji: '📦' },
    { path: '/meal-planner', icon: Calendar, label: 'Plan', emoji: '📅' },
    { path: '/grocery-list', icon: ShoppingCart, label: 'Grocery', emoji: '🛒' },
    { path: '/profile', icon: User, label: 'Profile', emoji: '👤' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2 z-50">
      <div className="max-w-md mx-auto flex justify-around">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center py-2 px-3 rounded-lg transition-all duration-200 ${
                isActive
                  ? 'text-coral-blush bg-coral-blush bg-opacity-10'
                  : 'text-soft-taupe hover:text-rich-charcoal'
              }`}
            >
              <div className="w-6 h-6 mb-1 flex items-center justify-center">
                {isActive ? (
                  <Icon className="w-5 h-5" />
                ) : (
                  <span className="text-lg">{item.emoji}</span>
                )}
              </div>
              <span className={`text-xs font-medium ${isActive ? 'text-coral-blush' : ''}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default Navigation;
