import { useState } from 'react';
import {
    ActivityIndicator,
    Alert,
    Dimensions,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { signIn } from '../backend/supabase/auth';
import DebugNextButton from './DebugNextButton';

const { width } = Dimensions.get('window');

interface LoginScreenProps {
  onLoginSuccess?: () => void;
  onSignUpPress?: () => void;
}

export default function LoginScreen({ 
  onLoginSuccess, 
  onSignUpPress 
}: LoginScreenProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const validateEmail = (email: string) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleLogin = async () => {
    // 입력값 검증
    if (!email.trim() || !password.trim()) {
      Alert.alert('입력 오류', '이메일과 비밀번호를 모두 입력해주세요.');
      return;
    }

    if (!validateEmail(email)) {
      Alert.alert('입력 오류', '올바른 이메일 형식이 아닙니다.');
      return;
    }

    if (password.length < 6) {
      Alert.alert('입력 오류', '비밀번호는 최소 6자 이상이어야 합니다.');
      return;
    }

    setIsLoading(true);
    try {
      const { user, error } = await signIn(email.trim(), password);
      
      if (error) {
        let errorMessage = '로그인에 실패했습니다.';
        if (error.message.includes('Invalid login credentials')) {
          errorMessage = '이메일 또는 비밀번호가 올바르지 않습니다.';
        } else if (error.message.includes('Email not confirmed')) {
          errorMessage = '이메일 인증이 필요합니다. 이메일을 확인해주세요.';
        }
        Alert.alert('로그인 실패', errorMessage);
        return;
      }

      if (user) {
        if (onLoginSuccess) {
          onLoginSuccess();
        }
      }
    } catch (error) {
      Alert.alert('시스템 오류', '로그인 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = () => {
    if (onSignUpPress) {
      onSignUpPress();
    } else {
      Alert.alert('알림', '회원가입 페이지로 이동합니다.');
    }
  };

  // Debug navigation handler - bypasses backend signin call
  const handleDebugLogin = () => {
    // Only call success callback - no backend calls
    if (onLoginSuccess) {
      onLoginSuccess();
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>다시 오신 것을 환영해요!</Text>
      <Text style={styles.subtitle}>로그인하여 여정을 계속하세요.</Text>

      <View style={styles.formContainer}>
        <Text style={styles.label}>이메일 주소</Text>
        <TextInput
          style={[styles.input, !validateEmail(email) && email.length > 0 && styles.inputError]}
          value={email}
          onChangeText={setEmail}
          placeholder="example@email.com"
          placeholderTextColor="#a9a9c2"
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          editable={!isLoading}
        />

        <Text style={styles.label}>비밀번호</Text>
        <TextInput
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          placeholder="비밀번호 입력"
          placeholderTextColor="#a9a9c2"
          secureTextEntry
          autoComplete="password"
          editable={!isLoading}
        />
      </View>

      <TouchableOpacity
        style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
        onPress={handleLogin}
        disabled={isLoading}
      >
        {isLoading ? (
          <ActivityIndicator color="#ffffff" />
        ) : (
          <Text style={styles.loginButtonText}>로그인</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity onPress={handleSignUp} disabled={isLoading}>
        <Text style={[styles.signUpText, isLoading && styles.textDisabled]}>
          계정이 없으신가요? 회원가입
        </Text>
      </TouchableOpacity>
      
      {/* Debug Navigation Button */}
      <DebugNextButton
        to="Goal Setting"
        onPress={handleDebugLogin}
        label="Debug: Skip Login (Auth 건너뛰기)"
        disabled={isLoading}
        style={styles.debugButton}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1c1c2e',
    paddingHorizontal: 24,
    paddingTop: 120,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 12,
    fontFamily: Platform.OS === 'ios' ? 'Inter' : 'Inter',
  },
  subtitle: {
    fontSize: 16,
    color: '#a9a9c2',
    textAlign: 'center',
    marginBottom: 58,
    fontFamily: Platform.OS === 'ios' ? 'Inter' : 'Inter',
  },
  formContainer: {
    marginBottom: 90,
  },
  label: {
    fontSize: 14,
    color: '#ffffff',
    marginBottom: 8,
    marginTop: 25,
    fontFamily: Platform.OS === 'ios' ? 'Inter' : 'Inter',
  },
  input: {
    backgroundColor: '#3a3a50',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 16,
    fontSize: 16,
    color: '#ffffff',
    height: 52,
    fontFamily: Platform.OS === 'ios' ? 'Inter' : 'Inter',
  },
  inputError: {
    borderColor: '#ff4444',
    borderWidth: 1,
  },
  loginButton: {
    backgroundColor: '#6c63ff',
    borderRadius: 28,
    paddingVertical: 19,
    alignItems: 'center',
    marginBottom: 20,
    height: 56,
    justifyContent: 'center',
  },
  loginButtonDisabled: {
    backgroundColor: '#4a47cc',
    opacity: 0.7,
  },
  loginButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    fontFamily: Platform.OS === 'ios' ? 'Inter' : 'Inter',
  },
  signUpText: {
    fontSize: 14,
    color: '#a9a9c2',
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'Inter' : 'Inter',
  },
  textDisabled: {
    opacity: 0.7,
  },
  debugButton: {
    position: 'absolute',
    bottom: 60,
    left: 24,
    right: 24,
  },
}); 