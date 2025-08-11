import { Stack, useRouter } from 'expo-router';
import { useState } from 'react';
import { SafeAreaView, StyleSheet } from 'react-native';
import GoalSettingStep1 from '../components/GoalSettingStep1';
import GoalSettingStep2 from '../components/GoalSettingStep2';
import GoalSettingStep3 from '../components/GoalSettingStep3';
import GoalSettingStep4 from '../components/GoalSettingStep4';
import GoalSettingStep5 from '../components/GoalSettingStep5';
import GoalSettingStep6 from '../components/GoalSettingStep6';
import GoalSetupCompleteScreen from '../components/GoalSetupCompleteScreen';

export default function GoalSettingFlow() {
  const router = useRouter();
  const [step, setStep] = useState(1);

  const handleNext = (signal?: any) => {
    // 음성 채팅 완료 시 GoalSettingStep5로 직접 이동
    if (signal === 'VOICE_COMPLETE_JUMP_TO_STEP5') {
      setStep(5);
    } else {
      setStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep((prev) => prev - 1);
    } else {
      router.back();
    }
  };
  
  const handleFinish = () => {
    router.replace('/(tabs)');
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return <GoalSettingStep1 onNext={handleNext} onBack={handleBack} />;
      case 2:
        return <GoalSettingStep2 onNext={handleNext} onBack={handleBack} />;
      case 3:
        return <GoalSettingStep3 onNext={handleNext} onBack={handleBack} />;
      case 4:
        return <GoalSettingStep4 onNext={handleNext} onBack={handleBack} />;
      case 5:
        return <GoalSettingStep5 onComplete={handleNext} onBack={handleBack} />;
      case 6:
        return <GoalSettingStep6 onComplete={handleNext} onBack={handleBack} />;
      case 7:
        return <GoalSetupCompleteScreen onGoHome={handleFinish} />;
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen options={{ headerShown: false }} />
      {renderStep()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1c1c2e',
  },
});