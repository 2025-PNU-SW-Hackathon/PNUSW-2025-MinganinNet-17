import { useState } from 'react';
import {
    Alert,
    Dimensions,
    Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { useHabitStore } from '../lib/habitStore';

const { width } = Dimensions.get('window');

export interface GoalSettingStep2Data {
  timeSlot: 'morning' | 'lunch' | 'evening' | 'custom';
  customTime: string;
  notificationTime: string;
}

interface GoalSettingStep2Props {
  onNext?: (data: GoalSettingStep2Data) => void;
  onBack?: () => void;
  initialData?: GoalSettingStep2Data;
}

export default function GoalSettingStep2({ 
  onNext, 
  onBack, 
  initialData 
}: GoalSettingStep2Props) {
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<'morning' | 'lunch' | 'evening' | 'custom'>(
    initialData?.timeSlot || 'custom'
  );
  const [customTime, setCustomTime] = useState(initialData?.customTime || '');
  const [notificationTime, setNotificationTime] = useState(initialData?.notificationTime || '오후 4:30');
  const { setTime } = useHabitStore();

  const timeSlotOptions = [
    { key: 'morning', label: '아침' },
    { key: 'lunch', label: '점심' },
    { key: 'evening', label: '저녁' },
    { key: 'custom', label: '직접 입력' },
  ];

  const handleTimeSubmit = () => {
    if (selectedTimeSlot === 'custom' && !customTime.trim()) {
      Alert.alert('오류', '직접 입력 시간을 입력해주세요.');
      return;
    }

    if (!notificationTime.trim()) {
      Alert.alert('오류', '알림 시간을 입력해주세요.');
      return;
    }

    // 선택된 시간대와 커스텀 시간을 조합하여 저장
    let timeToSave = '';
    if (selectedTimeSlot === 'custom') {
      timeToSave = customTime;
    } else {
      const timeMap = {
        morning: '아침 시간대',
        lunch: '점심 시간대',
        evening: '저녁 시간대'
      };
      timeToSave = timeMap[selectedTimeSlot];
    }

    // Zustand store에 저장
    setTime(timeToSave);

    const data: GoalSettingStep2Data = {
      timeSlot: selectedTimeSlot,
      customTime,
      notificationTime,
    };

    if (onNext) {
      onNext(data);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.stepIndicator}>2 / 4 단계</Text>
      
      <View style={styles.titleContainer}>
        <Text style={styles.title}>
          주로 언제를 활용해{'\n'}루틴을 실천할까요?
        </Text>
      </View>

      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>실천 시간대</Text>
        <View style={styles.timeSlotContainer}>
          {timeSlotOptions.map((option) => (
            <TouchableOpacity
              key={option.key}
              style={[
                styles.timeSlotButton,
                selectedTimeSlot === option.key && styles.timeSlotButtonSelected,
                option.key === 'custom' && styles.customTimeButton,
              ]}
              onPress={() => setSelectedTimeSlot(option.key as any)}
            >
              <Text
                style={[
                  styles.timeSlotButtonText,
                  selectedTimeSlot === option.key && styles.timeSlotButtonTextSelected,
                ]}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {selectedTimeSlot === 'custom' && (
          <TextInput
            style={styles.customTimeInput}
            value={customTime}
            onChangeText={setCustomTime}
            placeholder="예: 오후 4시 30분"
            placeholderTextColor="#a9a9c2"
          />
        )}
      </View>

      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>매일 알림 시간</Text>
        <TextInput
          style={styles.notificationInput}
          value={notificationTime}
          onChangeText={setNotificationTime}
          placeholder="오후 4:30"
          placeholderTextColor="#a9a9c2"
        />
      </View>

      <TouchableOpacity
        style={styles.nextButton}
        onPress={handleTimeSubmit}
      >
        <Text style={styles.nextButtonText}>저장하고 다음으로</Text>
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
  sectionContainer: {
    marginBottom: 40,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 20,
    fontFamily: Platform.OS === 'ios' ? 'Inter' : 'Inter',
  },
  timeSlotContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 20,
  },
  timeSlotButton: {
    backgroundColor: '#3a3a50',
    borderRadius: 20,
    paddingHorizontal: 20,
    paddingVertical: 10,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 66,
  },
  customTimeButton: {
    minWidth: 95,
  },
  timeSlotButtonSelected: {
    backgroundColor: '#6c63ff',
  },
  timeSlotButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#a9a9c2',
    fontFamily: Platform.OS === 'ios' ? 'Inter' : 'Inter',
  },
  timeSlotButtonTextSelected: {
    color: '#ffffff',
  },
  customTimeInput: {
    backgroundColor: '#3a3a50',
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    fontSize: 16,
    color: '#ffffff',
    height: 52,
    fontFamily: Platform.OS === 'ios' ? 'Inter' : 'Inter',
  },
  notificationInput: {
    backgroundColor: '#3a3a50',
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    fontSize: 16,
    color: '#ffffff',
    height: 52,
    fontFamily: Platform.OS === 'ios' ? 'Inter' : 'Inter',
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
}); 