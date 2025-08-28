import { useState } from 'react';
import { DailyTodo } from '../../../types/habit';
import DailyReportResultScreen from './steps/DailyReportResultScreen';
import DailyReportStep1 from './steps/DailyReportStep1';
import DailyReportStep2 from './steps/DailyReportStep2';

interface DailyReportCreateFlowProps {
  onBack: () => void;
  onReportSaved: () => Promise<void>;
}

type Step = 'step1' | 'step2' | 'result';

export default function DailyReportCreateFlow({ onBack, onReportSaved }: DailyReportCreateFlowProps) {
  const [currentStep, setCurrentStep] = useState<Step>('step1');
  const [step1Data, setStep1Data] = useState<{
    todos: DailyTodo[];
    achievementScore: number;
  } | null>(null);
  const [step2Data, setStep2Data] = useState<{
    userSummary: string;
    aiFeedback: string;
  } | null>(null);

  const handleStep1Complete = (todos: DailyTodo[], achievementScore: number) => {
    setStep1Data({ todos, achievementScore });
    setCurrentStep('step2');
  };

  const handleStep2Complete = (userSummary: string, aiFeedback: string) => {
    setStep2Data({ userSummary, aiFeedback });
    setCurrentStep('result');
  };

  const handleBackToStep1 = () => {
    setCurrentStep('step1');
  };

  const handleBackToStep2 = () => {
    setCurrentStep('step2');
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 'step1':
        return (
          <DailyReportStep1
            onComplete={handleStep1Complete}
            onBack={onBack}
          />
        );
      
      case 'step2':
        if (!step1Data) return null;
        return (
          <DailyReportStep2
            todos={step1Data.todos}
            achievementScore={step1Data.achievementScore}
            onComplete={handleStep2Complete}
            onBack={handleBackToStep1}
          />
        );
      
      case 'result':
        if (!step1Data || !step2Data) return null;
        return (
          <DailyReportResultScreen
            todos={step1Data.todos}
            achievementScore={step1Data.achievementScore}
            aiReportText={step2Data.aiFeedback}
            onBack={onBack}
            onReportSaved={onReportSaved}
          />
        );
      
      default:
        return null;
    }
  };

  return renderCurrentStep();
}
