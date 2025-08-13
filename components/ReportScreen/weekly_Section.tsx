import { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { WeeklyReportFromSupabase } from '../../backend/supabase/reports';
import { Colors } from '../../constants/Colors';
import { useColorScheme } from '../../hooks/useColorScheme';
import { WeekNavigator } from './components/weekly_Navigator';
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

// Mock Weekly Data
const mockWeeklyReports: WeeklyReportData[] = [
  {
    id: 'week-1',
    weekStart: '2025-01-27',
    weekEnd: '2025-02-02',
    daysCompleted: 6,
    averageScore: 8.2,
    dailyScores: [8, 7, 9, 8, 10, 6, 9],
    insights: '이번 주는 목표를 꾸준히 달성했습니다.\n주 중 내용 2\n주 중 내용 3'
  },
  {
    id: 'week-2',
    weekStart: '2025-01-20',
    weekEnd: '2025-01-26',
    daysCompleted: 5,
    averageScore: 7.4,
    dailyScores: [6, 8, 9, 7, 6, 0, 8],
    insights: '지난주 대비 향상된 성과를 보였습니다.\n주말 활동이 부족했습니다.\n전반적으로 안정적인 패턴을 유지했습니다.'
  },
  {
    id: 'week-3',
    weekStart: '2025-01-13',
    weekEnd: '2025-01-19',
    daysCompleted: 4,
    averageScore: 6.1,
    dailyScores: [5, 8, 6, 0, 7, 0, 0],
    insights: '목표 달성에 어려움이 있었습니다.\n새로운 도전에 적응하는 시간이 필요했습니다.\n다음 주는 더 나은 결과를 기대합니다.'
  }
];

interface WeeklyReportSectionProps {
}

export const WeeklyReportSection = ({}: WeeklyReportSectionProps) => {
  const colorScheme = useColorScheme();
  const [isCreating, setIsCreating] = useState(false);

  // If creating report, show the create flow
  if (isCreating) {
    return <WeeklyReportCreateFlow onBack={() => setIsCreating(false)} />;
  }

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

  // 현재는 빈 상태만 표시 (기존 복잡한 로직 제거)
  return (
    <View style={styles.newWeeklyContainer}>
      <WeekNavigator 
        currentWeekIndex={0}
        currentWeekReportGenerated={false}
        weeklyReportsLength={mockWeeklyReports.length}
        onNavigate={() => {}} // 빈 함수로 처리
      />
      <EmptyWeeklyReport />
    </View>
  );
};

const styles = StyleSheet.create({
  newWeeklyContainer: {
    flex: 1,
    paddingHorizontal: 24,
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
