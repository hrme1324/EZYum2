import { Routes, Route } from 'react-router-dom';
import { useAuthStore } from './state/authStore';
import Onboarding from './screens/Onboarding';
import Home from './screens/Home';
import Pantry from './screens/Pantry';
import MealPlanner from './screens/MealPlanner';
import GroceryList from './screens/GroceryList';
import Profile from './screens/Profile';
import AuthCallback from './screens/AuthCallback';
import LoadingSpinner from './components/LoadingSpinner';
import Navigation from './components/Navigation';

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
        <Route path="/grocery-list" element={<GroceryList />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
      </Routes>
      <Navigation />
    </div>
  );
}

export default App;
