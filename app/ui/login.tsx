import { useRouter } from 'expo-router';
import { LoginScreen } from '../../components/ui/LoginScreen';

export default function Login() {
  const router = useRouter();

  const handleLogin = async (email: string, password: string) => {
    try {
      // TODO: 실제 로그인 로직 구현
      console.log('로그인 시도:', email, password);
      
      // 로그인 성공 시 메인 화면으로 이동
      router.replace('/(tabs)');
    } catch (error) {
      console.error('로그인 실패:', error);
    }
  };

  return (
    <LoginScreen
      onLogin={handleLogin}
      onSignupPress={() => router.push('/ui/signup')}
      navigation={{
        ...router,
        back: () => router.replace('/(tabs)') // 메인 화면으로 직접 이동
      }}
    />
  );
} 