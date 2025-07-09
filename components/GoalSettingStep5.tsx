import { useState } from 'react';
import { Alert, Dimensions, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { submitHabitData } from '../backend/hwirang/habit';
import { scheduleAllHabitRoutines } from '../backend/hwirang/routineNotifications';
import { saveHabitRoutine } from '../backend/supabase/habits';
import { useHabitStore } from '../lib/habitStore';

const { width } = Dimensions.get('window');

interface GoalSettingStep5Props {
  goalData: {
    goal: string;
    period: string;
    coachingIntensity: string;
    difficulty: string;
  };
  onComplete: () => void;
  onBack: () => void;
}

export default function GoalSettingStep5({ goalData, onComplete, onBack }: GoalSettingStep5Props) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { habit, time, intensity, difficulty, setDifficulty } = useHabitStore();

  const handleComplete = async () => {
    if (isSubmitting) return;
    
    console.log('🔄 Starting GoalSettingStep5 completion...', { habit, time, intensity, difficulty: goalData.difficulty });
    setIsSubmitting(true);

    try {
      // 현재 difficulty 저장
      setDifficulty(goalData.difficulty);

      // 1. AI 루틴 생성 (실패해도 계속 진행)
      let habitEvents: any[] = [];
      try {
        console.log('🤖 AI 루틴 생성 시도 중...');
        habitEvents = await submitHabitData(habit, time, goalData.difficulty);
        console.log('✅ AI 루틴 생성 성공:', habitEvents);
      } catch (aiError) {
        console.warn('⚠️ AI 루틴 생성 실패, 기본 루틴 사용:', aiError);
        // submitHabitData 함수 자체에서 기본 루틴을 반환하므로 여기서는 빈 배열로 처리
        habitEvents = [];
      }

      // 2. 데이터베이스 저장 (실패해도 계속 진행)
      try {
        console.log('💾 데이터베이스 저장 시도 중...');
        const savedData = await saveHabitRoutine(
          habit,
          time,
          intensity,
          goalData.difficulty,
          habitEvents
        );
        console.log('✅ 데이터베이스 저장 성공:', savedData);
      } catch (dbError) {
        console.warn('⚠️ 데이터베이스 저장 실패, 로컬 저장만 사용:', dbError);
      }

      // 3. 알림 설정 (실패해도 계속 진행)
      if (habitEvents && habitEvents.length > 0) {
        try {
          console.log('🔔 알림 설정 시도 중...');
          const notificationResult = await scheduleAllHabitRoutines(habitEvents);
          if (notificationResult.success) {
            console.log('✅ 알림 설정 성공');
          } else {
            console.warn('⚠️ 알림 설정 실패:', notificationResult.error);
          }
        } catch (notificationError) {
          console.warn('⚠️ 알림 설정 중 오류:', notificationError);
        }
      }

      // 4. 완료 처리 - 모든 오류와 관계없이 진행
      console.log('🎉 목표 설정 완료, 다음 화면으로 이동');
      onComplete();
      Alert.alert('성공', '습관 목표가 성공적으로 설정되었습니다!');

    } catch (error) {
      console.error('💥 GoalSettingStep5 예상치 못한 오류:', error);
      // 모든 오류에 대해 사용자에게 선택권 제공
      Alert.alert(
        '알림', 
        'AI 서비스에 일시적인 문제가 있지만 기본 설정으로 계속 진행할 수 있습니다. 계속하시겠습니까?', 
        [
          { text: '취소', style: 'cancel' },
          { text: '계속', onPress: () => {
            console.log('🔄 사용자 선택: 기본 설정으로 계속 진행');
            onComplete();
          }}
        ]
      );
    } finally {
      setIsSubmitting(false);
      console.log('🏁 GoalSettingStep5 완료 처리 끝');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.progressText}>5 / 5 단계</Text>
        
        {/* Back Button */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={onBack}
          disabled={isSubmitting}
        >
          <Text style={styles.backButtonText}>← 이전</Text>
        </TouchableOpacity>
        
        <View style={styles.titleContainer}>
          <Text style={styles.title}>마지막으로</Text>
          <Text style={styles.title}>확인해주세요</Text>
        </View>
        
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>나의 목표 설정</Text>
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>내 목표</Text>
            <Text style={styles.summaryValue}>{habit || '-'}</Text>
          </View>
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>실천 기간</Text>
            <Text style={styles.summaryValue}>{time || '-'}</Text>
          </View>
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>코칭 강도</Text>
            <Text style={styles.summaryValue}>{intensity || '-'}</Text>
          </View>
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>어려웠던 점</Text>
            <Text style={styles.summaryValue}>{goalData.difficulty || '-'}</Text>
          </View>
        </View>
        
        <Text style={styles.encouragementText}>
          좋은 시작이에요! '{goalData.difficulty}'을 이겨낼 수 있도록 제가 옆에서 든든하게 도와드릴게요. 함께 멋진 여정을 만들어봐요!
        </Text>
        
        <TouchableOpacity
          style={[styles.completeButton, isSubmitting && styles.completeButtonDisabled]} 
          onPress={handleComplete}
          disabled={isSubmitting}
        >
          <Text style={styles.completeButtonText}>
            {isSubmitting ? '처리 중...' : '완료하고 시작하기'}
          </Text>
        </TouchableOpacity>
        
        {/* 임시 테스트 버튼 - 디버깅용 */}
        <TouchableOpacity
          style={styles.testButton}
          onPress={() => {
            console.log('🧪 TEST BUTTON: Bypassing AI/DB operations, calling onComplete directly');
            setDifficulty(goalData.difficulty);
            onComplete();
          }}
        >
          <Text style={styles.testButtonText}>테스트: 바로 완료 (AI/DB 건너뛰기)</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1c1c2e',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
  },
  progressText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#a9a9c2',
    textAlign: 'center',
    marginBottom: 40,
    fontFamily: 'Inter',
  },
  titleContainer: {
    marginBottom: 80,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    lineHeight: 40,
    fontFamily: 'Inter',
  },
  summaryCard: {
    backgroundColor: '#3a3a50',
    borderRadius: 20,
    padding: 24,
    marginBottom: 40,
    minHeight: 200,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 24,
    fontFamily: 'Inter',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#a9a9c2',
    fontFamily: 'Inter',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'right',
    flex: 1,
    marginLeft: 20,
    fontFamily: 'Inter',
  },
  encouragementText: {
    fontSize: 14,
    color: '#ffffff',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 40,
    paddingHorizontal: 8,
    fontFamily: 'Inter',
  },
  completeButton: {
    backgroundColor: '#6c63ff',
    borderRadius: 28,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
  },
  completeButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    fontFamily: 'Inter',
  },
  completeButtonDisabled: {
    opacity: 0.7,
  },
  backButton: {
    position: 'absolute',
    top: 20,
    left: 24,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: 'transparent',
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#a9a9c2',
    fontFamily: 'Inter',
  },
  testButton: {
    backgroundColor: '#ff6b6b',
    borderRadius: 16,
    paddingVertical: 12,
    alignItems: 'center',
    marginHorizontal: 24,
    marginTop: 16,
    marginBottom: 40,
  },
  testButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#ffffff',
    fontFamily: 'Inter',
  },
}); 