import { AuthChangeEvent, Session, User } from '@supabase/supabase-js';
import { create } from 'zustand';
import { supabase } from '../api/supabase';
import { getAuthBaseUrl } from '../utils/constants';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  setUser: (user: User | null) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,

  signInWithGoogle: async () => {
    try {
      // Use the utility function to get the correct base URL
      const baseUrl = getAuthBaseUrl();
      const redirectUrl = `${baseUrl}/auth/callback`;

      console.log('🔐 Auth redirect URL:', redirectUrl);
      console.log('📱 Device info:', {
        userAgent: navigator.userAgent,
        hostname: window.location.hostname,
        origin: window.location.origin,
        isDev: import.meta.env.DEV,
        baseUrl,
      });

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: redirectUrl,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
        },
      });
      if (error) throw error;
    } catch (error) {
      console.error('Google sign in error:', error);
      throw error;
    }
  },

  signOut: async () => {
    try {
      await supabase.auth.signOut();
      set({ user: null });
    } catch (error) {
      console.error('Sign out error:', error);
      throw error;
    }
  },

  setUser: (user: User | null) => {
    set({ user, isLoading: false });
  },
}));

// Initialize auth state
supabase.auth.getSession().then(({ data: { session } }: { data: { session: Session | null } }) => {
  useAuthStore.getState().setUser(session?.user ?? null);
});

supabase.auth.onAuthStateChange((_event: AuthChangeEvent, session: Session | null) => {
  useAuthStore.getState().setUser(session?.user ?? null);
});
