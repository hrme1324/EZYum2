import React from 'react'
import { useAuthStore } from '../state/authStore'
import { LogOut, User, Settings, HelpCircle } from 'lucide-react'

const Profile: React.FC = () => {
  const { user, signOut } = useAuthStore()

  const handleSignOut = async () => {
    try {
      await signOut()
    } catch (error) {
      console.error('Sign out error:', error)
    }
  }

  return (
    <div className="min-h-screen bg-off-white p-4">
      <div className="max-w-md mx-auto">
        <header className="mb-8">
          <h1 className="text-3xl font-lora text-rich-charcoal mb-2">Profile</h1>
          <p className="text-soft-taupe">Manage your account and preferences</p>
        </header>

        <div className="space-y-6">
          {/* User Info */}
          <div className="card">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-coral-blush rounded-full flex items-center justify-center">
                <User className="w-6 h-6 text-white" />
              </div>
              <div>
                <h3 className="font-medium text-rich-charcoal">
                  {user?.email || 'User'}
                </h3>
                <p className="text-sm text-soft-taupe">Signed in with Google</p>
              </div>
            </div>
          </div>

          {/* Menu Items */}
          <div className="space-y-2">
            <button className="w-full flex items-center justify-between p-4 bg-white rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors">
              <div className="flex items-center space-x-3">
                <Settings className="w-5 h-5 text-soft-taupe" />
                <span className="font-medium">Settings</span>
              </div>
              <span className="text-soft-taupe">→</span>
            </button>

            <button className="w-full flex items-center justify-between p-4 bg-white rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors">
              <div className="flex items-center space-x-3">
                <HelpCircle className="w-5 h-5 text-soft-taupe" />
                <span className="font-medium">Help & Support</span>
              </div>
              <span className="text-soft-taupe">→</span>
            </button>
          </div>

          {/* Sign Out */}
          <button
            onClick={handleSignOut}
            className="w-full flex items-center justify-center space-x-2 p-4 bg-red-50 text-red-600 rounded-lg border border-red-200 hover:bg-red-100 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span className="font-medium">Sign Out</span>
          </button>
        </div>
      </div>
    </div>
  )
}

export default Profile 