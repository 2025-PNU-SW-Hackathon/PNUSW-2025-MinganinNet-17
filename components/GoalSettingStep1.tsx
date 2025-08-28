import { useState, useEffect } from 'react';
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
import VoiceChatScreen from './VoiceChatScreen';
import { submitHabitData } from '../backend/hwirang/habit';
import { Colors } from '../constants/Colors';
import { Spacing } from '../constants/Spacing';
import { useColorScheme } from '../hooks/useColorScheme';
import { koreanTextStyle } from '../utils/koreanUtils';

const { width } = Dimensions.get('window');

interface GoalSettingStep1Props {
  onNext?: (habitGoal: string) => void;
  onBack?: () => void;
  initialValue?: string;
  collectedGoalInfo?: any; // 음성으로 수집된 목표 정보
  onUpdateCollectedGoalInfo?: (goalInfo: any) => void; // 수집된 목표 정보 업데이트
}

export default function GoalSettingStep1({
  onNext,
  onBack,
  initialValue = '',
  collectedGoalInfo,
  onUpdateCollectedGoalInfo
}: GoalSettingStep1Props) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const styles = createStyles(colors);
  const [habitText, setHabitText] = useState(initialValue || collectedGoalInfo?.goal || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showWelcome, setShowWelcome] = useState(true);
  const [isLoadingRouty, setIsLoadingRouty] = useState(true);
  const [voiceChatVisible, setVoiceChatVisible] = useState(false);
  const {
    setHabitName,
    setGoalPeriod,
    setAvailableTime,
    setDifficultyReason,
    setIntensity,
  } = useHabitStore();

  // collectedGoalInfo가 변경될 때 habitText 업데이트
  useEffect(() => {
    if (collectedGoalInfo?.goal && !habitText) {
      setHabitText(collectedGoalInfo.goal);
    }
  }, [collectedGoalInfo, habitText]);

  // Auto-transition from welcome screen to voice chat
  useEffect(() => {
    if (showWelcome) {
      // Clear any existing conversation history
      useHabitStore.getState().clearConversationHistory();
      
      // Auto-transition after 2.5 seconds
      const timer = setTimeout(() => {
        setShowWelcome(false);
        setVoiceChatVisible(true);
        setIsLoadingRouty(false);
      }, 2500);
      
      return () => clearTimeout(timer);
    }
  }, [showWelcome]);

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

      // VoiceChatScreen에서 받은 데이터 처리
      if (data.collectedGoalInfo) {
        console.log('🎯 Received collectedGoalInfo:', data.collectedGoalInfo);
        
        // 수집된 목표 정보를 MainApp으로 전달
        if (onUpdateCollectedGoalInfo) {
          onUpdateCollectedGoalInfo(data.collectedGoalInfo);
        }
        
        // 목표 설정이 완료되었으면 GoalSettingStep5로 이동
        if (data.goalSettingComplete) {
          console.log('✅ Voice goal setting completed, moving to GoalSettingStep5');
          
          Alert.alert('목표 설정 완료', '음성으로 설정된 목표 정보가 저장되었습니다. 최종 확인 단계로 이동합니다.');
          
          if (onNext) {
            onNext('VOICE_COMPLETE_JUMP_TO_STEP5');
          }
        } else if (data.nextScreen) {
          // 다음 단계로 이동
          console.log('✅ Moving to next step:', data.nextScreen);
          
          // 여기서는 단계별 이동이므로 collectedGoalInfo만 업데이트
          // 실제 화면 이동은 MainApp에서 처리
        }
      } else if (data.goalSettingComplete) {
        // collectedGoalInfo가 없어도 goalSettingComplete가 true면 완료로 처리
        console.log('✅ Voice goal setting completed (no collectedGoalInfo), moving to GoalSettingStep5');
        
        Alert.alert('목표 설정 완료', '음성으로 설정된 목표 정보가 저장되었습니다. 최종 확인 단계로 이동합니다.');
        
        if (onNext) {
          onNext('VOICE_COMPLETE_JUMP_TO_STEP5');
        }
      } else {
        // 기존 로직 (하위 호환성)
        const extractedData = data;
        
        if (extractedData.habitName) setHabitName(extractedData.habitName);
        if (extractedData.goalPeriod) setGoalPeriod(extractedData.goalPeriod);
        if (extractedData.availableTime) setAvailableTime(extractedData.availableTime);
        if (extractedData.difficultyReason) setDifficultyReason(extractedData.difficultyReason);
        if (extractedData.intensity) setIntensity(extractedData.intensity);

        // action 필드 확인하여 처리
        if (extractedData.action === 'GOAL_SETTING_COMPLETE') {
          console.log('✅ Voice goal setting data processed, proceeding to GoalSettingStep5');
          
          Alert.alert('목표 설정 완료', '음성으로 설정된 목표 정보가 저장되었습니다. 최종 확인 단계로 이동합니다.');
          
          if (onNext) {
            onNext('VOICE_COMPLETE_JUMP_TO_STEP5');
          }
        } else {
          console.log('✅ Voice goal setting data processed, proceeding to next step');
          
          Alert.alert('목표 설정 완료', '음성으로 설정된 목표 정보가 저장되었습니다. 다음 단계를 진행해주세요.');
          
          if (onNext) {
            onNext(extractedData.habitName || '음성 설정 목표');
          }
        }
      }

    } catch (error) {
      console.error('Failed to process voice input:', error);
      Alert.alert('오류', '대화 내용을 처리하는 데 실패했습니다. 텍스트 모드로 다시 시도해주세요.');
      // Fallback - close voice chat and show text mode
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

  // Welcome loading screen
  if (showWelcome) {
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
        
        <View style={styles.welcomeContainer}>
          <Text style={[styles.welcomeMessage, koreanTextStyle('새로운 여정을 시작해봅시다!')]}>
            새로운 여정을 시작해봅시다!
          </Text>
          <Text style={[styles.loadingMessage, koreanTextStyle('코치 Routy를 불러오고 있습니다...')]}>
            코치 Routy를 불러오고 있습니다...
          </Text>
          
          {/* Loading dots animation */}
          <View style={styles.loadingDots}>
            <View style={[styles.dot, styles.dot1]} />
            <View style={[styles.dot, styles.dot2]} />
            <View style={[styles.dot, styles.dot3]} />
          </View>
        </View>
        <VoiceChatScreen
          visible={voiceChatVisible}
          mode="goalSetting"
          enableStepProgression={true}
          onClose={() => setVoiceChatVisible(false)}
          onComplete={handleVoiceGoalSettingComplete}
          isNewGoal={true} // 새로운 목표 추가 모드
          onSwitchToText={() => {
            setVoiceChatVisible(false);
            setShowWelcome(false);
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
      
      <VoiceChatScreen
        visible={voiceChatVisible}
        mode="goalSetting"
        enableStepProgression={true}
        onClose={() => setVoiceChatVisible(false)}
        onComplete={handleVoiceGoalSettingComplete}
        isNewGoal={true} // 새로운 목표 추가 모드
        onSwitchToText={() => {
          setVoiceChatVisible(false);
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
  subtitle: {
    fontSize: colors.typography.fontSize.lg,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.lg,
    lineHeight: colors.typography.fontSize.lg * colors.typography.lineHeight.relaxed,
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
  // Welcome screen styles
  welcomeContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.screen.paddingHorizontal,
  },
  welcomeMessage: {
    fontSize: 32,
    fontWeight: colors.typography.fontWeight.bold,
    color: colors.primary,
    textAlign: 'center',
    marginBottom: Spacing.xl,
    fontFamily: 'sans-serif',
  },
  loadingMessage: {
    fontSize: 18,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.lg,
    fontFamily: 'sans-serif',
  },
  // Loading dots styles (similar to SplashScreen)
  loadingDots: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.md,
  },
  dot: {
    width: Spacing.md,
    height: Spacing.md,
    borderRadius: Spacing.sm,
    backgroundColor: colors.primary,
    marginHorizontal: Spacing.sm,
  },
  dot1: {
    opacity: 0.3,
  },
  dot2: {
    opacity: 0.6,
  },
  dot3: {
    opacity: 1,
  },
}); 