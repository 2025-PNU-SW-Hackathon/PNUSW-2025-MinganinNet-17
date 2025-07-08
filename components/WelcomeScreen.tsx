import React from 'react';
import { Dimensions, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const { width, height } = Dimensions.get('window');

interface WelcomeScreenProps {
  onGetStarted?: () => void;
}

export default function WelcomeScreen({ onGetStarted }: WelcomeScreenProps) {
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
          AI 코치 'Ruti'와 함께{'\n'}당신의 목표를 현실로 만들어보세요.
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1c1c2e',
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentContainer: {
    alignItems: 'center',
    paddingHorizontal: 24,
    width: width,
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 24,
    fontFamily: Platform.OS === 'ios' ? 'Inter' : 'Inter',
  },
  welcomeSubtitle: {
    fontSize: 18,
    color: '#a9a9c2',
    textAlign: 'center',
    lineHeight: 26,
    fontFamily: Platform.OS === 'ios' ? 'Inter' : 'Inter',
    marginBottom: 48,
  },
  getStartedButton: {
    backgroundColor: '#6c5ce7',
    paddingVertical: 16,
    paddingHorizontal: 48,
    borderRadius: 12,
    marginTop: 32,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  getStartedButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'Inter' : 'Inter',
  },
}); 