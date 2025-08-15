import { Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useHabitStore } from '../lib/habitStore';
import DebugNextButton from './DebugNextButton';

interface GoalSettingStep6Props {
  onComplete: () => void;
  onBack?: () => void;
}

export default function GoalSettingStep6({
  onComplete,
  onBack,
}: GoalSettingStep6Props) {
  const { plan, setPlan, habitName } = useHabitStore();

  // 습관 시작하기 - 저장은 이미 Step 5에서 완료됨
  const handleStartHabit = async () => {
    if (!plan || !habitName) {
      Alert.alert('오류', '습관 정보가 없습니다. 이전 단계로 돌아가서 다시 시도해주세요.');
      return;
    }

    console.log('✅ Habit and plan already saved in Step 5, proceeding to completion...');
    
    // 저장은 이미 Step 5에서 완료되었으므로 바로 완료 화면으로 전환
    onComplete();
  };

  // Debug navigation handler - bypasses to completion
  const handleDebugComplete = () => {
    try {
      console.log('🐛 DEBUG: GoalStep6 - Going directly to completion');
      console.log('🐛 DEBUG: GoalStep6 - Current plan state:', plan);
      
      if (!onComplete) {
        console.error('🐛 DEBUG: GoalStep6 - ERROR: onComplete callback is missing!');
        return;
      }
      
      onComplete();
      console.log('🐛 DEBUG: GoalStep6 - navigation callback called successfully');
    } catch (error) {
      console.error('🐛 DEBUG: GoalStep6 - Error in debug handler:', error);
    }
  };

  if (!plan) {
    return (
      <View style={styles.container}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={onBack}
        >
          <Text style={styles.backButtonText}>← 이전</Text>
        </TouchableOpacity>
        
        <Text style={styles.title}>AI 생성 계획을 불러오는 중...</Text>
        <Text style={styles.summaryValue}>
          이전 단계에서 계획이 생성되지 않았습니다. 뒤로 돌아가서 다시
          시도해주세요.
        </Text>
        
        {/* Debug button to bypass missing plan issue */}
        <DebugNextButton
          to="Home Screen"
          onPress={handleDebugComplete}
          label="Debug: Skip to Completion"
        />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={onBack}
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
        style={styles.submitButton}
        onPress={handleStartHabit}
      >
        <Text style={styles.submitButtonText}>
          습관 시작하기
        </Text>
      </TouchableOpacity>
      
      {/* Debug button for normal view */}
      <DebugNextButton
        to="Home Screen"
        onPress={handleDebugComplete}
        label="Debug: Skip to Completion"
      />
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