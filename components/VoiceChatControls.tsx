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

const VoiceChatControls: React.FC<VoiceChatControlsProps> = ({
  onPause,
  onResume,
  onClose,
  isPaused,
  disabled = false,
}) => {
  const pauseScale = useSharedValue(1);
  const closeScale = useSharedValue(1);
  const pauseOpacity = useSharedValue(1);
  const closeOpacity = useSharedValue(1);

  useEffect(() => {
    if (disabled) {
      pauseOpacity.value = withTiming(0.5, { duration: 200 });
      closeOpacity.value = withTiming(1, { duration: 200 });
    } else {
      pauseOpacity.value = withTiming(1, { duration: 200 });
      closeOpacity.value = withTiming(1, { duration: 200 });
    }
  }, [disabled, pauseOpacity, closeOpacity]);

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

  const handleClosePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    
    // Animation
    closeScale.value = withSpring(0.9, { damping: 15, stiffness: 300 }, () => {
      closeScale.value = withSpring(1, { damping: 15, stiffness: 300 });
    });
    
    onClose();
  };

  const pauseButtonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pauseScale.value }],
    opacity: pauseOpacity.value,
  }));

  const closeButtonStyle = useAnimatedStyle(() => ({
    transform: [{ scale: closeScale.value }],
    opacity: closeOpacity.value,
  }));

  return (
    <View 
      style={styles.container}
      accessible={false} // Allow individual buttons to be focused
      accessibilityRole="group"
      accessibilityLabel="음성 채팅 제어 버튼"
    >
      {/* Pause/Resume Button */}
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

      {/* Close Button */}
      <Animated.View style={[closeButtonStyle]}>
        <TouchableOpacity
          style={[styles.controlButton, styles.closeButton]}
          onPress={handleClosePress}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="음성 채팅 종료"
          accessibilityHint="두 번 탭하면 음성 채팅을 종료하고 이전 화면으로 돌아갑니다"
          accessibilityState={{ disabled: false }}
          accessibilityActions={[
            { name: 'activate', label: '종료' }
          ]}
          onAccessibilityAction={(event: AccessibilityActionEvent) => {
            if (event.nativeEvent.actionName === 'activate') {
              handleClosePress();
            }
          }}
        >
          <Text 
            style={styles.closeIcon}
            accessible={false} // Icon is decorative, parent button has label
          >
            ✕
          </Text>
        </TouchableOpacity>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    paddingHorizontal: 40,
    paddingBottom: 60,
    position: 'absolute',
    bottom: 0,
  },
  controlButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  pauseButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  closeButton: {
    backgroundColor: '#FF6B6B',
    borderWidth: 2,
    borderColor: 'rgba(255, 107, 107, 0.3)',
  },
  pauseIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pauseBar: {
    width: 4,
    height: 20,
    backgroundColor: '#333',
    borderRadius: 2,
    marginHorizontal: 2,
  },
  playIcon: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 12,
    borderRightWidth: 0,
    borderBottomWidth: 8,
    borderTopWidth: 8,
    borderLeftColor: '#333',
    borderRightColor: 'transparent',
    borderBottomColor: 'transparent',
    borderTopColor: 'transparent',
    marginLeft: 3,
  },
  closeIcon: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 24,
  },
});

export default VoiceChatControls;