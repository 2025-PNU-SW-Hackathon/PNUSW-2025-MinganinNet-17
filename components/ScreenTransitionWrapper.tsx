import React, { useEffect, useRef } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import Animated, {
    Easing,
    runOnJS,
    useAnimatedStyle,
    useSharedValue,
    withTiming,
} from 'react-native-reanimated';
import { AnimationConfig, AnimationDirection } from '../constants/AnimationConfig';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface ScreenTransitionWrapperProps {
  children: React.ReactNode;
  screenKey: string;
  direction?: AnimationDirection;
  onAnimationComplete?: () => void;
  isActive?: boolean;
}

export default function ScreenTransitionWrapper({
  children,
  screenKey,
  direction = AnimationConfig.DIRECTION.SLIDE_IN,
  onAnimationComplete,
  isActive = true,
}: ScreenTransitionWrapperProps) {
  const translateX = useSharedValue(0);
  const opacity = useSharedValue(1);
  const prevScreenKey = useRef<string>(screenKey);

  useEffect(() => {
    if (!AnimationConfig.ENABLE_SCREEN_TRANSITIONS) {
      return;
    }
    // Detect screen change
    const screenChanged = prevScreenKey.current !== screenKey;
    
    if (screenChanged && isActive) {
      // Initialize animation based on direction
      if (direction === AnimationConfig.DIRECTION.SLIDE_IN) {
        // New screen slides in from right
        translateX.value = SCREEN_WIDTH;
        opacity.value = AnimationConfig.FADE_OPACITY;
        
        // Animate to center position
        translateX.value = withTiming(
          0,
          {
            duration: AnimationConfig.TRANSITION_DURATION,
            easing: Easing.bezier(0.25, 0.46, 0.45, 0.94), // easeOutQuad
          },
          (finished) => {
            if (finished && onAnimationComplete) {
              runOnJS(onAnimationComplete)();
            }
          }
        );
        
        opacity.value = withTiming(1, {
          duration: AnimationConfig.TRANSITION_DURATION * 0.8,
          easing: Easing.out(Easing.quad),
        });
      } else {
        // Current screen slides out to left
        translateX.value = withTiming(
          -SCREEN_WIDTH,
          {
            duration: AnimationConfig.TRANSITION_DURATION,
            easing: Easing.bezier(0.55, 0.06, 0.68, 0.19), // easeInQuad
          },
          (finished) => {
            if (finished && onAnimationComplete) {
              runOnJS(onAnimationComplete)();
            }
          }
        );
        
        opacity.value = withTiming(AnimationConfig.FADE_OPACITY, {
          duration: AnimationConfig.TRANSITION_DURATION * 0.6,
          easing: Easing.in(Easing.quad),
        });
      }
    }
    
    prevScreenKey.current = screenKey;
  }, [screenKey, direction, isActive, onAnimationComplete, translateX, opacity]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translateX.value }],
      opacity: opacity.value,
    };
  });

  if (!AnimationConfig.ENABLE_SCREEN_TRANSITIONS) {
    return <View style={styles.container}>{children}</View>;
  }

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.screenContent, animatedStyle]}>
        {children}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1c1c2e', // Stable background color
  },
  screenContent: {
    flex: 1,
    width: SCREEN_WIDTH,
  },
}); 