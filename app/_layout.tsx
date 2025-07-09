import { Stack } from 'expo-router';
import { useEffect } from 'react';
import { useColorScheme } from 'react-native';
import { supabase } from '../backend/supabase/client';

export default function RootLayout() {
  const colorScheme = useColorScheme();

  useEffect(() => {
    // 인증 상태 변경 감지
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth event:', event);
      console.log('Session:', session);
    });

    return () => {
      subscription?.unsubscribe();
    };
  }, []);

  return (
    <Stack>
      <Stack.Screen 
        name="(tabs)" 
        options={{ headerShown: false }} 
      />
      <Stack.Screen 
        name="ui/login" 
        options={{ 
          title: '로그인',
          headerShown: false 
        }} 
      />
      <Stack.Screen 
        name="ui/signup" 
        options={{ 
          title: '회원가입',
          headerShown: false 
        }} 
      />
    </Stack>
  );
}
