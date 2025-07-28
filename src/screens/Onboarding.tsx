import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { ChevronRight, Clock, ShoppingBag, Gamepad2, User } from 'lucide-react'
import { useAuthStore } from '../state/authStore'

const Onboarding: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0)
  const [timeBudget, setTimeBudget] = useState(30)
  const [selectedStaples, setSelectedStaples] = useState<string[]>([])
  const [gameTime, setGameTime] = useState<number | null>(null)
  const { signInWithGoogle } = useAuthStore()

  const staples = [
    'Eggs', 'Rice', 'Pasta', 'Beans', 'Chicken', 'Ground Beef',
    'Onions', 'Garlic', 'Tomatoes', 'Cheese', 'Bread', 'Milk'
  ]

  const steps = [
    {
      title: "How much time do you have?",
      subtitle: "We'll help you save time in the kitchen",
      icon: <Clock className="w-8 h-8" />,
      component: (
        <div className="space-y-6">
          <div className="text-center">
            <h3 className="text-2xl font-lora mb-2">Time Budget</h3>
            <p className="text-soft-taupe">How long does meal prep usually take?</p>
          </div>
          <div className="space-y-4">
            <input
              type="range"
              min="15"
              max="120"
              step="15"
              value={timeBudget}
              onChange={(e) => setTimeBudget(Number(e.target.value))}
              className="w-full"
            />
            <div className="text-center">
              <span className="text-3xl font-bold text-coral-blush">{timeBudget} minutes</span>
              <p className="text-sm text-soft-taupe mt-2">
                Save {Math.round((120 - timeBudget) / 15)} hours per week!
              </p>
            </div>
          </div>
        </div>
      )
    },
    {
      title: "What's in your pantry?",
      subtitle: "Select your staple ingredients",
      icon: <ShoppingBag className="w-8 h-8" />,
      component: (
        <div className="space-y-6">
          <div className="text-center">
            <h3 className="text-2xl font-lora mb-2">Pantry Staples</h3>
            <p className="text-soft-taupe">Select what you usually have on hand</p>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {staples.map((staple) => (
              <button
                key={staple}
                onClick={() => {
                  setSelectedStaples(prev => 
                    prev.includes(staple) 
                      ? prev.filter(s => s !== staple)
                      : [...prev, staple]
                  )
                }}
                className={`p-3 rounded-lg border-2 transition-all ${
                  selectedStaples.includes(staple)
                    ? 'border-coral-blush bg-coral-blush text-white'
                    : 'border-gray-200 hover:border-coral-blush'
                }`}
              >
                {staple}
              </button>
            ))}
          </div>
        </div>
      )
    },
    {
      title: "Quick Meal Challenge!",
      subtitle: "Plan 3 meals in under 30 seconds",
      icon: <Gamepad2 className="w-8 h-8" />,
      component: (
        <div className="space-y-6">
          <div className="text-center">
            <h3 className="text-2xl font-lora mb-2">30-Second Challenge</h3>
            <p className="text-soft-taupe">Swipe meals into your plan</p>
          </div>
          <div className="space-y-4">
            {['Breakfast', 'Lunch', 'Dinner'].map((meal) => (
              <div key={meal} className="bg-white rounded-lg p-4 border">
                <h4 className="font-medium mb-2">{meal}</h4>
                <div className="flex space-x-2 overflow-x-auto">
                  {['Oatmeal', 'Scrambled Eggs', 'Pancakes', 'Smoothie'].map((option) => (
                    <button
                      key={option}
                      className="px-4 py-2 bg-sage-leaf text-rich-charcoal rounded-lg whitespace-nowrap"
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>
            ))}
            <button
              onClick={() => {
                const time = Math.floor(Math.random() * 15) + 15
                setGameTime(time)
              }}
              className="btn-primary w-full"
            >
              Start Timer
            </button>
            {gameTime && (
              <div className="text-center">
                <p className="text-lg">You did it in {gameTime} seconds!</p>
                <div className="text-4xl">🎉</div>
              </div>
            )}
          </div>
        </div>
      )
    },
    {
      title: "Create Your Profile",
      subtitle: "Sign in with Google to save your preferences",
      icon: <User className="w-8 h-8" />,
      component: (
        <div className="space-y-6">
          <div className="text-center">
            <h3 className="text-2xl font-lora mb-2">Chef Profile</h3>
            <p className="text-soft-taupe">Sign in with Google to sync all your plans</p>
          </div>
          <div className="space-y-4">
            <button 
              onClick={signInWithGoogle}
              className="btn-primary w-full flex items-center justify-center space-x-2"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <span>Continue with Google</span>
            </button>
            <p className="text-xs text-soft-taupe text-center">
              We'll save your preferences and sync across devices
            </p>
          </div>
        </div>
      )
    }
  ]

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1)
    }
  }

  return (
    <div className="min-h-screen bg-off-white flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full"
      >
        <div className="card">
          <div className="flex items-center justify-center mb-6">
            {steps[currentStep].icon}
          </div>
          
          <div className="text-center mb-8">
            <h2 className="text-3xl font-lora mb-2">{steps[currentStep].title}</h2>
            <p className="text-soft-taupe">{steps[currentStep].subtitle}</p>
          </div>

          {steps[currentStep].component}

          <div className="flex justify-between items-center mt-8">
            <div className="flex space-x-2">
              {steps.map((_, index) => (
                <div
                  key={index}
                  className={`w-2 h-2 rounded-full ${
                    index === currentStep ? 'bg-coral-blush' : 'bg-gray-200'
                  }`}
                />
              ))}
            </div>
            
            {currentStep < steps.length - 1 && (
              <button
                onClick={nextStep}
                className="btn-primary flex items-center space-x-2"
              >
                <span>Next</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  )
}

export default Onboarding 