import * as Haptics from 'expo-haptics';
import { useRouter } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Dimensions,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import CalendarScreen from '../../backend/calendar/calendar';
import { generateDailyFeedback, parsePlanModificationCommand } from '../../backend/hwirang/gemini';
import { getDailyTodosByDate, updateTodoCompletion } from '../../backend/supabase/habits';
import { createReport } from '../../backend/supabase/reports';
import { Colors } from '../../constants/Colors';
import { Spacing } from '../../constants/Spacing';
import { useColorScheme } from '../../hooks/useColorScheme';
import { useHabitStore } from '../../lib/habitStore';
import { useDebugStore, useIsDebugMode } from '../../src/config/debug';

import { DailyTodo, DailyTodosByDate } from '../../types/habit';
import { AccentGlassCard, SecondaryGlassCard } from '../GlassCard';
import ProfileScreen from '../ProfileScreen';
import { SkeletonCard } from '../SkeletonLoaders';
import VintagePaperBackground from '../VintagePaperBackground';
import VoiceChatScreen from '../VoiceChatScreen';
import TodoCard from './TodoCard';

const { width } = Dimensions.get('window');



interface HomeScreenProps {
  selectedDate?: string;
}

// Coach status based on achievement rate
interface CoachStatus {
  emoji: string;
  message: string;
  color: string;
}

// Streak system types
type StreakStatus = 'active' | 'at-risk' | 'broken' | 'celebrating';
type PlantStage = 'seedling' | 'plant' | 'thriving' | 'tree';

interface StreakData {
  currentStreak: number;
  longestStreak: number;
  status: StreakStatus;
  plantStage: PlantStage;
  todayCompletion: number;
}

// Helper functions for streak calculation
const getStreakStatus = (
  streak: number, 
  todayCompletion: number, 
  lastSuccess: string | null, 
  today: string
): StreakStatus => {
  if (streak >= 7 && [7, 30, 100].includes(streak)) return 'celebrating';
  if (todayCompletion >= 0.7) return 'active';
  if (streak > 0 && todayCompletion < 0.7) return 'at-risk';
  return 'broken';
};

const getPlantStage = (streak: number): PlantStage => {
  if (streak >= 100) return 'tree';
  if (streak >= 30) return 'thriving';  
  if (streak >= 7) return 'plant';
  return 'seedling';
};

const getPlantEmoji = (stage: PlantStage): string => {
  const plants = {
    seedling: '🌱',
    plant: '🪴', 
    thriving: '🌿',
    tree: '🌳'
  };
  return plants[stage];
};

const getStatusIcon = (status: StreakStatus): string => {
  const icons = {
    active: '🔥',
    'at-risk': '⏰', 
    broken: '💔',
    celebrating: '✨'
  };
  return icons[status];
};

const getHarvestCountdownText = (currentStreak: number): string => {
  if (currentStreak >= 7) return ""; // No countdown if already harvested
  const daysLeft = 7 - (currentStreak % 7);
  return `열매 맺기까지 ${daysLeft} 일!`;
};

// GitHub-style heat map color mapping
const getHeatMapColor = (completionRate: number, colors: typeof Colors.light): string => {
  if (completionRate === 0) return colors.heatMap.none;
  if (completionRate <= 25) return colors.heatMap.low;
  if (completionRate <= 50) return colors.heatMap.medium;
  if (completionRate <= 75) return colors.heatMap.high;
  return colors.heatMap.highest;
};

// Calculate daily todo completion rate
const getDailyCompletionRate = (dateString: string, dailyTodosByDate: DailyTodosByDate): number => {
  const todos = dailyTodosByDate[dateString] || [];
  if (todos.length === 0) return 0;
  const completed = todos.filter(todo => todo.is_completed).length;
  return Math.round((completed / todos.length) * 100);
};

// StreakBadge component for showing streak information
interface StreakBadgeProps {
  streak: number;
  status: StreakStatus;
  onPress?: () => void;
  pulseAnimation?: Animated.Value;
}

const StreakBadge: React.FC<StreakBadgeProps> = ({ streak, status, onPress, pulseAnimation }) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const styles = createStyles(colors);
  
  if (streak === 0) return null;
  
  const statusColors = {
    active: colors.success,
    'at-risk': colors.warning,
    broken: colors.error,
    celebrating: '#FFD700' // Gold
  };
  
  return (
    <Animated.View
      style={[
        styles.streakBadge,
        { borderColor: statusColors[status] + '40' },
        pulseAnimation && {
          transform: [{ scale: pulseAnimation }]
        }
      ]}
    >
      <TouchableOpacity 
        onPress={onPress}
        activeOpacity={0.8}
        style={styles.streakBadgeInner}
        accessible={true}
        accessibilityRole="button"
        accessibilityLabel={`${streak}일 연속 달성 기록`}
        accessibilityHint={`현재 연속 달성 상태를 확인하려면 두 번 탭하세요. 상태: ${status === 'active' ? '활성' : status === 'at-risk' ? '위험' : status === 'celebrating' ? '축하' : '중단됨'}`}
      >
        <Text style={styles.streakIcon}>
          {getStatusIcon(status)}
        </Text>
        <Text style={[
          styles.streakCount,
          { color: statusColors[status] }
        ]}>
          {streak}d
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

export default function HomeScreen({ selectedDate }: HomeScreenProps) {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const styles = createStyles(colors);
  const [currentScreen, setCurrentScreen] = useState<'home' | 'settings'>('home');
  const [internalSelectedDate, setInternalSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const { plan, setPlan } = useHabitStore();
  const { toggleDebug } = useDebugStore();
  const isDebugMode = useIsDebugMode();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dailyTodosByDate, setDailyTodosByDate] = useState<DailyTodosByDate>({});
  

  
  // Safety effect to ensure loading doesn't stay true indefinitely
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (loading) {
        console.warn('Loading state stuck at true, forcing to false');
        setLoading(false);
      }
    }, 5000); // 5 second safety timeout
    
    return () => clearTimeout(timeout);
  }, [loading]);

  const [calendarVisible, setCalendarVisible] = useState(false);
  const [voiceChatVisible, setVoiceChatVisible] = useState(false);
  const [reportVoiceChatVisible, setReportVoiceChatVisible] = useState(false);

  // Use selectedDate from props if provided, otherwise use internal state
  const targetDate = selectedDate || internalSelectedDate;

  // Animation for coach status
  const coachScaleAnimation = useRef(new Animated.Value(1)).current;
  const [previousCoachStatus, setPreviousCoachStatus] = useState<CoachStatus | null>(null);
  
  // Track plant stage changes for animation optimization
  const [previousPlantStage, setPreviousPlantStage] = useState<PlantStage>('seedling');
  
  // Animations for smooth content loading
  const goalFadeAnimation = useRef(new Animated.Value(0)).current;
  const todoFadeAnimation = useRef(new Animated.Value(0)).current;
  const coachFadeAnimation = useRef(new Animated.Value(0)).current;
  
  // Progress and celebration animations
  const progressBarAnimation = useRef(new Animated.Value(0)).current;
  const celebrationScale = useRef(new Animated.Value(1)).current;
  const completionGlow = useRef(new Animated.Value(0)).current;
  
  // Streak system animations
  const streakPulseAnimation = useRef(new Animated.Value(1)).current;
  const plantGrowAnimation = useRef(new Animated.Value(1)).current;
  const streakCelebrationAnimation = useRef(new Animated.Value(1)).current;

  // 1. db에서 인자로 입력받은 날짜의 할 일 목록 가져와서 로컬 상태에 추가
  const fetchTodosForDate = async (date: string) => {
    try {
      setLoading(true); // 스켈레톤 로딩
      setError(null);
      const todos = await getDailyTodosByDate(date);
      setDailyTodosByDate(prev => ({ // prev: 기존 할일에 추가
        ...prev,
        [date]: todos
      }));
    } catch (err) {
      setError('할 일을 불러오는 데 실패했습니다.');
      console.error('Error fetching todos for date:', err);
    } finally {
      setLoading(false);
    }
  };

  // 4. targetDate가 변경되면, 해당 날짜를 인자로 1. 실행
  useEffect(() => {
    if (targetDate) {
      fetchTodosForDate(targetDate);
    }
  }, [targetDate]);

  // 2. 저장된 로컬 상태 중에서, targetDate에 해당하는 할 일 목록 가져오기
  const todosForSelectedDate = useMemo(() => {
    return dailyTodosByDate[targetDate] || [];
  }, [dailyTodosByDate, targetDate]);

  // 3. 할 일 완료 상태 계산
  const todoCompletion = useMemo(() => {
    return todosForSelectedDate.reduce((acc, todo) => {
      acc[todo.id] = todo.is_completed;
      return acc;
    }, {} as { [key: string]: boolean });
  }, [todosForSelectedDate]);

  // 사용자의 할 일 완료율에 따른 이모지와 메시지 생성
  const getCoachStatus = (): CoachStatus => {
    if (todosForSelectedDate.length === 0) {
      return { emoji: '😊', message: '오늘도 화이팅!', color: '#4CAF50' };
    }
    const completedCount = todosForSelectedDate.filter(todo => todo.is_completed).length;
    const avgRate = completedCount / todosForSelectedDate.length;
    if (avgRate >= 1) return { emoji: '🥳', message: '완벽한 하루!', color: '#4CAF50' };
    if (avgRate >= 0.7) return { emoji: '😊', message: '정말 잘하고 있어요!', color: '#8BC34A' };
    if (avgRate >= 0.5) return { emoji: '😌', message: '꾸준히 실천 중이네요', color: '#FFC107' };
    if (avgRate > 0) return { emoji: '😐', message: '조금만 더 힘내요!', color: '#FF9800' };
    return { emoji: '🤔', message: '시작이 반이에요!', color: '#9E9E9E' };
  };

  const getGreeting = (): string => {
    const hour = new Date().getHours();
    const greetings = {
      morning: ['좋은 아침이에요!', '오늘도 화이팅!', '새로운 하루가 시작됐어요!'],
      afternoon: ['오늘 하루 어때요?', '열심히 하고 계시네요!', '점심 맛있게 드셨나요?'],
      evening: ['수고 많으셨어요!', '오늘도 고생하셨습니다!', '하루 마무리 잘하세요!']
    };
    
    let timeOfDay: 'morning' | 'afternoon' | 'evening';
    if (hour < 12) timeOfDay = 'morning';
    else if (hour < 18) timeOfDay = 'afternoon';
    else timeOfDay = 'evening';
    
    const phrases = greetings[timeOfDay];
    return phrases[Math.floor(Math.random() * phrases.length)];
  };

  const getCalendarDates = (): Date[] => {
    const dates: Date[] = [];
    const today = new Date();
    for (let i = -3; i <= 3; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push(date);
    }
    return dates;
  };



  // 할 일 완료 상태 변경
  const handleTodoToggle = async (todoId: string | number): Promise<void> => {
    const idString = todoId.toString();
    const todo = todosForSelectedDate.find(t => t.id === idString);
    if (!todo) return;
    
    try {
      // 햅틱 피드백
      const willBeCompleted = !todo.is_completed;
      if (willBeCompleted) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
      
      // DB 업데이트
      await updateTodoCompletion(idString, willBeCompleted);
      
      // 로컬 상태 업데이트
      setDailyTodosByDate(prev => ({
        ...prev,
        [targetDate]: prev[targetDate]?.map(t => 
          t.id === idString ? { ...t, is_completed: willBeCompleted } : t
        ) || []
      }));
    } catch (error) {
      console.error('Failed to update todo completion:', error);
      setError('할 일 완료 상태 업데이트에 실패했습니다.');
    }
  };
  
  const formatCalendarDate = (date: Date) => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return {
      dayName: days[date.getDay()],
      dayNumber: date.getDate().toString().padStart(2, '0'),
      isToday: date.toDateString() === new Date().toDateString(),
      dateString: date.toISOString().split('T')[0]
    };
  };

  // Optimized: Memoized handlers
  const handleCalendarDatePress = useCallback((dateString: string): void => {
    setInternalSelectedDate(dateString);
  }, []);

  const handleVoiceChatOpen = useCallback((): void => {
    setVoiceChatVisible(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  }, []);

  const handleVoiceChatClose = useCallback((): void => {
    setVoiceChatVisible(false);
  }, []);

  const handleStreakPress = useCallback((): void => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    const messages = {
      active: `🔥 ${streakData.currentStreak}일 연속 달성 중!\n\n최고 기록: ${streakData.longestStreak}일`,
      'at-risk': `⏰ 오늘 ${Math.round(streakData.todayCompletion * 100)}% 완료\n\n조금만 더 힘내면 ${streakData.currentStreak + 1}일 연속 달성!`,
      broken: `💔 연속 기록이 끊어졌어요\n\n이전 최고 기록: ${streakData.longestStreak}일\n다시 시작해보세요!`,
      celebrating: `✨ ${streakData.currentStreak}일 연속 달성 축하합니다!\n\n이런 멋진 습관을 계속 유지해보세요!`
    };
    
    const titles = {
      active: '연속 달성 기록 🔥',
      'at-risk': '오늘 하루 더! ⏰', 
      broken: '새로운 시작 💪',
      celebrating: '마일스톤 달성! 🎉'
    };
    
    Alert.alert(titles[streakData.status], messages[streakData.status]);
  }, [streakData]);

  const handleReportCreationComplete = async (data: any) => {
    setReportVoiceChatVisible(false);
    if (!data || !data.transcript) {
      Alert.alert('오류', '리포트 내용을 인식하지 못했습니다.');
      return;
    }
    try {
      const userSummary = data.transcript.split('\n').pop() || '';
      const today = new Date();
      const todayDate = today.toISOString().split('T')[0];
      const todayTodos = dailyTodosByDate[todayDate] || [];
      const completedCount = todayTodos.filter(t => t.is_completed).length;
      const achievementScore = todayTodos.length > 0 ? Math.round((completedCount / todayTodos.length) * 10) : 0;
      const todoItems = todayTodos.map(todo => ({
        id: todo.id,
        description: todo.description,
        completed: todo.is_completed
      }));
      const feedback = await generateDailyFeedback(userSummary, achievementScore, todoItems);
      await createReport({ report_date: todayDate, achievement_score: achievementScore, ai_coach_feedback: [feedback], daily_activities: { todos: todayTodos } });
      Alert.alert('성공', '오늘의 리포트가 성공적으로 생성되었습니다.');
    } catch (error) {
      console.error('Error creating report:', error);
      Alert.alert('오류', '리포트 생성 중 오류가 발생했습니다.');
    }
  };

  const handleVoiceCommand = async (data: any) => {
    setVoiceChatVisible(false);
    
    // action 필드 확인하여 처리
    if (data && data.action === 'PLAN_COMPLETE_GO_HOME') {
      // 홈화면 모드 완료 - 홈화면으로 돌아가기
      console.log('✅ Plan mode completed, staying on home screen');
      Alert.alert('완료', '음성 명령이 처리되었습니다.');
      return;
    }
    
    if (!data || !data.transcript) {
      Alert.alert('오류', '음성 명령을 인식하지 못했습니다.');
      return;
    }
    try {
      const command = await parsePlanModificationCommand(data.transcript);
      if (!command || command.action === 'unknown') {
        Alert.alert('알 수 없는 명령', '이해하지 못했습니다. 다시 말씀해주세요.');
        return;
      }
      if (command.action === 'create_report') {
        setReportVoiceChatVisible(true);
        return;
      }
      if (!plan) {
        Alert.alert('오류', '수정할 계획이 없습니다.');
        return;
      }
      let newPlan = JSON.parse(JSON.stringify(plan));
      switch (command.action) {
        case 'add_todo':
          if (newPlan.milestones && newPlan.milestones.length > 0) {
            const newTodo: DailyTodo = { id: `new-todo-${Date.now()}`, description: command.payload.description, is_completed: false };
            newPlan.milestones[0].daily_todos.push(newTodo);
            setPlan(newPlan);
            Alert.alert('성공', `'${command.payload.description}' 할 일이 추가되었습니다.`);
          } else {
            Alert.alert('오류', '할 일을 추가할 마일스톤이 없습니다.');
          }
          break;
        case 'complete_todo':
          let todoFound = false;
          for (const milestone of newPlan.milestones) {
            const todo = milestone.daily_todos.find(t => t.description.includes(command.payload.description));
            if (todo) { todo.is_completed = true; todoFound = true; break; }
          }
          if (todoFound) {
            setPlan(newPlan);
            Alert.alert('성공', `'${command.payload.description}' 할 일을 완료했습니다.`);
          } else {
            Alert.alert('오류', `'${command.payload.description}' 할 일을 찾지 못했습니다.`);
          }
          break;
        default: Alert.alert('알 수 없는 명령', '지원하지 않는 명령입니다.'); break;
      }
    } catch (error) {
      console.error('Error processing voice command:', error);
      Alert.alert('오류', '음성 명령 처리 중 오류가 발생했습니다.');
    }
  };

  const coachStatus = useMemo(() => getCoachStatus(), [todosForSelectedDate, todoCompletion]);
  const calendarDates = useMemo(() => getCalendarDates(), []);
  
  // Optimized: Memoized progress statistics calculation
  const progressStats = useMemo(() => {
    const todos = todosForSelectedDate;
    if (todos.length === 0) return { completed: 0, total: 0, percentage: 0, isComplete: false };
    
    const completedCount = todos.filter(todo => todo.is_completed).length;
    const percentage = Math.round((completedCount / todos.length) * 100);
    const isComplete = percentage === 100;
    
    return {
      completed: completedCount,
      total: todos.length,
      percentage,
      isComplete
    };
  }, [todosForSelectedDate, todoCompletion]);

  // Streak calculation using existing dailyTodosByDate
  const streakData = useMemo((): StreakData => {
    const calculateStreakFromTodos = (): StreakData => {
      const today = new Date().toISOString().split('T')[0];
      
      // Safety check: Handle empty or invalid data
      if (!dailyTodosByDate || Object.keys(dailyTodosByDate).length === 0) {
        return {
          currentStreak: 0,
          longestStreak: 0,
          status: 'broken',
          plantStage: 'seedling',
          todayCompletion: 0
        };
      }
      
      const dates = Object.keys(dailyTodosByDate)
        .filter(date => {
          // Filter out future dates and invalid dates
          const dateObj = new Date(date);
          const todayObj = new Date(today);
          return dateObj <= todayObj && !isNaN(dateObj.getTime());
        })
        .sort(); // Chronological order
      
      let currentStreak = 0;
      let longestStreak = 0;
      let tempStreak = 0;
      let lastSuccessDate: string | null = null;
      
      // Calculate daily success rates and streaks
      const dailySuccessData: { [date: string]: boolean } = {};
      
      for (const date of dates) {
        const todos = dailyTodosByDate[date] || [];
        if (todos.length === 0) {
          dailySuccessData[date] = false;
          continue;
        }
        
        const completed = todos.filter(t => t.is_completed).length;
        const completionRate = completed / todos.length;
        
        // Success threshold: 70% completion
        const isSuccessfulDay = completionRate >= 0.7;
        dailySuccessData[date] = isSuccessfulDay;
        
        if (isSuccessfulDay) {
          tempStreak++;
          longestStreak = Math.max(longestStreak, tempStreak);
          lastSuccessDate = date;
        } else {
          tempStreak = 0;
        }
      }
      
      // Calculate current streak (consecutive days from most recent)
      const reversedDates = dates.slice().reverse(); // Most recent first
      for (const date of reversedDates) {
        if (dailySuccessData[date]) {
          currentStreak++;
        } else {
          break; // Stop at first unsuccessful day
        }
      }
      
      // Calculate today's completion rate
      const todayTodos = dailyTodosByDate[today] || [];
      const todayCompletion = todayTodos.length > 0 ? 
        todayTodos.filter(t => t.is_completed).length / todayTodos.length : 0;
      
      // Determine current status
      const status = getStreakStatus(currentStreak, todayCompletion, lastSuccessDate, today);
      const plantStage = getPlantStage(currentStreak);
      
      return {
        currentStreak,
        longestStreak,
        status,
        plantStage,
        todayCompletion
      };
    };
    
    const result = calculateStreakFromTodos();
    
    // Development debugging
    if (__DEV__) {
      console.log('🔥 Streak System Debug:', {
        currentStreak: result.currentStreak,
        longestStreak: result.longestStreak,
        status: result.status,
        plantStage: result.plantStage,
        todayCompletion: Math.round(result.todayCompletion * 100) + '%',
        dataPoints: Object.keys(dailyTodosByDate).length
      });
    }
    
    return result;
  }, [dailyTodosByDate]);

  // Animate coach when status changes - optimized with cleanup
  useEffect(() => {
    let animationRef: Animated.CompositeAnimation | null = null;
    
    if (previousCoachStatus && previousCoachStatus.emoji !== coachStatus.emoji) {
      // Coach status changed! Trigger optimized bounce animation
      animationRef = Animated.sequence([
        Animated.spring(coachScaleAnimation, {
          toValue: 1.15,
          useNativeDriver: true,
          tension: 400,
          friction: 8,
        }),
        Animated.spring(coachScaleAnimation, {
          toValue: 1,
          useNativeDriver: true,
          tension: 400,
          friction: 10,
        })
      ]);
      animationRef.start();
    }
    setPreviousCoachStatus(coachStatus);

    return () => {
      if (animationRef) {
        animationRef.stop();
      }
    };
  }, [coachStatus.emoji, previousCoachStatus?.emoji, coachScaleAnimation]);

  // Animate content when loading completes - optimized with cleanup
  useEffect(() => {
    let staggerAnimation: Animated.CompositeAnimation | null = null;
    
    if (!loading) {
      // Optimized stagger animation with faster timing
      staggerAnimation = Animated.stagger(100, [
        Animated.timing(goalFadeAnimation, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(coachFadeAnimation, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.timing(todoFadeAnimation, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ]);
      staggerAnimation.start();
    }

    return () => {
      if (staggerAnimation) {
        staggerAnimation.stop();
      }
    };
  }, [loading, goalFadeAnimation, coachFadeAnimation, todoFadeAnimation]);

  // Optimized: Combined progress and celebration animations with cleanup
  useEffect(() => {
    let progressAnimation: Animated.CompositeAnimation | null = null;
    let celebrationAnimation: Animated.CompositeAnimation | null = null;
    
    // Animate progress bar
    progressAnimation = Animated.timing(progressBarAnimation, {
      toValue: progressStats.percentage,
      duration: 600, // Faster animation
      useNativeDriver: false,
    });
    progressAnimation.start();

    // Trigger celebration if complete
    if (progressStats.isComplete && progressStats.total > 0) {
      // Combined celebration animation
      celebrationAnimation = Animated.parallel([
        Animated.sequence([
          Animated.spring(celebrationScale, {
            toValue: 1.03,
            useNativeDriver: true,
            tension: 400,
            friction: 8,
          }),
          Animated.spring(celebrationScale, {
            toValue: 1,
            useNativeDriver: true,
            tension: 400,
            friction: 10,
          }),
        ]),
        Animated.sequence([
          Animated.timing(completionGlow, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(completionGlow, {
            toValue: 0,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      ]);
      
      celebrationAnimation.start();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      completionGlow.setValue(0);
      celebrationScale.setValue(1);
    }

    return () => {
      if (progressAnimation) progressAnimation.stop();
      if (celebrationAnimation) celebrationAnimation.stop();
    };
  }, [progressStats.percentage, progressStats.isComplete, progressStats.total, 
      progressBarAnimation, celebrationScale, completionGlow]);

  // Streak plant growth animation - only on actual stage changes
  useEffect(() => {
    let growthAnimation: Animated.CompositeAnimation | null = null;
    
    // Only animate when stage actually changes (not on initial render)
    if (previousPlantStage !== streakData.plantStage && streakData.plantStage !== 'seedling') {
      growthAnimation = Animated.sequence([
        Animated.spring(plantGrowAnimation, {
          toValue: 1.15,
          useNativeDriver: true,
          tension: 300,
          friction: 8,
        }),
        Animated.spring(plantGrowAnimation, {
          toValue: 1,
          useNativeDriver: true,
          tension: 300,
          friction: 10,
        })
      ]);
      growthAnimation.start();
    }
    
    // Update previous stage for next comparison
    setPreviousPlantStage(streakData.plantStage);
    
    return () => {
      if (growthAnimation) growthAnimation.stop();
    };
  }, [streakData.plantStage, previousPlantStage, plantGrowAnimation]);

  // Streak status pulse animation - for at-risk status
  useEffect(() => {
    let pulseAnimation: Animated.CompositeAnimation | null = null;
    
    if (streakData.status === 'at-risk') {
      pulseAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(streakPulseAnimation, {
            toValue: 1.08,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(streakPulseAnimation, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          })
        ])
      );
      pulseAnimation.start();
    } else {
      streakPulseAnimation.setValue(1);
    }
    
    return () => {
      if (pulseAnimation) pulseAnimation.stop();
    };
  }, [streakData.status, streakPulseAnimation]);

  // Streak celebration animation - for milestones
  useEffect(() => {
    if (streakData.status === 'celebrating') {
      const celebration = Animated.sequence([
        Animated.spring(streakCelebrationAnimation, {
          toValue: 1.2,
          useNativeDriver: true,
          tension: 200,
          friction: 8,
        }),
        Animated.spring(streakCelebrationAnimation, {
          toValue: 1,
          useNativeDriver: true,
          tension: 200,
          friction: 10,
        })
      ]);
      
      celebration.start();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      streakCelebrationAnimation.setValue(1);
    }
  }, [streakData.status, streakCelebrationAnimation]);

  // Show ProfileScreen if settings is selected
  if (currentScreen === 'settings') {
    return <ProfileScreen onBackToHome={() => setCurrentScreen('home')} />;
  }

  return (
    <VintagePaperBackground style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.headerArea}>
          <View style={styles.profileHeader}>
            <View style={styles.logoContainer}>
              {/* Plant and Streak Row */}
              <View style={styles.plantStreakRow}>
                <Animated.Text 
                  style={[
                    styles.logoText, 
                    { 
                      transform: [
                        { scale: plantGrowAnimation },
                        { scale: streakCelebrationAnimation }
                      ] 
                    }
                  ]}
                >
                  {getPlantEmoji(streakData.plantStage)}
                </Animated.Text>
                
                {/* Streak Badge - Only show if streak > 0 */}
                {streakData.currentStreak > 0 && (
                  <StreakBadge 
                    streak={streakData.currentStreak}
                    status={streakData.status}
                    pulseAnimation={streakData.status === 'at-risk' ? streakPulseAnimation : undefined}
                    onPress={handleStreakPress}
                  />
                )}
              </View>

              {/* Fruit Harvest Countdown */}
              {streakData.currentStreak < 7 && streakData.currentStreak > 0 && (
                <Text style={styles.harvestCountdown}>
                  {getHarvestCountdownText(streakData.currentStreak)}
                </Text>
              )}
              
              {/* Debug Mode Status Indicator */}
              {__DEV__ && isDebugMode && (
                <View style={styles.debugIndicator}>
                  <Text style={styles.debugIndicatorText}>🐛 DEBUG</Text>
                </View>
              )}
            </View>
            <View style={styles.headerActions}>
              {/* Debug Toggle Button (Development Only) */}
              {__DEV__ && (
                <TouchableOpacity 
                  style={[styles.debugToggleButton, isDebugMode && styles.debugToggleButtonActive]}
                  onPress={() => {
                    toggleDebug();
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    // Refresh data when toggling debug mode
                    if (targetDate) {
                      fetchTodosForDate(targetDate);
                    }
                  }}
                >
                  <Text style={styles.debugToggleText}>
                    {isDebugMode ? '🐛' : '🔧'}
                  </Text>
                </TouchableOpacity>
              )}
              {isDebugMode && (
                <TouchableOpacity
                  style={styles.debugToggle}
                  onPress={() => {
                    console.log('Navigating to dev weekly report');
                    router.push('/dev-weekly-report');
                  }}
                >
                  <Text style={styles.debugToggleText}>📊</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity 
                style={styles.profileButton}
                onPress={() => setCurrentScreen('settings')}
              >
                <View style={styles.profileIcon}><Text style={styles.profileIconText}>👤</Text></View>
              </TouchableOpacity>
            </View>
          </View>

          <Text style={styles.greetingText}>{getGreeting()}</Text>

          <SecondaryGlassCard
            blur="subtle"
            opacity="light"
            style={styles.calendarGlass}
            accessibilityLabel="Calendar section"
            accessibilityHint="Swipe horizontally to view different dates"
          >
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              style={styles.calendarScroll}
              contentContainerStyle={styles.calendarContainer}
            >
              {calendarDates.map((date, index) => {
                const dateInfo = formatCalendarDate(date);
                const isSelected = targetDate === dateInfo.dateString;
                const completionRate = getDailyCompletionRate(dateInfo.dateString, dailyTodosByDate);
                const heatMapColor = getHeatMapColor(completionRate, colors);
                
                return (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.calendarDate, 
                      { backgroundColor: heatMapColor }, // Heat map background
                      dateInfo.isToday && styles.calendarDateToday, 
                      isSelected && styles.calendarDateSelected,
                    ]}
                    onPress={() => handleCalendarDatePress(dateInfo.dateString)}
                    activeOpacity={0.7}
                    accessibilityLabel={`${dateInfo.dayName} ${dateInfo.dayNumber}, ${completionRate}% completed`}
                    accessibilityHint={`Todo completion rate: ${completionRate}%`}
                  >
                    <Text style={[
                      styles.calendarDayName,
                      // Adjust text color for better contrast on dark backgrounds
                      completionRate > 50 && { color: colors.card }
                    ]}>
                      {dateInfo.dayName}
                    </Text>
                    <Text style={[
                      styles.calendarDayNumber, 
                      (dateInfo.isToday || isSelected) && styles.calendarTextActive,
                      // Adjust text color for better contrast on dark backgrounds
                      completionRate > 50 && !dateInfo.isToday && !isSelected && { color: colors.card }
                    ]}>
                      {dateInfo.dayNumber}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </SecondaryGlassCard>
        </View>

        <View style={styles.mainContent}>
          {/* Enhanced Coach Card with GlassCard */}
          {loading ? (
            <SkeletonCard type="coach" />
          ) : (
            <Animated.View style={{ opacity: coachFadeAnimation }}>
              <AccentGlassCard
                blur="medium"
                opacity="medium"
                accessibilityLabel="Coach status card"
                accessibilityHint="Shows your current progress status with motivational message"
              >
                <View style={styles.coachHeader}>
                  <Text style={styles.cardTitle}>Coach's Status</Text>
                  <View style={[styles.statusBadge, { backgroundColor: coachStatus.color }]}>
                    <Text style={styles.statusBadgeText}>Live</Text>
                  </View>
                </View>
                
                <View style={styles.coachContent}>
                  <View style={styles.coachAvatarContainer}>
                    <Animated.View 
                      style={[
                        styles.coachAvatar, 
                        { 
                          transform: [{ scale: coachScaleAnimation }],
                          backgroundColor: coachStatus.color + '20', // 20% opacity
                        }
                      ]}
                    >
                      <Text style={styles.coachEmoji}>{coachStatus.emoji}</Text>
                    </Animated.View>
                    <View style={[styles.coachPulse, { backgroundColor: coachStatus.color }]} />
                  </View>
                  
                  <View style={styles.coachMessageContainer}>
                    <Text style={styles.coachMessage}>{coachStatus.message}</Text>
                    <View style={styles.coachMetrics}>
                      <View style={styles.metricItem}>
                        <Text style={styles.metricLabel}>Today</Text>
                        <View style={[styles.metricIndicator, { backgroundColor: coachStatus.color }]} />
                      </View>
                    </View>
                  </View>
                </View>
                
                {/* Interactive coach footer */}
                <TouchableOpacity 
                  style={styles.coachInteraction}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    console.log('Coach interaction tapped');
                  }}
                  activeOpacity={0.8}
                  onPressIn={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
                >
                  <Text style={styles.coachInteractionText}>💬 Ask Coach</Text>
                  <Text style={styles.coachInteractionArrow}>→</Text>
                </TouchableOpacity>
              </AccentGlassCard>
            </Animated.View>
          )}

          {/* Enhanced Todo Card with GlassCard */}
          <Animated.View 
            style={[
              { transform: [{ scale: celebrationScale }] }
            ]}
          >
            <SecondaryGlassCard
              blur="subtle"
              opacity="medium"
              style={progressStats.isComplete && {
                borderColor: colors.success,
                borderWidth: 2,
              }}
              accessibilityLabel="Today's todo list"
              accessibilityHint={`${progressStats.completed} of ${progressStats.total} tasks completed`}
            >
              <TodoCard
                loading={loading}
                error={error}
                todosForSelectedDate={todosForSelectedDate}
                todoCompletion={todoCompletion}
                todoFadeAnimation={todoFadeAnimation}
                progressStats={progressStats}
                progressBarAnimation={progressBarAnimation}
                completionGlow={completionGlow}
                onTodoToggle={handleTodoToggle}
              />
            </SecondaryGlassCard>
          </Animated.View>
        </View>
      </ScrollView>

      {/* Floating Voice Chat Button */}
      <TouchableOpacity
        style={styles.floatingVoiceButton}
        onPress={() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
          handleVoiceChatOpen();
        }}
        activeOpacity={0.85}
        onPressIn={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
      >
        <Text style={styles.voiceButtonIcon}>🎤</Text>
      </TouchableOpacity>

      {/* Voice Chat Modals */}
      {voiceChatVisible && (
          <VoiceChatScreen visible={voiceChatVisible} mode="plan" onClose={handleVoiceChatClose} onComplete={handleVoiceCommand} />
      )}
      {reportVoiceChatVisible && (
          <VoiceChatScreen visible={reportVoiceChatVisible} mode="report" onClose={() => setReportVoiceChatVisible(false)} onComplete={handleReportCreationComplete} />
      )}

      <Modal
        visible={calendarVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setCalendarVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <CalendarScreen />
            <TouchableOpacity 
              style={styles.closeButton} 
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                setCalendarVisible(false);
              }}
              activeOpacity={0.8}
              onPressIn={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
            >
              <Text style={styles.closeButtonText}>닫기</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
      </SafeAreaView>
    </VintagePaperBackground>
  );
}

const createStyles = (colors: typeof Colors.light) => StyleSheet.create({
  container: { flex: 1 },
  safeArea: { flex: 1 },
  scrollView: { flex: 1 },
  headerArea: { 
    paddingHorizontal: Spacing.screen.paddingHorizontal, 
    paddingTop: Spacing['2xl'], 
    paddingBottom: Spacing.xl 
  },
  mainContent: {
    paddingHorizontal: Spacing.screen.paddingHorizontal,
    paddingBottom: Spacing['4xl'],
    gap: Spacing.lg,
  },
  profileHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: Spacing.lg,
    paddingTop: Spacing.md,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  logoContainer: { 
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    // Enhanced visual container
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: Spacing.layout.borderRadius.lg,
    backgroundColor: colors.primaryOpacity[10],
  },
  logoText: { 
    fontSize: 32, 
    color: colors.primary, 
    fontWeight: colors.typography.fontWeight.bold,
    // Enhanced shadow for depth
    textShadowColor: colors.primaryOpacity[20],
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  profileButton: { 
    padding: Spacing.md,
    borderRadius: Spacing.layout.borderRadius.full,
    // Add subtle hover/press state preparation
    backgroundColor: 'transparent',
  },
  profileIcon: { 
    width: 40, 
    height: 40, 
    borderRadius: 20, 
    backgroundColor: colors.card, 
    justifyContent: 'center', 
    alignItems: 'center',
    // Enhanced modern styling
    borderWidth: 2,
    borderColor: colors.neutral[200],
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: Spacing.xs },
    shadowOpacity: 0.1,
    shadowRadius: Spacing.md,
    elevation: Spacing.layout.elevation.sm,
  },
  profileIconText: { 
    fontSize: 24, 
    color: colors.primary,
    // Add subtle transform for better visual balance
    transform: [{ scale: 0.9 }],
  },
  greetingText: { 
    fontSize: colors.typography.fontSize.xl, 
    fontWeight: colors.typography.fontWeight.bold, 
    color: colors.text, 
    marginBottom: Spacing.lg,
    fontFamily: 'Inter',
    lineHeight: colors.typography.fontSize.xl * colors.typography.lineHeight.relaxed,
    letterSpacing: colors.typography.letterSpacing.normal,
    textAlign: 'center',
    // Enhanced styling for Korean greeting
    textShadowColor: colors.primaryOpacity[20],
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  goalText: { 
    fontSize: colors.typography.fontSize.lg, 
    fontWeight: colors.typography.fontWeight.medium, 
    color: colors.textSecondary, 
    marginBottom: Spacing['3xl'],
    fontFamily: 'Inter',
    lineHeight: colors.typography.fontSize.lg * colors.typography.lineHeight.relaxed,
    // Enhanced visual styling for goal display
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: colors.neutral[50],
    borderRadius: Spacing.layout.borderRadius.md,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
  },
  calendarScroll: { 
    marginTop: Spacing.xl,
    marginBottom: Spacing.md,
  },
  calendarContainer: { 
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  calendarDate: { 
    width: Spacing['5xl'], // ~48px for more compact appearance
    height: 62, // Reduced to 70% of original height (88px → 62px)
    borderRadius: Spacing.layout.borderRadius.lg, 
    backgroundColor: colors.card, 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginHorizontal: Spacing.sm, 
    paddingVertical: Spacing.sm, // Reduced from Spacing.md for compact design
    // Enhanced modern styling
    borderWidth: 1.5,
    borderColor: colors.neutral[100],
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 2 }, // Scaled down proportionally
    shadowOpacity: 0.08,
    shadowRadius: Spacing.sm, // Reduced shadow radius for smaller height
    elevation: 2,
    // Add subtle transform for better visual impact
    transform: [{ scale: 1 }],
    // Preparation for achievement indicators
    overflow: 'visible',
  },
  calendarDateToday: { 
    // Today uses heat map background but with enhanced border
    borderColor: colors.primary,
    borderWidth: 3,
    // Enhanced today styling with stronger shadow
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: Spacing.md,
    elevation: 8,
    // Add subtle pulse effect preparation
    transform: [{ scale: 1.08 }],
  },
  calendarDateSelected: { 
    // Selected uses heat map background but with distinct border
    borderWidth: 2.5, 
    borderColor: colors.info,
    // Enhanced selection styling
    shadowColor: colors.info,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: Spacing.md,
    elevation: 4,
    transform: [{ scale: 1.04 }],
  },
  calendarDayName: { 
    fontSize: colors.typography.fontSize.xs * 0.9, // Slightly smaller for compact height
    color: colors.textMuted, 
    fontFamily: 'Inter',
    fontWeight: colors.typography.fontWeight.medium,
    letterSpacing: colors.typography.letterSpacing.wide,
    textTransform: 'uppercase',
    marginBottom: Spacing.xs * 0.7, // Reduced margin for compact spacing
  },
  calendarDayNumber: { 
    fontSize: colors.typography.fontSize.lg, // Reduced from xl to lg for compact height
    fontWeight: colors.typography.fontWeight.bold, 
    color: colors.text, 
    fontFamily: 'Inter',
    lineHeight: colors.typography.fontSize.lg * colors.typography.lineHeight.tight, // Adjusted line height
  },
  calendarTextActive: { 
    color: '#ffffff', // White text for active states
  },
  
  // Heat map specific styles - optimized for GitHub-style visualization
  calendarDateHeatMap: {
    // Enhanced border radius for better heat map appearance
    borderRadius: Spacing.layout.borderRadius.md,
    // Subtle border for definition
    borderWidth: 1,
    borderColor: colors.neutral[100] + '30', // Semi-transparent border
    // Better shadow for depth
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  
  // Enhanced calendar hover states (for future interactivity)
  calendarDateHover: {
    backgroundColor: colors.neutral[100],
    borderColor: colors.neutral[300],
    transform: [{ scale: 1.02 }],
  },
  
  // Enhanced calendar container with better visual separation
  calendarWrapper: {
    backgroundColor: colors.surface,
    borderRadius: Spacing.layout.borderRadius.lg,
    paddingVertical: Spacing.lg,
    marginHorizontal: -Spacing.md, // Extend to screen edges
    paddingHorizontal: Spacing.md,
    // Subtle container styling
    borderWidth: 1,
    borderColor: colors.neutral[100],
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: Spacing.lg,
    elevation: 1,
  },
  calendarGlass: {
    marginHorizontal: -Spacing.md, // Extend to screen edges for glass effect
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
  },
  coachCard: { 
    flex: 1, 
    backgroundColor: colors.card, 
    borderRadius: Spacing.layout.borderRadius.xl, 
    padding: Spacing.xl, 
    minHeight: 320, // Increased minimum height for more engaging layout
    // Enhanced shadows and elevation
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: Spacing.sm },
    shadowOpacity: 0.1,
    shadowRadius: Spacing.lg,
    elevation: Spacing.layout.elevation.sm,
    // Subtle border for definition
    borderWidth: 1,
    borderColor: colors.neutral[200],
    // Better internal organization
    justifyContent: 'space-between',
  },
  
  // New coach header with title and status badge
  coachHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  cardTitle: { 
    fontSize: colors.typography.fontSize.lg, 
    fontWeight: colors.typography.fontWeight.bold, 
    color: colors.text, 
    fontFamily: 'Inter',
    letterSpacing: colors.typography.letterSpacing.wide,
  },
  statusBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Spacing.layout.borderRadius.full,
    minWidth: 60,
    alignItems: 'center',
  },
  statusBadgeText: {
    fontSize: colors.typography.fontSize.sm,
    fontWeight: colors.typography.fontWeight.bold,
    color: '#ffffff',
    fontFamily: 'Inter',
    textTransform: 'uppercase',
    letterSpacing: colors.typography.letterSpacing.wide,
  },
  
  // Enhanced coach content with avatar and message sections
  coachContent: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    flex: 1, 
    paddingVertical: Spacing.lg,
  },
  
  // Coach avatar container with pulse animation
  coachAvatarContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: Spacing.xl,
    position: 'relative',
  },
  coachAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    // Enhanced styling with subtle glow
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: Spacing.md,
    elevation: 4,
    borderWidth: 3,
    borderColor: '#ffffff',
  },
  coachPulse: {
    position: 'absolute',
    width: 96, // 80 + 16px padding
    height: 96,
    borderRadius: 48,
    opacity: 0.2,
    // Pulse animation preparation
    transform: [{ scale: 1 }],
  },
  coachEmoji: { 
    fontSize: 40, 
    lineHeight: 40,
  },
  
  // Enhanced message and metrics section
  coachMessageContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  coachMessage: { 
    fontSize: colors.typography.fontSize.lg, 
    color: colors.text, 
    fontWeight: colors.typography.fontWeight.medium,
    marginBottom: Spacing.md, 
    fontFamily: 'Inter',
    lineHeight: colors.typography.fontSize.lg * colors.typography.lineHeight.relaxed,
  },
  coachMetrics: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metricItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metricLabel: {
    fontSize: colors.typography.fontSize.sm,
    color: colors.textSecondary,
    fontFamily: 'Inter',
    marginRight: Spacing.sm,
  },
  metricIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  
  // Interactive coach footer
  coachInteraction: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    backgroundColor: colors.neutral[50],
    borderRadius: Spacing.layout.borderRadius.lg,
    marginTop: Spacing.md,
    // Enhanced interaction feedback
    borderWidth: 1,
    borderColor: colors.neutral[100],
    // Better shadow for press feedback
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    // Touch target size
    minHeight: 44,
  },
  coachInteractionText: {
    fontSize: colors.typography.fontSize.base,
    color: colors.text,
    fontWeight: colors.typography.fontWeight.medium,
    fontFamily: 'Inter',
  },
  coachInteractionArrow: {
    fontSize: colors.typography.fontSize.lg,
    color: colors.primary,
    fontWeight: colors.typography.fontWeight.bold,
  },
  todoCard: { 
    flex: 1, 
    backgroundColor: colors.card, 
    borderRadius: Spacing.layout.borderRadius.xl, 
    padding: Spacing.xl, 
    minHeight: 280, // Increased for progress elements
    // Enhanced shadows and elevation
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: Spacing.sm },
    shadowOpacity: 0.05,
    shadowRadius: Spacing.lg,
    elevation: Spacing.layout.elevation.sm,
    // Subtle border for definition
    borderWidth: 1,
    borderColor: colors.neutral[200],
    // Animation support
    overflow: 'visible',
  },
  
  // Todo card header with progress
  todoCardHeader: {
    marginBottom: Spacing.lg,
  },
  
  cardTitleComplete: {
    color: colors.success,
  },
  
  // Progress container and elements
  progressContainer: {
    marginTop: Spacing.md,
    alignItems: 'flex-end',
  },
  
  progressText: {
    fontSize: colors.typography.fontSize.sm,
    color: colors.textSecondary,
    fontWeight: colors.typography.fontWeight.medium,
    fontFamily: 'Inter',
    marginBottom: Spacing.xs,
  },
  
  progressBarContainer: {
    width: '100%',
    height: 6,
    backgroundColor: colors.neutral[200],
    borderRadius: 3,
    overflow: 'hidden',
    position: 'relative',
    marginBottom: Spacing.xs,
  },
  
  progressBar: {
    height: '100%',
    borderRadius: 3,
    // Smooth transitions
    transition: 'width 0.8s ease-in-out',
  },
  
  // Glow effect for completion
  progressGlow: {
    position: 'absolute',
    top: -2,
    left: -2,
    right: -2,
    bottom: -2,
    borderRadius: 5,
    // Subtle glow effect
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  
  // Completion badge
  completionBadge: {
    backgroundColor: colors.success,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Spacing.layout.borderRadius.full,
    alignSelf: 'flex-end',
  },
  
  completionText: {
    color: '#ffffff',
    fontSize: colors.typography.fontSize.sm,
    fontWeight: colors.typography.fontWeight.bold,
    fontFamily: 'Inter',
  },
  todoScrollView: { flex: 1 },
  
  // Enhanced todo item container with elevation support
  todoItemContainer: {
    backgroundColor: 'transparent',
    borderRadius: Spacing.layout.borderRadius.md,
    marginVertical: Spacing.xs,
    // Shadow preparation for elevation animation
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: Spacing.sm,
    elevation: 1,
  },
  
  todoItem: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingVertical: Spacing.lg, 
    paddingHorizontal: Spacing.sm,
    borderBottomWidth: 1, 
    borderBottomColor: colors.neutral[100],
    backgroundColor: colors.card,
    borderRadius: Spacing.layout.borderRadius.md,
    // Enhanced spacing and alignment
    minHeight: 60,
  },
  
  // Enhanced checkbox with better proportions and styling
  todoCheckbox: { 
    width: 24, 
    height: 24, 
    borderRadius: Spacing.layout.borderRadius.sm, 
    borderWidth: 2.5, 
    marginRight: Spacing.lg, 
    justifyContent: 'center', 
    alignItems: 'center',
    // Enhanced shadow and styling
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  
  checkmarkText: { 
    color: '#ffffff', 
    fontSize: 14, 
    fontWeight: colors.typography.fontWeight.bold,
    lineHeight: 14,
  },
  
  // New text container for strikethrough effect
  todoTextContainer: {
    flex: 1,
    position: 'relative',
    justifyContent: 'center',
  },
  
  todoText: { 
    fontSize: colors.typography.fontSize.base, 
    fontWeight: colors.typography.fontWeight.medium, 
    color: colors.text, 
    fontFamily: 'Inter',
    lineHeight: colors.typography.fontSize.base * colors.typography.lineHeight.relaxed,
    // Remove default text decoration - we'll use custom animated line
  },
  
  todoTextCompleted: { 
    color: colors.textSecondary,
    // Remove textDecorationLine - using custom animated strikethrough
  },
  
  // Custom animated strikethrough line
  strikethroughLine: {
    position: 'absolute',
    height: 2,
    top: '50%',
    left: 0,
    borderRadius: 1,
    // Enhanced visual styling
    opacity: 0.8,
  },
  emptyTodoContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyTodoText: { fontSize: 14, color: colors.textSecondary, fontFamily: 'Inter' },
  modalContainer: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: colors.background, borderRadius: 20, padding: 20, elevation: 5, minWidth: 350, maxWidth: '90%', maxHeight: '90%' },
  closeButton: { marginTop: 16, alignSelf: 'center', paddingVertical: 8, paddingHorizontal: 20, backgroundColor: colors.primary, borderRadius: 20 },
  closeButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  goalLoadingContainer: {
    marginBottom: Spacing['3xl'],
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    backgroundColor: colors.neutral[50],
    borderRadius: Spacing.layout.borderRadius.md,
    borderLeftWidth: 4,
    borderLeftColor: colors.neutral[300],
  },
  goalSkeletonLine1: {
    marginBottom: Spacing.md,
  },
  goalSkeletonLine2: {
    marginBottom: 0,
  },
  floatingVoiceButton: {
    position: 'absolute',
    bottom: Spacing['7xl'] + Spacing['4xl'], // ~100px
    right: Spacing.screen.paddingHorizontal,
    width: Spacing.layout.floatingButton,
    height: Spacing.layout.floatingButton,
    borderRadius: Spacing.layout.floatingButton / 2,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    // Enhanced floating effect with better shadows
    shadowColor: colors.primary,
    shadowOffset: {
      width: 0,
      height: Spacing.md + 2, // Slightly higher shadow
    },
    shadowOpacity: 0.35,
    shadowRadius: Spacing.xl + 4,
    elevation: Spacing.layout.elevation.lg + 2,
    // Better border for press feedback
    borderWidth: 3,
    borderColor: colors.primaryLight,
    // Ensure touch target is large enough
    minWidth: 56,
    minHeight: 56,
    // Prepare for press animations
    overflow: 'visible',
  },
  voiceButtonIcon: {
    fontSize: 28,
    textAlign: 'center',
    lineHeight: 28,
  },
  // Debug UI Styles (Development Only)
  debugIndicator: {
    marginLeft: Spacing.sm,
    paddingHorizontal: Spacing.xs,
    paddingVertical: Spacing.xs / 2,
    backgroundColor: colors.warning + '20',
    borderRadius: Spacing.layout.borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.warning,
  },
  debugIndicatorText: {
    fontSize: colors.typography.fontSize.xs,
    color: colors.warning,
    fontWeight: colors.typography.fontWeight.bold,
    letterSpacing: colors.typography.letterSpacing.wide,
  },
  debugToggleButton: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.neutral[100],
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.neutral[300],
  },
  debugToggleButtonActive: {
    backgroundColor: colors.warning + '20',
    borderColor: colors.warning,
  },
  debugToggleText: {
    fontSize: 14,
  },
  debugToggle: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: colors.neutral[100],
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: colors.neutral[300],
  },
  
  // Streak system styles
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: Spacing.sm,
    paddingHorizontal: Spacing.md, // Increased from xs + 2
    paddingVertical: Spacing.sm, // Increased from xs
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: Spacing.layout.borderRadius.md, // Increased from sm
    borderWidth: 2, // Increased from 1.5
    minHeight: 32, // Increased from 24
    // Enhanced glass effect
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 }, // Increased shadow
    shadowOpacity: 0.15, // Increased opacity
    shadowRadius: 4, // Increased radius
    elevation: 4, // Increased elevation
  },
  
  streakIcon: {
    fontSize: 14, // Increased from 11
    marginRight: Spacing.xs,
    lineHeight: 14,
  },
  
  streakCount: {
    fontSize: colors.typography.fontSize.sm, // Increased from xs
    fontWeight: colors.typography.fontWeight.bold,
    fontFamily: 'Inter',
    letterSpacing: 0.5,
  },
  
  streakBadgeInner: {
    flexDirection: 'row', 
    alignItems: 'center',
  },

  // Plant and streak row styles
  plantStreakRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xs,
  },

  // Harvest countdown styles
  harvestCountdown: {
    fontSize: colors.typography.fontSize.sm * 0.7,
    color: colors.success,
    fontWeight: colors.typography.fontWeight.medium,
    fontFamily: 'Inter',
    textAlign: 'center',
    marginTop: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    // Subtle glow effect
    textShadowColor: colors.success + '30',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
}); 


