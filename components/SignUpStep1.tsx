import { useState } from 'react';
import {
    Alert,
    Dimensions,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';
import { AnimatedButton } from './AnimatedButton';
import { Colors } from '../constants/Colors';
import { useColorScheme } from '../hooks/useColorScheme';

const { width } = Dimensions.get('window');

interface SignUpStep1Props {
  onNext?: (password: string) => void;
  onBack?: () => void;
  email: string;
  initialValue?: string;
  isLoading?: boolean;
}

export default function SignUpStep1({ 
  onNext, 
  onBack, 
  email,
  initialValue = '',
  isLoading = false
}: SignUpStep1Props) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const styles = createStyles(colors);
  const [password, setPassword] = useState(initialValue);
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isPasswordValid, setIsPasswordValid] = useState(false);
  const [isConfirmPasswordValid, setIsConfirmPasswordValid] = useState(false);

  const validatePassword = (password: string) => {
    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    return passwordRegex.test(password);
  };

  const handleNext = () => {
    if (!password.trim()) {
      Alert.alert('오류', '비밀번호를 입력해주세요.');
      return;
    }

    if (!validatePassword(password)) {
      Alert.alert('오류', '비밀번호는 8자 이상이어야 하며, 대문자, 소문자, 숫자, 특수문자를 포함해야 합니다.');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('오류', '비밀번호가 일치하지 않습니다.');
      return;
    }

    if (onNext) {
      onNext(password);
    }
  };

  const handlePasswordChange = (text: string) => {
    setPassword(text);
    setIsPasswordValid(validatePassword(text));
  };

  const handleConfirmPasswordChange = (text: string) => {
    setConfirmPassword(text);
    setIsConfirmPasswordValid(text === password && text.length > 0);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.stepIndicator}>회원가입 2/2</Text>
      
      <TouchableOpacity style={styles.backButton} onPress={onBack} disabled={isLoading}>
        <Text style={styles.backButtonText}>← 이전</Text>
      </TouchableOpacity>

      <Text style={styles.title}>안전한 비밀번호를{'\n'}설정해주세요</Text>
      <Text style={styles.subtitle}>선택한 이메일: {email}</Text>

      <View style={styles.inputContainer}>
        <Text style={styles.label}>비밀번호</Text>
        <TextInput
          style={[styles.input, isPasswordValid && styles.validInput]}
          value={password}
          onChangeText={handlePasswordChange}
          placeholder="비밀번호 입력"
          placeholderTextColor={colors.textSecondary}
          secureTextEntry
          editable={!isLoading}
        />
        {password.length > 0 && (
          <Text style={[styles.validationText, isPasswordValid && styles.validText]}>
            {isPasswordValid ? '✓ 안전한 비밀번호입니다' : '8자 이상, 대소문자, 숫자, 특수문자 포함'}
          </Text>
        )}
      </View>

      <View style={styles.confirmContainer}>
        <Text style={styles.label}>비밀번호 확인</Text>
        <TextInput
          style={[styles.input, isConfirmPasswordValid && styles.validInput]}
          value={confirmPassword}
          onChangeText={handleConfirmPasswordChange}
          placeholder="비밀번호 확인"
          placeholderTextColor={colors.textSecondary}
          secureTextEntry
          editable={!isLoading}
        />
        {confirmPassword.length > 0 && (
          <Text style={[styles.validationText, isConfirmPasswordValid && styles.validText]}>
            {isConfirmPasswordValid ? '✓ 비밀번호가 일치합니다' : '비밀번호가 일치하지 않습니다'}
          </Text>
        )}
      </View>

      {/* Enhanced Next Button */}
      <AnimatedButton
        title="회원가입 완료"
        onPress={handleNext}
        isLoading={isLoading}
        disabled={!isPasswordValid || !isConfirmPasswordValid || isLoading}
        style={styles.nextButton}
        loadingText="가입 중..."
      />
    </View>
  );
}

const createStyles = (colors: typeof Colors.light) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: 24,
    paddingTop: 60,
  },
  stepIndicator: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
    fontFamily: 'Inter',
  },
  backButton: {
    alignSelf: 'flex-start',
    marginBottom: 20,
  },
  backButtonText: {
    fontSize: 16,
    color: '#6c63ff',
    fontWeight: '600',
    fontFamily: 'Inter',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 8,
    fontFamily: 'Inter',
  },
  subtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 40,
    fontFamily: 'Inter',
  },
  inputContainer: {
    marginBottom: 24,
  },
  confirmContainer: {
    marginBottom: 40,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
    fontFamily: 'Inter',
  },
  input: {
    backgroundColor: colors.inputBackground,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: colors.text,
    borderWidth: 2,
    borderColor: 'transparent',
    fontFamily: 'Inter',
  },
  validInput: {
    borderColor: colors.success,
  },
  validationText: {
    fontSize: 12,
    color: colors.error,
    marginTop: 4,
    fontFamily: 'Inter',
  },
  validText: {
    color: colors.success,
  },
  nextButton: {
    marginTop: 20,
  },
}); 