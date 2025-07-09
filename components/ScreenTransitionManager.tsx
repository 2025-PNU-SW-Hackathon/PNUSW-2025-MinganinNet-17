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

interface ScreenTransitionManagerProps {
  children: React.ReactNode;
  screenKey: string;
  onTransitionComplete?: () => void;
}

interface ScreenState {
  key: string;
  component: React.ReactNode;
  isExiting: boolean;
}

export default function ScreenTransitionManager({
  children,
  screenKey,
  onTransitionComplete,
}: ScreenTransitionManagerProps) {
  const [screens, setScreens] = useState<ScreenState[]>([]);
  const prevScreenKey = useRef<string>(screenKey);
  const animationCount = useRef(0);

  // If animations are disabled, render children directly
  if (!AnimationConfig.ENABLE_SCREEN_TRANSITIONS) {
    return <View style={styles.container}>{children}</View>;
  }

  useEffect(() => {
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
          }];
        }
        
        return prevScreens.map(screen => 
          screen.key === screenKey 
            ? { ...screen, component: children }
            : screen
        );
      });
    }
    
    prevScreenKey.current = screenKey;
  }, [screenKey, children]);

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
  onAnimationComplete: () => void;
}

function AnimatedScreen({
  children,
  screenKey,
  isExiting,
  onAnimationComplete,
}: AnimatedScreenProps) {
  const translateX = useSharedValue(isExiting ? 0 : SCREEN_WIDTH);
  const opacity = useSharedValue(isExiting ? 1 : AnimationConfig.FADE_OPACITY);

  useEffect(() => {
    if (isExiting) {
      // Screen is exiting - slide out to left
      translateX.value = withTiming(
        -SCREEN_WIDTH,
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
      // Screen is entering - slide in from right
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
  }, [isExiting]);

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