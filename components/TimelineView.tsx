import { useEffect, useMemo, useState } from 'react';
import {
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Colors } from '../constants/Colors';
import { useColorScheme } from '../hooks/useColorScheme';
import { fetchTimelineEventsForDate } from '../services/timelineService';
import { TimelineEvent } from '../utils/timelineConverter';
import { IconSymbol } from './ui/IconSymbol';

// TimelineEvent 타입은 utils/timelineConverter.ts에서 import

// 캘린더의 각 날짜를 나타내는 타입
interface DayData {
  dayName: string;        // "월", "화", "수" 등
  dayNumber: string;      // "01", "02", "03" 등 (2자리 패딩)
  isToday: boolean;       // 오늘 여부
  activities: { color: string }[];  // 활동 점들의 색상 배열
}

// 하드코딩된 샘플 데이터는 제거하고 실제 DB 데이터를 사용합니다.



export default function TimelineView() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  // 상태 관리
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [timelineEvents, setTimelineEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(false);

  // 날짜 관련 함수들 (HomeScreen에서 복사/수정)
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

  const formatCalendarDate = (date: Date) => {
    const days = ['일', '월', '화', '수', '목', '금', '토']; // 한글로 변경
    return {
      dayName: days[date.getDay()],
      dayNumber: date.getDate().toString().padStart(2, '0'),
      isToday: date.toDateString() === new Date().toDateString(),
      dateString: date.toISOString().split('T')[0]
    };
  };

  // 활동 데이터 생성 함수
  const generateActivitiesForDate = (date: Date) => {
    // 임시로 랜덤하게 activities 생성
    const colors = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b'];
    const activityCount = Math.floor(Math.random() * 3) + 1; // 1-3개
    return Array.from({ length: activityCount }, () => ({
      color: colors[Math.floor(Math.random() * colors.length)]
    }));
  };

  // 메모 함수들
  const calendarDates = useMemo(() => getCalendarDates(), []);
  const weekData = useMemo(() => 
    calendarDates.map(date => ({
      ...formatCalendarDate(date),
      activities: generateActivitiesForDate(date)
    })), 
  [calendarDates]);

  // 이벤트 타입에 따라 배경색을 결정하는 유틸리티 함수
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
  
  // 캘린더 헤더 렌더링
  const renderCalendarHeader = () => (
    <View style={styles.calendarHeader}>
      <Text style={[styles.monthYear, { color: colors.text }]}>
        <Text style={{ color: colors.primary }}>
          {new Date().getFullYear()}년
        </Text> {new Date().getMonth() + 1}월
      </Text>
      <View style={styles.weekStrip}>
        {weekData.map((day) => {
          // 우선순위: 선택된 날짜 > 오늘 날짜
          const isSelected = selectedDate === day.dateString;
          const highlightStyle = isSelected ? { backgroundColor: colors.primary } : 
                                day.isToday ? { backgroundColor: colors.neutral[200] } : null;

          // 텍스트 색상도 우선순위에 따라 조정
          const textColor = isSelected ? '#ffffff' : 
                           day.isToday ? colors.text : colors.textMuted;

          return (
            <TouchableOpacity
              key={day.dayNumber}
              style={[
                styles.dayContainer,
                highlightStyle,
              ]}
              onPress={() => setSelectedDate(day.dateString)}
            >
              <Text style={[
                styles.dayName,
                { color: textColor }
              ]}>
                {day.dayName}
              </Text>
              <Text style={[
                styles.dayNumber,
                { color: textColor }
              ]}>
                {day.dayNumber}
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
         );
        })}
      </View>
    </View>
  );

  // 타임라인의 각 이벤트를 렌더링하는 함수
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
          {index < timelineEvents.length - 1 && (
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

  // selectedDate가 변경될 때마다 DB에서 데이터 가져오기
  useEffect(() => {
    const loadTimelineEvents = async () => {
      setLoading(true);
      try {
        console.log(`📅 선택된 날짜: ${selectedDate}`);
        const events = await fetchTimelineEventsForDate(selectedDate);
        setTimelineEvents(events);
        console.log(`✅ 로드된 이벤트: ${events.length}개`);
      } catch (error) {
        console.error('타임라인 이벤트 로딩 실패:', error);
        setTimelineEvents([]); // 에러 시 빈 배열
      } finally {
        setLoading(false);
      }
    };
    
    loadTimelineEvents();
  }, [selectedDate]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {renderCalendarHeader()}
      <FlatList
        data={timelineEvents} // SAMPLE_EVENTS 대신 실제 DB 데이터 사용
        renderItem={renderTimelineEvent}
        keyExtractor={(item) => item.id}
        style={styles.timeline}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.timelineContent}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={[styles.emptyText, { color: colors.textMuted }]}>
              {loading ? '로딩 중...' : '이 날짜에는 일정이 없습니다'}
            </Text>
          </View>
        }
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
  },
});