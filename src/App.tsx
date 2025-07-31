import { Route, Routes } from 'react-router-dom';
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
  const { user, isLoading } = useAuthStore();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-off-white flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

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
      </Routes>
      <Navigation />
    </div>
  );
}

export default App;
