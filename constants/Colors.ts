/**
 * Enhanced color system for Routy app with semantic design tokens.
 * Includes neutral shades, semantic colors, and opacity variants for modern UI design.
 */

const tintColorLight = '#6c63ff';
const tintColorDark = '#6c63ff';

export const Colors = {
  light: {
    // Backgrounds
    background: '#ffffff',
    surface: '#f8f9fa',
    card: '#ffffff',
    cardSecondary: '#f1f3f4',
    
    // Neutral color scale (50-900)
    neutral: {
      50: '#f9fafb',
      100: '#f3f4f6',
      200: '#e5e7eb',
      300: '#d1d5db',
      400: '#9ca3af',
      500: '#6b7280',
      600: '#4b5563',
      700: '#374151',
      800: '#1f2937',
      900: '#111827',
    },
    
    // Text colors
    text: '#1a1a1a',
    textSecondary: '#6b7280',
    textMuted: '#9ca3af',
    
    // Primary colors with variants
    primary: '#6c63ff',
    primaryLight: '#8b7cf6',
    primaryDark: '#5b52cc',
    tint: tintColorLight,
    
    // Semantic colors
    success: '#10b981',
    successLight: '#34d399',
    successDark: '#047857',
    
    warning: '#f59e0b',
    warningLight: '#fbbf24',
    warningDark: '#d97706',
    
    error: '#ef4444',
    errorLight: '#f87171',
    errorDark: '#dc2626',
    
    info: '#3b82f6',
    infoLight: '#60a5fa',
    infoDark: '#2563eb',
    
    // UI elements
    border: '#e5e7eb',
    borderLight: '#f3f4f6',
    borderDark: '#d1d5db',
    
    icon: '#6b7280',
    tabIconDefault: '#9ca3af',
    tabIconSelected: tintColorLight,
    
    // Interactive elements
    buttonPrimary: '#6c63ff',
    buttonSecondary: '#f3f4f6',
    buttonDisabled: '#e5e7eb',
    buttonGhost: 'transparent',
    buttonOutline: 'transparent',
    
    inputBackground: '#f9fafb',
    inputBorder: '#d1d5db',
    inputFocus: '#6c63ff',
    inputError: '#ef4444',
    inputSuccess: '#10b981',
    
    modalBackground: '#f8fafc',
    modalOverlay: 'rgba(0, 0, 0, 0.5)',
    
    // Gradients
    gradientStart: '#6c63ff',
    gradientEnd: '#8b7cf6',
    gradientSuccess: '#10b981',
    gradientWarning: '#f59e0b',
    gradientError: '#ef4444',
    
    // Opacity variants
    opacity: {
      10: 'rgba(0, 0, 0, 0.1)',
      20: 'rgba(0, 0, 0, 0.2)',
      30: 'rgba(0, 0, 0, 0.3)',
      50: 'rgba(0, 0, 0, 0.5)',
      80: 'rgba(0, 0, 0, 0.8)',
    },
    
    // Primary color with opacity
    primaryOpacity: {
      10: 'rgba(108, 99, 255, 0.1)',
      20: 'rgba(108, 99, 255, 0.2)',
      30: 'rgba(108, 99, 255, 0.3)',
      50: 'rgba(108, 99, 255, 0.5)',
      80: 'rgba(108, 99, 255, 0.8)',
    },
    
    // Typography system
    typography: {
      // Font sizes
      fontSize: {
        xs: 12,
        sm: 14,
        base: 16,
        lg: 18,
        xl: 20,
        '2xl': 24,
        '3xl': 28,
        '4xl': 32,
        '5xl': 48,
      },
      
      // Font weights
      fontWeight: {
        light: '300',
        regular: '400',
        medium: '500',
        semibold: '600',
        bold: '700',
        extrabold: '800',
      },
      
      // Line heights
      lineHeight: {
        tight: 1.2,
        snug: 1.3,
        normal: 1.5,
        relaxed: 1.75,
        loose: 2,
      },
      
      // Letter spacing
      letterSpacing: {
        tight: -0.5,
        normal: 0,
        wide: 0.5,
        wider: 1,
        widest: 2,
      },
      
      // Text variants for common use cases
      variants: {
        h1: {
          fontSize: 32,
          fontWeight: '700',
          lineHeight: 1.2,
          letterSpacing: -0.5,
        },
        h2: {
          fontSize: 28,
          fontWeight: '600',
          lineHeight: 1.3,
          letterSpacing: -0.5,
        },
        h3: {
          fontSize: 24,
          fontWeight: '600',
          lineHeight: 1.3,
          letterSpacing: 0,
        },
        h4: {
          fontSize: 20,
          fontWeight: '600',
          lineHeight: 1.4,
          letterSpacing: 0,
        },
        body: {
          fontSize: 16,
          fontWeight: '400',
          lineHeight: 1.5,
          letterSpacing: 0,
        },
        bodySmall: {
          fontSize: 14,
          fontWeight: '400',
          lineHeight: 1.5,
          letterSpacing: 0,
        },
        caption: {
          fontSize: 12,
          fontWeight: '400',
          lineHeight: 1.4,
          letterSpacing: 0.5,
        },
        button: {
          fontSize: 16,
          fontWeight: '600',
          lineHeight: 1.2,
          letterSpacing: 0.5,
        },
        label: {
          fontSize: 14,
          fontWeight: '500',
          lineHeight: 1.2,
          letterSpacing: 0.5,
        },
      },
    },
  },
  dark: {
    // Backgrounds
    background: '#1c1c2e',
    surface: '#2a2a42',
    card: '#3a3a50',
    cardSecondary: '#2f2f45',
    
    // Neutral color scale (50-900) - Inverted for dark mode
    neutral: {
      50: '#111827',
      100: '#1f2937',
      200: '#374151',
      300: '#4b5563',
      400: '#6b7280',
      500: '#9ca3af',
      600: '#d1d5db',
      700: '#e5e7eb',
      800: '#f3f4f6',
      900: '#f9fafb',
    },
    
    // Text colors
    text: '#ffffff',
    textSecondary: '#a9a9c2',
    textMuted: '#7a7a95',
    
    // Primary colors with variants
    primary: '#6c63ff',
    primaryLight: '#8b7cf6',
    primaryDark: '#5b52cc',
    tint: tintColorDark,
    
    // Semantic colors
    success: '#4CAF50',
    successLight: '#66bb6a',
    successDark: '#2e7d32',
    
    warning: '#FFC107',
    warningLight: '#ffca28',
    warningDark: '#f57c00',
    
    error: '#ff4757',
    errorLight: '#ff6b7a',
    errorDark: '#d32f2f',
    
    info: '#42a5f5',
    infoLight: '#64b5f6',
    infoDark: '#1976d2',
    
    // UI elements
    border: '#4a4a60',
    borderLight: '#5a5a70',
    borderDark: '#3a3a50',
    
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
    
    // Interactive elements
    buttonPrimary: '#6c63ff',
    buttonSecondary: '#4a4a60',
    buttonDisabled: '#4a47cc',
    buttonGhost: 'transparent',
    buttonOutline: 'transparent',
    
    inputBackground: '#3a3a50',
    inputBorder: '#4a4a60',
    inputFocus: '#6c63ff',
    inputError: '#ff4757',
    inputSuccess: '#4CAF50',
    
    modalBackground: '#5a5a70',
    modalOverlay: 'rgba(0, 0, 0, 0.7)',
    
    // Gradients
    gradientStart: '#1c1c2e',
    gradientEnd: '#2a2a4a',
    gradientSuccess: '#4CAF50',
    gradientWarning: '#FFC107',
    gradientError: '#ff4757',
    
    // Opacity variants
    opacity: {
      10: 'rgba(255, 255, 255, 0.1)',
      20: 'rgba(255, 255, 255, 0.2)',
      30: 'rgba(255, 255, 255, 0.3)',
      50: 'rgba(255, 255, 255, 0.5)',
      80: 'rgba(255, 255, 255, 0.8)',
    },
    
    // Primary color with opacity
    primaryOpacity: {
      10: 'rgba(108, 99, 255, 0.1)',
      20: 'rgba(108, 99, 255, 0.2)',
      30: 'rgba(108, 99, 255, 0.3)',
      50: 'rgba(108, 99, 255, 0.5)',
      80: 'rgba(108, 99, 255, 0.8)',
    },
    
    // Typography system (same for both light and dark modes)
    typography: {
      // Font sizes
      fontSize: {
        xs: 12,
        sm: 14,
        base: 16,
        lg: 18,
        xl: 20,
        '2xl': 24,
        '3xl': 28,
        '4xl': 32,
        '5xl': 48,
      },
      
      // Font weights
      fontWeight: {
        light: '300',
        regular: '400',
        medium: '500',
        semibold: '600',
        bold: '700',
        extrabold: '800',
      },
      
      // Line heights
      lineHeight: {
        tight: 1.2,
        snug: 1.3,
        normal: 1.5,
        relaxed: 1.75,
        loose: 2,
      },
      
      // Letter spacing
      letterSpacing: {
        tight: -0.5,
        normal: 0,
        wide: 0.5,
        wider: 1,
        widest: 2,
      },
      
      // Text variants for common use cases
      variants: {
        h1: {
          fontSize: 32,
          fontWeight: '700',
          lineHeight: 1.2,
          letterSpacing: -0.5,
        },
        h2: {
          fontSize: 28,
          fontWeight: '600',
          lineHeight: 1.3,
          letterSpacing: -0.5,
        },
        h3: {
          fontSize: 24,
          fontWeight: '600',
          lineHeight: 1.3,
          letterSpacing: 0,
        },
        h4: {
          fontSize: 20,
          fontWeight: '600',
          lineHeight: 1.4,
          letterSpacing: 0,
        },
        body: {
          fontSize: 16,
          fontWeight: '400',
          lineHeight: 1.5,
          letterSpacing: 0,
        },
        bodySmall: {
          fontSize: 14,
          fontWeight: '400',
          lineHeight: 1.5,
          letterSpacing: 0,
        },
        caption: {
          fontSize: 12,
          fontWeight: '400',
          lineHeight: 1.4,
          letterSpacing: 0.5,
        },
        button: {
          fontSize: 16,
          fontWeight: '600',
          lineHeight: 1.2,
          letterSpacing: 0.5,
        },
        label: {
          fontSize: 14,
          fontWeight: '500',
          lineHeight: 1.2,
          letterSpacing: 0.5,
        },
      },
    },
  },
};
