import React from 'react';
import {
    Dimensions,
    Modal,
    Platform,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

const { width } = Dimensions.get('window');

export type AIPersonality = 'friendly' | 'strict' | 'witty';

interface AIWarningModalProps {
  visible: boolean;
  onClose: () => void;
  appName: string;
  personality: AIPersonality;
  onContinue?: () => void;
}

export default function AIWarningModal({
  visible,
  onClose,
  appName,
  personality,
  onContinue
}: AIWarningModalProps) {
  const getWarningMessage = () => {
    switch (personality) {
      case 'friendly':
        return `안녕하세요! ${appName}을 사용하시려고 하네요. 하지만 지금은 습관을 형성하는 중요한 시간이에요. 목표를 향해 함께 나아가볼까요?`;
      case 'strict':
        return `${appName} 접근이 제한되었습니다. 지금은 습관 목표에 집중해야 할 시간입니다. 루틴을 완수하고 다시 시도해주세요.`;
      case 'witty':
        return `어라, ${appName}이 당신을 유혹하고 있네요! 하지만 당신의 습관이 더 강하다는 것을 보여주세요. 목표를 향해 계속 진행해볼까요?`;
      default:
        return `${appName} 사용이 제한되어 있습니다. 습관 형성에 집중해주세요.`;
    }
  };

  const getCoachName = () => {
    switch (personality) {
      case 'friendly':
        return 'Routy (친근한 조언자)';
      case 'strict':
        return 'Routy (엄격한 코치)';
      case 'witty':
        return 'Routy (재치있는 친구)';
      default:
        return 'Routy';
    }
  };

  const getCoachEmoji = () => {
    switch (personality) {
      case 'friendly':
        return '😊';
      case 'strict':
        return '💪';
      case 'witty':
        return '😏';
      default:
        return '🤖';
    }
  };

  return (
    <Modal
      animationType="fade"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.header}>
            <Text style={styles.coachEmoji}>{getCoachEmoji()}</Text>
            <Text style={styles.coachName}>{getCoachName()}</Text>
          </View>
          
          <Text style={styles.warningMessage}>{getWarningMessage()}</Text>
          
          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={styles.continueButton} 
              onPress={onContinue || onClose}
            >
              <Text style={styles.continueButtonText}>
                계속 진행하기
              </Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.backButton} 
              onPress={onClose}
            >
              <Text style={styles.backButtonText}>
                습관으로 돌아가기
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#2a2a3e',
    borderRadius: 20,
    padding: 24,
    width: width * 0.9,
    maxWidth: 400,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#3a3a4e',
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
  },
  coachEmoji: {
    fontSize: 48,
    marginBottom: 8,
  },
  coachName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#6c5ce7',
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'Inter' : 'Inter',
  },
  warningMessage: {
    fontSize: 16,
    color: '#ffffff',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
    fontFamily: Platform.OS === 'ios' ? 'Inter' : 'Inter',
  },
  buttonContainer: {
    width: '100%',
    gap: 12,
  },
  continueButton: {
    backgroundColor: '#3a3a4e',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    width: '100%',
  },
  continueButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'Inter' : 'Inter',
  },
  backButton: {
    backgroundColor: '#6c5ce7',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 12,
    width: '100%',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  backButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'Inter' : 'Inter',
  },
}); 