import React from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';

import WeeklyReportResult from '../../components/ReportScreen/weekly/steps/WeeklyReportResult';
import { WeeklyReportFromSupabase } from '../../backend/supabase/reports';
import { Colors } from '../../constants/Colors';
import { useColorScheme } from '../../hooks/useColorScheme';

// Mock data for development testing
const mockWeeklyReport: WeeklyReportFromSupabase = {
  id: 'dev-test-001',
  user_id: 'dev-user',
  week_start: '2024-08-19',
  week_end: '2024-08-25',
  days_completed: 6,
  insights: '마지막 주가 조금 아쉽지만, 이번 달도 높은 달성률을 유지하고 있어. 잘 하고 있는데?\n\n특히나 눈에 띄는건 지난 7월이야. 내가 내줬던 수동태-비 수동태 문법 과제들과 단어 연습을 훌륭하게 해냈어.\n\n자세한 내용은 서로 대화하면서 분석해보자고.',
  average_score: 8.3,
  daily_scores: [7.8, 8.1, 8.5, 8.9, 8.2, 8.0, 7.9],
  created_at: '2024-08-26T00:00:00Z'
};

export default function DevWeeklyReportScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const handleBack = () => {
    console.log('Dev: Back button pressed');
    router.back();
  };

  const handleStartChat = () => {
    console.log('Dev: Start chat button pressed');
    // For development, just log the action
    alert('Development Mode: Chat feature would start here');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.figma.white }]}>
      <WeeklyReportResult
        weeklyReport={mockWeeklyReport}
        onBack={handleBack}
        onStartChat={handleStartChat}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});