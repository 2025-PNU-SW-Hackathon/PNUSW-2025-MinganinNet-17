import { useState } from 'react';
import { Alert, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { submitHabitData } from '../backend/hwirang/habit';
import { scheduleAllHabitRoutines } from '../backend/hwirang/routineNotifications';
import { HabitData, HabitEvent, saveHabitToSupabase } from '../backend/supabase/habits';
import { useHabitStore } from '../lib/habitStore';
import DebugNextButton from './DebugNextButton';

interface GoalSettingStep5Props {
  onComplete: () => void;
  onBack?: () => void;
}

export default function GoalSettingStep5({
  onComplete,
  onBack
}: GoalSettingStep5Props) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { habit, time, intensity, difficulty, goalPeriod, setPlan } =
    useHabitStore();

  // camelCase를 snake_case로 변환하는 헬퍼 함수들
  const toSnakeCase = (str: string) =>
    str.replace(/[A-Z]/g, (letter) => `_${letter.toLowerCase()}`);

  const convertKeysToSnakeCase = (obj: any): any => {
    if (Array.isArray(obj)) {
      return obj.map((v) => convertKeysToSnakeCase(v));
    } else if (obj !== null && obj.constructor === Object) {
      return Object.keys(obj).reduce((acc, key) => {
        const newKey = toSnakeCase(key);
        acc[newKey] = convertKeysToSnakeCase(obj[key]);
        return acc;
      }, {} as { [key: string]: any });
    }
    return obj;
  };

  const handleSubmit = async () => {
    console.log('🔄 Starting final submission...', {
      habit,
      time,
      intensity,
      difficulty,
      goalPeriod,
    });
    setIsSubmitting(true);

    try {
      // 1. AI 루틴 생성
      console.log('🤖 Generating AI routine...');
      const aiPlan = await submitHabitData(
        habit,
        time,
        difficulty,
        intensity,
        goalPeriod
      );
      console.log('✅ AI routine generated (camelCase):', aiPlan);

      // AI가 생성한 계획(camelCase)을 snake_case로 변환
      const snakeCasePlan = convertKeysToSnakeCase(aiPlan);
      console.log('🔄 Converted to snake_case for store:', snakeCasePlan);

      // 변환된 계획을 스토어에 저장
      setPlan(snakeCasePlan);

      // 2. 데이터베이스에 모든 데이터 저장
      const habitData: HabitData = {
        habit_name: habit,
        time_slot: time,
        intensity: intensity,
        difficulty: difficulty,
        ai_routine: JSON.stringify(aiPlan)
      };

      console.log('💾 Saving complete data to Supabase...', habitData);
      try {
        await saveHabitToSupabase(habitData);
        console.log('✅ Successfully saved to Supabase');
      } catch (dbError) {
        console.error('❌ Database save failed:', dbError);
        
        // 인증 오류인 경우 조용히 처리
        if (dbError instanceof Error && dbError.message === 'AUTH_MISSING') {
          console.log('🔓 No authentication - continuing with local storage only');
        } else {
          // 다른 오류는 알림 표시하지만 계속 진행
          console.warn('⚠️ Database error, continuing with local storage:', dbError);
          Alert.alert(
            '알림', 
            '데이터베이스 저장에 실패했지만 계속 진행합니다. 나중에 다시 시도해주세요.',
            [{ text: '확인', style: 'default' }]
          );
        }
      }

      // 3. 알림 설정
      if (aiPlan && aiPlan.milestones) {
        try {
          console.log('🔔 Setting up notifications...');
          
          const habitEvents: HabitEvent[] = aiPlan.milestones.flatMap(milestone => 
            milestone.daily_todos.map(todo => ({
              startDate: aiPlan.start_date,
              description: todo.description,
              time: todo.time_slot,
              repeat: todo.repeat_count,
              score: todo.score,
            }))
          );
      
          const notificationResult = await scheduleAllHabitRoutines(habitEvents);
          if (!notificationResult.success) {
            console.warn('⚠️ Notification setup failed:', notificationResult.error);
            Alert.alert('주의', '알림 설정에 실패했습니다. 나중에 다시 시도해주세요.');
          } else {
            console.log('✅ Notifications set up successfully');
          }
        } catch (notificationError) {
          console.error('💥 Error setting up notifications:', notificationError);
          Alert.alert('주의', '알림 설정에 실패했습니다. 나중에 다시 시도해주세요.');
        }
      }

      // 4. 완료 처리
      console.log('🎉 All steps completed successfully');
      Alert.alert('성공', '습관이 성공적으로 생성되었습니다!');
      onComplete();

    } catch (error) {
      console.error('💥 Error in final submission:', error);
      Alert.alert('오류', '습관 생성에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsSubmitting(false);
      console.log('🏁 Finished final submission');
    }
  };

  // Debug navigation handler - bypasses all backend calls
  const handleDebugComplete = () => {
    // Only call completion callback - no backend calls
    console.log('🐛 DEBUG: Bypassing AI routine generation, DB save, and notifications');
    onComplete();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.stepIndicator}>5 / 6 단계</Text>
      
      {/* Back Button */}
      <TouchableOpacity
        style={styles.backButton}
        onPress={onBack}
        disabled={isSubmitting}
      >
        <Text style={styles.backButtonText}>← 이전</Text>
      </TouchableOpacity>
      
      <View style={styles.titleContainer}>
        <Text style={styles.title}>
          모든 준비가{'\n'}완료되었습니다!
        </Text>
        <Text style={styles.subtitle}>
          AI가 당신의 습관을 분석하고{'\n'}맞춤형 루틴을 생성할 준비가 되었어요.
        </Text>
      </View>

      <TouchableOpacity
        style={[
          styles.submitButton,
          isSubmitting && styles.submitButtonDisabled
        ]}
        onPress={handleSubmit}
        disabled={isSubmitting}
      >
        <Text style={styles.submitButtonText}>
          {isSubmitting ? '생성 중...' : 'AI 루틴 생성하기'}
        </Text>
      </TouchableOpacity>
      
      {/* Floating Debug Button - does not interfere with layout */}
      <DebugNextButton
        to="Home Screen"
        onPress={handleDebugComplete}
        label="Debug: Skip AI Generation"
        disabled={isSubmitting}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1c1c2e',
    paddingHorizontal: 24,
    paddingTop: 100,
  },
  stepIndicator: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#a9a9c2',
    textAlign: 'center',
    marginBottom: 40,
    fontFamily: Platform.OS === 'ios' ? 'Inter' : 'Inter',
  },
  titleContainer: {
    marginBottom: 60,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    lineHeight: 40,
    marginBottom: 16,
    fontFamily: Platform.OS === 'ios' ? 'Inter' : 'Inter',
  },
  subtitle: {
    fontSize: 16,
    color: '#a9a9c2',
    textAlign: 'center',
    lineHeight: 24,
    fontFamily: Platform.OS === 'ios' ? 'Inter' : 'Inter',
  },
  submitButton: {
    backgroundColor: '#6c63ff',
    borderRadius: 28,
    paddingVertical: 19,
    alignItems: 'center',
    height: 56,
    justifyContent: 'center',
    position: 'absolute',
    bottom: 40,
    left: 24,
    right: 24,
  },
  submitButtonDisabled: {
    backgroundColor: '#4a47cc',
    opacity: 0.5,
  },
  submitButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    fontFamily: Platform.OS === 'ios' ? 'Inter' : 'Inter',
  },
  backButton: {
    position: 'absolute',
    top: 60,
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
    fontFamily: Platform.OS === 'ios' ? 'Inter' : 'Inter',
  },
}); 