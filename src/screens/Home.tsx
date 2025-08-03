import React, { useEffect, useState } from 'react';
import { useAuthStore } from '../state/authStore';
import { getAuthBaseUrl } from '../utils/constants';

const Home: React.FC = () => {
  const { user, signInWithGoogle } = useAuthStore();
  const [debugInfo, setDebugInfo] = useState<any>(null);

  useEffect(() => {
    // Debug domain detection
    const debugData = {
      hostname: window.location.hostname,
      origin: window.location.origin,
      href: window.location.href,
      isDev: import.meta.env.DEV,
      viteSiteUrl: import.meta.env.VITE_SITE_URL,
      userAgent: navigator.userAgent,
      authBaseUrl: getAuthBaseUrl(),
    };
    setDebugInfo(debugData);
    console.log('🏠 Home Debug Info:', debugData);
  }, []);

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">Welcome to EZyum</h1>
            <p className="text-gray-600">Your personal food companion</p>
          </div>

          <button
            onClick={signInWithGoogle}
            className="w-full bg-white border border-gray-300 rounded-lg px-4 py-3 flex items-center justify-center space-x-3 hover:bg-gray-50 transition-colors"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            <span className="text-gray-700 font-medium">Continue with Google</span>
          </button>

          {/* Debug Info */}
          {debugInfo && (
            <div className="mt-6 p-4 bg-gray-100 rounded-lg text-xs">
              <h3 className="font-bold mb-2">Debug Info:</h3>
              <pre className="whitespace-pre-wrap">{JSON.stringify(debugInfo, null, 2)}</pre>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">Welcome back!</h1>
              <p className="text-gray-600">Ready to plan your next meal?</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-500">Signed in as</p>
              <p className="font-medium text-gray-800">{user.email}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-4 rounded-lg">
              <h3 className="font-semibold text-blue-800 mb-2">Recipe Hub</h3>
              <p className="text-blue-600 text-sm">Discover new recipes and save your favorites</p>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg">
              <h3 className="font-semibold text-green-800 mb-2">Meal Planner</h3>
              <p className="text-green-600 text-sm">
                Plan your weekly meals and track your nutrition
              </p>
            </div>
            <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-4 rounded-lg">
              <h3 className="font-semibold text-purple-800 mb-2">Grocery List</h3>
              <p className="text-purple-600 text-sm">
                Generate shopping lists from your meal plans
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
