import { useState, useRef } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import ReportScreen from '../../components/ReportScreen/index';
import TabContentTransition, { TabTransitionDirection } from '../../components/TabContentTransition';

export default function ReportTab() {
  const [transitionDirection, setTransitionDirection] = useState<TabTransitionDirection>('none');
  const [screenKey, setScreenKey] = useState('report-initial');
  const isFirstRender = useRef(true);

  useFocusEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    
    // Tab became focused - animate in from right
    setTransitionDirection('right');
    setScreenKey(`report-${Date.now()}`);
  });

  return (
    <TabContentTransition 
      screenKey={screenKey}
      direction={transitionDirection}
      onTransitionComplete={() => setTransitionDirection('none')}
    >
      <ReportScreen />
    </TabContentTransition>
  );
} 