import { createClient } from '@supabase/supabase-js';

// Get environment variables
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

// Validate required environment variables
if (!supabaseUrl) {
  console.warn('EXPO_PUBLIC_SUPABASE_URL is not set in environment variables');
}

if (!supabaseAnonKey) {
  console.warn('EXPO_PUBLIC_SUPABASE_ANON_KEY is not set in environment variables');
}

// Create Supabase client with fallback for development
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key'
);

// Export configuration status for debugging
export const supabaseConfig = {
  hasUrl: !!supabaseUrl,
  hasKey: !!supabaseAnonKey,
  isConfigured: !!supabaseUrl && !!supabaseAnonKey,
  url: supabaseUrl,
}; 