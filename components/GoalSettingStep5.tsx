import { useState } from 'react';
import { Alert, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { submitHabitData } from '../backend/hwirang/habit';
import { createNewHabitAndPlan } from '../backend/supabase/habits';
import { useHabitStore } from '../lib/habitStore';
import { PlanForCreation } from '../types/habit'; // Import the new type
import DebugNextButton from './DebugNextButton';

// Temporary PersonaType definition to fix the type error locally
type PersonaType = 'Easy' | 'Medium' | 'Hard' | 'System';

interface GoalSettingStep5Props {
  onComplete: () => void;
  onBack?: () => void;
}

export default function GoalSettingStep5({
  onComplete,
  onBack,
}: GoalSettingStep5Props) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Use all the necessary states from the store
  const {
    habitName,
    difficultyReason,
    intensity,
    availableTime,
    goalPeriod,
    setPlan,
  } = useHabitStore();

  const handleSubmit = async () => {
    console.log('🔄 Starting final submission...', {
      habitName,
      availableTime,
      intensity,
      difficultyReason,
      goalPeriod,
    });
    setIsSubmitting(true);

    try {
      // Step 1: Convert UI-friendly intensity to PersonaType for the AI
      const personaMap: { [key: string]: PersonaType } = {
        '높음': 'Hard',
        '보통': 'Medium',
        '낮음': 'Easy',
      };
      const persona = personaMap[intensity] || 'Medium';

      // Step 2: Generate the plan from the AI using data from the store
      console.log('🤖 Generating AI plan...');
      const aiPlanFromAI = await submitHabitData(
        habitName,
        availableTime,
        difficultyReason,
        persona,
        goalPeriod
      );
      console.log('✅ AI plan generated:', aiPlanFromAI);

      // Step 3: Combine AI-generated plan with user-selected data to form the complete PlanForCreation.
      const planForCreation: PlanForCreation = {
        ...aiPlanFromAI,
        difficulty_reason: difficultyReason,
        intensity: intensity,
        available_time: availableTime,
      };

      // Step 3: Save the entire new habit and plan structure to the database
      console.log('💾 Saving new habit and plan to Supabase...');
      const finalPlan = await createNewHabitAndPlan(habitName, planForCreation);
      console.log('✅ Successfully saved to Supabase:', finalPlan);

      // Step 4: Set the final, DB-synced plan in the global store
      setPlan(finalPlan);

      // (Optional) Step 5: Schedule notifications based on the finalPlan
      // The notification logic would need to be updated to use the new Plan structure.

      // Step 6: Complete the flow
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

  const handleDebugComplete = () => {
    console.log('🐛 DEBUG: Bypassing AI generation and DB save');
    onComplete();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.stepIndicator}>5 / 6 단계</Text>
      
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