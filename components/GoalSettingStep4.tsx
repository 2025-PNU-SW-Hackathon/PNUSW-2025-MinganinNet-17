import { useState } from 'react';
import { Alert, Dimensions, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { submitHabitData } from '../backend/hwirang/habit';
import { scheduleAllHabitRoutines } from '../backend/hwirang/routineNotifications';
import { saveHabitRoutine } from '../backend/supabase/habits';
import { useHabitStore } from '../lib/habitStore';

const { width } = Dimensions.get('window');

interface GoalSettingStep4Props {
  goalData: {
    goal: string;
    period: string;
    coachingIntensity: string;
    difficulty: string;
  };
  onComplete: () => void;
  onBack: () => void;
}

export default function GoalSettingStep4({ goalData, onComplete, onBack }: GoalSettingStep4Props) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { habit, time, intensity, setDifficulty } = useHabitStore();

  const handleComplete = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    try {
      // 현재 difficulty 저장
      setDifficulty(goalData.difficulty);

      // 1. AI 루틴 생성
      const habitEvents = await submitHabitData(habit, time, goalData.difficulty);
      console.log('AI 응답 결과:', habitEvents);

      // 2. 데이터베이스에 모든 데이터 저장
      const savedData = await saveHabitRoutine(
        habit,
        time,
        intensity,
        goalData.difficulty,
        habitEvents
      );
      console.log('저장된 데이터:', savedData);

      // 3. 알림 설정
      if (habitEvents) {
        try {
          const notificationResult = await scheduleAllHabitRoutines(habitEvents);
          if (!notificationResult.success) {
            console.warn('알림 설정 실패:', notificationResult.error);
            Alert.alert('주의', '알림 설정에 실패했습니다. 나중에 다시 시도해주세요.');
          }
        } catch (notificationError) {
          console.error('알림 설정 중 오류:', notificationError);
          Alert.alert('주의', '알림 설정에 실패했습니다. 나중에 다시 시도해주세요.');
        }
      }

      // 4. 완료 처리
      onComplete();
      Alert.alert('성공', '습관이 성공적으로 생성되었습니다!');

    } catch (error) {
      console.error('데이터 제출 중 오류 발생:', error);
      Alert.alert('오류', '습관 생성에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.progressText}>4 / 4 단계</Text>
        
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
}); 