import { useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Calendar, DateData } from 'react-native-calendars';
import type { Task as PopupTask } from '../../components/DailySchedulePopup';
import DailySchedulePopup from '../../components/DailySchedulePopup';
import { CalendarReport, fetchReports } from '../supabase/reports';

const getCompletionColor = (score: number): string => {
  if (score >= 9) return '#d6d4ff';      // 가장 밝은 보라
  if (score >= 7) return '#b2aaff';      // 밝은 보라
  if (score >= 5) return '#a29bfe';      // 중간 보라
  if (score >= 3) return '#7d75ff';      // 진한 보라
  if (score >= 1) return '#2d2966';      // 가장 진한 보라
  return '#1c1c2e';                      // score 0: 더 어두운 보라(달력 배경색과 동일)
};

// MarkedDate 타입 선언
type MarkedDate = { customStyles: { container: any } };

const CalendarScreen = () => {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [popupVisible, setPopupVisible] = useState(false);
  const [reportsData, setReportsData] = useState<{ [date: string]: CalendarReport }>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Supabase에서 리포트 데이터 가져오기
  useEffect(() => {
    const loadReports = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const { todayReport, historicalReports } = await fetchReports();
        const allReports = [todayReport, ...historicalReports].filter(Boolean);
        
        // 날짜별로 데이터 매핑
        const mappedData: { [date: string]: CalendarReport } = {};
        allReports.forEach((report) => {
          if (report) {
            mappedData[report.report_date] = {
              date: report.report_date,
              achievement_score: report.achievement_score,
              daily_tasks: report.daily_activities?.todos || [],
              ai_coach_feedback: report.ai_coach_feedback || [],
            };
          }
        });
        
        setReportsData(mappedData);
      } catch (err) {
        console.error('리포트 데이터 로딩 실패:', err);
        setError('데이터를 불러오는 중 오류가 발생했습니다.');
      } finally {
        setLoading(false);
      }
    };

    loadReports();
  }, []);

  // 커스텀 날짜 컴포넌트
  const CustomDayComponent = ({ date, state, onPress }: any) => {
    const dateStr = date?.dateString;
    const reportData = reportsData[dateStr];
    const score = reportData?.achievement_score ?? NaN;
    
    const backgroundColor = !isNaN(score) ? getCompletionColor(score) : 'transparent';
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

  // Supabase 데이터 기반 markedDates 생성
  const markedDates = useMemo(() => {
    const result: { [date: string]: MarkedDate } = {};
    
    Object.entries(reportsData).forEach(([date, report]) => {
      if (!isNaN(report.achievement_score)) {
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
  }, [reportsData, selectedDate]);

  const handleDayPress = (day: DateData) => {
    setSelectedDate(day.dateString);
    setPopupVisible(true);
  };

  // 선택된 날짜의 task 목록 표시 (DailyTask → PopupTask로 변환)
  const popupTasks: PopupTask[] = useMemo(() => {
    if (!selectedDate || !reportsData[selectedDate]) return [];
    
    const dailyTasks = reportsData[selectedDate].daily_tasks;
    if (!dailyTasks) return [];
    
    return dailyTasks.map((task) => ({
      id: task.id.toString(),
      title: task.description,
      completed: task.completed,
      type: 'normal',
    }));
  }, [selectedDate, reportsData]);

  // 로딩 화면
  if (loading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator size="large" color="#6c63ff" />
        <Text style={styles.loadingText}>데이터를 불러오는 중...</Text>
      </View>
    );
  }

  // 다시 시도 함수
  const retryLoadReports = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const { todayReport, historicalReports } = await fetchReports();
      const allReports = [todayReport, ...historicalReports].filter(Boolean);
      
             // 날짜별로 데이터 매핑
       const mappedData: { [date: string]: CalendarReport } = {};
       allReports.forEach((report) => {
         if (report) {
           mappedData[report.report_date] = {
             date: report.report_date,
             achievement_score: report.achievement_score,
             daily_tasks: report.daily_activities?.todos || [],
             ai_coach_feedback: report.ai_coach_feedback || [],
           };
         }
       });
      
      setReportsData(mappedData);
    } catch (err) {
      console.error('리포트 데이터 로딩 실패:', err);
      setError('데이터를 불러오는 중 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  // 에러 화면
  if (error) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <Text style={styles.errorText}>{error}</Text>
        <TouchableOpacity 
          style={styles.retryButton}
          onPress={retryLoadReports}
        >
          <Text style={styles.retryButtonText}>다시 시도</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
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
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
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
  loadingText: {
    color: '#fff',
    fontSize: 16,
    marginTop: 16,
  },
  errorText: {
    color: '#ff6b6b',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  retryButton: {
    backgroundColor: '#6c63ff',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default CalendarScreen; 