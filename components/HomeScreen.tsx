import * as Haptics from 'expo-haptics';
import { useEffect, useRef, useState } from 'react';
import {
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
import { getActivePlan } from '../backend/supabase/habits';
import { DailyTodo, Plan } from '../types/habit';
import ProfileScreen from './ProfileScreen';
import { SkeletonCard, SkeletonText, SkeletonTodoList } from './SkeletonLoaders';

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
  onDayPress?: (day: number) => void;
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

  const handlePress = () => {
    // Scale animation for the whole item
    Animated.sequence([
      Animated.spring(scaleAnimation, {
        toValue: 1.05,
        useNativeDriver: true,
        tension: 300,
        friction: 8,
      }),
      Animated.spring(scaleAnimation, {
        toValue: 1,
        useNativeDriver: true,
        tension: 300,
        friction: 8,
      })
    ]).start();

    // Checkmark and text animations
    if (!isCompleted) {
      // Completing task
      Animated.parallel([
        Animated.spring(checkmarkScale, {
          toValue: 1,
          useNativeDriver: true,
          tension: 300,
          friction: 6,
        }),
        Animated.timing(textOpacity, {
          toValue: 0.6,
          duration: 200,
          useNativeDriver: true,
        })
      ]).start();
    } else {
      // Uncompleting task
      Animated.parallel([
        Animated.spring(checkmarkScale, {
          toValue: 0,
          useNativeDriver: true,
          tension: 300,
          friction: 6,
        }),
        Animated.timing(textOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        })
      ]).start();
    }

    onToggle();
  };

  return (
    <Animated.View style={[{ transform: [{ scale: scaleAnimation }] }]}>
      <TouchableOpacity
        style={styles.todoItem}
        onPress={handlePress}
        activeOpacity={0.8}
      >
        <View style={[styles.todoCheckbox, isCompleted && styles.todoCheckedBox]}>
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
        </View>
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
      </TouchableOpacity>
    </Animated.View>
  );
};

export default function HomeScreen({ onDayPress }: HomeScreenProps) {
  const [currentScreen, setCurrentScreen] = useState<'home' | 'settings'>('home');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [plan, setPlan] = useState<Plan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [todoCompletion, setTodoCompletion] = useState<{ [key: string]: boolean }>({});
  const [effectiveStartDate, setEffectiveStartDate] = useState<string | null>(null);
  const [calendarVisible, setCalendarVisible] = useState(false);
  
  // Animation for coach status
  const coachScaleAnimation = useRef(new Animated.Value(1)).current;
  const [previousCoachStatus, setPreviousCoachStatus] = useState<CoachStatus | null>(null);
  
  // Animations for smooth content loading
  const goalFadeAnimation = useRef(new Animated.Value(0)).current;
  const todoFadeAnimation = useRef(new Animated.Value(0)).current;
  const coachFadeAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const fetchPlan = async () => {
      try {
        setLoading(true);
        const fetchedPlan = await getActivePlan(); // <-- Use the new function
        setPlan(fetchedPlan);

        if (fetchedPlan) {
          // The start date from the new Plan object is considered the effective start date.
          setEffectiveStartDate(fetchedPlan.start_date);

          // Initialize todo completion status using the unique ID of each todo.
          const initialCompletion: { [key: string]: boolean } = {};
          fetchedPlan.milestones.forEach(m => {
            m.daily_todos.forEach(todo => {
              initialCompletion[todo.id.toString()] = todo.is_completed;
            });
          });
          setTodoCompletion(initialCompletion);
        }
      } catch (e) {
        setError('Failed to fetch habit plan.');
        console.error(e);
      } finally {
        setLoading(false);
      }
    };

    fetchPlan();
  }, []);

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
    const selected = new Date(selectedDate);
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
    setSelectedDate(dateString);
    if (onDayPress) {
      const day = parseInt(dateString.split('-')[2], 10);
      onDayPress(day);
    }
  };

  const coachStatus = getCoachStatus();
  const calendarDates = getCalendarDates();
  const todosForSelectedDate = getTodosForSelectedDate();

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
  }, [coachStatus.emoji, coachStatus.message]);

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

  // Show ProfileScreen if settings is selected
  if (currentScreen === 'settings') {
    return <ProfileScreen />;
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

          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.calendarScroll}
            contentContainerStyle={styles.calendarContainer}
          >
            {calendarDates.map((date, index) => {
              const dateInfo = formatCalendarDate(date);
              const isSelected = selectedDate === dateInfo.dateString;
              return (
                <TouchableOpacity
                  key={index}
                  style={[styles.calendarDate, dateInfo.isToday && styles.calendarDateToday, isSelected && styles.calendarDateSelected]}
                  onPress={() => handleCalendarDatePress(dateInfo.dateString)}
                >
                  <Text style={styles.calendarDayName}>{dateInfo.dayName}</Text>
                  <Text style={[styles.calendarDayNumber, (dateInfo.isToday || isSelected) && styles.calendarTextActive]}>{dateInfo.dayNumber}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        <View style={styles.mainContent}>
          {/* Enhanced Coach Card Loading */}
          {loading ? (
            <SkeletonCard type="coach" />
          ) : (
            <Animated.View style={[styles.coachCard, { opacity: coachFadeAnimation }]}>
              <Text style={styles.cardTitle}>Coach's Status</Text>
              <View style={styles.coachContent}>
                <Animated.View style={{ transform: [{ scale: coachScaleAnimation }] }}>
                  <Text style={styles.coachEmoji}>{coachStatus.emoji}</Text>
                </Animated.View>
                <Text style={styles.coachMessage}>{coachStatus.message}</Text>
                <View style={[styles.coachIndicator, { backgroundColor: coachStatus.color }]} />
              </View>
            </Animated.View>
          )}

          {/* Enhanced Todo Card Loading */}
          <View style={styles.todoCard}>
            <Text style={styles.cardTitle}>Today's To-Do</Text>
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
          </View>
        </View>
      </ScrollView>

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
              onPress={() => setCalendarVisible(false)}
            >
              <Text style={styles.closeButtonText}>닫기</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1c1c2e' },
  scrollView: { flex: 1 },
  headerArea: { paddingHorizontal: 24, paddingTop: 40, paddingBottom: 20 },
  profileHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  logoContainer: { flexDirection: 'row', alignItems: 'center' },
  logoText: { fontSize: 36, color: '#6c63ff', fontWeight: 'bold' },
  profileButton: { padding: 8 },
  profileIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#3a3a50', justifyContent: 'center', alignItems: 'center' },
  profileIconText: { fontSize: 24, color: '#a9a9c2' },
  greetingText: { fontSize: 24, fontWeight: 'bold', color: '#ffffff', marginBottom: 10, fontFamily: 'Inter' },
  goalText: { fontSize: 18, fontWeight: '600', color: '#a9a9c2', marginBottom: 20, fontFamily: 'Inter' },
  calendarScroll: { marginTop: 10 },
  calendarContainer: { paddingHorizontal: 10 },
  calendarDate: { width: 60, height: 80, borderRadius: 12, backgroundColor: '#3a3a50', justifyContent: 'center', alignItems: 'center', marginHorizontal: 5, paddingVertical: 10 },
  calendarDateToday: { backgroundColor: '#6c63ff' },
  calendarDateSelected: { borderWidth: 2, borderColor: '#6c63ff' },
  calendarDayName: { fontSize: 12, color: '#a9a9c2', fontFamily: 'Inter' },
  calendarDayNumber: { fontSize: 20, fontWeight: 'bold', color: '#ffffff', fontFamily: 'Inter' },
  calendarTextActive: { color: '#ffffff' },
  mainContent: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 24, paddingBottom: 40 },
  coachCard: { flex: 1, backgroundColor: '#3a3a50', borderRadius: 16, padding: 20, marginRight: 10 },
  cardTitle: { fontSize: 18, fontWeight: 'bold', color: '#ffffff', marginBottom: 15, fontFamily: 'Inter' },
  coachContent: { alignItems: 'center', justifyContent: 'center', flex: 1 },
  coachEmoji: { fontSize: 100, marginBottom: 10 },
  coachMessage: { fontSize: 16, color: '#a9a9c2', textAlign: 'center', marginBottom: 10, fontFamily: 'Inter' },
  coachIndicator: { width: 60, height: 8, borderRadius: 4 },
  todoCard: { flex: 1, backgroundColor: '#3a3a50', borderRadius: 16, padding: 20, marginLeft: 10, minHeight: 250 },
  todoScrollView: { flex: 1 },
  todoItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#4a4a60' },
  todoCheckbox: { width: 16, height: 16, borderRadius: 4, borderWidth: 2, borderColor: '#a9a9c2', marginRight: 10, justifyContent: 'center', alignItems: 'center' },
  todoCheckedBox: { backgroundColor: '#6c63ff', borderColor: '#6c63ff' },
  checkmarkText: { color: '#ffffff', fontSize: 10, fontWeight: 'bold' },
  todoText: { fontSize: 14, fontWeight: '500', color: '#ffffff', flex: 1, fontFamily: 'Inter' },
  todoTextCompleted: { textDecorationLine: 'line-through', color: '#a9a9c2' },
  emptyTodoContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyTodoText: { fontSize: 14, color: '#a9a9c2', fontFamily: 'Inter' },
  modalContainer: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#1c1c2e', borderRadius: 20, padding: 20, elevation: 5, minWidth: 350, maxWidth: '90%', maxHeight: '90%' },
  closeButton: { marginTop: 16, alignSelf: 'center', paddingVertical: 8, paddingHorizontal: 20, backgroundColor: '#6c63ff', borderRadius: 20 },
  closeButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  goalLoadingContainer: {
    marginBottom: 20,
  },
  goalSkeletonLine1: {
    marginBottom: 8,
  },
  goalSkeletonLine2: {
    marginBottom: 0,
  },
}); 