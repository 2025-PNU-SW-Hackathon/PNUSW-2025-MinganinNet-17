import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { Colors } from '../constants/Colors';
import { useColorScheme } from '../hooks/useColorScheme';
import { IconSymbol } from './ui/IconSymbol';

// Types
interface TimelineEvent {
  id: string;
  time: string;
  title: string;
  subtitle?: string;
  type: 'alarm' | 'scheduled' | 'general';
  completed?: boolean;
  progress?: { current: number; total: number };
  icon: string;
}

interface DayData {
  date: number;
  dayName: string;
  isToday: boolean;
  activities: { color: string }[];
}

// Sample data
const SAMPLE_EVENTS: TimelineEvent[] = [
  {
    id: '1',
    time: '7:00',
    title: '산뜻한 시작',
    subtitle: '오전 7:00 ⟲',
    type: 'alarm',
    icon: 'alarm',
  },
  {
    id: '2',
    time: '9:00',
    title: 'Zz 휴식을 마쳤어요. 다시 알으로!',
    subtitle: '',
    type: 'general',
    icon: 'zzz',
  },
  {
    id: '3',
    time: '12:00',
    title: '웹개발 끝내기',
    subtitle: '오후 12:00-1:00 (1시간)',
    type: 'scheduled',
    icon: 'doc.text',
  },
  {
    id: '4',
    time: '1:00',
    title: '준비하세요, 다음 일정까지 5분 남았어요.',
    subtitle: '',
    type: 'general',
    icon: 'clock',
  },
  {
    id: '5',
    time: '5:10',
    title: 'Structured와 함께 시작!',
    subtitle: '팀허들 기본 사항 알아보기',
    type: 'general',
    completed: false,
    icon: 'list.bullet',
  },
  {
    id: '6',
    time: '5:20',
    title: '첫 일정 추가하기',
    subtitle: '하루를 체계적으로 만들기',
    type: 'general',
    progress: { current: 0, total: 5 },
    icon: 'plus',
  },
  {
    id: '7',
    time: '5:25',
    title: '보관함 채우기',
    subtitle: '뭔드시 깜빡하지 않도록',
    type: 'general',
    icon: 'archivebox',
  },
  {
    id: '8',
    time: '5:30',
    title: '나만의 스타일로 만들기',
    subtitle: '캘린더 등등과 연결하기',
    type: 'general',
    progress: { current: 0, total: 5 },
    icon: 'gearshape',
  },
];

const WEEK_DATA: DayData[] = [
  { date: 27, dayName: '일', isToday: false, activities: [{ color: '#ef4444' }, { color: '#3b82f6' }] },
  { date: 28, dayName: '월', isToday: false, activities: [{ color: '#ef4444' }, { color: '#3b82f6' }] },
  { date: 29, dayName: '화', isToday: false, activities: [{ color: '#ef4444' }, { color: '#3b82f6' }] },
  { date: 30, dayName: '수', isToday: false, activities: [{ color: '#ef4444' }, { color: '#3b82f6' }] },
  { date: 31, dayName: '목', isToday: false, activities: [{ color: '#ef4444' }, { color: '#3b82f6' }] },
  { date: 1, dayName: '금', isToday: false, activities: [{ color: '#ef4444' }, { color: '#3b82f6' }] },
  { date: 2, dayName: '토', isToday: true, activities: [{ color: '#10b981' }, { color: '#ef4444' }, { color: '#3b82f6' }] },
];

export default function TimelineView() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const getEventBackgroundColor = (type: TimelineEvent['type']) => {
    switch (type) {
      case 'alarm':
        return '#fca5a5'; // coral/pink
      case 'scheduled':
        return colors.primary; // green
      case 'general':
      default:
        return colors.neutral[300]; // gray/tan
    }
  };

  const renderCalendarHeader = () => (
    <View style={styles.calendarHeader}>
      <Text style={[styles.monthYear, { color: colors.text }]}>
        <Text style={{ color: colors.primary }}>2025년</Text> 8월
      </Text>
      <View style={styles.weekStrip}>
        {WEEK_DATA.map((day) => (
          <TouchableOpacity
            key={day.date}
            style={[
              styles.dayContainer,
              day.isToday && { backgroundColor: colors.primary },
            ]}
            onPress={() => {/* Handle date selection */}}
          >
            <Text style={[
              styles.dayName,
              { color: day.isToday ? '#ffffff' : colors.textMuted }
            ]}>
              {day.dayName}
            </Text>
            <Text style={[
              styles.dayNumber,
              { color: day.isToday ? '#ffffff' : colors.text }
            ]}>
              {day.date}
            </Text>
            <View style={styles.activityDots}>
              {day.activities.map((activity, index) => (
                <View
                  key={index}
                  style={[
                    styles.activityDot,
                    { backgroundColor: activity.color }
                  ]}
                />
              ))}
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderTimelineEvent = ({ item, index }: { item: TimelineEvent; index: number }) => {
    const backgroundColor = getEventBackgroundColor(item.type);
    const isCurrentTime = item.time === '5:10';

    return (
      <View style={styles.timelineItem}>
        <View style={styles.timelineLeft}>
          <Text style={[
            styles.timeText,
            { color: colors.textMuted },
            isCurrentTime && { color: colors.text, fontWeight: 'bold', fontSize: 18 }
          ]}>
            {item.time}
          </Text>
          {index < SAMPLE_EVENTS.length - 1 && (
            <View style={[styles.timelineLine, { borderColor: colors.border }]} />
          )}
        </View>

        <View style={styles.timelineRight}>
          <View style={[
            styles.eventCard,
            { backgroundColor },
            item.type === 'alarm' && styles.alarmCard,
            item.type === 'scheduled' && styles.scheduledCard,
          ]}>
            <View style={styles.eventContent}>
              <View style={styles.eventLeft}>
                <View style={[
                  styles.iconContainer,
                  { backgroundColor: 'rgba(255, 255, 255, 0.3)' }
                ]}>
                  <IconSymbol 
                    name={item.icon as any} 
                    size={20} 
                    color="#ffffff" 
                  />
                </View>
                <View style={styles.eventTextContainer}>
                  <Text style={styles.eventTitle}>{item.title}</Text>
                  {item.subtitle && (
                    <Text style={styles.eventSubtitle}>{item.subtitle}</Text>
                  )}
                  {item.progress && (
                    <View style={styles.progressContainer}>
                      <IconSymbol name="checkmark.square" size={16} color="#ffffff" />
                      <Text style={styles.progressText}>
                        {item.progress.current}/{item.progress.total}
                      </Text>
                      <IconSymbol name="doc.text" size={16} color="#ffffff" />
                    </View>
                  )}
                </View>
              </View>
              <TouchableOpacity style={styles.completionCircle}>
                <View style={[
                  styles.circle,
                  item.completed && { backgroundColor: colors.primary }
                ]} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {renderCalendarHeader()}
      <FlatList
        data={SAMPLE_EVENTS}
        renderItem={renderTimelineEvent}
        keyExtractor={(item) => item.id}
        style={styles.timeline}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.timelineContent}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 20,
  },
  calendarHeader: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  monthYear: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  weekStrip: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  dayContainer: {
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    minWidth: 44,
  },
  dayName: {
    fontSize: 12,
    marginBottom: 4,
  },
  dayNumber: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  activityDots: {
    flexDirection: 'row',
    gap: 3,
  },
  activityDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  timeline: {
    flex: 1,
    paddingHorizontal: 16,
  },
  timelineContent: {
    paddingBottom: 20,
  },
  timelineItem: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  timelineLeft: {
    width: 60,
    alignItems: 'flex-end',
    paddingRight: 16,
    position: 'relative',
  },
  timeText: {
    fontSize: 14,
    fontWeight: '500',
  },
  timelineLine: {
    position: 'absolute',
    top: 24,
    right: 8,
    width: 1,
    height: 40,
    borderLeftWidth: 1,
    borderStyle: 'dashed',
  },
  timelineRight: {
    flex: 1,
  },
  eventCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
  },
  alarmCard: {
    minHeight: 80,
  },
  scheduledCard: {
    minHeight: 100,
  },
  eventContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  eventLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  eventTextContainer: {
    flex: 1,
  },
  eventTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 4,
  },
  eventSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: 4,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  progressText: {
    fontSize: 12,
    color: '#ffffff',
    fontWeight: '500',
  },
  completionCircle: {
    marginLeft: 16,
  },
  circle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#ffffff',
    backgroundColor: 'transparent',
  },
});