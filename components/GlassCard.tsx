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
    
    // Original dark glass with 10% brightness boost
    const opacityMap = {
      light: isDark ? 0.09 : 0.13,
      medium: isDark ? 0.13 : 0.20,
      dark: isDark ? 0.20 : 0.28,
    };

    const alpha = opacityMap[opacity];

    switch (variant) {
      case 'primary':
        // Original sage with 10% brightness boost
        return isDark 
          ? `rgba(153, 170, 145, ${alpha * 0.8})` // Original light sage + brightness for dark mode
          : `rgba(126, 146, 125, ${alpha})`; // Original sage (116,136,115) + 10% brightness
      case 'accent':
        // Original warm beige with 10% brightness boost
        return isDark 
          ? `rgba(219, 179, 138, ${alpha * 0.7})` // Original beige + brightness for dark mode
          : `rgba(219, 179, 138, ${alpha})`; // Original beige (209,169,128) + 10% brightness
      case 'secondary':
      default:
        // Original light sage with 10% brightness boost
        return isDark 
          ? `rgba(153, 170, 145, ${alpha * 0.8})` // Light sage + brightness for dark mode
          : `rgba(153, 170, 145, ${alpha * 0.7})`; // Original light sage (143,160,135) + 10% brightness
    }
  };

  // Generate strong glass block border colors with refraction
  const getBorderColor = () => {
    const isDark = colorScheme === 'dark';
    const borderOpacity = isDark ? 0.50 : 0.55; // Original dark borders + 10% boost

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
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: isDark ? 0.4 : 0.12,
        shadowRadius: 6,
        elevation: 3,
      },
      medium: {
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: isDark ? 0.5 : 0.18,
        shadowRadius: 8,
        elevation: 6,
      },
      strong: {
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: isDark ? 0.6 : 0.22,
        shadowRadius: 12,
        elevation: 8,
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
    
    // Original Dark Sage Glass with 10% Brightness Boost
    liquidGlassBase: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(126, 146, 125, 0.16)', // Original sage (116,136,115) + 10% brightness + original 0.15 opacity + 0.01
      borderRadius: Spacing.layout.borderRadius.xl,
    },
    liquidGlassBaseDark: {
      backgroundColor: 'rgba(153, 170, 145, 0.13)', // Original light sage + brightness for dark mode
    },
    
    liquidGlassLayer1: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(126, 146, 125, 0.09)', // Original sage + brightness with original 0.08 + 0.01
      borderRadius: Spacing.layout.borderRadius.xl,
    },
    liquidGlassLayer1Dark: {
      backgroundColor: 'rgba(153, 170, 145, 0.07)', // Original light sage + brightness for dark mode
    },
    
    liquidGlassLayer2: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(255, 255, 255, 0.09)', // Original 0.08 white + 10% boost = 0.09
      borderRadius: Spacing.layout.borderRadius.xl,
    },
    liquidGlassLayer2Dark: {
      backgroundColor: 'rgba(255, 255, 255, 0.06)', // Original 0.05 + 10% boost
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
      borderTopColor: 'rgba(126, 146, 125, 0.65)', // Original sage (116,136,115) + brightness + original 0.6 + boost
      borderLeftColor: 'rgba(126, 146, 125, 0.65)',
      borderRightColor: 'rgba(105, 121, 104, 0.55)', // Original darker sage (95,111,94) + brightness + boost
      borderBottomColor: 'rgba(105, 121, 104, 0.55)',
    },
    insetShadowDarkMode: {
      borderTopColor: 'rgba(153, 170, 145, 0.55)', // Original light sage + brightness + boost
      borderLeftColor: 'rgba(153, 170, 145, 0.55)',
      borderRightColor: 'rgba(84, 95, 83, 0.45)', // Original dark sage (74,85,73) + brightness + boost
      borderBottomColor: 'rgba(84, 95, 83, 0.45)',
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
      borderTopColor: 'rgba(255, 255, 255, 0.44)', // Original 0.4 + 10% boost
      borderLeftColor: 'rgba(255, 255, 255, 0.44)',
      borderRightColor: 'rgba(255, 255, 255, 0.22)', // Original 0.2 + 10% boost
      borderBottomColor: 'rgba(255, 255, 255, 0.22)',
    },
    insetShadowLightMode: {
      borderTopColor: 'rgba(255, 255, 255, 0.33)', // Original 0.3 + 10% boost
      borderLeftColor: 'rgba(255, 255, 255, 0.33)',
      borderRightColor: 'rgba(255, 255, 255, 0.165)', // Original 0.15 + 10% boost
      borderBottomColor: 'rgba(255, 255, 255, 0.165)',
    },
    
    // Original Minimal Inner Glow with 10% Boost
    innerGlow: {
      position: 'absolute',
      top: 4,
      left: 4,
      right: 4,
      bottom: 4,
      borderRadius: Spacing.layout.borderRadius.xl - 4,
      backgroundColor: 'rgba(255, 255, 255, 0.022)', // Original 0.02 + 10% boost
      shadowColor: 'rgba(255, 255, 255, 0.55)', // Original 0.5 + 10% boost
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.33, // Original 0.3 + 10% boost
      shadowRadius: 8, // Original radius
      elevation: 0,
    },
    innerGlowDark: {
      backgroundColor: 'rgba(255, 255, 255, 0.011)', // Original 0.01 + 10% boost
      shadowColor: 'rgba(255, 255, 255, 0.33)', // Original 0.3 + 10% boost
      shadowOpacity: 0.22, // Original 0.2 + 10% boost
    },
    
    // Original Minimal Outer Glow with 10% Boost
    outerGlow: {
      position: 'absolute',
      top: 8,
      left: 8,
      right: 8,
      bottom: 8,
      borderRadius: Spacing.layout.borderRadius.xl - 8,
      backgroundColor: 'rgba(242, 242, 242, 0.033)', // Original (242,242,242,0.03) + 10% boost
      shadowColor: '#F2F2F2', // Original color
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.165, // Original 0.15 + 10% boost
      shadowRadius: 20, // Original radius
      elevation: 0,
    },
    outerGlowDark: {
      backgroundColor: 'rgba(200, 200, 200, 0.022)', // Original (200,200,200,0.02) + 10% boost
      shadowColor: '#CCCCCC', // Original color
      shadowOpacity: 0.11, // Original 0.1 + 10% boost
    },
    
    // Original Dark Glass Backdrop with 10% Brightness Boost
    backdropBlur: {
      ...StyleSheet.absoluteFillObject,
      backgroundColor: 'rgba(255, 255, 255, 0.11)', // Original 0.10 white + 10% boost = 0.11
      borderRadius: Spacing.layout.borderRadius.xl,
      // This restores the original dark glass effect with subtle brightness
    },
    backdropBlurDark: {
      backgroundColor: 'rgba(255, 255, 255, 0.07)', // Original 0.06 + 10% boost
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