import { AuthChangeEvent, Session, Subscription, User } from '@supabase/supabase-js';
import { create } from 'zustand';
import { supabase } from '../api/supabase';
import { logger } from '../utils/logger';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  authReady: boolean;  // Critical: deterministic auth state
  _subscription?: Subscription;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  initAuth: () => Promise<void>;  // Renamed for clarity
  unsubscribeAuth: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isLoading: true,
  authReady: false,  // Critical: starts false, becomes true deterministically

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

  initAuth: async () => {
    logger.debug('[auth] Starting auth initialization');
    set({ isLoading: true, authReady: false });

    try {
      // Always call getSession first
      logger.debug('[auth] Calling getSession...');
      const { data: { session } } = await supabase.auth.getSession();
      logger.log('[auth] Initial session check:', session?.user?.id || 'no user');
      set({ user: session?.user ?? null });
    } catch (error) {
      logger.error('[auth] getSession failed:', error);
      set({ user: null });
    } finally {
      // CRITICAL: Always mark ready, even on errors
      set({ isLoading: false, authReady: true });
      logger.log('[auth] Auth initialization complete, authReady = true');
    }

    // Single global listener - set authReady on every event
    logger.debug('[auth] Setting up auth state change listener');
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event: AuthChangeEvent, session: Session | null) => {
        logger.log('[auth] State change:', event, session?.user?.id || 'no user');
        set({ user: session?.user ?? null, authReady: true });
      },
    );

    // Store subscription for cleanup
    logger.debug('[auth] Storing subscription for cleanup');
    set({ _subscription: subscription });
  },

  unsubscribeAuth: () => {
    const { _subscription } = get();
    if (_subscription) {
      logger.log('[auth] Cleaning up auth subscription');
      _subscription.unsubscribe();
      set({ _subscription: undefined });
    }
  },
}));
