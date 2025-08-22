import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View, ScrollView, SafeAreaView, Dimensions } from 'react-native';
import { WeeklyReportFromSupabase } from '../../../../backend/supabase/reports';
import { Colors } from '../../../../constants/Colors';
import { useColorScheme } from '../../../../hooks/useColorScheme';
import { WeeklyLineChart } from '../../components/WeeklyLineChart';
import { getScoreStatus, formatScore, generateChartData } from '../../utils/scoreUtils';

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

interface WeeklyReportResultProps {
  weeklyReport: WeeklyReportFromSupabase;
  onBack: () => void;
  onStartChat?: () => void;
}

export default function WeeklyReportResult({ 
  weeklyReport, 
  onBack,
  onStartChat 
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

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header Section with coral background */}
      <View style={[styles.headerSection, { backgroundColor: colors.error }]}>
        {/* Back button */}
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        
        {/* Filter buttons */}
        <View style={styles.filterButtons}>
          <TouchableOpacity style={[styles.filterButton, styles.activeFilter]}>
            <Text style={styles.filterButtonText}>월간 리포트 분석</Text>
            <Text style={styles.filterButtonIcon}>▼</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.filterButton}>
            <Text style={styles.filterButtonText}>지난 3개월간 트래킹</Text>
            <Text style={styles.filterButtonIcon}>📅</Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView 
        style={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContainer}
      >
        {/* Main Content Card */}
        <View style={[styles.mainCard, { backgroundColor: colors.surface }]}>
          {/* Title */}
          <Text style={[styles.cardTitle, { color: colors.text }]}>
            일간 달성률 분석 결과
          </Text>
          
          {/* Score Section */}
          <View style={styles.scoreSection}>
            <View style={styles.scoreContainer}>
              <Text style={[styles.overallAverageText, { color: colors.textMuted }]}>
                전체 평균 달성률 : {overallAverage} 점
              </Text>
              
              <View style={styles.currentScoreContainer}>
                <Text style={[styles.currentScoreLabel, { color: colors.textMuted }]}>
                  가장 최근 주의 달성점수
                </Text>
                <Text style={[styles.currentScoreValue, { color: colors.error }]}>
                  {formatScore(currentWeekData.averageScore)}
                </Text>
              </View>
            </View>
            
            {/* Status Badge */}
            <View style={[styles.statusBadge, { backgroundColor: scoreStatus.backgroundColor }]}>
              <Text style={styles.statusBadgeText}>{scoreStatus.label}</Text>
            </View>
          </View>
          
          {/* Chart */}
          <View style={styles.chartContainer}>
            <WeeklyLineChart 
              data={chartData}
              width={screenWidth - 80}
              height={180}
            />
          </View>
          
          {/* Analysis Text */}
          <View style={styles.analysisContainer}>
            <Text style={[styles.analysisText, { color: colors.text }]}>
              마지막 주가 조금 아쉽지만, 이번 달도 높은 달성률을 유지하고 있어. 잘 하고 있는데?
            </Text>
            
            <Text style={[styles.analysisText, { color: colors.text }]}>
              특히나 눈에 띄는건 지난 7월이야. 내가 내줬던 수동태-비 수동태 문법 과제들과 단어 연습을 훌륭하게 해냈어.
            </Text>
            
            <Text style={[styles.analysisText, { color: colors.text }]}>
              자세한 내용은 서로 대화하면서 분석해보자고.
            </Text>
          </View>
        </View>
        
        {/* CTA Button */}
        <TouchableOpacity
          style={[styles.ctaButton, { backgroundColor: colors.text }]}
          onPress={onStartChat || onBack}
          activeOpacity={0.8}
        >
          <Text style={[styles.ctaButtonText, { color: colors.background }]}>
            Routy와 상담 진행하기
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerSection: {
    paddingTop: 20,
    paddingBottom: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
  },
  backButton: {
    position: 'absolute',
    top: 20,
    left: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  backButtonText: {
    fontSize: 20,
    color: '#ffffff',
    fontWeight: 'bold',
  },
  filterButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 60,
    paddingHorizontal: 10,
  },
  filterButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: 25,
    paddingHorizontal: 15,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    maxWidth: screenWidth * 0.45,
  },
  activeFilter: {
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
  },
  filterButtonText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#10152c',
    marginRight: 6,
  },
  filterButtonIcon: {
    fontSize: 12,
    color: '#10152c',
  },
  scrollContent: {
    flex: 1,
  },
  scrollContainer: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 100,
  },
  mainCard: {
    borderRadius: 40,
    padding: 24,
    marginBottom: 24,
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
    marginBottom: 16,
    textAlign: 'center',
  },
  scoreSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 24,
  },
  scoreContainer: {
    flex: 1,
  },
  overallAverageText: {
    fontSize: 11,
    marginBottom: 8,
  },
  currentScoreContainer: {
    marginTop: 4,
  },
  currentScoreLabel: {
    fontSize: 11,
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
    marginTop: 8,
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
  analysisContainer: {
    marginTop: 16,
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
