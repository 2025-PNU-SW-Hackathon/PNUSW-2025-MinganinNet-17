import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { WeeklyReportFromSupabase } from '../../../../backend/supabase/reports';
import { Colors } from '../../../../constants/Colors';
import { useColorScheme } from '../../../../hooks/useColorScheme';
import { ActivitySection } from '../../components/weekly_ActivitySection';
import { ReviewsSection } from '../../components/weekly_ReviewsSection';

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

interface WeeklyReportResultProps {
  weeklyReport: WeeklyReportFromSupabase;
  onBack: () => void;
}

export default function WeeklyReportResult({ 
  weeklyReport, 
  onBack 
}: WeeklyReportResultProps) {
  const colorScheme = useColorScheme();
  
  // Map backend data to UI
  const currentWeekData: WeeklyReportData = mapWeeklyReportFromSupabase(weeklyReport);

  return (
    <View style={[styles.container, { backgroundColor: Colors[colorScheme ?? 'light'].background }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={[styles.backButtonText, { color: Colors[colorScheme ?? 'light'].text }]}>
            ← 뒤로
          </Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: Colors[colorScheme ?? 'light'].text }]}>
          주간 리포트
        </Text>
      </View>

      <View style={styles.content}>
        {/* Weekly Summary Title */}
        <Text style={[styles.weeklySummaryTitle, { color: Colors[colorScheme ?? 'light'].text }]}>
          {formatWeeklyDate(currentWeekData.weekStart, currentWeekData.weekEnd).replace('주간 리포트', '주간 요약')}
        </Text>

        {/* Activity Section */}
        <ActivitySection data={currentWeekData} />

        {/* Reviews Section */}
        <ReviewsSection data={currentWeekData} />

        {/* Done Button */}
        <TouchableOpacity
          style={styles.doneButton}
          onPress={onBack}
        >
          <Text style={styles.doneButtonText}>
            완료
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 20,
  },
  backButton: {
    paddingVertical: 8,
    marginRight: 16,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  weeklySummaryTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 32,
  },
  doneButton: {
    backgroundColor: '#6c63ff',
    borderRadius: 28,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    height: 56,
    marginTop: 20,
  },
  doneButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
});
