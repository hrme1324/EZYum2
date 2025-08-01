import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle, Circle, Plus, ShoppingCart, Trash2 } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { GroceryService } from '../api/groceryService';
import { useAuthStore } from '../state/authStore';
import { GroceryItem } from '../types';

const GroceryList: React.FC = () => {
  const { user } = useAuthStore();
  const [groceryItems, setGroceryItems] = useState<GroceryItem[]>([]);
  const [loading, setLoading] = useState(true);
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

  // Load grocery list on component mount
  useEffect(() => {
    if (user) {
      loadGroceryList();
    }
  }, [user]);

  const loadGroceryList = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const items = await GroceryService.getGroceryList(user.id);

      // If no items exist, create default items
      if (items.length === 0) {
        const defaultItems: GroceryItem[] = [
          { name: 'Chicken Breast', quantity: 2, unit: 'lbs', category: 'protein', checked: false },
          { name: 'Broccoli', quantity: 1, unit: 'head', category: 'vegetables', checked: true },
          { name: 'Brown Rice', quantity: 1, unit: 'bag', category: 'grains', checked: false },
          {
            name: 'Olive Oil',
            quantity: 1,
            unit: 'bottle',
            category: 'condiments',
            checked: false,
          },
          { name: 'Tomatoes', quantity: 6, unit: 'pieces', category: 'vegetables', checked: false },
          { name: 'Eggs', quantity: 12, unit: 'pieces', category: 'protein', checked: true },
          { name: 'Milk', quantity: 1, unit: 'gallon', category: 'dairy', checked: false },
        ];

        // Save default items to database
        const success = await GroceryService.saveGroceryList(user.id, defaultItems);
        if (success) {
          setGroceryItems(defaultItems);
          toast.success('Default grocery list created!');
        } else {
          // If saving fails, still show the items locally
          setGroceryItems(defaultItems);
          toast.error('Failed to save to database, but items are available locally');
        }
      } else {
        setGroceryItems(items);
      }
    } catch (error) {
      console.error('Error loading grocery list:', error);
      toast.error('Failed to load grocery list');
      // Set empty array to prevent infinite loading
      setGroceryItems([]);
    } finally {
      setLoading(false);
    }
  };

  const toggleItem = async (index: number) => {
    if (!user) return;

    try {
      const success = await GroceryService.toggleGroceryItem(user.id, index);
      if (success) {
        const newItems = [...groceryItems];
        newItems[index].checked = !newItems[index].checked;
        setGroceryItems(newItems);
      } else {
        toast.error('Failed to update item');
      }
    } catch (error) {
      console.error('Error toggling item:', error);
      toast.error('Failed to update item');
    }
  };

  const deleteItem = async (index: number) => {
    if (!user) return;

    try {
      const success = await GroceryService.removeGroceryItem(user.id, index);
      if (success) {
        const newItems = groceryItems.filter((_, i) => i !== index);
        setGroceryItems(newItems);
        toast.success('Item removed');
      } else {
        toast.error('Failed to remove item');
      }
    } catch (error) {
      console.error('Error deleting item:', error);
      toast.error('Failed to remove item');
    }
  };

  const addItem = async () => {
    if (!user || !newItem.name.trim()) return;

    try {
      const item: GroceryItem = { ...newItem, checked: false };
      const success = await GroceryService.addGroceryItem(user.id, item);
      if (success) {
        setGroceryItems([...groceryItems, item]);
        setNewItem({ name: '', quantity: 1, unit: 'pieces', category: 'other' });
        setShowAddItem(false);
        toast.success('Item added');
      } else {
        toast.error('Failed to add item');
      }
    } catch (error) {
      console.error('Error adding item:', error);
      toast.error('Failed to add item');
    }
  };

  const clearCompleted = async () => {
    if (!user) return;

    try {
      const success = await GroceryService.clearCompletedItems(user.id);
      if (success) {
        const newItems = groceryItems.filter((item) => !item.checked);
        setGroceryItems(newItems);
        toast.success('Completed items cleared');
      } else {
        toast.error('Failed to clear completed items');
      }
    } catch (error) {
      console.error('Error clearing completed items:', error);
      toast.error('Failed to clear completed items');
    }
  };

  const getCategoryColor = (category: string) =>
    categories.find((c) => c.id === category)?.color || 'bg-gray-100 text-gray-600';

  const getCategoryEmoji = (category: string) =>
    categories.find((c) => c.id === category)?.emoji || '📦';

  const groupedItems = groceryItems.reduce(
    (acc, item) => {
      if (!acc[item.category]) {
        acc[item.category] = [];
      }
      acc[item.category].push(item);
      return acc;
    },
    {} as Record<string, GroceryItem[]>
  );

  const checkedCount = groceryItems.filter((item) => item.checked).length;
  const totalCount = groceryItems.length;

  if (loading) {
    return (
      <div className="min-h-screen bg-off-white p-4">
        <div className="max-w-md mx-auto">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
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

        {/* Action Buttons */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setShowAddItem(true)}
            className="flex-1 bg-coral-blush text-white py-3 px-4 rounded-lg hover:bg-opacity-90 transition-colors flex items-center justify-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Add Item
          </button>
          {checkedCount > 0 && (
            <button
              onClick={clearCompleted}
              className="bg-sage-leaf text-white py-3 px-4 rounded-lg hover:bg-opacity-90 transition-colors flex items-center justify-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Clear
            </button>
          )}
        </div>

        {/* Grocery Items */}
        {groceryItems.length === 0 ? (
          <div className="text-center py-12">
            <ShoppingCart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-rich-charcoal mb-2">Your list is empty</h3>
            <p className="text-soft-taupe">Add some items to get started</p>
          </div>
        ) : (
          <div className="space-y-4">
            {Object.entries(groupedItems).map(([category, items]) => (
              <div key={category} className="bg-white rounded-xl p-4 shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-lg">{getCategoryEmoji(category)}</span>
                  <h3 className="font-medium text-rich-charcoal capitalize">{category}</h3>
                </div>
                <div className="space-y-2">
                  {items.map((item, index) => {
                    const globalIndex = groceryItems.findIndex((i) => i === item);
                    return (
                      <motion.div
                        key={`${item.name}-${index}`}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="flex items-center gap-3 flex-1">
                          <button onClick={() => toggleItem(globalIndex)} className="flex-shrink-0">
                            {item.checked ? (
                              <CheckCircle className="w-5 h-5 text-green-500" />
                            ) : (
                              <Circle className="w-5 h-5 text-gray-400" />
                            )}
                          </button>
                          <div className="flex-1">
                            <span
                              className={`font-medium ${item.checked ? 'line-through text-gray-500' : 'text-rich-charcoal'}`}
                            >
                              {item.name}
                            </span>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-sm text-soft-taupe">
                                {item.quantity} {item.unit}
                              </span>
                              <span
                                className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(item.category)}`}
                              >
                                {categories.find((c) => c.id === item.category)?.name}
                              </span>
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => deleteItem(globalIndex)}
                          className="text-red-500 hover:text-red-700 transition-colors p-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Add Item Modal */}
        <AnimatePresence>
          {showAddItem && (
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
                className="bg-white rounded-xl p-6 w-full max-w-md"
              >
                <h3 className="text-lg font-medium text-rich-charcoal mb-4">Add Item</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-rich-charcoal mb-2">
                      Item Name
                    </label>
                    <input
                      type="text"
                      value={newItem.name}
                      onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-coral-blush focus:border-transparent"
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
                        onChange={(e) =>
                          setNewItem({ ...newItem, quantity: parseInt(e.target.value) || 1 })
                        }
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-coral-blush focus:border-transparent"
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
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-coral-blush focus:border-transparent"
                      >
                        <option value="pieces">pieces</option>
                        <option value="lbs">lbs</option>
                        <option value="kg">kg</option>
                        <option value="bottle">bottle</option>
                        <option value="bag">bag</option>
                        <option value="head">head</option>
                        <option value="gallon">gallon</option>
                        <option value="liter">liter</option>
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
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-coral-blush focus:border-transparent"
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
                  <button
                    onClick={() => setShowAddItem(false)}
                    className="flex-1 py-3 px-4 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={addItem}
                    className="flex-1 bg-coral-blush text-white py-3 px-4 rounded-lg hover:bg-opacity-90 transition-colors"
                  >
                    Add Item
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default GroceryList;
