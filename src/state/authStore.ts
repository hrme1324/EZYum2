import { AuthChangeEvent, Session, User } from '@supabase/supabase-js';
import { create } from 'zustand';
import { supabase } from '../api/supabase';

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
      // Determine the correct redirect URL for both development and production
      const isDev = import.meta.env.DEV;
      let baseUrl: string;

      // Check for environment variable first
      if (import.meta.env.VITE_SITE_URL) {
        baseUrl = import.meta.env.VITE_SITE_URL;
      } else if (isDev) {
        baseUrl = 'http://localhost:3000';
      } else {
        // In production, use the current domain or fallback to ezyum.com
        baseUrl = window.location.origin || 'https://ezyum.com';
      }

      const redirectUrl = `${baseUrl}/auth/callback`;

      console.log('🔐 Auth redirect URL:', redirectUrl);

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
