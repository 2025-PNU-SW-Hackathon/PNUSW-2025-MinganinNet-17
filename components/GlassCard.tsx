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
      {/* Liquid Glass Background Layers */}
      <View style={[styles.liquidGlassBase, colorScheme === 'dark' && styles.liquidGlassBaseDark]} />
      <View style={[styles.liquidGlassLayer1, colorScheme === 'dark' && styles.liquidGlassLayer1Dark]} />
      <View style={[styles.liquidGlassLayer2, colorScheme === 'dark' && styles.liquidGlassLayer2Dark]} />
      
      {/* Complex Inset Shadow System */}
      <View style={[styles.insetShadowDark, colorScheme === 'dark' && styles.insetShadowDarkMode]} />
      <View style={[styles.insetShadowLight, colorScheme === 'dark' && styles.insetShadowLightMode]} />
      <View style={[styles.innerGlow, colorScheme === 'dark' && styles.innerGlowDark]} />
      <View style={[styles.outerGlow, colorScheme === 'dark' && styles.outerGlowDark]} />
      
      {/* Backdrop Blur Simulation */}
      <View style={[styles.backdropBlur, colorScheme === 'dark' && styles.backdropBlurDark]} />
      
      {/* Content with liquid glass magnification */}
      <View style={[styles.contentContainer, styles.liquidGlassContent, contentContainerStyle]}>
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
      borderWidth: 0, // Remove border - using complex shadow system instead
      padding: Spacing.xl,
      overflow: 'hidden',
      position: 'relative',
    },
    contentContainer: {
      flex: 1,
      zIndex: 20, // Ensure content is above all glass effects
    },
    
    // Correct Transparent Liquid Glass Background (matching Figma)
    liquidGlassBase: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(116, 136, 115, 0.08)', // Ultra-light sage glass - matches Figma's rgba(255,255,255,0.08)
      borderRadius: Spacing.layout.borderRadius.xl,
    },
    liquidGlassBaseDark: {
      backgroundColor: 'rgba(143, 160, 135, 0.06)',
    },
    
    liquidGlassLayer1: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(116, 136, 115, 0.04)', // Very subtle sage tint
      borderRadius: Spacing.layout.borderRadius.xl,
    },
    liquidGlassLayer1Dark: {
      backgroundColor: 'rgba(143, 160, 135, 0.03)',
    },
    
    liquidGlassLayer2: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(255, 255, 255, 0.03)', // Barely visible white overlay for glass shine
      borderRadius: Spacing.layout.borderRadius.xl,
    },
    liquidGlassLayer2Dark: {
      backgroundColor: 'rgba(255, 255, 255, 0.02)',
    },
    
    // Complex Inset Shadow System (based on Figma CSS)
    insetShadowDark: {
      ...StyleSheet.absoluteFillObject,
      borderRadius: Spacing.layout.borderRadius.xl,
      // Simulating: inset 2.7px 2.7px 0px -1.35px #333333, inset -2.7px -2.7px 0px -1.35px #262626
      borderTopWidth: 2,
      borderLeftWidth: 2,
      borderRightWidth: 2,
      borderBottomWidth: 2,
      borderTopColor: 'rgba(116, 136, 115, 0.6)', // Sage version of #333333
      borderLeftColor: 'rgba(116, 136, 115, 0.6)',
      borderRightColor: 'rgba(95, 111, 94, 0.5)', // Sage version of #262626
      borderBottomColor: 'rgba(95, 111, 94, 0.5)',
    },
    insetShadowDarkMode: {
      borderTopColor: 'rgba(143, 160, 135, 0.5)',
      borderLeftColor: 'rgba(143, 160, 135, 0.5)',
      borderRightColor: 'rgba(74, 85, 73, 0.4)',
      borderBottomColor: 'rgba(74, 85, 73, 0.4)',
    },
    
    insetShadowLight: {
      position: 'absolute',
      top: 1,
      left: 1,
      right: 1,
      bottom: 1,
      borderRadius: Spacing.layout.borderRadius.xl - 1,
      // Simulating: inset 2.7px 2.7px 1.35px -2.7px #FFFFFF, inset -2.7px -2.7px 1.35px -2.7px #FFFFFF
      borderTopWidth: 1,
      borderLeftWidth: 1,
      borderRightWidth: 1,
      borderBottomWidth: 1,
      borderTopColor: 'rgba(255, 255, 255, 0.4)',
      borderLeftColor: 'rgba(255, 255, 255, 0.4)',
      borderRightColor: 'rgba(255, 255, 255, 0.2)',
      borderBottomColor: 'rgba(255, 255, 255, 0.2)',
    },
    insetShadowLightMode: {
      borderTopColor: 'rgba(255, 255, 255, 0.3)',
      borderLeftColor: 'rgba(255, 255, 255, 0.3)',
      borderRightColor: 'rgba(255, 255, 255, 0.15)',
      borderBottomColor: 'rgba(255, 255, 255, 0.15)',
    },
    
    // Inner Glow Effect - Transparent with glass-like luminosity
    innerGlow: {
      position: 'absolute',
      top: 4,
      left: 4,
      right: 4,
      bottom: 4,
      borderRadius: Spacing.layout.borderRadius.xl - 4,
      backgroundColor: 'rgba(255, 255, 255, 0.02)', // Much more transparent
      shadowColor: 'rgba(255, 255, 255, 0.5)',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.3, // Reduced for subtlety
      shadowRadius: 8,
      elevation: 0,
    },
    innerGlowDark: {
      backgroundColor: 'rgba(255, 255, 255, 0.01)',
      shadowColor: 'rgba(255, 255, 255, 0.3)',
      shadowOpacity: 0.2,
    },
    
    // Outer Glow Effect - Soft luminous glass effect
    outerGlow: {
      position: 'absolute',
      top: 8,
      left: 8,
      right: 8,
      bottom: 8,
      borderRadius: Spacing.layout.borderRadius.xl - 8,
      backgroundColor: 'rgba(242, 242, 242, 0.03)', // Much more transparent
      shadowColor: '#F2F2F2',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.15, // Reduced for transparent effect
      shadowRadius: 20,
      elevation: 0,
    },
    outerGlowDark: {
      backgroundColor: 'rgba(200, 200, 200, 0.02)',
      shadowColor: '#CCCCCC',
      shadowOpacity: 0.1,
    },
    
    // Enhanced Backdrop Blur Simulation (primary glass effect from Figma)
    backdropBlur: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(255, 255, 255, 0.04)', // Lighter than base layer for layered effect
      borderRadius: Spacing.layout.borderRadius.xl,
      // This creates the primary glass transparency effect
    },
    backdropBlurDark: {
      backgroundColor: 'rgba(255, 255, 255, 0.02)',
    },
    
    // Enhanced magnification for liquid glass
    liquidGlassContent: {
      transform: [{ scale: 1.015 }], // Subtle liquid glass magnification
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