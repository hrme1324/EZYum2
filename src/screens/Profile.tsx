import { motion } from 'framer-motion';
import {
  AlertTriangle,
  Bell,
  Clock,
  LogOut,
  Moon,
  Plus,
  Settings,
  Sun,
  Trophy,
  Utensils,
  X,
} from 'lucide-react';
import React, { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { SettingsService } from '../api/settingsService';
import { useAuthStore } from '../state/authStore';
import { UserAllergen, UserAppliance, UserSettings } from '../types';

const Profile: React.FC = () => {
  const { user, signOut } = useAuthStore();
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [allergens, setAllergens] = useState<UserAllergen[]>([]);
  const [appliances, setAppliances] = useState<UserAppliance[]>([]);
  const [showAllergenModal, setShowAllergenModal] = useState(false);
  const [showApplianceModal, setShowApplianceModal] = useState(false);
  const [newAllergen, setNewAllergen] = useState({ name: '', severity: 'moderate' as const });
  const [newAppliance, setNewAppliance] = useState({ name: '', type: 'cooking' });
  const [updateTimeout, setUpdateTimeout] = useState<ReturnType<typeof setTimeout> | null>(null);

  // Mock user stats
  const userStats = {
    totalMeals: 47,
    currentStreak: 7,
    totalXP: 1250,
    level: 3,
    badges: 5,
    timeSaved: 12.5,
  };

  // Load user data
  useEffect(() => {
    if (user) {
      loadUserData();
    }
  }, [user]);

  const loadUserData = async () => {
    if (!user) return;

    try {
      const [userSettings, userAllergens, userAppliances] = await Promise.all([
        SettingsService.getUserSettings(user.id),
        SettingsService.getUserAllergens(user.id),
        SettingsService.getUserAppliances(user.id),
      ]);

      // If no settings exist, create default settings
      if (!userSettings) {
        const defaultSettings = await SettingsService.initializeDefaultSettings(user.id);
        setSettings(defaultSettings);
      } else {
        setSettings(userSettings);
      }

      setAllergens(userAllergens);
      setAppliances(userAppliances);
    } catch (error) {
      console.error('Error loading user data:', error);
    }
  };

  const updateSetting = useCallback(
    async (key: keyof UserSettings, value: any) => {
      if (!user) return;

      // Clear existing timeout
      if (updateTimeout) {
        clearTimeout(updateTimeout);
      }

      // Set local state immediately for responsive UI
      setSettings((prev) => (prev ? { ...prev, [key]: value } : null));

      // Debounce the actual API call
      const timeout = setTimeout(async () => {
        try {
          const currentSettings = settings || {
            time_budget: 30,
            notifications_enabled: true,
            dark_mode: false,
            meal_reminders: true,
            grocery_reminders: true,
          };

          const updatedSettings = await SettingsService.upsertUserSettings(user.id, {
            ...currentSettings,
            [key]: value,
          });

          if (updatedSettings) {
            setSettings(updatedSettings);
            toast.success('Settings updated');
          }
        } catch (error) {
          console.error('Error updating settings:', error);
          toast.error('Failed to update settings');
        }
      }, 500); // 500ms debounce

      setUpdateTimeout(timeout);
    },
    [user, settings, updateTimeout]
  );

  const addAllergen = async () => {
    if (!user || !newAllergen.name.trim()) return;

    try {
      const allergen = await SettingsService.addUserAllergen(user.id, {
        allergen_name: newAllergen.name.trim(),
        severity: newAllergen.severity,
      });

      if (allergen) {
        setAllergens((prev) => [...prev, allergen]);
        setNewAllergen({ name: '', severity: 'moderate' });
        setShowAllergenModal(false);
        toast.success('Allergen added');
      }
    } catch (error) {
      console.error('Error adding allergen:', error);
      toast.error('Failed to add allergen');
    }
  };

  const removeAllergen = async (allergenId: string) => {
    if (!user) return;

    try {
      const success = await SettingsService.removeUserAllergen(user.id, allergenId);
      if (success) {
        setAllergens((prev) => prev.filter((a) => a.id !== allergenId));
        toast.success('Allergen removed');
      }
    } catch (error) {
      console.error('Error removing allergen:', error);
      toast.error('Failed to remove allergen');
    }
  };

  const addAppliance = async () => {
    if (!user || !newAppliance.name.trim()) return;

    try {
      const appliance = await SettingsService.addUserAppliance(user.id, {
        appliance_name: newAppliance.name.trim(),
        appliance_type: newAppliance.type,
      });

      if (appliance) {
        setAppliances((prev) => [...prev, appliance]);
        setNewAppliance({ name: '', type: 'cooking' });
        setShowApplianceModal(false);
        toast.success('Appliance added');
      }
    } catch (error) {
      console.error('Error adding appliance:', error);
      toast.error('Failed to add appliance');
    }
  };

  const removeAppliance = async (applianceId: string) => {
    if (!user) return;

    try {
      const success = await SettingsService.removeUserAppliance(user.id, applianceId);
      if (success) {
        setAppliances((prev) => prev.filter((a) => a.id !== applianceId));
        toast.success('Appliance removed');
      }
    } catch (error) {
      console.error('Error removing appliance:', error);
      toast.error('Failed to remove appliance');
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'mild':
        return 'text-green-600 bg-green-100';
      case 'moderate':
        return 'text-yellow-600 bg-yellow-100';
      case 'severe':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getApplianceTypeColor = (type: string) => {
    switch (type) {
      case 'cooking':
        return 'text-blue-600 bg-blue-100';
      case 'preparation':
        return 'text-purple-600 bg-purple-100';
      case 'beverage':
        return 'text-orange-600 bg-orange-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  return (
    <div className="min-h-screen bg-off-white p-4">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <header className="mb-6">
          <h1 className="text-3xl font-lora text-rich-charcoal mb-2">Profile</h1>
          <p className="text-soft-taupe">Manage your preferences and settings</p>
        </header>

        {/* User Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl p-6 mb-6 shadow-sm"
        >
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-coral-blush rounded-full flex items-center justify-center">
              <span className="text-2xl text-white font-bold">
                {user?.email?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <h2 className="text-xl font-medium text-rich-charcoal">{user?.email}</h2>
              <p className="text-soft-taupe">Level {userStats.level} Chef</p>
            </div>
          </div>
        </motion.div>

        {/* Settings Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-xl p-6 mb-6 shadow-sm"
        >
          <div className="flex items-center gap-2 mb-4">
            <Settings className="w-5 h-5 text-coral-blush" />
            <h3 className="text-lg font-medium text-rich-charcoal">Settings</h3>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Bell className="w-5 h-5 text-soft-taupe" />
                <div>
                  <p className="font-medium text-rich-charcoal">Push Notifications</p>
                  <p className="text-sm text-soft-taupe">Get meal reminders</p>
                </div>
              </div>
              <button
                onClick={() =>
                  updateSetting('notifications_enabled', !settings?.notifications_enabled)
                }
                className={`w-12 h-6 rounded-full transition-colors ${
                  settings?.notifications_enabled ? 'bg-coral-blush' : 'bg-gray-300'
                }`}
              >
                <div
                  className={`w-4 h-4 bg-white rounded-full transition-transform ${
                    settings?.notifications_enabled ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {settings?.dark_mode ? (
                  <Moon className="w-5 h-5 text-soft-taupe" />
                ) : (
                  <Sun className="w-5 h-5 text-soft-taupe" />
                )}
                <div>
                  <p className="font-medium text-rich-charcoal">Dark Mode</p>
                  <p className="text-sm text-soft-taupe">Switch theme</p>
                </div>
              </div>
              <button
                onClick={() => updateSetting('dark_mode', !settings?.dark_mode)}
                className={`w-12 h-6 rounded-full transition-colors ${
                  settings?.dark_mode ? 'bg-coral-blush' : 'bg-gray-300'
                }`}
              >
                <div
                  className={`w-4 h-4 bg-white rounded-full transition-transform ${
                    settings?.dark_mode ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-soft-taupe" />
                <div>
                  <p className="font-medium text-rich-charcoal">Time Budget</p>
                  <p className="text-sm text-soft-taupe">
                    {settings?.time_budget || 30} minutes per meal
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="15"
                  max="60"
                  step="5"
                  value={settings?.time_budget || 30}
                  onChange={(e) => updateSetting('time_budget', Number(e.target.value))}
                  className="slider"
                />
                <span className="text-sm font-medium text-rich-charcoal min-w-[3rem] text-right">
                  {settings?.time_budget || 30}m
                </span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Allergens Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-xl p-6 mb-6 shadow-sm"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-500" />
              <h3 className="text-lg font-medium text-rich-charcoal">Allergens</h3>
            </div>
            <button
              onClick={() => setShowAllergenModal(true)}
              className="p-2 bg-coral-blush text-white rounded-lg hover:bg-opacity-90 transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {allergens.length === 0 ? (
            <p className="text-soft-taupe text-center py-4">No allergens added yet</p>
          ) : (
            <div className="space-y-2">
              {allergens.map((allergen) => (
                <div
                  key={allergen.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${getSeverityColor(allergen.severity)}`}
                    >
                      {allergen.severity}
                    </span>
                    <span className="font-medium text-rich-charcoal">{allergen.allergen_name}</span>
                  </div>
                  <button
                    onClick={() => removeAllergen(allergen.id)}
                    className="text-red-500 hover:text-red-700 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Appliances Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-xl p-6 mb-6 shadow-sm"
        >
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Utensils className="w-5 h-5 text-sage-leaf" />
              <h3 className="text-lg font-medium text-rich-charcoal">Cooking Appliances</h3>
            </div>
            <button
              onClick={() => setShowApplianceModal(true)}
              className="p-2 bg-sage-leaf text-white rounded-lg hover:bg-opacity-90 transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {appliances.length === 0 ? (
            <p className="text-soft-taupe text-center py-4">No appliances added yet</p>
          ) : (
            <div className="space-y-2">
              {appliances.map((appliance) => (
                <div
                  key={appliance.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${getApplianceTypeColor(appliance.appliance_type)}`}
                    >
                      {appliance.appliance_type}
                    </span>
                    <span className="font-medium text-rich-charcoal">
                      {appliance.appliance_name}
                    </span>
                  </div>
                  <button
                    onClick={() => removeAppliance(appliance.id)}
                    className="text-red-500 hover:text-red-700 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </motion.div>

        {/* Stats Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white rounded-xl p-6 mb-6 shadow-sm"
        >
          <div className="flex items-center gap-2 mb-4">
            <Trophy className="w-5 h-5 text-yellow-500" />
            <h3 className="text-lg font-medium text-rich-charcoal">Your Stats</h3>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-3 bg-gradient-to-br from-coral-blush to-orange-400 rounded-lg text-white">
              <p className="text-2xl font-bold">{userStats.totalMeals}</p>
              <p className="text-sm opacity-90">Meals Planned</p>
            </div>
            <div className="text-center p-3 bg-gradient-to-br from-sage-leaf to-green-400 rounded-lg text-white">
              <p className="text-2xl font-bold">{userStats.currentStreak}</p>
              <p className="text-sm opacity-90">Day Streak</p>
            </div>
            <div className="text-center p-3 bg-gradient-to-br from-purple-400 to-pink-400 rounded-lg text-white">
              <p className="text-2xl font-bold">{userStats.totalXP}</p>
              <p className="text-sm opacity-90">Total XP</p>
            </div>
            <div className="text-center p-3 bg-gradient-to-br from-blue-400 to-cyan-400 rounded-lg text-white">
              <p className="text-2xl font-bold">{userStats.timeSaved}h</p>
              <p className="text-sm opacity-90">Time Saved</p>
            </div>
          </div>
        </motion.div>

        {/* Sign Out */}
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          onClick={handleSignOut}
          className="w-full bg-red-500 text-white py-3 rounded-xl font-medium hover:bg-red-600 transition-colors flex items-center justify-center gap-2"
        >
          <LogOut className="w-5 h-5" />
          Sign Out
        </motion.button>
      </div>

      {/* Add Allergen Modal */}
      {showAllergenModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-xl font-lora text-rich-charcoal mb-4">Add Allergen</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-rich-charcoal mb-2">
                  Allergen Name
                </label>
                <input
                  type="text"
                  value={newAllergen.name}
                  onChange={(e) => setNewAllergen((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Peanuts, Gluten"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:border-coral-blush focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-rich-charcoal mb-2">
                  Severity
                </label>
                <select
                  value={newAllergen.severity}
                  onChange={(e) =>
                    setNewAllergen((prev) => ({ ...prev, severity: e.target.value as any }))
                  }
                  className="w-full p-3 border border-gray-300 rounded-lg focus:border-coral-blush focus:outline-none"
                >
                  <option value="mild">Mild</option>
                  <option value="moderate">Moderate</option>
                  <option value="severe">Severe</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowAllergenModal(false)}
                className="flex-1 py-2 px-4 border border-gray-300 rounded-lg text-rich-charcoal hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={addAllergen}
                className="flex-1 py-2 px-4 bg-coral-blush text-white rounded-lg hover:bg-opacity-90 transition-colors"
              >
                Add Allergen
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Appliance Modal */}
      {showApplianceModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-xl font-lora text-rich-charcoal mb-4">Add Appliance</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-rich-charcoal mb-2">
                  Appliance Name
                </label>
                <input
                  type="text"
                  value={newAppliance.name}
                  onChange={(e) => setNewAppliance((prev) => ({ ...prev, name: e.target.value }))}
                  placeholder="e.g., Microwave, Blender"
                  className="w-full p-3 border border-gray-300 rounded-lg focus:border-coral-blush focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-rich-charcoal mb-2">Type</label>
                <select
                  value={newAppliance.type}
                  onChange={(e) => setNewAppliance((prev) => ({ ...prev, type: e.target.value }))}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:border-coral-blush focus:outline-none"
                >
                  <option value="cooking">Cooking</option>
                  <option value="preparation">Preparation</option>
                  <option value="beverage">Beverage</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowApplianceModal(false)}
                className="flex-1 py-2 px-4 border border-gray-300 rounded-lg text-rich-charcoal hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={addAppliance}
                className="flex-1 py-2 px-4 bg-sage-leaf text-white rounded-lg hover:bg-opacity-90 transition-colors"
              >
                Add Appliance
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
