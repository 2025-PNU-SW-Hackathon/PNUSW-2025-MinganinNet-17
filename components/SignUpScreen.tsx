import { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { signUp } from '../backend/supabase/auth';
import SignUpStep0 from './SignUpStep0';
import SignUpStep1 from './SignUpStep1';

interface SignUpScreenProps {
  onSignUpComplete?: (userData: SignUpData) => void;
  onBack?: () => void;
}

export interface SignUpData {
  email: string;
  password: string;
}

type SignUpStep = 'step0' | 'step1';

export default function SignUpScreen({ 
  onSignUpComplete, 
  onBack 
}: SignUpScreenProps) {
  const [currentStep, setCurrentStep] = useState<SignUpStep>('step0');
  const [signUpData, setSignUpData] = useState<SignUpData>({
    email: '',
    password: '',
  });
  const [isLoading, setIsLoading] = useState(false);

  // Step 0 handlers
  const handleStep0Next = (email: string) => {
    setSignUpData(prev => ({ ...prev, email }));
    setCurrentStep('step1');
  };

  const handleStep0Back = () => {
    if (onBack) {
      onBack();
    }
  };

  // Step 1 handlers
  const handleStep1Next = async (password: string) => {
    setIsLoading(true);
    try {
      const finalData = { ...signUpData, password };
      setSignUpData(finalData);
      
      // Supabase 회원가입 요청
      const { user, error } = await signUp(finalData.email, password);
      
      if (error) {
        Alert.alert('회원가입 오류', error.message);
        return;
      }

      if (onSignUpComplete) {
        onSignUpComplete(finalData);
      }
    } catch (error) {
      Alert.alert('오류', '회원가입 중 문제가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStep1Back = () => {
    setCurrentStep('step0');
  };

  const renderStep = () => {
    switch (currentStep) {
      case 'step0':
        return (
          <SignUpStep0
            onNext={handleStep0Next}
            onBack={handleStep0Back}
            initialValue={signUpData.email}
          />
        );
      
      case 'step1':
        return (
          <SignUpStep1
            onNext={handleStep1Next}
            onBack={handleStep1Back}
            email={signUpData.email}
            initialValue={signUpData.password}
            isLoading={isLoading}
          />
        );
      
      default:
        return (
          <SignUpStep0
            onNext={handleStep0Next}
            onBack={handleStep0Back}
            initialValue={signUpData.email}
          />
        );
    }
  };

  return (
    <View style={styles.container}>
      {renderStep()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
}); 