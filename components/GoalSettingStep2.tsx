import { useState } from 'react';
import {
  Alert,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useHabitStore } from '../lib/habitStore';

interface GoalSettingStep2Props {
  onNext?: (timeSlot: string) => void;
  onBack?: () => void;
  initialValue?: string;
}

export default function GoalSettingStep2({
  onNext,
  onBack,
  initialValue = ''
}: GoalSettingStep2Props) {
  const [selectedTimeSlot, setSelectedTimeSlot] = useState(initialValue || '아침');
  const { setTimeSlot } = useHabitStore();

  const timeSlotOptions = [
    { key: '아침', label: '아침 (6시~10시)' },
    { key: '점심', label: '점심 (11시~2시)' },
    { key: '저녁', label: '저녁 (6시~10시)' },
    { key: '자유롭게', label: '자유롭게' },
  ];

  const handleTimeSlotSelect = (timeSlot: string) => {
    console.log('🔄 Time slot selected:', timeSlot);
    setSelectedTimeSlot(timeSlot);
  };

  const handleNext = () => {
    console.log('🔄 Starting time slot submission...', { selectedTimeSlot });
    
    try {
      // Save to habit store
      console.log('🏪 Saving to habit store...');
      setTimeSlot(selectedTimeSlot);
      console.log('✅ Successfully saved to habit store');

      console.log('🚀 Calling onNext handler...');
      if (onNext) {
        onNext(selectedTimeSlot);
        console.log('✅ onNext called successfully');
      } else {
        console.warn('⚠️ onNext is undefined!');
      }
    } catch (error) {
      console.error('💥 Error in GoalSettingStep2:', error);
      Alert.alert('오류', `오류가 발생했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.stepIndicator}>2 / 5 단계</Text>
      
      {/* Back Button */}
      <TouchableOpacity
        style={styles.backButton}
        onPress={onBack}
      >
        <Text style={styles.backButtonText}>← 이전</Text>
      </TouchableOpacity>
      
      <View style={styles.titleContainer}>
        <Text style={styles.title}>
          언제 습관을{'\n'}실천하시겠어요?
        </Text>
      </View>

      <View style={styles.optionsContainer}>
        {timeSlotOptions.map((option) => (
          <TouchableOpacity
            key={option.key}
            style={[
              styles.optionButton,
              selectedTimeSlot === option.key && styles.optionButtonSelected,
            ]}
            onPress={() => handleTimeSlotSelect(option.key)}
          >
            <Text
              style={[
                styles.optionButtonText,
                selectedTimeSlot === option.key && styles.optionButtonTextSelected,
              ]}
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <TouchableOpacity
        style={styles.nextButton}
        onPress={handleNext}
      >
        <Text style={styles.nextButtonText}>다음</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1c1c2e',
    paddingHorizontal: 24,
    paddingTop: 100,
  },
  stepIndicator: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#a9a9c2',
    textAlign: 'center',
    marginBottom: 40,
    fontFamily: Platform.OS === 'ios' ? 'Inter' : 'Inter',
  },
  titleContainer: {
    marginBottom: 60,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    lineHeight: 40,
    fontFamily: Platform.OS === 'ios' ? 'Inter' : 'Inter',
  },
  optionsContainer: {
    marginBottom: 40,
  },
  optionButton: {
    backgroundColor: '#3a3a50',
    borderRadius: 16,
    paddingVertical: 20,
    paddingHorizontal: 20,
    marginBottom: 16,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  optionButtonSelected: {
    borderColor: '#6c63ff',
    backgroundColor: '#3a3a50',
  },
  optionButtonText: {
    fontSize: 16,
    color: '#ffffff',
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'Inter' : 'Inter',
  },
  optionButtonTextSelected: {
    color: '#ffffff',
    fontWeight: '600',
  },
  nextButton: {
    backgroundColor: '#6c63ff',
    borderRadius: 28,
    paddingVertical: 19,
    alignItems: 'center',
    height: 56,
    justifyContent: 'center',
    position: 'absolute',
    bottom: 40,
    left: 24,
    right: 24,
  },
  nextButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    fontFamily: Platform.OS === 'ios' ? 'Inter' : 'Inter',
  },
  backButton: {
    position: 'absolute',
    top: 60,
    left: 24,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: 'transparent',
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#a9a9c2',
    fontFamily: Platform.OS === 'ios' ? 'Inter' : 'Inter',
  },
}); 