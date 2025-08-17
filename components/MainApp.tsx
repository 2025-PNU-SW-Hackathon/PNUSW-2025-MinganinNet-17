import { router, usePathname } from 'expo-router';
import { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { getActivePlan } from '../backend/supabase/habits';
import ErrorBoundary from './ErrorBoundary';
import GoalSettingStep1 from './GoalSettingStep1';
import GoalSettingStep2 from './GoalSettingStep2';
import GoalSettingStep3 from './GoalSettingStep3';
import GoalSettingStep4 from './GoalSettingStep4';
import GoalSettingStep5 from './GoalSettingStep5';
import GoalSettingStep6 from './GoalSettingStep6';
import GoalSetupCompleteScreen from './GoalSetupCompleteScreen';
import HabitSetupScreen, { HabitData } from './HabitSetupScreen';
import HomeScreen from './HomeScreen/index';
import LoginScreen from './LoginScreen';
import RoutineResultScreen from './RoutineResultScreen';
import ScreenTransitionManager from './ScreenTransitionManager';
import SignUpScreen, { SignUpData } from './SignUpScreen';
import SplashScreen from './SplashScreen';
import WelcomeScreen from './WelcomeScreen';

type Screen = 'splash' | 'welcome' | 'login' | 'signup' | 'goalStep1' | 'goalStep2' | 'goalStep3' | 'goalStep4' | 'goalStep5' | 'goalStep6' | 'goalComplete' | 'habitSetup' | 'routineGenerated' | 'home';

// Task interface removed since HomeScreen now manages its own todo interactions

interface AppData {
  habitGoal: string;
  duration: string;
  timeWindow: string;
  difficulty: string;
  timeData: any; // Changed to any to avoid type errors
  coachingIntensity: string;
  habitData: HabitData | null;
}

export default function MainApp() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('splash');
  const pathname = usePathname();
  // Note: DailySchedulePopup functionality removed since HomeScreen now manages its own interactions
  
  const [appData, setAppData] = useState<AppData>({
    habitGoal: '',
    duration: '',
    timeWindow: '',
    difficulty: '',
    timeData: null,
    coachingIntensity: '',
    habitData: null,
  });

  // (tabs) 경로일 때 목표 확인 및 goalStep1으로 이동
  useEffect(() => {
    const checkGoalAndNavigate = async () => {
      if (pathname === '/(tabs)' && currentScreen === 'home') {
        try {
          console.log('🔍 (tabs) 경로에서 목표 확인 시작');
          const activePlan = await getActivePlan();
          
          if (!activePlan) {
            console.log('🎯 목표가 없음 - goalStep1으로 이동');
            setCurrentScreen('goalStep1');
          } else {
            console.log('✅ 목표가 있음 - 홈 화면 유지');
          }
        } catch (error) {
          console.error('❌ 목표 확인 중 오류:', error);
          console.log('🚨 에러 발생 - goalStep1으로 이동');
          setCurrentScreen('goalStep1');
        }
      }
    };

    checkGoalAndNavigate();
  }, [pathname, currentScreen]);

  // Splash Screen handlers
  const handleSplashComplete = () => {
    setCurrentScreen('welcome');
  };

  // Welcome Screen handlers
  const handleGetStarted = () => {
    setCurrentScreen('login');
  };

  // Login Screen handlers
  const handleLoginSuccess = async () => {
    // 일반 로그인 로직
    try {
      const activePlan = await getActivePlan();
      
      if (activePlan) {
        // 이미 목표가 있으면 바로 메인 화면으로
        router.replace('/(tabs)');
      } else {
        // 목표가 없으면 목표 설정으로
        setCurrentScreen('goalStep1');
      }
    } catch (error) {
      console.error('Error checking user plan:', error);
      // 에러가 발생하면 기본적으로 목표 설정으로 이동
      setCurrentScreen('goalStep1');
    }
  };

  const handleSignUpPress = () => {
    setCurrentScreen('signup');
  };

  // SignUp Screen handlers
  const handleSignUpComplete = (userData: SignUpData) => {
    console.log('SignUp completed with data:', userData);
    // Here you would typically save the user data to your backend
    // For now, we'll just proceed to the goal setting flow
    setCurrentScreen('goalStep1');
  };

  const handleSignUpBack = () => {
    setCurrentScreen('login');
  };

  // Goal Setting Step 1 handlers
  const handleGoalStep1Next = (habitGoal: string | any) => {
    // 음성 채팅 완료 시 GoalSettingStep5로 직접 이동
    if (habitGoal === 'VOICE_COMPLETE_JUMP_TO_STEP5') {
      console.log('🎯 Voice goal setting completed, jumping to GoalSettingStep5');
      setCurrentScreen('goalStep5');
      return;
    }
    
    // 일반적인 다음 단계 진행
    console.log('🎯 handleGoalStep1Next called with:', habitGoal);
    console.log('📱 Current screen before update:', currentScreen);
    setAppData(prev => ({ ...prev, habitGoal }));
    setCurrentScreen('goalStep2');
    console.log('📱 Screen should now be: goalStep2');
  };

  const handleGoalStep1Back = () => {
    console.log('🔙 handleGoalStep1Back called');
    setCurrentScreen('login');
  };

  // Goal Setting Step 2 handlers (Duration & Time Window)
  const handleGoalStep2Next = (data: { duration: string; timeWindow: string }) => {
    console.log('🎯 handleGoalStep2Next called with:', data);
    console.log('📱 Current screen before update:', currentScreen);
    setAppData(prev => ({ ...prev, duration: data.duration, timeWindow: data.timeWindow }));
    setCurrentScreen('goalStep3');
    console.log('📱 Screen should now be: goalStep3');
  };

  const handleGoalStep2Back = () => {
    console.log('🔙 handleGoalStep2Back called');
    setCurrentScreen('goalStep1');
  };

  // Goal Setting Step 3 handlers (Time Selection)
  const handleGoalStep3Next = (timeData: any) => { // Changed to any
    setAppData(prev => ({ ...prev, timeData }));
    setCurrentScreen('goalStep4');
  };

  const handleGoalStep3Back = () => {
    setCurrentScreen('goalStep2');
  };

  // Goal Setting Step 4 handlers (Coaching Intensity)
  const handleGoalStep4Next = (intensity: string) => {
    setAppData(prev => ({ ...prev, coachingIntensity: intensity }));
    setCurrentScreen('goalStep5');
  };

  const handleGoalStep4Back = () => {
    setCurrentScreen('goalStep3');
  };

  // Goal Setting Step 5 handlers (Final Confirmation)
  const handleGoalStep5Complete = () => {
    setCurrentScreen('goalStep6');
  };

  const handleGoalStep5Back = () => {
    setCurrentScreen('goalStep4');
  };

  // Goal Setting Step 6 handlers
  const handleGoalStep6Complete = () => {
    setCurrentScreen('goalComplete');
  };

  const handleGoalStep6Back = () => {
    setCurrentScreen('goalStep5');
  };

  // Goal Setup Complete handlers - Navigate to main app with tabs
  const handleGoHome = () => {
    router.replace('/(tabs)');
  };

  // Habit Setup Screen handlers (for legacy flow)
  const handleHabitSetupComplete = (habitData: HabitData) => {
    setAppData(prev => ({ ...prev, habitData }));
    setCurrentScreen('routineGenerated');
  };

  const handleHabitSetupBack = () => {
    setCurrentScreen('goalStep3');
  };

  // Routine Result Screen handlers
  const handleStartRoutine = () => {
    console.log('Starting routine with complete data:', appData);
    router.replace('/(tabs)');
  };

  const handleEditRoutine = () => {
    setCurrentScreen('habitSetup');
  };

  // Home Screen handlers - Only used if somehow we're still in onboarding
  // Note: handleDayPress removed since HomeScreen now manages its own date selection

  // Daily Schedule Popup handlers - Removed since HomeScreen now manages its own interactions

  const renderScreen = () => {
    switch (currentScreen) {
      case 'splash':
        return <SplashScreen onLoadingComplete={handleSplashComplete} />;
      
      case 'welcome':
        return <WelcomeScreen onGetStarted={handleGetStarted} />;
      
      case 'login':
        return (
          <LoginScreen
            onLoginSuccess={handleLoginSuccess}
            onSignUpPress={handleSignUpPress}
          />
        );
      
      case 'signup':
        return (
          <SignUpScreen
            onSignUpComplete={handleSignUpComplete}
            onBack={handleSignUpBack}
          />
        );
      
      case 'goalStep1':
        return (
          <GoalSettingStep1
            onNext={handleGoalStep1Next}
            onBack={handleGoalStep1Back}
            initialValue={appData.habitGoal}
          />
        );
      
      case 'goalStep2':
        return (
          <GoalSettingStep2
            onNext={handleGoalStep2Next}
            onBack={handleGoalStep2Back}
            initialValue={{ duration: appData.duration, timeWindow: appData.timeWindow }}
          />
        );
      
      case 'goalStep3':
        return (
          <GoalSettingStep3
            onNext={handleGoalStep3Next}
            onBack={handleGoalStep3Back}
            initialValue={appData.timeData}
          />
        );
      
      case 'goalStep4':
        return (
          <GoalSettingStep4
            onNext={handleGoalStep4Next}
            onBack={handleGoalStep4Back}
            initialValue={appData.coachingIntensity}
          />
        );
      
      case 'goalStep5':
        return (
          <GoalSettingStep5
            onComplete={handleGoalStep5Complete}
            onBack={handleGoalStep5Back}
          />
        );
      
      case 'goalStep6':
        return (
          <GoalSettingStep6
            onComplete={handleGoalStep6Complete}
            onBack={handleGoalStep6Back}
          />
        );

      case 'goalComplete':
        return (
          <GoalSetupCompleteScreen
            onGoHome={handleGoHome}
          />
        );
      
      case 'habitSetup':
        return (
          <HabitSetupScreen
            onSetupComplete={handleHabitSetupComplete}
            onBack={handleHabitSetupBack}
          />
        );
      
      case 'routineGenerated':
        return appData.habitData ? (
          <RoutineResultScreen
            habitData={appData.habitData || {
              desiredHabit: appData.habitGoal || '매일 아침 10분 책 읽기',
              availableTime: appData.timeWindow || '오전 7시 - 8시',
              difficulties: appData.difficulty || '의지 부족',
              restrictedApps: 'YouTube, Instagram, TikTok'
            }}
            onStartRoutine={handleStartRoutine}
            onEditRoutine={handleEditRoutine}
          />
        ) : null;
      
      case 'home':
        return (
          <ErrorBoundary>
            <HomeScreen />
          </ErrorBoundary>
        );
      
      default:
        return null;
    }
  };

  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        console.error('MainApp Error Boundary:', error);
        console.error('Component Stack:', errorInfo.componentStack);
      }}
    >
      <View style={styles.container}>
        <ScreenTransitionManager
          screenKey={currentScreen}
          onTransitionComplete={() => {
            console.log('Screen transition completed for:', currentScreen);
          }}
        >
          {renderScreen()}
        </ScreenTransitionManager>
        
        {/* Daily Schedule Popup - Removed since HomeScreen now manages its own interactions */}
      </View>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
}); 