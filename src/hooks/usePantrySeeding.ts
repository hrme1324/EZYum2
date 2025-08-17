import { useEffect, useState } from 'react';
import { supabase } from '../api/supabase';
import { UserSettingsService } from '../api/userSettingsService';
import { useAuthStore } from '../state/authStore';

// Sample pantry items for new users
const defaultPantryItems = [
  { name: 'Olive Oil', category: 'Oils & Fats', quantity: 1, unit: 'bottle' },
  { name: 'Salt', category: 'Seasonings', quantity: 1, unit: 'container' },
  { name: 'Black Pepper', category: 'Seasonings', quantity: 1, unit: 'container' },
  { name: 'Garlic', category: 'Vegetables', quantity: 1, unit: 'head' },
  { name: 'Onion', category: 'Vegetables', quantity: 2, unit: 'pieces' },
  { name: 'Eggs', category: 'Dairy & Eggs', quantity: 6, unit: 'pieces' },
  { name: 'Butter', category: 'Dairy & Eggs', quantity: 1, unit: 'stick' },
  { name: 'Flour', category: 'Baking', quantity: 1, unit: 'bag' },
  { name: 'Sugar', category: 'Baking', quantity: 1, unit: 'bag' },
  { name: 'Rice', category: 'Grains', quantity: 1, unit: 'bag' }
];

export const usePantrySeeding = () => {
  const { user } = useAuthStore();
  const [isSeeded, setIsSeeded] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSeeding, setIsSeeding] = useState(false);

  useEffect(() => {
    if (user) {
      checkPantrySeedingStatus();
    } else {
      setIsLoading(false);
    }
  }, [user]);

  const checkPantrySeedingStatus = async () => {
    if (!user) return;

    try {
      const seeded = await UserSettingsService.isPantrySeeded(user.id);
      setIsSeeded(seeded);
    } catch (error) {
      console.error('Error checking pantry seeding status:', error);
      setIsSeeded(false);
    } finally {
      setIsLoading(false);
    }
  };

  const seedPantry = async () => {
    if (!user || isSeeded) return;

    setIsSeeding(true);
    try {
      // Insert default pantry items
      const { error } = await supabase
        .from('pantry_items')
        .insert(
          defaultPantryItems.map(item => ({
            user_id: user.id,
            name: item.name,
            category: item.category,
            quantity: item.quantity,
            unit: item.unit,
            source: 'onboarding'
          }))
        );

      if (error) {
        throw error;
      }

      // Mark pantry as seeded
      await UserSettingsService.markPantrySeeded(user.id);
      setIsSeeded(true);

      return { success: true };
    } catch (error) {
      console.error('Error seeding pantry:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to seed pantry'
      };
    } finally {
      setIsSeeding(false);
    }
  };

  return {
    isSeeded,
    isLoading,
    isSeeding,
    seedPantry
  };
};
