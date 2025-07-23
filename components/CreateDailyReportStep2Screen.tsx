import { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { generateDailyFeedback } from '../backend/hwirang/gemini';
import { Colors } from '../constants/Colors';
import { useColorScheme } from '../hooks/useColorScheme';
import { DailyTodo } from '../types/habit'; // Import the correct type
import DailyReportResultScreen from './DailyReportResultScreen';

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
  const [currentScreen, setCurrentScreen] = useState<'step2' | 'result'>('step2');
  const [userSummary, setUserSummary] = useState<string>('');
  const [aiFeedback, setAiFeedback] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);


  // Handle navigation to result screen
  const handleSubmit = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // The generateDailyFeedback function might expect a different structure.
      // We need to map our `DailyTodo[]` to what it expects.
      // Assuming it expects an array of { id: string, description: string, completed: boolean }
      const feedbackTodos = todos.map(t => ({
        id: t.id.toString(),
        description: t.description,
        completed: t.is_completed,
      }));
      
      const feedback = await generateDailyFeedback(userSummary, achievementScore, feedbackTodos);
      setAiFeedback(feedback);
      setCurrentScreen('result');
    } catch (err) {
      setError('피드백을 생성하는 중 오류가 발생했습니다. 다시 시도해주세요.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle back from result screen
  const handleBackFromResult = () => {
    setCurrentScreen('step2');
    setAiFeedback(''); // Reset feedback when returning
  };

  // Show result screen
  if (currentScreen === 'result') {
    return <DailyReportResultScreen 
              onBack={handleBackFromResult} 
              achievementScore={achievementScore} 
              aiReportText={aiFeedback} 
           />;
  }

  return (
    <CreateDailyReportStep2View
      onBack={onBack}
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
}); 