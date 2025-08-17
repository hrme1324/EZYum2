import { CheckCircle, Loader2 } from 'lucide-react';
import React, { useState } from 'react';
import toast from 'react-hot-toast';
import { StatsService } from '../api/statsService';
import { useAuthStore } from '../state/authStore';

interface MarkCompletedButtonProps {
  recipeId: string;
  recipeName: string;
  source?: string;
  onCompleted?: () => void;
  className?: string;
  children?: React.ReactNode;
}

const MarkCompletedButton: React.FC<MarkCompletedButtonProps> = ({
  recipeId,
  recipeName,
  source = 'manual',
  onCompleted,
  className = '',
  children
}) => {
  const { user } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);

  const handleMarkCompleted = async () => {
    if (!user) {
      toast.error('Please log in to mark recipes as completed');
      return;
    }

    setIsLoading(true);
    try {
      const result = await StatsService.markRecipeCompleted(
        user.id,
        recipeId,
        source
      );

      if (result.success) {
        setIsCompleted(true);
        toast.success(`Great job! "${recipeName}" marked as completed!`);
        onCompleted?.();

        // Reset completion state after a delay
        setTimeout(() => setIsCompleted(false), 3000);
      } else {
        toast.error(result.error || 'Failed to mark recipe as completed');
      }
    } catch (error) {
      console.error('Error marking recipe completed:', error);
      toast.error('Failed to mark recipe as completed');
    } finally {
      setIsLoading(false);
    }
  };

  if (isCompleted) {
    return (
      <button
        disabled
        className={`flex items-center gap-2 bg-green-500 text-white px-4 py-2 rounded-lg cursor-default ${className}`}
      >
        <CheckCircle className="w-4 h-4" />
        Completed!
      </button>
    );
  }

  return (
    <button
      onClick={handleMarkCompleted}
      disabled={isLoading}
      className={`flex items-center gap-2 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <CheckCircle className="w-4 h-4" />
      )}
      {isLoading ? 'Marking...' : (children || 'Mark Completed')}
    </button>
  );
};

export default MarkCompletedButton;
