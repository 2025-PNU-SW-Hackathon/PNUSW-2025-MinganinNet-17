import { useState, useRef } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import HomeScreen from '../../components/HomeScreen/index';
import TabContentTransition, { TabTransitionDirection } from '../../components/TabContentTransition';

export default function HomeTab() {
  const [selectedDate, setSelectedDate] = useState<string | undefined>(undefined);
  const [transitionDirection, setTransitionDirection] = useState<TabTransitionDirection>('none');
  const [screenKey, setScreenKey] = useState('home-initial');
  const isFirstRender = useRef(true);

  const handleDayPress = (day: number) => {
    // Create full date string from current year/month and selected day
    const today = new Date();
    const fullDate = new Date(today.getFullYear(), today.getMonth(), day);
    const dateString = fullDate.toISOString().split('T')[0];
    setSelectedDate(dateString);
  };

  useFocusEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    
    // Tab became focused - animate in from right (assuming forward navigation)
    setTransitionDirection('right');
    setScreenKey(`home-${Date.now()}`);
  });

  return (
    <TabContentTransition 
      screenKey={screenKey}
      direction={transitionDirection}
      onTransitionComplete={() => setTransitionDirection('none')}
    >
      <HomeScreen selectedDate={selectedDate} />
    </TabContentTransition>
  );
}