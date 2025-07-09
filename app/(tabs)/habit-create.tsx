import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { submitHabitData } from '../../backend/hwirang/habit';
import { scheduleAllHabitRoutines } from '../../backend/hwirang/routineNotifications';
import { HabitEvent, saveHabitRoutine } from '../../backend/supabase/habits';
import { ThemedText } from '../../components/ThemedText.tsx';
import { ThemedView } from '../../components/ThemedView.tsx';
import { Colors } from '../../constants/Colors';
import { useHabitStore } from '../../lib/habitStore';

export default function HabitCreateScreen() {
  const [habitText, setHabitText] = useState('');
  const [timeText, setTimeText] = useState('');
  const [intensityText, setIntensityText] = useState('');
  const [difficultyText, setDifficultyText] = useState('');
  const [createdHabitEvents, setCreatedHabitEvents] = useState<HabitEvent[] | null>(null);
  const [notificationStatus, setNotificationStatus] = useState('');

  // Zustand store에서 상태와 액션들을 가져옵니다
  const { 
    habit, 
    time, 
    intensity, 
    difficulty,
    setHabit,
    setTime,
    setIntensity,
    setDifficulty
  } = useHabitStore();

  const handleHabitSubmit = () => {
    setHabit(habitText);
  };

  const handleTimeSubmit = () => {
    setTime(timeText);
  };

  const handleIntensitySubmit = () => {
    setIntensity(intensityText);
  };

  const handleDifficultySubmit = () => {
    setDifficulty(difficultyText);
  };

  const handleFinalSubmit = async () => {
    try {
      if (!habit || !time || !intensity || !difficulty) {
        console.log('모든 필수 항목을 입력해주세요.');
        return;
      }

      console.log('전체 데이터 제출 시작...');
      
      // 1. AI 루틴 생성
      const habitEvents = await submitHabitData(habit, time, difficulty);
      console.log('AI 응답 결과:', habitEvents);

      // 2. 데이터베이스 저장
      const savedData = await saveHabitRoutine(
        habit,
        time,
        intensity,
        difficulty,
        habitEvents
      );
      console.log('저장된 데이터:', savedData);

      // 3. 생성된 habitEvents 저장
      setCreatedHabitEvents(habitEvents);
      setNotificationStatus('');

      // TODO: 성공 메시지 표시 또는 다음 화면으로 이동
    } catch (error) {
      console.error('데이터 제출 중 오류 발생:', error);
    }
  };

  const handleSetNotifications = async () => {
    try {
      if (!createdHabitEvents) {
        setNotificationStatus('먼저 습관을 생성해주세요.');
        return;
      }

      const result = await scheduleAllHabitRoutines(createdHabitEvents);
      
      if (result.success) {
        setNotificationStatus('✅ ' + result.message);
      } else {
        setNotificationStatus('❌ ' + (result.error || '알림 설정 실패'));
      }
    } catch (error) {
      setNotificationStatus('❌ 알림 설정 중 오류가 발생했습니다.');
      console.error('알림 설정 중 오류:', error);
    }
  };

  const renderPreviewSection = () => (
    <ThemedView style={styles.previewContainer}>
      <ThemedText style={styles.previewTitle}>입력 내용 확인</ThemedText>
      
      <View style={styles.previewItem}>
        <ThemedText style={styles.previewLabel}>습관:</ThemedText>
        <ThemedText style={styles.previewText}>{habit || '아직 입력되지 않음'}</ThemedText>
      </View>

      <View style={styles.previewItem}>
        <ThemedText style={styles.previewLabel}>시간:</ThemedText>
        <ThemedText style={styles.previewText}>{time || '아직 입력되지 않음'}</ThemedText>
      </View>

      <View style={styles.previewItem}>
        <ThemedText style={styles.previewLabel}>강도:</ThemedText>
        <ThemedText style={styles.previewText}>{intensity || '아직 입력되지 않음'}</ThemedText>
      </View>

      <View style={styles.previewItem}>
        <ThemedText style={styles.previewLabel}>어려운 점:</ThemedText>
        <ThemedText style={styles.previewText}>{difficulty || '아직 입력되지 않음'}</ThemedText>
      </View>

      <Pressable 
        style={({pressed}) => [
          styles.finalButton,
          pressed && styles.buttonPressed
        ]}
        onPress={handleFinalSubmit}
      >
        <ThemedText style={styles.finalButtonText}>전체 내용 저장</ThemedText>
      </Pressable>

      <Pressable 
        style={({pressed}) => [
          styles.notificationButton,
          pressed && styles.buttonPressed,
          !createdHabitEvents && styles.buttonDisabled
        ]}
        onPress={handleSetNotifications}
        disabled={!createdHabitEvents}
      >
        <ThemedText style={styles.finalButtonText}>알림 설정하기</ThemedText>
      </Pressable>

      {notificationStatus ? (
        <ThemedText style={styles.notificationStatus}>
          {notificationStatus}
        </ThemedText>
      ) : null}
    </ThemedView>
  );

  return (
    <ScrollView style={styles.scrollView}>
      <ThemedText style={styles.title}>
        새로운 습관 만들기
      </ThemedText>

      <View style={styles.contentContainer}>
        <View style={styles.inputSection}>
          <ThemedView style={styles.inputContainer}>
            <ThemedText style={styles.label}>
              만들고 싶은 좋은 습관은 무엇인가요?
            </ThemedText>
            <TextInput
              style={styles.input}
              value={habitText}
              onChangeText={setHabitText}
              placeholder="좋은 습관을 입력해주세요"
              placeholderTextColor={Colors.light.text + '80'}
              multiline
            />
            <Pressable 
              style={({pressed}) => [
                styles.button,
                pressed && styles.buttonPressed
              ]}
              onPress={handleHabitSubmit}
            >
              <ThemedText style={styles.buttonText}>습관 저장</ThemedText>
            </Pressable>
          </ThemedView>

          <ThemedView style={[styles.inputContainer, styles.spacing]}>
            <ThemedText style={styles.label}>
              하루 중 언제 이 습관을 실천할 수 있나요?
            </ThemedText>
            <ThemedText style={styles.subtitle}>
              예: 아침 운동은 6시-7시, 점심 산책은 1시-2시
            </ThemedText>
            <TextInput
              style={[styles.input, { minHeight: 60 }]}
              value={timeText}
              onChangeText={setTimeText}
              placeholder="실천 가능한 시간대를 입력해주세요"
              placeholderTextColor={Colors.light.text + '80'}
              multiline
            />
            <Pressable 
              style={({pressed}) => [
                styles.button,
                pressed && styles.buttonPressed
              ]}
              onPress={handleTimeSubmit}
            >
              <ThemedText style={styles.buttonText}>시간 저장</ThemedText>
            </Pressable>
          </ThemedView>

          <ThemedView style={[styles.inputContainer, styles.spacing]}>
            <ThemedText style={styles.label}>
              이 습관의 강도는 어느 정도로 하고 싶으신가요?
            </ThemedText>
            <ThemedText style={styles.subtitle}>
              예: 가벼운 스트레칭, 30분 조깅, 1시간 집중 독서
            </ThemedText>
            <TextInput
              style={styles.input}
              value={intensityText}
              onChangeText={setIntensityText}
              placeholder="원하는 습관의 강도를 입력해주세요"
              placeholderTextColor={Colors.light.text + '80'}
              multiline
            />
            <Pressable 
              style={({pressed}) => [
                styles.button,
                pressed && styles.buttonPressed
              ]}
              onPress={handleIntensitySubmit}
            >
              <ThemedText style={styles.buttonText}>강도 저장</ThemedText>
            </Pressable>
          </ThemedView>

          <ThemedView style={[styles.inputContainer, styles.spacing]}>
            <ThemedText style={styles.label}>
              이 습관을 만드는 데 어려운 점은 무엇인가요?
            </ThemedText>
            <ThemedText style={styles.subtitle}>
              예: 아침에 일어나기 힘들어요, 시간 부족, 의지가 부족해요
            </ThemedText>
            <TextInput
              style={[styles.input, { minHeight: 60 }]}
              value={difficultyText}
              onChangeText={setDifficultyText}
              placeholder="습관 형성에 어려운 점을 입력해주세요"
              placeholderTextColor={Colors.light.text + '80'}
              multiline
            />
            <Pressable 
              style={({pressed}) => [
                styles.button,
                pressed && styles.buttonPressed
              ]}
              onPress={handleDifficultySubmit}
            >
              <ThemedText style={styles.buttonText}>어려운 점 저장</ThemedText>
            </Pressable>
          </ThemedView>
        </View>

        {renderPreviewSection()}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    flexDirection: 'row',
    padding: 15,
  },
  inputSection: {
    flex: 1,
    marginRight: 15,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    textAlign: 'center',
    marginVertical: 20,
  },
  inputContainer: {
    backgroundColor: Colors.light.background,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.light.text + '10',
  },
  spacing: {
    marginTop: 15,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    color: '#000000',
  },
  subtitle: {
    fontSize: 13,
    color: Colors.light.text + 'CC',
    marginBottom: 8,
  },
  input: {
    width: '100%',
    padding: 12,
    borderRadius: 8,
    backgroundColor: Colors.light.background,
    color: Colors.light.text,
    fontSize: 15,
    borderWidth: 1,
    borderColor: Colors.light.text + '20',
    marginBottom: 10,
    minHeight: 40,
  },
  button: {
    backgroundColor: Colors.light.tint,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  buttonPressed: {
    opacity: 0.8,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold',
  },
  previewContainer: {
    flex: 1,
    backgroundColor: Colors.light.background,
    padding: 15,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.light.text + '10',
  },
  previewTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
    textAlign: 'center',
    color: '#000000',
  },
  previewItem: {
    marginBottom: 15,
    padding: 10,
    backgroundColor: Colors.light.text + '08',
    borderRadius: 8,
  },
  previewLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 5,
    color: '#000000',
  },
  previewText: {
    fontSize: 15,
    color: '#000000',
  },
  finalButton: {
    backgroundColor: Colors.light.tint,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 20,
  },
  finalButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  notificationButton: {
    backgroundColor: Colors.light.tint,
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  buttonDisabled: {
    backgroundColor: Colors.light.text + '40',
  },
  notificationStatus: {
    marginTop: 10,
    textAlign: 'center',
    fontSize: 14,
  },
}); 