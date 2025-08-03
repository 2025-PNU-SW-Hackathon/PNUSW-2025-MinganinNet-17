import { useState } from 'react';
import { Alert, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useHabitStore } from '../lib/habitStore';
import VoiceChat from './VoiceChat';

interface VoiceGoalSettingProps {
  onComplete?: (goalData: any) => void;
  onBack?: () => void;
}

export default function VoiceGoalSetting({ onComplete, onBack }: VoiceGoalSettingProps) {
  const [currentStep, setCurrentStep] = useState<'step1' | 'step2' | 'step3' | 'summary'>('step1');
  const [collectedData, setCollectedData] = useState<{
    habitName?: string;
    timeWindow?: string;
    goalPeriod?: string;
    difficultyReason?: string;
    intensity?: string;
  }>({});
  const [showVoiceChat, setShowVoiceChat] = useState(true);
  const [conversationHistory, setConversationHistory] = useState<string[]>([]);

  const { setHabitName, setAvailableTime, setGoalPeriod, setDifficultyReason, setIntensity } = useHabitStore();

  const handleVoiceResponse = (response: string) => {
    console.log('AI Response received:', response);
    setConversationHistory(prev => [...prev, response]);
    
    // Simple keyword extraction (in a real app, you'd want more sophisticated NLP)
    extractDataFromResponse(response);
  };

  const extractDataFromResponse = (response: string) => {
    // This is a simplified extraction logic
    // In a real app, you'd want to use more sophisticated NLP or prompt the AI to return structured data
    
    const newData = { ...collectedData };
    
    // Extract goal/habit name (step1)
    if (currentStep === 'step1') {
      // Look for patterns that indicate a goal or habit
      const goalPatterns = [
        /([가-힣\s]+(?:하기|읽기|쓰기|운동|공부))/g,
        /목표(?:는|:)\s*([가-힣\s]+)/g,
        /([가-힣\s]{2,})\s*(?:을|를)\s*하고\s*싶/g
      ];
      
      for (const pattern of goalPatterns) {
        const match = response.match(pattern);
        if (match) {
          newData.habitName = match[1]?.trim();
          break;
        }
      }
    }
    
    // Extract time and duration (step2)
    if (currentStep === 'step2') {
      // Look for time patterns
      const timePattern = /(\d{1,2}):?(\d{2})?(?:시)?(?:부터|에서)?\s*(?:~|-)?\s*(\d{1,2}):?(\d{2})?(?:시)?/;
      const timeMatch = response.match(timePattern);
      if (timeMatch) {
        const startHour = timeMatch[1];
        const startMin = timeMatch[2] || '00';
        const endHour = timeMatch[3];
        const endMin = timeMatch[4] || '00';
        newData.timeWindow = `${startHour}:${startMin}-${endHour}:${endMin}`;
      }
      
      // Look for duration patterns
      const durationPatterns = [
        /(\d+)\s*개월/g,
        /(\d+)\s*달/g,
        /(\d+)\s*주/g
      ];
      
      for (const pattern of durationPatterns) {
        const match = response.match(pattern);
        if (match) {
          if (pattern.source.includes('개월') || pattern.source.includes('달')) {
            newData.goalPeriod = `${match[1]}개월`;
          } else if (pattern.source.includes('주')) {
            newData.goalPeriod = `${match[1]}주`;
          }
          break;
        }
      }
    }
    
    // Extract difficulty reasons (step3)
    if (currentStep === 'step3') {
      // Store the entire response as difficulty reason since it's more narrative
      newData.difficultyReason = response;
      // Try to determine intensity based on keywords
      if (response.includes('매우') || response.includes('정말') || response.includes('너무')) {
        newData.intensity = '높음';
      } else if (response.includes('조금') || response.includes('약간') || response.includes('가볍게')) {
        newData.intensity = '낮음';
      } else {
        newData.intensity = '보통';
      }
    }
    
    setCollectedData(newData);
  };

  const handleNextStep = () => {
    switch (currentStep) {
      case 'step1':
        if (!collectedData.habitName) {
          Alert.alert('정보 부족', '목표가 명확하지 않습니다. 다시 말씀해주세요.');
          return;
        }
        setCurrentStep('step2');
        break;
      case 'step2':
        if (!collectedData.timeWindow && !collectedData.goalPeriod) {
          Alert.alert('정보 부족', '시간과 기간 정보가 부족합니다. 다시 말씀해주세요.');
          return;
        }
        setCurrentStep('step3');
        break;
      case 'step3':
        if (!collectedData.difficultyReason) {
          Alert.alert('정보 부족', '어려움에 대한 정보가 부족합니다. 다시 말씀해주세요.');
          return;
        }
        setCurrentStep('summary');
        break;
      case 'summary':
        handleComplete();
        break;
    }
  };

  const handleComplete = () => {
    // Save to habit store
    if (collectedData.habitName) setHabitName(collectedData.habitName);
    if (collectedData.timeWindow) setAvailableTime(collectedData.timeWindow);
    if (collectedData.goalPeriod) setGoalPeriod(collectedData.goalPeriod);
    if (collectedData.difficultyReason) setDifficultyReason(collectedData.difficultyReason);
    if (collectedData.intensity) setIntensity(collectedData.intensity);

    if (onComplete) {
      onComplete(collectedData);
    }
  };

  const getStepInfo = () => {
    switch (currentStep) {
      case 'step1':
        return {
          title: '목표 설정 (1/4)',
          description: '어떤 목표를 이루고 싶으신지 말씀해주세요.',
          collected: collectedData.habitName ? `목표: ${collectedData.habitName}` : ''
        };
      case 'step2':
        return {
          title: '시간 설정 (2/4)',
          description: '언제, 얼마나 오랫동안 진행하고 싶으신지 말씀해주세요.',
          collected: `${collectedData.timeWindow ? `시간: ${collectedData.timeWindow}` : ''} ${collectedData.goalPeriod ? `기간: ${collectedData.goalPeriod}` : ''}`
        };
      case 'step3':
        return {
          title: '어려움 파악 (3/4)',
          description: '이 목표를 달성하기 어려운 이유나 예상되는 장애물을 말씀해주세요.',
          collected: collectedData.difficultyReason ? '어려움: 설정됨' : ''
        };
      case 'summary':
        return {
          title: '완료 (4/4)',
          description: '모든 정보가 수집되었습니다. 최종 확인해주세요.',
          collected: '모든 정보 수집 완료'
        };
    }
  };

  const stepInfo = getStepInfo();

  if (!showVoiceChat) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>음성 목표 설정</Text>
        <TouchableOpacity 
          style={styles.startButton}
          onPress={() => setShowVoiceChat(true)}
        >
          <Text style={styles.startButtonText}>음성 대화 시작하기</Text>
        </TouchableOpacity>
        
        {onBack && (
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <Text style={styles.backButtonText}>← 이전</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Progress Header */}
      <View style={styles.progressContainer}>
        <Text style={styles.stepTitle}>{stepInfo.title}</Text>
        <Text style={styles.stepDescription}>{stepInfo.description}</Text>
        {stepInfo.collected && (
          <Text style={styles.collectedInfo}>{stepInfo.collected}</Text>
        )}
      </View>

      {/* Voice Chat */}
      <View style={styles.voiceChatContainer}>
        <VoiceChat
          conversationContext="goal-setting"
          currentStep={currentStep}
          onResponse={handleVoiceResponse}
          onClose={() => setShowVoiceChat(false)}
        />
      </View>

      {/* Navigation Controls */}
      <View style={styles.controlsContainer}>
        {currentStep !== 'step1' && (
          <TouchableOpacity 
            style={styles.backStepButton}
            onPress={() => {
              switch (currentStep) {
                case 'step2': setCurrentStep('step1'); break;
                case 'step3': setCurrentStep('step2'); break;
                case 'summary': setCurrentStep('step3'); break;
              }
            }}
          >
            <Text style={styles.backStepButtonText}>이전 단계</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity 
          style={styles.nextStepButton}
          onPress={handleNextStep}
        >
          <Text style={styles.nextStepButtonText}>
            {currentStep === 'summary' ? '설정 완료' : '다음 단계'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Back to main */}
      {onBack && (
        <TouchableOpacity style={styles.exitButton} onPress={onBack}>
          <Text style={styles.exitButtonText}>음성 설정 종료</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1c1c2e',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    marginTop: 100,
    marginBottom: 40,
  },
  startButton: {
    backgroundColor: '#6c63ff',
    borderRadius: 28,
    paddingVertical: 16,
    marginHorizontal: 24,
    alignItems: 'center',
  },
  startButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  backButton: {
    position: 'absolute',
    top: 60,
    left: 24,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#a9a9c2',
  },
  progressContainer: {
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: '#2d2d3a',
  },
  stepTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 8,
  },
  stepDescription: {
    fontSize: 14,
    color: '#a9a9c2',
    marginBottom: 8,
  },
  collectedInfo: {
    fontSize: 12,
    color: '#6c63ff',
    fontWeight: '600',
  },
  voiceChatContainer: {
    flex: 1,
  },
  controlsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: '#2d2d3a',
    gap: 12,
  },
  backStepButton: {
    flex: 1,
    backgroundColor: '#3a3a50',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  backStepButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#a9a9c2',
  },
  nextStepButton: {
    flex: 2,
    backgroundColor: '#6c63ff',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
  },
  nextStepButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  exitButton: {
    position: 'absolute',
    bottom: 40,
    right: 24,
    backgroundColor: '#ff4757',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  exitButtonText: {
    fontSize: 12,
    color: '#ffffff',
    fontWeight: '600',
  },
});