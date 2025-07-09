import React from 'react';
import { SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

interface GoalSetupCompleteScreenProps {
  onGoHome: () => void;
}

export default function GoalSetupCompleteScreen({ onGoHome }: GoalSetupCompleteScreenProps) {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <View style={styles.celebrationContainer}>
          <Text style={styles.celebrationEmoji}>🎉</Text>
          <Text style={styles.title}>목표 설정 완료!</Text>
          <View style={styles.subtitleContainer}>
            <Text style={styles.subtitle}>Routi와 함께하는 멋진 여정이</Text>
            <Text style={styles.subtitle}>이제 곧 시작됩니다. 준비되셨나요?</Text>
          </View>
        </View>
        
        <TouchableOpacity style={styles.homeButton} onPress={onGoHome}>
          <Text style={styles.homeButtonText}>홈으로 가서 시작하기</Text>
        </TouchableOpacity>
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
    justifyContent: 'center',
  },
  celebrationContainer: {
    alignItems: 'center',
    marginBottom: 100,
  },
  celebrationEmoji: {
    fontSize: 80,
    marginBottom: 20,
    textAlign: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 40,
    fontFamily: 'Inter',
  },
  subtitleContainer: {
    alignItems: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#a9a9c2',
    textAlign: 'center',
    lineHeight: 24,
    fontFamily: 'Inter',
  },
  homeButton: {
    backgroundColor: '#6c63ff',
    borderRadius: 28,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
  },
  homeButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    fontFamily: 'Inter',
  },
}); 