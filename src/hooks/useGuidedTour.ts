import { useEffect, useState } from 'react';
import { UserSettingsService } from '../api/userSettingsService';
import { useAuthStore } from '../state/authStore';

export const useGuidedTour = () => {
  const { user } = useAuthStore();
  const [showTour, setShowTour] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      checkOnboardingStatus();
    } else {
      setIsLoading(false);
    }
  }, [user]);

  const checkOnboardingStatus = async () => {
    if (!user) return;

    try {
      const isOnboarded = await UserSettingsService.isOnboarded(user.id);
      setShowTour(!isOnboarded);
    } catch (error) {
      console.error('Error checking onboarding status:', error);
      // Default to showing tour if we can't determine status
      setShowTour(true);
    } finally {
      setIsLoading(false);
    }
  };

  const startTour = () => {
    setShowTour(true);
  };

  const closeTour = () => {
    setShowTour(false);
  };

  const restartTour = async () => {
    if (!user) return;

    try {
      // Reset onboarding status to show tour again
      await UserSettingsService.upsertUserSettings(user.id, {
        onboarded_at: undefined
      });
      setShowTour(true);
    } catch (error) {
      console.error('Error restarting tour:', error);
    }
  };

  return {
    showTour,
    isLoading,
    startTour,
    closeTour,
    restartTour
  };
};
