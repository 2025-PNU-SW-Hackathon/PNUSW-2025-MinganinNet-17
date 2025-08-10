import { useState } from 'react';
import { Alert, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useHabitStore } from '../lib/habitStore';
import DebugNextButton from './DebugNextButton';
import { Colors } from '../constants/Colors';
import { Spacing } from '../constants/Spacing';
import { useColorScheme } from '../hooks/useColorScheme';

interface GoalSettingStep4Props {
  onNext?: (intensity: string) => void;
  onBack?: () => void;
  initialValue?: string;
}

export default function GoalSettingStep4({
  onNext,
  onBack,
  initialValue = ''
}: GoalSettingStep4Props) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const styles = createStyles(colors);
  const [selectedIntensity, setSelectedIntensity] = useState(initialValue);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { setIntensity } = useHabitStore();

  const intensityOptions = [
    { id: '높음', label: '높음 - 강하게 동기부여하고 꾸준히 체크해주세요' },
    { id: '보통', label: '보통 - 적절한 수준으로 관리해주세요' },
    { id: '낮음', label: '낮음 - 부담없이 가볍게 도와주세요' },
  ];

  // Handle intensity selection (just selection, not navigation)
  const handleIntensitySelect = (intensity: string) => {
    console.log('🎯 GoalSettingStep4 Intensity selected:', intensity);
    setSelectedIntensity(intensity);
  };

  // Handle Next button (with backend save)
  const handleNext = async () => {
    if (!selectedIntensity) {
      Alert.alert('선택 필요', '코칭 강도를 선택해주세요.');
      return;
    }

    console.log('🔄 Starting GoalSettingStep4 submission...', {
      selectedIntensity,
    });
    setIsSubmitting(true);

    try {
      // Zustand store에만 저장하고 데이터베이스 호출은 제거합니다.
      // console.log('🏪 Saving to local store...');
      setIntensity(selectedIntensity);
      // console.log('✅ Successfully saved to local store');

      // 다음 단계로
      // console.log('🚀 Calling onNext handler...');
      if (onNext) {
        onNext(selectedIntensity);
        // console.log('✅ onNext called successfully');
      } else {
        // console.warn('⚠️ onNext is undefined!');
      }
    } catch (error) {
      console.error('💥 Unexpected error in handleNext:', error);
      Alert.alert(
        '오류',
        `예상치 못한 오류가 발생했습니다: ${
          error instanceof Error ? error.message : '알 수 없는 오류'
        }`
      );
    } finally {
      setIsSubmitting(false);
      console.log('🏁 Finished GoalSettingStep4 submission');
    }
  };

  // Debug navigation handler - bypasses backend calls with fallback data
  const handleDebugNext = () => {
    try {
      console.log('🐛 DEBUG: GoalStep4 - Skip DB button clicked');
      console.log('🐛 DEBUG: GoalStep4 - selectedIntensity:', selectedIntensity);
      console.log('🐛 DEBUG: GoalStep4 - onNext function exists:', !!onNext);
      
      // For debug mode, auto-select default intensity if none selected
      const intensityToUse = selectedIntensity || '보통';
      console.log('🐛 DEBUG: GoalStep4 - using intensity:', intensityToUse);
      
      // Only call local store and navigation - no backend calls
      setIntensity(intensityToUse);
      
      if (!onNext) {
        console.error('🐛 DEBUG: GoalStep4 - ERROR: onNext callback is missing!');
        return;
      }
      
      onNext(intensityToUse);
      console.log('🐛 DEBUG: GoalStep4 - navigation callback called successfully');
    } catch (error) {
      console.error('🐛 DEBUG: GoalStep4 - Error in debug handler:', error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.stepIndicator}>4 / 6 단계</Text>
      
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
          코칭 강도를{'\n'}선택해주세요
        </Text>
        <Text style={styles.subtitle}>
          Routy가 당신을 어떻게 도와드릴지 알려주세요.
        </Text>
      </View>

      <View style={styles.optionsContainer}>
        {intensityOptions.map((option) => (
          <TouchableOpacity
            key={option.id}
            style={[
              styles.optionButton,
              selectedIntensity === option.id && styles.optionButtonSelected,
            ]}
            onPress={() => handleIntensitySelect(option.id)}
            disabled={isSubmitting}
          >
            <Text
              style={[
                styles.optionButtonText,
                selectedIntensity === option.id && styles.optionButtonTextSelected,
              ]}
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Standard Next Button - now properly visible */}
      <TouchableOpacity
        style={[
          styles.nextButton,
          (!selectedIntensity || isSubmitting) && styles.nextButtonDisabled
        ]}
        onPress={handleNext}
        disabled={!selectedIntensity || isSubmitting}
      >
        <Text style={styles.nextButtonText}>
          {isSubmitting ? '저장 중...' : '다음'}
        </Text>
      </TouchableOpacity>
      
      {/* Floating Debug Button - does not interfere with layout */}
      <DebugNextButton
        to="Goal Step 5"
        onPress={handleDebugNext}
        label="Debug: Skip DB Save"
        disabled={isSubmitting} // Removed dependency on selectedIntensity
      />
    </View>
  );
}

const createStyles = (colors: typeof Colors.light) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: Spacing.screen.paddingHorizontal,
    paddingTop: Spacing['7xl'] + Spacing['4xl'], // 100px
  },
  stepIndicator: {
    fontSize: colors.typography.fontSize.base,
    fontWeight: colors.typography.fontWeight.bold,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing['5xl'],
    fontFamily: 'Inter',
  },
  titleContainer: {
    marginBottom: 60,
  },
  title: {
    fontSize: colors.typography.fontSize['3xl'],
    fontWeight: colors.typography.fontWeight.bold,
    color: colors.text,
    textAlign: 'center',
    lineHeight: colors.typography.fontSize['3xl'] * colors.typography.lineHeight.snug,
    marginBottom: Spacing.xl,
    fontFamily: 'Inter',
  },
  subtitle: {
    fontSize: colors.typography.fontSize.base,
    color: colors.textSecondary,
    textAlign: 'center',
    fontFamily: 'Inter',
  },
  optionsContainer: {
    marginBottom: 160, // Increased to make room for next button
  },
  optionButton: {
    backgroundColor: colors.card,
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 20,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  optionButtonSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.card,
  },
  optionButtonText: {
    fontSize: 16,
    color: colors.text,
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'Inter' : 'Inter',
  },
  optionButtonTextSelected: {
    color: colors.text,
    fontWeight: '600',
  },
  nextButton: {
    backgroundColor: colors.primary,
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
  nextButtonDisabled: {
    backgroundColor: colors.buttonDisabled,
    opacity: 0.5,
  },
  nextButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
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
    color: colors.textSecondary,
    fontFamily: Platform.OS === 'ios' ? 'Inter' : 'Inter',
  },
}); 