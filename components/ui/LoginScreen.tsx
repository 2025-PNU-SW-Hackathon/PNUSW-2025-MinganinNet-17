import { Router } from 'expo-router';
import React, { useState } from 'react';
import {
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    TextInput,
    TouchableOpacity
} from 'react-native';
import { ThemedText } from '../ThemedText';
import { ThemedView } from '../ThemedView';

interface LoginScreenProps {
  onLogin: (email: string, password: string) => void;
  onSignupPress: () => void;
  navigation: Router;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onLogin,
  onSignupPress,
  navigation,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = () => {
    onLogin(email, password);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <ThemedView style={styles.formContainer}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.back()}
        >
          <ThemedText style={styles.backButtonText}>← 돌아가기</ThemedText>
        </TouchableOpacity>

        <ThemedText style={styles.title}>로그인</ThemedText>
        
        <TextInput
          style={styles.input}
          placeholder="이메일 주소"
          placeholderTextColor="#666"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
        />

        <TextInput
          style={styles.input}
          placeholder="비밀번호"
          placeholderTextColor="#666"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoCapitalize="none"
        />

        <TouchableOpacity
          style={styles.loginButton}
          onPress={handleLogin}
        >
          <ThemedText style={styles.buttonText}>로그인</ThemedText>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.signupButton}
          onPress={onSignupPress}
        >
          <ThemedText style={styles.signupText}>
            계정이 없으신가요? 회원가입
          </ThemedText>
        </TouchableOpacity>
      </ThemedView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  formContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
    gap: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 24,
    textAlign: 'center',
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 16,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  loginButton: {
    height: 50,
    backgroundColor: '#007AFF',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 16,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  signupButton: {
    marginTop: 16,
    alignItems: 'center',
  },
  signupText: {
    fontSize: 14,
    color: '#007AFF',
  },
  backButton: {
    position: 'absolute',
    top: 20,
    left: 20,
    zIndex: 1,
  },
  backButtonText: {
    fontSize: 16,
    color: '#007AFF',
  },
});

export default LoginScreen; 