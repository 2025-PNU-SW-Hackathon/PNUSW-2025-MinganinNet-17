import { useMemo, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Calendar, DateData } from 'react-native-calendars';
import type { Task as PopupTask } from '../../components/DailySchedulePopup';
import DailySchedulePopup from '../../components/DailySchedulePopup';

const getCompletionColor = (score: number): string => {
  if (score >= 9) return '#d6d4ff';      // 가장 밝은 보라
  if (score >= 7) return '#b2aaff';      // 밝은 보라
  if (score >= 5) return '#a29bfe';      // 중간 보라
  if (score >= 3) return '#7d75ff';      // 진한 보라
  if (score >= 1) return '#2d2966';      // 가장 진한 보라
  return '#1c1c2e';                      // score 0: 더 어두운 보라(달력 배경색과 동일)
};

// 타입 선언 (calendar 전용)
type CalendarTask = { id: string; description: string; time: string; score?: number };
type SampleData = { [date: string]: CalendarTask[] };
const sampleData: SampleData = require('./sample.json');
type MarkedDate = { customStyles: { container: any } };

const CalendarScreen = () => {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [popupVisible, setPopupVisible] = useState(false);

  // 커스텀 날짜 컴포넌트
  const CustomDayComponent = ({ date, state, onPress }: any) => {
    const dateStr = date?.dateString;
    const tasks = sampleData[dateStr] as CalendarTask[] | undefined;
    const avgScore = tasks?.length
      ? tasks.reduce((sum: number, t: CalendarTask) => sum + (t.score ?? 0), 0) / tasks.length
      : NaN;
    
    const backgroundColor = !isNaN(avgScore) ? getCompletionColor(avgScore) : 'transparent';
    const isSelected = selectedDate === dateStr;
    
    return (
      <TouchableOpacity
        onPress={() => onPress(date)}
        style={[
          styles.dayContainer,
          { backgroundColor },
          isSelected && styles.selectedDay,
        ]}
      >
        <Text style={[
          styles.dayText,
          state === 'disabled' && styles.disabledDayText,
          isSelected && styles.selectedDayText,
        ]}>
          {date?.day}
        </Text>
      </TouchableOpacity>
    );
  };

  // sample.json 기반 markedDates 생성 (이제는 색상만 관리)
  const markedDates = useMemo(() => {
    const result: { [date: string]: MarkedDate } = {};
    
    // sampleData에 있는 날짜만 마킹 (색상은 dayComponent에서 처리)
    Object.entries(sampleData as SampleData).forEach(([date, tasks]) => {
      const arr = tasks as CalendarTask[];
      const avgScore = arr.length
        ? arr.reduce((sum: number, t: CalendarTask) => sum + (t.score ?? 0), 0) / arr.length
        : NaN;
      if (!isNaN(avgScore)) {
        result[date] = {
          customStyles: {
            container: {
              // 색상은 dayComponent에서 처리하므로 여기서는 빈 객체
            },
          },
        };
      }
    });
    return result;
  }, [selectedDate]);

  const handleDayPress = (day: DateData) => {
    setSelectedDate(day.dateString);
    setPopupVisible(true);
  };

  // 선택된 날짜의 task 목록 표시 (CalendarTask → PopupTask로 변환)
  const popupTasks: PopupTask[] = useMemo(() => {
    if (!selectedDate) return [];
    const arr = sampleData[selectedDate] as CalendarTask[] | undefined;
    if (!arr) return [];
    return arr.map((item) => ({
      id: item.id,
      title: item.description, // description을 title로
      completed: false,        // 임의로 false (score 등으로 변환 가능)
      type: 'normal',          // 임의로 normal (score 등으로 변환 가능)
    }));
  }, [selectedDate]);


  return (
    <View style={styles.container}>
      {/* <Button title="캘린더 데이터 삽입" onPress={handleInsert} /> */}
      <Calendar
        current={selectedDate || new Date().toISOString().split('T')[0]}
        onDayPress={handleDayPress}
        markingType="custom"
        markedDates={markedDates}
        dayComponent={CustomDayComponent}
        theme={{
          backgroundColor: '#1c1c2e',
          calendarBackground: '#1c1c2e',
          textSectionTitleColor: '#a9a9c2',
          selectedDayBackgroundColor: '#6c63ff',
          selectedDayTextColor: '#fff',
          todayTextColor: '#6c63ff',
          dayTextColor: '#fff', // 이번 달 날짜 밝게
          textDisabledColor: '#333', // 이전/다음 달 날짜 밝게
          monthTextColor: '#fff',
          indicatorColor: '#6c63ff',
          textDayFontFamily: 'Inter',
          textMonthFontFamily: 'Inter',
          textDayFontWeight: '500',
          textMonthFontWeight: 'bold',
          textDayHeaderFontWeight: '500',
          textDayFontSize: 14,
          textMonthFontSize: 18,
          textDayHeaderFontSize: 12,
        }}
        style={[styles.calendar, { width: 310 }]}
      />
      <DailySchedulePopup
        visible={popupVisible}
        date={selectedDate || ''}
        tasks={popupTasks}
        onClose={() => setPopupVisible(false)}
        onTaskToggle={() => {}}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1c1c2e',
    paddingTop: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 20,
  },
  calendar: {
    borderRadius: 16,
    backgroundColor: '#1c1c2e',
    elevation: 2,
  },
  dayContainer: {
    width: 40,
    height: 40,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
    margin: -6,
  },
  dayText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#fff',
  },
  disabledDayText: {
    color: '#333',
  },
  selectedDay: {
    backgroundColor: '#3a3a50',
  },
  selectedDayText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});

export default CalendarScreen; 