import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import CalendarScreen from '../backend/calendar/calendar';
import { getLatestHabitPlan } from '../backend/supabase/habits';
import { DailyTodo, Plan } from '../types/habit';
import AppSettingsScreen from './AppSettingsScreen';

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

export default function HomeScreen({ onDayPress }: HomeScreenProps) {
  const [currentScreen, setCurrentScreen] = useState<'home' | 'settings'>('home');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [habitData] = useState<DayData[]>(generateMockData());
  const [todoData, setTodoData] = useState<TodoItem[]>(generateTodoData());
  const [calendarVisible, setCalendarVisible] = useState(false);

  // Calculate average achievement rate for coach status
  const calculateAverageAchievementRate = (): number => {
    const recentData = habitData.slice(-7); // Last 7 days
    if (recentData.length === 0) return 0;
    
    const totalRate = recentData.reduce((sum: number, day: DayData) => sum + day.completionRate, 0);
    return totalRate / recentData.length;
  };

  // Get coach status based on achievement rate
  const [plan, setPlan] = useState<Plan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [todoCompletion, setTodoCompletion] = useState<{ [key: string]: boolean }>({});
  const [effectiveStartDate, setEffectiveStartDate] = useState<string | null>(null);

  useEffect(() => {
    const fetchPlan = async () => {
      try {
        setLoading(true);
        const fetchedPlan = await getLatestHabitPlan();
        setPlan(fetchedPlan);

        if (fetchedPlan) {
          // Determine the effective start date
          const now = new Date();
          const planCreationDate = new Date(fetchedPlan.start_date);
          let effectiveDate = new Date(planCreationDate);
          
          // Only adjust start date if the plan is created today
          if (planCreationDate.toDateString() === now.toDateString()) {
            const timeSlotMatch = fetchedPlan.primary_goal.match(/\(가능 시간: (.*?)\)/);
            if (timeSlotMatch && timeSlotMatch[1]) {
              const startTimeStr = timeSlotMatch[1].split('-')[0]; // "20:00"
              const [hours, minutes] = startTimeStr.split(':').map(Number);
              
              const slotStartTime = new Date(planCreationDate);
              slotStartTime.setHours(hours, minutes, 0, 0);

              if (now > slotStartTime) {
                effectiveDate.setDate(planCreationDate.getDate() + 1);
              }
            }
          }
          setEffectiveStartDate(effectiveDate.toISOString().split('T')[0]);

          // Initialize todo completion state
          const initialCompletion: { [key: string]: boolean } = {};
          fetchedPlan.milestones.forEach(m => {
            m.daily_todos.forEach((_todo, index) => {
              // Create a unique key for each todo
              const todoKey = `${m.title}-${index}`;
              initialCompletion[todoKey] = false; // Default to not completed
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

    const completedCount = todos.filter((todo, index) => {
      const milestone = plan.milestones.find(m => m.daily_todos.includes(todo));
      if (!milestone) return false;
      const todoKey = `${milestone.title}-${index}`;
      return todoCompletion[todoKey];
    }).length;

    const avgRate = completedCount / todos.length;
    
    if (avgRate >= 1) {
      return { emoji: '🥳', message: '완벽한 하루!', color: '#4CAF50' };
    } else if (avgRate >= 0.7) {
      return { emoji: '😊', message: '정말 잘하고 있어요!', color: '#8BC34A' };
    } else if (avgRate >= 0.5) {
      return { emoji: '😌', message: '꾸준히 실천 중이네요', color: '#FFC107' };
    } else if (avgRate > 0) {
        return { emoji: '😐', message: '조금만 더 힘내요!', color: '#FF9800' };
    } else {
      return { emoji: '🤔', message: '시작이 반이에요!', color: '#9E9E9E' };
    }
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
      const date = new Date(today.getTime());
      date.setDate(today.getDate() + i);
      dates.push(date);
    }
    return dates;
  };

  const getTodosForSelectedDate = (): DailyTodo[] => {
    if (!plan || !effectiveStartDate) return [];
  
    const selected = new Date(selectedDate);
    const startDate = new Date(effectiveStartDate);

    if (selected < startDate) {
      return [];
    }
  
    const diffTime = selected.getTime() - startDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
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

  const handleTodoToggle = (todoIndex: number, milestoneTitle: string): void => {
    const todoKey = `${milestoneTitle}-${todoIndex}`;
    setTodoCompletion(prev => ({ ...prev, [todoKey]: !prev[todoKey] }));
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
    const day = parseInt(dateString.split('-')[2], 10);
    if (onDayPress) onDayPress(day);
  };

  if (currentScreen === 'settings') {
    return <AppSettingsScreen onBack={() => setCurrentScreen('home')} />;
  }

  const coachStatus = getCoachStatus();
  const calendarDates = getCalendarDates();
  const todosForSelectedDate = getTodosForSelectedDate();

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

          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : plan ? (
            <Text style={styles.goalText}>{plan.primary_goal}</Text>
          ) : (
            <Text style={styles.goalText}>진행 중인 목표가 없습니다.</Text>
          )}

          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            style={styles.calendarScroll}
            contentContainerStyle={styles.calendarContainer}
          >
            {calendarDates.map((date) => {
              const dateInfo = formatCalendarDate(date);
              const isSelected = dateInfo.dateString === selectedDate;
              return (
                <TouchableOpacity
                  key={dateInfo.dateString}
                  style={[styles.calendarDate, dateInfo.isToday && styles.calendarDateToday, isSelected && styles.calendarDateSelected]}
                  onPress={() => handleCalendarDatePress(dateInfo.dateString)}
                >
                  <Text style={[styles.calendarDayName, (dateInfo.isToday || isSelected) && styles.calendarTextActive]}>{dateInfo.dayName}</Text>

                  <Text style={[styles.calendarDayNumber, (dateInfo.isToday || isSelected) && styles.calendarTextActive]}>{dateInfo.dayNumber}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        <View style={styles.mainContent}>
          <View style={styles.coachCard}>
            <Text style={styles.cardTitle}>Coach's Status</Text>
            <View style={styles.coachContent}>
              <Text style={styles.coachEmoji}>{coachStatus.emoji}</Text>
              <Text style={styles.coachMessage}>{coachStatus.message}</Text>
              <View style={[styles.coachIndicator, { backgroundColor: coachStatus.color }]} />
            </View>
          </View>

          <View style={styles.todoCard}>
            <Text style={styles.cardTitle}>Today's To-Do</Text>
            <ScrollView style={styles.todoScrollView} showsVerticalScrollIndicator={false}>
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : error ? (
                <Text style={styles.emptyTodoText}>{error}</Text>
              ) : todosForSelectedDate.length > 0 ? (
                todosForSelectedDate.map((todo, index) => {
                  const milestone = plan?.milestones.find(m => m.daily_todos.includes(todo));
                  
                  if (!milestone) {
                    console.warn("Could not find a milestone for todo:", todo);
                    return null;
                  }

                  const todoKey = `${milestone.title}-${index}`;
                  const isCompleted = todoCompletion[todoKey];

                  return (
                    <TouchableOpacity
                      key={todoKey}
                      style={styles.todoItem}
                      onPress={() => handleTodoToggle(index, milestone.title)}
                    >
                      <View style={[styles.todoCheckbox, isCompleted && styles.todoCheckedBox]} />
                      <Text style={[styles.todoText, isCompleted && styles.todoTextCompleted]} numberOfLines={2} ellipsizeMode="tail">
                        {todo.description}
                      </Text>
                    </TouchableOpacity>
                  );
                })
              ) : (
                <View style={styles.emptyTodoContainer}>
                  <Text style={styles.emptyTodoText}>오늘의 할 일이 없습니다.</Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </ScrollView>
      {/* 캘린더 모달 */}
      <Modal
        visible={calendarVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setCalendarVisible(false)}
      >
        <View style={{
          flex: 1,
          backgroundColor: 'rgba(0,0,0,0.4)',
          justifyContent: 'center',
          alignItems: 'center',
        }}>
          <View style={{
            backgroundColor: '#1c1c2e',
            borderRadius: 20,
            padding: 20,
            elevation: 5,
            minWidth: 350,
            maxWidth: '90%',
            maxHeight: '90%',
          }}>
            <CalendarScreen />
            {/* 닫기 버튼 */}
            <TouchableOpacity onPress={() => setCalendarVisible(false)} style={{marginTop: 16, alignSelf: 'center'}}>
              <Text style={{color: '#6c63ff', fontWeight: 'bold', fontSize: 16}}>닫기</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1c1c2e',
  },
  scrollView: {
    flex: 1,
  },
  headerArea: {
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 20,
    backgroundColor: '#1c1c2e',
  },
  profileHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  logoText: {
    fontSize: 36,
    color: '#6c63ff',
    fontWeight: 'bold',
  },
  profileButton: {
    padding: 8,
  },
  profileIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#3a3a50',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileIconText: {
    fontSize: 24,
    color: '#a9a9c2',
  },
  greetingText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 10,
    fontFamily: 'Inter',
  },
  goalText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#a9a9c2',
    marginBottom: 20,
    fontFamily: 'Inter',
  },
  calendarScroll: {
    marginTop: 10,
  },
  calendarContainer: {
    paddingHorizontal: 10,
  },
  calendarDate: {
    width: 60,
    height: 80,
    borderRadius: 12,
    backgroundColor: '#3a3a50',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 5,
    paddingVertical: 10,
  },
  calendarDateToday: {
    backgroundColor: '#6c63ff',
  },
  calendarDateSelected: {
    backgroundColor: '#6c63ff',
    borderWidth: 2,
    borderColor: '#6c63ff',
  },
  calendarDayName: {
    fontSize: 12,
    color: '#a9a9c2',
    fontFamily: 'Inter',
  },
  calendarDayNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    fontFamily: 'Inter',
  },
  calendarTextActive: {
    color: '#ffffff',
  },
  mainContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  coachCard: {
    flex: 1,
    backgroundColor: '#3a3a50',
    borderRadius: 16,
    padding: 20,
    marginRight: 10,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 15,
    fontFamily: 'Inter',
  },
  coachContent: {
    alignItems: 'center',
  },
  coachEmoji: {
    fontSize: 120,
    marginBottom: 10,
  },
  coachMessage: {
    fontSize: 16,
    color: '#a9a9c2',
    textAlign: 'center',
    marginBottom: 10,
    fontFamily: 'Inter',
  },
  coachIndicator: {
    width: 60,
    height: 8,
    borderRadius: 4,
  },
  todoCard: {
    flex: 1,
    backgroundColor: '#3a3a50',
    borderRadius: 16,
    padding: 20,
    marginLeft: 10,
  },
  todoScrollView: {
    maxHeight: 160,
  },
  todoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#4a4a60',
  },
  todoCheckbox: {
    width: 16,
    height: 16,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#a9a9c2',
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  todoCheckedBox: {
    backgroundColor: '#6c63ff',
    borderColor: '#6c63ff',
  },
  todoText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#ffffff',
    flex: 1,
    fontFamily: 'Inter',
  },
  todoTextCompleted: {
    textDecorationLine: 'line-through',
    color: '#a9a9c2',
  },
  emptyTodoContainer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  emptyTodoText: {
    fontSize: 14,
    color: '#a9a9c2',
    fontFamily: 'Inter',
  },
  squareButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    marginLeft: 8,
    alignSelf: 'flex-end', // 버튼만 아래로 정렬
    justifyContent: 'center',
    alignItems: 'center',
  },
}); 