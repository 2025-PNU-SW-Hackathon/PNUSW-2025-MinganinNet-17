import React, { useEffect, useRef, useState } from 'react';
import { Dimensions, StyleSheet, View } from 'react-native';
import Animated, {
    Easing,
    runOnJS,
    useAnimatedStyle,
    useSharedValue,
    withTiming,
} from 'react-native-reanimated';
import { AnimationConfig } from '../constants/AnimationConfig';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export type TransitionDirection = 'forward' | 'backward';

interface ScreenTransitionManagerProps {
  children: React.ReactNode;
  screenKey: string;
  direction?: TransitionDirection;
  onTransitionComplete?: () => void;
}

interface ScreenState {
  key: string;
  component: React.ReactNode;
  isExiting: boolean;
  direction: TransitionDirection;
}

export default function ScreenTransitionManager({
  children,
  screenKey,
  direction = 'forward',
  onTransitionComplete,
}: ScreenTransitionManagerProps) {
  const [screens, setScreens] = useState<ScreenState[]>([]);
  const prevScreenKey = useRef<string>(screenKey);
  const animationCount = useRef(0);

  useEffect(() => {
    if (!AnimationConfig.ENABLE_SCREEN_TRANSITIONS) {
      return;
    }
    const screenChanged = prevScreenKey.current !== screenKey;
    
    if (screenChanged) {
      // Mark previous screen as exiting
      setScreens(prevScreens => {
        const updatedScreens = prevScreens.map(screen => ({
          ...screen,
          isExiting: true,
        }));
        
        // Add new screen
        const newScreen: ScreenState = {
          key: screenKey,
          component: children,
          isExiting: false,
          direction,
        };
        
        return [...updatedScreens, newScreen];
      });
      
      // Clean up old screens after animation
      const cleanup = () => {
        setTimeout(() => {
          setScreens(prevScreens => 
            prevScreens.filter(screen => !screen.isExiting)
          );
        }, AnimationConfig.TRANSITION_DURATION + 50);
      };
      
      cleanup();
    } else {
      // Update current screen content
      setScreens(prevScreens => {
        if (prevScreens.length === 0) {
          return [{
            key: screenKey,
            component: children,
            isExiting: false,
            direction,
          }];
        }
        
        return prevScreens.map(screen => 
          screen.key === screenKey 
            ? { ...screen, component: children, direction }
            : screen
        );
      });
    }
    
    prevScreenKey.current = screenKey;
  }, [screenKey, children, direction]);

  if (!AnimationConfig.ENABLE_SCREEN_TRANSITIONS) {
    return <View style={styles.container}>{children}</View>;
  }

  const handleAnimationComplete = () => {
    animationCount.current++;
    if (animationCount.current >= 2 && onTransitionComplete) {
      // Both enter and exit animations completed
      onTransitionComplete();
      animationCount.current = 0;
    }
  };

  return (
    <View style={styles.container}>
      {screens.map((screen) => (
        <AnimatedScreen
          key={screen.key}
          screenKey={screen.key}
          isExiting={screen.isExiting}
          direction={screen.direction}
          onAnimationComplete={handleAnimationComplete}
        >
          {screen.component}
        </AnimatedScreen>
      ))}
    </View>
  );
}

interface AnimatedScreenProps {
  children: React.ReactNode;
  screenKey: string;
  isExiting: boolean;
  direction: TransitionDirection;
  onAnimationComplete: () => void;
}

function AnimatedScreen({
  children,
  screenKey,
  isExiting,
  direction,
  onAnimationComplete,
}: AnimatedScreenProps) {
  // Calculate initial and target positions based on direction
  const getInitialPosition = () => {
    if (isExiting) return 0; // Exiting screen starts at center
    return direction === 'forward' ? SCREEN_WIDTH : -SCREEN_WIDTH; // Forward: from right, Backward: from left
  };
  
  const getTargetPosition = () => {
    if (!isExiting) return 0; // Entering screen ends at center
    return direction === 'forward' ? -SCREEN_WIDTH : SCREEN_WIDTH; // Forward: to left, Backward: to right
  };

  const translateX = useSharedValue(getInitialPosition());
  const opacity = useSharedValue(isExiting ? 1 : AnimationConfig.FADE_OPACITY);

  useEffect(() => {
    if (isExiting) {
      // Screen is exiting
      translateX.value = withTiming(
        getTargetPosition(),
        {
          duration: AnimationConfig.TRANSITION_DURATION,
          easing: Easing.bezier(0.55, 0.06, 0.68, 0.19), // easeInQuad
        },
        (finished) => {
          if (finished) {
            runOnJS(onAnimationComplete)();
          }
        }
      );
      
      opacity.value = withTiming(AnimationConfig.FADE_OPACITY, {
        duration: AnimationConfig.TRANSITION_DURATION * 0.6,
        easing: Easing.in(Easing.quad),
      });
    } else {
      // Screen is entering
      translateX.value = withTiming(
        0,
        {
          duration: AnimationConfig.TRANSITION_DURATION,
          easing: Easing.bezier(0.25, 0.46, 0.45, 0.94), // easeOutQuad
        },
        (finished) => {
          if (finished) {
            runOnJS(onAnimationComplete)();
          }
        }
      );
      
      opacity.value = withTiming(1, {
        duration: AnimationConfig.TRANSITION_DURATION * 0.8,
        easing: Easing.out(Easing.quad),
      });
    }
  }, [isExiting, direction]);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: translateX.value }],
      opacity: opacity.value,
    };
  });

  return (
    <Animated.View style={[styles.screenContent, animatedStyle]}>
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1c1c2e', // Stable background color
  },
  screenContent: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: SCREEN_WIDTH,
  },
}); 