import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  KeyboardAvoidingView, 
  Platform 
} from 'react-native';
import { Colors } from '../../constants/Colors';
import { useColorScheme } from '../../hooks/useColorScheme';

interface ChatInputProps {
  onSendMessage: (message: string) => void;
  onVoicePress?: () => void;
  onSubmitConversation?: () => void;
  disabled?: boolean;
  placeholder?: string;
  showVoiceButton?: boolean;
  showSubmitButton?: boolean;
}

export default function ChatInput({ 
  onSendMessage, 
  onVoicePress,
  onSubmitConversation,
  disabled = false,
  placeholder = "오늘 하루에 대해 이야기해보세요...",
  showVoiceButton = true,
  showSubmitButton = false
}: ChatInputProps) {
  const [inputText, setInputText] = useState('');
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const styles = createStyles(colors);

  const handleSend = () => {
    if (inputText.trim() && !disabled) {
      onSendMessage(inputText.trim());
      setInputText('');
    }
  };

  const handleVoice = () => {
    if (onVoicePress && !disabled) {
      onVoicePress();
    }
  };

  const handleSubmitConversation = () => {
    if (onSubmitConversation && !disabled) {
      onSubmitConversation();
    }
  };

  const canSend = inputText.trim().length > 0 && !disabled;

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      {showSubmitButton && (
        <TouchableOpacity
          style={[
            styles.submitButton,
            disabled && styles.buttonDisabled
          ]}
          onPress={handleSubmitConversation}
          disabled={disabled}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={styles.submitButtonText}>✓ 대화 완료</Text>
        </TouchableOpacity>
      )}
      
      <View style={styles.inputContainer}>
        <TextInput
          style={[
            styles.textInput,
            disabled && styles.textInputDisabled
          ]}
          value={inputText}
          onChangeText={setInputText}
          placeholder={placeholder}
          placeholderTextColor={colors.textSecondary}
          multiline
          maxLength={1000}
          editable={!disabled}
          textAlignVertical="center"
          returnKeyType="send"
          onSubmitEditing={handleSend}
          blurOnSubmit={false}
        />
        
        <View style={styles.buttonsContainer}>
          {showVoiceButton && (
            <TouchableOpacity
              style={[
                styles.voiceButton,
                disabled && styles.buttonDisabled
              ]}
              onPress={handleVoice}
              disabled={disabled}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={styles.voiceButtonText}>🎤</Text>
            </TouchableOpacity>
          )}
          
          <TouchableOpacity
            style={[
              styles.sendButton,
              canSend ? styles.sendButtonActive : styles.sendButtonInactive,
              disabled && styles.buttonDisabled
            ]}
            onPress={handleSend}
            disabled={!canSend}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <Text style={[
              styles.sendButtonText,
              canSend ? styles.sendButtonTextActive : styles.sendButtonTextInactive
            ]}>
              ➤
            </Text>
          </TouchableOpacity>
        </View>
      </View>
      
      {inputText.length > 900 && (
        <Text style={styles.characterCount}>
          {inputText.length}/1000
        </Text>
      )}
    </KeyboardAvoidingView>
  );
}

const createStyles = (colors: typeof Colors.light) => StyleSheet.create({
  container: {
    backgroundColor: colors.background,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: Platform.OS === 'ios' ? 34 : 12, // Account for safe area
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: colors.surface,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 16,
    paddingVertical: 8,
    minHeight: 48,
    maxHeight: 120,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: colors.text,
    fontFamily: 'Inter',
    lineHeight: 20,
    paddingVertical: 8,
    paddingRight: 8,
    maxHeight: 80,
  },
  textInputDisabled: {
    opacity: 0.6,
  },
  buttonsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  voiceButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  voiceButtonText: {
    fontSize: 16,
  },
  sendButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonActive: {
    backgroundColor: colors.primary,
  },
  sendButtonInactive: {
    backgroundColor: colors.surface,
  },
  sendButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  sendButtonTextActive: {
    color: colors.background,
  },
  sendButtonTextInactive: {
    color: colors.textSecondary,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  characterCount: {
    fontSize: 12,
    color: colors.textSecondary,
    textAlign: 'right',
    marginTop: 4,
    fontFamily: 'Inter',
  },
  submitButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
    marginBottom: 8,
    alignSelf: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  submitButtonText: {
    color: colors.background,
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter',
  },
});