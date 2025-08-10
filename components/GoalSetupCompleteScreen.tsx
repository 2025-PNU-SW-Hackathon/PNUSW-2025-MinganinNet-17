import React from 'react';
import { SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors } from '../constants/Colors';
import { Spacing } from '../constants/Spacing';
import { useColorScheme } from '../hooks/useColorScheme';

interface GoalSetupCompleteScreenProps {
  onGoHome: () => void;
}

export default function GoalSetupCompleteScreen({ onGoHome }: GoalSetupCompleteScreenProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const styles = createStyles(colors);
  
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

const createStyles = (colors: typeof Colors.light) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.screen.paddingHorizontal,
    justifyContent: 'center',
  },
  celebrationContainer: {
    alignItems: 'center',
    marginBottom: Spacing['7xl'] + Spacing['4xl'], // ~100px
  },
  celebrationEmoji: {
    fontSize: 80,
    marginBottom: Spacing.xl,
    textAlign: 'center',
  },
  title: {
    fontSize: colors.typography.fontSize['3xl'],
    fontWeight: colors.typography.fontWeight.bold,
    color: colors.text,
    textAlign: 'center',
    marginBottom: Spacing['5xl'],
    fontFamily: 'Inter',
  },
  subtitleContainer: {
    alignItems: 'center',
  },
  subtitle: {
    fontSize: colors.typography.fontSize.base,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: colors.typography.fontSize.base * colors.typography.lineHeight.relaxed,
    fontFamily: 'Inter',
  },
  homeButton: {
    backgroundColor: colors.primary,
    borderRadius: Spacing.layout.borderRadius.xl,
    height: Spacing.layout.button.height.lg,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing['5xl'],
    // Enhanced shadow for better visual impact
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: Spacing.sm },
    shadowOpacity: 0.3,
    shadowRadius: Spacing.md,
    elevation: Spacing.layout.elevation.md,
  },
  homeButtonText: {
    fontSize: colors.typography.fontSize.lg,
    fontWeight: colors.typography.fontWeight.bold,
    color: '#ffffff', // Keep white text on primary button
    fontFamily: 'Inter',
  },
}); 