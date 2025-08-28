import { useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import { signUp } from '../backend/supabase/auth';
import DebugNextButton from './DebugNextButton';
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

  // Debug navigation handler - bypasses backend signup call with fallback data
  const handleDebugSkipSignup = () => {
    try {
      console.log('🐛 DEBUG: SignUp - current signUpData:', signUpData);
      
      // Provide fallback data for debug mode if fields are missing
      const debugSignUpData = {
        email: signUpData.email || 'debug@test.com',
        password: signUpData.password || 'debug123'
      };
      console.log('🐛 DEBUG: SignUp - using signup data:', debugSignUpData);
      
      console.log('🐛 DEBUG: SignUp - onSignUpComplete callback exists:', !!onSignUpComplete);
      if (onSignUpComplete) {
        onSignUpComplete(debugSignUpData);
        console.log('🐛 DEBUG: SignUp - navigation callback called successfully');
      } else {
        console.error('🐛 DEBUG: SignUp - ERROR: onSignUpComplete callback is missing!');
      }
    } catch (error) {
      console.error('🐛 DEBUG: SignUp - Error in debug handler:', error);
    }
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
          <>
            <SignUpStep1
              onNext={handleStep1Next}
              onBack={handleStep1Back}
              email={signUpData.email}
              initialValue={signUpData.password}
              isLoading={isLoading}
            />
            
            {/* Floating Debug Button - does not interfere with layout */}
            <DebugNextButton
              to="Goal Setting"
              onPress={handleDebugSkipSignup}
              label="Debug: Skip Signup"
              disabled={isLoading}
            />
          </>
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