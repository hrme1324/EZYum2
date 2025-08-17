import { ChevronLeft, ChevronRight, MapPin, X } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { supabase } from '../api/supabase';
import { useAuthStore } from '../state/authStore';

interface TourStep {
  id: string;
  title: string;
  description: string;
  target: string; // CSS selector for the element to highlight
  position: 'top' | 'bottom' | 'left' | 'right';
}

const tourSteps: TourStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to Ezyum! 🎉',
    description: 'Let\'s take a quick tour to get you started with your cooking journey.',
    target: 'body',
    position: 'top'
  },
  {
    id: 'recipe-hub',
    title: 'Recipe Hub',
    description: 'Discover new recipes here! Browse by category, search, or get personalized suggestions.',
    target: '[data-tour="recipe-hub"]',
    position: 'bottom'
  },
  {
    id: 'meal-planner',
    title: 'Meal Planner',
    description: 'Plan your week ahead! Schedule recipes for breakfast, lunch, and dinner.',
    target: '[data-tour="meal-planner"]',
    position: 'top'
  },
  {
    id: 'my-recipes',
    title: 'My Recipes',
    description: 'Save your favorite recipes and create your own personal collection.',
    target: '[data-tour="my-recipes"]',
    position: 'bottom'
  },
  {
    id: 'pantry',
    title: 'Pantry',
    description: 'Track your ingredients and never run out of essentials.',
    target: '[data-tour="pantry"]',
    position: 'top'
  },
  {
    id: 'profile',
    title: 'Profile & Settings',
    description: 'Customize your experience, view stats, and manage your account.',
    target: '[data-tour="profile"]',
    position: 'bottom'
  }
];

interface GuidedTourProps {
  isOpen: boolean;
  onClose: () => void;
}

const GuidedTour: React.FC<GuidedTourProps> = ({ isOpen, onClose }) => {
  const { user } = useAuthStore();
  const [currentStep, setCurrentStep] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Scroll to the target element for the current step
      const targetElement = document.querySelector(tourSteps[currentStep].target);
      if (targetElement && targetElement !== document.body) {
        targetElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [isOpen, currentStep]);

  const handleNext = () => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      // Mark user as onboarded
      await supabase
        .from('user_settings')
        .upsert(
          {
            user_id: user.id,
            onboarded_at: new Date().toISOString()
          },
          { onConflict: 'user_id' }
        );

      onClose();
    } catch (error) {
      console.error('Error marking user as onboarded:', error);
      onClose();
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkip = () => {
    onClose();
  };

  if (!isOpen) return null;

  const currentTourStep = tourSteps[currentStep];
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === tourSteps.length - 1;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-md w-full shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <MapPin className="w-5 h-5 text-blue-500" />
            <span className="font-semibold text-gray-800">Getting Started</span>
          </div>
          <button
            onClick={handleSkip}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <h3 className="text-xl font-bold text-gray-800 mb-2">
            {currentTourStep.title}
          </h3>
          <p className="text-gray-600 mb-6">
            {currentTourStep.description}
          </p>

          {/* Progress */}
          <div className="mb-6">
            <div className="flex justify-between text-sm text-gray-500 mb-2">
              <span>Step {currentStep + 1} of {tourSteps.length}</span>
              <span>{Math.round(((currentStep + 1) / tourSteps.length) * 100)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${((currentStep + 1) / tourSteps.length) * 100}%` }}
              />
            </div>
          </div>

          {/* Navigation */}
          <div className="flex gap-3">
            {!isFirstStep && (
              <button
                onClick={handlePrevious}
                className="flex-1 flex items-center justify-center gap-2 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-4 rounded-lg transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </button>
            )}

            <button
              onClick={isLastStep ? handleComplete : handleNext}
              disabled={isLoading}
              className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg transition-colors ${
                isLastStep
                  ? 'bg-green-500 hover:bg-green-600 text-white'
                  : 'bg-blue-500 hover:bg-blue-600 text-white'
              } disabled:opacity-50`}
            >
              {isLoading ? (
                'Saving...'
              ) : isLastStep ? (
                'Get Started!'
              ) : (
                <>
                  Next
                  <ChevronRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GuidedTour;
