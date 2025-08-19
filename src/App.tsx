import { useEffect } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import DebugToggle from './components/DebugToggle';
import LoadingSpinner from './components/LoadingSpinner';
import Navigation from './components/Navigation';
import AuthCallback from './screens/AuthCallback';
import GroceryList from './screens/GroceryList';
import Home from './screens/Home';
import MealPlanner from './screens/MealPlanner';
import MyRecipes from './screens/MyRecipes';
import Onboarding from './screens/Onboarding';
import Pantry from './screens/Pantry';
import Profile from './screens/Profile';
import RecipeHub from './screens/RecipeHub';
import { useAuthStore } from './state/authStore';

function App() {
  const { user, authReady, initAuth, unsubscribeAuth } = useAuthStore();

  // Initialize auth on mount with boot failsafe
  useEffect(() => {
    initAuth();

    // Boot failsafe timeout - force authReady after 8 seconds
    const bootTimeout = setTimeout(() => {
      if (!authReady) {
        if (import.meta.env.DEV) {
          // eslint-disable-next-line no-console
          console.warn('[boot] Forcing authReady after timeout - auth may be stuck');
        }
        useAuthStore.setState({ authReady: true });
      }
    }, 8000);

    return () => {
      clearTimeout(bootTimeout);
      unsubscribeAuth(); // Clean up auth subscription
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // CRITICAL: Only show spinner when auth is not ready
  if (!authReady) {
    return (
      <div className="min-h-screen bg-off-white flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  // Once auth is ready, show appropriate content
  if (!user) {
    return <Onboarding />;
  }

  return (
    <div className="min-h-screen bg-off-white pb-20">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/pantry" element={<Pantry />} />
        <Route path="/meal-planner" element={<MealPlanner />} />
        <Route path="/my-recipes" element={<MyRecipes />} />
        <Route path="/grocery-list" element={<GroceryList />} />
        <Route path="/recipes" element={<RecipeHub />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        {/* Catch-all route for 404s - redirect to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Navigation />
      <DebugToggle />
    </div>
  );
}

export default App;
