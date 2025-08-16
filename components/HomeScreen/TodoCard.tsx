import React from 'react';
import {
  Animated,
  ScrollView,
  StyleSheet,
  Text,
  View
} from 'react-native';
import { DailyTodoInstance } from '../../types/habit';
import { SkeletonTodoList } from '../SkeletonLoaders';
import AnimatedTodoItem from './AnimatedTodoItem';

interface TodoCardProps {
  loading: boolean;
  error: string | null;
  todosForSelectedDate: DailyTodoInstance[];
  todoCompletion: { [key: string]: boolean };
  todoFadeAnimation: Animated.Value;
  onTodoToggle: (todoId: string) => Promise<void>;
}

const TodoCard: React.FC<TodoCardProps> = ({
  loading,
  error,
  todosForSelectedDate,
  todoCompletion,
  todoFadeAnimation,
  onTodoToggle
}) => {
  return (
    <View style={styles.todoCard}>
      <Text style={styles.cardTitle}>Today&apos;s To-Do</Text>
      <ScrollView style={styles.todoScrollView} showsVerticalScrollIndicator={false}>
        {loading ? ( //  1 : 로딩중
          <SkeletonTodoList count={3} />
        ) : error ? (  // 2 : 에러
          <Text style={styles.emptyTodoText}>{error}</Text>
        ) : todosForSelectedDate.length > 0 ? ( // 3 : 데이터가 있음
          <Animated.View style={{ opacity: todoFadeAnimation }}>
            {todosForSelectedDate.map((todo) => {
              const isCompleted = todoCompletion[todo.id];
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
        ) : ( // 4 : 데이터가 없음
          <Animated.View style={[styles.emptyTodoContainer, { opacity: todoFadeAnimation }]}>
            <Text style={styles.emptyTodoText}>오늘의 할 일이 없습니다.</Text>
          </Animated.View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  todoCard: {
    flex: 1,
    backgroundColor: '#3a3a50',
    borderRadius: 16,
    padding: 20,
    marginLeft: 10,
    minHeight: 250
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 15,
    fontFamily: 'Inter'
  },
  todoScrollView: {
    flex: 1
  },
  emptyTodoContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  },
  emptyTodoText: {
    fontSize: 14,
    color: '#a9a9c2',
    fontFamily: 'Inter'
  }
});

export default TodoCard;
