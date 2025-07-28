import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { ChevronRight, Clock, ShoppingBag, Gamepad2, User } from 'lucide-react'

const Onboarding: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0)
  const [timeBudget, setTimeBudget] = useState(30)
  const [selectedStaples, setSelectedStaples] = useState<string[]>([])
  const [gameTime, setGameTime] = useState<number | null>(null)

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
      subtitle: "Save your preferences and get started",
      icon: <User className="w-8 h-8" />,
      component: (
        <div className="space-y-6">
          <div className="text-center">
            <h3 className="text-2xl font-lora mb-2">Chef Profile</h3>
            <p className="text-soft-taupe">Continue with Google to sync all your plans</p>
          </div>
          <div className="space-y-4">
            <button className="btn-primary w-full">
              Continue with Google
            </button>
            <button className="btn-secondary w-full">
              Continue with Email
            </button>
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