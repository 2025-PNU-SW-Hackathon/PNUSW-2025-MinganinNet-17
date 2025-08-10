import { useEffect, useRef } from 'react';
import {
    Animated,
    Dimensions,
    Platform,
    StyleSheet,
    Text,
    View
} from 'react-native';
import { Colors } from '../constants/Colors';
import { Spacing } from '../constants/Spacing';
import { useColorScheme } from '../hooks/useColorScheme';

const { width, height } = Dimensions.get('window');

interface SplashScreenProps {
  onLoadingComplete: () => void;
}

export default function SplashScreen({ onLoadingComplete }: SplashScreenProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const styles = createStyles(colors);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const loadingAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Logo animation sequence
    Animated.sequence([
      // Logo fade in and scale up
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
      ]),
      // Loading dots animation
      Animated.loop(
        Animated.sequence([
          Animated.timing(loadingAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(loadingAnim, {
            toValue: 0,
            duration: 600,
            useNativeDriver: true,
          }),
        ]),
        { iterations: 3 }
      ),
    ]).start();

    // Navigate to welcome screen after 3 seconds
    const timer = setTimeout(() => {
      onLoadingComplete();
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  const loadingOpacity = loadingAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 1],
  });

  return (
    <View style={styles.container}>
      <Animated.View 
        style={[
          styles.logoContainer,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        {/* Logo Text */}
        <Text style={styles.logoText}>Routy</Text>
        <Text style={styles.logoSubtext}>AI 습관 관리</Text>
      </Animated.View>

      {/* Loading Indicator */}
      <Animated.View 
        style={[
          styles.loadingContainer,
          { opacity: loadingOpacity }
        ]}
      >
        <View style={styles.loadingDots}>
          <View style={[styles.dot, styles.dot1]} />
          <View style={[styles.dot, styles.dot2]} />
          <View style={[styles.dot, styles.dot3]} />
        </View>
        <Text style={styles.loadingText}>로딩 중...</Text>
      </Animated.View>
    </View>
  );
}

const createStyles = (colors: typeof Colors.light) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: Spacing['7xl'], // 100 -> 64px
  },
  logoText: {
    fontSize: colors.typography.fontSize['5xl'],
    fontWeight: colors.typography.fontWeight.bold,
    color: colors.primary,
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'Inter' : 'Inter',
    letterSpacing: colors.typography.letterSpacing.widest,
  },
  logoSubtext: {
    fontSize: colors.typography.fontSize.base,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: Spacing.md,
    fontFamily: Platform.OS === 'ios' ? 'Inter' : 'Inter',
  },
  loadingContainer: {
    position: 'absolute',
    bottom: Spacing['7xl'],
    alignItems: 'center',
  },
  loadingDots: {
    flexDirection: 'row',
    marginBottom: Spacing.xl,
  },
  dot: {
    width: Spacing.md,
    height: Spacing.md,
    borderRadius: Spacing.sm,
    backgroundColor: colors.primary,
    marginHorizontal: Spacing.sm,
  },
  dot1: {
    opacity: 0.3,
  },
  dot2: {
    opacity: 0.6,
  },
  dot3: {
    opacity: 1,
  },
  loadingText: {
    fontSize: colors.typography.fontSize.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'Inter' : 'Inter',
  },
}); 