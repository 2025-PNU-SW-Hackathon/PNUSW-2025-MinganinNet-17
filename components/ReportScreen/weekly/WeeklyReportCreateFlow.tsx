import { useState } from 'react';
import { WeeklyReportFromSupabase } from '../../../backend/supabase/reports';
import WeeklyReportResult from './steps/WeeklyReportResult';
import WeeklyReportStep1 from './steps/WeeklyReportStep1';
import WeeklyReportStep2 from './steps/WeeklyReportStep2';

interface WeeklyReportCreateFlowProps {
  onBack: () => void;
}

type Step = 'step1' | 'step2' | 'result';

export default function WeeklyReportCreateFlow({ onBack }: WeeklyReportCreateFlowProps) {
  const [currentStep, setCurrentStep] = useState<Step>('step1');
  const [step1Data, setStep1Data] = useState<any>(null);
  const [step2Data, setStep2Data] = useState<WeeklyReportFromSupabase | null>(null);

  const handleStep1Complete = (data: any) => {
    setStep1Data(data);
    setCurrentStep('step2');
  };

  const handleStep2Complete = (report: WeeklyReportFromSupabase) => {
    setStep2Data(report);
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
          <WeeklyReportStep1
            onComplete={handleStep1Complete}
            onBack={onBack}
          />
        );
      
      case 'step2':
        if (!step1Data) return null;
        return (
          <WeeklyReportStep2
            step1Data={step1Data}
            onComplete={handleStep2Complete}
            onBack={handleBackToStep1}
          />
        );
      
      case 'result':
        if (!step2Data) return null;
        return (
          <WeeklyReportResult
            weeklyReport={step2Data}
            onBack={onBack}
          />
        );
      
      default:
        return null;
    }
  };

  return renderCurrentStep();
}
