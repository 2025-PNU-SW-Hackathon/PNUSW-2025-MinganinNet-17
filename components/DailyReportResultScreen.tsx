import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { createReport } from '../backend/supabase/reports';
import { DailyTodo } from '../types/habit';

const { width, height } = Dimensions.get('window');

interface DailyReportResultScreenProps {
  achievementScore: number;
  onBack: () => void;
  aiReportText: string;
  todos: DailyTodo[]; // 할일 목록 데이터 추가
}

// Coach status based on achievement rate (copied from HomeScreen)
interface CoachStatus {
  emoji: string;
  message: string;
  color: string;
}

export default function DailyReportResultScreen({ 
  achievementScore, 
  onBack,
  aiReportText,
  todos
}: DailyReportResultScreenProps) {
  
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  
  // Animation values
  const animatedScore = useRef(new Animated.Value(0)).current;
  const animatedProgress = useRef(new Animated.Value(0)).current;
  const [displayScore, setDisplayScore] = useState(0);
  
  const getCoachStatus = (): CoachStatus => {
    const rate = achievementScore / 10;
    if (rate >= 0.9) return { emoji: '🥳', message: '완벽한 하루!', color: '#4CAF50' };
    if (rate >= 0.7) return { emoji: '😊', message: '정말 잘하고 있어요!', color: '#8BC34A' };
    if (rate >= 0.5) return { emoji: '😌', message: '꾸준히 실천 중이네요', color: '#FFC107' };
    if (rate > 0) return { emoji: '😐', message: '조금만 더 힘내요!', color: '#FF9800' };
    return { emoji: '🤔', message: '시작이 반이에요!', color: '#9E9E9E' };
  };

  const coachStatus = getCoachStatus();
  
  const handleSaveReport = async () => {
    setIsSaving(true);
    setSaveError(null);
    try {
      const feedbackArray = aiReportText.split('\n').map(s => s.trim()).filter(Boolean);
      
      // 할일 목록 데이터를 JSON 형태로 구성
      const dailyActivitiesData = {
        todos: todos.map(todo => ({
          id: todo.id,
          description: todo.description,
          completed: todo.is_completed
        }))
      };
      
      const reportToSave = {
        report_date: new Date().toISOString().split('T')[0],
        achievement_score: achievementScore,
        ai_coach_feedback: feedbackArray,
        daily_activities: dailyActivitiesData, // 할일 목록 데이터 추가
      };

      const newReport = await createReport(reportToSave);

      if (!newReport) {
        throw new Error("리포트 저장에 실패했습니다.");
      }

      console.log("리포트가 성공적으로 저장되었습니다:", newReport);
      // Navigate back to the main report screen
      onBack();
    } catch (error) {
      console.error("리포트 저장 중 오류 발생:", error);
      setSaveError("리포트 저장에 실패했습니다. 나중에 다시 시도해주세요.");
    } finally {
      setIsSaving(false);
    }
  };
  
  // Start animation when component mounts
  useEffect(() => {
    // Add listener to update display score
    const listener = animatedScore.addListener(({ value }) => {
      setDisplayScore(Math.round(value));
    });
    
    // Animate score counter
    Animated.timing(animatedScore, {
      toValue: achievementScore,
      duration: 1500, // 1.5 seconds
      useNativeDriver: false, // We need to interpolate for text
    }).start();
    
    // Animate progress bar
    Animated.timing(animatedProgress, {
      toValue: achievementScore / 10,
      duration: 1500, // 1.5 seconds
      useNativeDriver: false, // We need to interpolate for width
    }).start();
    
    // Cleanup listener on unmount
    return () => {
      animatedScore.removeListener(listener);
    };
  }, [achievementScore]);

  return (
    <SafeAreaView style={styles.container}>
      {/* Screen Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Today's Daily Report</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Main Content Area */}
      <ScrollView>
        <View style={styles.mainContent}>
          {/* Top Section - 50% of main content */}
          <View style={styles.topSection}>
            {/* Left Half - Coach's Status */}
            <View style={styles.leftHalf}>
              <View style={styles.coachCard}>
                <Text style={styles.cardTitle}>Coach's Status</Text>
                <View style={styles.coachContent}>
                  <Text style={styles.coachEmoji}>{coachStatus.emoji}</Text>
                  <Text style={styles.coachMessage}>{coachStatus.message}</Text>
                  <View style={[styles.coachIndicator, { backgroundColor: coachStatus.color }]} />
                </View>
              </View>
            </View>

            {/* Right Half - Achievement Score */}
            <View style={styles.rightHalf}>
              <View style={styles.achievementCard}>
                <Text style={styles.cardTitle}>Achievement Score</Text>
                <View style={styles.achievementContent}>
                  <Text style={styles.achievementScore}>
                    {displayScore}
                  </Text>
                  <Text style={styles.achievementTotal}>/10</Text>
                </View>
                <View style={styles.achievementBar}>
                  <Animated.View 
                    style={[
                      styles.achievementProgress, 
                      { 
                        width: animatedProgress.interpolate({
                          inputRange: [0, 1],
                          outputRange: ['0%', '100%'],
                        }),
                        backgroundColor: coachStatus.color
                      }
                    ]} 
                  />
                </View>
              </View>
            </View>
          </View>

          {/* Bottom Section - 50% of main content */}
          <View style={styles.bottomSection}>
            <View style={styles.reportCard}>
              <Text style={styles.cardTitle}>AI Generated Report</Text>
              <ScrollView 
                style={styles.reportScrollView}
                showsVerticalScrollIndicator={false}
              >
                <Text style={styles.reportText}>{aiReportText}</Text>
              </ScrollView>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Footer Button */}
      <View style={styles.footer}>
        {isSaving ? (
          <ActivityIndicator size="large" color="#6c63ff" />
        ) : (
          <TouchableOpacity style={styles.saveButton} onPress={handleSaveReport} disabled={isSaving}>
            <Text style={styles.saveButtonText}>완료 및 리포트 저장</Text>
          </TouchableOpacity>
        )}
        {saveError && <Text style={styles.errorText}>{saveError}</Text>}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1c1c2e',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#3a3a50',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#3a3a50',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 20,
    color: '#ffffff',
    fontWeight: 'bold',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    fontFamily: 'Inter',
  },
  headerSpacer: {
    width: 40,
  },
  mainContent: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  topSection: {
    flex: 1,
    flexDirection: 'row',
    marginBottom: 20,
  },
  leftHalf: {
    flex: 1,
    marginRight: 10,
  },
  rightHalf: {
    flex: 1,
    marginLeft: 10,
  },
  bottomSection: {
    flex: 1,
  },
  coachCard: {
    flex: 1,
    backgroundColor: '#3a3a50',
    borderRadius: 16,
    padding: 20,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 15,
    fontFamily: 'Inter',
  },
  coachContent: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  coachEmoji: {
    fontSize: 80,
    marginBottom: 10,
  },
  coachMessage: {
    fontSize: 16,
    color: '#a9a9c2',
    textAlign: 'center',
    marginBottom: 10,
    fontFamily: 'Inter',
  },
  coachIndicator: {
    width: 60,
    height: 8,
    borderRadius: 4,
  },
  achievementCard: {
    flex: 1,
    backgroundColor: '#3a3a50',
    borderRadius: 16,
    padding: 20,
  },
  achievementContent: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
    flexDirection: 'row',
  },
  achievementScore: {
    fontSize: 64,
    fontWeight: 'bold',
    color: '#6c63ff',
    fontFamily: 'Inter',
  },
  achievementTotal: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#a9a9c2',
    fontFamily: 'Inter',
    marginLeft: 8,
  },
  achievementBar: {
    height: 8,
    backgroundColor: '#2a2a40',
    borderRadius: 4,
    marginTop: 16,
  },
  achievementProgress: {
    height: '100%',
    borderRadius: 4,
  },
  reportCard: {
    flex: 1,
    backgroundColor: '#3a3a50',
    borderRadius: 16,
    padding: 20,
  },
  reportScrollView: {
    flex: 1,
  },
  reportText: {
    fontSize: 16,
    color: '#ffffff',
    lineHeight: 24,
    fontFamily: 'Inter',
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 20,
    alignItems: 'center',
  },
  saveButton: {
    width: '100%',
    height: 50,
    backgroundColor: '#6c63ff',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  saveButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    fontFamily: 'Inter',
  },
  errorText: {
    color: '#ff6b6b',
    fontSize: 14,
    textAlign: 'center',
    fontFamily: 'Inter',
  },
}); 