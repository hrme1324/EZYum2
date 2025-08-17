import { Flame, Star, Target, Trophy } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import type { UserAward, UserStats } from '../api/statsService';
import { StatsService } from '../api/statsService';
import { useAuthStore } from '../state/authStore';

interface UserStatsProps {
  className?: string;
  onStatsUpdate?: () => void;
}

const UserStats: React.FC<UserStatsProps> = ({ className = '' }) => {
  const { user } = useAuthStore();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [awards, setAwards] = useState<UserAward[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadStats();
    }
  }, [user]);

  const loadStats = async () => {
    if (!user) return;

    setIsLoading(true);
    try {
      const [statsData, awardsData] = await Promise.all([
        StatsService.getUserStats(user.id),
        StatsService.getUserAwards(user.id)
      ]);

      setStats(statsData);
      setAwards(awardsData);
    } catch (error) {
      console.error('Error loading stats:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const getAwardIcon = (awardKey: string) => {
    switch (awardKey) {
      case 'first_meal':
        return <Star className="w-5 h-5 text-yellow-500" />;
      case 'five_meals':
        return <Target className="w-5 h-5 text-blue-500" />;
      case 'ten_meals':
        return <Trophy className="w-5 h-5 text-purple-500" />;
      case 'streak_3':
        return <Flame className="w-5 h-5 text-orange-500" />;
      case 'streak_7':
        return <Trophy className="w-5 h-5 text-red-500" />;
      default:
        return <Star className="w-5 h-5 text-gray-500" />;
    }
  };

  const getAwardLabel = (awardKey: string) => {
    switch (awardKey) {
      case 'first_meal':
        return 'First Meal';
      case 'five_meals':
        return '5 Meals';
      case 'ten_meals':
        return '10 Meals';
      case 'streak_3':
        return '3-Day Streak';
      case 'streak_7':
        return '7-Day Streak';
      default:
        return awardKey;
    }
  };

  if (isLoading) {
    return (
      <div className={`animate-pulse ${className}`}>
        <div className="bg-gray-200 rounded-lg p-4 space-y-3">
          <div className="h-4 bg-gray-300 rounded w-1/3"></div>
          <div className="h-6 bg-gray-300 rounded w-1/2"></div>
          <div className="h-4 bg-gray-300 rounded w-2/3"></div>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className={`text-center text-gray-500 p-4 ${className}`}>
        <p>No stats available yet. Start cooking to earn points and streaks!</p>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Stats Overview */}
      <div className="grid grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-blue-600">{stats.points}</div>
          <div className="text-sm text-blue-700">Points</div>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-orange-600">{stats.current_streak}</div>
          <div className="text-sm text-orange-700">Current Streak</div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-purple-600">{stats.longest_streak}</div>
          <div className="text-sm text-purple-700">Best Streak</div>
        </div>
      </div>

      {/* Last Cooked */}
      {stats.last_cooked_on && (
        <div className="bg-gray-50 rounded-lg p-3">
          <div className="text-sm text-gray-600">Last cooked:</div>
          <div className="font-medium text-gray-800">
            {new Date(stats.last_cooked_on).toLocaleDateString()}
          </div>
        </div>
      )}

      {/* Awards */}
      {awards.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-500" />
            Awards Earned
          </h3>
          <div className="grid grid-cols-2 gap-3">
            {awards.map((award) => (
              <div
                key={award.id}
                className="bg-white border border-gray-200 rounded-lg p-3 flex items-center gap-3"
              >
                {getAwardIcon(award.award_key)}
                <div>
                  <div className="font-medium text-gray-800">
                    {getAwardLabel(award.award_key)}
                  </div>
                  <div className="text-xs text-gray-500">
                    {new Date(award.earned_at).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Refresh Button */}
      <button
        onClick={loadStats}
        className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-4 rounded-lg transition-colors text-sm"
      >
        Refresh Stats
      </button>
    </div>
  );
};

export default UserStats;
