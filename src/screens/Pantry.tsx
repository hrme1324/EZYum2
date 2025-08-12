import { AnimatePresence, motion } from 'framer-motion';
import { Camera, Clock, Edit3, Plus, QrCode, Search, ShoppingBag, Trash2, X } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import { BarcodeService } from '../api/barcodeService';
import { PantryService } from '../api/pantryService';
import { useAuthStore } from '../state/authStore';
import { PantryItem } from '../types';
import { logger } from '../utils/logger';

const Pantry: React.FC = () => {
  const { user } = useAuthStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showBarcodeModal, setShowBarcodeModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [barcodeInput, setBarcodeInput] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [pantryItems, setPantryItems] = useState<PantryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingItem, setEditingItem] = useState<PantryItem | null>(null);
  const [newItem, setNewItem] = useState({
    name: '',
    category: 'other',
    quantity: 1,
    expiration: '',
  });

  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const categories = [
    { id: 'all', name: 'All', emoji: '📦' },
    { id: 'protein', name: 'Protein', emoji: '🥩' },
    { id: 'grains', name: 'Grains', emoji: '🌾' },
    { id: 'vegetables', name: 'Vegetables', emoji: '🥬' },
    { id: 'fruits', name: 'Fruits', emoji: '🍎' },
    { id: 'dairy', name: 'Dairy', emoji: '🥛' },
    { id: 'condiments', name: 'Condiments', emoji: '🧂' },
    { id: 'other', name: 'Other', emoji: '📦' },
  ];

  const loadPantryItems = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const items = await PantryService.getPantryItems(user.id);
      setPantryItems(items || []);
    } catch (error) {
      logger.error('Error loading pantry items:', error);
      toast.error('Failed to load pantry items');
    } finally {
      setLoading(false);
    }
  };

  // Load pantry items when user changes
  useEffect(() => {
    if (user) {
      loadPantryItems();
    }
  }, [user, loadPantryItems]);

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
      logger.error('Error scanning barcode:', error);
      toast.error('Failed to scan barcode');
    } finally {
      setIsScanning(false);
    }
  };

  const addItem = async () => {
    if (!user || !newItem.name.trim()) {
      toast.error('Please enter an item name');
      return;
    }

    try {
      const addedItem = await PantryService.addPantryItem(user.id, {
        name: newItem.name.trim(),
        category: newItem.category,
        quantity: newItem.quantity,
        expiration: newItem.expiration || undefined,
        source: 'manual',
      });

      if (addedItem) {
        setPantryItems((prev) => [addedItem, ...prev]);
        setShowAddModal(false);
        setNewItem({ name: '', category: 'other', quantity: 1, expiration: '' });
        toast.success('Item added to pantry');
      } else {
        toast.error('Failed to add item');
      }
    } catch (error) {
      logger.error('Error adding pantry item:', error);
      toast.error('Failed to add item');
    }
  };

  const editItem = (item: PantryItem) => {
    setEditingItem(item);
    setNewItem({
      name: item.name,
      category: item.category,
      quantity: item.quantity,
      expiration: item.expiration || '',
    });
    setShowEditModal(true);
  };

  const updateItem = async () => {
    if (!user || !editingItem || !newItem.name.trim()) {
      toast.error('Please enter an item name');
      return;
    }

    try {
      const updatedItem = await PantryService.updatePantryItem(user.id, editingItem.id, {
        name: newItem.name.trim(),
        category: newItem.category,
        quantity: newItem.quantity,
        expiration: newItem.expiration || undefined,
      });

      if (updatedItem) {
        setPantryItems((prev) =>
          prev.map((item) => (item.id === editingItem.id ? updatedItem : item)),
        );
        setShowEditModal(false);
        setEditingItem(null);
        setNewItem({ name: '', category: 'other', quantity: 1, expiration: '' });
        toast.success('Item updated');
      } else {
        toast.error('Failed to update item');
      }
    } catch (error) {
      logger.error('Error updating pantry item:', error);
      toast.error('Failed to update item');
    }
  };

  const deleteItem = async (itemId: string) => {
    if (!user) return;

    try {
      const success = await PantryService.deletePantryItem(user.id, itemId);
      if (success) {
        setPantryItems((prev) => prev.filter((item) => item.id !== itemId));
        toast.success('Item removed from pantry');
      } else {
        toast.error('Failed to remove item');
      }
    } catch (error) {
      logger.error('Error deleting pantry item:', error);
      toast.error('Failed to remove item');
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment' },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
    } catch (error) {
      logger.error('Camera error:', error);
      toast.error('Camera access denied');
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-off-white p-4 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-coral-blush mx-auto mb-4"></div>
          <p className="text-soft-taupe">Loading pantry...</p>
        </div>
      </div>
    );
  }

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
                        {categories.find((c) => c.id === item.category)?.emoji || '📦'}
                      </span>
                      <div>
                        <h3 className="font-medium text-rich-charcoal">{item.name}</h3>
                        <p className="text-sm text-soft-taupe">
                          Qty: {item.quantity} •{' '}
                          {item.source === 'scan' ? '📱 Scanned' : '✏️ Manual'}
                        </p>
                      </div>
                    </div>

                    {item.expiration && (
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-soft-taupe" />
                        <span
                          className={`text-sm ${getExpirationColor(getDaysUntilExpiration(item.expiration))}`}
                        >
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
                    <button
                      onClick={() => editItem(item)}
                      className="p-2 text-soft-taupe hover:text-rich-charcoal transition-colors"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteItem(item.id)}
                      className="p-2 text-red-500 hover:text-red-700 transition-colors"
                    >
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
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-lora text-rich-charcoal">Add to Pantry</h2>
                <button
                  onClick={() => setShowAddModal(false)}
                  className="text-soft-taupe hover:text-rich-charcoal"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-rich-charcoal mb-2">
                    Item Name
                  </label>
                  <input
                    type="text"
                    value={newItem.name}
                    onChange={(e) => setNewItem((prev) => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Chicken Breast"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:border-coral-blush focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-rich-charcoal mb-2">
                    Category
                  </label>
                  <select
                    value={newItem.category}
                    onChange={(e) => setNewItem((prev) => ({ ...prev, category: e.target.value }))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:border-coral-blush focus:outline-none"
                  >
                    {categories
                      .filter((c) => c.id !== 'all')
                      .map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.emoji} {category.name}
                        </option>
                      ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-rich-charcoal mb-2">
                      Quantity
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={newItem.quantity}
                      onChange={(e) =>
                        setNewItem((prev) => ({ ...prev, quantity: Number(e.target.value) }))
                      }
                      className="w-full p-3 border border-gray-300 rounded-lg focus:border-coral-blush focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-rich-charcoal mb-2">
                      Expiration
                    </label>
                    <input
                      type="date"
                      value={newItem.expiration}
                      onChange={(e) =>
                        setNewItem((prev) => ({ ...prev, expiration: e.target.value }))
                      }
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

      {/* Edit Item Modal */}
      <AnimatePresence>
        {showEditModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
            onClick={() => setShowEditModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-xl p-6 w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-lora text-rich-charcoal">Edit Item</h2>
                <button
                  onClick={() => setShowEditModal(false)}
                  className="text-soft-taupe hover:text-rich-charcoal"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-rich-charcoal mb-2">
                    Item Name
                  </label>
                  <input
                    type="text"
                    value={newItem.name}
                    onChange={(e) => setNewItem((prev) => ({ ...prev, name: e.target.value }))}
                    placeholder="e.g., Chicken Breast"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:border-coral-blush focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-rich-charcoal mb-2">
                    Category
                  </label>
                  <select
                    value={newItem.category}
                    onChange={(e) => setNewItem((prev) => ({ ...prev, category: e.target.value }))}
                    className="w-full p-3 border border-gray-300 rounded-lg focus:border-coral-blush focus:outline-none"
                  >
                    {categories
                      .filter((c) => c.id !== 'all')
                      .map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.emoji} {category.name}
                        </option>
                      ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-rich-charcoal mb-2">
                      Quantity
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={newItem.quantity}
                      onChange={(e) =>
                        setNewItem((prev) => ({ ...prev, quantity: Number(e.target.value) }))
                      }
                      className="w-full p-3 border border-gray-300 rounded-lg focus:border-coral-blush focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-rich-charcoal mb-2">
                      Expiration
                    </label>
                    <input
                      type="date"
                      value={newItem.expiration}
                      onChange={(e) =>
                        setNewItem((prev) => ({ ...prev, expiration: e.target.value }))
                      }
                      className="w-full p-3 border border-gray-300 rounded-lg focus:border-coral-blush focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button onClick={() => setShowEditModal(false)} className="flex-1 btn-secondary">
                  Cancel
                </button>
                <button onClick={updateItem} className="flex-1 btn-primary">
                  Update Item
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
            onClick={() => {
              setShowBarcodeModal(false);
              stopCamera();
            }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-xl p-6 w-full max-w-md"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-lora text-rich-charcoal">Scan Barcode</h2>
                <button
                  onClick={() => {
                    setShowBarcodeModal(false);
                    stopCamera();
                  }}
                  className="text-soft-taupe hover:text-rich-charcoal"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-rich-charcoal mb-2">
                    Barcode Number
                  </label>
                  <input
                    type="text"
                    value={barcodeInput}
                    onChange={(e) => setBarcodeInput(e.target.value)}
                    placeholder="Enter barcode or scan with camera"
                    className="w-full p-3 border border-gray-300 rounded-lg focus:border-coral-blush focus:outline-none"
                  />
                </div>

                <div className="text-center">
                  <button
                    onClick={startCamera}
                    className="p-4 bg-sage-leaf text-white rounded-lg hover:bg-opacity-90 transition-colors"
                  >
                    <Camera className="w-6 h-6" />
                  </button>
                  <p className="text-sm text-soft-taupe mt-2">Use camera to scan</p>

                  {/* Camera video element */}
                  <div className="mt-4">
                    <video
                      ref={videoRef}
                      autoPlay
                      playsInline
                      className="w-full h-32 bg-gray-100 rounded-lg object-cover"
                    />
                  </div>
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
                <button
                  onClick={() => {
                    setShowBarcodeModal(false);
                    stopCamera();
                  }}
                  className="flex-1 btn-secondary"
                >
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
