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
import VoiceGoalSetting from './VoiceGoalSetting';

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
  const [habitText, setHabitText] = useState(initialValue);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showModeSelection, setShowModeSelection] = useState(true);
  const [selectedMode, setSelectedMode] = useState<'text' | 'voice' | null>(null);
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

  // Handle voice goal setting completion
  const handleVoiceGoalComplete = (goalData: any) => {
    console.log('Voice goal setting completed:', goalData);
    if (goalData.habitName && onNext) {
      onNext(goalData.habitName);
    }
  };

  // Mode selection screen
  if (showModeSelection) {
    return (
      <View style={styles.container}>
        <Text style={styles.stepIndicator}>1 / 6 단계</Text>
        
        {/* Back Button */}
        <TouchableOpacity
          style={styles.backButton}
          onPress={onBack}
        >
          <Text style={styles.backButtonText}>← 이전</Text>
        </TouchableOpacity>
        
        <View style={styles.titleContainer}>
          <Text style={styles.title}>
            목표 설정 방법을{'\n'}선택해주세요
          </Text>
          <Text style={styles.subtitle}>
            텍스트로 입력하거나 AI와 음성 대화로 설정할 수 있어요
          </Text>
        </View>

        <View style={styles.modeContainer}>
          <TouchableOpacity
            style={styles.modeOption}
            onPress={() => {
              setSelectedMode('text');
              setShowModeSelection(false);
            }}
          >
            <Text style={styles.modeIcon}>✏️</Text>
            <Text style={styles.modeTitle}>텍스트 입력</Text>
            <Text style={styles.modeDescription}>
              키보드로 직접 목표를 입력해주세요
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.modeOption}
            onPress={() => {
              setSelectedMode('voice');
              setShowModeSelection(false);
            }}
          >
            <Text style={styles.modeIcon}>🎤</Text>
            <Text style={styles.modeTitle}>음성 대화</Text>
            <Text style={styles.modeDescription}>
              AI와 대화하며 자연스럽게 목표를 설정해보세요
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Voice mode
  if (selectedMode === 'voice') {
    return (
      <VoiceGoalSetting
        onComplete={handleVoiceGoalComplete}
        onBack={() => setShowModeSelection(true)}
      />
    );
  }

  // Text mode (original interface)
  return (
    <View style={styles.container}>
      <Text style={styles.stepIndicator}>1 / 6 단계</Text>
      
      {/* Back Button */}
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => setShowModeSelection(true)}
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
          placeholderTextColor="#a9a9c2"
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
      
      {/* Mode switch button */}
      <TouchableOpacity
        style={styles.switchModeButton}
        onPress={() => setSelectedMode('voice')}
      >
        <Text style={styles.switchModeText}>🎤 음성 모드로 전환</Text>
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
    fontFamily: Platform.OS === 'ios' ? 'Inter' : 'Inter',
  },
  inputContainer: {
    marginBottom: 160,
  },
  habitInput: {
    backgroundColor: '#3a3a50',
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 20,
    fontSize: 16,
    color: '#ffffff',
    height: 100,
    textAlignVertical: 'top',
    fontFamily: Platform.OS === 'ios' ? 'Inter' : 'Inter',
  },
  nextButton: {
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
  nextButtonDisabled: {
    backgroundColor: '#4a47cc',
    opacity: 0.5,
  },
  nextButtonText: {
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
  subtitle: {
    fontSize: 16,
    color: '#a9a9c2',
    textAlign: 'center',
    marginTop: 16,
    lineHeight: 24,
    fontFamily: Platform.OS === 'ios' ? 'Inter' : 'Inter',
  },
  modeContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    gap: 20,
  },
  modeOption: {
    backgroundColor: '#3a3a50',
    borderRadius: 20,
    padding: 24,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  modeIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  modeTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
    fontFamily: Platform.OS === 'ios' ? 'Inter' : 'Inter',
  },
  modeDescription: {
    fontSize: 14,
    color: '#a9a9c2',
    textAlign: 'center',
    lineHeight: 20,
    fontFamily: Platform.OS === 'ios' ? 'Inter' : 'Inter',
  },
  switchModeButton: {
    position: 'absolute',
    bottom: 100,
    left: 24,
    right: 24,
    backgroundColor: '#3a3a50',
    borderRadius: 16,
    paddingVertical: 12,
    alignItems: 'center',
  },
  switchModeText: {
    fontSize: 14,
    color: '#6c63ff',
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'Inter' : 'Inter',
  },
}); 