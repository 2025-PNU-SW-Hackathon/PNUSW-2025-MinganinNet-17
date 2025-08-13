import { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { WeeklyReportFromSupabase, fetchWeeklyReports } from '../../backend/supabase/reports';
import { Colors } from '../../constants/Colors';
import { useColorScheme } from '../../hooks/useColorScheme';
import { ActivitySection } from './components/weekly_ActivitySection';
import { WeekNavigator } from './components/weekly_Navigator';
import { ReviewsSection } from './components/weekly_ReviewsSection';
import WeeklyReportCreateFlow from './weekly/WeeklyReportCreateFlow';

// Mock Weekly Report Data Interface
interface WeeklyReportData {
  id: string;
  weekStart: string;
  weekEnd: string;
  daysCompleted: number;
  insights: string;
  averageScore: number;
  dailyScores: number[];
}

// Helper function to format weekly date range
const formatWeeklyDate = (weekStart: string, weekEnd: string): string => {
  const startDate = new Date(weekStart);
  const endDate = new Date(weekEnd);
  const startMonth = String(startDate.getMonth() + 1).padStart(2, '0');
  const startDay = String(startDate.getDate()).padStart(2, '0');
  const endMonth = String(endDate.getMonth() + 1).padStart(2, '0');
  const endDay = String(endDate.getDate()).padStart(2, '0');
  
  if (startMonth === endMonth) {
    return `${startMonth}월 ${startDay}일-${endDay}일 주간 리포트`;
  } else {
    return `${startMonth}월 ${startDay}일-${endMonth}월 ${endDay}일 주간 리포트`;
  }
};

// Backend → UI 데이터 매핑 함수
const mapWeeklyReportFromSupabase = (report: WeeklyReportFromSupabase): WeeklyReportData => {
  return {
    id: report.id,
    weekStart: report.week_start,
    weekEnd: report.week_end,
    daysCompleted: report.days_completed,
    insights: report.insights,
    averageScore: report.average_score,
    dailyScores: report.daily_scores,
  };
};

// 현재 주차의 시작일 계산 함수
const getCurrentWeekStart = (): string => {
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0=일요일, 1=월요일, ..., 6=토요일
  const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek; // 월요일까지의 차이
  
  const monday = new Date(today);
  monday.setDate(today.getDate() + diffToMonday);
  monday.setHours(0, 0, 0, 0);
  
  return monday.toISOString().split('T')[0];
};

interface WeeklyReportSectionProps {
}

export const WeeklyReportSection = ({}: WeeklyReportSectionProps) => {
  const colorScheme = useColorScheme();
  const [isCreating, setIsCreating] = useState(false);
  const [weeklyReports, setWeeklyReports] = useState<WeeklyReportFromSupabase[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [currentWeekIndex, setCurrentWeekIndex] = useState(0);

  // 주간 리포트 데이터 로딩
  useEffect(() => {
    const loadWeeklyReports = async () => {
      try {
        setIsLoading(true);
        const reports = await fetchWeeklyReports();
        setWeeklyReports(reports);
        
        // 현재 주차 인덱스 찾기
        const currentWeekStart = getCurrentWeekStart();
        const currentIndex = reports.findIndex(report => report.week_start === currentWeekStart);
        setCurrentWeekIndex(currentIndex >= 0 ? currentIndex : 0);
      } catch (error) {
        console.error('주간 리포트 로딩 실패:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadWeeklyReports();
  }, []);

  // If creating report, show the create flow
  if (isCreating) {
    return <WeeklyReportCreateFlow onBack={() => setIsCreating(false)} />;
  }

  // 현재 주차의 리포트 데이터
  const currentWeekReport = weeklyReports[currentWeekIndex];
  const currentWeekData = currentWeekReport ? mapWeeklyReportFromSupabase(currentWeekReport) : null;

  // 주간 리포트 표시 컴포넌트
  const WeeklyReportDisplay = () => {
    if (!currentWeekData) {
      return <EmptyWeeklyReport />;
    }

    return (
      <View style={styles.weeklyReportContainer}>
        {/* Weekly Summary Title */}
        <Text style={[styles.weeklySummaryTitle, { color: Colors[colorScheme ?? 'light'].text }]}>
          {formatWeeklyDate(currentWeekData.weekStart, currentWeekData.weekEnd).replace('주간 리포트', '주간 요약')}
        </Text>

        {/* Activity Section */}
        <ActivitySection data={currentWeekData} />

        {/* Reviews Section */}
        <ReviewsSection data={currentWeekData} />
      </View>
    );
  };

  // Empty Weekly Report Component
  const EmptyWeeklyReport = () => {
    const isEndOfWeek = true;
    
    if (isEndOfWeek) {
      return (
        <View style={styles.emptyWeeklyContainer}>
          <View style={styles.emptyWeeklyContent}>
            <Text style={styles.emptyWeeklyIcon}>✨</Text>
            <Text style={[styles.emptyWeeklyText, { color: Colors[colorScheme ?? 'light'].text }]}>
              이번 주도 수고 많았습니다.{'\n'}리포트를 진행하시겠어요?
            </Text>
            <TouchableOpacity 
              style={[styles.weeklyReportButton, { backgroundColor: '#1c1c2e' }]}
              onPress={() => setIsCreating(true)}
              activeOpacity={0.8}
            >
              <Text style={styles.weeklyReportButtonText}>
                주간 리포트 시작하기
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }
    
    return (
      <View style={styles.emptyWeeklyContainer}>
        <View style={styles.emptyWeeklyContent}>
          <Text style={styles.emptyWeeklyIcon}>📅</Text>
          <Text style={[styles.emptyWeeklyText, { color: Colors[colorScheme ?? 'light'].text }]}>
            아직 주차가 끝나지 않았습니다.{'\n'}이번주가 끝나고 뵈어요!
          </Text>
        </View>
      </View>
    );
  };

  // 로딩 중 표시
  if (isLoading) {
    return (
      <View style={styles.newWeeklyContainer}>
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: Colors[colorScheme ?? 'light'].text }]}>
            주간 리포트를 불러오는 중...
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.newWeeklyContainer}>
      <WeekNavigator 
        currentWeekIndex={currentWeekIndex}
        currentWeekReportGenerated={!!currentWeekReport}
        weeklyReportsLength={weeklyReports.length}
        onNavigate={(index) => setCurrentWeekIndex(Number(index))}
      />
      <WeeklyReportDisplay />
    </View>
  );
};

const styles = StyleSheet.create({
  newWeeklyContainer: {
    flex: 1,
    paddingHorizontal: 24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    fontSize: 16,
    fontFamily: 'Inter',
  },
  weeklyReportContainer: {
    flex: 1,
  },
  weeklySummaryTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 32,
    fontFamily: 'Inter',
  },
  emptyWeeklyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    marginTop: -40,
  },
  emptyWeeklyContent: {
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyWeeklyIcon: {
    fontSize: 64,
    marginBottom: 24,
  },
  emptyWeeklyText: {
    fontSize: 22,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 32,
    fontFamily: 'Inter',
  },
  weeklyReportButton: {
    marginTop: 32,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  weeklyReportButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
    fontFamily: 'Inter',
  },
});
