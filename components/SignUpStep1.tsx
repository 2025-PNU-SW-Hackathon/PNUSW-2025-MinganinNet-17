import { useState } from 'react';
import {
    Alert,
    Dimensions,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

const { width } = Dimensions.get('window');

interface SignUpStep1Props {
  onNext?: (password: string) => void;
  onBack?: () => void;
  email: string;
  initialValue?: string;
}

export default function SignUpStep1({ 
  onNext, 
  onBack, 
  email,
  initialValue = '' 
}: SignUpStep1Props) {
  const [password, setPassword] = useState(initialValue);

  const handleNext = () => {
    if (!password.trim()) {
      Alert.alert('오류', '비밀번호를 입력해주세요.');
      return;
    }

    if (password.length < 8) {
      Alert.alert('오류', '비밀번호는 8자 이상이어야 합니다.');
      return;
    }

    if (onNext) {
      onNext(password);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.backButton} onPress={onBack}>
        <Text style={styles.backArrow}>←</Text>
      </TouchableOpacity>
      
      <View style={styles.progressBar}>
        <View style={[styles.progressStep, styles.progressStepActive]} />
        <View style={[styles.progressStep, styles.progressStepActive]} />
        <View style={styles.progressStep} />
        <View style={styles.progressStep} />
      </View>
      
      <View style={styles.titleContainer}>
        <Text style={styles.title}>
          로그인에 사용할{'\n'}비밀번호를 입력해주세요.
        </Text>
      </View>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.passwordInput}
          value={password}
          onChangeText={setPassword}
          placeholder="비밀번호 입력"
          placeholderTextColor="#a9a9c2"
          secureTextEntry
          autoComplete="new-password"
          autoFocus
        />
        <View style={styles.requirementContainer}>
          <Text style={styles.requirementText}>영문포함</Text>
          <Text style={styles.requirementText}>숫자포함</Text>
          <Text style={styles.requirementText}>8-20자 이내</Text>
        </View>
      </View>

      <View style={styles.confirmContainer}>
        <TextInput
          style={styles.confirmInput}
          placeholder="비밀번호 확인"
          placeholderTextColor="#a9a9c2"
          secureTextEntry
        />
        <Text style={styles.confirmText}>비밀번호 일치</Text>
      </View>

      <TouchableOpacity
        style={[styles.nextButton, !password.trim() && styles.nextButtonDisabled]}
        onPress={handleNext}
        disabled={!password.trim()}
      >
        <Text style={styles.nextButtonText}>다음</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1c1c2e',
    paddingHorizontal: 24,
    paddingTop: 60,
  },
  backButton: {
    position: 'absolute',
    top: 60,
    left: 24,
    zIndex: 10,
  },
  backArrow: {
    fontSize: 24,
    color: '#ffffff',
    fontWeight: 'bold',
  },
  progressBar: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 60,
    marginBottom: 60,
  },
  progressStep: {
    width: 60,
    height: 4,
    backgroundColor: '#3a3a50',
    marginHorizontal: 4,
    borderRadius: 2,
  },
  progressStepActive: {
    backgroundColor: '#ffffff',
  },
  titleContainer: {
    marginBottom: 60,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'left',
    lineHeight: 40,
    fontFamily: Platform.OS === 'ios' ? 'Inter' : 'Inter',
  },
  inputContainer: {
    marginBottom: 30,
  },
  passwordInput: {
    backgroundColor: '#3a3a50',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    color: '#ffffff',
    height: 52,
    fontFamily: Platform.OS === 'ios' ? 'Inter' : 'Inter',
    marginBottom: 16,
  },
  requirementContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  requirementText: {
    fontSize: 12,
    color: '#a9a9c2',
    fontFamily: Platform.OS === 'ios' ? 'Inter' : 'Inter',
  },
  confirmContainer: {
    marginBottom: 160,
  },
  confirmInput: {
    backgroundColor: '#3a3a50',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    color: '#ffffff',
    height: 52,
    fontFamily: Platform.OS === 'ios' ? 'Inter' : 'Inter',
    marginBottom: 8,
  },
  confirmText: {
    fontSize: 12,
    color: '#a9a9c2',
    fontFamily: Platform.OS === 'ios' ? 'Inter' : 'Inter',
  },
  nextButton: {
    backgroundColor: '#6c63ff',
    borderRadius: 28,
    paddingVertical: 19,
    alignItems: 'center',
    height: 56,
    justifyContent: 'center',
    position: 'absolute',
    bottom: 40,
    left: 24,
    right: 24,
  },
  nextButtonDisabled: {
    backgroundColor: '#4a47cc',
    opacity: 0.5,
  },
  nextButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    fontFamily: Platform.OS === 'ios' ? 'Inter' : 'Inter',
  },
}); 