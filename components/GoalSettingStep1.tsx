import { useState } from 'react';
import {
    Alert,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { useHabitStore } from '../lib/habitStore';
import DebugNextButton from './DebugNextButton';
import VoiceChatScreen from './VoiceChatScreen';
import { submitHabitData } from '../backend/hwirang/habit';

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
  const [, setSelectedMode] = useState<'text' | 'voice' | null>(null);
  const [voiceChatVisible, setVoiceChatVisible] = useState(false);
  const {
    setHabitName,
    setGoalPeriod,
    setAvailableTime,
    setDifficultyReason,
    setIntensity,
  } = useHabitStore();

  // 음성 대화에서 목표 정보를 추출하는 함수
  const extractGoalFromTranscript = async (transcript: string) => {
    try {
      // 간단한 키워드 기반 추출 (실제로는 AI를 사용해야 함)
      const habitName = extractHabitName(transcript);
      const goalPeriod = extractGoalPeriod(transcript);
      const availableTime = extractAvailableTime(transcript);
      const difficultyReason = extractDifficultyReason(transcript);
      const intensity = extractIntensity(transcript);

      return {
        habitName,
        goalPeriod,
        availableTime,
        difficultyReason,
        intensity
      };
    } catch (error) {
      console.error('Failed to extract goal from transcript:', error);
      throw new Error('대화 내용에서 목표 정보를 추출할 수 없습니다.');
    }
  };

  // 키워드 기반 추출 함수들
  const extractHabitName = (transcript: string): string => {
    const habitKeywords = ['습관', '목표', '하고 싶어', '배우고 싶어', '개발하고 싶어', '읽고 싶어', '운동하고 싶어'];
    for (const keyword of habitKeywords) {
      if (transcript.includes(keyword)) {
        // 키워드 주변의 문장을 추출
        const index = transcript.indexOf(keyword);
        const start = Math.max(0, index - 50);
        const end = Math.min(transcript.length, index + 50);
        return transcript.substring(start, end).trim();
      }
    }
    return '음성 설정 목표';
  };

  const extractGoalPeriod = (transcript: string): string => {
    const periodPatterns = [
      { pattern: /(\d+)개월/, default: '3개월' },
      { pattern: /(\d+)주/, default: '4주' },
      { pattern: /(\d+)년/, default: '1년' }
    ];
    
    for (const { pattern, default: defaultValue } of periodPatterns) {
      if (pattern.test(transcript)) {
        return transcript.match(pattern)?.[0] || defaultValue;
      }
    }
    return '3개월';
  };

  const extractAvailableTime = (transcript: string): string => {
    const timePatterns = [
      { pattern: /(\d{1,2}):(\d{2})/, default: '09:00-10:00' },
      { pattern: /아침/, default: '08:00-09:00' },
      { pattern: /저녁/, default: '20:00-21:00' },
      { pattern: /밤/, default: '21:00-22:00' }
    ];
    
    for (const { pattern, default: defaultValue } of timePatterns) {
      if (pattern.test(transcript)) {
        if (pattern.source.includes('\\d')) {
          const match = transcript.match(pattern);
          if (match) {
            const hour = parseInt(match[1]);
            return `${hour.toString().padStart(2, '0')}:00-${(hour + 1).toString().padStart(2, '0')}:00`;
          }
        }
        return defaultValue;
      }
    }
    return '09:00-10:00';
  };

  const extractDifficultyReason = (transcript: string): string => {
    const difficultyKeywords = ['어려워', '힘들어', '잊어버려', '동기 부족', '시간 부족', '귀찮아'];
    for (const keyword of difficultyKeywords) {
      if (transcript.includes(keyword)) {
        return keyword;
      }
    }
    return '동기 부족';
  };

  const extractIntensity = (transcript: string): string => {
    if (transcript.includes('강하게') || transcript.includes('적극적으로')) return '높음';
    if (transcript.includes('가볍게') || transcript.includes('부드럽게')) return '낮음';
    return '보통';
  };

  // 음성 모드에서 텍스트 모드로 전환할 때 호출되는 함수
  const handleVoiceToTextTransition = () => {
    const store = useHabitStore.getState();
    
    // 수집된 정보가 있다면 다음 단계로 진행
    if (store.habitName && store.goalPeriod && store.availableTime && 
        store.difficultyReason && store.intensity) {
      console.log('🎯 음성 모드에서 수집된 정보로 다음 단계 진행');
      
      // 수집된 정보를 화면에 표시
      Alert.alert(
        '음성 입력 완료', 
        `수집된 정보:\n• 목표: ${store.habitName}\n• 기간: ${store.goalPeriod}\n• 시간: ${store.availableTime}\n• 어려움: ${store.difficultyReason}\n• 강도: ${store.intensity}\n\n이 정보로 다음 단계를 진행하시겠습니까?`,
        [
          { text: '수정하기', style: 'cancel' },
          { 
            text: '다음 단계', 
            onPress: () => {
              if (onNext) {
                onNext(store.habitName);
              }
            }
          }
        ]
      );
    } else {
      console.log('📝 음성 모드에서 텍스트 모드로 전환 - 정보 수집 필요');
      Alert.alert('정보 부족', '음성 모드에서 충분한 정보를 수집하지 못했습니다. 텍스트 모드에서 직접 입력해주세요.');
    }
  };

  const handleVoiceGoalSettingComplete = async (data: any) => {
    try {
      console.log('🎯 Voice goal setting completed, processing data...', data);
      setIsSubmitting(true);

      // 음성으로 설정된 목표 정보를 추출하여 상태에 저장
      const extractedData = data;
      
      if (extractedData.habitName) setHabitName(extractedData.habitName);
      if (extractedData.goalPeriod) setGoalPeriod(extractedData.goalPeriod);
      if (extractedData.availableTime) setAvailableTime(extractedData.availableTime);
      if (extractedData.difficultyReason) setDifficultyReason(extractedData.difficultyReason);
      if (extractedData.intensity) setIntensity(extractedData.intensity);

      // action 필드 확인하여 처리
      if (extractedData.action === 'GOAL_SETTING_COMPLETE') {
        // 음성 채팅 완료 시 GoalSettingStep5로 직접 이동
        console.log('✅ Voice goal setting data processed, proceeding to GoalSettingStep5');
        
        Alert.alert('목표 설정 완료', '음성으로 설정된 목표 정보가 저장되었습니다. 최종 확인 단계로 이동합니다.');
        
        // GoalSettingStep5로 직접 이동 (onNext 대신)
        // 여기서는 단계별 이동이 아니라 최종 단계로 점프
        if (onNext) {
          // GoalSettingStep5로 이동하기 위해 특별한 신호 전달
          onNext('VOICE_COMPLETE_JUMP_TO_STEP5');
        }
      } else {
        // 일반적인 다음 단계 진행
        console.log('✅ Voice goal setting data processed, proceeding to next step');
        
        Alert.alert('목표 설정 완료', '음성으로 설정된 목표 정보가 저장되었습니다. 다음 단계를 진행해주세요.');
        
        if (onNext) {
          onNext(extractedData.habitName || '음성 설정 목표');
        }
      }

    } catch (error) {
      console.error('Failed to process voice input:', error);
      Alert.alert('오류', '대화 내용을 처리하는 데 실패했습니다. 텍스트 모드로 다시 시도해주세요.');
      setSelectedMode('text'); // Fallback to text mode
    } finally {
      setIsSubmitting(false);
    }
  };

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
            {`목표 설정 방법을\n선택해주세요`}
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
              useHabitStore.getState().clearConversationHistory();
              setVoiceChatVisible(true); // Immediately open the voice chat
            }}
          >
            <Text style={styles.modeIcon}>🎤</Text>
            <Text style={styles.modeTitle}>음성 대화</Text>
            <Text style={styles.modeDescription}>
              AI와 대화하며 자연스럽게 목표를 설정해보세요
            </Text>
          </TouchableOpacity>
        </View>
        <VoiceChatScreen
          visible={voiceChatVisible}
          mode="goalSetting"
          onClose={() => setVoiceChatVisible(false)}
          onComplete={handleVoiceGoalSettingComplete}
          onSwitchToText={() => {
            setVoiceChatVisible(false);
            setShowModeSelection(false);
            // 음성 모드에서 수집된 정보가 있다면 다음 단계로 진행
            if (useHabitStore.getState().habitName || 
                useHabitStore.getState().goalPeriod || 
                useHabitStore.getState().availableTime || 
                useHabitStore.getState().difficultyReason || 
                useHabitStore.getState().intensity) {
              handleVoiceToTextTransition();
            }
          }}
        />
      </View>
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
          {`당신과 제가 함께\n이뤄나갈 목표는 무엇인가요?`}
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
        onPress={() => {
          useHabitStore.getState().clearConversationHistory();
          setVoiceChatVisible(true);
        }}
      >
        <Text style={styles.switchModeText}>🎤 음성 모드로 전환</Text>
      </TouchableOpacity>
      
      <VoiceChatScreen
        visible={voiceChatVisible}
        mode="goalSetting"
        onClose={() => setVoiceChatVisible(false)}
        onComplete={handleVoiceGoalSettingComplete}
        onSwitchToText={() => {
          setVoiceChatVisible(false);
          setShowModeSelection(false);
          // 음성 모드에서 수집된 정보가 있다면 다음 단계로 진행
          if (useHabitStore.getState().habitName || 
              useHabitStore.getState().goalPeriod || 
              useHabitStore.getState().availableTime || 
              useHabitStore.getState().difficultyReason || 
              useHabitStore.getState().intensity) {
            handleVoiceToTextTransition();
          }
        }}
      />
      
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
  floatingVoiceButton: {
    position: 'absolute',
    bottom: 40,
    right: 24,
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#6c63ff',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  voiceButtonIcon: {
    fontSize: 24,
    color: '#ffffff',
  },
}); 