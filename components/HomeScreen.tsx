import React, { useEffect, useState } from 'react';
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

// Sample streak data - this will come from backend
const mockHabitData: DayData[] = [
  { date: '2024-01-01', completed: true, completionRate: 1.0 },
  { date: '2024-01-02', completed: true, completionRate: 0.8 },
  { date: '2024-01-03', completed: false, completionRate: 0.2 },
  { date: '2024-01-04', completed: true, completionRate: 1.0 },
  { date: '2024-01-05', completed: true, completionRate: 0.9 },
  { date: '2024-01-06', completed: true, completionRate: 0.7 },
  { date: '2024-01-07', completed: false, completionRate: 0.1 },
  { date: '2024-01-08', completed: true, completionRate: 1.0 },
  { date: '2024-01-09', completed: true, completionRate: 0.8 },
  { date: '2024-01-10', completed: true, completionRate: 0.6 },
];

export default function HomeScreen({ onDayPress }: HomeScreenProps) {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [isTaskCompleted, setIsTaskCompleted] = useState(false);
  const [habitData, setHabitData] = useState<DayData[]>(mockHabitData);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [longestStreak, setLongestStreak] = useState(0);

  // Calculate streaks
  useEffect(() => {
    calculateStreaks();
  }, [habitData]);

  const calculateStreaks = () => {
    const sortedData = [...habitData].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    let current = 0;
    let longest = 0;
    let tempStreak = 0;
    
    // Calculate current streak (from today backwards)
    const today = new Date();
    for (let i = 0; i < 30; i++) {
      const checkDate = new Date(today);
      checkDate.setDate(today.getDate() - i);
      const dateStr = checkDate.toISOString().split('T')[0];
      
      const dayData = habitData.find(d => d.date === dateStr);
      if (dayData?.completed) {
        if (i === 0) current++; // Start counting from today
        else if (current > 0) current++; // Continue streak
      } else {
        break; // Break streak
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
    onDayPress(parseInt(day.dateString.split('-')[2]));
  };

  const handleTaskToggle = () => {
    setIsTaskCompleted(!isTaskCompleted);
    // TODO: Update backend with completion status
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
}); 