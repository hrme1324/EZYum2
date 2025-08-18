import { Calendar, Clock, X } from 'lucide-react';
import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { PlannerService } from '../api/plannerService';
import { useAuthStore } from '../state/authStore';

interface AddToPlannerDialogProps {
  isOpen: boolean;
  onClose: () => void;
  recipeId: string;
  recipeName: string;
  onSuccess?: () => void;
}

const mealSlots = [
  { value: 'breakfast', label: 'Breakfast' },
  { value: 'lunch', label: 'Lunch' },
  { value: 'dinner', label: 'Dinner' },
  { value: 'snack', label: 'Snack' }
];

const AddToPlannerDialog: React.FC<AddToPlannerDialogProps> = ({
  isOpen,
  onClose,
  recipeId,
  recipeName,
  onSuccess
}) => {
  const { user } = useAuthStore();
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  });
  const [selectedSlot, setSelectedSlot] = useState('dinner');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast.error('Please log in to add recipes to your planner');
      return;
    }

    setIsLoading(true);
    try {
      const result = await PlannerService.addToPlanner(
        user.id,
        selectedDate,
        selectedSlot,
        {
          recipeId,
          source: 'manual'
        }
      );

      if (result) {
        toast.success(`"${recipeName}" added to your ${selectedSlot} plan for ${new Date(selectedDate).toLocaleDateString()}`);
        onSuccess?.();
        onClose();
      } else {
        toast.error('Failed to add recipe to planner');
      }
    } catch (error) {
      console.error('Error adding recipe to planner:', error);
      toast.error('Failed to add recipe to planner');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl max-w-md w-full shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="text-lg font-semibold text-gray-800">Add to Meal Planner</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Recipe Info */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="font-medium text-gray-800 mb-2">Recipe</h4>
            <p className="text-gray-600">{recipeName}</p>
          </div>

          {/* Date Selection */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              <Calendar className="w-4 h-4 inline mr-2" />
              Date
            </label>
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          {/* Meal Slot Selection */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              <Clock className="w-4 h-4 inline mr-2" />
              Meal
            </label>
            <div className="grid grid-cols-2 gap-2">
              {mealSlots.map((slot) => (
                <button
                  key={slot.value}
                  type="button"
                  onClick={() => setSelectedSlot(slot.value)}
                  className={`p-3 rounded-lg border transition-colors ${
                    selectedSlot === slot.value
                      ? 'border-blue-500 bg-blue-50 text-blue-700'
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                >
                  {slot.label}
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 py-2 px-4 bg-blue-500 hover:bg-blue-600 text-white rounded-lg transition-colors disabled:opacity-50"
            >
              {isLoading ? 'Adding...' : 'Add to Planner'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddToPlannerDialog;
