import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { WeeklyReportFromSupabase } from '../../backend/supabase/reports';
import { Colors } from '../../constants/Colors';
import { useColorScheme } from '../../hooks/useColorScheme';
import DebugNextButton from '../DebugNextButton';
import { ActivitySection } from './components/weekly_ActivitySection';
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

interface WeeklyReportResultScreenProps {
  currentWeeklyReport: WeeklyReportFromSupabase | null;
  onSaveReport: () => void;
  onDebugWeeklyNavigation: () => void;
}

export const WeeklyReportResultScreen = ({ 
  currentWeeklyReport, 
  onSaveReport, 
  onDebugWeeklyNavigation 
}: WeeklyReportResultScreenProps) => {
  const colorScheme = useColorScheme();
  
  // Map backend data to UI
  const currentWeekData: WeeklyReportData | null = currentWeeklyReport
    ? mapWeeklyReportFromSupabase(currentWeeklyReport)
    : null;
  
  // Show error state if no data available
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
      {/* Weekly Summary Title */}
      <Text style={[styles.weeklySummaryTitle, { color: Colors[colorScheme ?? 'light'].text }]}>
        {formatWeeklyDate(currentWeekData.weekStart, currentWeekData.weekEnd).replace('주간 리포트', '주간 요약')}
      </Text>
      
      {/* Activity Section */}
      <ActivitySection data={currentWeekData} />
      
      {/* Reviews Section */}
      <ReviewsSection data={currentWeekData} />

      {/* Save Button under reviews */}
      <TouchableOpacity 
        style={[styles.weeklyReportButton, { backgroundColor: '#1c1c2e', marginTop: 24 }]}
        onPress={onSaveReport}
        activeOpacity={0.8}
      >
        <Text style={styles.weeklyReportButtonText}>
          저장
        </Text>
      </TouchableOpacity>
      
      {/* Debug Button */}
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
