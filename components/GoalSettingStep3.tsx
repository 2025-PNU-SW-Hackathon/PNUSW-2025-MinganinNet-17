import { useState } from 'react';
import {
  Alert,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useHabitStore } from '../lib/habitStore';

interface GoalSettingStep3Props {
  onNext?: (difficulty: string) => void;
  onBack?: () => void;
  initialValue?: string;
}

export default function GoalSettingStep3({
  onNext,
  onBack,
  initialValue = ''
}: GoalSettingStep3Props) {
  const [selectedDifficulty, setSelectedDifficulty] = useState(initialValue || '의지 부족');
  const [customDifficulty, setCustomDifficulty] = useState('');
  const [showCustomInput, setShowCustomInput] = useState(initialValue === '기타' || false);
  const { setDifficulty } = useHabitStore();

  const difficultyOptions = [
    { key: '의지 부족', label: '의지 부족' },
    { key: '시간 부족', label: '시간 부족' },
    { key: '자꾸 잊어버림', label: '자꾸 잊어버림' },
    { key: '성과가 보이지 않음', label: '성과가 보이지 않음' },
    { key: '기타', label: '기타 (직접입력)' },
  ];

  const handleDifficultySelect = (difficulty: string) => {
    setSelectedDifficulty(difficulty);
    if (difficulty === '기타') {
      setShowCustomInput(true);
    } else {
      setShowCustomInput(false);
      setCustomDifficulty('');
    }
  };

  const handleNext = () => {
    console.log('🔄 Starting GoalSettingStep3 submission...', { selectedDifficulty, customDifficulty });
    
    let finalDifficulty = selectedDifficulty;
    
    if (selectedDifficulty === '기타') {
      if (!customDifficulty.trim()) {
        Alert.alert('오류', '어려운 점을 직접 입력해주세요.');
        return;
      }
      finalDifficulty = customDifficulty;
    }

    console.log('💾 Final difficulty selected:', finalDifficulty);

    try {
      // Save to habit store
      console.log('🏪 Saving to habit store...');
      setDifficulty(finalDifficulty);
      console.log('✅ Successfully saved to habit store');

      console.log('🚀 Calling onNext handler...');
      if (onNext) {
        onNext(finalDifficulty);
        console.log('✅ onNext called successfully');
      } else {
        console.warn('⚠️ onNext is undefined!');
      }
    } catch (error) {
      console.error('💥 Error in GoalSettingStep3:', error);
      Alert.alert('오류', `오류가 발생했습니다: ${error instanceof Error ? error.message : '알 수 없는 오류'}`);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.stepIndicator}>3 / 5 단계</Text>
      
      {/* Back Button */}
      <TouchableOpacity
        style={styles.backButton}
        onPress={onBack}
      >
        <Text style={styles.backButtonText}>← 이전</Text>
      </TouchableOpacity>
      
      <View style={styles.titleContainer}>
        <Text style={styles.title}>
          어떤 점이 가장{'\n'}어려우셨나요?
        </Text>
      </View>

      <View style={styles.optionsContainer}>
        {difficultyOptions.map((option) => (
          <TouchableOpacity
            key={option.key}
            style={[
              styles.optionButton,
              selectedDifficulty === option.key && styles.optionButtonSelected,
            ]}
            onPress={() => handleDifficultySelect(option.key)}
          >
            <Text
              style={[
                styles.optionButtonText,
                selectedDifficulty === option.key && styles.optionButtonTextSelected,
              ]}
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {showCustomInput && (
        <View style={styles.customInputContainer}>
          <TextInput
            style={styles.customInput}
            value={customDifficulty}
            onChangeText={setCustomDifficulty}
            placeholder="어려운 점을 직접 입력해주세요"
            placeholderTextColor="#a9a9c2"
            multiline
            textAlignVertical="top"
            autoFocus
          />
        </View>
      )}

      <TouchableOpacity
        style={[
          styles.nextButton,
          (selectedDifficulty === '기타' && !customDifficulty.trim()) && styles.nextButtonDisabled
        ]}
        onPress={handleNext}
        disabled={selectedDifficulty === '기타' && !customDifficulty.trim()}
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
  customInputContainer: {
    marginBottom: 40,
  },
  customInput: {
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