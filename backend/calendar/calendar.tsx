import { useMemo, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { Calendar, DateData } from 'react-native-calendars';
import DailySchedulePopup from '../../components/DailySchedulePopup';
import inputData from './inputData'; // input.json을 JS 객체로 변환해서 import
import { calendarSupabase } from './supabaseClient';

const getCompletionColor = (score: number): string => {
  if (score >= 9) return '#2d5a2d';
  if (score >= 7) return '#4a7c4a';
  if (score >= 5) return '#6b9b6b';
  if (score >= 3) return '#8cb98c';
  if (score >= 1) return '#b8d8b8';
  return '#e8e8e8';
};

const CalendarScreen = () => {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [popupVisible, setPopupVisible] = useState(false);

  // 임시: 빈 markedDates (향후 supabase 연동 시 대체)
  const markedDates = useMemo(() => ({}), [selectedDate]);

  const handleDayPress = (day: DateData) => {
    setSelectedDate(day.dateString);
    setPopupVisible(true);
  };

  // 임시: 빈 popupTasks (향후 supabase 연동 시 대체)
  const popupTasks = useMemo(() => [], [selectedDate]);

  // 버튼 클릭 시 inputData를 Supabase에 insert
  const handleInsert = async () => {
    const rowsToInsert: any[] = [];
    inputData.forEach((item: any) => {
      const { startDate, description, time, repeat, score } = item;
      const start = new Date(startDate);
      for (let i = 0; i < repeat; i++) {
        const d = new Date(start);
        d.setDate(start.getDate() + i);
        const dateStr = d.toISOString().split('T')[0];
        rowsToInsert.push({
          date: dateStr,
          description,
          time,
          score
        });
      }
    });

    const { data, error } = await calendarSupabase
      .from('calendar')
      .insert(rowsToInsert);

    const inserted: any = data;
    if (error) {
      Alert.alert('삽입 오류', error.message);
    } else if (inserted && inserted.length) {
      Alert.alert('삽입 성공', `${inserted.length}개 일정이 추가되었습니다.`);
    } else {
      Alert.alert('삽입 성공', `일정이 추가되었습니다.`);
    }
  };

  return (
    <View style={styles.container}>
      {/* <Button title="캘린더 데이터 삽입" onPress={handleInsert} /> */}
      <Calendar
        current={selectedDate || new Date().toISOString().split('T')[0]}
        onDayPress={handleDayPress}
        markingType="custom"
        markedDates={markedDates}
        theme={{
          backgroundColor: '#fff',
          calendarBackground: '#fff',
          textSectionTitleColor: '#a9a9c2',
          selectedDayBackgroundColor: '#6c63ff',
          selectedDayTextColor: '#fff',
          todayTextColor: '#6c63ff',
          dayTextColor: '#333',
          textDisabledColor: '#ccc',
          monthTextColor: '#333',
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
    backgroundColor: '#fff',
    paddingTop: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 20,
  },
  calendar: {
    width: 350,
    borderRadius: 16,
    backgroundColor: '#fff',
    elevation: 2,
  },
});

export default CalendarScreen; 