import { Routes, Route } from 'react-router-dom'
import { useAuthStore } from './state/authStore'
import Onboarding from './screens/Onboarding'
import Home from './screens/Home'
import Pantry from './screens/Pantry'
import MealPlanner from './screens/MealPlanner'
import GroceryList from './screens/GroceryList'
import Profile from './screens/Profile'
import LoadingSpinner from './components/LoadingSpinner'

function App() {
  const { user, isLoading } = useAuthStore()

  if (isLoading) {
    return (
      <div className="min-h-screen bg-off-white flex items-center justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  if (!user) {
    return <Onboarding />
  }

  return (
    <div className="min-h-screen bg-off-white">
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/pantry" element={<Pantry />} />
        <Route path="/meal-planner" element={<MealPlanner />} />
        <Route path="/grocery-list" element={<GroceryList />} />
        <Route path="/profile" element={<Profile />} />
      </Routes>
    </div>
  )
}

export default App 