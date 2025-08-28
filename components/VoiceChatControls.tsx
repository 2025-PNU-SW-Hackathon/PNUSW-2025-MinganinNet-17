import React, { useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Text, AccessibilityActionEvent } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import { VoiceChatControlsProps } from '../types/voice';
import { Colors } from '../constants/Colors';
import { Spacing } from '../constants/Spacing';
import { useColorScheme } from '../hooks/useColorScheme';

const VoiceChatControls: React.FC<VoiceChatControlsProps> = ({
  onPause,
  onResume,
  isPaused,
  disabled = false,
}) => {
  const pauseScale = useSharedValue(1);
  const pauseOpacity = useSharedValue(1);

  // Theme integration
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const styles = createStyles(colors);

  useEffect(() => {
    if (disabled) {
      pauseOpacity.value = withTiming(0.5, { duration: 200 });
    } else {
      pauseOpacity.value = withTiming(1, { duration: 200 });
    }
  }, [disabled, pauseOpacity]);

  const handlePausePress = () => {
    if (disabled) return;
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    // Animation
    pauseScale.value = withSpring(0.9, { damping: 15, stiffness: 300 }, () => {
      pauseScale.value = withSpring(1, { damping: 15, stiffness: 300 });
    });
    
    if (isPaused) {
      onResume();
    } else {
      onPause();
    }
  };

  const pauseButtonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pauseScale.value }],
    opacity: pauseOpacity.value,
  }));

  return (
    <View 
      style={styles.container}
      accessible={false} // Allow individual buttons to be focused
      accessibilityRole="group"
      accessibilityLabel="음성 채팅 제어 버튼"
    >
      {/* Centered Pause/Resume Button */}
      <Animated.View style={[pauseButtonStyle]}>
        <TouchableOpacity
          style={[styles.controlButton, styles.pauseButton]}
          onPress={handlePausePress}
          disabled={disabled}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel={isPaused ? "음성 재개" : "음성 일시정지"}
          accessibilityHint={
            disabled 
              ? "현재 사용할 수 없습니다" 
              : isPaused 
                ? "두 번 탭하면 음성 채팅을 재개합니다" 
                : "두 번 탭하면 음성 채팅을 일시정지합니다"
          }
          accessibilityState={{ 
            disabled: disabled,
            selected: !isPaused // Playing state is "selected"
          }}
          accessibilityActions={[
            { name: 'activate', label: isPaused ? '재개' : '일시정지' }
          ]}
          onAccessibilityAction={(event: AccessibilityActionEvent) => {
            if (event.nativeEvent.actionName === 'activate') {
              handlePausePress();
            }
          }}
        >
          {isPaused ? (
            // Resume icon (play triangle)
            <View 
              style={styles.playIcon} 
              accessible={false} // Icon is decorative, parent button has label
            />
          ) : (
            // Pause icon (two bars)
            <View 
              style={styles.pauseIcon}
              accessible={false} // Icon is decorative, parent button has label
            >
              <View style={styles.pauseBar} />
              <View style={styles.pauseBar} />
            </View>
          )}
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

const createStyles = (colors: typeof Colors.light) => StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'flex-start', // position button on left
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: Spacing['3xl'],
    paddingBottom: Spacing['5xl'],
    position: 'absolute',
    bottom: 0,
  },
  controlButton: {
    width: 96, // 96px (20% smaller than 120px)
    height: 96, // 96px (20% smaller than 120px)
    borderRadius: 48, // 48px radius for 96px diameter
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.neutral[900],
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  pauseButton: {
    backgroundColor: colors.surface, // Solid surface background
    borderWidth: 1,
    borderColor: colors.border, // Solid border
  },
  pauseIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pauseBar: {
    width: 6, // scaled down for 96px button (20% smaller than 7)
    height: 28, // scaled down for 96px button (20% smaller than 35)
    backgroundColor: colors.text,
    borderRadius: 3,
    marginHorizontal: 2,
  },
  playIcon: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 18, // scaled down for 96px button (20% smaller than 22)
    borderRightWidth: 0,
    borderBottomWidth: 11, // scaled down for 96px button (20% smaller than 14)
    borderTopWidth: 11, // scaled down for 96px button (20% smaller than 14)
    borderLeftColor: colors.text,
    borderRightColor: 'transparent',
    borderBottomColor: 'transparent',
    borderTopColor: 'transparent',
    marginLeft: 5, // scaled down for 96px button (20% smaller than 6)
  },
});

export default VoiceChatControls;