import { useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, View } from 'react-native';
import { signIn } from '../backend/supabase/auth';
import { AnimatedButton } from './AnimatedButton';
import DebugNextButton from './DebugNextButton';

interface LoginScreenProps {
  onLoginSuccess: () => void;
  onSignUpPress: () => void;
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
    try {
      console.log('🐛 DEBUG: Login - Bypassing backend signin call');
      console.log('🐛 DEBUG: Login - onLoginSuccess callback exists:', !!onLoginSuccess);
      
      if (!onLoginSuccess) {
        console.error('🐛 DEBUG: Login - ERROR: onLoginSuccess callback is missing!');
        return;
      }
      
      onLoginSuccess();
      console.log('🐛 DEBUG: Login - navigation callback called successfully');
    } catch (error) {
      console.error('🐛 DEBUG: Login - Error in debug handler:', error);
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

      {/* Enhanced Login Button */}
      <AnimatedButton
        title="로그인"
        onPress={handleLogin}
        isLoading={isLoading}
        disabled={!email.trim() || !password.trim() || isLoading}
        style={styles.loginButton}
        loadingText="로그인 중..."
      />

      {/* Enhanced Sign Up Button */}
      <AnimatedButton
        title="회원가입"
        onPress={handleSignUp}
        disabled={isLoading}
        variant="secondary"
        style={styles.signUpButton}
      />

      {/* Floating Debug Button - does not interfere with layout */}
      <DebugNextButton
        to="Goal Setting"
        onPress={handleDebugLogin}
        label="Debug: Skip Login"
        disabled={isLoading}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1c1c2e',
    paddingHorizontal: 24,
    paddingTop: 80,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 8,
    fontFamily: 'Inter',
  },
  subtitle: {
    fontSize: 16,
    color: '#a9a9c2',
    textAlign: 'center',
    marginBottom: 40,
    fontFamily: 'Inter',
  },
  formContainer: {
    marginBottom: 32,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 8,
    marginTop: 16,
    fontFamily: 'Inter',
  },
  input: {
    backgroundColor: '#3a3a50',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#ffffff',
    borderWidth: 2,
    borderColor: 'transparent',
    fontFamily: 'Inter',
  },
  inputError: {
    borderColor: '#ff4757',
  },
  loginButton: {
    marginBottom: 16,
  },
  signUpButton: {
    marginBottom: 20,
  },
}); 