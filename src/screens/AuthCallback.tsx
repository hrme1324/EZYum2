import React, { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../api/supabase'
import LoadingSpinner from '../components/LoadingSpinner'

const AuthCallback: React.FC = () => {
  const navigate = useNavigate()

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const { data, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Auth callback error:', error)
          navigate('/')
          return
        }

        if (data.session) {
          // User is authenticated, redirect to home
          navigate('/')
        } else {
          // No session, redirect back to onboarding
          navigate('/')
        }
      } catch (error) {
        console.error('Auth callback error:', error)
        navigate('/')
      }
    }

    handleAuthCallback()
  }, [navigate])

  return (
    <div className="min-h-screen bg-off-white flex items-center justify-center">
      <div className="text-center">
        <LoadingSpinner />
        <p className="mt-4 text-soft-taupe">Signing you in...</p>
      </div>
    </div>
  )
}

export default AuthCallback 