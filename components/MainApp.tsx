import { router } from 'expo-router';
import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import DailySchedulePopup from './DailySchedulePopup';
import GoalSettingStep1 from './GoalSettingStep1';
import GoalSettingStep2, { GoalSettingStep2Data } from './GoalSettingStep2';
import GoalSettingStep3 from './GoalSettingStep3';
import GoalSettingStep4 from './GoalSettingStep4';
import GoalSetupCompleteScreen from './GoalSetupCompleteScreen';
import HabitSetupScreen, { HabitData } from './HabitSetupScreen';
import HomeScreen from './HomeScreen';
import LoginScreen from './LoginScreen';
import RoutineResultScreen from './RoutineResultScreen';
import ScreenTransitionManager from './ScreenTransitionManager';
import SplashScreen from './SplashScreen';
import WelcomeScreen from './WelcomeScreen';

type Screen = 'splash' | 'welcome' | 'login' | 'goalStep1' | 'goalStep2' | 'goalStep3' | 'goalStep4' | 'goalComplete' | 'habitSetup' | 'routineGenerated' | 'home';

interface Task {
  id: string;
  title: string;
  completed: boolean;
  type: 'normal' | 'special';
}

interface AppData {
  habitGoal: string;
  timeData: GoalSettingStep2Data | null;
  coachingIntensity: string;
  difficulty: string;
  habitData: HabitData | null;
}

export default function MainApp() {
  const [currentScreen, setCurrentScreen] = useState<Screen>('splash');
  const [showDailyPopup, setShowDailyPopup] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [tasks, setTasks] = useState<Task[]>([]);
  
  const [appData, setAppData] = useState<AppData>({
    habitGoal: '',
    timeData: null,
    coachingIntensity: '',
    difficulty: '',
    habitData: null,
  });

  // Splash Screen handlers
  const handleSplashComplete = () => {
    setCurrentScreen('welcome');
  };

  // Welcome Screen handlers
  const handleGetStarted = () => {
    setCurrentScreen('login');
  };

  // Login Screen handlers
  const handleLoginSuccess = () => {
    setCurrentScreen('goalStep1');
  };

  const handleSignUpPress = () => {
    setCurrentScreen('goalStep1');
  };

  // Goal Setting Step 1 handlers
  const handleGoalStep1Next = (habitGoal: string) => {
    setAppData(prev => ({ ...prev, habitGoal }));
    setCurrentScreen('goalStep2');
  };

  const handleGoalStep1Back = () => {
    setCurrentScreen('login');
  };

  // Goal Setting Step 2 handlers
  const handleGoalStep2Next = (timeData: GoalSettingStep2Data) => {
    setAppData(prev => ({ ...prev, timeData }));
    setCurrentScreen('goalStep3');
  };

  const handleGoalStep2Back = () => {
    setCurrentScreen('goalStep1');
  };

  // Goal Setting Step 3 handlers (Coaching Intensity)
  const handleGoalStep3Next = (intensity: string) => {
    setAppData(prev => ({ 
      ...prev, 
      coachingIntensity: intensity, 
      difficulty: '의지 부족' // Set default difficulty
    }));
    setCurrentScreen('goalStep4');
  };

  const handleGoalStep3Back = () => {
    setCurrentScreen('goalStep2');
  };

  // Goal Setting Step 4 handlers (Final Confirmation)
  const handleGoalStep4Complete = () => {
    setCurrentScreen('goalComplete');
  };

  const handleGoalStep4Back = () => {
    setCurrentScreen('goalStep3');
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
    setCurrentScreen('goalStep2');
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
  const handleDayPress = (day: number) => {
    setSelectedDate(`7월 ${day}일 (화)`);
    setShowDailyPopup(true);
  };

  // Daily Schedule Popup handlers
  const handleClosePopup = () => {
    setShowDailyPopup(false);
  };

  const handleTaskToggle = (taskId: string) => {
    setTasks(prev => 
      prev.map(task => 
        task.id === taskId ? { ...task, completed: !task.completed } : task
      )
    );
  };

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
            initialData={appData.timeData || undefined}
          />
        );
      
      case 'goalStep3':
        return (
          <GoalSettingStep3
            onContinue={handleGoalStep3Next}
            onBack={handleGoalStep3Back}
          />
        );
      
      case 'goalStep4':
        return (
          <GoalSettingStep4
            goalData={{
              goal: appData.habitGoal || '매일 아침 10분 책 읽기',
              period: '90일',
              coachingIntensity: appData.coachingIntensity || '보통',
              difficulty: appData.difficulty || '의지 부족'
            }}
            onComplete={handleGoalStep4Complete}
            onBack={handleGoalStep4Back}
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
        return (
          <RoutineResultScreen
            habitData={appData.habitData || {
              desiredHabit: appData.habitGoal || '매일 아침 10분 책 읽기',
              availableTime: appData.timeData?.customTime || appData.timeData?.timeSlot || '오전 7시 - 8시',
              difficulties: appData.difficulty || '의지 부족',
              restrictedApps: 'YouTube, Instagram, TikTok'
            }}
            onStartRoutine={handleStartRoutine}
            onEditRoutine={handleEditRoutine}
          />
        );
      
      case 'home':
        return (
          <HomeScreen
            onDayPress={handleDayPress}
          />
        );
      
      default:
        return <WelcomeScreen onGetStarted={handleGetStarted} />;
    }
  };

  return (
    <View style={styles.container}>
      <ScreenTransitionManager
        screenKey={currentScreen}
        onTransitionComplete={() => {
          console.log('Screen transition completed for:', currentScreen);
        }}
      >
        {renderScreen()}
      </ScreenTransitionManager>
      
      {/* Daily Schedule Popup */}
      {showDailyPopup && (
        <DailySchedulePopup
          visible={showDailyPopup}
          date={selectedDate}
          tasks={tasks}
          onClose={handleClosePopup}
          onTaskToggle={handleTaskToggle}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
}); 