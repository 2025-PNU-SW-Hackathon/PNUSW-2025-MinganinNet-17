import { Platform, StyleSheet, Text, TouchableOpacity, ViewStyle } from 'react-native';
import { IS_DEBUG_MODE_ENABLED } from '../src/config/debug';

interface DebugNextButtonProps {
  to: string;
  onPress: () => void;
  label: string;
  disabled?: boolean;
  style?: ViewStyle;
}

export default function DebugNextButton({
  to,
  onPress,
  label,
  disabled = false,
  style,
}: DebugNextButtonProps) {
  // Only show in debug mode
  if (!IS_DEBUG_MODE_ENABLED) {
    return null;
  }

  const handlePress = () => {
    // Enhanced event handling for web compatibility
    try {
      console.log('🐛 DEBUG: Navigating to', to);
      onPress();
    } catch (error) {
      console.error('🐛 DEBUG: Navigation error:', error);
    }
  };

  return (
    <TouchableOpacity
      style={[
        styles.floatingButton,
        Platform.OS === 'web' && styles.floatingButtonWeb,
        disabled && styles.disabled,
        style
      ]}
      onPress={handlePress}
      disabled={disabled}
      activeOpacity={0.7}
    >
      <Text style={[styles.buttonText, disabled && styles.disabledText]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  floatingButton: {
    position: 'absolute',
    bottom: 120,
    right: 16,
    backgroundColor: '#ff6b6b',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    maxWidth: 200,
    zIndex: 9999,
    // Enhanced shadow for better visibility
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  floatingButtonWeb: {
    // Web-specific styles
    position: 'fixed' as any,
    cursor: 'pointer',
    userSelect: 'none' as any,
    // Enhanced web shadow
    boxShadow: '0 4px 8px rgba(0, 0, 0, 0.3)',
    // Ensure proper layering on web
    zIndex: 10000,
  },
  buttonText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '600',
    textAlign: 'center',
    lineHeight: 12,
  },
  disabled: {
    opacity: 0.5,
  },
  disabledText: {
    color: '#cccccc',
  },
}); 