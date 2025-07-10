import { useState } from 'react';
import { FlatList, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors } from '../constants/Colors';
import { useColorScheme } from '../hooks/useColorScheme';
import CreateDailyReportScreen from './CreateDailyReportScreen';
import ScreenTransitionManager from './ScreenTransitionManager';

type ReportView = 'daily' | 'weekly';
type ScreenView = 'report' | 'create';

interface DailyReportData {
  id: string;
  date: string;
  displayDate: string;
  achievementScore: number; // 0-10
  aiCoachFeedback: string[];
}

// Achievement score color mapping (same as calendar logic)
const getAchievementColor = (score: number): string => {
  if (score >= 9) return '#4CAF50';        // Green (90%+)
  if (score >= 7) return '#8BC34A';        // Light Green (70%+)
  if (score >= 5) return '#FF9800';        // Orange (50%+)
  return '#F44336';                        // Red (below 50%)
};

// Mock data for historical reports
const generateHistoricalReports = (): DailyReportData[] => {
  const reports: DailyReportData[] = [];
  const today = new Date();
  
  // Generate 15 days of historical data (excluding today)
  for (let i = 1; i <= 15; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() - i);
    const achievementScore = Math.floor(Math.random() * 11); // 0-10
    
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const weekday = date.toLocaleDateString('ko-KR', { weekday: 'short' });
    
    reports.push({
      id: `report-${i}`,
      date: date.toISOString().split('T')[0],
      displayDate: `${month}월 ${day}일 일간 리포트`,
      achievementScore,
      aiCoachFeedback: [
        "여기에는 리포트 내용이 표시됩니다.",
        "주요 내용 2",
        "주요 내용 3"
      ]
    });
  }
  
  return reports;
};

// Generate today's report data
const generateTodayReport = (): DailyReportData => {
  const today = new Date();
  const month = String(today.getMonth() + 1).padStart(2, '0'); // Add leading zero
  const day = String(today.getDate()).padStart(2, '0'); // Add leading zero
  
  return {
    id: 'today-report',
    date: today.toISOString().split('T')[0],
    displayDate: `${month}월 ${day}일 일간 리포트`,
    achievementScore: 8, // Today's achievement score
    aiCoachFeedback: [
      "여기에는 리포트 내용이 표시됩니다.",
      "주요 내용 2",
      "주요 내용 3"
    ]
  };
};

export default function ReportScreen() {
  const colorScheme = useColorScheme();
  const [selectedView, setSelectedView] = useState<ReportView>('daily');
  const [currentScreen, setCurrentScreen] = useState<ScreenView>('report');
  const [todayReportExists, setTodayReportExists] = useState<boolean>(false); // Set to false to show create prompt
  const historicalReports = generateHistoricalReports();
  const todayReport = generateTodayReport();

  // Handle navigation to create daily report screen
  const handleCreateReport = () => {
    setCurrentScreen('create');
  };

  // Handle back navigation from create screen
  const handleBackToReport = () => {
    setCurrentScreen('report');
  };

  // Render function for screen content
  const renderScreen = () => {
    switch (currentScreen) {
      case 'create':
        return <CreateDailyReportScreen onBack={handleBackToReport} />;
      case 'report':
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
      {selectedView === 'daily' ? <DailyReportContent /> : <WeeklyReportContent />}
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

  const CreateReportPrompt = () => {
    return (
      <TouchableOpacity 
        style={[
          styles.createReportCard,
          { backgroundColor: Colors[colorScheme ?? 'light'].background }
        ]}
        onPress={handleCreateReport}
        activeOpacity={0.7}
      >
        <View style={styles.createReportContent}>
          {/* Semi-transparent Plus Icon */}
          <View style={styles.createReportIconContainer}>
            <Text style={[styles.createReportIcon, { color: Colors[colorScheme ?? 'light'].text }]}>
              +
            </Text>
          </View>
          
          {/* Semi-transparent Text */}
          <Text style={[styles.createReportText, { color: Colors[colorScheme ?? 'light'].text }]}>
            하루가 끝나면, 오늘의 일간 리포트를 생성해보세요.
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const DailyReportCard = ({ data, isToday = false }: { data: DailyReportData; isToday?: boolean }) => {
    const achievementColor = getAchievementColor(data.achievementScore);
    
    return (
      <View style={[
        styles.reportCard,
        isToday ? styles.todayCard : styles.historyCard,
        { backgroundColor: Colors[colorScheme ?? 'light'].background }
      ]}>
        {/* Date Title */}
        <Text style={[
          styles.reportCardTitle,
          isToday ? styles.todayCardTitle : styles.historyCardTitle,
          { color: Colors[colorScheme ?? 'light'].text }
        ]}>
          {data.displayDate}
        </Text>

        {/* Achievement Rate Indicator */}
        <View style={styles.achievementContainer}>
          <View style={[
            styles.achievementBox,
            { backgroundColor: achievementColor }
          ]}>
            <Text style={styles.achievementScore}>
              {data.achievementScore}
            </Text>
          </View>
          <Text style={[styles.achievementLabel, { color: Colors[colorScheme ?? 'light'].icon }]}>
            Achievement Score
          </Text>
        </View>

        {/* AI Coach's Feedback Summary */}
        <View style={styles.feedbackContainer}>
          {data.aiCoachFeedback.map((feedback, index) => (
            <View key={index} style={styles.feedbackItem}>
              <Text style={styles.feedbackBullet}>•</Text>
              <Text style={[styles.feedbackText, { color: Colors[colorScheme ?? 'light'].text }]}>
                {feedback}
              </Text>
            </View>
          ))}
        </View>
      </View>
    );
  };

  const DailyReportContent = () => {
    return (
      <View style={styles.dailyReportContainer}>
        {/* Sticky Today's Report Card - Conditional Rendering */}
        <View style={styles.stickyHeaderContainer}>
          {todayReportExists ? (
            <DailyReportCard data={todayReport} isToday={true} />
          ) : (
            <CreateReportPrompt />
          )}
        </View>

        {/* Scrollable History Section */}
        <View style={styles.historyContainer}>
          <Text style={[styles.historyTitle, { color: Colors[colorScheme ?? 'light'].text }]}>
            지난 리포트
          </Text>
          <FlatList
            data={historicalReports}
            renderItem={({ item }) => <DailyReportCard data={item} />}
            keyExtractor={(item) => item.id}
            showsVerticalScrollIndicator={false}
            scrollEnabled={true}
            style={styles.historyList}
            contentContainerStyle={styles.historyListContent}
          />
        </View>
      </View>
    );
  };

  const WeeklyReportContent = () => {
    return (
      <View style={styles.contentContainer}>
        <View style={styles.placeholderCard}>
          <Text style={[styles.cardTitle, { color: Colors[colorScheme ?? 'light'].text }]}>
            Weekly Report Coming Soon
          </Text>
          <Text style={[styles.cardDescription, { color: Colors[colorScheme ?? 'light'].icon }]}>
            Weekly report functionality will be implemented in the next phase.
          </Text>
        </View>
      </View>
    );
  };

  return (
    <ScreenTransitionManager
      screenKey={currentScreen}
      direction={currentScreen === 'create' ? 'forward' : 'backward'}
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
  scrollView: {
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
  // Daily Report Layout Styles
  dailyReportContainer: {
    flex: 1,
  },
  stickyHeaderContainer: {
    paddingHorizontal: 24,
    paddingBottom: 16,
    zIndex: 10,
  },
  historyContainer: {
    flex: 1,
    paddingHorizontal: 24,
  },
  historyTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    paddingLeft: 4,
  },
  historyList: {
    flex: 1,
  },
  historyListContent: {
    paddingBottom: 100, // Extra padding for tab bar
  },
  // Create Report Prompt Styles
  createReportCard: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 8,
    borderWidth: 2,
    borderColor: 'rgba(0, 0, 0, 0.1)',
    borderStyle: 'dashed',
  },
  createReportContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 80,
  },
  createReportIconContainer: {
    marginRight: 16,
  },
  createReportIcon: {
    fontSize: 32,
    fontWeight: 'bold',
    opacity: 0.5, // Semi-transparent
  },
  createReportText: {
    fontSize: 16,
    fontWeight: '500',
    opacity: 0.5, // Semi-transparent
    flex: 1,
    textAlign: 'center',
  },
  // Daily Report Card Styles
  reportCard: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  todayCard: {
    borderWidth: 2,
    borderColor: '#6c5ce7',
    marginBottom: 8,
  },
  historyCard: {
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  reportCardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  todayCardTitle: {
    fontSize: 20,
    color: '#6c5ce7',
  },
  historyCardTitle: {
    fontSize: 16,
  },
  // Achievement Rate Indicator Styles
  achievementContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  achievementBox: {
    width: 60,
    height: 60,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  achievementScore: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  achievementLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  // AI Coach Feedback Styles
  feedbackContainer: {
    gap: 8,
  },
  feedbackItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingLeft: 4,
  },
  feedbackBullet: {
    fontSize: 16,
    color: '#6c5ce7',
    marginRight: 8,
    marginTop: 2,
  },
  feedbackText: {
    fontSize: 14,
    lineHeight: 20,
    flex: 1,
  },
  // Legacy styles for weekly report
  contentContainer: {
    paddingHorizontal: 24,
    gap: 16,
    flex: 1,
  },
  placeholderCard: {
    padding: 20,
    backgroundColor: '#f5f5f5',
    borderRadius: 16,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  cardDescription: {
    fontSize: 14,
    lineHeight: 20,
  },
}); 