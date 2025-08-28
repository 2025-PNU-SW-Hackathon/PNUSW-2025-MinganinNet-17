import React, { useEffect, useRef } from 'react';
import { Dimensions, StyleSheet } from 'react-native';
import Animated, {
    Easing,
    runOnJS,
    useAnimatedStyle,
    useSharedValue,
    withTiming,
} from 'react-native-reanimated';
import { AnimationConfig } from '../constants/AnimationConfig';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export type TabTransitionDirection = 'left' | 'right' | 'none';

interface TabContentTransitionProps {
  children: React.ReactNode;
  screenKey: string;
  direction?: TabTransitionDirection;
  onTransitionComplete?: () => void;
  isActive?: boolean;
}

export default function TabContentTransition({
  children,
  screenKey,
  direction = 'none',
  onTransitionComplete,
  isActive = true,
}: TabContentTransitionProps) {
  const translateX = useSharedValue(0);
  const opacity = useSharedValue(1);
  const prevScreenKey = useRef<string>(screenKey);

  useEffect(() => {
    if (!AnimationConfig.ENABLE_SCREEN_TRANSITIONS || direction === 'none') {
      return;
    }

    const screenChanged = prevScreenKey.current !== screenKey;
    
    if (screenChanged && isActive) {
      // Determine slide direction and initial position
      const initialPosition = direction === 'right' ? SCREEN_WIDTH : -SCREEN_WIDTH;
      
      // Set initial position and opacity
      translateX.value = initialPosition;
      opacity.value = 0.7;
      
      // Animate to center position with smooth easing
      translateX.value = withTiming(
        0,
        {
          duration: AnimationConfig.TABS.CONTENT.DURATION,
          easing: Easing.bezier(...AnimationConfig.TABS.CONTENT.EASING),
        },
        (finished) => {
          if (finished && onTransitionComplete) {
            runOnJS(onTransitionComplete)();
          }
        }
      );
      
      // Fade in opacity slightly after slide begins
      opacity.value = withTiming(1, {
        duration: AnimationConfig.TABS.CONTENT.OPACITY_DURATION,
        easing: Easing.out(Easing.quad),
      });
    }
    
    prevScreenKey.current = screenKey;
  }, [screenKey, direction, isActive, onTransitionComplete, translateX, opacity]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translateX.value }],
      opacity: opacity.value,
    };
  });

  if (!AnimationConfig.ENABLE_SCREEN_TRANSITIONS || direction === 'none') {
    return <Animated.View style={styles.container}>{children}</Animated.View>;
  }

  return (
    <Animated.View style={[styles.container, styles.animated, animatedStyle]}>
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  animated: {
    width: SCREEN_WIDTH,
  },
});