import { supabase } from './client';

export interface AuthError {
  message: string;
  code?: string;
}

export interface AuthResponse {
  user?: any;
  error?: AuthError;
}

// 비밀번호 유효성 검사
const validatePassword = (password: string): { isValid: boolean; message?: string } => {
  if (password.length < 8) {
    return { isValid: false, message: '비밀번호는 8자 이상이어야 합니다.' };
  }
  
  if (!/[A-Za-z]/.test(password)) {
    return { isValid: false, message: '비밀번호는 영문을 포함해야 합니다.' };
  }
  
  if (!/\d/.test(password)) {
    return { isValid: false, message: '비밀번호는 숫자를 포함해야 합니다.' };
  }
  
  return { isValid: true };
};

export const signIn = async (email: string, password: string): Promise<AuthResponse> => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      let message = '로그인 중 문제가 발생했습니다.';
      switch (error.message) {
        case 'Invalid login credentials':
          message = '이메일 또는 비밀번호가 올바르지 않습니다.';
          break;
        case 'Email not confirmed':
          message = '이메일 인증이 필요합니다. 이메일을 확인해주세요.';
          break;
      }
      return { error: { message, code: error.message } };
    }

    return { user: data.user };
  } catch (error) {
    return { error: { message: '로그인 중 문제가 발생했습니다.' } };
  }
};

export const signUp = async (email: string, password: string): Promise<AuthResponse> => {
  try {
    // 비밀번호 유효성 검사
    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      return { error: { message: passwordValidation.message || '비밀번호가 유효하지 않습니다.' } };
    }

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        data: {
          created_at: new Date().toISOString(),
        }
      }
    });

    if (error) {
      let message = '회원가입 중 문제가 발생했습니다.';
      switch (error.message) {
        case 'User already registered':
          message = '이미 등록된 이메일 주소입니다.';
          break;
        case 'Password should be at least 6 characters':
          message = '비밀번호는 최소 8자 이상이어야 합니다.';
          break;
        case 'Invalid email':
          message = '올바른 이메일 형식이 아닙니다.';
          break;
      }
      return { error: { message, code: error.message } };
    }

    return { 
      user: data.user,
      error: data.user ? undefined : { 
        message: '이메일로 인증 링크가 발송되었습니다. 이메일을 확인해주세요.',
        code: 'CONFIRMATION_EMAIL_SENT' 
      }
    };
  } catch (error) {
    return { error: { message: '회원가입 중 문제가 발생했습니다.' } };
  }
};

export const signOut = async (): Promise<{ error?: AuthError }> => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) {
      return { error: { message: error.message } };
    }
    return {};
  } catch (error) {
    return { error: { message: '로그아웃 중 문제가 발생했습니다.' } };
  }
};

export const getCurrentUser = async () => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) {
      return { error: { message: error.message } };
    }
    return { user };
  } catch (error) {
    return { error: { message: '사용자 정보를 가져오는 중 문제가 발생했습니다.' } };
  }
};

// 인증 상태 변경 감지
export const onAuthStateChange = (callback: (user: any) => void) => {
  return supabase.auth.onAuthStateChange((event, session) => {
    callback(session?.user || null);
  });
}; 