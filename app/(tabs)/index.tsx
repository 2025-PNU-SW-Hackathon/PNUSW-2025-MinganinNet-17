import { useState } from 'react';
import HomeScreen from '../../components/HomeScreen';

export default function HomeTab() {
  const [selectedDate, setSelectedDate] = useState<string | undefined>(undefined);

  const handleDayPress = (day: number) => {
    // Create full date string from current year/month and selected day
    const today = new Date();
    const fullDate = new Date(today.getFullYear(), today.getMonth(), day);
    const dateString = fullDate.toISOString().split('T')[0];
    setSelectedDate(dateString);
  };

  return (
    <HomeScreen selectedDate={selectedDate} />
  );
}