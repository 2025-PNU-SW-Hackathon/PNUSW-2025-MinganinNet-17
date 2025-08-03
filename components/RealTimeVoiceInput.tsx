import { useEffect, useRef, useState } from 'react';
import {
  Animated,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { WebSpeechRecognition, isWeb } from '../utils/platformUtils';

interface RealTimeVoiceInputProps {
  onTranscriptionUpdate: (text: string) => void;
  onRecordingStop: (finalText: string) => void; // Renamed from onFinalTranscription
  isEnabled?: boolean;
}

export default function RealTimeVoiceInput({
  onTranscriptionUpdate,
  onRecordingStop,
  isEnabled = true,
}: RealTimeVoiceInputProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [transcription, setTranscription] = useState('');
  const pulseAnimation = useRef(new Animated.Value(1)).current;
  const webSpeechRef = useRef<WebSpeechRecognition | null>(null);

  useEffect(() => {
    if (isWeb) {
      webSpeechRef.current = new WebSpeechRecognition();
    }
    return () => {
      webSpeechRef.current?.stop();
    };
  }, []);

  const startRecording = () => {
    setIsRecording(true);
    setTranscription('');
    onTranscriptionUpdate('');
    
    webSpeechRef.current?.start(
      (interimText) => {
        setTranscription(interimText);
        onTranscriptionUpdate(interimText);
      },
      () => {}, // No automatic final transcription
      (error) => console.error('Speech API Error:', error)
    );

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnimation, { toValue: 1.1, duration: 600, useNativeDriver: !isWeb }),
        Animated.timing(pulseAnimation, { toValue: 1, duration: 600, useNativeDriver: !isWeb }),
      ])
    ).start();
  };

  const stopRecording = () => {
    setIsRecording(false);
    pulseAnimation.stopAnimation();
    pulseAnimation.setValue(1);
    webSpeechRef.current?.stop();
    onRecordingStop(transcription); // Send final text on manual stop
  };

  const handleRecordPress = () => {
    if (!isEnabled) return;
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  return (
    <View style={styles.controlsContainer}>
      <Animated.View style={{ transform: [{ scale: pulseAnimation }] }}>
        <TouchableOpacity
          style={[styles.recordButton, { backgroundColor: isRecording ? '#ff4757' : '#8A63D2' }, !isEnabled && styles.disabled]}
          onPress={handleRecordPress}
          disabled={!isEnabled}
        >
          <Text style={styles.recordButtonIcon}>{isRecording ? '⏹️' : '🎤'}</Text>
        </TouchableOpacity>
      </Animated.View>
      <Text style={styles.instructionText}>
        {isRecording ? '버튼을 다시 눌러 전송' : '버튼을 눌러 녹음 시작'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  controlsContainer: { alignItems: 'center' },
  recordButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  recordButtonIcon: { fontSize: 32 },
  disabled: { opacity: 0.5 },
  instructionText: {
    fontSize: 14,
    color: '#a9a9c2',
    textAlign: 'center',
    marginTop: 12,
  },
});
