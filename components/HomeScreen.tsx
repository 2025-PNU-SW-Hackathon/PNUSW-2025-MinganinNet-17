import { useState } from 'react';
import {
  Dimensions,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import AppSettingsScreen from './AppSettingsScreen';

const { width } = Dimensions.get('window');

interface HomeScreenProps {
  onDayPress?: (day: number) => void;
}

// Data interfaces
interface DayData {
  date: string;
  completed: boolean;
  completionRate: number;
}

interface TodoItem {
  id: string;
  title: string;
  completed: boolean;
  date: string;
}

// Coach status based on achievement rate
interface CoachStatus {
  emoji: string;
  message: string;
  color: string;
}

// Generate mock data for current dates
const generateMockData = (): DayData[] => {
  const today = new Date();
  const mockData: DayData[] = [];
  
  for (let i = 14; i >= 0; i--) {
    const date = new Date(today.getTime());
    date.setDate(today.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    
    const completionRate = Math.random() > 0.3 
      ? Math.random() * 0.8 + 0.2 
      : Math.random() * 0.2;
    const completed = completionRate >= 0.5;
    
    mockData.push({
      date: dateStr,
      completed,
      completionRate: Math.round(completionRate * 10) / 10
    });
  }
  
  return mockData;
};

// Generate todo data for current dates
const generateTodoData = (): TodoItem[] => {
  const today = new Date();
  const todos: TodoItem[] = [];
  
  for (let i = 0; i < 7; i++) {
    const date = new Date(today.getTime());
    date.setDate(today.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    
    const todoTemplates = [
      '1챕터 초고 작성',
      '아이디어 노트 정리', 
      '참고 자료 조사',
      '캐릭터 설정 다듬기',
      '플롯 구성 검토'
    ];
    
    const todoCount = Math.floor(Math.random() * 3) + 2;
    for (let j = 0; j < todoCount; j++) {
      todos.push({
        id: `${dateStr}-${j}`,
        title: todoTemplates[Math.floor(Math.random() * todoTemplates.length)],
        completed: Math.random() > 0.4,
        date: dateStr
      });
    }
  }
  
  return todos;
};

export default function HomeScreen({ onDayPress }: HomeScreenProps) {
  const [currentScreen, setCurrentScreen] = useState<'home' | 'settings'>('home');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [habitData] = useState<DayData[]>(generateMockData());
  const [todoData, setTodoData] = useState<TodoItem[]>(generateTodoData());

  // Calculate average achievement rate for coach status
  const calculateAverageAchievementRate = (): number => {
    const recentData = habitData.slice(-7); // Last 7 days
    if (recentData.length === 0) return 0;
    
    const totalRate = recentData.reduce((sum: number, day: DayData) => sum + day.completionRate, 0);
    return totalRate / recentData.length;
  };

  // Get coach status based on achievement rate
  const getCoachStatus = (): CoachStatus => {
    const avgRate = calculateAverageAchievementRate();
    
    if (avgRate >= 0.9) {
      return { emoji: '😊', message: '정말 잘하고 있어요!', color: '#4CAF50' };
    } else if (avgRate >= 0.7) {
      return { emoji: '😌', message: '꾸준히 실천 중이네요', color: '#8BC34A' };
    } else if (avgRate >= 0.5) {
      return { emoji: '😐', message: '조금 더 노력해봐요', color: '#FF9800' };
    } else {
      return { emoji: '😤', message: '다시 집중해봅시다!', color: '#F44336' };
    }
  };

  // Get greeting based on time
  const getGreeting = (): string => {
    const hour = new Date().getHours();
    if (hour < 12) return 'good morning.';
    if (hour < 18) return 'good afternoon.';
    return 'good evening.';
  };

  // Generate calendar dates for horizontal scroll
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

  // Get todos for today
  const getTodayTodos = (): TodoItem[] => {
    const today = new Date().toISOString().split('T')[0];
    return todoData.filter((todo: TodoItem) => todo.date === today);
  };

  // Handle todo toggle
  const handleTodoToggle = (todoId: string): void => {
    setTodoData((prev: TodoItem[]) => 
      prev.map((todo: TodoItem) => 
        todo.id === todoId ? { ...todo, completed: !todo.completed } : todo
      )
    );
  };

  // Format date for calendar
  const formatCalendarDate = (date: Date) => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return {
      dayName: days[date.getDay()],
      dayNumber: date.getDate().toString().padStart(2, '0'),
      isToday: date.toDateString() === new Date().toDateString(),
      dateString: date.toISOString().split('T')[0]
    };
  };

  // Handle calendar date press
  const handleCalendarDatePress = (dateString: string): void => {
    setSelectedDate(dateString);
    // Extract day number and call onDayPress if provided
    const day = parseInt(dateString.split('-')[2], 10);
    if (onDayPress) {
      onDayPress(day);
    }
  };

  if (currentScreen === 'settings') {
    return (
      <AppSettingsScreen 
        onBack={() => setCurrentScreen('home')}
      />
    );
  }

  const coachStatus = getCoachStatus();
  const calendarDates = getCalendarDates();
  const todayTodos = getTodayTodos();

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header Area */}
        <View style={styles.headerArea}>
          {/* Profile and Greeting */}
          <View style={styles.profileHeader}>
            <View style={styles.logoContainer}>
              <Text style={styles.logoText}>🌱</Text>
              <Text style={styles.logoSubtext}>0</Text>
            </View>
            <TouchableOpacity 
              style={styles.profileButton}
              onPress={() => setCurrentScreen('settings')}
            >
              <View style={styles.profileIcon}>
                <Text style={styles.profileIconText}>👤</Text>
              </View>
            </TouchableOpacity>
          </View>

          <Text style={styles.greetingText}>{getGreeting()}</Text>

          {/* Horizontal Calendar */}
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
                  style={[
                    styles.calendarDate,
                    dateInfo.isToday && styles.calendarDateToday,
                    isSelected && styles.calendarDateSelected
                  ]}
                  onPress={() => handleCalendarDatePress(dateInfo.dateString)}
                >
                  <Text style={[
                    styles.calendarDayName,
                    (dateInfo.isToday || isSelected) && styles.calendarTextActive
                  ]}>
                    {dateInfo.dayName}
                  </Text>
                  <Text style={[
                    styles.calendarDayNumber,
                    (dateInfo.isToday || isSelected) && styles.calendarTextActive
                  ]}>
                    {dateInfo.dayNumber}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Main Content Area - Two Column Layout */}
        <View style={styles.mainContent}>
          {/* Left Card - Coach's Status */}
          <View style={styles.coachCard}>
            <Text style={styles.cardTitle}>Coach's Status</Text>
            <View style={styles.coachContent}>
              <Text style={styles.coachEmoji}>{coachStatus.emoji}</Text>
              <Text style={styles.coachMessage}>{coachStatus.message}</Text>
              <View style={[styles.coachIndicator, { backgroundColor: coachStatus.color }]} />
            </View>
          </View>

          {/* Right Card - Today's To-Do List */}
          <View style={styles.todoCard}>
            <Text style={styles.cardTitle}>Today's To-Do</Text>
            <ScrollView 
              style={styles.todoScrollView}
              showsVerticalScrollIndicator={false}
            >
              {todayTodos.length > 0 ? (
                todayTodos.map((todo) => (
                  <TouchableOpacity
                    key={todo.id}
                    style={styles.todoItem}
                    onPress={() => handleTodoToggle(todo.id)}
                  >
                    <View style={[
                      styles.todoCheckbox,
                      todo.completed && styles.todoCheckedBox
                    ]} />
                    <Text 
                      style={[
                        styles.todoText,
                        todo.completed && styles.todoTextCompleted
                      ]}
                      numberOfLines={2}
                      ellipsizeMode="tail"
                    >
                      {todo.title}
                    </Text>
                  </TouchableOpacity>
                ))
              ) : (
                <View style={styles.emptyTodoContainer}>
                  <Text style={styles.emptyTodoText}>오늘은 할 일이 없습니다</Text>
                </View>
              )}
            </ScrollView>
          </View>
        </View>
      </ScrollView>
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
  logoSubtext: {
    fontSize: 18,
    color: '#a9a9c2',
    marginLeft: 4,
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
    maxHeight: 160, // Prevent overflow
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
}); 