import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';

const { width, height } = Dimensions.get('window');

interface DailyReportResultScreenProps {
  achievementScore: number;
  onBack: () => void;
}

// Coach status based on achievement rate (copied from HomeScreen)
interface CoachStatus {
  emoji: string;
  message: string;
  color: string;
}

export default function DailyReportResultScreen({ 
  achievementScore, 
  onBack 
}: DailyReportResultScreenProps) {
  
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

  // Placeholder AI report text
  const aiReportText = `오늘 하루 동안 ${achievementScore}/10의 성과를 보여주셨네요!

🎯 **오늘의 성과 분석**
• 설정한 목표 대비 ${Math.round((achievementScore / 10) * 100)}%의 달성률을 보이셨습니다
• 꾸준한 노력의 흔적이 보입니다
• 일관성 있는 실천이 인상적입니다

💡 **내일을 위한 조언**
• 오늘의 성과를 바탕으로 내일은 조금 더 도전적인 목표를 설정해보세요
• 완료하지 못한 부분에 대해서는 너무 자책하지 마세요
• 작은 성취도 충분히 의미가 있습니다

🌟 **격려의 메시지**
매일 조금씩 나아지는 것이 가장 중요합니다. 오늘도 수고하셨고, 내일도 함께 화이팅해요!

"성공은 하루아침에 이루어지는 것이 아니라, 매일의 작은 노력이 쌓여서 만들어지는 것입니다." - 당신의 AI 코치 🤖`;

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
}); 