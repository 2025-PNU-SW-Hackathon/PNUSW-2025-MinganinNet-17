import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import { VoiceVisualizerProps } from '../types/voice';
import { Colors } from '../constants/Colors';
import { useColorScheme } from '../hooks/useColorScheme';

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

const VoiceVisualizer: React.FC<VoiceVisualizerProps> = ({ 
  state, 
  amplitude = 0.5 
}) => {
  // Theme integration
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const styles = createStyles(colors);

  // Animation values
  const scale1 = useSharedValue(1);
  const scale2 = useSharedValue(1);
  const scale3 = useSharedValue(1);
  const scale4 = useSharedValue(1);
  const opacity1 = useSharedValue(1);
  const opacity2 = useSharedValue(1);
  const opacity3 = useSharedValue(1);
  const opacity4 = useSharedValue(1);
  const rotation = useSharedValue(0);

  // Base circle size (adapting to screen)
  const baseSize = Math.min(screenWidth, screenHeight) * 0.4;

  useEffect(() => {
    switch (state) {
      case 'idle':
        // Single large circle, gentle breathing animation
        scale1.value = withRepeat(
          withSequence(
            withTiming(1, { duration: 2000, easing: Easing.inOut(Easing.quad) }),
            withTiming(1.05, { duration: 2000, easing: Easing.inOut(Easing.quad) })
          ),
          -1,
          true
        );
        opacity1.value = 1;
        opacity2.value = 0;
        opacity3.value = 0;
        opacity4.value = 0;
        break;

      case 'listening':
        // Multiple dots with sequential animation like ChatGPT
        const animateListening = () => {
          scale1.value = withRepeat(
            withSequence(
              withTiming(1.2, { duration: 400 }),
              withTiming(1, { duration: 400 })
            ),
            -1,
            false
          );
          scale2.value = withRepeat(
            withSequence(
              withTiming(1, { duration: 200 }),
              withTiming(1.1, { duration: 400 }),
              withTiming(1, { duration: 400 })
            ),
            -1,
            false
          );
          scale3.value = withRepeat(
            withSequence(
              withTiming(1, { duration: 400 }),
              withTiming(1.3, { duration: 400 }),
              withTiming(1, { duration: 400 })
            ),
            -1,
            false
          );
          scale4.value = withRepeat(
            withSequence(
              withTiming(1, { duration: 600 }),
              withTiming(1.1, { duration: 400 }),
              withTiming(1, { duration: 400 })
            ),
            -1,
            false
          );
        };
        
        animateListening();
        opacity1.value = 1;
        opacity2.value = 1;
        opacity3.value = 1;
        opacity4.value = 1;
        break;

      case 'speaking':
        // Waveform-like animation with varying scales
        scale1.value = withRepeat(
          withSequence(
            withTiming(0.8, { duration: 300 }),
            withTiming(1.4, { duration: 300 }),
            withTiming(0.9, { duration: 300 }),
            withTiming(1.2, { duration: 300 })
          ),
          -1,
          false
        );
        scale2.value = withRepeat(
          withSequence(
            withTiming(1.3, { duration: 250 }),
            withTiming(0.7, { duration: 250 }),
            withTiming(1.1, { duration: 250 }),
            withTiming(0.9, { duration: 250 })
          ),
          -1,
          false
        );
        scale3.value = withRepeat(
          withSequence(
            withTiming(1.1, { duration: 350 }),
            withTiming(1.5, { duration: 350 }),
            withTiming(0.8, { duration: 350 }),
            withTiming(1.0, { duration: 350 })
          ),
          -1,
          false
        );
        scale4.value = withRepeat(
          withSequence(
            withTiming(0.9, { duration: 200 }),
            withTiming(1.2, { duration: 200 }),
            withTiming(1.4, { duration: 200 }),
            withTiming(0.8, { duration: 200 })
          ),
          -1,
          false
        );
        opacity1.value = 1;
        opacity2.value = 1;
        opacity3.value = 1;
        opacity4.value = 1;
        break;

      case 'processing':
        // Cloud-like blob with morphing animation
        rotation.value = withRepeat(
          withTiming(360, { duration: 8000, easing: Easing.linear }),
          -1,
          false
        );
        scale1.value = withRepeat(
          withSequence(
            withTiming(1.2, { duration: 1500, easing: Easing.inOut(Easing.sin) }),
            withTiming(0.9, { duration: 1500, easing: Easing.inOut(Easing.sin) }),
            withTiming(1.1, { duration: 1500, easing: Easing.inOut(Easing.sin) }),
            withTiming(1, { duration: 1500, easing: Easing.inOut(Easing.sin) })
          ),
          -1,
          false
        );
        scale2.value = withRepeat(
          withSequence(
            withTiming(0.8, { duration: 2000, easing: Easing.inOut(Easing.sin) }),
            withTiming(1.3, { duration: 2000, easing: Easing.inOut(Easing.sin) })
          ),
          -1,
          true
        );
        scale3.value = withRepeat(
          withSequence(
            withTiming(1.4, { duration: 1800, easing: Easing.inOut(Easing.sin) }),
            withTiming(0.7, { duration: 1800, easing: Easing.inOut(Easing.sin) })
          ),
          -1,
          true
        );
        opacity1.value = 1;
        opacity2.value = 0.8;
        opacity3.value = 0.6;
        opacity4.value = 0.3;
        break;

      case 'error':
        // Subtle shake/pulse animation
        scale1.value = withRepeat(
          withSequence(
            withTiming(1.1, { duration: 150 }),
            withTiming(0.95, { duration: 150 }),
            withTiming(1.05, { duration: 150 }),
            withTiming(1, { duration: 150 })
          ),
          3,
          false
        );
        opacity1.value = 1;
        opacity2.value = 0;
        opacity3.value = 0;
        opacity4.value = 0;
        break;

      default:
        // Reset to idle
        scale1.value = withTiming(1);
        scale2.value = withTiming(1);
        scale3.value = withTiming(1);
        scale4.value = withTiming(1);
        opacity1.value = 1;
        opacity2.value = 0;
        opacity3.value = 0;
        opacity4.value = 0;
        break;
    }
  }, [state]);

  // Animated styles for each circle
  const circle1Style = useAnimatedStyle(() => {
    return {
      transform: [
        { scale: scale1.value },
        { rotate: `${rotation.value}deg` }
      ],
      opacity: opacity1.value,
    };
  });

  const circle2Style = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale2.value }],
      opacity: opacity2.value,
    };
  });

  const circle3Style = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale3.value }],
      opacity: opacity3.value,
    };
  });

  const circle4Style = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale4.value }],
      opacity: opacity4.value,
    };
  });

  const renderVisualization = () => {
    switch (state) {
      case 'idle':
        return (
          <Animated.View style={[styles.circle, styles.mainCircle, circle1Style]} />
        );

      case 'listening':
        return (
          <View style={styles.listeningContainer}>
            <Animated.View style={[styles.circle, styles.dot1, circle1Style]} />
            <Animated.View style={[styles.circle, styles.dot2, circle2Style]} />
            <Animated.View style={[styles.circle, styles.dot3, circle3Style]} />
            <Animated.View style={[styles.circle, styles.dot4, circle4Style]} />
          </View>
        );

      case 'speaking':
        return (
          <View style={styles.speakingContainer}>
            <Animated.View style={[styles.circle, styles.wave1, circle1Style]} />
            <Animated.View style={[styles.circle, styles.wave2, circle2Style]} />
            <Animated.View style={[styles.circle, styles.wave3, circle3Style]} />
            <Animated.View style={[styles.circle, styles.wave4, circle4Style]} />
          </View>
        );

      case 'processing':
        return (
          <View style={styles.processingContainer}>
            <Animated.View style={[styles.blob, styles.blob1, circle1Style]} />
            <Animated.View style={[styles.blob, styles.blob2, circle2Style]} />
            <Animated.View style={[styles.blob, styles.blob3, circle3Style]} />
            <Animated.View style={[styles.smallBlob, circle4Style]} />
          </View>
        );

      case 'error':
        return (
          <Animated.View style={[styles.circle, styles.errorCircle, circle1Style]} />
        );

      default:
        return (
          <Animated.View style={[styles.circle, styles.mainCircle, circle1Style]} />
        );
    }
  };

  return (
    <View style={styles.container}>
      {renderVisualization()}
    </View>
  );
};

const createStyles = (colors: typeof Colors.light) => StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: '100%',
  },
  circle: {
    backgroundColor: colors.primary,
    position: 'absolute',
  },
  mainCircle: {
    width: Math.min(screenWidth, screenHeight) * 0.4,
    height: Math.min(screenWidth, screenHeight) * 0.4,
    borderRadius: Math.min(screenWidth, screenHeight) * 0.2,
    backgroundColor: `${colors.primary}80`, // 80% opacity
  },
  errorCircle: {
    width: Math.min(screenWidth, screenHeight) * 0.4,
    height: Math.min(screenWidth, screenHeight) * 0.4,
    borderRadius: Math.min(screenWidth, screenHeight) * 0.2,
    backgroundColor: `${colors.error}80`, // 80% opacity
  },
  listeningContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: screenWidth * 0.8,
    height: 120,
  },
  dot1: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginHorizontal: 8,
    backgroundColor: `${colors.primary}90`, // 90% opacity
  },
  dot2: {
    width: 90,
    height: 90,
    borderRadius: 45,
    marginHorizontal: 8,
    backgroundColor: `${colors.primary}70`, // 70% opacity
  },
  dot3: {
    width: 110,
    height: 140,
    borderRadius: 55,
    marginHorizontal: 8,
    backgroundColor: `${colors.primary}80`, // 80% opacity
  },
  dot4: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginHorizontal: 8,
    backgroundColor: `${colors.primary}60`, // 60% opacity
  },
  speakingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: screenWidth * 0.8,
    height: 120,
  },
  wave1: {
    width: 70,
    height: 70,
    borderRadius: 35,
    marginHorizontal: 6,
    backgroundColor: `${colors.primary}85`, // 85% opacity
  },
  wave2: {
    width: 85,
    height: 85,
    borderRadius: 42.5,
    marginHorizontal: 6,
    backgroundColor: `${colors.primary}75`, // 75% opacity
  },
  wave3: {
    width: 95,
    height: 95,
    borderRadius: 47.5,
    marginHorizontal: 6,
    backgroundColor: `${colors.primary}90`, // 90% opacity
  },
  wave4: {
    width: 75,
    height: 75,
    borderRadius: 37.5,
    marginHorizontal: 6,
    backgroundColor: `${colors.primary}65`, // 65% opacity
  },
  processingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    width: screenWidth * 0.6,
    height: screenWidth * 0.6,
  },
  blob: {
    backgroundColor: `${colors.primary}70`, // 70% opacity
    position: 'absolute',
  },
  blob1: {
    width: 200,
    height: 160,
    borderRadius: 100,
    top: -20,
    left: -20,
    backgroundColor: `${colors.primary}80`, // 80% opacity
  },
  blob2: {
    width: 180,
    height: 180,
    borderRadius: 90,
    top: 10,
    right: -30,
    backgroundColor: `${colors.primary}60`, // 60% opacity
  },
  blob3: {
    width: 160,
    height: 140,
    borderRadius: 80,
    bottom: -10,
    left: 10,
    backgroundColor: `${colors.primary}75`, // 75% opacity
  },
  smallBlob: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: `${colors.primary}90`, // 90% opacity
    position: 'absolute',
    bottom: -60,
    left: -20,
  },
});

export default VoiceVisualizer;