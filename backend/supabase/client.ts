import AsyncStorage from '@react-native-async-storage/async-storage';
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

// Create Supabase client with React Native AsyncStorage configuration
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseAnonKey || 'placeholder-key',
  {
    auth: {
      storage: AsyncStorage,        // AsyncStorage를 세션 저장소로 사용
      autoRefreshToken: true,       // 토큰 자동 갱신 활성화
      persistSession: true,         // 세션 지속성 활성화 (앱 재시작 시 복원)
      detectSessionInUrl: false,    // URL 기반 세션 감지 비활성화 (모바일 환경)
    },
  }
);

// Export configuration status for debugging
export const supabaseConfig = {
  hasUrl: !!supabaseUrl,
  hasKey: !!supabaseAnonKey,
  isConfigured: !!supabaseUrl && !!supabaseAnonKey,
  url: supabaseUrl,
}; 