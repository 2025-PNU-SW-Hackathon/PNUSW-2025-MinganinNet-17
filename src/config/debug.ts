/**
 * Debug Configuration
 * 
 * This file contains debug settings for development purposes only.
 * The debug features are automatically disabled in production builds.
 */

// Global debug flag - automatically disabled in production
export const IS_DEBUG_MODE_ENABLED = __DEV__;

// Debug feature flags
export const DEBUG_FEATURES = {
  // Enable debug navigation buttons that bypass backend calls
  ENABLE_DEBUG_NAVIGATION: IS_DEBUG_MODE_ENABLED,
  
  // Enable debug logging
  ENABLE_DEBUG_LOGGING: IS_DEBUG_MODE_ENABLED,
  
  // Enable debug overlays
  ENABLE_DEBUG_OVERLAYS: IS_DEBUG_MODE_ENABLED,
} as const;

// Debug logging utility
export const debugLog = (message: string, ...args: any[]) => {
  if (DEBUG_FEATURES.ENABLE_DEBUG_LOGGING) {
    console.log(`🐛 DEBUG: ${message}`, ...args);
  }
};

// Debug navigation utility
export const debugNavigation = (screenName: string, data?: any) => {
  if (DEBUG_FEATURES.ENABLE_DEBUG_LOGGING) {
    console.log(`🧭 DEBUG NAV: Bypassing backend to navigate to ${screenName}`, data);
  }
}; 