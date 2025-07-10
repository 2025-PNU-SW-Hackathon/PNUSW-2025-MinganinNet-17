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

  // Debug navigation handler - bypasses backend signup call
  const handleDebugSkipSignup = () => {
    if (signUpData.email && signUpData.password) {
      // Only call navigation callback - no backend calls
      if (onSignUpComplete) {
        onSignUpComplete(signUpData);
      }
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
          <View style={styles.stepContainer}>
            <SignUpStep1
              onNext={handleStep1Next}
              onBack={handleStep1Back}
              email={signUpData.email}
              initialValue={signUpData.password}
              isLoading={isLoading}
            />
            
            {/* Debug Navigation Button */}
            <DebugNextButton
              to="Goal Setting"
              onPress={handleDebugSkipSignup}
              label="Debug: Skip Signup (Backend 건너뛰기)"
              disabled={!signUpData.email || !signUpData.password || isLoading}
              style={styles.debugButton}
            />
          </View>
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
  stepContainer: {
    flex: 1,
  },
  debugButton: {
    position: 'absolute',
    bottom: 120,
    left: 24,
    right: 24,
  },
}); 