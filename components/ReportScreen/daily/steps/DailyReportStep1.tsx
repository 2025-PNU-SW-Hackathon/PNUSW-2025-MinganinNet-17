import * as Haptics from 'expo-haptics';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { getActivePlan } from '../../../../backend/supabase/habits';
import { Colors } from '../../../../constants/Colors';
import { useColorScheme } from '../../../../hooks/useColorScheme';
import { DailyTodo, Plan } from '../../../../types/habit';

interface DailyReportStep1Props {
  onComplete: (todos: DailyTodo[], achievementScore: number) => void;
  onBack: () => void;
}

// Animated Todo Item Component
interface AnimatedTodoItemProps {
  todo: DailyTodo;
  isCompleted: boolean;
  onToggle: () => void;
  colorScheme: string;
}

const AnimatedTodoItem = ({ todo, isCompleted, onToggle, colorScheme }: AnimatedTodoItemProps) => {
  const scaleAnimation = useRef(new Animated.Value(1)).current;
  const checkmarkScale = useRef(new Animated.Value(isCompleted ? 1 : 0)).current;
  const textOpacity = useRef(new Animated.Value(isCompleted ? 0.6 : 1)).current;

  const handlePress = () => {
    // Haptic feedback
    if (!isCompleted) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }

    // Scale animation for the whole item
    Animated.sequence([
      Animated.spring(scaleAnimation, { toValue: 1.05, useNativeDriver: true, tension: 300, friction: 8 }),
      Animated.spring(scaleAnimation, { toValue: 1, useNativeDriver: true, tension: 300, friction: 8 })
    ]).start();

    // Checkmark and text animations
    if (!isCompleted) {
      Animated.parallel([
        Animated.spring(checkmarkScale, { toValue: 1, useNativeDriver: true, tension: 300, friction: 6 }),
        Animated.timing(textOpacity, { toValue: 0.6, duration: 200, useNativeDriver: true })
      ]).start();
    } else {
      Animated.parallel([
        Animated.spring(checkmarkScale, { toValue: 0, useNativeDriver: true, tension: 300, friction: 6 }),
        Animated.timing(textOpacity, { toValue: 1, duration: 200, useNativeDriver: true })
      ]).start();
    }

    onToggle();
  };

  return (
    <Animated.View style={[{ transform: [{ scale: scaleAnimation }] }]}>
      <TouchableOpacity style={styles.todoItem} onPress={handlePress} activeOpacity={0.8}>
        <View style={[
          styles.todoCheckbox,
          isCompleted && [styles.todoCheckedBox, { backgroundColor: Colors[colorScheme as keyof typeof Colors].tint }]
        ]}>
          <Animated.Text style={[styles.checkmark, { transform: [{ scale: checkmarkScale }], opacity: checkmarkScale }]}>
            ✓
          </Animated.Text>
        </View>
        <Animated.Text style={[
          styles.todoText,
          { color: Colors[colorScheme as keyof typeof Colors].text },
          isCompleted && styles.todoTextCompleted,
          { opacity: textOpacity }
        ]} numberOfLines={2} ellipsizeMode="tail">
          {todo.description}
        </Animated.Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

const parseDurationToDays = (duration: string): number => {
  if (duration.includes('개월')) return parseInt(duration) * 30;
  if (duration.includes('주')) return parseInt(duration) * 7;
  if (duration.includes('일')) return parseInt(duration);
  return 0;
};

const getAchievementColor = (score: number): string => {
  if (score >= 9) return '#4CAF50';
  if (score >= 7) return '#8BC34A';
  if (score >= 5) return '#FF9800';
  return '#F44336';
};

export default function DailyReportStep1({ onComplete, onBack }: DailyReportStep1Props) {
  const colorScheme = useColorScheme();
  const [todos, setTodos] = useState<DailyTodo[]>([]);
  const [todoCompletion, setTodoCompletion] = useState<{ [key: string]: boolean }>({});
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTodayTodos = async () => {
      setLoading(true);
      setError(null);
      try {
        const plan: Plan | null = await getActivePlan();
        console.log('🔍 DailyReportStep1: Fetched plan:', plan ? 'Found' : 'Not found');
        
        if (plan && plan.milestones && plan.start_date) {
          console.log('📅 Plan start date:', plan.start_date);
          console.log('📊 Plan has', plan.milestones.length, 'milestones');
          const today = new Date();
          today.setHours(0, 0, 0, 0);

          const startDate = new Date(plan.start_date);
          startDate.setHours(0, 0, 0, 0);

          const diffDays = Math.floor((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
          console.log('📊 Days difference:', diffDays);

          if (diffDays < 0) {
            console.log('⚠️ Plan starts in the future, no todos for today');
            setTodos([]);
            return;
          }

          let dayCounter = 0;
          for (const milestone of plan.milestones) {
            const durationInDays = parseDurationToDays(milestone.duration);
            console.log(`🎯 Checking milestone "${milestone.title}": days ${dayCounter}-${dayCounter + durationInDays - 1}`);
            
            if (diffDays >= dayCounter && diffDays < dayCounter + durationInDays) {
              console.log(`✅ Found matching milestone with ${milestone.daily_todos.length} todos`);
              setTodos(milestone.daily_todos);
              
              const initialCompletion: { [key: string]: boolean } = {};
              milestone.daily_todos.forEach(todo => {
                initialCompletion[todo.id.toString()] = todo.is_completed;
              });
              setTodoCompletion(initialCompletion);
              return;
            }
            dayCounter += durationInDays;
          }
          console.log('❌ No matching milestone found for today, setting empty todos');
          setTodos([]);
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

  const achievementRate = todos.length > 0
    ? Math.round((Object.values(todoCompletion).filter(Boolean).length / todos.length) * 10)
    : 0;

  const handleTodoToggle = (todoId: number): void => {
    const todoKey = todoId.toString();
    setTodoCompletion(prev => ({ ...prev, [todoKey]: !prev[todoKey] }));
  };
  
  const handleNext = (): void => {
    const completedTodos = todos.map(t => ({
      ...t,
      is_completed: todoCompletion[t.id.toString()]
    }));
    onComplete(completedTodos, achievementRate);
  };

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
            <AnimatedTodoItem
              key={todo.id}
              todo={todo}
              isCompleted={todoCompletion[todo.id.toString()]}
              onToggle={() => handleTodoToggle(todo.id)}
              colorScheme={colorScheme ?? 'light'}
            />
          ))}
        </ScrollView>
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
      </ScrollView>

      {/* Next Button */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.nextButton, { backgroundColor: Colors[colorScheme ?? 'light'].buttonPrimary }]}
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
  },
  nextButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
  },
});
