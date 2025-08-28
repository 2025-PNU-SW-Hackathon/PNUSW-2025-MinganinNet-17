import { useState, useRef } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import TimelineView from '../../components/TimelineView';
import TabContentTransition, { TabTransitionDirection } from '../../components/TabContentTransition';

export default function PlanTab() {
  const [transitionDirection, setTransitionDirection] = useState<TabTransitionDirection>('none');
  const [screenKey, setScreenKey] = useState('plan-initial');
  const isFirstRender = useRef(true);

  useFocusEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    
    // Tab became focused - animate in from right
    setTransitionDirection('right');
    setScreenKey(`plan-${Date.now()}`);
  });

  return (
    <TabContentTransition 
      screenKey={screenKey}
      direction={transitionDirection}
      onTransitionComplete={() => setTransitionDirection('none')}
    >
      <TimelineView />
    </TabContentTransition>
  );
} 