import { create } from 'zustand';

/**
 * Debug Configuration
 * 
 * This file contains debug settings for development purposes only.
 * The debug features are manually controlled by the user and only available in dev builds.
 */

// Debug state interface
interface DebugState {
  isDebugEnabled: boolean;
  toggleDebug: () => void;
  enableDebug: () => void;
  disableDebug: () => void;
}

// Zustand store for debug state
export const useDebugStore = create<DebugState>((set, get) => ({
  isDebugEnabled: false, // Default OFF - must be manually enabled
  toggleDebug: () => {
    const newState = !get().isDebugEnabled;
    set({ isDebugEnabled: newState });
    console.log(`🐛 DEBUG MODE: ${newState ? 'ENABLED' : 'DISABLED'}`);
  },
  enableDebug: () => {
    set({ isDebugEnabled: true });
    console.log('🐛 DEBUG MODE: ENABLED');
  },
  disableDebug: () => {
    set({ isDebugEnabled: false });
    console.log('🐛 DEBUG MODE: DISABLED');
  },
}));

// Helper hook for components
export const useIsDebugMode = () => useDebugStore(state => state.isDebugEnabled);

// Legacy support - now uses manual debug mode
export const IS_DEBUG_MODE_ENABLED = false; // Deprecated, use useIsDebugMode() instead

// Debug feature flags - now based on manual toggle
export const useDebugFeatures = () => {
  const isDebugEnabled = useIsDebugMode();
  return {
    ENABLE_DEBUG_NAVIGATION: __DEV__ && isDebugEnabled,
    ENABLE_DEBUG_LOGGING: __DEV__ && isDebugEnabled,
    ENABLE_DEBUG_OVERLAYS: __DEV__ && isDebugEnabled,
  };
};

// Debug logging utility
export const debugLog = (message: string, ...args: any[]) => {
  const { isDebugEnabled } = useDebugStore.getState();
  if (__DEV__ && isDebugEnabled) {
    console.log(`🐛 DEBUG: ${message}`, ...args);
  }
};

// Debug navigation utility
export const debugNavigation = (screenName: string, data?: any) => {
  const { isDebugEnabled } = useDebugStore.getState();
  if (__DEV__ && isDebugEnabled) {
    console.log(`🧭 DEBUG NAV: Bypassing backend to navigate to ${screenName}`, data);
  }
}; 