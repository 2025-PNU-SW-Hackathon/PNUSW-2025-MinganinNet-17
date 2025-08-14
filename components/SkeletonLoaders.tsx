import React, { useEffect, useRef, memo } from 'react';
import { Animated, StyleSheet, View, ViewStyle } from 'react-native';

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

// Base Skeleton Component with Pulse Animation
const BaseSkeleton: React.FC<SkeletonProps> = ({ 
  width = '100%', 
  height = 20, 
  borderRadius = 4,
  style 
}) => {
  const pulseAnimation = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnimation, {
          toValue: 0.7,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnimation, {
          toValue: 0.3,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    
    pulse.start();
    
    return () => pulse.stop();
  }, []);

  return (
    <Animated.View
      style={[
        styles.skeleton,
        {
          width: width as any,
          height,
          borderRadius,
          opacity: pulseAnimation,
        },
        style,
      ]}
    />
  );
};

// Text Skeleton for Single Lines
export const SkeletonText: React.FC<SkeletonProps> = memo((props) => (
  <BaseSkeleton height={16} {...props} />
));

// Large Text Skeleton for Titles
export const SkeletonTitle: React.FC<SkeletonProps> = memo((props) => (
  <BaseSkeleton height={24} borderRadius={6} {...props} />
));

// Todo Item Skeleton
export const SkeletonTodo: React.FC = memo(() => (
  <View style={styles.todoContainer}>
    <BaseSkeleton width={16} height={16} borderRadius={4} style={styles.todoCheckbox} />
    <View style={styles.todoTextContainer}>
      <SkeletonText width="85%" />
      <SkeletonText width="60%" style={styles.todoSecondLine} />
    </View>
  </View>
));

// Card Skeleton for Coach/Achievement Cards
export const SkeletonCard: React.FC<{ type?: 'coach' | 'achievement' }> = memo(({ type = 'coach' }) => {
  const cardStyle = type === 'achievement' 
    ? [styles.cardContainer, styles.achievementCard]
    : styles.cardContainer;
    
  return (
    <View style={cardStyle}>
      <SkeletonTitle width="70%" style={styles.cardTitle} />
      {type === 'coach' ? (
        <View style={styles.coachContent}>
          <BaseSkeleton width={80} height={80} borderRadius={40} style={styles.coachEmoji} />
          <SkeletonText width="60%" style={styles.coachMessage} />
          <BaseSkeleton width={60} height={8} borderRadius={4} style={styles.coachIndicator} />
        </View>
      ) : (
        <View style={styles.achievementContent}>
          <View style={styles.scoreContainer}>
            <BaseSkeleton width={40} height={48} borderRadius={8} />
            <SkeletonText width={20} style={styles.scoreSlash} />
          </View>
          <BaseSkeleton width="80%" height={12} borderRadius={6} style={styles.progressBar} />
        </View>
      )}
    </View>
  );
});

// Button Skeleton for Loading States
export const SkeletonButton: React.FC<Omit<SkeletonProps, 'style'>> = memo((props) => (
  <BaseSkeleton 
    height={56} 
    borderRadius={28}
    style={styles.buttonSkeleton}
    {...props} 
  />
));

// Multiple Todo Skeletons
export const SkeletonTodoList: React.FC<{ count?: number }> = memo(({ count = 3 }) => (
  <View>
    {Array.from({ length: count }).map((_, index) => (
      <SkeletonTodo key={index} />
    ))}
  </View>
));

// Shimmer Line for Subtle Loading
export const SkeletonLine: React.FC<SkeletonProps> = memo((props) => (
  <BaseSkeleton height={1} borderRadius={0} {...props} />
));

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: '#3a3a50',
  },
  todoContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderBottomWidth: 1,
    borderBottomColor: '#4a4a60',
  },
  todoCheckbox: {
    marginRight: 12,
    marginTop: 2,
  },
  todoTextContainer: {
    flex: 1,
  },
  todoSecondLine: {
    marginTop: 4,
  },
  cardContainer: {
    backgroundColor: '#3a3a50',
    borderRadius: 16,
    padding: 20,
    minHeight: 250,
  },
  achievementCard: {
    minHeight: 200,
  },
  cardTitle: {
    marginBottom: 20,
  },
  coachContent: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  coachEmoji: {
    marginBottom: 16,
  },
  coachMessage: {
    marginBottom: 16,
  },
  coachIndicator: {
    marginTop: 8,
  },
  achievementContent: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  scoreContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  scoreSlash: {
    marginHorizontal: 8,
  },
  progressBar: {
    marginTop: 16,
  },
  buttonSkeleton: {
    backgroundColor: '#4a4a60',
  },
}); 