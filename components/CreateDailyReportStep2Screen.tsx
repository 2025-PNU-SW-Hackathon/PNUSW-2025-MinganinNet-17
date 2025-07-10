import { useState } from 'react';
import { KeyboardAvoidingView, Platform, SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Colors } from '../constants/Colors';
import { useColorScheme } from '../hooks/useColorScheme';
import DailyReportResultScreen from './DailyReportResultScreen';
import ScreenTransitionManager from './ScreenTransitionManager';

interface CreateDailyReportStep2ScreenProps {
  onBack: () => void;
  achievementScore: number;
}

export default function CreateDailyReportStep2Screen({ onBack, achievementScore }: CreateDailyReportStep2ScreenProps) {
  const colorScheme = useColorScheme();
  const [currentScreen, setCurrentScreen] = useState<'step2' | 'result'>('step2');
  const [userSummary, setUserSummary] = useState<string>('');

  // Handle navigation to result screen
  const handleSubmit = () => {
    setCurrentScreen('result');
  };

  // Handle back from result screen
  const handleBackFromResult = () => {
    setCurrentScreen('step2');
  };

  // Render function for screen content
  const renderScreen = () => {
    switch (currentScreen) {
      case 'result':
        return <DailyReportResultScreen onBack={handleBackFromResult} achievementScore={achievementScore} />;
      case 'step2':
      default:
        return <CreateDailyReportStep2Content />;
    }
  };

  // Step 2 Content Component
  const CreateDailyReportStep2Content = () => (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <SafeAreaView style={[styles.container, { backgroundColor: Colors[colorScheme ?? 'light'].background }]}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Text style={[styles.backButtonText, { color: Colors[colorScheme ?? 'light'].text }]}>
              ← 뒤로
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
          {/* Header Question */}
          <View style={styles.questionContainer}>
            <Text style={[styles.questionText, { color: Colors[colorScheme ?? 'light'].text }]}>
              오늘 하루를 간단히 요약해 주세요
            </Text>
          </View>

          {/* User Summary Input */}
          <View style={styles.inputContainer}>
            <Text style={[styles.inputLabel, { color: Colors[colorScheme ?? 'light'].text }]}>
              오늘 하루 요약 (선택사항)
            </Text>
            <TextInput
              style={[
                styles.textInput,
                { 
                  color: Colors[colorScheme ?? 'light'].text,
                  borderColor: Colors[colorScheme ?? 'light'].icon,
                  backgroundColor: Colors[colorScheme ?? 'light'].background
                }
              ]}
              placeholder="오늘의 경험, 느낀 점, 배운 것들을 자유롭게 적어주세요..."
              placeholderTextColor={Colors[colorScheme ?? 'light'].icon}
              value={userSummary}
              onChangeText={setUserSummary}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
            />
          </View>

          {/* Summary Tips */}
          <View style={styles.tipsContainer}>
            <Text style={[styles.tipsTitle, { color: Colors[colorScheme ?? 'light'].text }]}>
              💡 작성 팁
            </Text>
            <Text style={[styles.tipsText, { color: Colors[colorScheme ?? 'light'].icon }]}>
              • 오늘 가장 기억에 남는 순간{'\n'}
              • 성취한 일이나 도전한 것들{'\n'}
              • 느낀 점이나 배운 것들{'\n'}
              • 내일 개선하고 싶은 점들
            </Text>
          </View>
        </ScrollView>

        {/* Submit Button */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={styles.submitButton}
            onPress={handleSubmit}
          >
            <Text style={styles.submitButtonText}>
              리포트 생성
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );

  return (
    <ScreenTransitionManager
      screenKey={currentScreen}
      direction={currentScreen === 'result' ? 'forward' : 'backward'}
      onTransitionComplete={() => {
        console.log('Daily report step 2 transition completed:', currentScreen);
      }}
    >
      {renderScreen()}
    </ScreenTransitionManager>
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
  submitButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
}); 