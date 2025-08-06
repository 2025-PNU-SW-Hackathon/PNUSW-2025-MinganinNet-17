/**
 * Structured App Styling Utilities
 * Provides consistent styling patterns for the clean, minimal design theme
 */

import { ViewStyle, TextStyle } from 'react-native';
import { Colors } from './Colors';

// Border Radius System
export const BorderRadius = {
  none: 0,
  small: 8,
  medium: 12,
  large: 16,
  circle: 50,
} as const;

// Spacing System
export const Spacing = {
  none: 0,
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

// Typography System
export const Typography = {
  // Headers
  h1: {
    fontSize: 28,
    fontWeight: '700' as const,
    letterSpacing: -0.5,
  },
  h2: {
    fontSize: 24,
    fontWeight: '600' as const,
    letterSpacing: -0.3,
  },
  h3: {
    fontSize: 20,
    fontWeight: '600' as const,
    letterSpacing: -0.2,
  },
  h4: {
    fontSize: 18,
    fontWeight: '500' as const,
  },
  
  // Body Text
  body: {
    fontSize: 16,
    fontWeight: '400' as const,
    lineHeight: 24,
  },
  bodyMedium: {
    fontSize: 16,
    fontWeight: '500' as const,
    lineHeight: 24,
  },
  bodySmall: {
    fontSize: 14,
    fontWeight: '400' as const,
    lineHeight: 20,
  },
  
  // Labels & Captions
  label: {
    fontSize: 14,
    fontWeight: '500' as const,
    letterSpacing: 0.1,
  },
  caption: {
    fontSize: 12,
    fontWeight: '400' as const,
    lineHeight: 16,
  },
  captionBold: {
    fontSize: 12,
    fontWeight: '600' as const,
    lineHeight: 16,
  },
  
  // Button Text
  button: {
    fontSize: 16,
    fontWeight: '600' as const,
    letterSpacing: 0.2,
  },
  buttonSmall: {
    fontSize: 14,
    fontWeight: '500' as const,
    letterSpacing: 0.1,
  },
} as const;

// Component Styles
export const ComponentStyles = {
  // Cards
  card: {
    borderRadius: BorderRadius.medium,
    padding: Spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  } as ViewStyle,
  
  cardLarge: {
    borderRadius: BorderRadius.large,
    padding: Spacing.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  } as ViewStyle,
  
  // Buttons
  primaryButton: {
    borderRadius: BorderRadius.medium,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  } as ViewStyle,
  
  secondaryButton: {
    borderRadius: BorderRadius.medium,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.xl,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
    borderWidth: 1,
  } as ViewStyle,
  
  // Input Fields
  input: {
    borderRadius: BorderRadius.small,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderWidth: 1,
    fontSize: 16,
  } as ViewStyle,
  
  // Timeline Elements
  timelineItem: {
    flexDirection: 'row' as const,
    alignItems: 'center' as const,
    paddingVertical: Spacing.md,
  } as ViewStyle,
  
  timelineConnector: {
    width: 2,
    position: 'absolute' as const,
    left: 11, // Center of 24px circle
  } as ViewStyle,
  
  timelineCircle: {
    width: 24,
    height: 24,
    borderRadius: BorderRadius.circle,
    marginRight: Spacing.lg,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  } as ViewStyle,
  
  // Calendar Elements
  calendarDot: {
    width: 8,
    height: 8,
    borderRadius: BorderRadius.circle,
  } as ViewStyle,
  
  calendarDay: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.circle,
    alignItems: 'center' as const,
    justifyContent: 'center' as const,
  } as ViewStyle,
} as const;

// Theme-specific helpers
export const createThemedStyle = (colorScheme: 'light' | 'dark') => {
  const colors = Colors[colorScheme];
  
  return {
    container: {
      backgroundColor: colors.background,
    } as ViewStyle,
    
    card: {
      ...ComponentStyles.card,
      backgroundColor: colors.card,
    } as ViewStyle,
    
    primaryButton: {
      ...ComponentStyles.primaryButton,
      backgroundColor: colors.tint,
    } as ViewStyle,
    
    secondaryButton: {
      ...ComponentStyles.secondaryButton,
      backgroundColor: 'transparent',
      borderColor: colors.icon,
    } as ViewStyle,
    
    input: {
      ...ComponentStyles.input,
      backgroundColor: colors.background,
      borderColor: colors.icon,
      color: colors.text,
    } as ViewStyle,
    
    text: {
      color: colors.text,
    } as TextStyle,
    
    textSecondary: {
      color: colors.icon,
    } as TextStyle,
    
    textMuted: {
      color: colors.tabIconDefault,
    } as TextStyle,
  };
};

// Gradient helpers for LinearGradient (to be implemented when needed)
export const createGradientProps = (colors: string[]) => ({
  colors,
  start: { x: 0, y: 0 },
  end: { x: 1, y: 1 },
});

// Time-based gradient helpers
export const createTimeBasedGradient = (isNight: boolean = false) => {
  const nightColors = ['#1c1c2e', '#2a2a4a'];
  const sunsetColors = ['#6c63ff', '#8b7cf6'];
  return createGradientProps(isNight ? nightColors : sunsetColors);
};