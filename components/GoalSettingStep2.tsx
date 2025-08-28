import { useState, useEffect } from 'react';
import {
    Alert,
    Dimensions,
    Modal,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { useHabitStore } from '../lib/habitStore';
import { Colors } from '../constants/Colors';
import { Spacing } from '../constants/Spacing';
import { useColorScheme } from '../hooks/useColorScheme';

const { width } = Dimensions.get('window');

interface GoalSettingStep2Props {
  onNext?: (data: { duration: string; timeWindow: string }) => void;
  onBack?: () => void;
  initialValue?: { duration?: string; timeWindow?: string };
  collectedGoalInfo?: any; // 음성으로 수집된 목표 정보
}

export default function GoalSettingStep2({
  onNext,
  onBack,
  initialValue = {},
  collectedGoalInfo
}: GoalSettingStep2Props) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const styles = createStyles(colors);
  // Duration state
  const [selectedDuration, setSelectedDuration] = useState(initialValue.duration || '3개월');
  const [showMonthPicker, setShowMonthPicker] = useState(false);
  const [tempMonth, setTempMonth] = useState(3);

  // Time window state
  const [startTime, setStartTime] = useState({ hours: 19, minutes: 0 });
  const [endTime, setEndTime] = useState({ hours: 22, minutes: 0 });
  const [showTimePickerFrom, setShowTimePickerFrom] = useState(false);
  const [showTimePickerTo, setShowTimePickerTo] = useState(false);
  const [tempTime, setTempTime] = useState({ hours: 19, minutes: 0 });

  const { setAvailableTime, setGoalPeriod } = useHabitStore();

  // collectedGoalInfo에서 기간과 시간 정보 추출하여 미리 채우기
  useEffect(() => {
    if (collectedGoalInfo) {
      // 기간 정보 추출 - 버튼 선택 상태로 설정
      if (collectedGoalInfo.period) {
        // AI가 말한 기간을 버튼 옵션에 맞게 변환
        let periodToSet = collectedGoalInfo.period;
        
        // AI가 "3개월"이라고 했으면 "3개월" 버튼 선택
        if (collectedGoalInfo.period.includes('3개월')) {
          periodToSet = '3개월';
        } else if (collectedGoalInfo.period.includes('6개월')) {
          periodToSet = '6개월';
        } else if (collectedGoalInfo.period.includes('9개월')) {
          periodToSet = '9개월';
        } else {
          // 다른 기간이면 커스텀으로 설정
          const monthMatch = collectedGoalInfo.period.match(/(\d+)개월/);
          if (monthMatch) {
            const month = parseInt(monthMatch[1]);
            periodToSet = `직접 입력: ${month}개월`;
            setTempMonth(month);
          }
        }
        setSelectedDuration(periodToSet);
      }
      
      // 시간 정보 추출 - AI가 말한 시간을 시간 선택기에 반영
      if (collectedGoalInfo.time) {
        console.log('[GoalSettingStep2] AI가 말한 시간:', collectedGoalInfo.time);
        
        // 시간 범위 패턴 확인 (예: "오후 5시부터 7시까지")
        const timeRangeMatch = collectedGoalInfo.time.match(/(\d+)시\s*부터\s*(\d+)시\s*까지/);
        if (timeRangeMatch) {
          const startHour = parseInt(timeRangeMatch[1]);
          const endHour = parseInt(timeRangeMatch[2]);
          
          // 오후/저녁 시간대 처리
          let adjustedStartHour = startHour;
          let adjustedEndHour = endHour;
          
          if (collectedGoalInfo.time.includes('오후') || collectedGoalInfo.time.includes('저녁')) {
            if (startHour < 12) {
              adjustedStartHour = startHour + 12;
            }
            if (endHour < 12) {
              adjustedEndHour = endHour + 12;
            }
          }
          
          setStartTime({ hours: adjustedStartHour, minutes: 0 });
          setEndTime({ hours: adjustedEndHour, minutes: 0 });
          console.log('[GoalSettingStep2] 시간 범위 설정:', { start: adjustedStartHour, end: adjustedEndHour });
        } else {
          // 단일 시간 패턴 (예: "아침 7시", "오후 5시")
          const timeMatch = collectedGoalInfo.time.match(/(\d+)시/);
          if (timeMatch) {
            let hour = parseInt(timeMatch[1]);
            
            // 오전/오후 시간대 처리
            if (collectedGoalInfo.time.includes('오후') || collectedGoalInfo.time.includes('저녁')) {
              if (hour < 12) {
                hour = hour + 12;
              }
            }
            
            setStartTime({ hours: hour, minutes: 0 });
            setEndTime({ hours: hour + 1, minutes: 0 });
            console.log('[GoalSettingStep2] 단일 시간 설정:', { hour, start: hour, end: hour + 1 });
          }
        }
      }
    }
  }, [collectedGoalInfo]);

  // Generate hours (00-23) and minutes (00, 15, 30, 45)
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const minutes = [0, 15, 30, 45];
  const months = Array.from({ length: 12 }, (_, i) => i + 1); // 1-12 months

  const formatTime = (hours: number, minutes: number): string => {
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  };

  const formatDisplayTime = (hours: number, minutes: number): string => {
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  };

  const durationButtons = [
    { key: '3months', label: '3개월', value: '3개월' },
    { key: '6months', label: '6개월', value: '6개월' },
    { key: '9months', label: '9개월', value: '9개월' },
    { key: 'custom', label: getCustomButtonLabel(), value: 'custom' },
  ];

  function getCustomButtonLabel(): string {
    if (selectedDuration && !['3개월', '6개월', '9개월'].includes(selectedDuration)) {
      return selectedDuration.startsWith('직접 입력:') ? selectedDuration : `직접 입력: ${selectedDuration}`;
    }
    return '직접 입력';
  }

  const handleDurationSelect = (duration: { key: string; value: string }) => {
    if (duration.key === 'custom') {
      setShowMonthPicker(true);
    } else {
      setSelectedDuration(duration.value);
    }
  };

  const handleMonthPickerConfirm = () => {
    const customDuration = `직접 입력: ${tempMonth}개월`;
    setSelectedDuration(customDuration);
    setShowMonthPicker(false);
  };

  const handleMonthPickerCancel = () => {
    setShowMonthPicker(false);
  };

  const handleTimePickerOpen = (type: 'from' | 'to') => {
    if (type === 'from') {
      setTempTime(startTime);
      setShowTimePickerFrom(true);
    } else {
      setTempTime(endTime);
      setShowTimePickerTo(true);
    }
  };

  const handleTimePickerConfirm = (type: 'from' | 'to') => {
    if (type === 'from') {
      setStartTime(tempTime);
      setShowTimePickerFrom(false);
    } else {
      setEndTime(tempTime);
      setShowTimePickerTo(false);
    }
  };

  const handleTimePickerCancel = () => {
    setShowTimePickerFrom(false);
    setShowTimePickerTo(false);
  };

  const handleNext = () => {
    if (!selectedDuration) {
      Alert.alert('오류', '프로젝트 기간을 선택해주세요.');
      return;
    }

    // Format duration for backend - convert to "N Months" format
    let finalDuration = selectedDuration;
    if (selectedDuration.startsWith('직접 입력:')) {
      const match = selectedDuration.match(/(\d+)개월/);
      if (match) {
        const num = match[1];
        finalDuration = `${num}개월`;
      }
    } else {
      // Convert Korean preset durations to English for backend
      const durationMap: { [key: string]: string } = {
        '3개월': '3 Months',
        '6개월': '6 Months',
        '9개월': '9 Months'
      };
      finalDuration = durationMap[selectedDuration] || selectedDuration;
    }

    const timeWindow = `${formatTime(startTime.hours, startTime.minutes)}-${formatTime(endTime.hours, endTime.minutes)}`;
    
    console.log('🔄 Starting GoalSettingStep2 submission...', { duration: finalDuration, timeWindow });
    
    try {
      // Save to habit store (using existing structure)
      // console.log('🏪 Saving to habit store...');
      setAvailableTime(timeWindow);
      setGoalPeriod(finalDuration);
      // console.log('✅ Successfully saved to habit store');

      const data = {
        duration: finalDuration,
        timeWindow: timeWindow
      };

      // console.log('🚀 Calling onNext handler...');
      if (onNext) {
        onNext(data);
        // console.log('✅ onNext called successfully');
      } else {
        // console.warn('⚠️ onNext is undefined!');
      }
    } catch (error) {
      console.error('💥 Error in GoalSettingStep2:', error);
      Alert.alert('오류', `오류가 발생했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    }
  };

  const renderMonthPicker = () => (
    <Modal
      visible={showMonthPicker}
      transparent={true}
      animationType="fade"
      onRequestClose={handleMonthPickerCancel}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.timePickerModal}>
          <Text style={styles.timePickerTitle}>기간 (개월)</Text>
          
          <View style={styles.monthPickerContainer}>
            <ScrollView 
              style={styles.monthPicker}
              showsVerticalScrollIndicator={false}
              snapToInterval={50}
              decelerationRate="fast"
              contentContainerStyle={styles.monthPickerContent}
            >
              {months.map((month) => (
                <TouchableOpacity
                  key={month}
                  style={[
                    styles.monthPickerItem,
                    tempMonth === month && styles.pickerItemSelected
                  ]}
                  onPress={() => setTempMonth(month)}
                >
                                     <Text style={[
                     styles.monthPickerItemText,
                     tempMonth === month && styles.pickerItemTextSelected
                   ]}>
                     {month}개월
                   </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>

          <View style={styles.timePickerButtons}>
            <TouchableOpacity style={styles.cancelButton} onPress={handleMonthPickerCancel}>
              <Text style={styles.cancelButtonText}>취소</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.confirmButton} onPress={handleMonthPickerConfirm}>
              <Text style={styles.confirmButtonText}>확인</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  const renderTimePicker = (type: 'from' | 'to') => (
    <Modal
      visible={type === 'from' ? showTimePickerFrom : showTimePickerTo}
      transparent={true}
      animationType="fade"
      onRequestClose={handleTimePickerCancel}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.timePickerModal}>
          <Text style={styles.timePickerTitle}>
            {type === 'from' ? '시작 시간' : '종료 시간'}
          </Text>
          
          <View style={styles.timePickerContainer}>
            {/* Hours Picker */}
            <View style={styles.pickerColumn}>
              <ScrollView 
                style={styles.picker}
                showsVerticalScrollIndicator={false}
                snapToInterval={40}
                decelerationRate="fast"
                contentContainerStyle={styles.pickerContent}
              >
                {hours.map((hour) => (
                  <TouchableOpacity
                    key={hour}
                    style={[
                      styles.pickerItem,
                      tempTime.hours === hour && styles.pickerItemSelected
                    ]}
                    onPress={() => setTempTime(prev => ({ ...prev, hours: hour }))}
                  >
                    <Text style={[
                      styles.pickerItemText,
                      tempTime.hours === hour && styles.pickerItemTextSelected
                    ]}>
                      {hour.toString().padStart(2, '0')}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            <Text style={styles.timeSeparator}>:</Text>

            {/* Minutes Picker */}
            <View style={styles.pickerColumn}>
              <ScrollView 
                style={styles.picker}
                showsVerticalScrollIndicator={false}
                snapToInterval={40}
                decelerationRate="fast"
                contentContainerStyle={styles.pickerContent}
              >
                {minutes.map((minute) => (
                  <TouchableOpacity
                    key={minute}
                    style={[
                      styles.pickerItem,
                      tempTime.minutes === minute && styles.pickerItemSelected
                    ]}
                    onPress={() => setTempTime(prev => ({ ...prev, minutes: minute }))}
                  >
                    <Text style={[
                      styles.pickerItemText,
                      tempTime.minutes === minute && styles.pickerItemTextSelected
                    ]}>
                      {minute.toString().padStart(2, '0')}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          </View>

          <View style={styles.timePickerButtons}>
            <TouchableOpacity style={styles.cancelButton} onPress={handleTimePickerCancel}>
              <Text style={styles.cancelButtonText}>취소</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.confirmButton} onPress={() => handleTimePickerConfirm(type)}>
              <Text style={styles.confirmButtonText}>확인</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.stepIndicator}>2 / 6 단계</Text>
      
      {/* Back Button */}
      <TouchableOpacity
        style={styles.backButton}
        onPress={onBack}
      >
        <Text style={styles.backButtonText}>← 이전</Text>
      </TouchableOpacity>

      <ScrollView style={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        {/* Top Section: Project Duration */}
        <View style={styles.topSection}>
          <View style={styles.sectionTitleContainer}>
            <Text style={styles.sectionTitle}>프로젝트 기간</Text>
            <Text style={styles.sectionSubtitle}>목표 달성까지 얼마나 걸릴까요?</Text>
          </View>
          
          {/* AI가 수집한 기간 정보 표시 */}
          {collectedGoalInfo?.period && (
            <View style={styles.timeWindowSummary}>
              <Text style={styles.timeWindowSummaryText}>
                🎯 AI가 수집한 기간: {collectedGoalInfo.period}
              </Text>
            </View>
          )}

          <View style={styles.durationContainer}>
            {durationButtons.map((duration) => (
              <TouchableOpacity
                key={duration.key}
                style={[
                  styles.durationButton,
                  (selectedDuration === duration.value || 
                   (duration.key === 'custom' && selectedDuration.startsWith('직접 입력:'))) && 
                  styles.durationButtonSelected,
                ]}
                onPress={() => handleDurationSelect(duration)}
              >
                <Text style={[
                  styles.durationButtonText,
                  (selectedDuration === duration.value || 
                   (duration.key === 'custom' && selectedDuration.startsWith('직접 입력:'))) && 
                  styles.durationButtonTextSelected,
                ]}>
                  {duration.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Bottom Section: Time Window */}
        <View style={styles.bottomSection}>
          <View style={styles.sectionTitleContainer}>
            <Text style={styles.sectionTitle}>일일 가용시간</Text>
            <Text style={styles.sectionSubtitle}>매일 언제 시간을 내실 수 있나요?</Text>
          </View>
          
          {/* AI가 수집한 시간 정보 표시 */}
          {collectedGoalInfo?.time && (
            <View style={styles.timeWindowSummary}>
              <Text style={styles.timeWindowSummaryText}>
                🎯 AI가 수집한 정보: {collectedGoalInfo.time}
              </Text>
            </View>
          )}

          <View style={styles.timeWindowContainer}>
            {/* From Time */}
            <View style={styles.timePickerSection}>
              <Text style={styles.timeLabel}>시작 시간</Text>
              <TouchableOpacity
                style={styles.timeDisplayButton}
                onPress={() => handleTimePickerOpen('from')}
              >
                <Text style={styles.timeDisplayText}>
                  {formatDisplayTime(startTime.hours, startTime.minutes)}
                </Text>
              </TouchableOpacity>
            </View>

            {/* To Time */}
            <View style={styles.timePickerSection}>
              <Text style={styles.timeLabel}>종료 시간</Text>
              <TouchableOpacity
                style={styles.timeDisplayButton}
                onPress={() => handleTimePickerOpen('to')}
              >
                <Text style={styles.timeDisplayText}>
                  {formatDisplayTime(endTime.hours, endTime.minutes)}
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Time Window Summary */}
          <View style={styles.timeWindowSummary}>
            <Text style={styles.timeWindowSummaryText}>
              매일 {formatTime(startTime.hours, startTime.minutes)} - {formatTime(endTime.hours, endTime.minutes)}
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Next Button - Fixed at bottom */}
      <View style={styles.bottomButtonContainer}>
        <TouchableOpacity
          style={styles.nextButton}
          onPress={handleNext}
        >
          <Text style={styles.nextButtonText}>다음</Text>
        </TouchableOpacity>
      </View>

      {/* Render Pickers */}
      {renderMonthPicker()}
      {renderTimePicker('from')}
      {renderTimePicker('to')}
    </View>
  );
}

const createStyles = (colors: typeof Colors.light) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    paddingHorizontal: Spacing.screen.paddingHorizontal,
    paddingTop: Spacing['7xl'] + Spacing['4xl'], // 100px
  },
  scrollContainer: {
    flex: 1,
    marginBottom: 20,
  },
  stepIndicator: {
    fontSize: colors.typography.fontSize.base,
    fontWeight: colors.typography.fontWeight.bold,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing['5xl'],
    fontFamily: 'Inter',
  },
  backButton: {
    position: 'absolute',
    top: 60,
    left: 24,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: 'transparent',
    zIndex: 10,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textSecondary,
    fontFamily: Platform.OS === 'ios' ? 'Inter' : 'Inter',
  },

  // Top Section: Project Duration
  topSection: {
    marginBottom: 40,
    minHeight: 200,
  },
  sectionTitleContainer: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: colors.typography.fontSize['2xl'],
    fontWeight: colors.typography.fontWeight.bold,
    color: colors.text,
    textAlign: 'center',
    marginBottom: Spacing.md,
    fontFamily: 'Inter',
  },
  sectionSubtitle: {
    fontSize: 16,
    color: colors.textSecondary,
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'Inter' : 'Inter',
  },
  durationContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 12,
  },
  durationButton: {
    backgroundColor: colors.card,
    borderRadius: Spacing.layout.borderRadius.md,
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.md,
    width: '48%',
    borderWidth: 2,
    borderColor: 'transparent',
    minHeight: Spacing['6xl'] + Spacing.md, // ~60px
    justifyContent: 'center',
  },
  durationButtonSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.card,
  },
  durationButtonText: {
    fontSize: 14,
    color: colors.text,
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'Inter' : 'Inter',
    lineHeight: 18,
  },
  durationButtonTextSelected: {
    color: colors.text,
    fontWeight: '600',
  },

  // Bottom Section: Time Window
  bottomSection: {
    marginBottom: 40,
    minHeight: 200,
  },
  timeWindowContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    gap: 16,
  },
  timePickerSection: {
    flex: 1,
  },
  timeLabel: {
    fontSize: 16,
    color: colors.textSecondary,
    marginBottom: 8,
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'Inter' : 'Inter',
  },
  timeDisplayButton: {
    backgroundColor: colors.card,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 12,
    alignItems: 'center',
    minHeight: 50,
    justifyContent: 'center',
  },
  timeDisplayText: {
    fontSize: 16,
    color: colors.text,
    fontWeight: '600',
    fontFamily: Platform.OS === 'ios' ? 'Inter' : 'Inter',
  },
  timeWindowSummary: {
    backgroundColor: colors.cardSecondary,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    marginTop: 10,
  },
  timeWindowSummaryText: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '500',
    fontFamily: Platform.OS === 'ios' ? 'Inter' : 'Inter',
  },

  // Bottom Button Container - Fixed positioning
  bottomButtonContainer: {
    paddingBottom: 40,
    paddingTop: 20,
    backgroundColor: colors.background,
  },
  nextButton: {
    backgroundColor: colors.primary,
    borderRadius: 28,
    paddingVertical: 19,
    alignItems: 'center',
    height: 56,
    justifyContent: 'center',
  },
  nextButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    fontFamily: Platform.OS === 'ios' ? 'Inter' : 'Inter',
  },

  // Month Picker Styles
  monthPickerContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  monthPicker: {
    height: 250,
    width: 200,
  },
  monthPickerContent: {
    paddingVertical: 100,
  },
  monthPickerItem: {
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  monthPickerItemText: {
    fontSize: 18,
    color: colors.textSecondary,
    fontFamily: Platform.OS === 'ios' ? 'Inter' : 'Inter',
  },

  // Time Picker Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  timePickerModal: {
    backgroundColor: colors.card,
    borderRadius: 24,
    width: width - 60,
    maxWidth: 400,
    paddingVertical: 24,
    paddingHorizontal: 24,
  },
  timePickerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: colors.text,
    textAlign: 'center',
    marginBottom: 20,
    fontFamily: Platform.OS === 'ios' ? 'Inter' : 'Inter',
  },
  timePickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 30,
  },
  pickerColumn: {
    flex: 1,
  },
  picker: {
    height: 200,
  },
  pickerContent: {
    paddingVertical: 80,
  },
  pickerItem: {
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickerItemSelected: {
    backgroundColor: colors.primary,
    borderRadius: 8,
  },
  pickerItemText: {
    fontSize: 24,
    color: colors.textSecondary,
    fontFamily: Platform.OS === 'ios' ? 'Inter' : 'Inter',
  },
  pickerItemTextSelected: {
    color: colors.text,
    fontWeight: 'bold',
  },
  timeSeparator: {
    fontSize: 24,
    color: colors.text,
    fontWeight: 'bold',
    marginHorizontal: 20,
    fontFamily: Platform.OS === 'ios' ? 'Inter' : 'Inter',
  },
  timePickerButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  cancelButton: {
    backgroundColor: colors.modalBackground,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
    flex: 1,
  },
  cancelButtonText: {
    fontSize: 16,
    color: colors.text,
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'Inter' : 'Inter',
  },
  confirmButton: {
    backgroundColor: colors.primary,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
    flex: 1,
  },
  confirmButtonText: {
    fontSize: 16,
    color: colors.text,
    fontWeight: 'bold',
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'Inter' : 'Inter',
  },
  

}); 