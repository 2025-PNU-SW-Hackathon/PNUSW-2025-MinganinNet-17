import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { WeeklyReportFromSupabase } from '../../backend/supabase/reports';
import { Colors } from '../../constants/Colors';
import { useColorScheme } from '../../hooks/useColorScheme';
import DebugNextButton from '../DebugNextButton';
import { ActivitySection } from './components/weekly_ActivitySection';
import { WeekNavigator } from './components/weekly_Navigator';
import { ReviewsSection } from './components/weekly_ReviewsSection';

// Mock Weekly Report Data Interface
interface WeeklyReportData {
  id: string;
  weekStart: string;
  weekEnd: string;
  achievementScore: number;
  daysCompleted: number;
  totalDays: number;
  insights: string;
  bestDay: string;
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
  const dayNames = ['월', '화', '수', '목', '금', '토', '일'];
  const dailyScores = report.daily_scores || [];
  let bestDayIndex = 0;
  let bestScore = -1;
  dailyScores.forEach((score, idx) => {
    if (score > bestScore) {
      bestScore = score;
      bestDayIndex = idx;
    }
  });

  return {
    id: report.id,
    weekStart: report.week_start,
    weekEnd: report.week_end,
    achievementScore: Math.round(report.average_score),
    daysCompleted: report.days_completed,
    totalDays: 7,
    insights: report.insights,
    bestDay: dayNames[bestDayIndex] || '월',
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
    achievementScore: 8,
    daysCompleted: 6,
    totalDays: 7,
    averageScore: 8.2,
    bestDay: '금요일',
    dailyScores: [8, 7, 9, 8, 10, 6, 9],
    insights: '이번 주는 목표를 꾸준히 달성했습니다.\n주 중 내용 2\n주 중 내용 3'
  },
  {
    id: 'week-2',
    weekStart: '2025-01-20',
    weekEnd: '2025-01-26',
    achievementScore: 7,
    daysCompleted: 5,
    totalDays: 7,
    averageScore: 7.4,
    bestDay: '수요일',
    dailyScores: [6, 8, 9, 7, 6, 0, 8],
    insights: '지난주 대비 향상된 성과를 보였습니다.\n주말 활동이 부족했습니다.\n전반적으로 안정적인 패턴을 유지했습니다.'
  },
  {
    id: 'week-3',
    weekStart: '2025-01-13',
    weekEnd: '2025-01-19',
    achievementScore: 6,
    daysCompleted: 4,
    totalDays: 7,
    averageScore: 6.1,
    bestDay: '화요일',
    dailyScores: [5, 8, 6, 0, 7, 0, 0],
    insights: '목표 달성에 어려움이 있었습니다.\n새로운 도전에 적응하는 시간이 필요했습니다.\n다음 주는 더 나은 결과를 기대합니다.'
  }
];

interface WeeklyReportSectionProps {
  currentWeekIndex: number;
  currentWeekReportGenerated: boolean;
  currentWeeklyReport: WeeklyReportFromSupabase | null;
  onNavigate: (direction: 'previous' | 'next') => void;
  onStartWeeklyReport: () => void;
  onDebugWeeklyNavigation: () => void;
}

export const WeeklyReportSection = ({
  currentWeekIndex,
  currentWeekReportGenerated,
  currentWeeklyReport,
  onNavigate,
  onStartWeeklyReport,
  onDebugWeeklyNavigation
}: WeeklyReportSectionProps) => {
  const colorScheme = useColorScheme();

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
              onPress={onStartWeeklyReport}
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

  if (currentWeekIndex === 0 && !currentWeekReportGenerated) {
    // Current week without generated report - show empty state
    return (
      <View style={styles.newWeeklyContainer}>
        <WeekNavigator 
          currentWeekIndex={currentWeekIndex}
          currentWeekReportGenerated={currentWeekReportGenerated}
          weeklyReportsLength={mockWeeklyReports.length}
          onNavigate={onNavigate}
        />
        <EmptyWeeklyReport />
        <DebugNextButton
          to="Next Weekly State"
          onPress={onDebugWeeklyNavigation}
          label="Debug: Cycle Weeks"
          disabled={false}
        />
      </View>
    );
  } else if (currentWeekIndex === -1) {
    // Next week - show creation screen
    return (
      <View style={styles.newWeeklyContainer}>
        <WeekNavigator 
          currentWeekIndex={currentWeekIndex}
          currentWeekReportGenerated={currentWeekReportGenerated}
          weeklyReportsLength={mockWeeklyReports.length}
          onNavigate={onNavigate}
        />
        <EmptyWeeklyReport />
        <DebugNextButton
          to="Next Weekly State"
          onPress={onDebugWeeklyNavigation}
          label="Debug: Cycle Weeks"
          disabled={false}
        />
      </View>
    );
  } else if (currentWeekIndex === 0 && currentWeekReportGenerated) {
    // Current week and report is generated → show result in weekly tab too
    const currentWeekData: WeeklyReportData | null = currentWeeklyReport
      ? mapWeeklyReportFromSupabase(currentWeeklyReport)
      : null;

    if (!currentWeekData) {
      return (
        <View style={styles.contentContainer}>
          <Text style={{ color: Colors[colorScheme ?? 'light'].text }}>
            주간 리포트 데이터를 불러올 수 없습니다.
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.newWeeklyContainer}>
        <WeekNavigator 
          currentWeekIndex={currentWeekIndex}
          currentWeekReportGenerated={currentWeekReportGenerated}
          weeklyReportsLength={mockWeeklyReports.length}
          onNavigate={onNavigate}
        />
        <Text style={[styles.weeklySummaryTitle, { color: Colors[colorScheme ?? 'light'].text }]}>
          {formatWeeklyDate(currentWeekData.weekStart, currentWeekData.weekEnd).replace('주간 리포트', '주간 요약')}
        </Text>
        <ActivitySection data={currentWeekData} />
        <ReviewsSection data={currentWeekData} />

        <TouchableOpacity 
          style={[styles.weeklyReportButton, { backgroundColor: '#1c1c2e', marginTop: 24 }]}
          onPress={onStartWeeklyReport}
          activeOpacity={0.8}
        >
          <Text style={styles.weeklyReportButtonText}>
            주간 리포트 시작하기
          </Text>
        </TouchableOpacity>
      </View>
    );
  } else if (currentWeekIndex > 0) {
    // Previous weeks - show historical data
    const currentWeekData = mockWeeklyReports[currentWeekIndex - 1];
    
    if (!currentWeekData) {
      return (
        <View style={styles.contentContainer}>
          <Text style={{ color: Colors[colorScheme ?? 'light'].text }}>
            주간 리포트 데이터를 불러올 수 없습니다.
          </Text>
        </View>
      );
    }
    
    return (
      <View style={styles.newWeeklyContainer}>
        <WeekNavigator 
          currentWeekIndex={currentWeekIndex}
          currentWeekReportGenerated={currentWeekReportGenerated}
          weeklyReportsLength={mockWeeklyReports.length}
          onNavigate={onNavigate}
        />
        <Text style={[styles.weeklySummaryTitle, { color: Colors[colorScheme ?? 'light'].text }]}>
          {formatWeeklyDate(currentWeekData.weekStart, currentWeekData.weekEnd).replace('주간 리포트', '주간 요약')}
        </Text>
        <ActivitySection data={currentWeekData} />
        <ReviewsSection data={currentWeekData} />
        <DebugNextButton
          to="Next Weekly State"
          onPress={onDebugWeeklyNavigation}
          label="Debug: Cycle Weeks"
          disabled={false}
        />
      </View>
    );
  }
  
  // Default case - show empty state
  return (
    <View style={styles.newWeeklyContainer}>
      <WeekNavigator 
        currentWeekIndex={currentWeekIndex}
        currentWeekReportGenerated={currentWeekReportGenerated}
        weeklyReportsLength={mockWeeklyReports.length}
        onNavigate={onNavigate}
      />
      <EmptyWeeklyReport />
      <DebugNextButton
        to="Next Weekly State"
        onPress={onDebugWeeklyNavigation}
        label="Debug: Cycle Weeks"
        disabled={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  newWeeklyContainer: {
    flex: 1,
    paddingHorizontal: 24,
  },
  contentContainer: {
    paddingHorizontal: 24,
    gap: 16,
    flex: 1,
  },
  weeklySummaryTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 32,
    marginTop: 16,
    fontFamily: 'Inter',
  },
  // Empty Weekly Report Styles
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
