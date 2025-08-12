import { useEffect, useState } from 'react';
import { SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { fetchReports, ReportFromSupabase } from '../../backend/supabase/reports';
import { Colors } from '../../constants/Colors';
import { useColorScheme } from '../../hooks/useColorScheme';
import ScreenTransitionManager from '../ScreenTransitionManager';
import DailyReportCreateFlow from './daily/DailyReportCreateFlow';
import { DailyReportSection } from './daily_Section';
import WeeklyReportCreateFlow from './weekly/WeeklyReportCreateFlow';
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

  useEffect(() => {
    const loadReports = async () => {
      setIsLoading(true);
      const { todayReport, historicalReports } = await fetchReports();
      setTodayReport(todayReport);
      setHistoricalReports(historicalReports);
      setIsLoading(false);
    };

    loadReports();
  }, [currentScreen]);

  // Handle navigation to create daily report screen
  const handleCreateDailyReport = () => {
    setCurrentScreen('daily_create');
  };

  // Handle navigation to create weekly report screen
  const handleCreateWeeklyReport = () => {
    setCurrentScreen('weekly_create');
  };

  // Handle back navigation from create screens
  const handleBackToDailyReport = () => {
    setCurrentScreen('daily_report');
  };

  const handleBackToWeeklyReport = () => {
    setCurrentScreen('weekly_report');
  };

  // Render function for screen content
  const renderScreen = () => {
    switch (currentScreen) {
      case 'daily_create':
        return <DailyReportCreateFlow onBack={handleBackToDailyReport} />;
      case 'weekly_create':
        return <WeeklyReportCreateFlow onBack={handleBackToWeeklyReport} />;
      case 'daily_report':
      case 'weekly_report':
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
          onCreateReport={handleCreateDailyReport}
        />
      ) : (
        <WeeklyReportSection 
          onCreateReport={handleCreateWeeklyReport}
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

  return (
    <ScreenTransitionManager
      screenKey={currentScreen}
      direction={currentScreen === 'daily_create' || currentScreen === 'weekly_create' ? 'forward' : 'backward'}
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
});
