import { useEffect, useState } from 'react';
import { SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { fetchReports, ReportFromSupabase, WeeklyReportFromSupabase } from '../../backend/supabase/reports';
import { Colors } from '../../constants/Colors';
import { useColorScheme } from '../../hooks/useColorScheme';
import CreateDailyReportScreen from '../CreateDailyReportScreen';
import ScreenTransitionManager from '../ScreenTransitionManager';
import { DailyReportSection } from './daily_Section';
import { CreateWeeklyReportScreen } from './weekly_CreateReportScreen';
import { GeneratingWeeklyReportScreen } from './weekly_GeneratingScreen';
import { WeeklyReportResultScreen } from './weekly_ResultScreen';
import { WeeklyReportSection } from './weekly_Section';

type ReportView = 'daily' | 'weekly';
type ScreenView = 'daily_report' | 'daily_create' | 'weekly_report' | 'weekly_create';

export default function ReportScreen() {
  const colorScheme = useColorScheme();
  const [selectedView, setSelectedView] = useState<ReportView>('daily');
  const [currentScreen, setCurrentScreen] = useState<ScreenView>('daily_report');
  
  const [todayReport, setTodayReport] = useState<ReportFromSupabase | null>(null);
  const [historicalReports, setHistoricalReports] = useState<ReportFromSupabase[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Weekly report states
  const [currentWeekIndex, setCurrentWeekIndex] = useState(0);
  const [currentWeekReportGenerated, setCurrentWeekReportGenerated] = useState(false);
  const [currentWeeklyReport, setCurrentWeeklyReport] = useState<WeeklyReportFromSupabase | null>(null);

  useEffect(() => {
    const loadReports = async () => {
      setIsLoading(true);
      const { todayReport, historicalReports } = await fetchReports(); // Supabase에서 리포트 데이터 가져오기
      setTodayReport(todayReport);
      setHistoricalReports(historicalReports);
      setIsLoading(false);
    };

    loadReports();
  }, [currentScreen]); // []안은 어떤 상태가 변경될 때 마다, 함수를 실행할지 정함

  // Handle navigation to create daily report screen
  const handleCreateReport = () => {
    setCurrentScreen('daily_create');
  };

  // Handle back navigation from create screen
  const handleBackToReport = () => {
    setCurrentScreen('daily_report');
  };

  // Weekly report navigation handlers
  const handleNavigate = (direction: 'previous' | 'next') => {
    if (direction === 'previous') {
      setCurrentWeekIndex(currentWeekIndex + 1);
    } else {
      setCurrentWeekIndex(currentWeekIndex - 1);
    }
  };

  const handleStartWeeklyReport = () => {
    setCurrentWeekReportGenerated(false);
    setCurrentWeeklyReport(null);
    setCurrentScreen('weekly_report');
  };

  const handleWeeklyReportGenerated = (report: WeeklyReportFromSupabase) => {
    setCurrentWeeklyReport(report);
    setCurrentScreen('weekly_create');
  };

  const handleGenerationComplete = () => {
    setCurrentWeekReportGenerated(true);
  };

  const handleSaveReport = () => {
    console.log('💾 저장 버튼 클릭: 주간 리포트 저장');
    setCurrentWeekReportGenerated(true);
    setCurrentWeekIndex(0);
    setCurrentScreen('daily_report'); // 이게 말이안됨, 주간 상태를 표시하는데 상태는 daily_report?
    setSelectedView('weekly'); // 여기도 weekly잖아?
  };

  const handleDebugWeeklyNavigation = () => {
    try {
      console.log('🐛 DEBUG: WeeklyReport - Current week index:', currentWeekIndex);
      const nextIndex = (currentWeekIndex + 1) % 3; // Assuming 3 mock weeks
      setCurrentWeekIndex(nextIndex);
      console.log('🐛 DEBUG: WeeklyReport - Switched to week index:', nextIndex);
    } catch (error) {
      console.error('🐛 DEBUG: WeeklyReport - Error in debug handler:', error);
    }
  };

  const handleDebugSkip = () => {
    console.log('🐛 DEBUG: Skipping weekly report generation');
    setCurrentWeekReportGenerated(true);
  };

  // Render function for screen content
  const renderScreen = () => {
    switch (currentScreen) {
      case 'daily_create':
        return <CreateDailyReportScreen onBack={handleBackToReport} />;
      case 'weekly_report':
        return (
          <SafeAreaView style={[styles.container, { backgroundColor: Colors[colorScheme ?? 'light'].background }]}>
            <View style={styles.createWeeklyHeader}>
              <TouchableOpacity 
                style={styles.backButton}
                onPress={() => setCurrentScreen('daily_report')}
                activeOpacity={0.7}
              >
                <Text style={[styles.backButtonText, { color: Colors[colorScheme ?? 'light'].text }]}>
                  ← 뒤로
                </Text>
              </TouchableOpacity>
              <Text style={[styles.createWeeklyTitle, { color: Colors[colorScheme ?? 'light'].text }]}>
                주간 리포트 생성
              </Text>
            </View>
            <CreateWeeklyReportScreen 
              onBack={() => setCurrentScreen('daily_report')}
              onReportGenerated={handleWeeklyReportGenerated}
            />
          </SafeAreaView>
        );
      case 'weekly_create':
        if (currentWeekReportGenerated) {
          return (
            <SafeAreaView style={[styles.container, { backgroundColor: Colors[colorScheme ?? 'light'].background }]}>
              <View style={styles.createWeeklyHeader}>
                <Text style={[styles.createWeeklyTitle, { color: Colors[colorScheme ?? 'light'].text }]}> 
                  주간 리포트
                </Text>
              </View>
              <WeeklyReportResultScreen 
                currentWeeklyReport={currentWeeklyReport}
                onSaveReport={handleSaveReport}
                onDebugWeeklyNavigation={handleDebugWeeklyNavigation}
              />
            </SafeAreaView>
          );
        } else {
          return (
            <SafeAreaView style={[styles.container, { backgroundColor: Colors[colorScheme ?? 'light'].background }]}>
              <View style={styles.createWeeklyHeader}>
                <TouchableOpacity 
                  style={styles.backButton}
                  onPress={() => setCurrentScreen('weekly_report')}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.backButtonText, { color: Colors[colorScheme ?? 'light'].text }]}>
                    ← 뒤로
                  </Text>
                </TouchableOpacity>
                <Text style={[styles.createWeeklyTitle, { color: Colors[colorScheme ?? 'light'].text }]}>
                  주간 리포트 생성
                </Text>
              </View>
              <GeneratingWeeklyReportScreen 
                onBack={() => setCurrentScreen('weekly_report')}
                onGenerationComplete={handleGenerationComplete}
                onDebugSkip={handleDebugSkip}
              />
            </SafeAreaView>
          );
        }
      case 'daily_report':
      default:
        return <ReportScreenContent />;
    }
  };

  // Main Report Screen Content Component
  const ReportScreenContent = () => (
    <SafeAreaView style={[styles.container, { backgroundColor: Colors[colorScheme ?? 'light'].background }]}>
      {/* View Selector */}
      <ViewSelector />

      {/* Content based on selected view */}
      {selectedView === 'daily' ? (
        <DailyReportSection 
          todayReport={todayReport}
          historicalReports={historicalReports}
          isLoading={isLoading}
          onCreateReport={handleCreateReport}
        />
      ) : (
        <WeeklyReportSection 
          currentWeekIndex={currentWeekIndex}
          currentWeekReportGenerated={currentWeekReportGenerated}
          currentWeeklyReport={currentWeeklyReport}
          onNavigate={handleNavigate}
          onStartWeeklyReport={handleStartWeeklyReport}
          onDebugWeeklyNavigation={handleDebugWeeklyNavigation}
        />
      )}
    </SafeAreaView>
  );

  const ViewSelector = () => {
    return (
      <View style={[styles.selectorContainer, { backgroundColor: Colors[colorScheme ?? 'light'].background }]}>
        <View style={styles.segmentedControl}>
          <TouchableOpacity
            style={[
              styles.segmentButton,
              selectedView === 'daily' 
                ? [styles.segmentButtonActive, { backgroundColor: Colors[colorScheme ?? 'light'].tint }]
                : styles.segmentButtonInactive
            ]}
            onPress={() => setSelectedView('daily')}
            activeOpacity={0.7}
          >
            <Text style={[
              styles.segmentText,
              selectedView === 'daily' 
                ? [styles.segmentTextActive, { color: Colors[colorScheme ?? 'light'].background }]
                : [styles.segmentTextInactive, { color: Colors[colorScheme ?? 'light'].text }]
            ]}>
              일간 리포트
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.segmentButton,
              selectedView === 'weekly' 
                ? [styles.segmentButtonActive, { backgroundColor: Colors[colorScheme ?? 'light'].tint }]
                : styles.segmentButtonInactive
            ]}
            onPress={() => setSelectedView('weekly')}
            activeOpacity={0.7}
          >
            <Text style={[
              styles.segmentText,
              selectedView === 'weekly' 
                ? [styles.segmentTextActive, { color: Colors[colorScheme ?? 'light'].background }]
                : [styles.segmentTextInactive, { color: Colors[colorScheme ?? 'light'].text }]
            ]}>
              주간 리포트
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  };

  return ( // 화면 전환을 위한 컴포넌트, currentScreen이 변경될 때마다 화면이 전환됨
    <ScreenTransitionManager
      screenKey={currentScreen}
      direction={currentScreen === 'daily_create' ? 'forward' : 'backward'}
      onTransitionComplete={() => {
        console.log('Report screen transition completed:', currentScreen);
      }}
    >
      {renderScreen()}
    </ScreenTransitionManager>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  selectorContainer: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 20,
    alignItems: 'center',
  },
  segmentedControl: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 4,
    width: '100%',
    maxWidth: 300,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
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
  // Create Weekly Report Screen Styles
  createWeeklyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 20,
  },
  backButton: {
    paddingRight: 16,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '500',
    fontFamily: 'Inter',
  },
  createWeeklyTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    fontFamily: 'Inter',
  },
});
