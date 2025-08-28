/**
 * Global Animation Configuration
 * 
 * This file controls all screen transition animations in the app.
 * Change ENABLE_SCREEN_TRANSITIONS to false to disable all animations.
 */

export const AnimationConfig = {
  // Global toggle for all screen transitions
  ENABLE_SCREEN_TRANSITIONS: true,
  
  // Animation timing settings
  TRANSITION_DURATION: 300,
  TRANSITION_EASING: 'easeInOut' as const,
  
  // Animation properties
  SLIDE_DISTANCE: 100, // Percentage of screen width
  FADE_OPACITY: 0.8,
  
  // Animation directions
  DIRECTION: {
    SLIDE_OUT: 'left' as const,
    SLIDE_IN: 'right' as const,
  },
  
  // Delay between exit and enter animations
  TRANSITION_DELAY: 50,
  
  // Tab-specific animation settings
  TABS: {
    // Liquid indicator animation
    INDICATOR: {
      DURATION: 350,
      DAMPING: 15,
      STIFFNESS: 150,
      OVERSHOOT: false,
    },
    
    // Tab content slide transition
    CONTENT: {
      DURATION: 300,
      EASING: [0.25, 0.46, 0.45, 0.94] as const, // easeOutQuad
      OPACITY_DURATION: 200,
    },
    
    // Tab icon micro-animations
    ICONS: {
      SCALE_DURATION: 200,
      SCALE_SELECTED: 1.05,
      SCALE_UNSELECTED: 1.0,
      OPACITY_SELECTED: 1.0,
      OPACITY_UNSELECTED: 0.7,
      COLOR_DURATION: 250,
    },
  },
} as const;

export type AnimationDirection = typeof AnimationConfig.DIRECTION[keyof typeof AnimationConfig.DIRECTION]; 