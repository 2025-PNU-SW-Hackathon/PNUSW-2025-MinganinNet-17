import { useState } from 'react';
import { ActivityIndicator, KeyboardAvoidingView, Platform, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { generateDailyFeedback } from '../backend/hwirang/gemini';
import { Colors } from '../constants/Colors';
import { useColorScheme } from '../hooks/useColorScheme';
import DailyReportResultScreen from './DailyReportResultScreen';

interface TodoItem {
    id: string;
    description: string;
    completed: boolean;
}

interface CreateDailyReportStep2ScreenProps {
  onBack: () => void;
  achievementScore: number;
  todos: TodoItem[];
}

export default function CreateDailyReportStep2Screen({ onBack, achievementScore, todos }: CreateDailyReportStep2ScreenProps) {
  const colorScheme = useColorScheme();
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
      const feedback = await generateDailyFeedback(userSummary, achievementScore, todos);
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
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <SafeAreaView style={[styles.container, { backgroundColor: Colors[colorScheme ?? 'light'].background }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Text style={[styles.backButtonText, { color: Colors[colorScheme ?? 'light'].text }]}>
              ← 뒤로
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Header Text */}
          <View style={styles.headerTextContainer}>
            <Text style={[styles.headerText, { color: Colors[colorScheme ?? 'light'].text }]}>
              좋아요. 더 나은 내일을 위해, 오늘 하루를 보낸 당신의 솔직한 소감을 들려주세요.
            </Text>
          </View>

          {/* User Input Field */}
          <View style={styles.inputContainer}>
            <TextInput
              style={[
                styles.summaryInput,
                { 
                  backgroundColor: Colors[colorScheme ?? 'light'].background,
                  color: Colors[colorScheme ?? 'light'].text,
                  borderColor: Colors[colorScheme ?? 'light'].icon + '30'
                }
              ]}
              placeholder="오늘 하루는 어떠셨나요? 솔직한 생각을 적어주세요..."
              placeholderTextColor={Colors[colorScheme ?? 'light'].icon}
              value={userSummary}
              onChangeText={setUserSummary}
              multiline={true}
              numberOfLines={4}
              textAlignVertical="top"
              maxLength={200}
            />
            <Text style={[styles.characterCount, { color: Colors[colorScheme ?? 'light'].icon }]}>
              {userSummary.length}/200
            </Text>
          </View>
        </ScrollView>

        {/* Final Action Button */}
        <View style={styles.buttonContainer}>
          {isLoading ? (
            <ActivityIndicator size="large" color={Colors.dark.tint} />
          ) : (
            <TouchableOpacity
              style={[
                styles.submitButton,
                !userSummary.trim() && styles.submitButtonDisabled
              ]}
              onPress={handleSubmit}
              disabled={!userSummary.trim()}
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
  headerTextContainer: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  headerText: {
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 28,
  },
  inputContainer: {
    paddingHorizontal: 24,
    marginBottom: 40,
  },
  summaryInput: {
    borderWidth: 2,
    borderRadius: 16,
    padding: 20,
    fontSize: 16,
    lineHeight: 24,
    minHeight: 120,
    maxHeight: 200,
  },
  characterCount: {
    fontSize: 14,
    textAlign: 'right',
    marginTop: 8,
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
    opacity: 0.6,
  },
  submitButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
}); 