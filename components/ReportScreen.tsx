import { useEffect, useState } from 'react';
import { FlatList, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { fetchReports, ReportFromSupabase } from '../backend/supabase/reports';
import { Colors } from '../constants/Colors';
import { useColorScheme } from '../hooks/useColorScheme';
import CreateDailyReportScreen from './CreateDailyReportScreen';
import DebugNextButton from './DebugNextButton';
import ScreenTransitionManager from './ScreenTransitionManager';

type ReportView = 'daily' | 'weekly';
type ScreenView = 'report' | 'create' | 'createWeekly' | 'generatingWeekly';

interface DailyReportData {
  id: string;
  date: string;
  displayDate: string;
  achievementScore: number; // 0-10
  aiCoachFeedback: string[];
}

// Mock Weekly Report Data Interface
interface WeeklyReportData {
  id: string;
  weekStart: string;
  weekEnd: string;
  achievementScore: number; // 0-10
  daysCompleted: number;
  totalDays: number;
  insights: string[];
  bestDay: string;
  averageScore: number;
  dailyScores: number[]; // [M, T, W, T, F, S, S] - scores for each day of the week
}

// Achievement score color mapping (same as calendar logic)
const getAchievementColor = (score: number): string => {
  if (score >= 9) return '#4CAF50';        // Green (90%+)
  if (score >= 7) return '#8BC34A';        // Light Green (70%+)
  if (score >= 5) return '#FF9800';        // Orange (50%+)
  return '#F44336';                        // Red (below 50%)
};

// Helper function to format date string
const formatDisplayDate = (dateString: string): string => {
  const date = new Date(dateString);
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${month}월 ${day}일 일간 리포트`;
};

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

// Newly generated report data
const generateNewWeeklyReport = (): WeeklyReportData => {
  const today = new Date();
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay()); // Get Sunday
  const endOfWeek = new Date(startOfWeek);
  endOfWeek.setDate(startOfWeek.getDate() + 6); // Get Saturday

  return {
    id: 'current-week-generated',
    weekStart: startOfWeek.toISOString().split('T')[0],
    weekEnd: endOfWeek.toISOString().split('T')[0],
    achievementScore: 8,
    daysCompleted: 5,
    totalDays: 7,
    averageScore: 7.8,
    bestDay: '금요일',
    dailyScores: [7, 8, 6, 9, 10, 8, 6], // M T W T F S S
    insights: [
      '이번 주는 전반적으로 좋은 성과를 거두었습니다.',
      '특히 목요일과 금요일에 뛰어난 집중력을 보였습니다.',
      '주말에도 꾸준히 목표를 달성했습니다.'
    ]
  };
};

// Mock Weekly Data
const mockWeeklyReports: WeeklyReportData[] = [
  {
    id: 'week-1',
    weekStart: '2025-01-27',
    weekEnd: '2025-02-02',
    achievementScore: 8,
    daysCompleted: 6,
    totalDays: 7,
    averageScore: 8.2,
    bestDay: '금요일',
    dailyScores: [8, 7, 9, 8, 10, 6, 9], // M T W T F S S
    insights: [
      '이번 주는 목표를 꾸준히 달성했습니다.',
      '주 중 내용 2',
      '주 중 내용 3'
    ]
  },
  {
    id: 'week-2',
    weekStart: '2025-01-20',
    weekEnd: '2025-01-26',
    achievementScore: 7,
    daysCompleted: 5,
    totalDays: 7,
    averageScore: 7.4,
    bestDay: '수요일',
    dailyScores: [6, 8, 9, 7, 6, 0, 8], // M T W T F S S
    insights: [
      '지난주 대비 향상된 성과를 보였습니다.',
      '주말 활동이 부족했습니다.',
      '전반적으로 안정적인 패턴을 유지했습니다.'
    ]
  },
  {
    id: 'week-3',
    weekStart: '2025-01-13',
    weekEnd: '2025-01-19',
    achievementScore: 6,
    daysCompleted: 4,
    totalDays: 7,
    averageScore: 6.1,
    bestDay: '화요일',
    dailyScores: [5, 8, 6, 0, 7, 0, 0], // M T W T F S S
    insights: [
      '목표 달성에 어려움이 있었습니다.',
      '새로운 도전에 적응하는 시간이 필요했습니다.',
      '다음 주는 더 나은 결과를 기대합니다.'
    ]
  }
];


export default function ReportScreen() {
  const colorScheme = useColorScheme();
  const [selectedView, setSelectedView] = useState<ReportView>('daily');
  const [currentScreen, setCurrentScreen] = useState<ScreenView>('report');
  
  const [todayReport, setTodayReport] = useState<ReportFromSupabase | null>(null);
  const [historicalReports, setHistoricalReports] = useState<ReportFromSupabase[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Weekly report states
  const [currentWeekIndex, setCurrentWeekIndex] = useState(0);
  const [weeklyReports] = useState<WeeklyReportData[]>(mockWeeklyReports);
  const [currentWeekReportGenerated, setCurrentWeekReportGenerated] = useState(false);

  useEffect(() => {
    const loadReports = async () => {
      setIsLoading(true);
      const { todayReport, historicalReports } = await fetchReports();
      setTodayReport(todayReport);
      setHistoricalReports(historicalReports);
      setIsLoading(false);
    };

    loadReports();
  }, [currentScreen]); // Re-fetch when returning from create screen


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
      case 'createWeekly':
        return <CreateWeeklyReportScreen />;
      case 'generatingWeekly':
        return <GeneratingWeeklyReportScreen />;
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

  const DailyReportCard = ({ data, isToday = false }: { data: ReportFromSupabase; isToday?: boolean }) => {
    const achievementColor = getAchievementColor(data.achievement_score);
    
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
          {formatDisplayDate(data.report_date)}
        </Text>

        {/* Achievement Rate Indicator */}
        <View style={styles.achievementContainer}>
          <View style={[
            styles.achievementBox,
            { backgroundColor: achievementColor }
          ]}>
            <Text style={styles.achievementScore}>
              {data.achievement_score}
            </Text>
          </View>
          <Text style={[styles.achievementLabel, { color: Colors[colorScheme ?? 'light'].icon }]}>
            Achievement Score
          </Text>
        </View>

        {/* AI Coach's Feedback Summary */}
        <View style={styles.feedbackContainer}>
          {data.ai_coach_feedback.map((feedback, index) => (
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
    if (isLoading) {
      return (
        <View style={styles.contentContainer}>
          <Text style={{ color: Colors[colorScheme ?? 'light'].text }}>리포트 로딩 중...</Text>
        </View>
      );
    }
    
    return (
      <View style={styles.dailyReportContainer}>
        {/* Sticky Today's Report Card - Conditional Rendering */}
        <View style={styles.stickyHeaderContainer}>
          {todayReport ? (
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

  // Activity Section Component (Matching Reference Design)
  const ActivitySection = ({ data }: { data: WeeklyReportData }) => {
    const dayLabels = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];
    
    return (
      <View style={[styles.activitySection, { backgroundColor: Colors[colorScheme ?? 'light'].card }]}>
        <Text style={[styles.sectionTitle, { color: Colors[colorScheme ?? 'light'].text }]}>
          활동 요약
        </Text>
        
        <View style={styles.activityGrid}>
          {dayLabels.map((day, index) => {
            const score = data.dailyScores[index];
            const dayColor = score > 0 ? getAchievementColor(score) : Colors[colorScheme ?? 'light'].icon;
            
            return (
              <View key={index} style={styles.activityDay}>
                <View style={[styles.activityScoreContainer, { backgroundColor: dayColor }]}>
                  <Text style={styles.activityScore}>
                    {new Date(data.weekStart).getDate() + index}
                  </Text>
                </View>
                <Text style={[styles.activityDayLabel, { color: Colors[colorScheme ?? 'light'].icon }]}>
                  {day}
                </Text>
              </View>
            );
          })}
        </View>
      </View>
    );
  };

  // Generating Weekly Report Screen Component
  const GeneratingWeeklyReportScreen = () => {
    const [loadingProgress, setLoadingProgress] = useState(0);

    useEffect(() => {
      // Simulate loading progress
      const interval = setInterval(() => {
        setLoadingProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            // Set report as generated and navigate back
            setTimeout(() => {
              setCurrentWeekReportGenerated(true);
              setCurrentScreen('report');
            }, 1000);
            return 100;
          }
          return prev + 10;
        });
      }, 300);

      return () => clearInterval(interval);
    }, []);

    const handleDebugSkip = () => {
      console.log('🐛 DEBUG: Skipping weekly report generation');
      setCurrentWeekReportGenerated(true);
      setCurrentScreen('report');
    };

    return (
      <SafeAreaView style={[styles.container, { backgroundColor: Colors[colorScheme ?? 'light'].background }]}>
        {/* Header */}
        <View style={styles.createWeeklyHeader}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => setCurrentScreen('createWeekly')}
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

        {/* Loading Content */}
        <View style={styles.generatingContent}>
          <View style={styles.loadingContainer}>
            <View style={styles.circularProgressContainer}>
              {/* Background Circle */}
              <View style={styles.circularProgressTrack} />
              
              {/* Progress Circle using strokeDasharray technique */}
              <View 
                style={[
                  styles.circularProgressBar,
                  {
                    transform: [{ rotate: '-90deg' }]
                  }
                ]}
              >
                <View 
                  style={[
                    styles.circularProgressFill,
                    {
                      borderTopWidth: loadingProgress >= 25 ? 6 : (loadingProgress * 6 / 25),
                      borderRightWidth: loadingProgress >= 50 ? 6 : Math.max(0, (loadingProgress - 25) * 6 / 25),
                      borderBottomWidth: loadingProgress >= 75 ? 6 : Math.max(0, (loadingProgress - 50) * 6 / 25),
                      borderLeftWidth: loadingProgress >= 100 ? 6 : Math.max(0, (loadingProgress - 75) * 6 / 25),
                      borderTopColor: loadingProgress > 0 ? '#4CAF50' : 'transparent',
                      borderRightColor: loadingProgress > 25 ? '#4CAF50' : 'transparent',
                      borderBottomColor: loadingProgress > 50 ? '#4CAF50' : 'transparent',
                      borderLeftColor: loadingProgress > 75 ? '#4CAF50' : 'transparent',
                    }
                  ]}
                />
              </View>
              
              {/* Content */}
              <View style={styles.circularProgressContent}>
                <Text style={styles.loadingIcon}>📊</Text>
                <Text style={[styles.loadingTitle, { color: Colors[colorScheme ?? 'light'].text }]}>
                  리포트 생성중...
                </Text>
              </View>
            </View>
            <Text style={[styles.loadingSubtext, { color: Colors[colorScheme ?? 'light'].icon }]}>
              이번 주의 데이터를 분석하고 있습니다
            </Text>
            
            {/* Progress Bar */}
            <View style={styles.progressContainer}>
              <View style={styles.progressBarBackground}>
                <View 
                  style={[
                    styles.progressBarFill,
                    { 
                      width: `${loadingProgress}%`,
                      backgroundColor: Colors[colorScheme ?? 'light'].tint
                    }
                  ]}
                />
              </View>
              <Text style={[styles.progressText, { color: Colors[colorScheme ?? 'light'].icon }]}>
                {loadingProgress}%
              </Text>
            </View>
          </View>

          {/* Debug Button */}
          <DebugNextButton
            to="Skip Generation"
            onPress={handleDebugSkip}
            label="Debug: Skip Generation"
            disabled={false}
          />
        </View>
      </SafeAreaView>
    );
  };

  // Create Weekly Report Screen Component  
  const CreateWeeklyReportScreen = () => {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: Colors[colorScheme ?? 'light'].background }]}>
        {/* Header */}
        <View style={styles.createWeeklyHeader}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => setCurrentScreen('report')}
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

        {/* Content */}
        <View style={styles.createWeeklyContent}>
          <View style={styles.createWeeklyPrompt}>
            <Text style={styles.createWeeklyIcon}>📊</Text>
            <Text style={[styles.createWeeklyPromptText, { color: Colors[colorScheme ?? 'light'].text }]}>
              이번 주의 활동을 토대로{'\n'}주간 리포트를 진행해봐요.
            </Text>
          </View>

          <View style={[styles.createWeeklyCard, { backgroundColor: Colors[colorScheme ?? 'light'].card }]}>
            <Text style={[styles.createWeeklyCardTitle, { color: Colors[colorScheme ?? 'light'].text }]}>
              분석 항목
            </Text>
            <View style={styles.analysisItems}>
              <View style={styles.analysisItem}>
                <Text style={styles.analysisItemIcon}>✓</Text>
                <Text style={[styles.analysisItemText, { color: Colors[colorScheme ?? 'light'].text }]}>
                  일별 To-Do 리스트 달성 점수
                </Text>
              </View>
              <View style={styles.analysisItem}>
                <Text style={styles.analysisItemIcon}>✓</Text>
                <Text style={[styles.analysisItemText, { color: Colors[colorScheme ?? 'light'].text }]}>
                  주간 목표 달성도
                </Text>
              </View>
              <View style={styles.analysisItem}>
                <Text style={styles.analysisItemIcon}>✓</Text>
                <Text style={[styles.analysisItemText, { color: Colors[colorScheme ?? 'light'].text }]}>
                  코치와 당신과 나눈 면담
                </Text>
              </View>
            </View>
          </View>

          <TouchableOpacity 
            style={styles.generateReportButton}
            onPress={() => {
              console.log('🐛 DEBUG: Starting weekly report generation...');
              setCurrentScreen('generatingWeekly');
            }}
            activeOpacity={0.8}
          >
            <Text style={styles.generateReportButtonText}>
              리포트 생성하기
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  };

  // Empty Weekly Report Component
  const EmptyWeeklyReport = () => {
    // For dummy design, always show as end of week
    const isEndOfWeek = true;
    
    const handleStartWeeklyReport = () => {
      console.log('🐛 DEBUG: Starting weekly report creation');
      setCurrentScreen('createWeekly');
    };
    
    if (isEndOfWeek) {
      return (
        <View style={styles.emptyWeeklyContainer}>
          <View style={styles.emptyWeeklyContent}>
            <Text style={styles.emptyWeeklyIcon}>✨</Text>
            <Text style={[styles.emptyWeeklyText, { color: Colors[colorScheme ?? 'light'].text }]}>
              이번 주도 수고 많았습니다.{'\n'}리포트를 진행하시겠어요?
            </Text>
            <TouchableOpacity 
              style={[styles.weeklyReportButton, { backgroundColor: '#1c1c2e' }]}
              onPress={handleStartWeeklyReport}
              activeOpacity={0.8}
            >
              <Text style={styles.weeklyReportButtonText}>
                주간 리포트 시작하기
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }
    
    return (
      <View style={styles.emptyWeeklyContainer}>
        <View style={styles.emptyWeeklyContent}>
          <Text style={styles.emptyWeeklyIcon}>📅</Text>
          <Text style={[styles.emptyWeeklyText, { color: Colors[colorScheme ?? 'light'].text }]}>
            아직 주차가 끝나지 않았습니다.{'\n'}이번주가 끝나고 뵈어요!
          </Text>
        </View>
      </View>
    );
  };

  // Reviews Section Component (Matching Reference Design)
  const ReviewsSection = ({ data }: { data: WeeklyReportData }) => {
    const averagePercentage = Math.round((data.averageScore / 10) * 100);
    const completedTasks = data.daysCompleted;
    
    return (
      <View style={[styles.reviewsSection, { backgroundColor: Colors[colorScheme ?? 'light'].card }]}>
        <Text style={[styles.sectionTitle, { color: Colors[colorScheme ?? 'light'].text }]}>
          주간 리포트
        </Text>
        
        <View style={styles.reviewsGrid}>
          <View style={styles.reviewsColumn}>
            <Text style={[styles.reviewsLabel, { color: Colors[colorScheme ?? 'light'].icon }]}>
              평균 점수
            </Text>
            <Text style={[styles.reviewsValue, { color: Colors[colorScheme ?? 'light'].text }]}>
              {data.averageScore.toFixed(1)}
            </Text>
          </View>
          
          <View style={styles.reviewsColumn}>
            <Text style={[styles.reviewsLabel, { color: Colors[colorScheme ?? 'light'].icon }]}>
              완료된 일수
            </Text>
            <Text style={[styles.reviewsValue, { color: Colors[colorScheme ?? 'light'].text }]}>
              {completedTasks}
            </Text>
          </View>
        </View>
        
        {/* Progress Bar */}
        <View style={styles.progressBarContainer}>
          <View style={styles.progressBarBackground}>
            <View 
              style={[
                styles.progressBarFill, 
                { 
                  width: `${averagePercentage}%`,
                  backgroundColor: '#4CAF50'
                }
              ]} 
            />
          </View>
        </View>
        
        {/* AI Report Section */}
        <View style={styles.aiReportContainer}>
          <Text style={[styles.aiReportLabel, { color: Colors[colorScheme ?? 'light'].icon }]}>
            Routy의 코멘트
          </Text>
          <View style={[styles.aiReportContent, { backgroundColor: Colors[colorScheme ?? 'light'].background }]}>
            <Text style={[styles.aiReportText, { color: Colors[colorScheme ?? 'light'].text }]}>
              여기에 주간 리포트 전문이 입력됩니다
            </Text>
          </View>
        </View>
      </View>
    );
  };

  // Week Navigation Component
  const WeekNavigator = () => {
    // Allow going to -1 (next week) when current week report is generated
    const canGoPrevious = currentWeekIndex < weeklyReports.length - 1;
    const canGoNext = currentWeekReportGenerated ? currentWeekIndex > -1 : currentWeekIndex > 0;
    
    return (
      <View style={styles.weekNavigatorContainer}>
        <TouchableOpacity 
          style={[
            styles.weekNavButton, 
            !canGoPrevious && styles.weekNavButtonDisabled
          ]}
          onPress={() => canGoPrevious && setCurrentWeekIndex(currentWeekIndex + 1)}
          disabled={!canGoPrevious}
          activeOpacity={0.7}
        >
          <Text style={[
            styles.weekNavButtonText, 
            { color: Colors[colorScheme ?? 'light'].text },
            !canGoPrevious && styles.weekNavButtonTextDisabled
          ]}>
            ← 이전 주
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[
            styles.weekNavButton, 
            !canGoNext && styles.weekNavButtonDisabled
          ]}
          onPress={() => canGoNext && setCurrentWeekIndex(currentWeekIndex - 1)}
          disabled={!canGoNext}
          activeOpacity={0.7}
        >
          <Text style={[
            styles.weekNavButtonText, 
            { color: Colors[colorScheme ?? 'light'].text },
            !canGoNext && styles.weekNavButtonTextDisabled
          ]}>
            다음 주 →
          </Text>
        </TouchableOpacity>
      </View>
    );
  };

  // Weekly Stats Overview Component
  const WeeklyStatsOverview = ({ data }: { data: WeeklyReportData }) => {
    return (
      <View style={styles.weeklyStatsContainer}>
        <View style={[styles.weeklyStatCard, { backgroundColor: Colors[colorScheme ?? 'light'].card }]}>
          <Text style={[styles.weeklyStatValue, { color: Colors[colorScheme ?? 'light'].text }]}>
            {data.daysCompleted}/{data.totalDays}
          </Text>
          <Text style={[styles.weeklyStatLabel, { color: Colors[colorScheme ?? 'light'].icon }]}>
            완료 일수
          </Text>
        </View>
        
        <View style={[styles.weeklyStatCard, { backgroundColor: Colors[colorScheme ?? 'light'].card }]}>
          <Text style={[styles.weeklyStatValue, { color: Colors[colorScheme ?? 'light'].text }]}>
            {data.averageScore.toFixed(1)}
          </Text>
          <Text style={[styles.weeklyStatLabel, { color: Colors[colorScheme ?? 'light'].icon }]}>
            평균 점수
          </Text>
        </View>
        
        <View style={[styles.weeklyStatCard, { backgroundColor: Colors[colorScheme ?? 'light'].card }]}>
          <Text style={[styles.weeklyStatValue, { color: Colors[colorScheme ?? 'light'].text }]}>
            {data.bestDay}
          </Text>
          <Text style={[styles.weeklyStatLabel, { color: Colors[colorScheme ?? 'light'].icon }]}>
            가장 열심히 한 날
          </Text>
        </View>
      </View>
    );
  };

  // Debug Handler for Weekly Reports
  const handleDebugWeeklyNavigation = () => {
    try {
      console.log('🐛 DEBUG: WeeklyReport - Current week index:', currentWeekIndex);
      console.log('🐛 DEBUG: WeeklyReport - Available weeks:', weeklyReports.length);
      console.log('🐛 DEBUG: WeeklyReport - Current week data:', weeklyReports[currentWeekIndex]);
      
      // Cycle through different weeks for testing
      const nextIndex = (currentWeekIndex + 1) % weeklyReports.length;
      setCurrentWeekIndex(nextIndex);
      console.log('🐛 DEBUG: WeeklyReport - Switched to week index:', nextIndex);
    } catch (error) {
      console.error('🐛 DEBUG: WeeklyReport - Error in debug handler:', error);
    }
  };

  const WeeklyReportContent = () => {
    // Handle different week scenarios
    let currentWeekData: WeeklyReportData | null = null;
    
    if (currentWeekIndex === 0 && currentWeekReportGenerated) {
      // Current week with generated report
      currentWeekData = generateNewWeeklyReport();
    } else if (currentWeekIndex === 0 && !currentWeekReportGenerated) {
      // Current week without generated report - show empty state
      return (
        <View style={styles.newWeeklyContainer}>
          <WeekNavigator />
          <EmptyWeeklyReport />
          <DebugNextButton
            to="Next Weekly State"
            onPress={handleDebugWeeklyNavigation}
            label="Debug: Cycle Weeks"
            disabled={false}
          />
        </View>
      );
    } else if (currentWeekIndex === -1) {
      // Next week - show creation screen
      return (
        <View style={styles.newWeeklyContainer}>
          <WeekNavigator />
          <EmptyWeeklyReport />
          <DebugNextButton
            to="Next Weekly State"
            onPress={handleDebugWeeklyNavigation}
            label="Debug: Cycle Weeks"
            disabled={false}
          />
        </View>
      );
    } else if (currentWeekIndex > 0) {
      // Previous weeks
      currentWeekData = weeklyReports[currentWeekIndex - 1];
    }
    
    // Show error state if no data available
    if (!currentWeekData) {
      return (
        <View style={styles.contentContainer}>
          <Text style={{ color: Colors[colorScheme ?? 'light'].text }}>
            주간 리포트 데이터를 불러올 수 없습니다.
          </Text>
        </View>
      );
    }
    
    return (
      <View style={styles.newWeeklyContainer}>
        {/* Week Navigation */}
        <WeekNavigator />
        
        {/* Weekly Summary Title */}
        <Text style={[styles.weeklySummaryTitle, { color: Colors[colorScheme ?? 'light'].text }]}>
          {formatWeeklyDate(currentWeekData.weekStart, currentWeekData.weekEnd).replace('주간 리포트', '주간 요약')}
        </Text>
        
        {/* Activity Section */}
        <ActivitySection data={currentWeekData} />
        
        {/* Reviews Section */}
        <ReviewsSection data={currentWeekData} />
        
        {/* Debug Button */}
        <DebugNextButton
          to="Next Weekly State"
          onPress={handleDebugWeeklyNavigation}
          label="Debug: Cycle Weeks"
          disabled={false}
        />
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
  
  // Weekly Report Styles
  weeklyContentContainer: {
    flex: 1,
    paddingHorizontal: 24,
  },
  weeklyMainCardContainer: {
    marginBottom: 24,
  },
  weeklyReportCard: {
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  weeklyScoreContainer: {
    marginRight: 16,
  },
  weeklyScoreBox: {
    width: 80,
    height: 80,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  weeklyScoreText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  weeklyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  weeklyInsightsContainer: {
    gap: 6,
  },
  weeklyInsightItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  weeklyInsightBullet: {
    fontSize: 16,
    color: '#FFFFFF',
    marginRight: 8,
    marginTop: 1,
  },
  weeklyInsightText: {
    fontSize: 14,
    lineHeight: 20,
    flex: 1,
  },
  
  // Week Navigation Styles
  weekNavigatorContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 16,
    marginBottom: 16,
  },
  weekNavButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  weekNavButtonDisabled: {
    opacity: 0.3,
  },
  weekNavButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  weekNavButtonTextDisabled: {
    opacity: 0.5,
  },
  
  // Weekly Stats Styles
  weeklyStatsContainer: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 24,
  },
  weeklyStatCard: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    minHeight: 80,
    justifyContent: 'center',
  },
  weeklyStatValue: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  weeklyStatLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
  
  // New Weekly Report Styles (Matching Reference Design)
  newWeeklyContainer: {
    flex: 1,
    paddingHorizontal: 24,
  },
  weeklySummaryTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 32,
    marginTop: 16,
    fontFamily: 'Inter',
  },
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 16,
    fontFamily: 'Inter',
  },
  
  // Activity Section Styles
  activitySection: {
    marginBottom: 32,
    padding: 20,
    borderRadius: 16,
  },
  activityGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },
  activityDay: {
    alignItems: 'center',
    flex: 1,
  },
  activityDayLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginTop: 8,
    fontFamily: 'Inter',
  },
  activityScoreContainer: {
    width: 40,
    height: 40,
    borderRadius: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  activityScore: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    fontFamily: 'Inter',
  },
  
  // Reviews Section Styles
  reviewsSection: {
    marginBottom: 32,
    padding: 20,
    borderRadius: 16,
  },
  reviewsGrid: {
    flexDirection: 'row',
    marginBottom: 24,
  },
  reviewsColumn: {
    flex: 1,
    alignItems: 'flex-start',
  },
  reviewsLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
    fontFamily: 'Inter',
  },
  reviewsValue: {
    fontSize: 48,
    fontWeight: 'bold',
    fontFamily: 'Inter',
  },
  
  // Progress Bar Styles
  progressBarContainer: {
    marginTop: 8,
  },
  progressLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 12,
    fontFamily: 'Inter',
  },
  progressBarBackground: {
    height: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  
  // AI Report Styles
  aiReportContainer: {
    marginTop: 20,
  },
  aiReportLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 12,
    fontFamily: 'Inter',
  },
  aiReportContent: {
    padding: 16,
    borderRadius: 12,
    minHeight: 240,
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  aiReportText: {
    fontSize: 16,
    lineHeight: 24,
    fontFamily: 'Inter',
  },
  
  // Empty Weekly Report Styles
  emptyWeeklyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    marginTop: -40,
  },
  emptyWeeklyContent: {
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyWeeklyIcon: {
    fontSize: 64,
    marginBottom: 24,
  },
  emptyWeeklyText: {
    fontSize: 22,
    fontWeight: '500',
    textAlign: 'center',
    lineHeight: 32,
    fontFamily: 'Inter',
  },
  weeklyReportButton: {
    marginTop: 32,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  weeklyReportButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
    fontFamily: 'Inter',
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
  analysisItems: {
    gap: 16,
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
  
  // Generating Weekly Report Screen Styles
  generatingContent: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: 60,
  },
  circularProgressContainer: {
    position: 'relative',
    width: 200,
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  circularProgressTrack: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 6,
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  circularProgressBar: {
    position: 'absolute',
    width: 200,
    height: 200,
    borderRadius: 100,
  },
  circularProgressFill: {
    width: 200,
    height: 200,
    borderRadius: 100,
    borderColor: 'transparent',
  },
  circularProgressContent: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    width: 160,
    height: 160,
  },
  loadingIcon: {
    fontSize: 60,
    marginBottom: 8,
  },
  loadingTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    fontFamily: 'Inter',
    textAlign: 'center',
  },
  loadingSubtext: {
    fontSize: 16,
    fontWeight: '500',
    textAlign: 'center',
    marginBottom: 40,
    fontFamily: 'Inter',
  },
  progressContainer: {
    width: '100%',
    alignItems: 'center',
    marginBottom: 20,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 8,
    fontFamily: 'Inter',
  },
}); 