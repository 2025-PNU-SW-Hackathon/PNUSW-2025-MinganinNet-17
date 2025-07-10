import { useState } from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useHabitStore } from '../lib/habitStore';

interface GoalSettingStep6Props {
  onComplete: () => void;
  onBack?: () => void;
}

export default function GoalSettingStep6({
  onComplete,
  onBack
}: GoalSettingStep6Props) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { habit, time, intensity, difficulty } = useHabitStore();

  const handleSubmit = () => {
    setIsSubmitting(true);
    // Here you would typically call the submission logic from Step 5
    // For now, it just calls onComplete
    console.log('Finalizing habit setup...');
    onComplete();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.stepIndicator}>6 / 6 단계</Text>
      
      {/* Back Button is not in the image, but good for UX */}
      <TouchableOpacity
        style={styles.backButton}
        onPress={onBack}
        disabled={isSubmitting}
      >
        <Text style={styles.backButtonText}>← 이전</Text>
      </TouchableOpacity>
      
      <View style={styles.titleContainer}>
        <Text style={styles.title}>
          마지막으로{'\n'}확인해주세요
        </Text>
      </View>

      <View style={styles.summaryContainer}>
        <Text style={styles.summaryTitle}>나의 목표 설정</Text>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>내 목표</Text>
          <Text style={styles.summaryValue}>{habit} {time}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>실천 기간</Text>
          <Text style={styles.summaryValue}>90일</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>코칭 강도</Text>
          <Text style={styles.summaryValue}>{intensity}</Text>
        </View>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryLabel}>어려웠던 점</Text>
          <Text style={styles.summaryValue}>{difficulty}</Text>
        </View>
      </View>

      <Text style={styles.encouragementText}>
        좋은 시작이에요! '{difficulty}'을 이겨낼 수 있도록 제가 옆에서 든든하게 도와드릴게요. 함께 멋진 여정을 만들어봐요!
      </Text>

      <TouchableOpacity
        style={[
          styles.submitButton,
          isSubmitting && styles.submitButtonDisabled
        ]}
        onPress={onComplete}
        disabled={isSubmitting}
      >
        <Text style={styles.submitButtonText}>
          {isSubmitting ? '생성 중...' : '완료하고 시작하기'}
        </Text>
      </TouchableOpacity>
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
    marginBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    lineHeight: 40,
    fontFamily: Platform.OS === 'ios' ? 'Inter' : 'Inter',
  },
  summaryContainer: {
    backgroundColor: '#2c2c3e',
    borderRadius: 16,
    padding: 20,
    marginBottom: 30,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 20,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 15,
  },
  summaryLabel: {
    fontSize: 16,
    color: '#a9a9c2',
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  encouragementText: {
    fontSize: 16,
    color: '#a9a9c2',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 10,
  },
  submitButton: {
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
  submitButtonDisabled: {
    backgroundColor: '#4a47cc',
    opacity: 0.5,
  },
  submitButtonText: {
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
}); 