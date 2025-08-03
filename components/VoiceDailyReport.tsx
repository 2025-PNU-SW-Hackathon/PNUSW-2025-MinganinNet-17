import { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import VoiceChat from './VoiceChat';

interface VoiceDailyReportProps {
  onComplete?: (reportData: { reflection: string; feedback: string }) => void;
  onBack?: () => void;
  achievementScore?: number;
  todos?: Array<{ description: string; completed: boolean }>;
}

export default function VoiceDailyReport({ 
  onComplete, 
  onBack, 
  achievementScore = 0, 
  todos = [] 
}: VoiceDailyReportProps) {
  const [currentStep, setCurrentStep] = useState<'reflection' | 'feedback' | 'complete'>('reflection');
  const [reportData, setReportData] = useState<{
    reflection?: string;
    feedback?: string;
  }>({});
  const [showVoiceChat, setShowVoiceChat] = useState(true);

  const handleVoiceResponse = (response: string) => {
    console.log('AI Response received:', response);
    
    if (currentStep === 'reflection') {
      // Store user's reflection
      setReportData(prev => ({ ...prev, reflection: response }));
    } else if (currentStep === 'feedback') {
      // Store AI's feedback
      setReportData(prev => ({ ...prev, feedback: response }));
    }
  };

  const handleNextStep = () => {
    switch (currentStep) {
      case 'reflection':
        setCurrentStep('feedback');
        break;
      case 'feedback':
        setCurrentStep('complete');
        break;
      case 'complete':
        handleComplete();
        break;
    }
  };

  const handleComplete = () => {
    if (onComplete && reportData.reflection && reportData.feedback) {
      onComplete({
        reflection: reportData.reflection,
        feedback: reportData.feedback
      });
    }
  };

  const getStepInfo = () => {
    switch (currentStep) {
      case 'reflection':
        return {
          title: '하루 돌아보기 (1/2)',
          description: '오늘 하루는 어떠셨나요? 자유롭게 말씀해주세요.',
          summary: `오늘의 달성률: ${achievementScore}/10 | 완료된 할 일: ${todos.filter(t => t.completed).length}/${todos.length}개`
        };
      case 'feedback':
        return {
          title: 'AI 피드백 (2/2)',
          description: 'AI가 당신의 하루에 대한 피드백을 제공합니다.',
          summary: reportData.reflection ? '하루 기록이 완료되었습니다.' : ''
        };
      case 'complete':
        return {
          title: '리포트 완료',
          description: '일간 리포트가 완성되었습니다.',
          summary: '모든 단계가 완료되었습니다.'
        };
    }
  };

  const stepInfo = getStepInfo();

  if (!showVoiceChat) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>음성 일간 리포트</Text>
        
        {/* Achievement Summary */}
        <View style={styles.summaryContainer}>
          <Text style={styles.summaryTitle}>오늘의 성과</Text>
          <Text style={styles.achievementText}>달성률: {achievementScore}/10</Text>
          <Text style={styles.todoText}>
            완료된 할 일: {todos.filter(t => t.completed).length}/{todos.length}개
          </Text>
        </View>

        <TouchableOpacity 
          style={styles.startButton}
          onPress={() => setShowVoiceChat(true)}
        >
          <Text style={styles.startButtonText}>음성 리포트 시작하기</Text>
        </TouchableOpacity>
        
        {onBack && (
          <TouchableOpacity style={styles.backButton} onPress={onBack}>
            <Text style={styles.backButtonText}>← 이전</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  }

  if (currentStep === 'complete') {
    return (
      <View style={styles.container}>
        <View style={styles.completeContainer}>
          <Text style={styles.completeTitle}>✅ 일간 리포트 완료!</Text>
          
          {reportData.reflection && (
            <View style={styles.reportSection}>
              <Text style={styles.sectionTitle}>오늘의 기록</Text>
              <Text style={styles.sectionContent}>{reportData.reflection}</Text>
            </View>
          )}
          
          {reportData.feedback && (
            <View style={styles.reportSection}>
              <Text style={styles.sectionTitle}>AI 피드백</Text>
              <Text style={styles.sectionContent}>{reportData.feedback}</Text>
            </View>
          )}
          
          <TouchableOpacity 
            style={styles.completeButton}
            onPress={handleComplete}
          >
            <Text style={styles.completeButtonText}>리포트 저장하기</Text>
          </TouchableOpacity>
          
          {onBack && (
            <TouchableOpacity style={styles.backButton} onPress={onBack}>
              <Text style={styles.backButtonText}>← 메인으로</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Progress Header */}
      <View style={styles.progressContainer}>
        <Text style={styles.stepTitle}>{stepInfo.title}</Text>
        <Text style={styles.stepDescription}>{stepInfo.description}</Text>
        {stepInfo.summary && (
          <Text style={styles.summaryInfo}>{stepInfo.summary}</Text>
        )}
      </View>

      {/* Voice Chat */}
      <View style={styles.voiceChatContainer}>
        <VoiceChat
          conversationContext="daily-report"
          currentStep={currentStep}
          onResponse={handleVoiceResponse}
          onClose={() => setShowVoiceChat(false)}
        />
      </View>

      {/* Navigation Controls */}
      <View style={styles.controlsContainer}>
        {currentStep === 'feedback' && (
          <TouchableOpacity 
            style={styles.backStepButton}
            onPress={() => setCurrentStep('reflection')}
          >
            <Text style={styles.backStepButtonText}>이전 단계</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity 
          style={styles.nextStepButton}
          onPress={handleNextStep}
        >
          <Text style={styles.nextStepButtonText}>
            {currentStep === 'reflection' ? 'AI 피드백 받기' : '리포트 완료'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Back to main */}
      {onBack && (
        <TouchableOpacity style={styles.exitButton} onPress={onBack}>
          <Text style={styles.exitButtonText}>음성 리포트 종료</Text>
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
  summaryContainer: {
    backgroundColor: '#2d2d3a',
    borderRadius: 16,
    padding: 20,
    marginHorizontal: 24,
    marginBottom: 32,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 12,
  },
  achievementText: {
    fontSize: 16,
    color: '#6c63ff',
    marginBottom: 8,
  },
  todoText: {
    fontSize: 16,
    color: '#a9a9c2',
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
  summaryInfo: {
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
  completeContainer: {
    flex: 1,
    padding: 24,
    paddingTop: 100,
  },
  completeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 32,
  },
  reportSection: {
    backgroundColor: '#2d2d3a',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#6c63ff',
    marginBottom: 12,
  },
  sectionContent: {
    fontSize: 14,
    color: '#ffffff',
    lineHeight: 20,
  },
  completeButton: {
    backgroundColor: '#6c63ff',
    borderRadius: 28,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  completeButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
});