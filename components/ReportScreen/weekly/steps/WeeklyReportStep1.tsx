import { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ReportFromSupabase, aggregateWeeklyReports, generateAndSaveWeeklyReport } from '../../../../backend/supabase/reports';
import { Colors } from '../../../../constants/Colors';
import { useColorScheme } from '../../../../hooks/useColorScheme';

interface WeeklyReportStep1Props {
  onComplete: (data: any) => void;
  onBack: () => void;
}

export default function WeeklyReportStep1({ onComplete, onBack }: WeeklyReportStep1Props) {
  const colorScheme = useColorScheme();
  const [weeklyData, setWeeklyData] = useState<{
    weekStart: string;
    weekEnd: string;
    averageScore: number;
    daysCompleted: number;
    dailyScores: number[];
    dailyReports: ReportFromSupabase[];
  } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadWeeklyData = async () => {
      try {
        console.log('🐛 WeeklyReportStep1: Starting to load weekly data...');
        setLoading(true);
        const data = await aggregateWeeklyReports();
        console.log('🐛 WeeklyReportStep1: Received weekly data:', data);
        setWeeklyData(data);
        
        if (data) {
          console.log('🐛 WeeklyReportStep1: Weekly data loaded successfully');
          console.log('🐛 WeeklyReportStep1: Data details:', {
            weekStart: data.weekStart,
            weekEnd: data.weekEnd,
            averageScore: data.averageScore,
            daysCompleted: data.daysCompleted,
            reportsCount: data.dailyReports.length
          });
        } else {
          console.log('🐛 WeeklyReportStep1: No weekly data received (null)');
        }
      } catch (error) {
        console.error('🐛 WeeklyReportStep1: 주간 데이터 로딩 실패:', error);
      } finally {
        setLoading(false);
      }
    };

    loadWeeklyData();
  }, []);

  // 주간 리포트 생성 핸들러
  const handleCreateWeeklyReport = async () => {
    try {
      console.log('🐛 DEBUG: Starting weekly report generation...');
      
      // 백엔드 통합 함수 호출
      const result = await generateAndSaveWeeklyReport();
      
      if (result) {
        console.log('✅ 주간 리포트 생성 성공:', result.id);
        // 생성된 리포트를 부모 컴포넌트로 전달
        onComplete(result);
      } else {
        console.error('❌ 주간 리포트 생성 실패');
        alert('주간 리포트 생성에 실패했습니다. 다시 시도해주세요.');
      }
    } catch (error) {
      console.error('❌ 주간 리포트 생성 중 오류:', error);
      alert('주간 리포트 생성 중 오류가 발생했습니다. 다시 시도해주세요.');
    }
  };

  // 요일별 할일 목록을 렌더링하는 함수
  const renderDailyTasks = () => {
    if (!weeklyData) return null;

    const weekDays = ['월', '화', '수', '목', '금', '토', '일'];
    const today = new Date();
    
    return weekDays.map((day, index) => {
      const dayDate = new Date(today);
      dayDate.setDate(today.getDate() - (6 - index)); // 최근 7일 계산
      const dateStr = dayDate.toISOString().split('T')[0];
      
      // 해당 날짜의 리포트 찾기
      const dayReport = weeklyData.dailyReports.find(report => report.report_date === dateStr);
      const dayScore = weeklyData.dailyScores[index];
      const hasReport = dayReport !== undefined;
      
      // 할일 목록 가져오기 (리포트가 있으면 실제 데이터, 없으면 빈 배열)
      const tasks = hasReport && dayReport.daily_activities?.todos 
        ? dayReport.daily_activities.todos 
        : [];

      // 날짜 포맷팅
      const month = String(dayDate.getMonth() + 1).padStart(2, '0');
      const date = String(dayDate.getDate()).padStart(2, '0');
      const dateDisplay = `${month}월 ${date}일`;

      return (
        <View key={day} style={styles.analysisItem}>
          <View style={styles.analysisItemHeader}>
            <Text style={[styles.analysisItemDay, { color: Colors[colorScheme ?? 'light'].text }]}>
              {day} ({dateDisplay})
            </Text>
          </View>
          
          {tasks.length > 0 ? (
            tasks.map((task, taskIndex) => (
              <View key={taskIndex} style={styles.analysisItemTask}>
                <Text style={[
                  styles.analysisItemTaskText,
                  { color: Colors[colorScheme ?? 'light'].text }
                ]}>
                  {task.description}
                </Text>
              </View>
            ))
          ) : (
            <Text style={[styles.analysisItemNoData, { color: Colors[colorScheme ?? 'light'].icon }]}>
              리포트 없음
            </Text>
          )}
        </View>
      );
    });
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: Colors[colorScheme ?? 'light'].background }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Text style={[styles.backButtonText, { color: Colors[colorScheme ?? 'light'].text }]}>
              ← 뒤로
            </Text>
          </TouchableOpacity>
        </View>
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: Colors[colorScheme ?? 'light'].text }]}>
            주간 데이터를 불러오는 중...
          </Text>
        </View>
      </View>
    );
  }

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
          주간 리포트 생성
        </Text>
      </View>

      {/* Content */}
      <View style={styles.content}>
        {weeklyData ? (
          <>
            {/* Weekly Summary */}
            <View style={styles.summaryContainer}>
              <Text style={[styles.summaryTitle, { color: Colors[colorScheme ?? 'light'].text }]}>
                이번 주 요약
              </Text>
              <View style={styles.summaryStats}>
                <View style={styles.summaryStat}>
                  <Text style={[styles.summaryStatValue, { color: Colors[colorScheme ?? 'light'].tint }]}>
                    {weeklyData.averageScore.toFixed(1)}
                  </Text>
                  <Text style={[styles.summaryStatLabel, { color: Colors[colorScheme ?? 'light'].text }]}>
                    평균 점수
                  </Text>
                </View>
                <View style={styles.summaryStat}>
                  <Text style={[styles.summaryStatValue, { color: Colors[colorScheme ?? 'light'].tint }]}>
                    {weeklyData.daysCompleted}/7
                  </Text>
                  <Text style={[styles.summaryStatLabel, { color: Colors[colorScheme ?? 'light'].text }]}>
                    완료된 날
                  </Text>
                </View>
              </View>
            </View>

            {/* Daily Analysis */}
            <View style={styles.analysisContainer}>
              <Text style={[styles.analysisTitle, { color: Colors[colorScheme ?? 'light'].text }]}>
                일별 분석
              </Text>
              {renderDailyTasks()}
            </View>

            {/* Create Button */}
            <TouchableOpacity
              style={styles.createButton}
              onPress={handleCreateWeeklyReport}
            >
              <Text style={styles.createButtonText}>
                주간 리포트 생성하기
              </Text>
            </TouchableOpacity>
          </>
        ) : (
          /* No Weekly Data Available */
          <View style={styles.noDataContainer}>
            <View style={styles.noDataCard}>
              <Text style={[styles.noDataIcon, { color: Colors[colorScheme ?? 'light'].icon }]}>
                📅
              </Text>
              <Text style={[styles.noDataTitle, { color: Colors[colorScheme ?? 'light'].text }]}>
                주간 리포트를 생성할 수 없습니다
              </Text>
              <Text style={[styles.noDataMessage, { color: Colors[colorScheme ?? 'light'].textSecondary }]}>
                이번 주에 작성된 일간 리포트가 부족합니다.{'\n'}
                최소 3일 이상의 일간 리포트가 필요합니다.
              </Text>
              <Text style={[styles.noDataHint, { color: Colors[colorScheme ?? 'light'].textMuted }]}>
                일간 리포트를 더 작성한 후 다시 시도해보세요.
              </Text>
            </View>
          </View>
        )}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },
  summaryContainer: {
    marginBottom: 32,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  summaryStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  summaryStat: {
    alignItems: 'center',
  },
  summaryStatValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  summaryStatLabel: {
    fontSize: 14,
  },
  analysisContainer: {
    flex: 1,
  },
  analysisTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  analysisItem: {
    marginBottom: 16,
    padding: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 12,
  },
  analysisItemHeader: {
    marginBottom: 8,
  },
  analysisItemDay: {
    fontSize: 16,
    fontWeight: '600',
  },
  analysisItemTask: {
    marginBottom: 4,
  },
  analysisItemTaskText: {
    fontSize: 14,
  },
  analysisItemNoData: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  createButton: {
    backgroundColor: '#6c63ff',
    borderRadius: 28,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    height: 56,
    marginTop: 20,
  },
  createButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  noDataContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  noDataCard: {
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    maxWidth: 300,
  },
  noDataIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  noDataTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
  },
  noDataMessage: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 12,
  },
  noDataHint: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
});
