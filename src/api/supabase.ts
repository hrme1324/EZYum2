import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string;

// Debug logging (only in development)
if (import.meta.env.DEV) {
  console.log('Environment check:', {
    hasUrl: !!supabaseUrl,
    hasKey: !!supabaseAnonKey,
    urlLength: supabaseUrl?.length,
    keyLength: supabaseAnonKey?.length,
  });
}

// Fallback values for production (these are safe to use as they're public keys)
const fallbackUrl = 'https://whclrrwwnffirgcngeos.supabase.co';
const fallbackKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndoY2xycnd3bmZmaXJnY25nZW9zIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM3MTcxMjksImV4cCI6MjA2OTI5MzEyOX0.YpJOsuOC7suZNPZxx9xgIPFdsJY-XrglfIge_CSeYx8';

// Use environment variables if available, otherwise use fallbacks
const finalUrl = supabaseUrl || fallbackUrl;
const finalKey = supabaseAnonKey || fallbackKey;

// Create Supabase client
const supabase = createClient(finalUrl, finalKey);

export { supabase };
