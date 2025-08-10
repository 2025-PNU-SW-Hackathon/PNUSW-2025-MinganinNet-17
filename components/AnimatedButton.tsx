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
import { Colors } from '../constants/Colors';
import { Spacing } from '../constants/Spacing';
import { useColorScheme } from '../hooks/useColorScheme';

interface AnimatedButtonProps {
  title: string;
  onPress: () => void;
  isLoading?: boolean;
  disabled?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  loadingText?: string;
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'link';
  size?: 'sm' | 'md' | 'lg' | 'xl';
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
  size = 'md',
}) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const styles = createStyles(colors);
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
    styles[`${size}Button` as keyof typeof styles],
    variant === 'secondary' && styles.secondaryButton,
    variant === 'outline' && styles.outlineButton,
    variant === 'ghost' && styles.ghostButton,
    variant === 'link' && styles.linkButton,
    style,
  ];

  const buttonTextStyle = [
    styles.buttonText,
    styles[`${size}ButtonText` as keyof typeof styles],
    variant === 'secondary' && styles.secondaryButtonText,
    variant === 'outline' && styles.outlineButtonText,
    variant === 'ghost' && styles.ghostButtonText,
    variant === 'link' && styles.linkButtonText,
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

const createStyles = (colors: typeof Colors.light) => StyleSheet.create({
  // Base button styles
  button: {
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: Spacing.layout.borderRadius.lg,
    flexDirection: 'row',
    // Primary variant styles (default)
    backgroundColor: colors.buttonPrimary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: Spacing.sm },
    shadowOpacity: 0.2,
    shadowRadius: Spacing.md,
    elevation: Spacing.layout.elevation.sm,
  },
  
  // Size variants
  smButton: {
    height: Spacing.layout.button.height.sm,
    paddingHorizontal: Spacing.xl,
    borderRadius: Spacing.layout.borderRadius.md,
  },
  mdButton: {
    height: Spacing.layout.button.height.md,
    paddingHorizontal: Spacing['3xl'],
    borderRadius: Spacing.layout.borderRadius.lg,
  },
  lgButton: {
    height: Spacing.layout.button.height.lg,
    paddingHorizontal: Spacing['4xl'],
    borderRadius: Spacing.layout.borderRadius.xl,
  },
  xlButton: {
    height: Spacing.layout.button.height.xl,
    paddingHorizontal: Spacing['5xl'],
    borderRadius: Spacing.layout.borderRadius.xl,
  },
  
  // Button variants
  secondaryButton: {
    backgroundColor: colors.buttonSecondary,
    borderWidth: 1,
    borderColor: colors.border,
    shadowOpacity: 0,
    elevation: 0,
  },
  outlineButton: {
    backgroundColor: colors.buttonOutline,
    borderWidth: 2,
    borderColor: colors.primary,
    shadowOpacity: 0,
    elevation: 0,
  },
  ghostButton: {
    backgroundColor: colors.buttonGhost,
    shadowOpacity: 0,
    elevation: 0,
  },
  linkButton: {
    backgroundColor: colors.buttonGhost,
    shadowOpacity: 0,
    elevation: 0,
    borderRadius: 0,
  },
  
  // Button content container
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  // Base text styles
  buttonText: {
    fontFamily: 'Inter',
    fontWeight: colors.typography.fontWeight.semibold,
    color: '#ffffff',
    textAlign: 'center',
  },
  
  // Size-specific text styles
  smButtonText: {
    fontSize: colors.typography.fontSize.sm,
    lineHeight: colors.typography.fontSize.sm * colors.typography.lineHeight.tight,
  },
  mdButtonText: {
    fontSize: colors.typography.fontSize.base,
    lineHeight: colors.typography.fontSize.base * colors.typography.lineHeight.tight,
  },
  lgButtonText: {
    fontSize: colors.typography.fontSize.lg,
    lineHeight: colors.typography.fontSize.lg * colors.typography.lineHeight.tight,
  },
  xlButtonText: {
    fontSize: colors.typography.fontSize.xl,
    lineHeight: colors.typography.fontSize.xl * colors.typography.lineHeight.tight,
  },
  
  // Variant-specific text styles
  secondaryButtonText: {
    color: colors.text,
  },
  outlineButtonText: {
    color: colors.primary,
  },
  ghostButtonText: {
    color: colors.primary,
  },
  linkButtonText: {
    color: colors.primary,
    textDecorationLine: 'underline',
  },
  
  // Loading dots
  loadingDots: {
    marginLeft: Spacing.md,
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dot: {
    width: Spacing.sm + 2, // 6px
    height: Spacing.sm + 2, // 6px
    borderRadius: Spacing.xs + 1, // 3px
    backgroundColor: '#ffffff',
    marginHorizontal: Spacing.xs,
  },
}); 