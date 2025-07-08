import React from 'react';
import { Dimensions, SafeAreaView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const { width } = Dimensions.get('window');

interface GoalSettingStep4Props {
  goalData: {
    goal: string;
    period: string;
    coachingIntensity: string;
    difficulty: string;
  };
  onComplete: () => void;
  onBack: () => void;
}

export default function GoalSettingStep4({ goalData, onComplete, onBack }: GoalSettingStep4Props) {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.progressText}>4 / 4 단계</Text>
        
        <View style={styles.titleContainer}>
          <Text style={styles.title}>마지막으로</Text>
          <Text style={styles.title}>확인해주세요</Text>
        </View>
        
        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>나의 목표 설정</Text>
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>내 목표</Text>
            <Text style={styles.summaryValue}>{goalData.goal}</Text>
          </View>
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>실천 기간</Text>
            <Text style={styles.summaryValue}>{goalData.period}</Text>
          </View>
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>코칭 강도</Text>
            <Text style={styles.summaryValue}>{goalData.coachingIntensity}</Text>
          </View>
          
          <View style={styles.summaryRow}>
            <Text style={styles.summaryLabel}>어려웠던 점</Text>
            <Text style={styles.summaryValue}>{goalData.difficulty}</Text>
          </View>
        </View>
        
        <Text style={styles.encouragementText}>
          좋은 시작이에요! '{goalData.difficulty}'을 이겨낼 수 있도록 제가 옆에서 든든하게 도와드릴게요. 함께 멋진 여정을 만들어봐요!
        </Text>
        
        <TouchableOpacity style={styles.completeButton} onPress={onComplete}>
          <Text style={styles.completeButtonText}>완료하고 시작하기</Text>
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
    paddingTop: 60,
  },
  progressText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#a9a9c2',
    textAlign: 'center',
    marginBottom: 40,
    fontFamily: 'Inter',
  },
  titleContainer: {
    marginBottom: 80,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'center',
    lineHeight: 40,
    fontFamily: 'Inter',
  },
  summaryCard: {
    backgroundColor: '#3a3a50',
    borderRadius: 20,
    padding: 24,
    marginBottom: 40,
    minHeight: 200,
  },
  summaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    marginBottom: 24,
    fontFamily: 'Inter',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  summaryLabel: {
    fontSize: 14,
    color: '#a9a9c2',
    fontFamily: 'Inter',
  },
  summaryValue: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#ffffff',
    textAlign: 'right',
    flex: 1,
    marginLeft: 20,
    fontFamily: 'Inter',
  },
  encouragementText: {
    fontSize: 14,
    color: '#ffffff',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 40,
    paddingHorizontal: 8,
    fontFamily: 'Inter',
  },
  completeButton: {
    backgroundColor: '#6c63ff',
    borderRadius: 28,
    height: 56,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 40,
  },
  completeButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ffffff',
    fontFamily: 'Inter',
  },
}); 