import React, { useEffect, useRef } from 'react';
import {
    Animated,
    StyleSheet,
    Text,
    TextStyle,
    TouchableOpacity,
    View,
    ViewStyle,
} from 'react-native';

interface AnimatedButtonProps {
  title: string;
  onPress: () => void;
  isLoading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  loadingText?: string;
  variant?: 'primary' | 'secondary';
}

export const AnimatedButton: React.FC<AnimatedButtonProps> = ({
  title,
  onPress,
  isLoading = false,
  disabled = false,
  style,
  textStyle,
  loadingText = '로딩 중...',
  variant = 'primary',
}) => {
  const pulseAnimation = useRef(new Animated.Value(1)).current;
  const scaleAnimation = useRef(new Animated.Value(1)).current;
  const opacityAnimation = useRef(new Animated.Value(1)).current;

  // Pulse animation for loading state
  useEffect(() => {
    if (isLoading) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnimation, {
            toValue: 0.85,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnimation, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();
      
      return () => pulse.stop();
    } else {
      pulseAnimation.setValue(1);
    }
  }, [isLoading]);

  // Disabled state animation
  useEffect(() => {
    Animated.timing(opacityAnimation, {
      toValue: disabled ? 0.6 : 1,
      duration: 200,
      useNativeDriver: true,
    }).start();
  }, [disabled]);

  const handlePress = () => {
    if (disabled || isLoading) return;

    // Press animation
    Animated.sequence([
      Animated.timing(scaleAnimation, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnimation, {
        toValue: 1,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    onPress();
  };

  const buttonStyle = [
    styles.button,
    variant === 'secondary' && styles.secondaryButton,
    style,
  ];

  const buttonTextStyle = [
    styles.buttonText,
    variant === 'secondary' && styles.secondaryButtonText,
    textStyle,
  ];

  const displayText = isLoading ? loadingText : title;

  return (
    <TouchableOpacity
      style={buttonStyle}
      onPress={handlePress}
      disabled={disabled || isLoading}
      activeOpacity={0.8}
    >
      <Animated.View
        style={[
          styles.buttonContent,
          {
            transform: [
              { scale: scaleAnimation },
              { scale: isLoading ? pulseAnimation : 1 },
            ],
            opacity: opacityAnimation,
          },
        ]}
      >
        <Text style={buttonTextStyle}>{displayText}</Text>
        
        {/* Loading indicator dots */}
        {isLoading && (
          <Animated.View style={[styles.loadingDots, { opacity: pulseAnimation }]}>
            <LoadingDots />
          </Animated.View>
        )}
      </Animated.View>
    </TouchableOpacity>
  );
};

// Animated loading dots component
const LoadingDots: React.FC = () => {
  const dot1Animation = useRef(new Animated.Value(0.3)).current;
  const dot2Animation = useRef(new Animated.Value(0.3)).current;
  const dot3Animation = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const createDotAnimation = (animValue: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(animValue, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(animValue, {
            toValue: 0.3,
            duration: 400,
            useNativeDriver: true,
          }),
        ])
      );

    const animations = [
      createDotAnimation(dot1Animation, 0),
      createDotAnimation(dot2Animation, 200),
      createDotAnimation(dot3Animation, 400),
    ];

    animations.forEach(anim => anim.start());

    return () => {
      animations.forEach(anim => anim.stop());
    };
  }, []);

  return (
    <View style={styles.dotsContainer}>
      <Animated.View style={[styles.dot, { opacity: dot1Animation }]} />
      <Animated.View style={[styles.dot, { opacity: dot2Animation }]} />
      <Animated.View style={[styles.dot, { opacity: dot3Animation }]} />
    </View>
  );
};

const styles = StyleSheet.create({
  button: {
    backgroundColor: '#6c63ff',
    borderRadius: 28,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#6c63ff',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 2,
    borderColor: '#6c63ff',
    shadowOpacity: 0,
    elevation: 0,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    fontFamily: 'Inter',
  },
  secondaryButtonText: {
    color: '#6c63ff',
  },
  loadingDots: {
    marginLeft: 12,
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#ffffff',
    marginHorizontal: 2,
  },
}); 