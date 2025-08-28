import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { router, Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';
import { useFonts } from 'expo-font';
import { supabase } from '../backend/supabase/client';
import ErrorBoundary from '../components/ErrorBoundary';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [isNavigationReady, setIsNavigationReady] = useState(false);
  const [pendingNotificationRoute, setPendingNotificationRoute] = useState<string | null>(null);
  const [isAutoNavigationHandled, setIsAutoNavigationHandled] = useState(false);

  // Load Korean font globally for the entire app
  const [koreanFontsLoaded] = useFonts({
    'NanumHandwriting': require('../fonts/나눔손글씨 규리의 일기.ttf'),
  });

  // 앱 실행 중 알림 클릭 시 즉시 네비게이션 처리 (세션 복원 불필요)
  const handleNotificationNavigation = async (notificationData: any) => {
    console.log('🔔 앱 실행 중 알림 클릭 - 즉시 네비게이션 처리:', notificationData);
    
    if (notificationData?.route === 'report') {
      console.log('🔔 Report 화면으로 즉시 이동');
      
      // 실행 중이므로 AsyncStorage에서 제거
      try {
        await AsyncStorage.removeItem('pending_notification');
        console.log('AsyncStorage에서 pending_notification 제거됨');
      } catch (error) {
        console.log('AsyncStorage 제거 중 오류 (무시됨):', error);
      }
      
      // 네비게이션이 준비될 때까지 기다린 후 실행
      const navigate = () => {
        if (isNavigationReady) {
          router.push('/(tabs)/report');
        } else {
          setTimeout(navigate, 100);
        }
      };
      
      navigate();
    }
  };

  useEffect(() => {
    // 디버깅: 앱 시작 시 초기 세션 상태 확인
    const checkInitialSession = async () => {
      try {
        console.log('🔍 === 초기 세션 상태 확인 시작 ===');
        
        // Supabase에서 현재 세션 확인
        const { data: { session }, error } = await supabase.auth.getSession();
        console.log('📋 초기 세션 상태:', session ? '✅ 세션 있음' : '❌ 세션 없음');
        console.log('📋 세션 데이터:', session);
        console.log('📋 세션 에러:', error);
        
        // AsyncStorage에서 Supabase 관련 키들 확인
        const allKeys = await AsyncStorage.getAllKeys();
        const supabaseKeys = allKeys.filter(key => key.includes('supabase') || key.includes('@supabase'));
        console.log('🗂️  AsyncStorage의 Supabase 관련 키들:', supabaseKeys);
        
        // 각 키의 값 확인
        for (const key of supabaseKeys) {
          const value = await AsyncStorage.getItem(key);
          console.log(`📦 ${key}:`, value ? '데이터 있음' : '데이터 없음');
        }
        
        console.log('🔍 === 초기 세션 상태 확인 완료 ===');
      } catch (error) {
        console.error('❌ 초기 세션 확인 중 오류:', error);
      }
    };

    checkInitialSession();

    // 네비게이션 준비 완료 표시 (약간의 지연 후)
    const timer = setTimeout(() => {
      setIsNavigationReady(true);
    }, 500);

    // 인증 상태 변경 감지
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('🔐 === 인증 상태 변경 감지 ===');
      console.log('🔐 Auth event:', event);
      console.log('🔐 Session 존재:', session ? '✅ 있음' : '❌ 없음');
      console.log('🔐 Pending Route:', pendingNotificationRoute);
      
      if (session) {
        console.log('📊 세션 정보:');
        console.log('  - User ID:', session.user?.id);
        console.log('  - Email:', session.user?.email);
        console.log('  - Access Token 존재:', !!session.access_token);
        console.log('  - Refresh Token 존재:', !!session.refresh_token);
        
        // Navigation is now handled by the splash screen route
        // The splash screen will check session status and navigate accordingly
        console.log('🚀 === 세션 복원 완료 - 스플래시 화면이 네비게이션을 처리합니다 ===');
        
        // Set flag to prevent multiple auth state change handlers
        if (!isAutoNavigationHandled) {
          setIsAutoNavigationHandled(true);
        }
      } else {
        // 세션이 없을 때 (로그아웃 또는 세션 만료)
        if (event === 'SIGNED_OUT') {
          console.log('🚪 === 로그아웃 감지 - 온보딩 화면으로 이동 ===');
          
          const navigateToOnboarding = () => {
            if (isNavigationReady) {
              router.replace('/onboarding');
              console.log('✅ 로그아웃 완료 → 온보딩 화면으로 이동');
              
              // 자동 네비게이션 플래그 리셋
              setIsAutoNavigationHandled(false);
              setPendingNotificationRoute(null);
            } else {
              setTimeout(navigateToOnboarding, 100);
            }
          };
          
          navigateToOnboarding();
        }
      }
    });

    // Notification handling is now done in splash screen
    // Keep this for runtime notification clicks only
    console.log('🔔 Notification handling moved to splash screen');

    // 알림 클릭 이벤트 리스너 설정 (앱 실행 중일 때)
    const notificationListener = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('알림 클릭됨 (앱 실행 중):', response);
      
      const notificationData = response.notification.request.content.data;
      handleNotificationNavigation(notificationData);
    });

    return () => {
      clearTimeout(timer);
      subscription?.unsubscribe();
      notificationListener.remove();
    };
  }, [isNavigationReady]);

  // Don't render app until Korean fonts are loaded
  if (!koreanFontsLoaded) {
    return null;
  }

  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        console.error('Root Layout Error:', error);
        console.error('Error Info:', errorInfo);
      }}
    >
      <Stack initialRouteName="index">
        <Stack.Screen 
          name="index" 
          options={{ headerShown: false }} 
        />
        <Stack.Screen 
          name="splash" 
          options={{ headerShown: false }} 
        />
        <Stack.Screen 
          name="onboarding" 
          options={{ headerShown: false }} 
        />
        <Stack.Screen 
          name="(tabs)" 
          options={{ headerShown: false }} 
        />
      </Stack>
    </ErrorBoundary>
  );
}
