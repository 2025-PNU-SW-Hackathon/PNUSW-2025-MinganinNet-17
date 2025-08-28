import { Dimensions, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { WeeklyReportFromSupabase } from '../../../../backend/supabase/reports';
import { Colors } from '../../../../constants/Colors';
import { useColorScheme } from '../../../../hooks/useColorScheme';
import { WeeklyLineChart } from '../../components/WeeklyLineChart';
import { WeekNavigator } from '../../components/weekly_Navigator';
import { formatScore, generateChartData, getScoreStatus } from '../../utils/scoreUtils';

// Get screen dimensions
const { width: screenWidth } = Dimensions.get('window');

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

type ReportView = 'daily' | 'weekly';

interface WeeklyReportResultProps {
  weeklyReport: WeeklyReportFromSupabase;
  onBack: () => void;
  onStartChat?: () => void;
  currentWeekIndex: number;
  weeklyReportsLength: number;
  onNavigate: (index: number) => void;
  selectedView?: ReportView;
  onViewChange?: (view: ReportView) => void;
}

export default function WeeklyReportResult({ 
  weeklyReport, 
  onBack,
  onStartChat,
  currentWeekIndex,
  weeklyReportsLength,
  onNavigate,
  selectedView = 'weekly',
  onViewChange
}: WeeklyReportResultProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  
  // Map backend data to UI
  const currentWeekData: WeeklyReportData = mapWeeklyReportFromSupabase(weeklyReport);
  
  // Get score status and chart data
  const scoreStatus = getScoreStatus(currentWeekData.averageScore, colorScheme ?? 'light');
  const chartData = generateChartData(currentWeekData.dailyScores, currentWeekData.weekStart);
  
  // Calculate overall average (mock data for now)
  const overallAverage = 8.63;

  // View Selector Component
  const ViewSelector = () => {
    if (!onViewChange) return null;
    
    return (
      <View style={styles.selectorContainer}>
        <View style={styles.segmentedControl}>
          <TouchableOpacity
            style={[
              styles.segmentButton,
              selectedView === 'daily' 
                ? [styles.segmentButtonActive, { backgroundColor: colors.tint }]
                : styles.segmentButtonInactive
            ]}
            onPress={() => onViewChange('daily')}
            activeOpacity={0.7}
          >
            <Text style={[
              styles.segmentText,
              selectedView === 'daily' 
                ? [styles.segmentTextActive, { color: colors.surface }]
                : [styles.segmentTextInactive, { color: colors.text }]
            ]}>
              일간 리포트
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.segmentButton,
              selectedView === 'weekly' 
                ? [styles.segmentButtonActive, { backgroundColor: colors.tint }]
                : styles.segmentButtonInactive
            ]}
            onPress={() => onViewChange('weekly')}
            activeOpacity={0.7}
          >
            <Text style={[
              styles.segmentText,
              selectedView === 'weekly' 
                ? [styles.segmentTextActive, { color: colors.surface }]
                : [styles.segmentTextInactive, { color: colors.text }]
            ]}>
              주간 리포트
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      {/* View Selector */}
      <ViewSelector />
      
      {/* Header Section with coral background */}
      <View style={[styles.headerSection, { backgroundColor: colors.figma.critical }]}>
        {/* Navigation buttons */}
        <View style={styles.navigationContainer}>
          <WeekNavigator 
            currentWeekIndex={currentWeekIndex}
            currentWeekReportGenerated={true}
            weeklyReportsLength={weeklyReportsLength}
            onNavigate={onNavigate}
          />
        </View>
      </View>

      <ScrollView 
        style={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContainer}
      >
        {/* Main Content Card */}
        <View style={[styles.mainCard, { backgroundColor: colors.figma.yellow }]}>
          {/* Title */}
          <Text style={[styles.cardTitle, { color: colors.figma.darkGray }]}>
            일간 달성률 분석 결과
          </Text>
          
          {/* Score Section */}
          <View style={styles.scoreSection}>
            <View style={styles.scoreContainer}>
              <Text style={[styles.currentScoreLabel, { color: colors.figma.darkGray }]}>
                가장 최근 주의 달성점수
              </Text>
              <Text style={[styles.currentScoreValue, { color: colors.figma.critical }]}>
                {formatScore(currentWeekData.averageScore)}
              </Text>
            </View>
            
            {/* Status Badge */}
            <View style={[styles.statusBadge, { backgroundColor: colors.figma.critical }]}>
              <Text style={styles.statusBadgeText}>아쉬워요</Text>
            </View>
          </View>
          
          {/* Overall Average */}
          <Text style={[styles.overallAverageText, { color: colors.figma.darkGray }]}>
            전체 평균 달성률 : {overallAverage} 점
          </Text>
          
          {/* Chart */}
          <View style={styles.chartContainer}>
            <WeeklyLineChart 
              data={chartData}
              width={screenWidth - 80}
              height={180}
            />
          </View>
          
          {/* Analysis Text - Scrollable */}
          <ScrollView 
            style={styles.analysisScrollContainer}
            showsVerticalScrollIndicator={true}
            nestedScrollEnabled={true}
          >
            <Text style={[styles.analysisText, { color: colors.figma.darkGray }]}>
              {currentWeekData.insights}
            </Text>
          </ScrollView>
        </View>
        
        {/* CTA Button */}
        <TouchableOpacity
          style={[styles.ctaButton, { backgroundColor: colors.figma.darkGray }]}
          onPress={onStartChat || onBack}
          activeOpacity={0.8}
        >
          <Text style={[styles.ctaButtonText, { color: colors.figma.white }]}>
            Routy와 상담 진행하기
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerSection: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingTop: 32,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    height: 320,
    zIndex: 0,
  },
  navigationContainer: {
    marginTop: 30,
    paddingHorizontal: 7,
  },
  selectorContainer: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 20,
    alignItems: 'center',
    zIndex: 10,
    position: 'relative',
  },
  segmentedControl: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 4,
    width: '100%',
    maxWidth: 300,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  segmentButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  segmentButtonActive: {
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  segmentButtonInactive: {
    backgroundColor: 'transparent',
    opacity: 0.5,
  },
  segmentText: {
    fontSize: 16,
    fontWeight: '600',
  },
  segmentTextActive: {
    fontWeight: '700',
  },
  segmentTextInactive: {
    opacity: 0.7,
  },
  scrollContent: {
    flex: 1,
    paddingTop: 100,
  },
  scrollContainer: {
    paddingHorizontal: 27,
    paddingTop: 5,
    paddingBottom: 100,
  },
  mainCard: {
    borderRadius: 40,
    padding: 20,
    marginBottom: 24,
    marginTop: -70,
    zIndex: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
    marginTop: 23,
  },
  overallAverageText: {
    fontSize: 13,
    marginBottom: 13,
  },
  scoreSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 9,
  },
  scoreContainer: {
    flex: 1,
  },
  currentScoreContainer: {
    marginTop: 4,
  },
  currentScoreLabel: {
    fontSize: 13,
    marginBottom: 4,
  },
  currentScoreValue: {
    fontSize: 40,
    fontWeight: 'bold',
    lineHeight: 48,
  },
  statusBadge: {
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginTop: 12,
    alignSelf: 'flex-start',
  },
  statusBadgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  chartContainer: {
    marginVertical: 16,
    alignItems: 'center',
  },
  analysisScrollContainer: {
    marginTop: 12,
    height: 160,
    maxHeight: 160,
  },
  analysisText: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 12,
  },
  ctaButton: {
    borderRadius: 50,
    paddingVertical: 16,
    paddingHorizontal: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  ctaButtonText: {
    fontSize: 16,
    fontWeight: 'medium',
  },
});
