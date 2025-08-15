import React, { useRef } from 'react';
import {
    Animated,
    StyleSheet,
    TouchableOpacity,
    View
} from 'react-native';
import { DailyTodo } from '../../types/habit';

interface AnimatedTodoItemProps {
  todo: DailyTodo;
  isCompleted: boolean;
  onToggle: () => void;
}

const AnimatedTodoItem: React.FC<AnimatedTodoItemProps> = ({ 
  todo, 
  isCompleted, 
  onToggle 
}) => {
  const scaleAnimation = useRef(new Animated.Value(1)).current;
  const checkmarkScale = useRef(new Animated.Value(isCompleted ? 1 : 0)).current;
  const textOpacity = useRef(new Animated.Value(isCompleted ? 0.6 : 1)).current;

  const handlePress = () => {
    Animated.sequence([
      Animated.spring(scaleAnimation, { 
        toValue: 1.05, 
        useNativeDriver: true, 
        tension: 300, 
        friction: 8 
      }),
      Animated.spring(scaleAnimation, { 
        toValue: 1, 
        useNativeDriver: true, 
        tension: 300, 
        friction: 8 
      })
    ]).start();

    if (!isCompleted) {
      Animated.parallel([
        Animated.spring(checkmarkScale, { 
          toValue: 1, 
          useNativeDriver: true, 
          tension: 300, 
          friction: 6 
        }),
        Animated.timing(textOpacity, { 
          toValue: 0.6, 
          duration: 200, 
          useNativeDriver: true 
        })
      ]).start();
    } else {
      Animated.parallel([
        Animated.spring(checkmarkScale, { 
          toValue: 0, 
          useNativeDriver: true, 
          tension: 300, 
          friction: 6 
        }),
        Animated.timing(textOpacity, { 
          toValue: 1, 
          duration: 200, 
          useNativeDriver: true 
        })
      ]).start();
    }
    onToggle();
  };

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnimation }] }}>
      <TouchableOpacity 
        style={styles.todoItem} 
        onPress={handlePress} 
        activeOpacity={0.8}
      >
        <View style={[
          styles.todoCheckbox, 
          isCompleted && styles.todoCheckedBox
        ]}>
          <Animated.Text 
            style={[
              styles.checkmarkText, 
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
            isCompleted && styles.todoTextCompleted, 
            { opacity: textOpacity }
          ]} 
          numberOfLines={2} 
          ellipsizeMode="tail"
        >
          {todo.description}
        </Animated.Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  todoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#4a4a60'
  },
  todoCheckbox: {
    width: 16,
    height: 16,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#a9a9c2',
    marginRight: 10,
    justifyContent: 'center',
    alignItems: 'center'
  },
  todoCheckedBox: {
    backgroundColor: '#6c63ff',
    borderColor: '#6c63ff'
  },
  checkmarkText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: 'bold'
  },
  todoText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#ffffff',
    flex: 1,
    fontFamily: 'Inter'
  },
  todoTextCompleted: {
    textDecorationLine: 'line-through',
    color: '#a9a9c2'
  }
});

export default AnimatedTodoItem;
