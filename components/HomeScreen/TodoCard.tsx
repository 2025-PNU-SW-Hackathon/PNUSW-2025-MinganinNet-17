import React from 'react';
import {
  Animated,
  ScrollView,
  StyleSheet,
  Text,
  View
} from 'react-native';
import { Colors } from '../../constants/Colors';
import { Spacing } from '../../constants/Spacing';
import { useColorScheme } from '../../hooks/useColorScheme';
import { DailyTodo, DailyTodoInstance } from '../../types/habit';
import { SkeletonTodoList } from '../SkeletonLoaders';
import AnimatedTodoItem from './AnimatedTodoItem';

interface TodoCardProps {
  loading: boolean;
  error: string | null;
  todosForSelectedDate: (DailyTodo | DailyTodoInstance)[];
  todoCompletion: { [key: string]: boolean };
  todoFadeAnimation: Animated.Value;
  progressStats: {
    completed: number;
    total: number;
    percentage: number;
    isComplete: boolean;
  };
  progressBarAnimation: Animated.Value;
  completionGlow: Animated.Value;
  onTodoToggle: (todoId: string | number) => void;
}

const TodoCard: React.FC<TodoCardProps> = ({
  loading,
  error,
  todosForSelectedDate,
  todoCompletion,
  todoFadeAnimation,
  progressStats,
  progressBarAnimation,
  completionGlow,
  onTodoToggle
}) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const styles = createStyles(colors);

  return (
    <View style={styles.todoCardHeader}>
      <Text style={[styles.cardTitle, progressStats.isComplete && styles.cardTitleComplete]}>
        Today's To-Do
      </Text>
      
      {progressStats.total > 0 && (
        <View style={styles.progressContainer}>
          <Text style={styles.progressText}>
            {progressStats.completed}/{progressStats.total}
          </Text>
          <View style={styles.progressBarContainer}>
            <Animated.View 
              style={[
                styles.progressBar,
                {
                  width: progressBarAnimation.interpolate({
                    inputRange: [0, 100],
                    outputRange: ['0%', '100%'],
                    extrapolate: 'clamp'
                  }),
                  backgroundColor: progressStats.isComplete ? colors.success : colors.primary,
                }
              ]}
            />
            
            {/* Completion glow effect */}
            {progressStats.isComplete && (
              <Animated.View 
                style={[
                  styles.progressGlow,
                  {
                    opacity: completionGlow,
                    backgroundColor: colors.success,
                  }
                ]}
              />
            )}
          </View>
          
          {progressStats.isComplete && (
            <View style={styles.completionBadge}>
              <Text style={styles.completionText}>🎉 Perfect!</Text>
            </View>
          )}
        </View>
      )}
      
      <ScrollView style={styles.todoScrollView} showsVerticalScrollIndicator={false}>
        {loading ? (
          <SkeletonTodoList count={3} />
        ) : error ? (
          <Text style={styles.emptyTodoText}>{error}</Text>
        ) : todosForSelectedDate.length > 0 ? (
          <Animated.View style={{ opacity: todoFadeAnimation }}>
            {todosForSelectedDate.map((todo) => {
              const todoKey = todo.id.toString();
              const isCompleted = todoCompletion[todoKey];
              return (
                <AnimatedTodoItem
                  key={todo.id}
                  todo={todo}
                  isCompleted={isCompleted}
                  onToggle={() => onTodoToggle(todo.id)}
                />
              );
            })}
          </Animated.View>
        ) : (
          <Animated.View style={[styles.emptyTodoContainer, { opacity: todoFadeAnimation }]}>
            <Text style={styles.emptyTodoText}>오늘의 할 일이 없습니다.</Text>
          </Animated.View>
        )}
      </ScrollView>
    </View>
  );
};

const createStyles = (colors: typeof Colors.light) => StyleSheet.create({
  // Todo card header with progress
  todoCardHeader: {
    marginBottom: Spacing.lg,
    flex: 1,
  },
  
  cardTitle: { 
    fontSize: colors.typography.fontSize.lg, 
    fontWeight: colors.typography.fontWeight.bold, 
    color: colors.text, 
    fontFamily: 'Inter',
    letterSpacing: colors.typography.letterSpacing.wide,
  },
  
  cardTitleComplete: {
    color: colors.success,
  },
  
  // Progress container and elements
  progressContainer: {
    marginTop: Spacing.md,
    alignItems: 'flex-end',
  },
  
  progressText: {
    fontSize: colors.typography.fontSize.sm,
    color: colors.textSecondary,
    fontWeight: colors.typography.fontWeight.medium,
    fontFamily: 'Inter',
    marginBottom: Spacing.xs,
  },
  
  progressBarContainer: {
    width: '100%',
    height: 6,
    backgroundColor: colors.neutral[200],
    borderRadius: 3,
    overflow: 'hidden',
    position: 'relative',
    marginBottom: Spacing.xs,
  },
  
  progressBar: {
    height: '100%',
    borderRadius: 3,
    // Smooth transitions
    transition: 'width 0.8s ease-in-out',
  },
  
  // Glow effect for completion
  progressGlow: {
    position: 'absolute',
    top: -2,
    left: -2,
    right: -2,
    bottom: -2,
    borderRadius: 5,
    // Subtle glow effect
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
  },
  
  // Completion badge
  completionBadge: {
    backgroundColor: colors.success,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: Spacing.layout.borderRadius.full,
    alignSelf: 'flex-end',
  },
  
  completionText: {
    color: '#ffffff',
    fontSize: colors.typography.fontSize.sm,
    fontWeight: colors.typography.fontWeight.bold,
    fontFamily: 'Inter',
  },
  
  todoScrollView: { flex: 1 },
  
  emptyTodoContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyTodoText: { fontSize: 14, color: colors.textSecondary, fontFamily: 'Inter' },
});

export default TodoCard;
