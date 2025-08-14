import AsyncStorage from '@react-native-async-storage/async-storage';
import { useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, View } from 'react-native';
import { signIn } from '../backend/supabase/auth';
import { supabase } from '../backend/supabase/client';
import { Colors } from '../constants/Colors';
import { useColorScheme } from '../hooks/useColorScheme';
import { koreanTextStyle } from '../utils/koreanUtils';
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
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const styles = createStyles(colors);
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
        console.log('🎉 === 로그인 성공! 세션 저장 상태 확인 ===');
        console.log('🎉 로그인된 사용자:', user.email);
        
        // 로그인 성공 직후 세션 상태 확인
        try {
          const { data: { session }, error } = await supabase.auth.getSession();
          console.log('💾 로그인 후 세션 상태:', session ? '✅ 세션 저장됨' : '❌ 세션 없음');
          
          if (session) {
            console.log('📊 저장된 세션 정보:');
            console.log('  - User ID:', session.user?.id);
            console.log('  - Email:', session.user?.email);
            console.log('  - Access Token 존재:', !!session.access_token);
            console.log('  - Refresh Token 존재:', !!session.refresh_token);
          }
          
          // AsyncStorage에서 모든 키들 확인 (더 넓은 범위)
          const allKeys = await AsyncStorage.getAllKeys();
          console.log('🗂️  로그인 후 AsyncStorage의 모든 키들:', allKeys);
          
          // 다양한 패턴으로 Supabase 관련 키 찾기
          const supabaseKeys = allKeys.filter(key => 
            key.includes('supabase') || 
            key.includes('@supabase') ||
            key.includes('sb-') ||
            key.includes('auth') ||
            key.includes('token') ||
            key.includes('session')
          );
          console.log('🔍 Supabase 관련 키들 (넓은 검색):', supabaseKeys);
          
          // 각 키의 실제 값도 확인
          for (const key of allKeys) {
            try {
              const value = await AsyncStorage.getItem(key);
              if (value && (key.includes('auth') || key.includes('token') || key.includes('supabase'))) {
                console.log(`📦 ${key}: ${value.substring(0, 100)}...`);
              }
            } catch (err) {
              console.log(`❌ ${key}: 읽기 실패`);
            }
          }
          
        } catch (sessionError) {
          console.error('❌ 세션 확인 중 오류:', sessionError);
        }
        
        console.log('🎉 === 세션 저장 상태 확인 완료 ===');
        
        if (onLoginSuccess) {
          await onLoginSuccess();
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
      <Text style={[styles.title, koreanTextStyle('다시 오신 것을 환영해요!')]}>다시 오신 것을 환영해요!</Text>
      <Text style={[styles.subtitle, koreanTextStyle('로그인하여 여정을 계속하세요.')]}>로그인하여 여정을 계속하세요.</Text>

      <View style={styles.formContainer}>
        <Text style={[styles.label, koreanTextStyle('이메일 주소')]}>이메일 주소</Text>
        <TextInput
          style={[styles.input, !validateEmail(email) && email.length > 0 && styles.inputError]}
          value={email}
          onChangeText={setEmail}
          placeholder="example@email.com"
          placeholderTextColor={colors.textMuted}
          keyboardType="email-address"
          autoCapitalize="none"
          autoComplete="email"
          editable={!isLoading}
        />

        <Text style={[styles.label, koreanTextStyle('비밀번호')]}>비밀번호</Text>
        <TextInput
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          placeholder="비밀번호 입력"
          placeholderTextColor={colors.textMuted}
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

const createStyles = (colors: typeof Colors.light) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: 24,
    paddingTop: 80,
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
  formContainer: {
    marginBottom: 32,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
    marginTop: 16,
    fontFamily: 'Inter',
  },
  input: {
    backgroundColor: colors.inputBackground,
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: colors.text,
    borderWidth: 2,
    borderColor: colors.inputBorder,
    fontFamily: 'Inter',
  },
  inputError: {
    borderColor: colors.error,
  },
  loginButton: {
    marginBottom: 16,
  },
  signUpButton: {
    marginBottom: 20,
  },
}); 