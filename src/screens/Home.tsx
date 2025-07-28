import React from 'react'
import { Link } from 'react-router-dom'
import { Camera, Calendar } from 'lucide-react'

const Home: React.FC = () => {
  return (
    <div className="min-h-screen bg-off-white p-4">
      <div className="max-w-md mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-lora text-rich-charcoal">Welcome back!</h1>
          <p className="text-soft-taupe">Ready to plan your meals?</p>
        </header>

        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="grid grid-cols-2 gap-4">
            <Link to="/pantry" className="card text-center hover:shadow-md transition-shadow">
              <Camera className="w-8 h-8 mx-auto mb-2 text-coral-blush" />
              <h3 className="font-medium">Add to Pantry</h3>
              <p className="text-sm text-soft-taupe">Scan or snap a photo</p>
            </Link>
            
            <Link to="/meal-planner" className="card text-center hover:shadow-md transition-shadow">
              <Calendar className="w-8 h-8 mx-auto mb-2 text-sage-leaf" />
              <h3 className="font-medium">Plan Meals</h3>
              <p className="text-sm text-soft-taupe">Drag & drop planner</p>
            </Link>
          </div>

          {/* Today's Plan */}
          <div className="card">
            <h2 className="text-xl font-lora mb-4">Today's Plan</h2>
            <div className="space-y-3">
              {['Breakfast', 'Lunch', 'Dinner'].map((meal) => (
                <div key={meal} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <span className="font-medium">{meal}</span>
                  <button className="text-coral-blush hover:underline">Add meal</button>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-coral-blush">7</div>
              <div className="text-sm text-soft-taupe">Day streak</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-sage-leaf">12</div>
              <div className="text-sm text-soft-taupe">Pantry items</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-wheat-gold">3</div>
              <div className="text-sm text-soft-taupe">Hours saved</div>
            </div>
          </div>
        </div>

        {/* Bottom Navigation */}
        <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4">
          <div className="max-w-md mx-auto flex justify-around">
            <Link to="/" className="text-coral-blush">
              <div className="text-center">
                <div className="w-6 h-6 mx-auto mb-1">🏠</div>
                <span className="text-xs">Home</span>
              </div>
            </Link>
            <Link to="/pantry" className="text-soft-taupe">
              <div className="text-center">
                <div className="w-6 h-6 mx-auto mb-1">📦</div>
                <span className="text-xs">Pantry</span>
              </div>
            </Link>
            <Link to="/meal-planner" className="text-soft-taupe">
              <div className="text-center">
                <div className="w-6 h-6 mx-auto mb-1">📅</div>
                <span className="text-xs">Plan</span>
              </div>
            </Link>
            <Link to="/grocery-list" className="text-soft-taupe">
              <div className="text-center">
                <div className="w-6 h-6 mx-auto mb-1">🛒</div>
                <span className="text-xs">Grocery</span>
              </div>
            </Link>
            <Link to="/profile" className="text-soft-taupe">
              <div className="text-center">
                <div className="w-6 h-6 mx-auto mb-1">👤</div>
                <span className="text-xs">Profile</span>
              </div>
            </Link>
          </div>
        </nav>
      </div>
    </div>
  )
}

export default Home 