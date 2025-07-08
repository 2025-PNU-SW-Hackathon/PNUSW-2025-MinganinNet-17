import React, { useState } from 'react';
import { Dimensions, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const { width } = Dimensions.get('window');

interface HomeScreenProps {
  onDayPress: (day: number) => void;
  onTabPress: (tab: string) => void;
}

export default function HomeScreen({ onDayPress, onTabPress }: HomeScreenProps) {
  const [selectedDay, setSelectedDay] = useState(8);
  const [isTaskCompleted, setIsTaskCompleted] = useState(false);

  const handleDayPress = (day: number) => {
    setSelectedDay(day);
    onDayPress(day);
  };

  const handleTaskToggle = () => {
    setIsTaskCompleted(!isTaskCompleted);
  };

  const renderCalendarDay = (day: number, isSelected: boolean = false) => {
    return (
      <TouchableOpacity
        key={day}
        style={styles.calendarDay}
        onPress={() => handleDayPress(day)}
      >
        <Text style={[
          styles.calendarDayText,
          isSelected && styles.selectedDayText
        ]}>
          {day}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderCalendarWeek = (days: number[]) => {
    return (
      <View style={styles.calendarWeek}>
        {days.map(day => renderCalendarDay(day, day === selectedDay))}
      </View>
    );
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
              <Text style={styles.calendarMonth}>2025년 7월</Text>
              
              {/* Calendar Header */}
              <View style={styles.calendarHeader}>
                {['일', '월', '화', '수', '목', '금', '토'].map((day, index) => (
                  <Text key={index} style={styles.calendarHeaderText}>{day}</Text>
                ))}
              </View>

              {/* Calendar Days */}
              <View style={styles.calendarGrid}>
                {renderCalendarWeek([1, 2, 3, 4, 5, 6, 7])}
                {renderCalendarWeek([8, 9, 10, 11, 12, 13, 14])}
                {renderCalendarWeek([15, 16, 17, 18, 19, 20, 21])}
                {renderCalendarWeek([22, 23, 24, 25, 26, 27, 28])}
                {renderCalendarWeek([29, 30, 31])}
              </View>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Tab Bar */}
      <View style={styles.tabBar}>
        <TouchableOpacity style={styles.tabItem} onPress={() => onTabPress('home')}>
          <Text style={styles.activeTabIcon}>🏠</Text>
          <Text style={styles.activeTabText}>홈</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.tabItem} onPress={() => onTabPress('character')}>
          <Text style={styles.inactiveTabIcon}>🤖</Text>
          <Text style={styles.inactiveTabText}>캐릭터</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.tabItem} onPress={() => onTabPress('coach')}>
          <Text style={styles.inactiveTabIcon}>💬</Text>
          <Text style={styles.inactiveTabText}>코치</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.tabItem} onPress={() => onTabPress('profile')}>
          <Text style={styles.inactiveTabIcon}>👤</Text>
          <Text style={styles.inactiveTabText}>프로필</Text>
        </TouchableOpacity>
      </View>
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
    paddingBottom: 100,
  },
  goalSection: {
    marginBottom: 40,
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
  todaySection: {
    marginBottom: 40,
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
    
  },
  calendarMonth: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 20,
    fontFamily: 'Inter',
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  calendarHeaderText: {
    fontSize: 12,
    color: '#a9a9c2',
    textAlign: 'center',
    width: (width - 48) / 7,
    fontFamily: 'Inter',
  },
  calendarGrid: {
    gap: 10,
  },
  calendarWeek: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  calendarDay: {
    width: (width - 48) / 7,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  calendarDayText: {
    fontSize: 14,
    color: '#ffffff',
    textAlign: 'center',
    fontFamily: 'Inter',
  },
  selectedDayText: {
    color: '#6c63ff',
    fontWeight: 'bold',
  },
  tabBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 88,
    backgroundColor: '#262638',
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingTop: 15,
  },
  tabItem: {
    alignItems: 'center',
    flex: 1,
  },
  activeTabIcon: {
    fontSize: 28,
    color: '#6c63ff',
    marginBottom: 5,
  },
  inactiveTabIcon: {
    fontSize: 28,
    color: '#a9a9c2',
    marginBottom: 5,
  },
  activeTabText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#ffffff',
    fontFamily: 'Inter',
  },
  inactiveTabText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#a9a9c2',
    fontFamily: 'Inter',
  },
}); 