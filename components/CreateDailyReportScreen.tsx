import { useEffect, useState } from 'react';
import { ActivityIndicator, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { getLatestHabitPlan } from '../backend/supabase/habits';
import { Colors } from '../constants/Colors';
import { useColorScheme } from '../hooks/useColorScheme';
import { DailyTodo, Plan } from '../types/habit';
import CreateDailyReportStep2Screen from './CreateDailyReportStep2Screen';

interface CreateDailyReportScreenProps {
  onBack: () => void;
}

interface TodoItem extends DailyTodo {
  id: string; // Add a unique ID for list rendering
  completed: boolean;
}

// Helper function to parse duration strings into days (from HomeScreen)
const parseDurationToDays = (duration: string): number => {
  if (duration.includes('개월')) {
    const months = parseInt(duration.replace('개월', '').trim(), 10);
    return isNaN(months) ? 0 : months * 30; // Approximation
  }
  if (duration.includes('주')) {
    const weeks = parseInt(duration.replace('주', '').trim(), 10);
    return isNaN(weeks) ? 0 : weeks * 7;
  }
  if (duration.includes('일')) {
    const days = parseInt(duration.replace('일', '').trim(), 10);
    return isNaN(days) ? 0 : days;
  }
  return 0;
};


// Achievement score color mapping (same as calendar logic)
const getAchievementColor = (score: number): string => {
  if (score >= 9) return '#4CAF50';        // Green (90%+)
  if (score >= 7) return '#8BC34A';        // Light Green (70%+)
  if (score >= 5) return '#FF9800';        // Orange (50%+)
  return '#F44336';                        // Red (below 50%)
};

export default function CreateDailyReportScreen({ onBack }: CreateDailyReportScreenProps) {
  const colorScheme = useColorScheme();
  const [currentStep, setCurrentStep] = useState<'step1' | 'step2'>('step1');
  const [todos, setTodos] = useState<TodoItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTodayTodos = async () => {
      setLoading(true);
      setError(null);
      try {
        const plan: Plan | null = await getLatestHabitPlan();
        if (plan && plan.milestones && plan.start_date) {
          const today = new Date();
          // Set time to 00:00:00 to compare dates only
          today.setHours(0, 0, 0, 0);

          const startDate = new Date(plan.start_date);
          startDate.setHours(0, 0, 0, 0);

          const diffTime = today.getTime() - startDate.getTime();
          const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

          if (diffDays < 0) {
            setTodos([]); // Plan hasn't started yet
            return;
          }

          let dayCounter = 0;
          for (const milestone of plan.milestones) {
            const durationInDays = parseDurationToDays(milestone.duration);
            if (diffDays >= dayCounter && diffDays < dayCounter + durationInDays) {
              const todayTodos = milestone.daily_todos.map((todo, index) => ({
                ...todo,
                id: `${plan.start_date}-${dayCounter}-${index}`,
                completed: false,
              }));
              setTodos(todayTodos);
              return; // Found today's todos
            }
            dayCounter += durationInDays;
          }
          
          setTodos([]); // No todos found for today in any milestone
        } else {
          setTodos([]);
        }
      } catch (err) {
        setError('오늘의 할 일 목록을 불러오는 데 실패했습니다.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchTodayTodos();
  }, []);

  // Calculate achievement rate based on completed todos
  const achievementRate = todos.length > 0
    ? Math.round((todos.filter(t => t.completed).length / todos.length) * 10)
    : 0;

  // Handle todo toggle
  const handleTodoToggle = (todoId: string): void => {
    setTodos(prev =>
      prev.map(todo =>
        todo.id === todoId ? { ...todo, completed: !todo.completed } : todo
      )
    );
  };
  
  // Handle next button press
  const handleNext = (): void => {
    setCurrentStep('step2');
  };

  // Handle back from step 2
  const handleBackFromStep2 = (): void => {
    setCurrentStep('step1');
  };

  // Show step 2 screen
  if (currentStep === 'step2') {
    return <CreateDailyReportStep2Screen 
              onBack={handleBackFromStep2} 
              achievementScore={achievementRate} 
              todos={todos} 
           />;
  }

  const TodoList = () => {
    if (loading) {
      return <ActivityIndicator size="large" color={Colors[colorScheme ?? 'light'].tint} style={styles.centered} />;
    }
    if (error) {
      return <Text style={[styles.centered, styles.errorText]}>{error}</Text>;
    }
    if (todos.length === 0) {
      return <Text style={[styles.centered, { color: Colors[colorScheme ?? 'light'].text }]}>오늘의 할 일이 없습니다.</Text>;
    }

    return (
      <View style={styles.todoListContainer}>
        <Text style={[styles.todoListTitle, { color: Colors[colorScheme ?? 'light'].text }]}>
          오늘의 할 일 목록
        </Text>
        <ScrollView style={styles.todoScrollView} showsVerticalScrollIndicator={false}>
          {todos.map((todo) => (
            <TouchableOpacity
              key={todo.id}
              style={styles.todoItem}
              onPress={() => handleTodoToggle(todo.id)}
            >
              <View style={[
                styles.todoCheckbox,
                todo.completed && [styles.todoCheckedBox, { backgroundColor: Colors[colorScheme ?? 'light'].tint }]
              ]}>
                {todo.completed && <Text style={styles.checkmark}>✓</Text>}
              </View>
              <Text 
                style={[
                  styles.todoText,
                  { color: Colors[colorScheme ?? 'light'].text },
                  todo.completed && styles.todoTextCompleted
                ]}
                numberOfLines={2}
                ellipsizeMode="tail"
              >
                {todo.description}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    );
  };

  const AchievementRateDisplay = () => {
    return (
      <View style={styles.achievementContainer}>
        <Text style={[styles.achievementTitle, { color: Colors[colorScheme ?? 'light'].text }]}>
          오늘의 달성률
        </Text>
        <View style={styles.achievementDisplay}>
          <Text style={[styles.achievementValue, { color: getAchievementColor(achievementRate) }]}>
            {achievementRate}
          </Text>
          <Text style={[styles.achievementTotal, { color: Colors[colorScheme ?? 'light'].text }]}>
            / 10
          </Text>
        </View>
      </View>
    );
  };

  return (
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
            오늘의 당신은 얼마만큼 힘냈나요?
          </Text>
        </View>

        {/* TodoList Context */}
        <TodoList />

        {/* Achievement Rate Display */}
        <AchievementRateDisplay />
      </ScrollView>

      {/* Next Button */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={styles.nextButton}
          onPress={handleNext}
        >
          <Text style={styles.nextButtonText}>
            Next
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
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    minHeight: 150,
  },
  errorText: {
    color: '#F44336',
    fontSize: 16,
    textAlign: 'center',
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
    paddingBottom: 32,
  },
  questionText: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    lineHeight: 32,
  },
  // TodoList Styles
  todoListContainer: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  todoListTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  todoScrollView: {
    maxHeight: 200,
  },
  todoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 12,
    marginBottom: 8,
  },
  todoCheckbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#ccc',
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  todoCheckedBox: {
    borderColor: 'transparent',
  },
  checkmark: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  todoText: {
    fontSize: 16,
    flex: 1,
  },
  todoTextCompleted: {
    textDecorationLine: 'line-through',
    opacity: 0.6,
  },
  // Achievement Rate Display Styles
  achievementContainer: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  achievementTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  achievementDisplay: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'center',
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
  // Button Styles
  buttonContainer: {
    paddingHorizontal: 24,
    paddingBottom: 40,
    paddingTop: 20,
  },
  nextButton: {
    borderRadius: 28,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    height: 56,
    backgroundColor: '#6c63ff', // App's purple theme color for consistency
  },
  nextButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
}); 