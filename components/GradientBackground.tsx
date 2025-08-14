import React, { ReactNode } from 'react';
import {
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useColorScheme } from '../hooks/useColorScheme';

interface GradientBackgroundProps {
  children: ReactNode;
  variant?: 'purple-blue' | 'purple-pink' | 'blue-teal' | 'custom';
  colors?: string[];
  locations?: number[];
  start?: { x: number; y: number };
  end?: { x: number; y: number };
  style?: ViewStyle;
  contentContainerStyle?: ViewStyle;
}

export const GradientBackground: React.FC<GradientBackgroundProps> = ({
  children,
  variant = 'purple-blue',
  colors: customColors,
  locations,
  start = { x: 0, y: 0 },
  end = { x: 1, y: 1 },
  style,
  contentContainerStyle,
}) => {
  const colorScheme = useColorScheme();

  // Get gradient colors based on variant and theme
  const getGradientColors = () => {
    const isDark = colorScheme === 'dark';

    if (customColors) {
      return customColors;
    }

    switch (variant) {
      case 'purple-blue':
        // Matches the reference image gradient
        return isDark
          ? [
              '#4A148C', // Deep purple
              '#6A1B9A', // Medium purple
              '#7E57C2', // Light purple
              '#5C6BC0', // Purple-blue
              '#42A5F5', // Light blue
            ]
          : [
              '#3D5AFE', // Bright blue
              '#6C63FF', // Primary purple
              '#8B7CF6', // Light purple
              '#A78BFA', // Very light purple
              '#C4B5FD', // Pale purple
            ];

      case 'purple-pink':
        return isDark
          ? [
              '#4A148C', // Deep purple
              '#7B1FA2', // Medium purple
              '#AD1457', // Deep pink
              '#E91E63', // Pink
            ]
          : [
              '#6C63FF', // Purple
              '#8B7CF6', // Light purple
              '#EC4899', // Pink
              '#F472B6', // Light pink
            ];

      case 'blue-teal':
        return isDark
          ? [
              '#0D47A1', // Deep blue
              '#1976D2', // Medium blue
              '#00838F', // Teal
              '#00ACC1', // Light teal
            ]
          : [
              '#3B82F6', // Blue
              '#06B6D4', // Cyan
              '#10B981', // Teal
              '#34D399', // Light teal
            ];

      case 'custom':
      default:
        return ['#6C63FF', '#8B7CF6'];
    }
  };

  const gradientColors = getGradientColors();
  const gradientLocations = locations || gradientColors.map((_, index) => 
    index / (gradientColors.length - 1)
  );

  return (
    <LinearGradient
      colors={gradientColors}
      locations={gradientLocations}
      start={start}
      end={end}
      style={[styles.container, style]}
    >
      <View style={[styles.contentContainer, contentContainerStyle]}>
        {children}
      </View>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    flex: 1,
  },
});

// Pre-configured gradient variants
export const PurpleBlueGradient: React.FC<Omit<GradientBackgroundProps, 'variant'>> = (props) => (
  <GradientBackground variant="purple-blue" {...props} />
);

export const PurplePinkGradient: React.FC<Omit<GradientBackgroundProps, 'variant'>> = (props) => (
  <GradientBackground variant="purple-pink" {...props} />
);

export const BlueTealGradient: React.FC<Omit<GradientBackgroundProps, 'variant'>> = (props) => (
  <GradientBackground variant="blue-teal" {...props} />
);

// Higher-order component for easy background wrapping
export const withGradientBackground = <P extends object>(
  Component: React.ComponentType<P>,
  gradientProps?: Partial<GradientBackgroundProps>
) => {
  const WrappedComponent = (props: P & { gradientProps?: Partial<GradientBackgroundProps> }) => {
    const { gradientProps: componentGradientProps, ...componentProps } = props;
    
    return (
      <GradientBackground {...gradientProps} {...componentGradientProps}>
        <Component {...(componentProps as P)} />
      </GradientBackground>
    );
  };

  WrappedComponent.displayName = `withGradientBackground(${Component.displayName || Component.name})`;
  return WrappedComponent;
};

export default GradientBackground;