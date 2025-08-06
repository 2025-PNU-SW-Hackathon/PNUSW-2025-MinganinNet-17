import React, { useState } from 'react';
import {
  Dimensions,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { Colors } from '../constants/Colors';
import { ThemedText } from './ThemedText';
import { ThemedView } from './ThemedView';

const { width } = Dimensions.get('window');

interface TimelineItem {
  id: string;
  time: string;
  endTime?: string;
  title: string;
  subtitle?: string;
  type: 'alarm' | 'work' | 'habit' | 'app' | 'exercise' | 'personal';
  completed: boolean;
  progress?: { current: number; total: number };
  duration?: string;
}

interface DayInfo {
  date: number;
  dayOfWeek: string;
  isToday: boolean;
  hasActivities: boolean;
}

const mockTimelineData: TimelineItem[] = [
  {
    id: '1',
    time: '7:00',
    title: '산뜻한 시작',
    subtitle: '휴식을 마쳤어요. 다시 알으뜸!',
    type: 'alarm',
    completed: false,
  },
  {
    id: '2',
    time: '12:00',
    endTime: '1:00',
    title: '웹개발 끝내기',
    subtitle: '준비하세요, 다음 일정까지 6분 남았어요.',
    type: 'work',
    completed: false,
    duration: '1시간',
  },
  {
    id: '3',
    time: '5:09',
    title: 'Structured와 함께 시작!',
    subtitle: '앱에서 기본 사항 알아보기',
    type: 'app',
    completed: false,
  },
  {
    id: '4',
    time: '5:20',
    title: '첫 일정 추가하기',
    subtitle: '하루를 체계적으로 만들기',
    type: 'habit',
    completed: false,
    progress: { current: 0, total: 5 },
  },
  {
    id: '5',
    time: '5:25',
    title: '보관함 채우기',
    subtitle: '뭐든지 깜빡하지 않도록',
    type: 'exercise',
    completed: false,
  },
  {
    id: '6',
    time: '5:30',
    title: '나만의 스타일로 만들기',
    subtitle: '캘린더 등등과 연결하기',
    type: 'personal',
    completed: false,
    progress: { current: 0, total: 5 },
  },
];

const mockDayData: DayInfo[] = [
  { date: 27, dayOfWeek: '일', isToday: false, hasActivities: true },
  { date: 28, dayOfWeek: '월', isToday: false, hasActivities: true },
  { date: 29, dayOfWeek: '화', isToday: false, hasActivities: true },
  { date: 30, dayOfWeek: '수', isToday: false, hasActivities: true },
  { date: 31, dayOfWeek: '목', isToday: false, hasActivities: true },
  { date: 1, dayOfWeek: '금', isToday: false, hasActivities: true },
  { date: 2, dayOfWeek: '토', isToday: true, hasActivities: true },
];

export default function DailyTimelineScreen() {
  const [selectedDate, setSelectedDate] = useState(2);

  const getTimelineItemColor = (type: string, completed: boolean) => {
    if (completed) return Colors.light.textMuted;
    
    switch (type) {
      case 'alarm':
        return Colors.light.primary; // Coral
      case 'work':
        return Colors.light.secondary; // Green
      case 'habit':
      case 'app':
      case 'exercise':
      case 'personal':
      default:
        return Colors.light.border; // Gray
    }
  };

  const getTimelineItemIcon = (type: string) => {
    switch (type) {
      case 'alarm':
        return '⏰';
      case 'work':
        return '💻';
      case 'app':
        return '📱';
      case 'habit':
        return '➕';
      case 'exercise':
        return '🏃';
      case 'personal':
        return '⚙️';
      default:
        return '📝';
    }
  };

  const renderDayCalendar = () => (
    <ThemedView style={styles.calendarContainer} lightColor={Colors.light.background}>
      <ThemedText type="h1" style={styles.monthTitle}>
        2025년 8월
      </ThemedText>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false} 
        style={styles.dayScrollView}
        contentContainerStyle={styles.dayScrollContent}
      >
        {mockDayData.map((day) => (
          <TouchableOpacity
            key={day.date}
            style={[
              styles.dayContainer,
              day.isToday && styles.todayContainer,
            ]}
            onPress={() => setSelectedDate(day.date)}
          >
            <ThemedText style={[
              styles.dayOfWeek,
              day.isToday && styles.todayText,
            ]}>
              {day.dayOfWeek}
            </ThemedText>
            <ThemedText style={[
              styles.dayNumber,
              day.isToday && styles.todayText,
            ]}>
              {day.date}
            </ThemedText>
            
            {/* Activity dots */}
            <View style={styles.activityDots}>
              <View style={[styles.dot, { backgroundColor: Colors.light.primary }]} />
              <View style={[styles.dot, { backgroundColor: Colors.light.secondary }]} />
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </ThemedView>
  );

  const renderTimelineItem = (item: TimelineItem, index: number) => {
    const isLarge = item.type === 'work';
    const itemColor = getTimelineItemColor(item.type, item.completed);
    const icon = getTimelineItemIcon(item.type);

    return (
      <ThemedView key={item.id} style={styles.timelineItemContainer} lightColor={Colors.light.background}>
        {/* Time marker */}
        <View style={styles.timeMarker}>
          <ThemedText style={styles.timeText}>{item.time}</ThemedText>
        </View>

        {/* Timeline line and icon */}
        <View style={styles.timelineColumn}>
          {index > 0 && <View style={styles.timelineLine} />}
          <View style={[
            styles.timelineIcon,
            isLarge ? styles.timelineIconLarge : styles.timelineIconSmall,
            { backgroundColor: itemColor }
          ]}>
            <ThemedText style={[
              styles.iconText,
              isLarge && styles.iconTextLarge
            ]}>
              {icon}
            </ThemedText>
          </View>
          {index < mockTimelineData.length - 1 && <View style={styles.timelineLine} />}
        </View>

        {/* Content */}
        <View style={styles.contentContainer}>
          <View style={styles.contentHeader}>
            {item.endTime && (
              <ThemedText style={styles.timeRange}>
                오후 {item.time}-{item.endTime} {item.duration && `(${item.duration})`}
              </ThemedText>
            )}
            <ThemedText style={styles.itemTitle}>{item.title}</ThemedText>
            {item.subtitle && (
              <ThemedText style={styles.itemSubtitle}>{item.subtitle}</ThemedText>
            )}
            {item.progress && (
              <ThemedText style={styles.progressText}>
                ☑️ {item.progress.current}/{item.progress.total}
              </ThemedText>
            )}
          </View>
          
          {/* Completion circle */}
          <TouchableOpacity style={[
            styles.completionCircle,
            item.completed && styles.completionCircleCompleted
          ]}>
            {item.completed && (
              <ThemedText style={styles.checkmark}>✓</ThemedText>
            )}
          </TouchableOpacity>
        </View>
      </ThemedView>
    );
  };

  return (
    <ThemedView style={styles.container} lightColor={Colors.light.background}>
        {renderDayCalendar()}
        
        <ScrollView 
          style={styles.timelineContainer}
          showsVerticalScrollIndicator={false}
        >
          <ThemedView style={styles.timelineContent} lightColor={Colors.light.background}>
            {mockTimelineData.map((item, index) => renderTimelineItem(item, index))}
          </ThemedView>
        </ScrollView>
      </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 50, // Safe area padding for status bar
    backgroundColor: '#FFFFFF', // Force white background
  },
  calendarContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
    backgroundColor: '#FFFFFF',
  },
  monthTitle: {
    marginBottom: 20,
    textAlign: 'left',
  },
  dayScrollView: {
    flexGrow: 0,
  },
  dayScrollContent: {
    paddingHorizontal: 10,
  },
  dayContainer: {
    alignItems: 'center',
    marginHorizontal: 8,
    paddingVertical: 8,
    minWidth: 50,
  },
  todayContainer: {
    backgroundColor: Colors.light.secondary,
    borderRadius: 20,
    paddingHorizontal: 12,
  },
  dayOfWeek: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    marginBottom: 4,
  },
  todayText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  dayNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  activityDots: {
    flexDirection: 'row',
    gap: 2,
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  timelineContainer: {
    flex: 1,
    paddingHorizontal: 20,
    backgroundColor: '#FFFFFF',
  },
  timelineContent: {
    paddingBottom: 100, // Extra space for bottom navigation
    backgroundColor: '#FFFFFF',
  },
  timelineItemContainer: {
    flexDirection: 'row',
    marginBottom: 20,
    alignItems: 'flex-start',
  },
  timeMarker: {
    width: 50,
    alignItems: 'flex-end',
    paddingRight: 15,
    paddingTop: 5,
  },
  timeText: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    fontWeight: '500',
  },
  timelineColumn: {
    alignItems: 'center',
    marginRight: 15,
    position: 'relative',
  },
  timelineLine: {
    width: 2,
    height: 20,
    backgroundColor: Colors.light.border,
    position: 'absolute',
  },
  timelineIcon: {
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  timelineIconSmall: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  timelineIconLarge: {
    width: 60,
    height: 80,
    borderRadius: 30,
  },
  iconText: {
    fontSize: 16,
  },
  iconTextLarge: {
    fontSize: 20,
  },
  contentContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  contentHeader: {
    flex: 1,
    paddingRight: 10,
  },
  timeRange: {
    fontSize: 12,
    color: Colors.light.textMuted,
    marginBottom: 4,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
    color: Colors.light.text,
  },
  itemSubtitle: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    lineHeight: 18,
  },
  progressText: {
    fontSize: 12,
    color: Colors.light.textMuted,
    marginTop: 4,
  },
  completionCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.light.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.light.background,
  },
  completionCircleCompleted: {
    backgroundColor: Colors.light.secondary,
    borderColor: Colors.light.secondary,
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
});