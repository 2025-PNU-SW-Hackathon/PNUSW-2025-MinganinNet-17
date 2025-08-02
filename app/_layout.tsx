import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { router, Stack } from 'expo-router';
import { useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';
import { supabase } from '../backend/supabase/client';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const [isNavigationReady, setIsNavigationReady] = useState(false);

  // 알림 데이터로 네비게이션 처리하는 함수
  const handleNotificationNavigation = async (notificationData: any) => {
    console.log('알림 네비게이션 처리:', notificationData);
    
    if (notificationData?.route === 'report') {
      console.log('Report 화면으로 이동 시작...');
      
      // 포그라운드/백그라운드에서 처리되었으므로 AsyncStorage에서 제거
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
    // 네비게이션 준비 완료 표시 (약간의 지연 후)
    const timer = setTimeout(() => {
      setIsNavigationReady(true);
    }, 500);

    // 인증 상태 변경 감지
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth event:', event);
      console.log('Session:', session);
    });

    // 앱이 종료된 상태에서 알림으로 시작되었는지 확인(expo go에서 사용안됨 왜지?)
    const checkLastNotificationResponse = async () => {
      try {
        const lastNotificationResponse = await Notifications.getLastNotificationResponseAsync();
        
        if (lastNotificationResponse) {
          console.log('앱 시작 시 마지막 알림 응답:', lastNotificationResponse);
          const notificationData = lastNotificationResponse.notification.request.content.data;
          
          // 일정 시간 후 네비게이션 실행 (앱 완전 로딩 대기)
          setTimeout(() => {
            handleNotificationNavigation(notificationData);
          }, 1000);
          return; // AsyncStorage 확인 건너뛰기
        }
      } catch (error) {
        console.error('마지막 알림 응답 확인 중 오류:', error); // 그래서 맨날 여기서 오류 발생
      }

      // Fallback: AsyncStorage에서 pending 알림 확인 (1차 시도 실패 시)
      try {
        const pendingNotification = await AsyncStorage.getItem('pending_notification');
        if (pendingNotification) {
          const notificationData = JSON.parse(pendingNotification);
          console.log('AsyncStorage에서 발견된 저장된 알림 데이터:', notificationData);
          
          // 5분 이내의 알림만 유효하다고 간주 (너무 오래된 알림은 무시)
          const timeDiff = Date.now() - notificationData.timestamp;
          if (timeDiff < 5 * 60 * 1000 && notificationData.route === 'report') {
            console.log('저장된 알림으로 인한 앱 시작 - Report 화면으로 이동');
            
            // 일정 시간 후 네비게이션 실행 (앱 완전 로딩 대기)
            setTimeout(() => {
              handleNotificationNavigation(notificationData);
            }, 1000);
          }
        }
      } catch (storageError) {
        console.log('AsyncStorage 확인 중 오류 (무시됨):', storageError instanceof Error ? storageError.message : String(storageError));
      }
    };

    checkLastNotificationResponse();

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

  return (
    <Stack initialRouteName="index">
      <Stack.Screen 
        name="index" 
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
  );
}
