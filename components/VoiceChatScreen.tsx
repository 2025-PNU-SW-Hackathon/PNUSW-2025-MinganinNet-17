import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  Text,
  TouchableOpacity,
  StatusBar,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  Easing,
} from 'react-native-reanimated';
import * as Haptics from 'expo-haptics';
import VoiceVisualizer from './VoiceVisualizer';
import VoiceChatControls from './VoiceChatControls';
import { VoiceChatScreenProps, VoiceChatState, VOICE_STATE_CONFIG } from '../types/voice';

// const { width: screenWidth } = Dimensions.get('window'); // For future responsive features

const VoiceChatScreen: React.FC<VoiceChatScreenProps> = ({
  visible,
  onClose,
  onVoiceInput,
  onError,
}) => {
  const [currentState, setCurrentState] = useState<VoiceChatState>('idle');
  const [isPaused, setIsPaused] = useState(false);
  const [, setMockConversation] = useState<string[]>([]); // For future conversation history

  // Animation values
  const fadeAnim = useSharedValue(0);
  const scaleAnim = useSharedValue(0.8);
  const textFadeAnim = useSharedValue(0);

  // Demo state cycling for testing
  const stateTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (visible) {
      // Animate in
      fadeAnim.value = withTiming(1, { duration: 300 });
      scaleAnim.value = withSpring(1, { damping: 15, stiffness: 300 });
      textFadeAnim.value = withTiming(1, { duration: 500, easing: Easing.out(Easing.quad) });
      
      // Reset to idle state
      setCurrentState('idle');
      setIsPaused(false);
    } else {
      // Animate out
      fadeAnim.value = withTiming(0, { duration: 200 });
      scaleAnim.value = withTiming(0.8, { duration: 200 });
      textFadeAnim.value = withTiming(0, { duration: 200 });
      
      // Clear any ongoing timeouts
      if (stateTimeoutRef.current) {
        clearTimeout(stateTimeoutRef.current);
      }
    }
  }, [visible]);

  // Mock voice interaction flow for demo purposes
  const startMockVoiceInteraction = () => {
    setCurrentState('listening');
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    // Mock listening duration
    stateTimeoutRef.current = setTimeout(() => {
      setCurrentState('processing');
      
      // Mock processing duration
      stateTimeoutRef.current = setTimeout(() => {
        setCurrentState('speaking');
        
        // Mock speaking duration
        stateTimeoutRef.current = setTimeout(() => {
          setCurrentState('idle');
          
          // Add to mock conversation
          const responses = [
            "오늘 습관 관리를 도와드릴게요!",
            "현재 목표를 확인해 보겠습니다...",
            "지금까지 진행상황이 정말 좋네요!",
            "새로운 습관을 추가하시겠어요?",
            "여러분의 성장 여정을 응원합니다.",
          ];
          const randomResponse = responses[Math.floor(Math.random() * responses.length)];
          setMockConversation(prev => [...prev, randomResponse]);
          
          if (onVoiceInput) {
            onVoiceInput(randomResponse);
          }
        }, 3000);
      }, 2000);
    }, 2000);
  };

  const handleMainAreaPress = () => {
    if (currentState === 'idle') {
      startMockVoiceInteraction();
    } else if (currentState === 'listening' && VOICE_STATE_CONFIG[currentState].allowInterrupt) {
      // Stop listening
      if (stateTimeoutRef.current) {
        clearTimeout(stateTimeoutRef.current);
      }
      setCurrentState('processing');
      
      // Continue to processing after interrupt
      stateTimeoutRef.current = setTimeout(() => {
        setCurrentState('speaking');
        stateTimeoutRef.current = setTimeout(() => {
          setCurrentState('idle');
        }, 2000);
      }, 1000);
    } else if (currentState === 'speaking' && VOICE_STATE_CONFIG[currentState].allowInterrupt) {
      // Interrupt speaking
      if (stateTimeoutRef.current) {
        clearTimeout(stateTimeoutRef.current);
      }
      setCurrentState('idle');
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    } else if (currentState === 'processing' && VOICE_STATE_CONFIG[currentState].allowInterrupt) {
      // Cancel processing
      if (stateTimeoutRef.current) {
        clearTimeout(stateTimeoutRef.current);
      }
      setCurrentState('idle');
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }
  };

  const handlePause = () => {
    setIsPaused(true);
    if (stateTimeoutRef.current) {
      clearTimeout(stateTimeoutRef.current);
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleResume = () => {
    setIsPaused(false);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    // Resume from where we left off
    if (currentState === 'listening') {
      stateTimeoutRef.current = setTimeout(() => {
        setCurrentState('processing');
      }, 1000);
    } else if (currentState === 'processing') {
      stateTimeoutRef.current = setTimeout(() => {
        setCurrentState('speaking');
      }, 1500);
    } else if (currentState === 'speaking') {
      stateTimeoutRef.current = setTimeout(() => {
        setCurrentState('idle');
      }, 2000);
    }
  };

  const handleClose = () => {
    // Clean up
    if (stateTimeoutRef.current) {
      clearTimeout(stateTimeoutRef.current);
    }
    setCurrentState('idle');
    setIsPaused(false);
    onClose();
  };

  // Animated styles
  const modalStyle = useAnimatedStyle(() => ({
    opacity: fadeAnim.value,
    transform: [{ scale: scaleAnim.value }],
  }));

  const textStyle = useAnimatedStyle(() => ({
    opacity: textFadeAnim.value,
  }));

  const config = VOICE_STATE_CONFIG[currentState];

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="none"
      onRequestClose={handleClose}
      statusBarTranslucent={true}
    >
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      <Animated.View style={[styles.modalContainer, modalStyle]}>
        <SafeAreaView style={styles.safeArea}>
          {/* Main interaction area */}
          <TouchableOpacity
            style={styles.mainArea}
            onPress={handleMainAreaPress}
            activeOpacity={0.95}
            disabled={isPaused}
          >
            {/* Status text */}
            <Animated.View style={[styles.statusContainer, textStyle]}>
              <Text style={styles.titleText}>{config.title}</Text>
              <Text style={styles.subtitleText}>{config.subtitle}</Text>
              
              {/* Microphone icon for idle/listening states */}
              {config.showMicIcon && (
                <View style={styles.micIconContainer}>
                  <Text style={styles.micIcon}>🎤</Text>
                </View>
              )}
            </Animated.View>
            
            {/* Voice visualizer */}
            <View style={styles.visualizerContainer}>
              <VoiceVisualizer
                state={isPaused ? 'idle' : currentState}
                amplitude={0.7}
              />
            </View>
          </TouchableOpacity>

          {/* Control buttons */}
          <VoiceChatControls
            onPause={handlePause}
            onResume={handleResume}
            onClose={handleClose}
            isPaused={isPaused}
            disabled={currentState === 'idle'}
          />
        </SafeAreaView>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: '#000000',
  },
  safeArea: {
    flex: 1,
  },
  mainArea: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  statusContainer: {
    position: 'absolute',
    top: 120,
    alignItems: 'center',
    width: '100%',
  },
  titleText: {
    fontSize: 28,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  subtitleText: {
    fontSize: 16,
    fontWeight: '400',
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    marginBottom: 20,
  },
  micIconContainer: {
    marginTop: 8,
  },
  micIcon: {
    fontSize: 24,
    opacity: 0.7,
  },
  visualizerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    maxHeight: 400,
  },
});

export default VoiceChatScreen;