import React from 'react';
import HomeScreen from '../../components/HomeScreen';

export default function HomeTab() {
  const handleDayPress = (day: number) => {
    console.log('Day pressed:', day);
    // Handle day press in tab navigation context
  };

  return (
    <HomeScreen onDayPress={handleDayPress} />
  );
}