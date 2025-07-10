import { StyleSheet, Text, TouchableOpacity, ViewStyle } from 'react-native';
import { DEBUG_FEATURES, debugNavigation } from '../src/config/debug';

interface DebugNextButtonProps {
  /** The name of the screen or step we're navigating to (for logging) */
  to: string;
  /** The navigation callback to execute - must be strictly independent of business logic */
  onPress: () => void;
  /** Optional label override - defaults to "Debug: Skip to {to}" */
  label?: string;
  /** Whether the button should be disabled */
  disabled?: boolean;
  /** Optional custom styling */
  style?: ViewStyle;
}

/**
 * DebugNextButton - Standardized debug navigation component
 * 
 * This component provides a consistent way to bypass backend dependencies
 * during development. It is automatically hidden in production builds.
 * 
 * IMPORTANT: The onPress callback must ONLY contain navigation logic.
 * It must NOT trigger any data submission, state updates, or API calls.
 */
export default function DebugNextButton({
  to,
  onPress,
  label,
  disabled = false,
  style,
}: DebugNextButtonProps) {
  // Don't render anything if debug mode is disabled
  if (!DEBUG_FEATURES.ENABLE_DEBUG_NAVIGATION) {
    return null;
  }

  const handlePress = () => {
    debugNavigation(to);
    onPress();
  };

  const displayLabel = label || `Debug: Skip to ${to}`;

  return (
    <TouchableOpacity
      style={[
        styles.debugButton,
        disabled && styles.debugButtonDisabled,
        style,
      ]}
      onPress={handlePress}
      disabled={disabled}
    >
      <Text style={styles.debugButtonText}>{displayLabel}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  debugButton: {
    backgroundColor: '#ff6b6b',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    marginVertical: 8,
    borderWidth: 2,
    borderColor: '#ff5252',
  },
  debugButtonDisabled: {
    opacity: 0.5,
    backgroundColor: '#ffcdd2',
  },
  debugButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
}); 