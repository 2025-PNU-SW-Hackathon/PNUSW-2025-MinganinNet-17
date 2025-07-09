import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
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
  const handleStep1Next = (password: string) => {
    const finalData = { ...signUpData, password };
    setSignUpData(finalData);
    
    if (onSignUpComplete) {
      onSignUpComplete(finalData);
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