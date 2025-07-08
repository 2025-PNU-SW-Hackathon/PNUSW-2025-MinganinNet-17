import React, { useState } from 'react';
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

const { width } = Dimensions.get('window');

interface GoalSettingStep1Props {
  onNext?: (habitGoal: string) => void;
  onBack?: () => void;
  initialValue?: string;
}

export default function GoalSettingStep1({ 
  onNext, 
  onBack, 
  initialValue = '' 
}: GoalSettingStep1Props) {
  const [habitGoal, setHabitGoal] = useState(initialValue);

  const handleNext = () => {
    if (!habitGoal.trim()) {
      Alert.alert('오류', '습관 목표를 입력해주세요.');
      return;
    }

    if (onNext) {
      onNext(habitGoal);
    } else {
      console.log('Habit goal:', habitGoal);
      Alert.alert('완료', '1단계가 완료되었습니다!');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.stepIndicator}>1 / 4 단계</Text>
      
      <View style={styles.titleContainer}>
        <Text style={styles.title}>
          가장 만들고 싶은{'\n'}좋은 습관은 무엇인가요?
        </Text>
      </View>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.habitInput}
          value={habitGoal}
          onChangeText={setHabitGoal}
          placeholder="예) 매일 아침 10분씩 책 읽기"
          placeholderTextColor="#a9a9c2"
          multiline
          textAlignVertical="top"
          autoFocus
        />
      </View>

      <TouchableOpacity
        style={[styles.nextButton, !habitGoal.trim() && styles.nextButtonDisabled]}
        onPress={handleNext}
        disabled={!habitGoal.trim()}
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
  inputContainer: {
    marginBottom: 160,
  },
  habitInput: {
    backgroundColor: '#3a3a50',
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 20,
    fontSize: 16,
    color: '#ffffff',
    height: 100,
    textAlignVertical: 'top',
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
  nextButtonDisabled: {
    backgroundColor: '#4a47cc',
    opacity: 0.5,
  },
  nextButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    fontFamily: Platform.OS === 'ios' ? 'Inter' : 'Inter',
  },
}); 