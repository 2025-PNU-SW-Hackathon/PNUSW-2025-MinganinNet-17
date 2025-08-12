import { useEffect, useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { ReportFromSupabase, aggregateWeeklyReports, generateAndSaveWeeklyReport } from '../../backend/supabase/reports';
import { Colors } from '../../constants/Colors';
import { useColorScheme } from '../../hooks/useColorScheme';

interface CreateWeeklyReportScreenProps {
  onBack: () => void;
  onReportGenerated: (report: any) => void;
}

export const CreateWeeklyReportScreen = ({ onBack, onReportGenerated }: CreateWeeklyReportScreenProps) => {
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
        setLoading(true);
        const data = await aggregateWeeklyReports();
        setWeeklyData(data);
      } catch (error) {
        console.error('주간 데이터 로딩 실패:', error);
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
        onReportGenerated(result);
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
                  styles.analysisItemText, 
                  { 
                    color: Colors[colorScheme ?? 'light'].text,
                    textDecorationLine: task.completed ? 'line-through' : 'none',
                    opacity: task.completed ? 0.6 : 1
                  }
                ]}>
                  {task.description}
                </Text>
                <Text style={[
                  styles.analysisItemIcon,
                  { color: task.completed ? '#4CAF50' : '#F44336' }
                ]}>
                  {task.completed ? '✓' : '✗'}
                </Text>
              </View>
            ))
          ) : (
            <Text style={[styles.analysisItemText, { color: Colors[colorScheme ?? 'light'].icon }]}>
              {hasReport ? '할일이 없습니다' : '-'}
            </Text>
          )}
        </View>
      );
    });
  };

  return (
    <View style={styles.createWeeklyContent}>
      <View style={styles.createWeeklyPrompt}>
        <Text style={styles.createWeeklyIcon}>📊</Text>
        <Text style={[styles.createWeeklyPromptText, { color: Colors[colorScheme ?? 'light'].text }]}>
          이번 주의 활동을 토대로{'\n'}주간 리포트를 진행해봐요.
        </Text>
      </View>

      {loading ? (
        <View style={[styles.createWeeklyCard, { backgroundColor: Colors[colorScheme ?? 'light'].card }]}>
          <Text style={[styles.createWeeklyCardTitle, { color: Colors[colorScheme ?? 'light'].text }]}>
            데이터 로딩 중...
          </Text>
        </View>
      ) : weeklyData ? (
        <View style={[styles.createWeeklyCard, { backgroundColor: Colors[colorScheme ?? 'light'].card }]}>
          <Text style={[styles.createWeeklyCardTitle, { color: Colors[colorScheme ?? 'light'].text }]}>
            최근 7일 활동 내역
          </Text>
          <View style={styles.weeklyTasksContainer}>
            {renderDailyTasks()}
          </View>
        </View>
      ) : (
        <View style={[styles.createWeeklyCard, { backgroundColor: Colors[colorScheme ?? 'light'].card }]}>
          <Text style={[styles.createWeeklyCardTitle, { color: Colors[colorScheme ?? 'light'].text }]}>
            분석할 데이터가 없습니다
          </Text>
          <Text style={[styles.noDataText, { color: Colors[colorScheme ?? 'light'].icon }]}>
            최근 7일간의 일간 리포트가 없습니다.{'\n'}먼저 일간 리포트를 작성해주세요.
          </Text>
        </View>
      )}

      <TouchableOpacity 
        style={[
          styles.generateReportButton,
          (!weeklyData || weeklyData.daysCompleted === 0) && styles.generateReportButtonDisabled
        ]}
        onPress={async () => {
          if (weeklyData && weeklyData.daysCompleted > 0) {
            await handleCreateWeeklyReport();
          }
        }}
        activeOpacity={0.8}
        disabled={!weeklyData || weeklyData.daysCompleted === 0}
      >
        <Text style={[
          styles.generateReportButtonText,
          (!weeklyData || weeklyData.daysCompleted === 0) && styles.generateReportButtonTextDisabled
        ]}>
          {!weeklyData || weeklyData.daysCompleted === 0 ? '리포트 생성 불가' : '리포트 생성하기'}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  createWeeklyContent: {
    flex: 1,
    paddingHorizontal: 24,
  },
  createWeeklyPrompt: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  createWeeklyIcon: {
    fontSize: 64,
    marginBottom: 24,
  },
  createWeeklyPromptText: {
    fontSize: 18,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 26,
    fontFamily: 'Inter',
  },
  createWeeklyCard: {
    padding: 24,
    borderRadius: 16,
    marginBottom: 32,
  },
  createWeeklyCardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
    fontFamily: 'Inter',
  },
  analysisItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  analysisItemIcon: {
    fontSize: 18,
    color: '#4CAF50',
    marginRight: 12,
    fontFamily: 'Inter',
  },
  analysisItemText: {
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
    fontFamily: 'Inter',
  },
  analysisItemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  analysisItemDay: {
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter',
  },
  analysisItemScore: {
    fontSize: 14,
    fontWeight: '500',
    fontFamily: 'Inter',
  },
  analysisItemTask: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 24,
    marginTop: 4,
  },
  weeklyTasksContainer: {
    marginBottom: 20,
  },
  noDataText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    fontFamily: 'Inter',
  },
  generateReportButton: {
    backgroundColor: '#1c1c2e',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  generateReportButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'Inter',
  },
  generateReportButtonDisabled: {
    backgroundColor: '#cccccc',
  },
  generateReportButtonTextDisabled: {
    color: '#666666',
  },
});
