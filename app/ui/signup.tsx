import { useRouter } from 'expo-router';
import { SignupScreen } from '../../components/ui/SignupScreen';

export default function Signup() {
  const router = useRouter();

  const handleSignup = async (email: string, username: string, password: string) => {
    try {
      // TODO: 실제 회원가입 로직 구현
      console.log('회원가입 시도:', email, username, password);
      
      // 회원가입 성공 후 로그인 화면으로 자동 이동
      router.push('/ui/login');
    } catch (error) {
      console.error('회원가입 실패:', error);
    }
  };

  return (
    <SignupScreen
      onSignup={handleSignup}
      onLoginPress={() => router.push('/ui/login')}
      navigation={{
        ...router,
        back: () => router.replace('/(tabs)') // 메인 화면으로 직접 이동
      }}
    />
  );
} 