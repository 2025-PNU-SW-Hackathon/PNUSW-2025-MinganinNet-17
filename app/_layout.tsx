import { Stack } from 'expo-router';
import { useColorScheme } from 'react-native';

export default function RootLayout() {
  const colorScheme = useColorScheme();

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
