import { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useHabitStore } from '../lib/habitStore';

interface GoalSettingStep6Props {
  onComplete: () => void;
  onBack?: () => void;
}

export default function GoalSettingStep6({
  onComplete,
  onBack,
}: GoalSettingStep6Props) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { plan } = useHabitStore();

  if (!plan) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>AI 생성 계획을 불러오는 중...</Text>
        <Text style={styles.summaryValue}>
          이전 단계에서 계획이 생성되지 않았습니다. 뒤로 돌아가서 다시
          시도해주세요.
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={onBack}
        disabled={isSubmitting}
      >
        <Text style={styles.backButtonText}>← 이전</Text>
      </TouchableOpacity>

      <Text style={styles.stepIndicator}>AI가 생성한 맞춤 플랜</Text>
      <View style={styles.titleContainer}>
        {/* Use the new property from the Plan interface */}
        <Text style={styles.title}>{plan.plan_title}</Text>
      </View>

      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        {/* Use milestone.id for the key */}
        {(plan.milestones ?? []).map((milestone) => (
          <View key={milestone.id} style={styles.milestoneContainer}>
            <View style={styles.milestoneHeader}>
              <Text style={styles.milestoneTitle}>
                {milestone.title}
              </Text>
              <Text style={styles.milestoneDuration}>{milestone.duration}</Text>
            </View>
            {/* Use todo.id for the key */}
            {(milestone.daily_todos ?? []).map((todo) => (
              <View key={todo.id} style={styles.todoContainer}>
                <Text style={styles.todoDescription}>{todo.description}</Text>
                {/* todo.time_slot is removed as it no longer exists in DailyTodo */}
              </View>
            ))}
          </View>
        ))}
      </ScrollView>

      <TouchableOpacity
        style={[
          styles.submitButton,
          isSubmitting && styles.submitButtonDisabled,
        ]}
        onPress={onComplete}
        disabled={isSubmitting}
      >
        <Text style={styles.submitButtonText}>
          {isSubmitting ? '시작하는 중...' : '완료하고 시작하기'}
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
    paddingTop: 80,
    paddingBottom: 120, // 버튼을 위한 공간 확보
  },
  stepIndicator: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#a9a9c2',
    textAlign: 'center',
    marginBottom: 10,
  },
  titleContainer: {
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    lineHeight: 32,
  },
  scrollView: {
    flex: 1,
  },
  milestoneContainer: {
    backgroundColor: '#2c2c3e',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
  },
  milestoneHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#4a4a5e',
    paddingBottom: 10,
  },
  milestoneTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    flex: 1,
  },
  milestoneDuration: {
    fontSize: 14,
    color: '#a9a9c2',
  },
  todoContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
  },
  todoDescription: {
    fontSize: 15,
    color: '#e0e0e0',
    flex: 1,
    marginRight: 10,
    lineHeight: 22,
  },
  todoTime: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#6c63ff',
  },
  submitButton: {
    backgroundColor: '#6c63ff',
    borderRadius: 28,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
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
  },
  backButton: {
    position: 'absolute',
    top: 60,
    left: 24,
    zIndex: 1,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#a9a9c2',
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    marginTop: 20,
  },
}); 