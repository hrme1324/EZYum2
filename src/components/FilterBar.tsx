import { Search, X } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';

export interface FilterOptions {
  search: string;
  quick: boolean;
  video: boolean;
  yourRecipes: boolean;
  plus: boolean;
  maxIngredients: number;
  maxSteps: number;
}

interface FilterBarProps {
  onFiltersChange: (filters: FilterOptions) => void;
  defaultFilters?: Partial<FilterOptions>;
}

export default function FilterBar({ onFiltersChange, defaultFilters }: FilterBarProps) {
  const [filters, setFilters] = useState<FilterOptions>({
    search: '',
    quick: false,
    video: false,
    yourRecipes: false,
    plus: false,
    maxIngredients: defaultFilters?.maxIngredients || 10,
    maxSteps: defaultFilters?.maxSteps || 6,
  });

  // Load saved filters from localStorage
  useEffect(() => {
    const savedFilters = localStorage.getItem('recipeFilters');
    if (savedFilters) {
      try {
        const parsed = JSON.parse(savedFilters);
        setFilters((prev) => ({
          ...prev,
          ...parsed,
          maxIngredients: parsed.maxIngredients || defaultFilters?.maxIngredients || 10,
          maxSteps: parsed.maxSteps || defaultFilters?.maxSteps || 6,
        }));
      } catch (error) {
        // Ignore invalid localStorage data
      }
    }
  }, [defaultFilters]);

  // Save filters to localStorage
  useEffect(() => {
    localStorage.setItem('recipeFilters', JSON.stringify(filters));
  }, [filters]);

  // Debounced search
  const debouncedSearch = useCallback((searchTerm: string) => {
    const timeoutId = setTimeout(() => {
      setFilters((prev) => ({ ...prev, search: searchTerm }));
    }, 300);

    return () => clearTimeout(timeoutId);
  }, []);

  const handleFilterToggle = (
    filter: keyof Omit<FilterOptions, 'search' | 'maxIngredients' | 'maxSteps'>,
  ) => {
    setFilters((prev) => ({ ...prev, [filter]: !prev[filter] }));
  };

  const handleSliderChange = (field: 'maxIngredients' | 'maxSteps', value: number) => {
    setFilters((prev) => ({ ...prev, [field]: value }));
  };

  const clearAllFilters = () => {
    setFilters({
      search: '',
      quick: false,
      video: false,
      yourRecipes: false,
      plus: false,
      maxIngredients: defaultFilters?.maxIngredients || 10,
      maxSteps: defaultFilters?.maxSteps || 6,
    });
  };

  // Notify parent of filter changes
  useEffect(() => {
    onFiltersChange(filters);
  }, [filters, onFiltersChange]);

  const hasActiveFilters =
    filters.quick || filters.video || filters.yourRecipes || filters.plus || filters.search;

  return (
    <div className="bg-white rounded-xl p-4 mb-6 border border-gray-100">
      {/* Search Bar */}
      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search recipes..."
            value={filters.search}
            onChange={(e) => {
              setFilters((prev) => ({ ...prev, search: e.target.value }));
              debouncedSearch(e.target.value);
            }}
            className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-coral-blush focus:border-transparent"
          />
          {filters.search && (
            <button
              onClick={() => setFilters((prev) => ({ ...prev, search: '' }))}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Filter Chips */}
      <div className="flex flex-wrap gap-2 mb-4">
        <button
          onClick={() => handleFilterToggle('quick')}
          className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
            filters.quick
              ? 'bg-coral-blush text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Quick
        </button>
        <button
          onClick={() => handleFilterToggle('video')}
          className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
            filters.video
              ? 'bg-coral-blush text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Video
        </button>
        <button
          onClick={() => handleFilterToggle('yourRecipes')}
          className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
            filters.yourRecipes
              ? 'bg-coral-blush text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Your Recipes
        </button>
        <button
          onClick={() => handleFilterToggle('plus')}
          className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
            filters.plus
              ? 'bg-coral-blush text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
          }`}
        >
          Plus
        </button>
      </div>

      {/* Sliders */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Max Ingredients: {filters.maxIngredients}
          </label>
          <input
            type="range"
            min="1"
            max="20"
            value={filters.maxIngredients}
            onChange={(e) => handleSliderChange('maxIngredients', parseInt(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Max Steps: {filters.maxSteps}
          </label>
          <input
            type="range"
            min="1"
            max="15"
            value={filters.maxSteps}
            onChange={(e) => handleSliderChange('maxSteps', parseInt(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
          />
        </div>
      </div>

      {/* Clear Filters */}
      {hasActiveFilters && (
        <button
          onClick={clearAllFilters}
          className="mt-4 w-full py-2 text-sm text-gray-600 hover:text-gray-800 transition-colors"
        >
          Clear All Filters
        </button>
      )}
    </div>
  );
}
