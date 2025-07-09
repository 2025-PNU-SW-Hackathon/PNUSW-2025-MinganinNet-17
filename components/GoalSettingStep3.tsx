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
import { HabitData, saveHabitToSupabase } from '../backend/supabase/habits';
import { useHabitStore } from '../lib/habitStore';

const { width } = Dimensions.get('window');

export interface GoalSettingStep3Data {
  timeSlot: 'morning' | 'lunch' | 'evening' | 'custom';
  customTime: string;
  notificationTime: string;
}

interface GoalSettingStep3Props {
  onNext?: (data: GoalSettingStep3Data) => void;
  onBack?: () => void;
  initialData?: GoalSettingStep3Data;
}

export default function GoalSettingStep3({ 
  onNext, 
  onBack, 
  initialData 
}: GoalSettingStep3Props) {
  const [selectedTimeSlot, setSelectedTimeSlot] = useState<'morning' | 'lunch' | 'evening' | 'custom'>(
    initialData?.timeSlot || 'custom'
  );
  const [customTime, setCustomTime] = useState(initialData?.customTime || '');
  const [notificationTime, setNotificationTime] = useState(initialData?.notificationTime || '오후 4:30');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { habit, setTime } = useHabitStore();

  const handleTimeSubmit = async () => {
    if (selectedTimeSlot === 'custom' && !customTime.trim()) {
      Alert.alert('오류', '직접 입력 시간을 입력해주세요.');
      return;
    }

    if (!notificationTime.trim()) {
      Alert.alert('오류', '알림 시간을 입력해주세요.');
      return;
    }

    console.log('🔄 Starting GoalSettingStep3 submission...', { selectedTimeSlot, customTime, notificationTime });
    setIsSubmitting(true);
    
    try {
      const timeToSave = selectedTimeSlot === 'custom' ? customTime : `${selectedTimeSlot} 시간대`;
      
      // 기존 데이터를 업데이트
      const habitData: HabitData = {
        habit_name: habit,
        time_slot: timeToSave,
        intensity: '',  // 아직 설정되지 않음
        difficulty: '', // 아직 설정되지 않음
        ai_routine: ''  // 아직 생성되지 않음
      };

      console.log('💾 Attempting to save to Supabase...', habitData);
      
      try {
        await saveHabitToSupabase(habitData);
        console.log('✅ Successfully saved to Supabase');
      } catch (dbError) {
        console.error('❌ Database save failed:', dbError);
        
        // 인증 오류인 경우 조용히 처리
        if (dbError instanceof Error && dbError.message === 'AUTH_MISSING') {
          console.log('🔓 No authentication - continuing with local storage only');
        } else {
          // 다른 오류는 알림 표시하지만 계속 진행
          console.warn('⚠️ Database error, continuing with local storage:', dbError);
        }
      }
      
      // Zustand store에 저장 (항상 실행)
      console.log('🏪 Saving to local store...');
      setTime(timeToSave);
      console.log('✅ Successfully saved to local store');

      const data: GoalSettingStep3Data = {
        timeSlot: selectedTimeSlot,
        customTime,
        notificationTime,
      };

      console.log('🚀 Calling onNext handler...');
      if (onNext) {
        onNext(data);
        console.log('✅ onNext called successfully');
      } else {
        console.warn('⚠️ onNext is undefined!');
      }
      
    } catch (error) {
      console.error('💥 Unexpected error in handleTimeSubmit:', error);
      Alert.alert('오류', `예상치 못한 오류가 발생했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    } finally {
      setIsSubmitting(false);
      console.log('🏁 Finished GoalSettingStep3 submission');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.stepIndicator}>3 / 5 단계</Text>
      
      {/* Back Button */}
      <TouchableOpacity
        style={styles.backButton}
        onPress={onBack}
        disabled={isSubmitting}
      >
        <Text style={styles.backButtonText}>← 이전</Text>
      </TouchableOpacity>
      
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
        style={[
          styles.nextButton,
          isSubmitting && styles.nextButtonDisabled
        ]}
        onPress={handleTimeSubmit}
        disabled={isSubmitting}
      >
        <Text style={styles.nextButtonText}>
          {isSubmitting ? '저장 중...' : '저장하고 다음으로'}
        </Text>
      </TouchableOpacity>
      
      {/* 임시 테스트 버튼 - 디버깅용 */}
      <TouchableOpacity
        style={styles.testButton}
        onPress={() => {
          console.log('🧪 TEST BUTTON: Bypassing database, calling onNext directly');
          const timeToSave = selectedTimeSlot === 'custom' ? customTime : `${selectedTimeSlot} 시간대`;
          setTime(timeToSave);
          
          const data: GoalSettingStep3Data = {
            timeSlot: selectedTimeSlot,
            customTime,
            notificationTime,
          };
          
          if (onNext) {
            onNext(data);
          }
        }}
      >
        <Text style={styles.testButtonText}>테스트: 다음으로 (DB 건너뛰기)</Text>
      </TouchableOpacity>
    </View>
  );
}

const timeSlotOptions = [
  { key: 'morning', label: '아침' },
  { key: 'lunch', label: '점심' },
  { key: 'evening', label: '저녁' },
  { key: 'custom', label: '직접 입력' },
];

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
  nextButtonDisabled: {
    backgroundColor: '#a9a9c2',
    opacity: 0.7,
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
  testButton: {
    backgroundColor: '#ff6b6b',
    borderRadius: 16,
    paddingVertical: 12,
    alignItems: 'center',
    marginHorizontal: 24,
    marginTop: 16,
  },
  testButtonText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#ffffff',
    fontFamily: Platform.OS === 'ios' ? 'Inter' : 'Inter',
  },
}); 