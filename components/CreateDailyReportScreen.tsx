import * as Haptics from 'expo-haptics';
import { useRef, useState } from 'react';
import { Animated, SafeAreaView, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors } from '../constants/Colors';
import { useColorScheme } from '../hooks/useColorScheme';
import CreateDailyReportStep2Screen from './CreateDailyReportStep2Screen';
import ScreenTransitionManager from './ScreenTransitionManager';

interface CreateDailyReportScreenProps {
  onBack: () => void;
}

interface TodoItem {
  id: string;
  title: string;
  completed: boolean;
  date: string;
}

// Animated Todo Item Component for CreateDailyReportScreen
interface AnimatedTodoItemProps {
  todo: TodoItem;
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
      Animated.spring(scaleAnimation, {
        toValue: 1.05,
        useNativeDriver: true,
        tension: 300,
        friction: 8,
      }),
      Animated.spring(scaleAnimation, {
        toValue: 1,
        useNativeDriver: true,
        tension: 300,
        friction: 8,
      })
    ]).start();

    // Checkmark and text animations
    if (!isCompleted) {
      // Completing task
      Animated.parallel([
        Animated.spring(checkmarkScale, {
          toValue: 1,
          useNativeDriver: true,
          tension: 300,
          friction: 6,
        }),
        Animated.timing(textOpacity, {
          toValue: 0.6,
          duration: 200,
          useNativeDriver: true,
        })
      ]).start();
    } else {
      // Uncompleting task
      Animated.parallel([
        Animated.spring(checkmarkScale, {
          toValue: 0,
          useNativeDriver: true,
          tension: 300,
          friction: 6,
        }),
        Animated.timing(textOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        })
      ]).start();
    }

    onToggle();
  };

  return (
    <Animated.View style={[{ transform: [{ scale: scaleAnimation }] }]}>
      <TouchableOpacity
        style={styles.todoItem}
        onPress={handlePress}
        activeOpacity={0.8}
      >
        <View style={[
          styles.todoCheckbox,
          isCompleted && [styles.todoCheckedBox, { backgroundColor: Colors[colorScheme as keyof typeof Colors].tint }]
        ]}>
          <Animated.Text 
            style={[
              styles.checkmark,
              { 
                transform: [{ scale: checkmarkScale }],
                opacity: checkmarkScale
              }
            ]}
          >
            ✓
          </Animated.Text>
        </View>
        <Animated.Text 
          style={[
            styles.todoText,
            { color: Colors[colorScheme as keyof typeof Colors].text },
            isCompleted && styles.todoTextCompleted,
            { opacity: textOpacity }
          ]}
          numberOfLines={2}
          ellipsizeMode="tail"
        >
          {todo.title}
        </Animated.Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

// Achievement score color mapping (same as calendar logic)
const getAchievementColor = (score: number): string => {
  if (score >= 9) return '#4CAF50';        // Green (90%+)
  if (score >= 7) return '#8BC34A';        // Light Green (70%+)
  if (score >= 5) return '#FF9800';        // Orange (50%+)
  return '#F44336';                        // Red (below 50%)
};

// Generate today's todo data
const generateTodayTodos = (): TodoItem[] => {
  const today = new Date().toISOString().split('T')[0];
  const todoTemplates = [
    '1챕터 초고 작성',
    '아이디어 노트 정리', 
    '참고 자료 조사',
    '캐릭터 설정 다듬기',
    '플롯 구성 검토',
    '아침 독서 10분',
    '영어 단어 암기',
    '운동 30분'
  ];

  const todos: TodoItem[] = [];
  const todoCount = 5; // Fixed number of todos for today
  
  for (let i = 0; i < todoCount; i++) {
    todos.push({
      id: `today-${i}`,
      title: todoTemplates[i % todoTemplates.length],
      completed: Math.random() > 0.4, // Random completion status
      date: today
    });
  }

  return todos;
};

export default function CreateDailyReportScreen({ onBack }: CreateDailyReportScreenProps) {
  const colorScheme = useColorScheme();
  const [currentStep, setCurrentStep] = useState<'step1' | 'step2'>('step1');
  const [achievementRate, setAchievementRate] = useState<number>(5);
  const [todoData, setTodoData] = useState<TodoItem[]>(generateTodayTodos());

  // Handle todo toggle
  const handleTodoToggle = (todoId: string): void => {
    setTodoData((prev: TodoItem[]) => 
      prev.map((todo: TodoItem) => 
        todo.id === todoId ? { ...todo, completed: !todo.completed } : todo
      )
    );
  };

  // Handle achievement rate change
  const handleRateChange = (rate: number): void => {
    setAchievementRate(rate);
  };

  // Handle next button press
  const handleNext = (): void => {
    setCurrentStep('step2');
  };

  // Handle back from step 2
  const handleBackFromStep2 = (): void => {
    setCurrentStep('step1');
  };

  // Render function for step content
  const renderStep = () => {
    switch (currentStep) {
      case 'step2':
        return <CreateDailyReportStep2Screen onBack={handleBackFromStep2} achievementScore={achievementRate} />;
      case 'step1':
      default:
        return <CreateDailyReportStep1Content />;
    }
  };

  // Step 1 Content Component
  const CreateDailyReportStep1Content = () => (
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

        {/* Achievement Rate Slider */}
        <AchievementRateSlider />
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

  const TodoList = () => {
    return (
      <View style={styles.todoListContainer}>
        <Text style={[styles.todoListTitle, { color: Colors[colorScheme ?? 'light'].text }]}>
          오늘의 할 일 목록
        </Text>
        <ScrollView style={styles.todoScrollView} showsVerticalScrollIndicator={false}>
          {todoData.map((todo) => (
            <AnimatedTodoItem
              key={todo.id}
              todo={todo}
              isCompleted={todo.completed}
              onToggle={() => handleTodoToggle(todo.id)}
              colorScheme={colorScheme ?? 'light'}
            />
          ))}
        </ScrollView>
      </View>
    );
  };

  const AchievementRateSlider = () => {
    const handleBarPress = (index: number) => {
      setAchievementRate(index);
    };

    return (
      <View style={styles.achievementContainer}>
        <Text style={[styles.achievementTitle, { color: Colors[colorScheme ?? 'light'].text }]}>
          달성률 평가
        </Text>
        
        <View style={styles.sliderContainer}>
          <View style={styles.barsContainer}>
            {Array.from({ length: 10 }, (_, index) => {
              const isActive = index < achievementRate;
              const barColor = isActive ? getAchievementColor(achievementRate) : 'rgba(0, 0, 0, 0.1)';
              
              return (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.achievementBar,
                    { 
                      backgroundColor: barColor,
                      height: 40 + (index * 8) // Progressive height increase
                    }
                  ]}
                  onPress={() => handleBarPress(index + 1)}
                />
              );
            })}
          </View>
          
          <Text style={[styles.achievementValue, { color: Colors[colorScheme ?? 'light'].text }]}>
            {achievementRate} / 10
          </Text>
        </View>
      </View>
    );
  };

  return (
    <ScreenTransitionManager
      screenKey={currentStep}
      direction={currentStep === 'step2' ? 'forward' : 'backward'}
      onTransitionComplete={() => {
        console.log('Daily report step transition completed:', currentStep);
      }}
    >
      {renderStep()}
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
  // Achievement Rate Slider Styles
  achievementContainer: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  achievementTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 24,
    textAlign: 'center',
  },
  sliderContainer: {
    alignItems: 'center',
  },
  barsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    width: '100%',
    maxWidth: 280,
    height: 120,
    marginBottom: 20,
  },
  achievementBar: {
    flex: 1,
    marginHorizontal: 2,
    borderRadius: 6,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  achievementValue: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 8,
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