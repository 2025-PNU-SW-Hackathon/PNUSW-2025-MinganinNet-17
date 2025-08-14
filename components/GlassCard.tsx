import React, { ReactNode } from 'react';
import {
  StyleSheet,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import { Colors } from '../constants/Colors';
import { Spacing } from '../constants/Spacing';
import { useColorScheme } from '../hooks/useColorScheme';

interface GlassCardProps {
  children: ReactNode;
  blur?: 'subtle' | 'medium' | 'strong';
  opacity?: 'light' | 'medium' | 'dark';
  variant?: 'primary' | 'secondary' | 'accent';
  style?: ViewStyle;
  contentContainerStyle?: ViewStyle;
  disabled?: boolean;
  onPress?: () => void;
  testID?: string;
  accessible?: boolean;
  accessibilityLabel?: string;
  accessibilityHint?: string;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  blur = 'medium',
  opacity = 'medium',
  variant = 'secondary',
  style,
  contentContainerStyle,
  disabled = false,
  onPress,
  testID,
  accessible = true,
  accessibilityLabel,
  accessibilityHint,
}) => {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const styles = createStyles(colors);

  // Generate glassmorphism background optimized for Android
  const getGlassBackground = () => {
    const isDark = colorScheme === 'dark';
    
    // Android-optimized opacity levels for better glass effect
    const opacityMap = {
      light: isDark ? 0.2 : 0.3,
      medium: isDark ? 0.3 : 0.4,
      dark: isDark ? 0.4 : 0.5,
    };

    const alpha = opacityMap[opacity];

    switch (variant) {
      case 'primary':
        // Enhanced purple-tinted white glass for Android
        return isDark 
          ? `rgba(168, 162, 255, ${alpha})` // Light purple for dark mode
          : `rgba(255, 255, 255, ${alpha})`; // Semi-transparent white
      case 'accent':
        // Medium purple tint for accent cards
        return isDark 
          ? `rgba(139, 124, 246, ${alpha})` // Medium purple for dark mode
          : `rgba(248, 246, 255, ${alpha * 1.1})`; // Light purple-white
      case 'secondary':
      default:
        // Standard white glass with Android optimization
        return isDark 
          ? `rgba(196, 192, 255, ${alpha * 0.9})` // Light purple for dark mode
          : `rgba(255, 255, 255, ${alpha * 0.9})`; // Pure white with transparency
    }
  };

  // Generate border color optimized for Android
  const getBorderColor = () => {
    const isDark = colorScheme === 'dark';
    const borderOpacity = isDark ? 0.4 : 0.35;

    switch (variant) {
      case 'primary':
        // Enhanced purple-tinted borders for Android glass effect
        return isDark 
          ? `rgba(168, 162, 255, ${borderOpacity})` 
          : `rgba(255, 255, 255, ${borderOpacity})`;
      case 'accent':
        // Strong purple tint for accent variant
        return isDark 
          ? `rgba(139, 124, 246, ${borderOpacity})` 
          : `rgba(248, 246, 255, ${borderOpacity * 1.2})`;
      case 'secondary':
      default:
        // Optimized white/purple borders for Android
        return isDark 
          ? `rgba(196, 192, 255, ${borderOpacity * 0.9})` 
          : `rgba(255, 255, 255, ${borderOpacity * 0.9})`;
    }
  };

  // Generate shadow configuration optimized for Android
  const getShadowConfig = () => {
    const isDark = colorScheme === 'dark';
    
    // Android-optimized shadow colors for glassmorphism
    const shadowColor = isDark ? '#000000' : 'rgba(108, 99, 255, 0.25)';
    
    const blurConfig = {
      subtle: {
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: isDark ? 0.5 : 0.2,
        shadowRadius: 6,
        elevation: 4,
      },
      medium: {
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: isDark ? 0.6 : 0.25,
        shadowRadius: 8,
        elevation: 8,
      },
      strong: {
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: isDark ? 0.7 : 0.3,
        shadowRadius: 12,
        elevation: 12,
      },
    };

    return {
      shadowColor,
      ...blurConfig[blur],
    };
  };

  const glassStyle = {
    backgroundColor: getGlassBackground(),
    borderColor: getBorderColor(),
    ...getShadowConfig(),
  };

  const combinedStyle = [
    styles.container,
    glassStyle,
    disabled && styles.disabled,
    style,
  ];

  const content = (
    <View style={[styles.contentContainer, contentContainerStyle]}>
      {children}
    </View>
  );

  if (onPress && !disabled) {
    return (
      <TouchableOpacity
        style={combinedStyle}
        onPress={onPress}
        activeOpacity={0.8}
        testID={testID}
        accessible={accessible}
        accessibilityLabel={accessibilityLabel}
        accessibilityHint={accessibilityHint}
        accessibilityRole="button"
      >
        {content}
      </TouchableOpacity>
    );
  }

  return (
    <View
      style={combinedStyle}
      testID={testID}
      accessible={accessible}
      accessibilityLabel={accessibilityLabel}
    >
      {content}
    </View>
  );
};

const createStyles = (colors: typeof Colors.light) =>
  StyleSheet.create({
    container: {
      borderRadius: Spacing.layout.borderRadius.xl,
      borderWidth: 1,
      padding: Spacing.xl,
      overflow: 'hidden',
    },
    contentContainer: {
      flex: 1,
    },
    disabled: {
      opacity: 0.5,
    },
  });

// Higher-order component for easy wrapping
export const withGlassCard = <P extends object>(
  Component: React.ComponentType<P>,
  glassProps?: Partial<GlassCardProps>
) => {
  const WrappedComponent = (props: P & { glassCardProps?: Partial<GlassCardProps> }) => {
    const { glassCardProps, ...componentProps } = props;
    
    return (
      <GlassCard {...glassProps} {...glassCardProps}>
        <Component {...(componentProps as P)} />
      </GlassCard>
    );
  };

  WrappedComponent.displayName = `withGlassCard(${Component.displayName || Component.name})`;
  return WrappedComponent;
};

// Pre-configured variants for common use cases
export const PrimaryGlassCard: React.FC<Omit<GlassCardProps, 'variant'>> = (props) => (
  <GlassCard variant="primary" {...props} />
);

export const SecondaryGlassCard: React.FC<Omit<GlassCardProps, 'variant'>> = (props) => (
  <GlassCard variant="secondary" {...props} />
);

export const AccentGlassCard: React.FC<Omit<GlassCardProps, 'variant'>> = (props) => (
  <GlassCard variant="accent" {...props} />
);

export default GlassCard;