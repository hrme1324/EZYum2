import { createClient } from '@supabase/supabase-js';
import { logger } from '../utils/logger';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

// Debug logging (always show in production to see what's available)
logger.log('🔍 Environment Variables Check:', {
  hasUrl: !!supabaseUrl,
  hasKey: !!supabaseAnonKey,
  urlLength: supabaseUrl?.length,
  keyLength: supabaseAnonKey?.length,
  isDev: import.meta.env.DEV,
  isProd: import.meta.env.PROD,
  allEnvKeys: Object.keys(import.meta.env).filter((key) => key.startsWith('VITE_')),
});

// Fallback values for production (these are safe to use as they're public keys)
const fallbackUrl = 'https://your-project.supabase.co';
const fallbackKey = 'your_supabase_anon_key_here';

// Use environment variables if available, otherwise use fallbacks
const finalUrl = supabaseUrl || fallbackUrl;
const finalKey = supabaseAnonKey || fallbackKey;

logger.log('🎯 Final Supabase Config:', {
  usingEnvVars: !!(supabaseUrl && supabaseAnonKey),
  usingFallbacks: !(supabaseUrl && supabaseAnonKey),
  finalUrl: finalUrl.substring(0, 30) + '...',
  finalKey: finalKey.substring(0, 20) + '...',
});

// Create Supabase client
const supabase = createClient(finalUrl, finalKey);

export { supabase };
