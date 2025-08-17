import React, { memo, useCallback, useMemo, useRef } from 'react';
import {
  Animated,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { Colors } from '../../constants/Colors';
import { Spacing } from '../../constants/Spacing';
import { useColorScheme } from '../../hooks/useColorScheme';
import { DailyTodo } from '../../types/habit';

interface AnimatedTodoItemProps {
  todo: DailyTodo;
  isCompleted: boolean;
  onToggle: () => void;
}

const AnimatedTodoItem = memo(({ todo, isCompleted, onToggle }: AnimatedTodoItemProps) => {
  // Optimized: Combine related animations and reduce animated values
  const scaleAnimation = useRef(new Animated.Value(1)).current;
  const completionAnimation = useRef(new Animated.Value(isCompleted ? 1 : 0)).current;
  const pressAnimation = useRef(new Animated.Value(0)).current;

  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];

  const handlePress = useCallback(() => {
    // Optimized: Single press animation with native driver
    Animated.sequence([
      Animated.parallel([
        Animated.spring(scaleAnimation, {
          toValue: 0.98,
          useNativeDriver: true,
          tension: 300,
          friction: 7,
        }),
        Animated.timing(pressAnimation, {
          toValue: 1,
          duration: 100,
          useNativeDriver: true,
        }),
      ]),
      Animated.parallel([
        Animated.spring(scaleAnimation, {
          toValue: 1,
          useNativeDriver: true,
          tension: 300,
          friction: 8,
        }),
        Animated.timing(pressAnimation, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
      ])
    ]).start();

    // Optimized: Single completion animation
    Animated.timing(completionAnimation, {
      toValue: isCompleted ? 0 : 1,
      duration: 300,
      useNativeDriver: false, // Required for width/backgroundColor interpolations
    }).start();

    onToggle();
  }, [isCompleted, onToggle, scaleAnimation, pressAnimation, completionAnimation]);

  // Optimized: Cached interpolations using single animation value
  const animatedStyles = useMemo(() => ({
    checkboxBackgroundColor: completionAnimation.interpolate({
      inputRange: [0, 1],
      outputRange: ['transparent', colors.primary]
    }),
    checkboxBorderColor: completionAnimation.interpolate({
      inputRange: [0, 1],
      outputRange: [colors.textSecondary, colors.primary]
    }),
    checkmarkScale: completionAnimation.interpolate({
      inputRange: [0, 1],
      outputRange: [0, 1]
    }),
    textOpacity: completionAnimation.interpolate({
      inputRange: [0, 1],
      outputRange: [1, 0.6]
    }),
    strikethroughWidth: completionAnimation.interpolate({
      inputRange: [0, 1],
      outputRange: ['0%', '100%']
    }),
    pressElevation: pressAnimation.interpolate({
      inputRange: [0, 1],
      outputRange: [2, 6]
    })
  }), [completionAnimation, pressAnimation, colors]);

  const styles = createStyles(colors);

  return (
    <Animated.View 
      style={[
        styles.todoItemContainer,
        { 
          transform: [{ scale: scaleAnimation }],
          elevation: animatedStyles.pressElevation,
        }
      ]}
    >
      <TouchableOpacity
        style={styles.todoItem}
        onPress={handlePress}
        activeOpacity={0.9}
      >
        <Animated.View 
          style={[
            styles.todoCheckbox, 
            { 
              backgroundColor: animatedStyles.checkboxBackgroundColor,
              borderColor: animatedStyles.checkboxBorderColor,
            }
          ]}
        >
          <Animated.Text 
            style={[
              styles.checkmarkText,
              { 
                transform: [{ scale: animatedStyles.checkmarkScale }],
                opacity: animatedStyles.checkmarkScale
              }
            ]}
          >
            ✓
          </Animated.Text>
        </Animated.View>
        
        <View style={styles.todoTextContainer}>
          <Animated.Text 
            style={[
              styles.todoText, 
              isCompleted && styles.todoTextCompleted,
              { opacity: animatedStyles.textOpacity }
            ]} 
            numberOfLines={2} 
            ellipsizeMode="tail"
          >
            {todo.description}
          </Animated.Text>
          
          {/* Animated strikethrough line */}
          <Animated.View 
            style={[
              styles.strikethroughLine,
              {
                width: animatedStyles.strikethroughWidth,
                backgroundColor: colors.textSecondary,
              }
            ]}
          />
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}, (prevProps, nextProps) => {
  // Custom comparison for memo optimization
  return (
    prevProps.todo.id === nextProps.todo.id &&
    prevProps.todo.description === nextProps.todo.description &&
    prevProps.isCompleted === nextProps.isCompleted
  );
});

// Add display name for debugging
AnimatedTodoItem.displayName = 'AnimatedTodoItem';

const createStyles = (colors: typeof Colors.light) => StyleSheet.create({
  // Enhanced todo item container with elevation support
  todoItemContainer: {
    backgroundColor: 'transparent',
    borderRadius: Spacing.layout.borderRadius.md,
    marginVertical: Spacing.xs,
    // Shadow preparation for elevation animation
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: Spacing.sm,
    elevation: 1,
  },
  
  todoItem: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingVertical: Spacing.lg, 
    paddingHorizontal: Spacing.sm,
    borderBottomWidth: 1, 
    borderBottomColor: colors.neutral[100],
    backgroundColor: colors.card,
    borderRadius: Spacing.layout.borderRadius.md,
    // Enhanced spacing and alignment
    minHeight: 60,
  },
  
  // Enhanced checkbox with better proportions and styling
  todoCheckbox: { 
    width: 24, 
    height: 24, 
    borderRadius: Spacing.layout.borderRadius.sm, 
    borderWidth: 2.5, 
    marginRight: Spacing.lg, 
    justifyContent: 'center', 
    alignItems: 'center',
    // Enhanced shadow and styling
    shadowColor: colors.text,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  
  checkmarkText: { 
    color: '#ffffff', 
    fontSize: 14, 
    fontWeight: colors.typography.fontWeight.bold,
    lineHeight: 14,
  },
  
  // New text container for strikethrough effect
  todoTextContainer: {
    flex: 1,
    position: 'relative',
    justifyContent: 'center',
  },
  
  todoText: { 
    fontSize: colors.typography.fontSize.base, 
    fontWeight: colors.typography.fontWeight.medium, 
    color: colors.text, 
    fontFamily: 'Inter',
    lineHeight: colors.typography.fontSize.base * colors.typography.lineHeight.relaxed,
    // Remove default text decoration - we'll use custom animated line
  },
  
  todoTextCompleted: { 
    color: colors.textSecondary,
    // Remove textDecorationLine - using custom animated strikethrough
  },
  
  // Custom animated strikethrough line
  strikethroughLine: {
    position: 'absolute',
    height: 2,
    top: '50%',
    left: 0,
    borderRadius: 1,
    // Enhanced visual styling
    opacity: 0.8,
  },
});

export default AnimatedTodoItem;