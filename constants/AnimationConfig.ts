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
} as const;

export type AnimationDirection = typeof AnimationConfig.DIRECTION[keyof typeof AnimationConfig.DIRECTION]; 