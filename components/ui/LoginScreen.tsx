import { Router } from 'expo-router';
import React, { useState } from 'react';
import {
    Alert,
    KeyboardAvoidingView,
    Platform,
    StyleSheet,
    TextInput,
    TouchableOpacity
} from 'react-native';
import { supabase } from '../../backend/supabase/client';
import { ThemedText } from '../ThemedText';
import { ThemedView } from '../ThemedView';

interface LoginScreenProps {
  onSignupPress: () => void;
  navigation: Router;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onSignupPress,
  navigation,
}) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        Alert.alert('로그인 오류', error.message);
        return;
      }

      if (data?.user) {
        // 로그인 성공 후 메인 화면으로 이동
        navigation.replace('/(tabs)');
      }
    } catch (error) {
      Alert.alert('오류', '로그인 중 문제가 발생했습니다.');
    } finally {
      setLoading(false);
    }
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
          editable={!loading}
        />

        <TextInput
          style={styles.input}
          placeholder="비밀번호"
          placeholderTextColor="#666"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoCapitalize="none"
          editable={!loading}
        />

        <TouchableOpacity
          style={[styles.loginButton, loading && styles.disabledButton]}
          onPress={handleLogin}
          disabled={loading}
        >
          <ThemedText style={styles.buttonText}>
            {loading ? '로그인 중...' : '로그인'}
          </ThemedText>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.signupButton}
          onPress={onSignupPress}
          disabled={loading}
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
  disabledButton: {
    opacity: 0.7,
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