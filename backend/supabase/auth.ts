import { supabase } from './client';

export interface AuthError {
  message: string;
}

export interface AuthResponse {
  user?: any;
  error?: AuthError;
}

export const signIn = async (email: string, password: string): Promise<AuthResponse> => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return { error: { message: error.message } };
    }

    return { user: data.user };
  } catch (error) {
    return { error: { message: '로그인 중 문제가 발생했습니다.' } };
  }
};

export const signUp = async (email: string, password: string): Promise<AuthResponse> => {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: window.location.origin,
      }
    });

    if (error) {
      return { error: { message: error.message } };
    }

    return { user: data.user };
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