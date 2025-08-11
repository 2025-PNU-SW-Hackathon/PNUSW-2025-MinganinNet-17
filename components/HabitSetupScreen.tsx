import React, { useState } from 'react';
import {
    Alert,
    Dimensions,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';

const { width, height } = Dimensions.get('window');

interface HabitSetupProps {
  onSetupComplete?: (habitData: HabitData) => void;
  onBack?: () => void;
}

export interface HabitData {
  desiredHabit: string;
  availableTime: string;
  difficulties: string;
  restrictedApps: string;
}

export default function HabitSetupScreen({ onSetupComplete, onBack }: HabitSetupProps) {
  const [formData, setFormData] = useState<HabitData>({
    desiredHabit: '',
    availableTime: '',
    difficulties: '',
    restrictedApps: '',
  });

  const handleInputChange = (field: keyof HabitData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = () => {
    // Validate form
    if (!formData.desiredHabit.trim()) {
      Alert.alert('오류', '목표하는 습관을 입력해주세요.');
      return;
    }
    if (!formData.availableTime.trim()) {
      Alert.alert('오류', '이용 가능한 시간을 입력해주세요.');
      return;
    }
    if (!formData.difficulties.trim()) {
      Alert.alert('오류', '습관 형성의 어려움을 입력해주세요.');
      return;
    }
    if (!formData.restrictedApps.trim()) {
      Alert.alert('오류', '제한할 앱을 입력해주세요.');
      return;
    }

    if (onSetupComplete) {
      onSetupComplete(formData);
    } else {
      console.log('Habit setup completed:', formData);
      Alert.alert('완료', '습관 설정이 완료되었습니다!');
    }
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.contentContainer}>
          <Text style={styles.title}>습관 설정</Text>
          <Text style={styles.subtitle}>
            AI 코치 &apos;Routy&apos;가 당신만의 맞춤형 루틴을 만들어드릴게요
          </Text>

          <View style={styles.formContainer}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>목표하는 습관</Text>
              <TextInput
                style={styles.textInput}
                value={formData.desiredHabit}
                onChangeText={(value) => handleInputChange('desiredHabit', value)}
                placeholder="예: 매일 아침 30분 운동하기"
                placeholderTextColor="#666"
                multiline
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>이용 가능한 시간</Text>
              <TextInput
                style={styles.textInput}
                value={formData.availableTime}
                onChangeText={(value) => handleInputChange('availableTime', value)}
                placeholder="예: 오전 7시-8시, 퇴근 후 1시간"
                placeholderTextColor="#666"
                multiline
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>습관 형성의 어려움</Text>
              <TextInput
                style={styles.textInput}
                value={formData.difficulties}
                onChangeText={(value) => handleInputChange('difficulties', value)}
                placeholder="예: 일관성 유지의 어려움, 운동 후 피로감, 집중력 부족"
                placeholderTextColor="#666"
                multiline
              />
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>제한할 앱</Text>
              <TextInput
                style={styles.textInput}
                value={formData.restrictedApps}
                onChangeText={(value) => handleInputChange('restrictedApps', value)}
                placeholder="예: YouTube, Instagram, TikTok"
                placeholderTextColor="#666"
                multiline
              />
            </View>
          </View>

          <View style={styles.buttonContainer}>
            {onBack && (
              <TouchableOpacity style={styles.backButton} onPress={onBack}>
                <Text style={styles.backButtonText}>이전</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
              <Text style={styles.submitButtonText}>루틴 생성하기</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1c1c2e',
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 24,
    paddingTop: 60,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 12,
    fontFamily: Platform.OS === 'ios' ? 'Inter' : 'Inter',
  },
  subtitle: {
    fontSize: 16,
    color: '#a9a9c2',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 40,
    fontFamily: Platform.OS === 'ios' ? 'Inter' : 'Inter',
  },
  formContainer: {
    marginBottom: 40,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 8,
    fontFamily: Platform.OS === 'ios' ? 'Inter' : 'Inter',
  },
  textInput: {
    backgroundColor: '#2a2a3e',
    borderRadius: 12,
    padding: 16,
    color: '#ffffff',
    fontSize: 16,
    minHeight: 80,
    textAlignVertical: 'top',
    fontFamily: Platform.OS === 'ios' ? 'Inter' : 'Inter',
    borderWidth: 1,
    borderColor: '#3a3a4e',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  backButton: {
    backgroundColor: '#3a3a4e',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginRight: 12,
  },
  backButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'Inter' : 'Inter',
  },
  submitButton: {
    backgroundColor: '#6c5ce7',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    flex: 1,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  submitButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'Inter' : 'Inter',
  },
}); 