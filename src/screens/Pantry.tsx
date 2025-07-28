import { AnimatePresence, motion } from 'framer-motion';
import { Camera, Clock, Edit3, Plus, QrCode, Search, ShoppingBag, Trash2 } from 'lucide-react';
import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { BarcodeService } from '../api/barcodeService';
import { PantryItem } from '../types';

const Pantry: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showBarcodeModal, setShowBarcodeModal] = useState(false);
  const [barcodeInput, setBarcodeInput] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [newItem, setNewItem] = useState({
    name: '',
    category: 'other',
    quantity: 1,
    expiration: '',
  });

  // Mock data - replace with real Supabase data
  const pantryItems: PantryItem[] = [
    {
      id: '1',
      user_id: 'user1',
      name: 'Chicken Breast',
      category: 'protein',
      quantity: 2,
      expiration: '2024-01-15',
      source: 'manual',
      created_at: '2024-01-10',
    },
    {
      id: '2',
      user_id: 'user1',
      name: 'Brown Rice',
      category: 'grains',
      quantity: 1,
      expiration: '2024-06-15',
      source: 'manual',
      created_at: '2024-01-10',
    },
    {
      id: '3',
      user_id: 'user1',
      name: 'Broccoli',
      category: 'vegetables',
      quantity: 3,
      expiration: '2024-01-12',
      source: 'manual',
      created_at: '2024-01-10',
    },
    {
      id: '4',
      user_id: 'user1',
      name: 'Eggs',
      category: 'protein',
      quantity: 12,
      expiration: '2024-01-20',
      source: 'manual',
      created_at: '2024-01-10',
    },
    {
      id: '5',
      user_id: 'user1',
      name: 'Olive Oil',
      category: 'condiments',
      quantity: 1,
      expiration: '2024-12-15',
      source: 'manual',
      created_at: '2024-01-10',
    },
  ];

  const categories = [
    { id: 'all', name: 'All', emoji: '📦' },
    { id: 'protein', name: 'Protein', emoji: '🥩' },
    { id: 'grains', name: 'Grains', emoji: '🌾' },
    { id: 'vegetables', name: 'Vegetables', emoji: '🥬' },
    { id: 'fruits', name: 'Fruits', emoji: '🍎' },
    { id: 'dairy', name: 'Dairy', emoji: '🥛' },
    { id: 'condiments', name: 'Condiments', emoji: '🧂' },
  ];

  const filteredItems = pantryItems.filter((item) => {
    const matchesSearch = item.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || item.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const getDaysUntilExpiration = (expirationDate: string | undefined) => {
    if (!expirationDate) return 999; // No expiration set
    const today = new Date();
    const expiration = new Date(expirationDate);
    const diffTime = expiration.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getExpirationColor = (days: number) => {
    if (days < 0) return 'text-red-500';
    if (days <= 3) return 'text-orange-500';
    if (days <= 7) return 'text-yellow-500';
    return 'text-green-500';
  };

  const handleBarcodeScan = async () => {
    if (!barcodeInput.trim()) {
      toast.error('Please enter a barcode');
      return;
    }

    setIsScanning(true);
    try {
      const product = await BarcodeService.scanBarcode(barcodeInput.trim());

      if (product) {
        setNewItem({
          name: product.name,
          category: product.category,
          quantity: 1,
          expiration: '',
        });
        setShowBarcodeModal(false);
        setShowAddModal(true);
        setBarcodeInput('');
        toast.success(`Found: ${product.name}`);
      } else {
        toast.error('Product not found. Try manual entry.');
      }
    } catch (error) {
      console.error('Barcode scan error:', error);
      toast.error('Failed to scan barcode');
    } finally {
      setIsScanning(false);
    }
  };

  const addItem = () => {
    if (!newItem.name.trim()) {
      toast.error('Please enter an item name');
      return;
    }

    // Add item logic here
    console.log('Adding item:', newItem);
    setShowAddModal(false);
    setNewItem({ name: '', category: 'other', quantity: 1, expiration: '' });
    toast.success('Item added to pantry');
  };

  return (
    <div className="min-h-screen bg-off-white p-4">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <header className="mb-6">
          <h1 className="text-3xl font-lora text-rich-charcoal mb-2">Pantry</h1>
          <p className="text-soft-taupe">Manage your ingredients and supplies</p>
        </header>

        {/* Search and Add */}
        <div className="flex gap-2 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-soft-taupe" />
            <input
              type="text"
              placeholder="Search pantry..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white rounded-xl border border-gray-200 focus:border-coral-blush focus:outline-none"
            />
          </div>
          <button
            onClick={() => setShowAddModal(true)}
            className="p-3 bg-coral-blush text-white rounded-xl hover:bg-opacity-90 transition-colors"
          >
            <Plus className="w-5 h-5" />
          </button>
          <button
            onClick={() => setShowBarcodeModal(true)}
            className="p-3 bg-sage-leaf text-white rounded-xl hover:bg-opacity-90 transition-colors"
          >
            <QrCode className="w-5 h-5" />
          </button>
        </div>

        {/* Categories */}
        <div className="mb-6">
          <div className="flex gap-2 overflow-x-auto pb-2">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg whitespace-nowrap transition-colors ${
                  selectedCategory === category.id
                    ? 'bg-coral-blush text-white'
                    : 'bg-white text-rich-charcoal hover:bg-gray-50'
                }`}
              >
                <span className="text-lg">{category.emoji}</span>
                <span className="text-sm font-medium">{category.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Pantry Items */}
        <div className="space-y-3">
          <AnimatePresence>
            {filteredItems.map((item) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-white rounded-xl p-4 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-2xl">
                        {categories.find(c => c.id === item.category)?.emoji || '📦'}
                      </span>
                      <div>
                        <h3 className="font-medium text-rich-charcoal">{item.name}</h3>
                        <p className="text-sm text-soft-taupe">
                          Qty: {item.quantity} • {item.source === 'scan' ? '📱 Scanned' : '✏️ Manual'}
                        </p>
                      </div>
                    </div>

                    {item.expiration && (
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-soft-taupe" />
                        <span className={`text-sm ${getExpirationColor(getDaysUntilExpiration(item.expiration))}`}>
                          {getDaysUntilExpiration(item.expiration) < 0
                            ? 'Expired'
                            : getDaysUntilExpiration(item.expiration) === 0
                            ? 'Expires today'
                            : `${getDaysUntilExpiration(item.expiration)} days left`}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button className="p-2 text-soft-taupe hover:text-rich-charcoal transition-colors">
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button className="p-2 text-red-500 hover:text-red-700 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>

          {filteredItems.length === 0 && (
            <div className="text-center py-8">
              <ShoppingBag className="w-12 h-12 text-soft-taupe mx-auto mb-3" />
              <p className="text-soft-taupe">No items found</p>
              <p className="text-sm text-soft-taupe">Add some ingredients to get started</p>
            </div>
          )}
        </div>
      </div>

      {/* Add Item Modal */}
      <AnimatePresence>
        {showAddModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            onClick={() => setShowAddModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-xl p-6 w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-xl font-lora text-rich-charcoal mb-4">Add to Pantry</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-rich-charcoal mb-2">Item Name</label>
                  <input
                    type="text"
                    value={newItem.name}
                    onChange={(e) => setNewItem(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Chicken Breast"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:border-coral-blush focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-rich-charcoal mb-2">Category</label>
                  <select
                    value={newItem.category}
                    onChange={(e) => setNewItem(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:border-coral-blush focus:outline-none"
                  >
                    {categories.filter(c => c.id !== 'all').map(category => (
                      <option key={category.id} value={category.id}>
                        {category.emoji} {category.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-rich-charcoal mb-2">Quantity</label>
                    <input
                      type="number"
                      min="1"
                      value={newItem.quantity}
                      onChange={(e) => setNewItem(prev => ({ ...prev, quantity: Number(e.target.value) }))}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:border-coral-blush focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-rich-charcoal mb-2">Expiration</label>
                    <input
                      type="date"
                      value={newItem.expiration}
                      onChange={(e) => setNewItem(prev => ({ ...prev, expiration: e.target.value }))}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:border-coral-blush focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button onClick={() => setShowAddModal(false)} className="flex-1 btn-secondary">
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

      {/* Barcode Scanner Modal */}
      <AnimatePresence>
        {showBarcodeModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            onClick={() => setShowBarcodeModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-xl p-6 w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-xl font-lora text-rich-charcoal mb-4">Scan Barcode</h2>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-rich-charcoal mb-2">Barcode Number</label>
                  <input
                    type="text"
                    value={barcodeInput}
                    onChange={(e) => setBarcodeInput(e.target.value)}
                    placeholder="Enter barcode or scan with camera"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:border-coral-blush focus:outline-none"
                  />
                </div>

                <div className="text-center">
                  <button className="p-4 bg-sage-leaf text-white rounded-lg hover:bg-opacity-90 transition-colors">
                    <Camera className="w-6 h-6" />
                  </button>
                  <p className="text-sm text-soft-taupe mt-2">Use camera to scan</p>
                </div>

                <div className="text-xs text-soft-taupe bg-gray-50 p-3 rounded-lg">
                  <p className="font-medium mb-1">💡 Tip:</p>
                  <p>Try these test barcodes:</p>
                  <ul className="mt-1 space-y-1">
                    <li>• 123456789 (Organic Milk)</li>
                    <li>• 987654321 (Whole Grain Bread)</li>
                  </ul>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button onClick={() => setShowBarcodeModal(false)} className="flex-1 btn-secondary">
                  Cancel
                </button>
                <button
                  onClick={handleBarcodeScan}
                  disabled={isScanning}
                  className="flex-1 btn-primary disabled:opacity-50"
                >
                  {isScanning ? 'Scanning...' : 'Scan Barcode'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Pantry;
