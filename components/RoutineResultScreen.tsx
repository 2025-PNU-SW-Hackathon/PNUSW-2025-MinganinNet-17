import React, { useState } from 'react';
import {
    Dimensions,
    Platform,
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import AIWarningModal, { AIPersonality } from './AIWarningModal';
import { HabitData } from './HabitSetupScreen';

const { width, height } = Dimensions.get('window');

interface RoutineResultProps {
  habitData: HabitData;
  onStartRoutine?: () => void;
  onEditRoutine?: () => void;
}

export default function RoutineResultScreen({ 
  habitData, 
  onStartRoutine, 
  onEditRoutine 
}: RoutineResultProps) {
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [currentPersonality, setCurrentPersonality] = useState<AIPersonality>('friendly');

  // Mock routine data - in real app, this would come from AI API
  const mockRoutine = {
    routine_name: "나만의 맞춤 루틴",
    activities: [
      { time: "07:00", description: "물 한 잔 마시기 및 스트레칭" },
      { time: "07:15", description: "목표 확인 및 동기부여" },
      { time: "07:30", description: `${habitData.desiredHabit}` },
      { time: "08:00", description: "완료 체크 및 다음 날 계획" },
    ],
    tips: [
      "작은 성취도 기록하여 동기부여를 유지하세요",
      "어려움이 있을 때는 왜 이 습관을 시작했는지 생각해보세요",
      "완벽하지 않아도 괜찮습니다. 꾸준함이 중요해요",
    ]
  };

  const handleDemoWarning = (personality: AIPersonality) => {
    setCurrentPersonality(personality);
    setShowWarningModal(true);
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.contentContainer}>
          <Text style={styles.title}>🎉 루틴이 생성되었습니다!</Text>
          <Text style={styles.subtitle}>
            AI 코치 'Ruti'가 당신만의 맞춤형 루틴을 만들었어요
          </Text>

          <View style={styles.routineContainer}>
            <Text style={styles.routineName}>{mockRoutine.routine_name}</Text>
            
            <View style={styles.activitiesContainer}>
              <Text style={styles.sectionTitle}>📅 일일 활동</Text>
              {mockRoutine.activities.map((activity, index) => (
                <View key={index} style={styles.activityItem}>
                  <Text style={styles.activityTime}>{activity.time}</Text>
                  <Text style={styles.activityDescription}>{activity.description}</Text>
                </View>
              ))}
            </View>

            <View style={styles.tipsContainer}>
              <Text style={styles.sectionTitle}>💡 성공 팁</Text>
              {mockRoutine.tips.map((tip, index) => (
                <View key={index} style={styles.tipItem}>
                  <Text style={styles.tipBullet}>•</Text>
                  <Text style={styles.tipText}>{tip}</Text>
                </View>
              ))}
            </View>

            <View style={styles.restrictedAppsContainer}>
              <Text style={styles.sectionTitle}>🚫 제한된 앱</Text>
              <Text style={styles.restrictedAppsText}>
                {habitData.restrictedApps}
              </Text>
              <Text style={styles.restrictedAppsNote}>
                이 앱들에 접근하면 AI 코치가 알림을 보내드릴게요
              </Text>
              
              <View style={styles.demoContainer}>
                <Text style={styles.demoTitle}>AI 코치 체험하기</Text>
                <View style={styles.demoButtonContainer}>
                  <TouchableOpacity 
                    style={[styles.demoButton, styles.friendlyButton]}
                    onPress={() => handleDemoWarning('friendly')}
                  >
                    <Text style={styles.demoButtonText}>😊 친근한 조언자</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[styles.demoButton, styles.strictButton]}
                    onPress={() => handleDemoWarning('strict')}
                  >
                    <Text style={styles.demoButtonText}>💪 엄격한 코치</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity 
                    style={[styles.demoButton, styles.wittyButton]}
                    onPress={() => handleDemoWarning('witty')}
                  >
                    <Text style={styles.demoButtonText}>😏 재치있는 친구</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>

          <View style={styles.buttonContainer}>
            {onEditRoutine && (
              <TouchableOpacity style={styles.editButton} onPress={onEditRoutine}>
                <Text style={styles.editButtonText}>수정하기</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.startButton} onPress={onStartRoutine}>
              <Text style={styles.startButtonText}>루틴 시작하기</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      <AIWarningModal
        visible={showWarningModal}
        onClose={() => setShowWarningModal(false)}
        appName="YouTube"
        personality={currentPersonality}
        onContinue={() => setShowWarningModal(false)}
      />
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
    fontSize: 28,
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
    marginBottom: 32,
    fontFamily: Platform.OS === 'ios' ? 'Inter' : 'Inter',
  },
  routineContainer: {
    backgroundColor: '#2a2a3e',
    borderRadius: 16,
    padding: 20,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: '#3a3a4e',
  },
  routineName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#6c5ce7',
    textAlign: 'center',
    marginBottom: 24,
    fontFamily: Platform.OS === 'ios' ? 'Inter' : 'Inter',
  },
  activitiesContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 16,
    fontFamily: Platform.OS === 'ios' ? 'Inter' : 'Inter',
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#1c1c2e',
    borderRadius: 8,
  },
  activityTime: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6c5ce7',
    width: 50,
    fontFamily: Platform.OS === 'ios' ? 'Inter' : 'Inter',
  },
  activityDescription: {
    fontSize: 14,
    color: '#ffffff',
    flex: 1,
    marginLeft: 12,
    fontFamily: Platform.OS === 'ios' ? 'Inter' : 'Inter',
  },
  tipsContainer: {
    marginBottom: 24,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  tipBullet: {
    fontSize: 16,
    color: '#6c5ce7',
    marginRight: 8,
    fontFamily: Platform.OS === 'ios' ? 'Inter' : 'Inter',
  },
  tipText: {
    fontSize: 14,
    color: '#a9a9c2',
    flex: 1,
    lineHeight: 20,
    fontFamily: Platform.OS === 'ios' ? 'Inter' : 'Inter',
  },
  restrictedAppsContainer: {
    marginBottom: 8,
  },
  restrictedAppsText: {
    fontSize: 14,
    color: '#ffffff',
    backgroundColor: '#1c1c2e',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    fontFamily: Platform.OS === 'ios' ? 'Inter' : 'Inter',
  },
  restrictedAppsNote: {
    fontSize: 12,
    color: '#a9a9c2',
    fontStyle: 'italic',
    textAlign: 'center',
    marginBottom: 16,
    fontFamily: Platform.OS === 'ios' ? 'Inter' : 'Inter',
  },
  demoContainer: {
    marginTop: 16,
  },
  demoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 12,
    fontFamily: Platform.OS === 'ios' ? 'Inter' : 'Inter',
  },
  demoButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 8,
  },
  demoButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  friendlyButton: {
    backgroundColor: '#4ecdc4',
  },
  strictButton: {
    backgroundColor: '#e17055',
  },
  wittyButton: {
    backgroundColor: '#fdcb6e',
  },
  demoButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#1c1c2e',
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'Inter' : 'Inter',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  editButton: {
    backgroundColor: '#3a3a4e',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    marginRight: 12,
  },
  editButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'Inter' : 'Inter',
  },
  startButton: {
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
  startButtonText: {
    color: '#ffffff',
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    fontFamily: Platform.OS === 'ios' ? 'Inter' : 'Inter',
  },
}); 