import { AuthChangeEvent, Session, Subscription, User } from '@supabase/supabase-js';
import { create } from 'zustand';
import { supabase } from '../api/supabase';
import { logger } from '../utils/logger';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  _subscription?: Subscription;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: true,

  signInWithGoogle: async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) {
        logger.error('Error signing in with Google:', error);
        throw error;
      }
    } catch (error) {
      logger.error('Error in signInWithGoogle:', error);
      throw error;
    }
  },

  signOut: async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        logger.error('Error signing out:', error);
        throw error;
      }
      set({ user: null });
    } catch (error) {
      logger.error('Error in signOut:', error);
      throw error;
    }
  },

  checkAuth: async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      set({ user: session?.user ?? null, isLoading: false });

      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange(
        async (event: AuthChangeEvent, session: Session | null) => {
          logger.log('Auth state changed:', event, session?.user?.id);
          set({ user: session?.user ?? null, isLoading: false });
        },
      );

      // Store subscription for cleanup
      set({ _subscription: subscription });
    } catch (error) {
      logger.error('Error checking auth:', error);
      set({ user: null, isLoading: false });
    }
  },
}));
