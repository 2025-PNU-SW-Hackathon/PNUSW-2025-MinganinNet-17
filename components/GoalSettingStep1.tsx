import { useState } from 'react';
import {
    Alert,
    Dimensions,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { useHabitStore } from '../lib/habitStore';
import DebugNextButton from './DebugNextButton';
import { Colors } from '../constants/Colors';
import { Spacing } from '../constants/Spacing';
import { useColorScheme } from '../hooks/useColorScheme';

const { width } = Dimensions.get('window');

interface GoalSettingStep1Props {
  onNext?: (habitGoal: string) => void;
  onBack?: () => void;
  initialValue?: string;
}

export default function GoalSettingStep1({ 
  onNext, 
  onBack, 
  initialValue = '' 
}: GoalSettingStep1Props) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const styles = createStyles(colors);
  const [habitText, setHabitText] = useState(initialValue);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { setHabitName } = useHabitStore();

  const handleHabitSubmit = async () => {
    if (!habitText.trim()) {
      Alert.alert('오류', '습관 목표를 입력해주세요.');
      return;
    }

    console.log('🔄 Starting habit submission step 1...', { habitText });
    setIsSubmitting(true);

    try {
      // Zustand store에만 저장하고 데이터베이스 호출은 제거합니다.
      // console.log('🏪 Saving to local store...');
      setHabitName(habitText);
      // console.log('✅ Successfully saved to local store');

      // console.log('🚀 Calling onNext handler...');
      if (onNext) {
        onNext(habitText);
        // console.log('✅ onNext called successfully');
      } else {
        // console.warn('⚠️ onNext is undefined!');
      }
    } catch (error) {
      console.error('💥 Unexpected error in handleHabitSubmit:', error);
      Alert.alert(
        '오류',
        `예상치 못한 오류가 발생했습니다: ${
          error instanceof Error ? error.message : '알 수 없는 오류'
        }`
      );
    } finally {
      setIsSubmitting(false);
      console.log('🏁 Finished habit submission step 1');
    }
  };

  // Debug navigation handler - bypasses backend calls with fallback data
  const handleDebugNext = () => {
    try {
      console.log('🐛 DEBUG: GoalStep1 - current habitText:', habitText);
      
      // Provide fallback data for debug mode if no input
      const debugHabitText = habitText.trim() || 'Debug Habit: 물 8잔 마시기';
      console.log('🐛 DEBUG: GoalStep1 - using habit text:', debugHabitText);
      
      // Only call local store and navigation - no backend calls
      setHabitName(debugHabitText);
      
      console.log('🐛 DEBUG: GoalStep1 - onNext callback exists:', !!onNext);
      if (onNext) {
        onNext(debugHabitText);
        console.log('🐛 DEBUG: GoalStep1 - navigation callback called successfully');
      } else {
        console.error('🐛 DEBUG: GoalStep1 - ERROR: onNext callback is missing!');
      }
    } catch (error) {
      console.error('🐛 DEBUG: GoalStep1 - Error in debug handler:', error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.stepIndicator}>1 / 6 단계</Text>
      
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
          당신과 제가 함께{'\n'}이뤄나갈 목표는 무엇인가요?
        </Text>
      </View>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.habitInput}
          value={habitText}
          onChangeText={setHabitText}
          placeholder="예) 책 10권 읽기"
          placeholderTextColor={colors.textSecondary}
          multiline
          textAlignVertical="top"
          autoFocus
        />
      </View>

      <TouchableOpacity
        style={[
          styles.nextButton, 
          (!habitText.trim() || isSubmitting) && styles.nextButtonDisabled
        ]}
        onPress={handleHabitSubmit}
        disabled={!habitText.trim() || isSubmitting}
      >
        <Text style={styles.nextButtonText}>
          {isSubmitting ? '저장 중...' : '저장하고 다음으로'}
        </Text>
      </TouchableOpacity>
      
      {/* Floating Debug Button - does not interfere with layout */}
      <DebugNextButton
        to="Goal Step 2"
        onPress={handleDebugNext}
        label="Debug: Skip DB Save"
        disabled={isSubmitting}
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
    marginBottom: Spacing['6xl'] + Spacing.md, // ~60px
  },
  title: {
    fontSize: colors.typography.fontSize['3xl'],
    fontWeight: colors.typography.fontWeight.bold,
    color: colors.text,
    textAlign: 'center',
    lineHeight: colors.typography.fontSize['3xl'] * colors.typography.lineHeight.snug,
    fontFamily: 'Inter',
  },
  inputContainer: {
    marginBottom: Spacing['7xl'] * 2 + Spacing['4xl'], // ~160px
  },
  habitInput: {
    backgroundColor: colors.inputBackground,
    borderRadius: Spacing.layout.borderRadius.lg,
    borderWidth: 2,
    borderColor: colors.inputBorder,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.xl,
    fontSize: colors.typography.fontSize.base,
    color: colors.text,
    height: 100,
    textAlignVertical: 'top',
    fontFamily: 'Inter',
    lineHeight: colors.typography.fontSize.base * colors.typography.lineHeight.normal,
    // Focus states will be handled via state management
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