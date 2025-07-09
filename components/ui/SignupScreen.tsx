import { Router } from 'expo-router';
import React, { useState } from 'react';
import {
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    TextInput,
    TouchableOpacity,
} from 'react-native';
import { ThemedText } from '../ThemedText';
import { ThemedView } from '../ThemedView';

interface SignupScreenProps {
  onSignup: (email: string, username: string, password: string) => void;
  onLoginPress: () => void;
  navigation: Router;
}

export const SignupScreen: React.FC<SignupScreenProps> = ({
  onSignup,
  onLoginPress,
  navigation,
}) => {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleSignup = () => {
    onSignup(email, username, password);
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

        <ThemedText style={styles.title}>회원가입</ThemedText>
        
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
          placeholder="사용자 이름"
          placeholderTextColor="#666"
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
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
          style={styles.signupButton}
          onPress={handleSignup}
        >
          <ThemedText style={styles.buttonText}>회원가입</ThemedText>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.loginButton}
          onPress={onLoginPress}
        >
          <ThemedText style={styles.loginText}>
            이미 계정이 있으신가요? 로그인
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
  signupButton: {
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
  loginButton: {
    marginTop: 16,
    alignItems: 'center',
  },
  loginText: {
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

export default SignupScreen; 