import React, { useState } from 'react';
import { Dimensions, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const { width } = Dimensions.get('window');

interface GoalSettingStep3Props {
  onContinue: (intensity: string) => void;
  onBack: () => void;
}

export default function GoalSettingStep3({ onContinue, onBack }: GoalSettingStep3Props) {
  const [selectedIntensity, setSelectedIntensity] = useState<string>('보통');

  const intensityOptions = [
    { id: '낮음', label: '낮음' },
    { id: '보통', label: '보통' },
    { id: '높음', label: '높음' }
  ];

  const handleIntensitySelect = (intensity: string) => {
    setSelectedIntensity(intensity);
    // Auto-continue after selection
    setTimeout(() => {
      onContinue(intensity);
    }, 300);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>코칭 강도를 선택해주세요</Text>
        <Text style={styles.subtitle}>Routy가 당신을 어떻게 도와드릴지 알려주세요.</Text>
        
        <View style={styles.optionsContainer}>
          {intensityOptions.map((option) => (
            <TouchableOpacity
              key={option.id}
              style={[
                styles.optionCard,
                selectedIntensity === option.id && styles.selectedCard
              ]}
              onPress={() => handleIntensitySelect(option.id)}
            >
              <Text style={styles.optionText}>{option.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1c1c2e',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 16,
    fontFamily: 'Inter',
  },
  subtitle: {
    fontSize: 16,
    color: '#a9a9c2',
    textAlign: 'center',
    marginBottom: 60,
    fontFamily: 'Inter',
  },
  optionsContainer: {
    gap: 20,
  },
  optionCard: {
    backgroundColor: '#3a3a50',
    borderRadius: 16,
    height: 110,
    justifyContent: 'center',
    paddingHorizontal: 20,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedCard: {
    borderColor: '#6c63ff',
  },
  optionText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    fontFamily: 'Inter',
  },
}); 