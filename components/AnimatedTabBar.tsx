import React, { useEffect, useRef } from 'react';
import { Dimensions, StyleSheet } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import { Colors } from '../constants/Colors';
import { AnimationConfig } from '../constants/AnimationConfig';
import { useColorScheme } from '../hooks/useColorScheme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface AnimatedTabBarProps {
  focusedTabIndex: number;
  tabCount: number;
  backgroundColor?: string;
}

interface TabLayout {
  x: number;
  width: number;
}

export default function AnimatedTabBar({
  focusedTabIndex,
  tabCount,
  backgroundColor,
}: AnimatedTabBarProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  
  // Animation values
  const indicatorTranslateX = useSharedValue(0);
  const indicatorWidth = useSharedValue(0);
  const indicatorOpacity = useSharedValue(0);
  
  // Tab layout tracking
  const tabLayouts = useRef<TabLayout[]>([]);
  const isInitialized = useRef(false);

  // Calculate tab positions
  useEffect(() => {
    if (tabCount > 0) {
      const tabWidth = SCREEN_WIDTH / tabCount;
      const layouts: TabLayout[] = [];
      
      for (let i = 0; i < tabCount; i++) {
        layouts.push({
          x: i * tabWidth + tabWidth * 0.1, // 10% padding from edges
          width: tabWidth * 0.8, // 80% of tab width
        });
      }
      
      tabLayouts.current = layouts;
      
      // Initialize indicator position
      if (!isInitialized.current && layouts.length > 0) {
        const initialLayout = layouts[focusedTabIndex] || layouts[0];
        indicatorTranslateX.value = initialLayout.x;
        indicatorWidth.value = initialLayout.width;
        indicatorOpacity.value = withTiming(1, { 
          duration: 300,
          easing: Easing.out(Easing.quad),
        });
        isInitialized.current = true;
      }
    }
  }, [tabCount, focusedTabIndex, indicatorTranslateX, indicatorWidth, indicatorOpacity]);

  // Animate indicator when focused tab changes
  useEffect(() => {
    if (isInitialized.current && tabLayouts.current.length > 0) {
      const targetLayout = tabLayouts.current[focusedTabIndex];
      
      if (targetLayout) {
        // Smooth spring animation for liquid effect
        indicatorTranslateX.value = withSpring(
          targetLayout.x,
          {
            damping: AnimationConfig.TABS.INDICATOR.DAMPING,
            stiffness: AnimationConfig.TABS.INDICATOR.STIFFNESS,
            overshootClamping: AnimationConfig.TABS.INDICATOR.OVERSHOOT,
          }
        );
        
        indicatorWidth.value = withSpring(
          targetLayout.width,
          {
            damping: AnimationConfig.TABS.INDICATOR.DAMPING,
            stiffness: AnimationConfig.TABS.INDICATOR.STIFFNESS,
            overshootClamping: AnimationConfig.TABS.INDICATOR.OVERSHOOT,
          }
        );
      }
    }
  }, [focusedTabIndex, indicatorTranslateX, indicatorWidth]);

  const indicatorStyle = useAnimatedStyle(() => {
    return {
      transform: [{ translateX: indicatorTranslateX.value }],
      width: indicatorWidth.value,
      opacity: indicatorOpacity.value,
    };
  });

  const dynamicStyles = StyleSheet.create({
    container: {
      backgroundColor: backgroundColor || colors.background,
      borderTopColor: colors.border,
    },
    indicator: {
      backgroundColor: colors.tint,
      shadowColor: colors.tint,
    },
    indicatorGlow: {
      backgroundColor: colors.primaryOpacity[20],
    },
  });

  return (
    <Animated.View style={[styles.container, dynamicStyles.container]}>
      {/* Main indicator */}
      <Animated.View style={[styles.indicator, dynamicStyles.indicator, indicatorStyle]} />
      
      {/* Subtle glow effect */}
      <Animated.View 
        style={[
          styles.indicatorGlow, 
          dynamicStyles.indicatorGlow, 
          indicatorStyle,
          { height: 6, top: -1 }
        ]} 
      />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 4,
    borderTopWidth: 1,
  },
  indicator: {
    position: 'absolute',
    bottom: 0,
    height: 4,
    borderRadius: 2,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  indicatorGlow: {
    position: 'absolute',
    borderRadius: 3,
  },
});