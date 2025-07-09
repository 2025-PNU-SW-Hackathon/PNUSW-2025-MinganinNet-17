import { useState } from 'react';
import { Alert, Dimensions, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { HabitData, saveHabitToSupabase } from '../backend/supabase/habits';
import { useHabitStore } from '../lib/habitStore';

const { width } = Dimensions.get('window');

interface GoalSettingStep4Props {
  onContinue: (intensity: string) => void;
  onBack: () => void;
}

export default function GoalSettingStep4({ onContinue, onBack }: GoalSettingStep4Props) {
  const [selectedIntensity, setSelectedIntensity] = useState<string>('보통');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { habit, time, setIntensity } = useHabitStore();

  const intensityOptions = [
    { id: '낮음', label: '낮음' },
    { id: '보통', label: '보통' },
    { id: '높음', label: '높음' }
  ];

  const handleIntensitySelect = async (intensity: string) => {
    setSelectedIntensity(intensity);
    console.log('🔄 Starting GoalSettingStep4 submission...', { intensity });
    setIsSubmitting(true);

    try {
      // 기존 데이터를 업데이트
      const habitData: HabitData = {
        habit_name: habit,
        time_slot: time,
        intensity: intensity,
        difficulty: '',  // 아직 설정되지 않음
        ai_routine: ''   // 아직 생성되지 않음
      };

      console.log('💾 Attempting to save to Supabase...', habitData);
      
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
        }
      }
      
      // Zustand store에 저장 (항상 실행)
      console.log('🏪 Saving to local store...');
      setIntensity(intensity);
      console.log('✅ Successfully saved to local store');

      // 다음 단계로
      console.log('🚀 Calling onContinue handler...');
      setTimeout(() => {
        onContinue(intensity);
        console.log('✅ onContinue called successfully');
      }, 300);
      
    } catch (error) {
      console.error('💥 Unexpected error in handleIntensitySelect:', error);
      Alert.alert('오류', `예상치 못한 오류가 발생했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    } finally {
      setIsSubmitting(false);
      console.log('🏁 Finished GoalSettingStep4 submission');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.stepIndicator}>4 / 5 단계</Text>
        
        {/* Back Button */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={onBack}
          disabled={isSubmitting}
        >
          <Text style={styles.backButtonText}>← 이전</Text>
        </TouchableOpacity>
        
        <Text style={styles.title}>코칭 강도를 선택해주세요</Text>
        <Text style={styles.subtitle}>Routy가 당신을 어떻게 도와드릴지 알려주세요.</Text>
        
        <View style={styles.optionsContainer}>
          {intensityOptions.map((option) => (
            <TouchableOpacity
              key={option.id}
              style={[
                styles.optionCard,
                selectedIntensity === option.id && styles.selectedCard,
                isSubmitting && styles.optionCardDisabled
              ]}
              onPress={() => handleIntensitySelect(option.id)}
              disabled={isSubmitting}
            >
              <Text style={styles.optionText}>
                {isSubmitting && selectedIntensity === option.id ? '저장 중...' : option.label}
              </Text>
            </TouchableOpacity>
          ))}
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
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
  },
  stepIndicator: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#a9a9c2',
    textAlign: 'center',
    marginBottom: 40,
    fontFamily: 'Inter',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 16,
    fontFamily: 'Inter',
  },
  subtitle: {
    fontSize: 16,
    color: '#a9a9c2',
    textAlign: 'center',
    marginBottom: 60,
    fontFamily: 'Inter',
  },
  optionsContainer: {
    gap: 20,
  },
  optionCard: {
    backgroundColor: '#3a3a50',
    borderRadius: 16,
    height: 110,
    justifyContent: 'center',
    paddingHorizontal: 20,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedCard: {
    borderColor: '#6c63ff',
  },
  optionText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    fontFamily: 'Inter',
  },
  optionCardDisabled: {
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
}); 