import { useEffect, useState } from 'react';
import { Dimensions, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Calendar, DateData } from 'react-native-calendars';

const { width } = Dimensions.get('window');

interface HomeScreenProps {
  onDayPress: (day: number) => void;
}

// Mock data for testing - this will be replaced by actual backend data
interface DayData {
  date: string;
  completed: boolean;
  completionRate: number; // 0-1 scale
}

interface TodoItem {
  id: string;
  title: string;
  completed: boolean;
  date: string;
}

// Sample todo data for different dates
const generateTodoData = (): TodoItem[] => {
  const today = new Date();
  const todos: TodoItem[] = [];
  
  for (let i = 0; i < 15; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    
    // Generate 2-3 todos per day
    const todoCount = Math.floor(Math.random() * 2) + 2;
    for (let j = 0; j < todoCount; j++) {
      const todoTemplates = [
        '1챕터 초고 작성 (2,000자)',
        '아이디어 노트 정리',
        '참고 자료 조사',
        '캐릭터 설정 다듬기',
        '플롯 구성 검토',
        '대화문 수정',
        '배경 묘사 보완'
      ];
      
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

const mockTodoData: TodoItem[] = generateTodoData();

// Sample streak data - this will come from backend
const generateMockData = (): DayData[] => {
  const today = new Date();
  const currentMonth = today.getMonth();
  const currentYear = today.getFullYear();
  const mockData: DayData[] = [];
  
  // Generate data for the last 15 days
  for (let i = 14; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    
    // Simulate varying completion rates
    const completionRate = Math.random() > 0.3 ? Math.random() * 0.8 + 0.2 : Math.random() * 0.2;
    const completed = completionRate >= 0.5;
    
    mockData.push({
      date: dateStr,
      completed,
      completionRate: Math.round(completionRate * 10) / 10
    });
  }
  
  return mockData;
};

const mockHabitData: DayData[] = generateMockData();

export default function HomeScreen({ onDayPress }: HomeScreenProps) {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [isTaskCompleted, setIsTaskCompleted] = useState(false);
  const [habitData, setHabitData] = useState<DayData[]>(mockHabitData);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [longestStreak, setLongestStreak] = useState(0);
  const [todoData, setTodoData] = useState<TodoItem[]>(mockTodoData);
  const [showTodoList, setShowTodoList] = useState(false);

  // Calculate streaks
  useEffect(() => {
    calculateStreaks();
  }, [habitData]);

  // Get todos for selected date
  const getSelectedDateTodos = (): TodoItem[] => {
    return todoData.filter(todo => todo.date === selectedDate);
  };

  const handleTodoToggle = (todoId: string) => {
    setTodoData(prev => 
      prev.map(todo => 
        todo.id === todoId ? { ...todo, completed: !todo.completed } : todo
      )
    );
  };

  const calculateStreaks = () => {
    const sortedData = [...habitData].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    let current = 0;
    let longest = 0;
    let tempStreak = 0;
    
    // Calculate current streak (from today backwards)
    const today = new Date();
    let streakBroken = false;
    
    for (let i = 0; i < 30; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(today.getDate() - i);
      const dateStr = checkDate.toISOString().split('T')[0];
      
      const dayData = habitData.find(d => d.date === dateStr);
      
      if (dayData?.completed && !streakBroken) {
        current++;
      } else if (dayData && !dayData.completed) {
        streakBroken = true; // Stop counting once we hit an incomplete day
      }
      // If no data exists for a day, we assume it's incomplete and break the streak
      else if (!dayData) {
        streakBroken = true;
      }
    }
    
    // Calculate longest streak
    for (const day of sortedData) {
      if (day.completed) {
        tempStreak++;
        longest = Math.max(longest, tempStreak);
      } else {
        tempStreak = 0;
      }
    }
    
    setCurrentStreak(current);
    setLongestStreak(longest);
  };

  const getCompletionColor = (completionRate: number): string => {
    if (completionRate >= 0.9) return '#2d5a2d'; // Dark green
    if (completionRate >= 0.7) return '#4a7c4a'; // Medium dark green
    if (completionRate >= 0.5) return '#6b9b6b'; // Medium green
    if (completionRate >= 0.3) return '#8cb98c'; // Light green
    if (completionRate >= 0.1) return '#b8d8b8'; // Very light green
    return '#e8e8e8'; // Light gray for no activity
  };

  const getMarkedDates = () => {
    const marked: any = {};
    
    habitData.forEach(day => {
      marked[day.date] = {
        customStyles: {
          container: {
            backgroundColor: getCompletionColor(day.completionRate),
            borderRadius: 6,
          },
          text: {
            color: day.completionRate >= 0.5 ? '#ffffff' : '#333333',
            fontWeight: 'bold',
          },
        },
      };
    });
    
    // Mark selected date
    if (selectedDate) {
      marked[selectedDate] = {
        ...marked[selectedDate],
        selected: true,
        selectedColor: '#6c63ff',
      };
    }
    
    return marked;
  };

  const handleDayPress = (day: DateData) => {
    setSelectedDate(day.dateString);
    setShowTodoList(true);
    onDayPress(parseInt(day.dateString.split('-')[2]));
  };

  const handleTaskToggle = () => {
    setIsTaskCompleted(!isTaskCompleted);
    // TODO: Update backend with completion status
  };

  const formatSelectedDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const weekdays = ['일', '월', '화', '수', '목', '금', '토'];
    const weekday = weekdays[date.getDay()];
    return `${month}월 ${day}일 (${weekday})`;
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          {/* Main Goal Section */}
          <View style={styles.goalSection}>
            <Text style={styles.goalLabel}>나의 핵심 목표</Text>
            <Text style={styles.goalTitle}>나의 첫 책 쓰기</Text>
          </View>

          {/* Streak Statistics */}
          <View style={styles.streakSection}>
            <View style={styles.streakItem}>
              <Text style={styles.streakLabel}>현재 연속 기록</Text>
              <Text style={styles.streakValue}>{currentStreak} 일</Text>
            </View>
            <View style={styles.streakItem}>
              <Text style={styles.streakLabel}>최장 연속 기록</Text>
              <Text style={styles.streakValue}>{longestStreak} 일</Text>
            </View>
          </View>

          {/* Today's Goal Section */}
          <View style={styles.todaySection}>
            <Text style={styles.todayLabel}>오늘의 목표</Text>
            <TouchableOpacity style={styles.taskCard} onPress={handleTaskToggle}>
              <View style={[
                styles.checkbox,
                isTaskCompleted && styles.checkedBox
              ]} />
              <Text style={styles.taskText}>1챕터 초고 작성 (2,000자)</Text>
            </TouchableOpacity>
          </View>

          {/* Calendar Section */}
          <View style={styles.calendarSection}>
            <Text style={styles.calendarTitle}>전체 일정</Text>
            <View style={styles.calendarContainer}>
              <Calendar
                current={selectedDate}
                onDayPress={handleDayPress}
                markingType="custom"
                markedDates={getMarkedDates()}
                theme={{
                  backgroundColor: '#1c1c2e',
                  calendarBackground: '#1c1c2e',
                  textSectionTitleColor: '#a9a9c2',
                  textSectionTitleDisabledColor: '#666',
                  selectedDayBackgroundColor: '#6c63ff',
                  selectedDayTextColor: '#ffffff',
                  todayTextColor: '#6c63ff',
                  dayTextColor: '#ffffff',
                  textDisabledColor: '#666',
                  dotColor: '#6c63ff',
                  selectedDotColor: '#ffffff',
                  arrowColor: '#6c63ff',
                  disabledArrowColor: '#666',
                  monthTextColor: '#ffffff',
                  indicatorColor: '#6c63ff',
                  textDayFontFamily: 'Inter',
                  textMonthFontFamily: 'Inter',
                  textDayHeaderFontFamily: 'Inter',
                  textDayFontWeight: '500',
                  textMonthFontWeight: 'bold',
                  textDayHeaderFontWeight: '500',
                  textDayFontSize: 14,
                  textMonthFontSize: 18,
                  textDayHeaderFontSize: 12,
                }}
                style={styles.calendar}
              />
            </View>
          </View>

          {/* Selected Date Todo List */}
          {showTodoList && (
            <View style={styles.todoSection}>
              <View style={styles.todoHeader}>
                <Text style={styles.todoTitle}>
                  {formatSelectedDate(selectedDate)} 할 일
                </Text>
                <TouchableOpacity
                  style={styles.closeTodoButton}
                  onPress={() => setShowTodoList(false)}
                >
                  <Text style={styles.closeTodoText}>✕</Text>
                </TouchableOpacity>
              </View>
              
              {getSelectedDateTodos().length > 0 ? (
                getSelectedDateTodos().map((todo) => (
                  <TouchableOpacity
                    key={todo.id}
                    style={styles.todoItem}
                    onPress={() => handleTodoToggle(todo.id)}
                  >
                    <View style={[
                      styles.todoCheckbox,
                      todo.completed && styles.todoCheckedBox
                    ]} />
                    <Text style={[
                      styles.todoText,
                      todo.completed && styles.todoTextCompleted
                    ]}>
                      {todo.title}
                    </Text>
                  </TouchableOpacity>
                ))
              ) : (
                <View style={styles.emptyTodoContainer}>
                  <Text style={styles.emptyTodoText}>이 날짜에는 할 일이 없습니다.</Text>
                </View>
              )}
            </View>
          )}
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
  content: {
    paddingHorizontal: 24,
    paddingTop: 40,
    paddingBottom: 40,
  },
  goalSection: {
    marginBottom: 30,
  },
  goalLabel: {
    fontSize: 16,
    color: '#a9a9c2',
    marginBottom: 8,
    fontFamily: 'Inter',
  },
  goalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    fontFamily: 'Inter',
  },
  streakSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
    paddingHorizontal: 16,
  },
  streakItem: {
    alignItems: 'center',
    flex: 1,
  },
  streakLabel: {
    fontSize: 14,
    color: '#a9a9c2',
    marginBottom: 4,
    fontFamily: 'Inter',
  },
  streakValue: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#4a7c4a',
    fontFamily: 'Inter',
  },
  todaySection: {
    marginBottom: 30,
  },
  todayLabel: {
    fontSize: 16,
    color: '#a9a9c2',
    marginBottom: 16,
    fontFamily: 'Inter',
  },
  taskCard: {
    backgroundColor: '#3a3a50',
    borderRadius: 16,
    height: 70,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    backgroundColor: '#d9d9d9',
    borderWidth: 2,
    borderColor: '#a9a9c2',
    marginRight: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkedBox: {
    backgroundColor: '#6c63ff',
    borderColor: '#6c63ff',
  },
  taskText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
    flex: 1,
    fontFamily: 'Inter',
  },
  calendarSection: {
    marginBottom: 40,
  },
  calendarTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 20,
    fontFamily: 'Inter',
  },
  calendarContainer: {
    backgroundColor: '#1c1c2e',
    borderRadius: 16,
    overflow: 'hidden',
  },
  calendar: {
    backgroundColor: '#1c1c2e',
  },
  todoSection: {
    backgroundColor: '#3a3a50',
    borderRadius: 16,
    padding: 20,
    marginTop: 20,
  },
  todoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  todoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    fontFamily: 'Inter',
  },
  closeTodoButton: {
    padding: 8,
  },
  closeTodoText: {
    fontSize: 20,
    color: '#a9a9c2',
  },
  todoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#4a4a60',
  },
  todoCheckbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#a9a9c2',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  todoCheckedBox: {
    backgroundColor: '#6c63ff',
    borderColor: '#6c63ff',
  },
  todoText: {
    fontSize: 16,
    fontWeight: 'bold',
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
    fontSize: 16,
    color: '#a9a9c2',
    fontFamily: 'Inter',
  },
}); 