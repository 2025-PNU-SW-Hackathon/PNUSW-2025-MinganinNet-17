import React from 'react';
import { Dimensions, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Colors } from '../constants/Colors';
import { Spacing } from '../constants/Spacing';
import { useColorScheme } from '../hooks/useColorScheme';

const { width, height } = Dimensions.get('window');

interface WelcomeScreenProps {
  onGetStarted?: () => void;
}

export default function WelcomeScreen({ onGetStarted }: WelcomeScreenProps) {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme];
  const styles = createStyles(colors);
  
  const handleGetStarted = () => {
    if (onGetStarted) {
      onGetStarted();
    } else {
      // Default behavior - could navigate to habit setup screen
      console.log('Get started pressed');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.contentContainer}>
        <Text style={styles.welcomeTitle}>
          Routy에 오신 것을 환영해요!
        </Text>
        <Text style={styles.welcomeSubtitle}>
          AI 코치 'Routy'와 함께{'\n'}당신의 목표를 현실로 만들어보세요.
        </Text>
        
        <TouchableOpacity 
          style={styles.getStartedButton}
          onPress={handleGetStarted}
          activeOpacity={0.8}
        >
          <Text style={styles.getStartedButtonText}>
            시작하기
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const createStyles = (colors: typeof Colors.light) => StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentContainer: {
    alignItems: 'center',
    paddingHorizontal: Spacing.screen.paddingHorizontal,
    width: width,
  },
  welcomeTitle: {
    fontSize: colors.typography.fontSize['3xl'],
    fontWeight: colors.typography.fontWeight.bold,
    color: colors.text,
    textAlign: 'center',
    marginBottom: Spacing['3xl'],
    fontFamily: Platform.OS === 'ios' ? 'Inter' : 'Inter',
  },
  welcomeSubtitle: {
    fontSize: colors.typography.fontSize.lg,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: colors.typography.lineHeight.relaxed * colors.typography.fontSize.lg,
    fontFamily: Platform.OS === 'ios' ? 'Inter' : 'Inter',
    marginBottom: Spacing['6xl'],
  },
  getStartedButton: {
    backgroundColor: colors.primary,
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing['6xl'],
    borderRadius: Spacing.layout.borderRadius.md,
    marginTop: Spacing['4xl'],
    elevation: Spacing.layout.elevation.sm,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  getStartedButtonText: {
    color: colors.text,
    fontSize: colors.typography.fontSize.lg,
    fontWeight: colors.typography.fontWeight.semibold,
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'Inter' : 'Inter',
  },
}); 