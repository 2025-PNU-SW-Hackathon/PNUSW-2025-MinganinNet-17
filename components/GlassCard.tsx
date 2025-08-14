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
    
    // Ultra-transparent magnifying glass opacity levels
    const opacityMap = {
      light: isDark ? 0.05 : 0.08,
      medium: isDark ? 0.08 : 0.12,
      dark: isDark ? 0.12 : 0.15,
    };

    const alpha = opacityMap[opacity];

    switch (variant) {
      case 'primary':
        // Sage green magnifying glass tint
        return isDark 
          ? `rgba(116, 136, 115, ${alpha})` // Sage green for dark mode
          : `rgba(116, 136, 115, ${alpha})`; // Subtle sage tint
      case 'accent':
        // Warm beige magnifying glass tint
        return isDark 
          ? `rgba(209, 169, 128, ${alpha})` // Warm beige for dark mode
          : `rgba(209, 169, 128, ${alpha})`; // Warm beige glass
      case 'secondary':
      default:
        // Ultra-clear magnifying glass with minimal tint
        return isDark 
          ? `rgba(143, 160, 135, ${alpha * 0.8})` // Light sage for dark mode
          : `rgba(248, 248, 248, ${alpha * 0.7})`; // Almost transparent with minimal warm tint
    }
  };

  // Generate strong glass block border colors with refraction
  const getBorderColor = () => {
    const isDark = colorScheme === 'dark';
    const borderOpacity = isDark ? 0.35 : 0.3; // Much stronger for glass block effect

    switch (variant) {
      case 'primary':
        // Strong sage green glass block borders
        return isDark 
          ? `rgba(116, 136, 115, ${borderOpacity})` 
          : `rgba(116, 136, 115, ${borderOpacity})`;
      case 'accent':
        // Strong warm beige glass block borders
        return isDark 
          ? `rgba(209, 169, 128, ${borderOpacity})` 
          : `rgba(209, 169, 128, ${borderOpacity})`;
      case 'secondary':
      default:
        // Strong crystal glass block borders with refraction
        return isDark 
          ? `rgba(143, 160, 135, ${borderOpacity})` 
          : `rgba(116, 136, 115, ${borderOpacity * 1.1})`;
    }
  };

  // Realistic magnifying glass shadow configuration
  const getShadowConfig = () => {
    const isDark = colorScheme === 'dark';
    
    // Realistic glass shadow colors - subtle and natural
    const shadowColor = isDark ? '#000000' : 'rgba(44, 44, 44, 0.15)';
    
    const blurConfig = {
      subtle: {
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: isDark ? 0.3 : 0.08,
        shadowRadius: 4,
        elevation: 2,
      },
      medium: {
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: isDark ? 0.4 : 0.12,
        shadowRadius: 6,
        elevation: 4,
      },
      strong: {
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: isDark ? 0.5 : 0.15,
        shadowRadius: 8,
        elevation: 6,
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
    <>
      {/* Multi-layer glass block refraction system */}
      <View style={[styles.outerRefraction, colorScheme === 'dark' && styles.outerRefractionDark]} />
      <View style={[styles.innerHighlight, colorScheme === 'dark' && styles.innerHighlightDark]} />
      <View style={[styles.bottomEdgeShadow, colorScheme === 'dark' && styles.bottomEdgeShadowDark]} />
      
      {/* Glass highlight effect - enhanced for glass block */}
      <View style={[styles.glassHighlight, colorScheme === 'dark' && styles.glassHighlightDark]} />
      
      {/* Content with enhanced magnification effect */}
      <View style={[styles.contentContainer, styles.magnifiedContent, contentContainerStyle]}>
        {children}
      </View>
    </>
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
      borderWidth: 1.5, // Thicker border for glass block appearance
      padding: Spacing.xl,
      overflow: 'hidden',
      position: 'relative',
    },
    contentContainer: {
      flex: 1,
      zIndex: 10, // Ensure content is above glass effects
    },
    
    // Enhanced magnification effect for glass block
    magnifiedContent: {
      transform: [{ scale: 1.025 }], // Stronger magnification
    },
    
    // Multi-layer glass block refraction system
    outerRefraction: {
      position: 'absolute',
      top: -1,
      left: -1,
      right: -1,
      bottom: -1,
      borderRadius: Spacing.layout.borderRadius.xl + 1,
      borderWidth: 2,
      borderColor: 'rgba(116, 136, 115, 0.4)', // Strong outer refraction edge
    },
    outerRefractionDark: {
      borderColor: 'rgba(143, 160, 135, 0.35)',
    },
    
    // Inner highlight border for glass thickness
    innerHighlight: {
      position: 'absolute',
      top: 1,
      left: 1,
      right: 1,
      bottom: 1,
      borderRadius: Spacing.layout.borderRadius.xl - 1,
      borderWidth: 1,
      borderTopColor: 'rgba(255, 255, 255, 0.25)',
      borderLeftColor: 'rgba(255, 255, 255, 0.25)',
      borderRightColor: 'rgba(116, 136, 115, 0.15)',
      borderBottomColor: 'rgba(116, 136, 115, 0.15)',
    },
    innerHighlightDark: {
      borderTopColor: 'rgba(255, 255, 255, 0.15)',
      borderLeftColor: 'rgba(255, 255, 255, 0.15)',
      borderRightColor: 'rgba(143, 160, 135, 0.2)',
      borderBottomColor: 'rgba(143, 160, 135, 0.2)',
    },
    
    // Bottom edge shadow for glass block depth
    bottomEdgeShadow: {
      position: 'absolute',
      bottom: 0,
      left: 0,
      right: 0,
      height: 8,
      backgroundColor: 'rgba(116, 136, 115, 0.08)',
      borderBottomLeftRadius: Spacing.layout.borderRadius.xl,
      borderBottomRightRadius: Spacing.layout.borderRadius.xl,
    },
    bottomEdgeShadowDark: {
      backgroundColor: 'rgba(0, 0, 0, 0.15)',
    },
    
    // Enhanced glass highlight effect
    glassHighlight: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: '55%',
      height: '45%',
      backgroundColor: 'rgba(255, 255, 255, 0.12)', // Stronger highlight
      borderTopLeftRadius: Spacing.layout.borderRadius.xl,
      borderBottomRightRadius: Spacing.layout.borderRadius.lg,
    },
    glassHighlightDark: {
      backgroundColor: 'rgba(255, 255, 255, 0.08)',
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