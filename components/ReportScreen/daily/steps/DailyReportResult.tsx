import { SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors } from '../../../../constants/Colors';
import { useColorScheme } from '../../../../hooks/useColorScheme';
import { DailyTodo } from '../../../../types/habit';

interface DailyReportResultProps {
  todos: DailyTodo[];
  achievementScore: number;
  userSummary: string;
  aiFeedback: string;
  onBack: () => void;
}

export default function DailyReportResult({ 
  todos, 
  achievementScore, 
  userSummary, 
  aiFeedback, 
  onBack 
}: DailyReportResultProps) {
  const colorScheme = useColorScheme();

  const getAchievementColor = (score: number): string => {
    if (score >= 9) return '#4CAF50';
    if (score >= 7) return '#8BC34A';
    if (score >= 5) return '#FF9800';
    return '#F44336';
  };

  const completedTodos = todos.filter(todo => todo.is_completed);
  const incompleteTodos = todos.filter(todo => !todo.is_completed);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: Colors[colorScheme ?? 'light'].background }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={[styles.backButtonText, { color: Colors[colorScheme ?? 'light'].text }]}>
            ← 뒤로
          </Text>
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: Colors[colorScheme ?? 'light'].text }]}>
          오늘의 리포트
        </Text>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Achievement Summary */}
        <View style={styles.achievementSection}>
          <Text style={[styles.sectionTitle, { color: Colors[colorScheme ?? 'light'].text }]}>
            오늘의 성과
          </Text>
          <View style={styles.achievementDisplay}>
            <Text style={[styles.achievementValue, { color: getAchievementColor(achievementScore) }]}>
              {achievementScore}
            </Text>
            <Text style={[styles.achievementTotal, { color: Colors[colorScheme ?? 'light'].text }]}>
              / 10
            </Text>
          </View>
          <Text style={[styles.achievementText, { color: Colors[colorScheme ?? 'light'].icon }]}>
            완료된 할 일: {completedTodos.length}/{todos.length}개
          </Text>
        </View>

        {/* Completed Todos */}
        {completedTodos.length > 0 && (
          <View style={styles.todoSection}>
            <Text style={[styles.sectionTitle, { color: Colors[colorScheme ?? 'light'].text }]}>
              ✅ 완료한 일
            </Text>
            {completedTodos.map((todo) => (
              <View key={todo.id} style={styles.todoItem}>
                <Text style={[styles.todoText, { color: Colors[colorScheme ?? 'light'].text }]}>
                  {todo.description}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Incomplete Todos */}
        {incompleteTodos.length > 0 && (
          <View style={styles.todoSection}>
            <Text style={[styles.sectionTitle, { color: Colors[colorScheme ?? 'light'].text }]}>
              ⏳ 미완료한 일
            </Text>
            {incompleteTodos.map((todo) => (
              <View key={todo.id} style={styles.todoItem}>
                <Text style={[styles.todoText, { color: Colors[colorScheme ?? 'light'].icon }]}>
                  {todo.description}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* User Summary */}
        {userSummary && (
          <View style={styles.summarySection}>
            <Text style={[styles.sectionTitle, { color: Colors[colorScheme ?? 'light'].text }]}>
              📝 오늘의 기록
            </Text>
            <View style={[styles.summaryBox, { backgroundColor: Colors[colorScheme ?? 'light'].background, borderColor: Colors[colorScheme ?? 'light'].icon }]}>
              <Text style={[styles.summaryText, { color: Colors[colorScheme ?? 'light'].text }]}>
                {userSummary}
              </Text>
            </View>
          </View>
        )}

        {/* AI Feedback */}
        <View style={styles.feedbackSection}>
          <Text style={[styles.sectionTitle, { color: Colors[colorScheme ?? 'light'].text }]}>
            🤖 AI 코치의 피드백
          </Text>
          <View style={[styles.feedbackBox, { backgroundColor: Colors[colorScheme ?? 'light'].background, borderColor: Colors[colorScheme ?? 'light'].icon }]}>
            <Text style={[styles.feedbackText, { color: Colors[colorScheme ?? 'light'].text }]}>
              {aiFeedback}
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Done Button */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.doneButton}
          onPress={onBack}
        >
          <Text style={styles.doneButtonText}>
            완료
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 20,
  },
  backButton: {
    paddingVertical: 8,
    marginRight: 16,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  scrollView: {
    flex: 1,
  },
  achievementSection: {
    paddingHorizontal: 24,
    paddingBottom: 32,
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  achievementDisplay: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
    marginBottom: 8,
  },
  achievementValue: {
    fontSize: 48,
    fontWeight: 'bold',
  },
  achievementTotal: {
    fontSize: 24,
    fontWeight: '600',
    marginLeft: 8,
    opacity: 0.7,
  },
  achievementText: {
    fontSize: 16,
    textAlign: 'center',
  },
  todoSection: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  todoItem: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 12,
    marginBottom: 8,
  },
  todoText: {
    fontSize: 16,
    lineHeight: 22,
  },
  summarySection: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  summaryBox: {
    borderWidth: 2,
    borderRadius: 16,
    padding: 20,
  },
  summaryText: {
    fontSize: 16,
    lineHeight: 24,
  },
  feedbackSection: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  feedbackBox: {
    borderWidth: 2,
    borderRadius: 16,
    padding: 20,
  },
  feedbackText: {
    fontSize: 16,
    lineHeight: 24,
  },
  buttonContainer: {
    paddingHorizontal: 24,
    paddingBottom: 40,
    paddingTop: 20,
  },
  doneButton: {
    backgroundColor: '#6c63ff',
    borderRadius: 28,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    height: 56,
  },
  doneButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
});

