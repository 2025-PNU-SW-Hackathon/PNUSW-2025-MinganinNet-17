/**
 * Spacing and layout constants for consistent design system
 * Based on 4px base unit with harmonious scale
 */

export const Spacing = {
  // Base spacing scale (multiples of 4px)
  xs: 2,    // 2px
  sm: 4,    // 4px
  md: 8,    // 8px
  lg: 12,   // 12px
  xl: 16,   // 16px
  '2xl': 20, // 20px
  '3xl': 24, // 24px
  '4xl': 32, // 32px
  '5xl': 40, // 40px
  '6xl': 48, // 48px
  '7xl': 64, // 64px
  
  // Semantic spacing for specific use cases
  button: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    gap: 8,
  },
  
  card: {
    padding: 20,
    margin: 16,
    gap: 16,
  },
  
  input: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 16,
  },
  
  screen: {
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  
  section: {
    marginBottom: 32,
    gap: 20,
  },
  
  // Layout constants
  layout: {
    borderRadius: {
      sm: 8,
      md: 12,
      lg: 16,
      xl: 20,
      full: 9999,
    },
    
    elevation: {
      sm: 2,
      md: 4,
      lg: 8,
      xl: 16,
    },
    
    // Common component sizes
    button: {
      height: {
        sm: 40,
        md: 48,
        lg: 56,
        xl: 64,
      },
    },
    
    input: {
      height: {
        sm: 40,
        md: 48,
        lg: 56,
      },
    },
    
    // Header and footer heights
    header: 64,
    tabBar: 80,
    floatingButton: 64,
  },
};

// Utility functions for responsive spacing
export const getResponsiveSpacing = (base: number, factor: number = 1.2) => ({
  mobile: base,
  tablet: Math.round(base * factor),
  desktop: Math.round(base * factor * factor),
});

// Helper function to create consistent padding/margin objects
export const createSpacing = (
  top?: keyof typeof Spacing | number,
  right?: keyof typeof Spacing | number,
  bottom?: keyof typeof Spacing | number,
  left?: keyof typeof Spacing | number
) => {
  const getValue = (value?: keyof typeof Spacing | number) => {
    if (typeof value === 'number') return value;
    if (typeof value === 'string' && value in Spacing) {
      return Spacing[value as keyof typeof Spacing];
    }
    return 0;
  };

  return {
    paddingTop: getValue(top),
    paddingRight: getValue(right ?? top),
    paddingBottom: getValue(bottom ?? top),
    paddingLeft: getValue(left ?? right ?? top),
  };
};

export const createMargin = (
  top?: keyof typeof Spacing | number,
  right?: keyof typeof Spacing | number,
  bottom?: keyof typeof Spacing | number,
  left?: keyof typeof Spacing | number
) => {
  const getValue = (value?: keyof typeof Spacing | number) => {
    if (typeof value === 'number') return value;
    if (typeof value === 'string' && value in Spacing) {
      return Spacing[value as keyof typeof Spacing];
    }
    return 0;
  };

  return {
    marginTop: getValue(top),
    marginRight: getValue(right ?? top),
    marginBottom: getValue(bottom ?? top),
    marginLeft: getValue(left ?? right ?? top),
  };
};