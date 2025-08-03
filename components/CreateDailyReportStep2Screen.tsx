import { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { generateDailyFeedback } from '../backend/hwirang/gemini';
import { Colors } from '../constants/Colors';
import { useColorScheme } from '../hooks/useColorScheme';
import { DailyTodo } from '../types/habit'; // Import the correct type
import DailyReportResultScreen from './DailyReportResultScreen';
import VoiceDailyReport from './VoiceDailyReport';

// Removed local TodoItem interface

interface CreateDailyReportStep2ScreenProps {
  onBack: () => void;
  achievementScore: number;
  todos: DailyTodo[]; // Use DailyTodo[] directly
}

// Step 2의 UI를 렌더링하는 것을 책임지는 분리된 컴포넌트입니다.
// 이렇게 하면 상태 업데이트 시 불필요한 리렌더링을 방지하여 입력 문제를 해결할 수 있습니다.
const CreateDailyReportStep2View = ({
  onBack,
  userSummary,
  setUserSummary,
  handleSubmit,
  isLoading,
  error,
  colorScheme,
}: {
  onBack: () => void;
  userSummary: string;
  setUserSummary: (text: string) => void;
  handleSubmit: () => void;
  isLoading: boolean;
  error: string | null;
  colorScheme: 'light' | 'dark';
}) => {
  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <SafeAreaView style={[styles.container, { backgroundColor: Colors[colorScheme].background }]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Text style={[styles.backButtonText, { color: Colors[colorScheme].text }]}>
              ← 뒤로
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Header Question */}
          <View style={styles.questionContainer}>
            <Text style={[styles.questionText, { color: Colors[colorScheme].text }]}>
              오늘 하루를 간단히 요약해 주세요
            </Text>
          </View>

          {/* User Summary Input */}
          <View style={styles.inputContainer}>
            <Text style={[styles.inputLabel, { color: Colors[colorScheme].text }]}>
              오늘 하루 요약 (선택사항)
            </Text>
            <TextInput
              style={[
                styles.textInput,
                { 
                  color: Colors[colorScheme].text,
                  borderColor: Colors[colorScheme].icon,
                  backgroundColor: Colors[colorScheme].background
                }
              ]}
              placeholder="오늘의 경험, 느낀 점, 배운 것들을 자유롭게 적어주세요..."
              placeholderTextColor={Colors[colorScheme].icon}
              value={userSummary}
              onChangeText={setUserSummary}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
            />
          </View>

          {/* Summary Tips */}
          <View style={styles.tipsContainer}>
            <Text style={[styles.tipsTitle, { color: Colors[colorScheme].text }]}>
              💡 작성 팁
            </Text>
            <Text style={[styles.tipsText, { color: Colors[colorScheme].icon }]}>
              • 오늘 가장 기억에 남는 순간{'\n'}
              • 성취한 일이나 도전한 것들{'\n'}
              • 느낀 점이나 배운 것들{'\n'}
              • 내일 개선하고 싶은 점들
            </Text>
          </View>
        </ScrollView>

        {/* Submit Button */}
        <View style={styles.buttonContainer}>
          {isLoading ? (
            <ActivityIndicator size="large" color={Colors.dark.tint} />
          ) : (
            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleSubmit}
            >
              <Text style={styles.submitButtonText}>
                하루에 대한 피드백 받기
              </Text>
            </TouchableOpacity>
          )}
          {error && <Text style={styles.errorText}>{error}</Text>}
        </View>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
};

export default function CreateDailyReportStep2Screen({ onBack, achievementScore, todos }: CreateDailyReportStep2ScreenProps) {
  const colorScheme = useColorScheme() ?? 'light';
  const [currentScreen, setCurrentScreen] = useState<'mode-selection' | 'step2' | 'voice' | 'result'>('mode-selection');
  const [userSummary, setUserSummary] = useState<string>('');
  const [aiFeedback, setAiFeedback] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);


  // Handle navigation to result screen
  const handleSubmit = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const feedbackTodos = todos.map(t => ({
        id: t.id.toString(),
        description: t.description,
        completed: t.is_completed, // Use is_completed from the incoming data
      }));
      
      const feedbackResult = await generateDailyFeedback(userSummary, achievementScore, feedbackTodos);

      setAiFeedback(feedbackResult);
      setCurrentScreen('result');
    } catch (err) {
      console.error('handleSubmit에서 오류 발생:', err);
      setError('피드백을 생성하는 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle back from result screen
  const handleBackFromResult = () => {
    setCurrentScreen('step2');
    setAiFeedback(''); // Reset feedback when returning
  };

  // Handle voice report completion
  const handleVoiceReportComplete = (reportData: { reflection: string; feedback: string }) => {
    console.log('Voice report completed:', reportData);
    setUserSummary(reportData.reflection);
    setAiFeedback(reportData.feedback);
    setCurrentScreen('result');
  };

  // Mode selection screen
  if (currentScreen === 'mode-selection') {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: Colors[colorScheme].background }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Text style={[styles.backButtonText, { color: Colors[colorScheme].text }]}>
              ← 뒤로
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.modeSelectionContainer}>
          <Text style={[styles.modeTitle, { color: Colors[colorScheme].text }]}>
            리포트 작성 방법을{'\n'}선택해주세요
          </Text>
          <Text style={[styles.modeSubtitle, { color: Colors[colorScheme].icon }]}>
            텍스트로 입력하거나 AI와 음성 대화로 작성할 수 있어요
          </Text>

          <View style={styles.modeOptionsContainer}>
            <TouchableOpacity
              style={styles.modeOption}
              onPress={() => setCurrentScreen('step2')}
            >
              <Text style={styles.modeIcon}>✏️</Text>
              <Text style={[styles.modeOptionTitle, { color: Colors[colorScheme].text }]}>텍스트 입력</Text>
              <Text style={[styles.modeOptionDescription, { color: Colors[colorScheme].icon }]}>
                키보드로 직접 하루를 요약해주세요
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modeOption}
              onPress={() => setCurrentScreen('voice')}
            >
              <Text style={styles.modeIcon}>🎤</Text>
              <Text style={[styles.modeOptionTitle, { color: Colors[colorScheme].text }]}>음성 대화</Text>
              <Text style={[styles.modeOptionDescription, { color: Colors[colorScheme].icon }]}>
                AI와 대화하며 자연스럽게 하루를 돌아보세요
              </Text>
            </TouchableOpacity>
          </View>

          {/* Achievement Summary */}
          <View style={styles.achievementSummary}>
            <Text style={[styles.summaryTitle, { color: Colors[colorScheme].text }]}>오늘의 성과</Text>
            <Text style={[styles.summaryText, { color: Colors[colorScheme].icon }]}>
              달성률: {achievementScore}/10 | 완료된 할 일: {todos.filter(t => t.is_completed).length}/{todos.length}개
            </Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  // Voice mode
  if (currentScreen === 'voice') {
    return (
      <VoiceDailyReport
        onComplete={handleVoiceReportComplete}
        onBack={() => setCurrentScreen('mode-selection')}
        achievementScore={achievementScore}
        todos={todos.map(t => ({ description: t.description, completed: t.is_completed }))}
      />
    );
  }

  // Show result screen
  if (currentScreen === 'result') {
    return <DailyReportResultScreen 
              onBack={onBack}  // 메인 리포트 화면으로 바로 이동하도록 변경
              achievementScore={achievementScore} 
              aiReportText={aiFeedback}
              todos={todos} // 할일 목록 데이터 전달
           />;
  }

  // Text mode (original interface)
  return (
    <CreateDailyReportStep2View
      onBack={() => setCurrentScreen('mode-selection')}
      userSummary={userSummary}
      setUserSummary={setUserSummary}
      handleSubmit={handleSubmit}
      isLoading={isLoading}
      error={error}
      colorScheme={colorScheme}
    />
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 20,
  },
  backButton: {
    paddingVertical: 8,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  scrollView: {
    flex: 1,
  },
  questionContainer: {
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  questionText: {
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 28,
  },
  inputContainer: {
    paddingHorizontal: 24,
    marginBottom: 40,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 10,
  },
  textInput: {
    borderWidth: 2,
    borderRadius: 16,
    padding: 20,
    fontSize: 16,
    lineHeight: 24,
    minHeight: 120,
    maxHeight: 200,
  },
  tipsContainer: {
    paddingHorizontal: 24,
    marginBottom: 40,
  },
  tipsTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 10,
  },
  tipsText: {
    fontSize: 14,
    lineHeight: 22,
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
    marginTop: 10,
  },
  buttonContainer: {
    paddingHorizontal: 24,
    paddingBottom: 40,
    paddingTop: 20,
  },
  submitButton: {
    backgroundColor: '#6c63ff',
    borderRadius: 28,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    height: 56,
  },
  submitButtonDisabled: {
    backgroundColor: '#cccccc',
    opacity: 0.5,
  },
  submitButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  modeSelectionContainer: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: 'center',
  },
  modeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 32,
  },
  modeSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 24,
  },
  modeOptionsContainer: {
    gap: 20,
    marginBottom: 40,
  },
  modeOption: {
    backgroundColor: 'rgba(108, 99, 255, 0.1)',
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
  modeOptionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  modeOptionDescription: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  achievementSummary: {
    backgroundColor: 'rgba(108, 99, 255, 0.1)',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  summaryText: {
    fontSize: 14,
    textAlign: 'center',
  },
}); 