import { Clock, Save } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { UserSettingsService } from '../api/userSettingsService';
import { useAuthStore } from '../state/authStore';

const timeBudgetOptions = [
  { value: 10, label: '10 minutes' },
  { value: 20, label: '20 minutes' },
  { value: 30, label: '30 minutes' },
  { value: 45, label: '45 minutes' },
  { value: 60, label: '1 hour' },
  { value: 90, label: '1.5 hours' },
  { value: 120, label: '2+ hours' }
];

const TimeBudgetSettings: React.FC = () => {
  const { user } = useAuthStore();
  const [selectedBudget, setSelectedBudget] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (user) {
      loadCurrentBudget();
    }
  }, [user]);

  const loadCurrentBudget = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const budget = await UserSettingsService.getTimeBudget(user.id);
      setSelectedBudget(budget);
    } catch (error) {
      console.error('Error loading time budget:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user || selectedBudget === null) return;

    setIsSaving(true);
    try {
      const success = await UserSettingsService.setTimeBudget(user.id, selectedBudget);

      if (success) {
        toast.success('Time budget updated successfully!');
      } else {
        toast.error('Failed to update time budget');
      }
    } catch (error) {
      console.error('Error saving time budget:', error);
      toast.error('Failed to update time budget');
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
        <div className="space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-10 bg-gray-200 rounded"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Clock className="w-5 h-5 text-blue-500" />
        <h3 className="text-lg font-semibold text-gray-800">Time Budget</h3>
      </div>

      <p className="text-gray-600 text-sm">
        Set your preferred cooking time to see recipes that fit your schedule.
        Recipes with unknown cooking times will still be shown to maintain variety.
      </p>

      <div className="space-y-3">
        {timeBudgetOptions.map((option) => (
          <label
            key={option.value}
            className={`flex items-center p-3 rounded-lg border cursor-pointer transition-colors ${
              selectedBudget === option.value
                ? 'border-blue-500 bg-blue-50 text-blue-700'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            <input
              type="radio"
              name="timeBudget"
              value={option.value}
              checked={selectedBudget === option.value}
              onChange={(e) => setSelectedBudget(Number(e.target.value))}
              className="sr-only"
            />
            <div className="flex-1">
              <div className="font-medium">{option.label}</div>
              {option.value <= 30 && (
                <div className="text-xs text-gray-500">Quick & Easy</div>
              )}
              {option.value > 30 && option.value <= 60 && (
                <div className="text-xs text-gray-500">Moderate</div>
              )}
              {option.value > 60 && (
                <div className="text-xs text-gray-500">Take Your Time</div>
              )}
            </div>
            {selectedBudget === option.value && (
              <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                <div className="w-2 h-2 bg-white rounded-full"></div>
              </div>
            )}
          </label>
        ))}
      </div>

      <button
        onClick={handleSave}
        disabled={isSaving || selectedBudget === null}
        className="w-full flex items-center justify-center gap-2 bg-blue-500 hover:bg-blue-600 text-white py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isSaving ? (
          <>
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
            Saving...
          </>
        ) : (
          <>
            <Save className="w-4 h-4" />
            Save Time Budget
          </>
        )}
      </button>

      {selectedBudget && (
        <div className="text-center text-sm text-gray-500">
          You'll see recipes that take {selectedBudget} minutes or less to prepare.
        </div>
      )}
    </div>
  );
};

export default TimeBudgetSettings;
