import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useEffect, useRef, useState, useMemo } from 'react';
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
import CalendarScreen from '../backend/calendar/calendar';
import { generateDailyFeedback, parsePlanModificationCommand } from '../backend/hwirang/gemini';
import { getActivePlan } from '../backend/supabase/habits';
import { createReport } from '../backend/supabase/reports';
import { useHabitStore } from '../lib/habitStore';
import { DailyTodo, Plan } from '../types/habit';
import { Colors } from '../constants/Colors';
import { Spacing } from '../constants/Spacing';
import { useColorScheme } from '../hooks/useColorScheme';
import ProfileScreen from './ProfileScreen';
import { SkeletonCard, SkeletonText, SkeletonTodoList } from './SkeletonLoaders';
import VoiceChatScreen from './VoiceChatScreen';

const { width } = Dimensions.get('window');

// Helper function to parse duration strings into days
const parseDurationToDays = (duration: string): number => {
  if (duration.includes('개월')) {
    const months = parseInt(duration.replace('개월', '').trim(), 10);
    return isNaN(months) ? 0 : months * 30; // Approximation
  }
  if (duration.includes('주')) {
    const weeks = parseInt(duration.replace('주', '').trim(), 10);
    return isNaN(weeks) ? 0 : weeks * 7;
  }
  if (duration.includes('일')) {
    const days = parseInt(duration.replace('일', '').trim(), 10);
    return isNaN(days) ? 0 : days;
  }
  return 0;
};

interface HomeScreenProps {
  selectedDate?: string;
}

// Coach status based on achievement rate
interface CoachStatus {
  emoji: string;
  message: string;
  color: string;
}

// Animated Todo Item Component
interface AnimatedTodoItemProps {
  todo: DailyTodo;
  isCompleted: boolean;
  onToggle: () => void;
}

const AnimatedTodoItem = ({ todo, isCompleted, onToggle }: AnimatedTodoItemProps) => {
  const scaleAnimation = useRef(new Animated.Value(1)).current;
  const checkmarkScale = useRef(new Animated.Value(isCompleted ? 1 : 0)).current;
  const textOpacity = useRef(new Animated.Value(isCompleted ? 0.6 : 1)).current;
  const checkboxColorAnimation = useRef(new Animated.Value(isCompleted ? 1 : 0)).current;
  const strikethroughWidth = useRef(new Animated.Value(isCompleted ? 100 : 0)).current;
  const itemElevation = useRef(new Animated.Value(0)).current;

  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];

  const handlePress = () => {
    // Enhanced scale animation with bounce
    Animated.sequence([
      Animated.spring(scaleAnimation, {
        toValue: 1.02,
        useNativeDriver: true,
        tension: 400,
        friction: 6,
      }),
      Animated.spring(scaleAnimation, {
        toValue: 1,
        useNativeDriver: true,
        tension: 400,
        friction: 8,
      })
    ]).start();

    // Subtle elevation animation for press feedback
    Animated.sequence([
      Animated.timing(itemElevation, {
        toValue: 1,
        duration: 100,
        useNativeDriver: false,
      }),
      Animated.timing(itemElevation, {
        toValue: 0,
        duration: 300,
        useNativeDriver: false,
      })
    ]).start();

    // Enhanced completion/incompletion animations
    if (!isCompleted) {
      // Completing task - enhanced animations
      Animated.parallel([
        Animated.spring(checkmarkScale, {
          toValue: 1,
          useNativeDriver: true,
          tension: 500,
          friction: 4, // Bouncier animation
        }),
        Animated.timing(checkboxColorAnimation, {
          toValue: 1,
          duration: 250,
          useNativeDriver: false,
        }),
        Animated.timing(textOpacity, {
          toValue: 0.6,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(strikethroughWidth, {
          toValue: 100,
          duration: 400,
          useNativeDriver: false,
        })
      ]).start();
    } else {
      // Uncompleting task - reverse animations
      Animated.parallel([
        Animated.spring(checkmarkScale, {
          toValue: 0,
          useNativeDriver: true,
          tension: 400,
          friction: 6,
        }),
        Animated.timing(checkboxColorAnimation, {
          toValue: 0,
          duration: 200,
          useNativeDriver: false,
        }),
        Animated.timing(textOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(strikethroughWidth, {
          toValue: 0,
          duration: 200,
          useNativeDriver: false,
        })
      ]).start();
    }

    onToggle();
  };

  // Interpolate checkbox background color
  const checkboxBackgroundColor = checkboxColorAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: ['transparent', colors.primary]
  });

  const checkboxBorderColor = checkboxColorAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [colors.textSecondary, colors.primary]
  });

  const itemShadowOpacity = itemElevation.interpolate({
    inputRange: [0, 1],
    outputRange: [0.05, 0.15]
  });

  const strikethroughWidthPercentage = strikethroughWidth.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%']
  });

  return (
    <Animated.View 
      style={[
        styles.todoItemContainer,
        { 
          transform: [{ scale: scaleAnimation }],
          shadowOpacity: itemShadowOpacity,
        }
      ]}
    >
      <TouchableOpacity
        style={styles.todoItem}
        onPress={handlePress}
        activeOpacity={0.9}
      >
        <Animated.View 
          style={[
            styles.todoCheckbox, 
            { 
              backgroundColor: checkboxBackgroundColor,
              borderColor: checkboxBorderColor,
            }
          ]}
        >
          <Animated.Text 
            style={[
              styles.checkmarkText,
              { 
                transform: [{ scale: checkmarkScale }],
                opacity: checkmarkScale
              }
            ]}
          >
            ✓
          </Animated.Text>
        </Animated.View>
        
        <View style={styles.todoTextContainer}>
          <Animated.Text 
            style={[
              styles.todoText, 
              isCompleted && styles.todoTextCompleted,
              { opacity: textOpacity }
            ]} 
            numberOfLines={2} 
            ellipsizeMode="tail"
          >
            {todo.description}
          </Animated.Text>
          
          {/* Animated strikethrough line */}
          <Animated.View 
            style={[
              styles.strikethroughLine,
              {
                width: strikethroughWidthPercentage,
                backgroundColor: colors.textSecondary,
              }
            ]}
          />
        </View>
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [todoCompletion, setTodoCompletion] = useState<{ [key: string]: boolean }>({});
  const [effectiveStartDate, setEffectiveStartDate] = useState<string | null>(null);
  const [calendarVisible, setCalendarVisible] = useState(false);
  const [voiceChatVisible, setVoiceChatVisible] = useState(false);
  const [reportVoiceChatVisible, setReportVoiceChatVisible] = useState(false);

  // Use selectedDate from props if provided, otherwise use internal state
  const targetDate = selectedDate || internalSelectedDate;

  // Animation for coach status
  const coachScaleAnimation = useRef(new Animated.Value(1)).current;
  const [previousCoachStatus, setPreviousCoachStatus] = useState<CoachStatus | null>(null);
  
  // Animations for smooth content loading
  const goalFadeAnimation = useRef(new Animated.Value(0)).current;
  const todoFadeAnimation = useRef(new Animated.Value(0)).current;
  const coachFadeAnimation = useRef(new Animated.Value(0)).current;
  
  // Progress and celebration animations
  const progressBarAnimation = useRef(new Animated.Value(0)).current;
  const celebrationScale = useRef(new Animated.Value(1)).current;
  const completionGlow = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const fetchPlan = async () => {
      try {
        setLoading(true);
        const fetchedPlan = await getActivePlan();
        if (fetchedPlan) {
          setPlan(fetchedPlan);
          setEffectiveStartDate(fetchedPlan.start_date);
          const initialCompletion: { [key: string]: boolean } = {};
          fetchedPlan.milestones.forEach(m => {
            m.daily_todos.forEach(todo => {
              initialCompletion[todo.id.toString()] = todo.is_completed;
            });
          });
          setTodoCompletion(initialCompletion);
        } else {
          router.replace('/goal-setting');
        }
      } catch (e) {
        setError('Failed to fetch habit plan.');
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    if (!plan) {
        fetchPlan();
    }
  }, [plan, router]);

  const getCoachStatus = (): CoachStatus => {
    const todos = getTodosForSelectedDate();
    if (!plan || todos.length === 0) {
      return { emoji: '😊', message: '오늘도 화이팅!', color: '#4CAF50' };
    }
    // Updated to use the new todo completion state
    const completedCount = todos.filter(todo => todoCompletion[todo.id.toString()]).length;
    const avgRate = completedCount / todos.length;
    if (avgRate >= 1) return { emoji: '🥳', message: '완벽한 하루!', color: '#4CAF50' };
    if (avgRate >= 0.7) return { emoji: '😊', message: '정말 잘하고 있어요!', color: '#8BC34A' };
    if (avgRate >= 0.5) return { emoji: '😌', message: '꾸준히 실천 중이네요', color: '#FFC107' };
    if (avgRate > 0) return { emoji: '😐', message: '조금만 더 힘내요!', color: '#FF9800' };
    return { emoji: '🤔', message: '시작이 반이에요!', color: '#9E9E9E' };
  };

  const getGreeting = (): string => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning.';
    if (hour < 18) return 'Good afternoon.';
    return 'Good evening.';
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

  const getTodosForSelectedDate = (): DailyTodo[] => {
    if (!plan || !effectiveStartDate) return [];
    const selected = new Date(targetDate);
    const startDate = new Date(effectiveStartDate);
    if (selected < startDate) return [];
    const diffDays = Math.floor((selected.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    let dayCounter = 0;
    for (const milestone of plan.milestones) {
      const durationInDays = parseDurationToDays(milestone.duration);
      if (diffDays >= dayCounter && diffDays < dayCounter + durationInDays) {
        return milestone.daily_todos;
      }
      dayCounter += durationInDays;
    }
    return [];
  };

  const handleTodoToggle = (todoId: number): void => {
    const todoKey = todoId.toString();
    const willBeCompleted = !todoCompletion[todoKey];
    
    // Haptic feedback for satisfying feel
    if (willBeCompleted) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    
    setTodoCompletion(prev => ({ ...prev, [todoKey]: !prev[todoKey] }));
    // Here you would also add a call to a Supabase function to update `is_completed` in the DB.
    // e.g., updateTodoStatus(todoId, willBeCompleted);
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

  const handleCalendarDatePress = (dateString: string): void => {
    setInternalSelectedDate(dateString);
  };

  const handleVoiceChatOpen = (): void => {
    setVoiceChatVisible(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const handleVoiceChatClose = (): void => {
    setVoiceChatVisible(false);
  };

  const handleReportCreationComplete = async (data: any) => {
    setReportVoiceChatVisible(false);
    if (!data || !data.transcript) {
      Alert.alert('오류', '리포트 내용을 인식하지 못했습니다.');
      return;
    }
    try {
      const userSummary = data.transcript.split('\n').pop() || '';
      const today = new Date();
      const todayTodos = getTodosForSelectedDate();
      const completedCount = todayTodos.filter(t => todoCompletion[t.id.toString()]).length;
      const achievementScore = todayTodos.length > 0 ? Math.round((completedCount / todayTodos.length) * 10) : 0;
      const feedback = await generateDailyFeedback(userSummary, achievementScore, todayTodos);
      await createReport({ report_date: today.toISOString().split('T')[0], achievement_score: achievementScore, ai_coach_feedback: [feedback], daily_activities: { todos: todayTodos }, user_summary: userSummary });
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

  const coachStatus = useMemo(() => getCoachStatus(), [plan, todoCompletion, targetDate]);
  const calendarDates = useMemo(() => getCalendarDates(), []);
  const todosForSelectedDate = useMemo(() => getTodosForSelectedDate(), [plan, effectiveStartDate, targetDate]);
  
  // Calculate progress statistics
  const getProgressStats = () => {
    const todos = todosForSelectedDate;
    if (todos.length === 0) return { completed: 0, total: 0, percentage: 0, isComplete: false };
    
    const completedCount = todos.filter(todo => todoCompletion[todo.id.toString()]).length;
    const percentage = Math.round((completedCount / todos.length) * 100);
    const isComplete = percentage === 100;
    
    return {
      completed: completedCount,
      total: todos.length,
      percentage,
      isComplete
    };
  };
  
  const progressStats = getProgressStats();

  // Animate coach when status changes
  useEffect(() => {
    if (previousCoachStatus && previousCoachStatus.emoji !== coachStatus.emoji) {
      // Coach status changed! Trigger bounce animation
      Animated.sequence([
        Animated.spring(coachScaleAnimation, {
          toValue: 1.2,
          useNativeDriver: true,
          tension: 300,
          friction: 8,
        }),
        Animated.spring(coachScaleAnimation, {
          toValue: 1,
          useNativeDriver: true,
          tension: 300,
          friction: 8,
        })
      ]).start();
    }
    setPreviousCoachStatus(coachStatus);
  }, [coachStatus.emoji, previousCoachStatus?.emoji]);

  // Animate content when loading completes
  useEffect(() => {
    if (!loading) {
      // Stagger the animations for a more polished feel
      Animated.stagger(150, [
        Animated.timing(goalFadeAnimation, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(coachFadeAnimation, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(todoFadeAnimation, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [loading]);

  // Animate progress bar based on completion percentage
  useEffect(() => {
    Animated.timing(progressBarAnimation, {
      toValue: progressStats.percentage,
      duration: 800,
      useNativeDriver: false,
    }).start();
  }, [progressStats.percentage]);

  // Trigger celebration animation when 100% complete
  useEffect(() => {
    if (progressStats.isComplete && progressStats.total > 0) {
      // Celebration sequence
      Animated.sequence([
        Animated.spring(celebrationScale, {
          toValue: 1.05,
          useNativeDriver: true,
          tension: 300,
          friction: 6,
        }),
        Animated.spring(celebrationScale, {
          toValue: 1,
          useNativeDriver: true,
          tension: 300,
          friction: 8,
        }),
      ]).start();

      // Glow effect for completion
      Animated.sequence([
        Animated.timing(completionGlow, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(completionGlow, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ]).start();

      // Enhanced haptic feedback for completion
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      // Reset completion glow when not complete
      completionGlow.setValue(0);
    }
  }, [progressStats.isComplete, progressStats.total]);

  // Show ProfileScreen if settings is selected
  if (currentScreen === 'settings') {
    return <ProfileScreen onBackToHome={() => setCurrentScreen('home')} />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.headerArea}>
          <View style={styles.profileHeader}>
            <View style={styles.logoContainer}>
              <Text style={styles.logoText}>🌱</Text>
            </View>
            <TouchableOpacity 
              style={styles.profileButton}
              onPress={() => setCurrentScreen('settings')}
            >
              <View style={styles.profileIcon}><Text style={styles.profileIconText}>👤</Text></View>
            </TouchableOpacity>
          </View>

          <Text style={styles.greetingText}>{getGreeting()}</Text>
          
          {/* Enhanced Goal Text Loading */}
          {loading ? (
            <View style={styles.goalLoadingContainer}>
              <SkeletonText width="90%" height={18} style={styles.goalSkeletonLine1} />
              <SkeletonText width="60%" height={18} style={styles.goalSkeletonLine2} />
            </View>
          ) : (
            <Animated.View style={{ opacity: goalFadeAnimation }}>
              <Text style={styles.goalText}>
                {plan?.plan_title || '진행 중인 목표가 없습니다.'} 
              </Text>
            </Animated.View>
          )}

          <View style={styles.calendarWrapper}>
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              style={styles.calendarScroll}
              contentContainerStyle={styles.calendarContainer}
            >
              {calendarDates.map((date, index) => {
                const dateInfo = formatCalendarDate(date);
                const isSelected = targetDate === dateInfo.dateString;
                // Mock achievement data (in real app, this would come from habit completion data)
                const hasAchievement = Math.random() > 0.6; // 40% chance for demo
                const hasStreak = Math.random() > 0.7; // 30% chance for demo
                
                return (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.calendarDate, 
                      dateInfo.isToday && styles.calendarDateToday, 
                      isSelected && styles.calendarDateSelected,
                      hasAchievement && styles.calendarDateWithAchievement
                    ]}
                    onPress={() => handleCalendarDatePress(dateInfo.dateString)}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.calendarDayName}>{dateInfo.dayName}</Text>
                    <Text style={[styles.calendarDayNumber, (dateInfo.isToday || isSelected) && styles.calendarTextActive]}>
                      {dateInfo.dayNumber}
                    </Text>
                    
                    {/* Achievement indicator dot */}
                    {hasAchievement && !dateInfo.isToday && (
                      <View style={styles.achievementIndicator} />
                    )}
                    
                    {/* Streak indicator bar */}
                    {hasStreak && !dateInfo.isToday && (
                      <View style={styles.streakIndicator} />
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>

        <View style={styles.mainContent}>
          {/* Enhanced Coach Card Loading */}
          {loading ? (
            <SkeletonCard type="coach" />
          ) : (
            <Animated.View style={[styles.coachCard, { opacity: coachFadeAnimation }]}>
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
            </Animated.View>
          )}

          {/* Enhanced Todo Card Loading */}
          <Animated.View 
            style={[
              styles.todoCard,
              { transform: [{ scale: celebrationScale }] },
              progressStats.isComplete && {
                borderColor: colors.success,
                borderWidth: 2,
              }
            ]}
          >
            <View style={styles.todoCardHeader}>
              <Text style={[styles.cardTitle, progressStats.isComplete && styles.cardTitleComplete]}>
                Today's To-Do
              </Text>
              
              {progressStats.total > 0 && (
                <View style={styles.progressContainer}>
                  <Text style={styles.progressText}>
                    {progressStats.completed}/{progressStats.total}
                  </Text>
                  <View style={styles.progressBarContainer}>
                    <Animated.View 
                      style={[
                        styles.progressBar,
                        {
                          width: progressBarAnimation.interpolate({
                            inputRange: [0, 100],
                            outputRange: ['0%', '100%'],
                            extrapolate: 'clamp'
                          }),
                          backgroundColor: progressStats.isComplete ? colors.success : colors.primary,
                        }
                      ]}
                    />
                    
                    {/* Completion glow effect */}
                    {progressStats.isComplete && (
                      <Animated.View 
                        style={[
                          styles.progressGlow,
                          {
                            opacity: completionGlow,
                            backgroundColor: colors.success,
                          }
                        ]}
                      />
                    )}
                  </View>
                  
                  {progressStats.isComplete && (
                    <View style={styles.completionBadge}>
                      <Text style={styles.completionText}>🎉 Perfect!</Text>
                    </View>
                  )}
                </View>
              )}
            </View>
            
            <ScrollView style={styles.todoScrollView} showsVerticalScrollIndicator={false}>
              {loading ? (
                <SkeletonTodoList count={3} />
              ) : error ? (
                <Text style={styles.emptyTodoText}>{error}</Text>
              ) : todosForSelectedDate.length > 0 ? (
                <Animated.View style={{ opacity: todoFadeAnimation }}>
                  {todosForSelectedDate.map((todo) => {
                    const todoKey = todo.id.toString();
                    const isCompleted = todoCompletion[todoKey];
                    return (
                      <AnimatedTodoItem
                        key={todo.id} // Use the unique ID for the key
                        todo={todo}
                        isCompleted={isCompleted}
                        onToggle={() => handleTodoToggle(todo.id)}
                      />
                    );
                  })}
                </Animated.View>
              ) : (
                <Animated.View style={[styles.emptyTodoContainer, { opacity: todoFadeAnimation }]}>
                  <Text style={styles.emptyTodoText}>오늘의 할 일이 없습니다.</Text>
                </Animated.View>
              )}
            </ScrollView>
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
  );
}

const createStyles = (colors: typeof Colors.light) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scrollView: { flex: 1 },
  headerArea: { 
    paddingHorizontal: Spacing.screen.paddingHorizontal, 
    paddingTop: Spacing['5xl'], 
    paddingBottom: Spacing.xl 
  },
  profileHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: Spacing['3xl'],
    paddingTop: Spacing.md,
  },
  logoContainer: { 
    flexDirection: 'row', 
    alignItems: 'center',
    // Enhanced visual container
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
    borderRadius: Spacing.layout.borderRadius.lg,
    backgroundColor: colors.primaryOpacity[10],
  },
  logoText: { 
    fontSize: 40, 
    color: colors.primary, 
    fontWeight: colors.typography.fontWeight.bold,
    // Enhanced shadow for depth
    textShadowColor: colors.primaryOpacity[20],
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
    // Add subtle scaling transform for better visual impact
    transform: [{ scale: 1.1 }],
  },
  profileButton: { 
    padding: Spacing.md,
    borderRadius: Spacing.layout.borderRadius.full,
    // Add subtle hover/press state preparation
    backgroundColor: 'transparent',
  },
  profileIcon: { 
    width: 48, 
    height: 48, 
    borderRadius: 24, 
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
    fontSize: 28, 
    color: colors.primary,
    // Add subtle transform for better visual balance
    transform: [{ scale: 0.9 }],
  },
  greetingText: { 
    fontSize: colors.typography.fontSize['3xl'], 
    fontWeight: colors.typography.fontWeight.bold, 
    color: colors.text, 
    marginBottom: Spacing.xl,
    fontFamily: 'Inter',
    lineHeight: colors.typography.fontSize['3xl'] * colors.typography.lineHeight.tight,
    letterSpacing: colors.typography.letterSpacing.tight,
    // Add subtle gradient text effect preparation
    textAlign: 'left',
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
    width: Spacing['6xl'] + Spacing.sm, // ~64px for better proportion
    height: 88, 
    borderRadius: Spacing.layout.borderRadius.lg, 
    backgroundColor: colors.card, 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginHorizontal: Spacing.sm, 
    paddingVertical: Spacing.md,
    // Enhanced modern styling
    borderWidth: 1.5,
    borderColor: colors.neutral[100],
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: Spacing.md,
    elevation: 2,
    // Add subtle transform for better visual impact
    transform: [{ scale: 1 }],
    // Preparation for achievement indicators
    overflow: 'visible',
  },
  calendarDateToday: { 
    backgroundColor: colors.primary,
    borderColor: colors.primaryLight,
    borderWidth: 2,
    // Enhanced today styling
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: Spacing.lg,
    elevation: 6,
    // Add subtle pulse effect preparation
    transform: [{ scale: 1.05 }],
  },
  calendarDateSelected: { 
    borderWidth: 2.5, 
    borderColor: colors.primary,
    backgroundColor: colors.primaryOpacity[10],
    // Enhanced selection styling
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: Spacing.md,
    elevation: 3,
    transform: [{ scale: 1.02 }],
  },
  calendarDayName: { 
    fontSize: colors.typography.fontSize.xs, 
    color: colors.textMuted, 
    fontFamily: 'Inter',
    fontWeight: colors.typography.fontWeight.medium,
    letterSpacing: colors.typography.letterSpacing.wide,
    textTransform: 'uppercase',
    marginBottom: Spacing.xs,
  },
  calendarDayNumber: { 
    fontSize: colors.typography.fontSize.xl, 
    fontWeight: colors.typography.fontWeight.bold, 
    color: colors.text, 
    fontFamily: 'Inter',
    lineHeight: colors.typography.fontSize.xl * colors.typography.lineHeight.tight,
  },
  calendarTextActive: { 
    color: '#ffffff', // White text for active states
  },
  
  // Achievement indicators for calendar dates
  calendarDateWithAchievement: {
    borderTopRightRadius: Spacing.layout.borderRadius.lg,
    // Add achievement indicator dot
    position: 'relative',
  },
  achievementIndicator: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.success,
    borderWidth: 2,
    borderColor: colors.card,
    // Achievement glow effect
    shadowColor: colors.success,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 4,
  },
  streakIndicator: {
    position: 'absolute',
    bottom: -2,
    left: '50%',
    marginLeft: -8,
    width: 16,
    height: 3,
    borderRadius: 2,
    backgroundColor: colors.warning,
    // Streak glow effect
    shadowColor: colors.warning,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 3,
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
  mainContent: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    paddingHorizontal: Spacing.screen.paddingHorizontal, 
    paddingBottom: Spacing['5xl'],
    gap: Spacing.xl,
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
}); 
