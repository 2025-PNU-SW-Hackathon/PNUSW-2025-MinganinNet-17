import { useEffect, useState } from 'react';
import { Alert, Platform, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { submitHabitData } from '../backend/hwirang/habit';
import { createNewHabitAndPlan } from '../backend/supabase/habits';
import { useHabitStore } from '../lib/habitStore';
import { PlanForCreation } from '../types/habit';
import DebugNextButton from './DebugNextButton';
import { Colors } from '../constants/Colors';
import { Spacing } from '../constants/Spacing';
import { useColorScheme } from '../hooks/useColorScheme';


interface GoalSettingStep5Props {
  onComplete: () => void;
  onBack?: () => void;
  voiceData?: {
    transcript: string;
    mode: string;
    source: string;
    step: number;
  };
}

export default function GoalSettingStep5({
  onComplete,
  onBack,
  voiceData,
}: GoalSettingStep5Props) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const styles = createStyles(colors);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showVoiceTranscript, setShowVoiceTranscript] = useState(false);
  
  // Use all the necessary states from the store
  const {
    habitName,
    difficultyReason,
    intensity,
    availableTime,
    goalPeriod,
    setPlan,
  } = useHabitStore();

  // 음성모드에서 전달받은 데이터가 있으면 표시
  useEffect(() => {
    if (voiceData?.source === 'voice' && voiceData.transcript) {
      setShowVoiceTranscript(true);
    }
  }, [voiceData]);

  // 음성/텍스트 모드에서 전달받은 정보를 파싱하여 습관 정보 추출
  const parseVoiceData = (transcript: string) => {
    const parsedInfo = [];
    
    // 구조화된 요약 형식에서 추출 (AI가 정리한 형태)
    const summaryMatch = transcript.match(/목표:\s*([^,]+),\s*기간:\s*([^,]+),\s*시간:\s*([^,]+),\s*강도:\s*([^,]+),\s*어려운\s*이유:\s*([^,]+)/i);
    if (summaryMatch) {
      parsedInfo.push(`🎯 목표: ${summaryMatch[1].trim()}`);
      parsedInfo.push(`⏰ 기간: ${summaryMatch[2].trim()}`);
      parsedInfo.push(`🕐 시간: ${summaryMatch[3].trim()}`);
      parsedInfo.push(`💪 강도: ${summaryMatch[4].trim()}`);
      parsedInfo.push(`🤔 어려웠던 점: ${summaryMatch[5].trim()}`);
      return parsedInfo;
    }
    
    // user: 로 시작하는 실제 사용자 입력만 추출
    const userLines = transcript.split('\n').filter(line => line.trim().startsWith('user:'));
    
    if (userLines.length > 0) {
      // 사용자 입력에서 정보 추출
      const userInput = userLines.join(' ');
      
      // 목표 추출 - "가 목표" 패턴이나 구체적인 목표 표현 찾기
      const goalPatterns = [
        /(\d+만원\s*모으기)/,
        /(\d+개월\s*동안\s*[^가\s]+)/,
        /(매일\s*[^가\s]+)/,
        /([^가\s]+하기)/,
        /([^가\s]+습관)/,
        /([^가\s]+운동)/,
        /([^가\s]+독서)/,
        /([^가\s]+절약)/
      ];
      
      let goalFound = false;
      for (const pattern of goalPatterns) {
        const match = userInput.match(pattern);
        if (match) {
          parsedInfo.push(`🎯 목표: ${match[1].trim()}`);
          goalFound = true;
          break;
        }
      }
      
      // 기간 추출
      const periodMatch = userInput.match(/(\d+개월|\d+주|\d+일)/);
      if (periodMatch) {
        parsedInfo.push(`⏰ 기간: ${periodMatch[1]}`);
      }
      
      // 시간 추출 (다양한 형식 지원)
      const timeMatch = userInput.match(/(\d+시|\d+:\d+|\d+시\s*-\s*\d+시|\d+시\s*부터\s*\d+시)/);
      if (timeMatch) {
        parsedInfo.push(`🕐 시간: ${timeMatch[1]}`);
      }
      
      // 강도 추출
      const intensityMatch = userInput.match(/(높음|보통|낮음)/);
      if (intensityMatch) {
        parsedInfo.push(`💪 강도: ${intensityMatch[1]}`);
      }
      
      // 어려운 이유 추출 (과거형으로 표시)
      const reasonMatch = userInput.match(/(동기\s*부족|시간\s*부족|의지\s*부족|복잡함|지루함|귀찮음)/);
      if (reasonMatch) {
        parsedInfo.push(`🤔 어려웠던 점: ${reasonMatch[1]}`);
      }
      
      // 목표가 없으면 첫 번째 사용자 입력을 목표로 사용
      if (!goalFound && userLines.length > 0) {
        const firstUserInput = userLines[0].replace('user:', '').trim();
        if (firstUserInput && firstUserInput.length < 50) { // 너무 긴 텍스트는 제외
          parsedInfo.unshift(`🎯 목표: ${firstUserInput}`);
        }
      }
    }
    
    return parsedInfo;
  };

  // 사용자가 입력한 습관 정보를 가공하여 표시
  const formatHabitInfo = () => {
    const info = [];
    
    // 음성/텍스트 모드에서 파싱된 정보가 있으면 우선 표시
    if (voiceData?.transcript) {
      const parsedInfo = parseVoiceData(voiceData.transcript);
      if (parsedInfo.length > 0) {
        return parsedInfo;
      }
    }
    
    // 기존 store의 정보 표시
    if (habitName) {
      // 긴 목표는 적절한 위치에서 두 줄로 나누기
      if (habitName.length > 25) {
        const words = habitName.split(' ');
        let firstLine = '';
        let secondLine = '';
        
        // 자연스러운 위치에서 나누기 (쉼표, '을', '를' 등 기준)
        const breakPoints = ['을', '를', '에', '로', '과', '와', '의', ',', '，'];
        let breakIndex = -1;
        
        for (let i = 0; i < words.length; i++) {
          const word = words[i];
          if (breakPoints.some(point => word.includes(point))) {
            breakIndex = i;
            break;
          }
        }
        
        if (breakIndex > 0 && breakIndex < words.length - 1) {
          firstLine = words.slice(0, breakIndex + 1).join(' ');
          secondLine = words.slice(breakIndex + 1).join(' ');
        } else {
          // 자연스러운 위치가 없으면 중간에서 나누기
          const midPoint = Math.ceil(words.length / 2);
          firstLine = words.slice(0, midPoint).join(' ');
          secondLine = words.slice(midPoint).join(' ');
        }
        
        info.push(`🎯 목표: ${firstLine}`);
        info.push(`        ${secondLine}`);
      } else {
        info.push(`🎯 목표: ${habitName}`);
      }
    }
    
    if (goalPeriod) {
      info.push(`⏰ 기간: ${goalPeriod}`);
    }
    
    if (availableTime) {
      info.push(`🕐 시간: ${availableTime}`);
    }
    
    if (intensity) {
      info.push(`💪 강도: ${intensity}`);
    }
    
    if (difficultyReason) {
      // 긴 어려운 이유는 적절한 위치에서 두 줄로 나누기
      if (difficultyReason.length > 30) {
        const words = difficultyReason.split(' ');
        let firstLine = '';
        let secondLine = '';
        
        // 자연스러운 위치에서 나누기
        const breakPoints = ['때', '것', '점', '이', '가', '을', '를', '에', '로', ',', '，'];
        let breakIndex = -1;
        
        for (let i = 0; i < words.length; i++) {
          const word = words[i];
          if (breakPoints.some(point => word.includes(point))) {
            breakIndex = i;
            break;
          }
        }
        
        if (breakIndex > 0 && breakIndex < words.length - 1) {
          firstLine = words.slice(0, breakIndex + 1).join(' ');
          secondLine = words.slice(breakIndex + 1).join(' ');
        } else {
          // 자연스러운 위치가 없으면 중간에서 나누기
          const midPoint = Math.ceil(words.length / 2);
          firstLine = words.slice(0, midPoint).join(' ');
          secondLine = words.slice(midPoint).join(' ');
        }
        
        info.push(`🤔 어려웠던 점: ${firstLine}`);
        info.push(`        ${secondLine}`);
      } else {
        info.push(`🤔 어려웠던 점: ${difficultyReason}`);
      }
    }
    
    return info;
  };

  const habitInfo = formatHabitInfo();

  const handleSubmit = async () => {
    if (!habitName.trim()) {
      Alert.alert('오류', '습관 이름을 입력해주세요.');
      return;
    }

    console.log('🔄 Starting AI routine generation and DB save step 5...', { habitName, goalPeriod, availableTime, difficultyReason, intensity });
    setIsSubmitting(true);

    try {
      // AI 루틴 생성 요청
      console.log('🤖 Requesting AI routine generation...');
      
      // intensity를 persona로 변환
      const personaMap: { [key: string]: 'Easy' | 'Medium' | 'Hard' } = {
        '높음': 'Hard',
        '보통': 'Medium', 
        '낮음': 'Easy'
      };
      const persona = personaMap[intensity] || 'Medium';
      
      // AI 루틴 생성 함수 호출
      const generatedPlan = await submitHabitData(
        habitName,
        availableTime,
        difficultyReason,
        persona,
        goalPeriod
      );
      
      console.log('✅ AI routine generation completed:', generatedPlan);
      
      // PlanForCreation으로 변환하여 DB 저장
      const planForCreation: PlanForCreation = {
        plan_title: generatedPlan.plan_title,
        status: generatedPlan.status,
        start_date: generatedPlan.start_date,
        difficulty_reason: difficultyReason,
        intensity: intensity,
        available_time: availableTime,
        milestones: generatedPlan.milestones.map((milestone) => ({
          title: milestone.title,
          duration: milestone.duration,
          status: milestone.status,
          daily_todos: milestone.daily_todos.map((todo) => ({
            description: todo.description,
            is_completed: todo.is_completed
          }))
        }))
      };
      
      console.log('💾 Saving habit and plan to database...');
      const finalPlan = await createNewHabitAndPlan(habitName, planForCreation);
      console.log('✅ Successfully saved to database:', finalPlan);
      
      // 저장된 결과를 store에 설정
      setPlan(finalPlan);
      
      Alert.alert('성공', 'AI가 맞춤형 루틴을 생성하고 저장했습니다!');
      onComplete();
      
    } catch (error) {
      console.error('💥 Error in AI routine generation and DB save:', error);
      Alert.alert('오류', 'AI 루틴 생성 및 저장에 실패했습니다. 다시 시도해주세요.');
    } finally {
      setIsSubmitting(false);
      console.log('🏁 Finished AI routine generation and DB save');
    }
  };

  const handleDebugComplete = () => {
    try {
      console.log('🐛 DEBUG: GoalStep5 - Bypassing AI generation and DB save');
      console.log('🐛 DEBUG: GoalStep5 - onComplete callback exists:', !!onComplete);
      
      if (!onComplete) {
        console.error('🐛 DEBUG: GoalStep5 - ERROR: onComplete callback is missing!');
        return;
      }
      
      onComplete();
      console.log('🐛 DEBUG: GoalStep5 - navigation callback called successfully');
    } catch (error) {
      console.error('🐛 DEBUG: GoalStep5 - Error in debug handler:', error);
    }
  };

  // 음성모드에서 전달받은 대화 내용을 정리하여 표시
  const formatVoiceTranscript = (transcript: string) => {
    const lines = transcript.split('\n');
    const formattedLines = lines.map((line, index) => {
      if (line.startsWith('user:')) {
        return `👤 ${line.replace('user:', '').trim()}`;
      } else if (line.startsWith('model:')) {
        return `🤖 ${line.replace('model:', '').trim()}`;
      }
      return line;
    });
    return formattedLines.join('\n');
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
          입력하신 정보를 확인해주세요.
        </Text>
        <Text style={styles.subtitle}>
          아래 정보가 맞는지 확인하고{'\n'}AI 루틴 생성을 진행해주세요.
        </Text>
      </View>

      {/* 사용자가 입력한 습관 정보 표시 */}
      {habitInfo.length > 0 && (
        <ScrollView style={styles.habitInfoContainer} showsVerticalScrollIndicator={false}>
          <Text style={styles.habitInfoTitle}>
            {voiceData?.source === 'voice' ? '음성으로 입력하신 정보:' : '입력된 습관 정보:'}
          </Text>
          {habitInfo.map((info, index) => (
            <Text key={index} style={styles.habitInfoText}>
              {info}
            </Text>
          ))}
        </ScrollView>
      )}

      {/* 빈 공간을 위한 Spacer */}
      <View style={styles.spacer} />

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

const createStyles = (colors: typeof Colors.light) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: 24,
    paddingTop: 100,
  },
  stepIndicator: {
    fontSize: 16,
    fontWeight: 'bold',
    color: colors.textSecondary,
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
    color: colors.text,
    textAlign: 'center',
    lineHeight: 40,
    marginBottom: 16,
    fontFamily: Platform.OS === 'ios' ? 'Inter' : 'Inter',
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    fontFamily: Platform.OS === 'ios' ? 'Inter' : 'Inter',
  },
  transcriptContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 40,
    maxHeight: 200,
  },
  habitInfoContainer: {
    backgroundColor: 'rgba(108, 99, 255, 0.1)',
    borderRadius: 16,
    padding: 20,
    marginBottom: 40,
    maxHeight: 300,
    borderWidth: 1,
    borderColor: 'rgba(108, 99, 255, 0.3)',
  },
  habitInfoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 16,
    fontFamily: Platform.OS === 'ios' ? 'Inter' : 'Inter',
  },
  habitInfoText: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: 24,
    marginBottom: 8,
    fontFamily: Platform.OS === 'ios' ? 'Inter' : 'Inter',
  },
  transcriptTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 16,
    fontFamily: Platform.OS === 'ios' ? 'Inter' : 'Inter',
  },
  transcriptText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 20,
    fontFamily: Platform.OS === 'ios' ? 'Inter' : 'Inter',
  },
  submitButton: {
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
  submitButtonDisabled: {
    backgroundColor: colors.buttonDisabled,
    opacity: 0.5,
  },
  submitButtonText: {
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
  spacer: {
    height: 40, // Adjust as needed for spacing
  },
}); 