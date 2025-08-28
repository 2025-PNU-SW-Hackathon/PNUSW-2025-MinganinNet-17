import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { getActivePlan } from '../backend/supabase/habits';
import { supabase } from '../backend/supabase/client';
import SplashScreen from '../components/SplashScreen';

export default function SplashScreenRoute() {
  const [splashComplete, setSplashComplete] = useState(false);

  // Handle splash screen completion and navigation logic
  const handleSplashComplete = async () => {
    setSplashComplete(true);
    
    try {
      console.log('🚀 === Splash Screen Complete - Starting Navigation Logic ===');
      
      // Check for pending notification first
      const pendingNotificationRoute = await checkPendingNotification();
      
      // Check if user is logged in
      const { data: { session }, error } = await supabase.auth.getSession();
      console.log('📋 Session check:', session ? '✅ Logged in' : '❌ Not logged in');
      
      if (session) {
        // User is logged in
        if (pendingNotificationRoute === 'report') {
          // Navigate to report screen via notification
          console.log('🔔 Navigating to report screen from notification');
          router.replace('/(tabs)/report');
          
          // Clean up notification data
          await AsyncStorage.removeItem('pending_notification').catch(err => 
            console.log('AsyncStorage cleanup error (ignored):', err)
          );
        } else {
          // Check if user has goals
          try {
            const activePlan = await getActivePlan();
            if (activePlan) {
              // User has goals - go to main app
              console.log('✅ User has goals - navigating to main app');
              router.replace('/(tabs)');
            } else {
              // User is logged in but no goals - go to goal setting
              console.log('🎯 User logged in but no goals - navigating to goal setting');
              router.replace('/onboarding');
            }
          } catch (error) {
            console.error('❌ Error checking goals:', error);
            // On error, go to goal setting
            router.replace('/onboarding');
          }
        }
      } else {
        // User is not logged in - go to onboarding
        console.log('🚪 User not logged in - navigating to onboarding');
        router.replace('/onboarding');
      }
    } catch (error) {
      console.error('❌ Error in splash navigation logic:', error);
      // Fallback to onboarding on any error
      router.replace('/onboarding');
    }
  };

  // Check for pending notifications (from terminated app state)
  const checkPendingNotification = async (): Promise<string | null> => {
    try {
      // First try to get last notification response (works in production)
      const lastNotificationResponse = await Notifications.getLastNotificationResponseAsync();
      
      if (lastNotificationResponse) {
        console.log('🔔 Found last notification response:', lastNotificationResponse);
        const notificationData = lastNotificationResponse.notification.request.content.data;
        
        if (notificationData?.route === 'report') {
          return 'report';
        }
      }
    } catch (error) {
      console.error('Error checking last notification response:', error);
    }

    // Fallback: Check AsyncStorage for pending notifications
    try {
      const pendingNotification = await AsyncStorage.getItem('pending_notification');
      if (pendingNotification) {
        const notificationData = JSON.parse(pendingNotification);
        console.log('🔔 Found pending notification in AsyncStorage:', notificationData);
        
        // Check if notification is still valid (within 5 minutes)
        const timeDiff = Date.now() - notificationData.timestamp;
        if (timeDiff < 5 * 60 * 1000 && notificationData.route === 'report') {
          return 'report';
        }
      }
    } catch (error) {
      console.log('AsyncStorage notification check error (ignored):', error);
    }

    return null;
  };

  return (
    <SplashScreen onLoadingComplete={handleSplashComplete} />
  );
}