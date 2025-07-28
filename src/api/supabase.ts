import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string

// Debug logging
console.log('Environment check:', {
  hasUrl: !!supabaseUrl,
  hasKey: !!supabaseAnonKey,
  urlLength: supabaseUrl?.length,
  keyLength: supabaseAnonKey?.length
})

let supabase: any

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing environment variables:', {
    VITE_SUPABASE_URL: supabaseUrl,
    VITE_SUPABASE_ANON_KEY: supabaseAnonKey ? '***' : 'missing'
  })
  
  // For development, you can temporarily hardcode these values
  if (import.meta.env.DEV) {
    console.warn('Using fallback values for development')
    const fallbackUrl = 'https://whclrrwwnffirgcngeos.supabase.co'
    const fallbackKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndoY2xycnd3bmZmaXJnY25nZW9zIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM3MTcxMjksImV4cCI6MjA2OTI5MzEyOX0.YpJOsuOC7suZNPZxx9xgIPFdsJY-XrglfIge_CSeYx8'
    
    supabase = createClient(fallbackUrl, fallbackKey)
  } else {
    throw new Error('Missing Supabase environment variables. Please check your .env.local file.')
  }
} else {
  supabase = createClient(supabaseUrl, supabaseAnonKey)
}

export { supabase } 