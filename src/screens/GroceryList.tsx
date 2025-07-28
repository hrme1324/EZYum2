import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShoppingCart,
  Plus,
  CheckCircle,
  Circle,
  Trash2,
  Sparkles,
  Download,
  Share2,
} from 'lucide-react';
import { GroceryItem } from '../types';

const GroceryList: React.FC = () => {
  const [groceryItems, setGroceryItems] = useState<GroceryItem[]>([
    { name: 'Chicken Breast', quantity: 2, unit: 'lbs', category: 'protein', checked: false },
    { name: 'Broccoli', quantity: 1, unit: 'head', category: 'vegetables', checked: true },
    { name: 'Brown Rice', quantity: 1, unit: 'bag', category: 'grains', checked: false },
    { name: 'Olive Oil', quantity: 1, unit: 'bottle', category: 'condiments', checked: false },
    { name: 'Tomatoes', quantity: 6, unit: 'pieces', category: 'vegetables', checked: false },
    { name: 'Eggs', quantity: 12, unit: 'pieces', category: 'protein', checked: true },
    { name: 'Milk', quantity: 1, unit: 'gallon', category: 'dairy', checked: false },
  ]);

  const [showAddItem, setShowAddItem] = useState(false);
  const [newItem, setNewItem] = useState({
    name: '',
    quantity: 1,
    unit: 'pieces',
    category: 'other',
  });

  const categories = [
    { id: 'protein', name: 'Protein', emoji: '🥩', color: 'bg-red-100 text-red-600' },
    { id: 'vegetables', name: 'Vegetables', emoji: '🥬', color: 'bg-green-100 text-green-600' },
    { id: 'fruits', name: 'Fruits', emoji: '🍎', color: 'bg-orange-100 text-orange-600' },
    { id: 'grains', name: 'Grains', emoji: '🌾', color: 'bg-yellow-100 text-yellow-600' },
    { id: 'dairy', name: 'Dairy', emoji: '🥛', color: 'bg-blue-100 text-blue-600' },
    { id: 'condiments', name: 'Condiments', emoji: '🧂', color: 'bg-purple-100 text-purple-600' },
    { id: 'other', name: 'Other', emoji: '📦', color: 'bg-gray-100 text-gray-600' },
  ];

  const toggleItem = (index: number) => {
    const newItems = [...groceryItems];
    newItems[index].checked = !newItems[index].checked;
    setGroceryItems(newItems);
  };

  const deleteItem = (index: number) => {
    const newItems = groceryItems.filter((_, i) => i !== index);
    setGroceryItems(newItems);
  };

  const addItem = () => {
    if (newItem.name.trim()) {
      setGroceryItems([...groceryItems, { ...newItem, checked: false }]);
      setNewItem({ name: '', quantity: 1, unit: 'pieces', category: 'other' });
      setShowAddItem(false);
    }
  };

  const getCategoryColor = (category: string) => categories.find((c) => c.id === category)?.color || 'bg-gray-100 text-gray-600';

  const getCategoryEmoji = (category: string) => categories.find((c) => c.id === category)?.emoji || '📦';

  const groupedItems = groceryItems.reduce(
    (acc, item) => {
      if (!acc[item.category]) {
        acc[item.category] = [];
      }
      acc[item.category].push(item);
      return acc;
    },
    {} as Record<string, GroceryItem[]>,
  );

  const checkedCount = groceryItems.filter((item) => item.checked).length;
  const totalCount = groceryItems.length;

  return (
    <div className="min-h-screen bg-off-white p-4">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <header className="mb-6">
          <h1 className="text-3xl font-lora text-rich-charcoal mb-2">Grocery List</h1>
          <p className="text-soft-taupe">Smart shopping list with AI suggestions</p>
        </header>

        {/* Progress Bar */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-rich-charcoal">Progress</span>
            <span className="text-sm text-soft-taupe">
              {checkedCount}/{totalCount} items
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-coral-blush h-2 rounded-full transition-all duration-300"
              style={{ width: `${totalCount > 0 ? (checkedCount / totalCount) * 100 : 0}%` }}
            />
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setShowAddItem(true)}
            className="flex-1 bg-coral-blush text-white py-3 rounded-lg hover:bg-opacity-90 transition-colors flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span className="font-medium">Add Item</span>
          </button>
          <button className="bg-white border border-gray-200 p-3 rounded-lg hover:border-coral-blush transition-colors">
            <Download className="w-4 h-4 text-soft-taupe" />
          </button>
          <button className="bg-white border border-gray-200 p-3 rounded-lg hover:border-coral-blush transition-colors">
            <Share2 className="w-4 h-4 text-soft-taupe" />
          </button>
        </div>

        {/* AI Suggestions */}
        <div className="bg-gradient-to-r from-sage-leaf to-green-400 rounded-xl p-4 text-white mb-6">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-5 h-5" />
            <h3 className="font-medium">Smart Suggestions</h3>
          </div>
          <p className="text-sm opacity-90 mb-3">Based on your meal plan, you might also need:</p>
          <div className="space-y-2">
            <div className="flex items-center justify-between bg-white bg-opacity-20 rounded-lg p-2">
              <span className="text-sm">Garlic (3 cloves)</span>
              <button className="text-xs bg-white bg-opacity-30 px-2 py-1 rounded">Add</button>
            </div>
            <div className="flex items-center justify-between bg-white bg-opacity-20 rounded-lg p-2">
              <span className="text-sm">Onion (1 medium)</span>
              <button className="text-xs bg-white bg-opacity-30 px-2 py-1 rounded">Add</button>
            </div>
          </div>
        </div>

        {/* Grocery Items by Category */}
        <div className="space-y-6">
          {Object.entries(groupedItems).map(([category, items]) => (
            <div key={category}>
              <div className="flex items-center gap-2 mb-3">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center ${getCategoryColor(category)}`}
                >
                  <span className="text-sm">{getCategoryEmoji(category)}</span>
                </div>
                <h3 className="font-medium text-rich-charcoal capitalize">
                  {categories.find((c) => c.id === category)?.name || category}
                </h3>
              </div>

              <div className="space-y-2">
                <AnimatePresence>
                  {items.map((item) => {
                    const globalIndex = groceryItems.findIndex((i) => i.name === item.name);
                    return (
                      <motion.div
                        key={item.name}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        className={`bg-white rounded-lg p-4 border transition-all ${
                          item.checked ? 'border-green-200 bg-green-50' : 'border-gray-200'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3 flex-1">
                            <button
                              onClick={() => toggleItem(globalIndex)}
                              className="text-coral-blush hover:text-opacity-80 transition-colors"
                            >
                              {item.checked
                                ? (
                                  <CheckCircle className="w-5 h-5" />
                                )
                                : (
                                  <Circle className="w-5 h-5" />
                                )}
                            </button>

                            <div className="flex-1">
                              <h4
                                className={`font-medium ${
                                  item.checked
                                    ? 'text-green-600 line-through'
                                    : 'text-rich-charcoal'
                                }`}
                              >
                                {item.name}
                              </h4>
                              <p className="text-sm text-soft-taupe">
                                {item.quantity} {item.unit}
                              </p>
                            </div>
                          </div>

                          <button
                            onClick={() => deleteItem(globalIndex)}
                            className="text-soft-taupe hover:text-red-500 transition-colors p-1"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </motion.div>
                    );
                  })}
                </AnimatePresence>
              </div>
            </div>
          ))}
        </div>

        {/* Empty State */}
        {groceryItems.length === 0 && (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <ShoppingCart className="w-8 h-8 text-soft-taupe" />
            </div>
            <h3 className="text-lg font-medium text-rich-charcoal mb-2">
              Your grocery list is empty
            </h3>
            <p className="text-soft-taupe mb-4">Start adding items to your shopping list</p>
            <button onClick={() => setShowAddItem(true)} className="btn-primary">
              Add Your First Item
            </button>
          </div>
        )}
      </div>

      {/* Add Item Modal */}
      <AnimatePresence>
        {showAddItem && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            onClick={() => setShowAddItem(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-xl p-6 w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-xl font-lora text-rich-charcoal mb-4">Add to Grocery List</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-rich-charcoal mb-2">
                    Item Name
                  </label>
                  <input
                    type="text"
                    value={newItem.name}
                    onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                    className="input-field"
                    placeholder="e.g., Chicken Breast"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-rich-charcoal mb-2">
                      Quantity
                    </label>
                    <input
                      type="number"
                      value={newItem.quantity}
                      onChange={(e) => setNewItem({ ...newItem, quantity: parseInt(e.target.value) })
                      }
                      className="input-field"
                      min="1"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-rich-charcoal mb-2">
                      Unit
                    </label>
                    <select
                      value={newItem.unit}
                      onChange={(e) => setNewItem({ ...newItem, unit: e.target.value })}
                      className="input-field"
                    >
                      <option value="pieces">Pieces</option>
                      <option value="lbs">Pounds</option>
                      <option value="oz">Ounces</option>
                      <option value="g">Grams</option>
                      <option value="bottle">Bottle</option>
                      <option value="bag">Bag</option>
                      <option value="head">Head</option>
                      <option value="gallon">Gallon</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-rich-charcoal mb-2">
                    Category
                  </label>
                  <select
                    value={newItem.category}
                    onChange={(e) => setNewItem({ ...newItem, category: e.target.value })}
                    className="input-field"
                  >
                    {categories.map((category) => (
                      <option key={category.id} value={category.id}>
                        {category.emoji} {category.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button onClick={() => setShowAddItem(false)} className="flex-1 btn-secondary">
                  Cancel
                </button>
                <button onClick={addItem} className="flex-1 btn-primary">
                  Add Item
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default GroceryList;
