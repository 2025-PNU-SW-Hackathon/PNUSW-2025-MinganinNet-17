import React, { useState } from 'react';
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

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('오류', '이메일과 비밀번호를 모두 입력해주세요.');
      return;
    }

    setIsLoading(true);
    // Simulate login process
    setTimeout(() => {
      setIsLoading(false);
      if (onLoginSuccess) {
        onLoginSuccess();
      } else {
        Alert.alert('성공', '로그인이 완료되었습니다!');
      }
    }, 1000);
  };

  const handleSignUp = () => {
    if (onSignUpPress) {
      onSignUpPress();
    } else {
      Alert.alert('회원가입', '회원가입 기능은 준비 중입니다.');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>다시 오신 것을 환영해요!</Text>
      <Text style={styles.subtitle}>로그인하여 여정을 계속하세요.</Text>

      <View style={styles.formContainer}>
        <Text style={styles.label}>이메일 주소</Text>
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          placeholder=""
          placeholderTextColor="#a9a9c2"
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
        />

        <Text style={styles.label}>비밀번호</Text>
        <TextInput
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          placeholder=""
          placeholderTextColor="#a9a9c2"
          secureTextEntry
          autoComplete="password"
        />
      </View>

      <TouchableOpacity
        style={[styles.loginButton, isLoading && styles.loginButtonDisabled]}
        onPress={handleLogin}
        disabled={isLoading}
      >
        <Text style={styles.loginButtonText}>
          {isLoading ? '로그인 중...' : '로그인'}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={handleSignUp}>
        <Text style={styles.signUpText}>계정이 없으신가요? 회원가입</Text>
      </TouchableOpacity>
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
}); 