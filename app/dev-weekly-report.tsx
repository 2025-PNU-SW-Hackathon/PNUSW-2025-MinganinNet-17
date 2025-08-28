import React, { useState } from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';

import WeeklyReportResult from '../components/ReportScreen/weekly/steps/WeeklyReportResult';
import { WeeklyReportFromSupabase } from '../backend/supabase/reports';
import { Colors } from '../constants/Colors';
import { useColorScheme } from '../hooks/useColorScheme';

// Mock data for development testing - multiple weekly reports
const mockWeeklyReports: WeeklyReportFromSupabase[] = [
  {
    id: 'dev-test-001',
    user_id: 'dev-user',
    week_start: '2024-08-19',
    week_end: '2024-08-25',
    days_completed: 6,
    insights: '마지막 주가 조금 아쉽지만, 이번 달도 높은 달성률을 유지하고 있어. 잘 하고 있는데?\n\n특히나 눈에 띄는건 지난 7월이야. 내가 내줬던 수동태-비 수동태 문법 과제들과 단어 연습을 훌륭하게 해냈어.\n\n자세한 내용은 서로 대화하면서 분석해보자고.',
    average_score: 8.3,
    daily_scores: [7.8, 8.1, 8.5, 8.9, 8.2, 8.0, 7.9],
    created_at: '2024-08-26T00:00:00Z'
  },
  {
    id: 'dev-test-002',
    user_id: 'dev-user',
    week_start: '2024-08-12',
    week_end: '2024-08-18',
    days_completed: 7,
    insights: '이번 주는 정말 완벽했어! 매일매일 꾸준히 학습하는 모습이 인상적이야.\n\n특히 영어 회화 연습에서 많은 발전이 보여. 자신감을 가지고 계속해보자!',
    average_score: 8.8,
    daily_scores: [8.5, 8.7, 8.9, 8.8, 9.0, 8.6, 8.9],
    created_at: '2024-08-19T00:00:00Z'
  },
  {
    id: 'dev-test-003',
    user_id: 'dev-user',
    week_start: '2024-08-05',
    week_end: '2024-08-11',
    days_completed: 5,
    insights: '약간 아쉬운 주였지만, 그래도 꾸준히 노력하는 모습이 보여.\n\n주말에 좀 더 집중해서 학습하면 더 좋은 결과를 얻을 수 있을 거야.',
    average_score: 7.9,
    daily_scores: [7.5, 8.2, 8.1, 7.8, 8.0, 7.7, 7.9],
    created_at: '2024-08-12T00:00:00Z'
  }
];

type ReportView = 'daily' | 'weekly';

export default function DevWeeklyReportScreen() {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [currentWeekIndex, setCurrentWeekIndex] = useState(0);
  const [selectedView, setSelectedView] = useState<ReportView>('weekly');

  const handleBack = () => {
    console.log('Dev: Back button pressed');
    router.back();
  };

  const handleStartChat = () => {
    console.log('Dev: Start chat button pressed');
    // For development, just log the action
    alert('Development Mode: Chat feature would start here');
  };

  const handleNavigate = (index: number) => {
    console.log('Dev: Navigating to week index:', index);
    setCurrentWeekIndex(index);
  };

  const handleViewChange = (view: ReportView) => {
    console.log('Dev: Changing view to:', view);
    setSelectedView(view);
    // In a real app, this would navigate to daily report screen
    if (view === 'daily') {
      alert('Development Mode: Daily report view would be shown here');
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.surface }]}>
      <WeeklyReportResult
        weeklyReport={mockWeeklyReports[currentWeekIndex]}
        onBack={handleBack}
        onStartChat={handleStartChat}
        currentWeekIndex={currentWeekIndex}
        weeklyReportsLength={mockWeeklyReports.length}
        onNavigate={handleNavigate}
        selectedView={selectedView}
        onViewChange={handleViewChange}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});