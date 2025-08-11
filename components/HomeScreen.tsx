import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useEffect, useRef, useState, useMemo } from 'react';
import {
  Alert,
  Animated,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import CalendarScreen from '../backend/calendar/calendar';
import { generateDailyFeedback, parsePlanModificationCommand } from '../backend/hwirang/gemini';
import { getActivePlan } from '../backend/supabase/habits';
import { createReport } from '../backend/supabase/reports';
import { useHabitStore } from '../lib/habitStore';
import { DailyTodo } from '../types/habit';
import ProfileScreen from './ProfileScreen';
import { SkeletonCard, SkeletonText, SkeletonTodoList } from './SkeletonLoaders';
import VoiceChatScreen from './VoiceChatScreen';

const parseDurationToDays = (duration: string): number => {
  if (duration.includes('개월')) {
    const months = parseInt(duration.replace('개월', '').trim(), 10);
    return isNaN(months) ? 0 : months * 30;
  }
  if (duration.includes('주')) {
    const weeks = parseInt(duration.replace('주', '').trim(), 10);
    return isNaN(weeks) ? 0 : weeks * 7;
  }
  if (duration.includes('일')) {
    const days = parseInt(duration.replace('일', '').trim(), 10);
    return isNaN(days) ? 0 : days;
  }
  return 0;
};

interface HomeScreenProps {
  selectedDate?: string;
}

interface CoachStatus {
  emoji: string;
  message: string;
  color: string;
}

interface AnimatedTodoItemProps {
  todo: DailyTodo;
  isCompleted: boolean;
  onToggle: () => void;
}

const AnimatedTodoItem = ({ todo, isCompleted, onToggle }: AnimatedTodoItemProps) => {
  const scaleAnimation = useRef(new Animated.Value(1)).current;
  const checkmarkScale = useRef(new Animated.Value(isCompleted ? 1 : 0)).current;
  const textOpacity = useRef(new Animated.Value(isCompleted ? 0.6 : 1)).current;

  const handlePress = () => {
    Animated.sequence([
      Animated.spring(scaleAnimation, { toValue: 1.05, useNativeDriver: true, tension: 300, friction: 8 }),
      Animated.spring(scaleAnimation, { toValue: 1, useNativeDriver: true, tension: 300, friction: 8 })
    ]).start();

    if (!isCompleted) {
      Animated.parallel([
        Animated.spring(checkmarkScale, { toValue: 1, useNativeDriver: true, tension: 300, friction: 6 }),
        Animated.timing(textOpacity, { toValue: 0.6, duration: 200, useNativeDriver: true })
      ]).start();
    } else {
      Animated.parallel([
        Animated.spring(checkmarkScale, { toValue: 0, useNativeDriver: true, tension: 300, friction: 6 }),
        Animated.timing(textOpacity, { toValue: 1, duration: 200, useNativeDriver: true })
      ]).start();
    }
    onToggle();
  };

  return (
    <Animated.View style={[{ transform: [{ scale: scaleAnimation }] }]}>
      <TouchableOpacity style={styles.todoItem} onPress={handlePress} activeOpacity={0.8}>
        <View style={[styles.todoCheckbox, isCompleted && styles.todoCheckedBox]}>
          <Animated.Text style={[styles.checkmarkText, { transform: [{ scale: checkmarkScale }], opacity: checkmarkScale }]}>✓</Animated.Text>
        </View>
        <Animated.Text style={[styles.todoText, isCompleted && styles.todoTextCompleted, { opacity: textOpacity }]} numberOfLines={2} ellipsizeMode="tail">
          {todo.description}
        </Animated.Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

export default function HomeScreen({ selectedDate }: HomeScreenProps) {
  const router = useRouter();
  const [currentScreen, setCurrentScreen] = useState<'home' | 'settings'>('home');
  const [internalSelectedDate, setInternalSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const { plan, setPlan } = useHabitStore();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [todoCompletion, setTodoCompletion] = useState<{ [key: string]: boolean }>({});
  const [effectiveStartDate, setEffectiveStartDate] = useState<string | null>(null);
  const [calendarVisible, setCalendarVisible] = useState(false);
  const [voiceChatVisible, setVoiceChatVisible] = useState(false);
  const [reportVoiceChatVisible, setReportVoiceChatVisible] = useState(false);

  const targetDate = selectedDate || internalSelectedDate;
  const coachScaleAnimation = useRef(new Animated.Value(1)).current;
  const [previousCoachStatus, setPreviousCoachStatus] = useState<CoachStatus | null>(null);
  const goalFadeAnimation = useRef(new Animated.Value(0)).current;
  const todoFadeAnimation = useRef(new Animated.Value(0)).current;
  const coachFadeAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const fetchPlan = async () => {
      try {
        setLoading(true);
        const fetchedPlan = await getActivePlan();
        if (fetchedPlan) {
          setPlan(fetchedPlan);
          setEffectiveStartDate(fetchedPlan.start_date);
          const initialCompletion: { [key: string]: boolean } = {};
          fetchedPlan.milestones.forEach(m => {
            m.daily_todos.forEach(todo => {
              initialCompletion[todo.id.toString()] = todo.is_completed;
            });
          });
          setTodoCompletion(initialCompletion);
        } else {
          router.replace('/goal-setting');
        }
      } catch (e) {
        setError('Failed to fetch habit plan.');
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    if (!plan) {
        fetchPlan();
    }
  }, [plan, router]);

  const getCoachStatus = (): CoachStatus => {
    const todos = getTodosForSelectedDate();
    if (!plan || todos.length === 0) {
      return { emoji: '😊', message: '오늘도 화이팅!', color: '#4CAF50' };
    }
    const completedCount = todos.filter(todo => todoCompletion[todo.id.toString()]).length;
    const avgRate = completedCount / todos.length;
    if (avgRate >= 1) return { emoji: '🥳', message: '완벽한 하루!', color: '#4CAF50' };
    if (avgRate >= 0.7) return { emoji: '😊', message: '정말 잘하고 있어요!', color: '#8BC34A' };
    if (avgRate >= 0.5) return { emoji: '😌', message: '꾸준히 실천 중이네요', color: '#FFC107' };
    if (avgRate > 0) return { emoji: '😐', message: '조금만 더 힘내요!', color: '#FF9800' };
    return { emoji: '🤔', message: '시작이 반이에요!', color: '#9E9E9E' };
  };

  const getGreeting = (): string => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning.';
    if (hour < 18) return 'Good afternoon.';
    return 'Good evening.';
  };

  const getCalendarDates = (): Date[] => {
    const dates: Date[] = [];
    const today = new Date();
    for (let i = -3; i <= 3; i++) {
      const date = new Date(today);
      date.setDate(today.getDate() + i);
      dates.push(date);
    }
    return dates;
  };

  const getTodosForSelectedDate = (): DailyTodo[] => {
    if (!plan || !effectiveStartDate) return [];
    const selected = new Date(targetDate);
    const startDate = new Date(effectiveStartDate);
    if (selected < startDate) return [];
    const diffDays = Math.floor((selected.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    let dayCounter = 0;
    for (const milestone of plan.milestones) {
      const durationInDays = parseDurationToDays(milestone.duration);
      if (diffDays >= dayCounter && diffDays < dayCounter + durationInDays) {
        return milestone.daily_todos;
      }
      dayCounter += durationInDays;
    }
    return [];
  };

  const handleTodoToggle = (todoId: number): void => {
    const todoKey = todoId.toString();
    const willBeCompleted = !todoCompletion[todoKey];
    if (willBeCompleted) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
    setTodoCompletion(prev => ({ ...prev, [todoKey]: !prev[todoKey] }));
  };
  
  const formatCalendarDate = (date: Date) => {
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return { dayName: days[date.getDay()], dayNumber: date.getDate().toString().padStart(2, '0'), isToday: date.toDateString() === new Date().toDateString(), dateString: date.toISOString().split('T')[0] };
  };

  const handleCalendarDatePress = (dateString: string): void => setInternalSelectedDate(dateString);
  const handleVoiceChatOpen = (): void => { setVoiceChatVisible(true); Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); };
  const handleVoiceChatClose = (): void => setVoiceChatVisible(false);

  const handleReportCreationComplete = async (data: any) => {
    setReportVoiceChatVisible(false);
    if (!data || !data.transcript) {
      Alert.alert('오류', '리포트 내용을 인식하지 못했습니다.');
      return;
    }
    try {
      const userSummary = data.transcript.split('\n').pop() || '';
      const today = new Date();
      const todayTodos = getTodosForSelectedDate();
      const completedCount = todayTodos.filter(t => todoCompletion[t.id.toString()]).length;
      const achievementScore = todayTodos.length > 0 ? Math.round((completedCount / todayTodos.length) * 10) : 0;
      const feedback = await generateDailyFeedback(userSummary, achievementScore, todayTodos);
      await createReport({ report_date: today.toISOString().split('T')[0], achievement_score: achievementScore, ai_coach_feedback: [feedback], daily_activities: { todos: todayTodos }, user_summary: userSummary });
      Alert.alert('성공', '오늘의 리포트가 성공적으로 생성되었습니다.');
    } catch (error) {
      console.error('Error creating report:', error);
      Alert.alert('오류', '리포트 생성 중 오류가 발생했습니다.');
    }
  };

  const handleVoiceCommand = async (data: any) => {
    setVoiceChatVisible(false);
    
    // action 필드 확인하여 처리
    if (data && data.action === 'PLAN_COMPLETE_GO_HOME') {
      // 홈화면 모드 완료 - 홈화면으로 돌아가기
      console.log('✅ Plan mode completed, staying on home screen');
      Alert.alert('완료', '음성 명령이 처리되었습니다.');
      return;
    }
    
    if (!data || !data.transcript) {
      Alert.alert('오류', '음성 명령을 인식하지 못했습니다.');
      return;
    }
    try {
      const command = await parsePlanModificationCommand(data.transcript);
      if (!command || command.action === 'unknown') {
        Alert.alert('알 수 없는 명령', '이해하지 못했습니다. 다시 말씀해주세요.');
        return;
      }
      if (command.action === 'create_report') {
        setReportVoiceChatVisible(true);
        return;
      }
      if (!plan) {
        Alert.alert('오류', '수정할 계획이 없습니다.');
        return;
      }
      let newPlan = JSON.parse(JSON.stringify(plan));
      switch (command.action) {
        case 'add_todo':
          if (newPlan.milestones && newPlan.milestones.length > 0) {
            const newTodo: DailyTodo = { id: `new-todo-${Date.now()}`, description: command.payload.description, is_completed: false };
            newPlan.milestones[0].daily_todos.push(newTodo);
            setPlan(newPlan);
            Alert.alert('성공', `'${command.payload.description}' 할 일이 추가되었습니다.`);
          } else {
            Alert.alert('오류', '할 일을 추가할 마일스톤이 없습니다.');
          }
          break;
        case 'complete_todo':
          let todoFound = false;
          for (const milestone of newPlan.milestones) {
            const todo = milestone.daily_todos.find(t => t.description.includes(command.payload.description));
            if (todo) { todo.is_completed = true; todoFound = true; break; }
          }
          if (todoFound) {
            setPlan(newPlan);
            Alert.alert('성공', `'${command.payload.description}' 할 일을 완료했습니다.`);
          } else {
            Alert.alert('오류', `'${command.payload.description}' 할 일을 찾지 못했습니다.`);
          }
          break;
        default: Alert.alert('알 수 없는 명령', '지원하지 않는 명령입니다.'); break;
      }
    } catch (error) {
      console.error('Error processing voice command:', error);
      Alert.alert('오류', '음성 명령 처리 중 오류가 발생했습니다.');
    }
  };

  const coachStatus = useMemo(() => getCoachStatus(), [plan, todoCompletion, targetDate]);
  const calendarDates = useMemo(() => getCalendarDates(), []);
  const todosForSelectedDate = useMemo(() => getTodosForSelectedDate(), [plan, effectiveStartDate, targetDate]);

  useEffect(() => {
    if (previousCoachStatus && previousCoachStatus.emoji !== coachStatus.emoji) {
      Animated.sequence([
        Animated.spring(coachScaleAnimation, { toValue: 1.2, useNativeDriver: true, tension: 300, friction: 8 }),
        Animated.spring(coachScaleAnimation, { toValue: 1, useNativeDriver: true, tension: 300, friction: 8 })
      ]).start();
    }
    setPreviousCoachStatus(coachStatus);
  }, [coachStatus.emoji, previousCoachStatus?.emoji]);

  useEffect(() => {
    if (!loading) {
      Animated.stagger(150, [
        Animated.timing(goalFadeAnimation, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.timing(coachFadeAnimation, { toValue: 1, duration: 600, useNativeDriver: true }),
        Animated.timing(todoFadeAnimation, { toValue: 1, duration: 600, useNativeDriver: true }),
      ]).start();
    }
  }, [loading]);

  if (currentScreen === 'settings') {
    return <ProfileScreen onBackToHome={() => setCurrentScreen('home')} />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.headerArea}>
          <View style={styles.profileHeader}>
            <View style={styles.logoContainer}><Text style={styles.logoText}>🌱</Text></View>
            <TouchableOpacity style={styles.profileButton} onPress={() => setCurrentScreen('settings')}><View style={styles.profileIcon}><Text style={styles.profileIconText}>👤</Text></View></TouchableOpacity>
          </View>
          <Text style={styles.greetingText}>{getGreeting()}</Text>
          {loading ? (
            <View style={styles.goalLoadingContainer}><SkeletonText width="90%" height={18} style={styles.goalSkeletonLine1} /><SkeletonText width="60%" height={18} style={styles.goalSkeletonLine2} /></View>
          ) : (
            <Animated.View style={{ opacity: goalFadeAnimation }}><Text style={styles.goalText}>{plan?.plan_title || '진행 중인 목표가 없습니다.'}</Text></Animated.View>
          )}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.calendarScroll} contentContainerStyle={styles.calendarContainer}>
            {calendarDates.map((date, index) => {
              const dateInfo = formatCalendarDate(date);
              const isSelected = targetDate === dateInfo.dateString;
              return (
                <TouchableOpacity key={index} style={[styles.calendarDate, dateInfo.isToday && styles.calendarDateToday, isSelected && styles.calendarDateSelected]} onPress={() => handleCalendarDatePress(dateInfo.dateString)}>
                  <Text style={styles.calendarDayName}>{dateInfo.dayName}</Text>
                  <Text style={[styles.calendarDayNumber, (dateInfo.isToday || isSelected) && styles.calendarTextActive]}>{dateInfo.dayNumber}</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
        <View style={styles.mainContent}>
          {loading ? <SkeletonCard type="coach" /> : (
            <Animated.View style={[styles.coachCard, { opacity: coachFadeAnimation }]}>
              <Text style={styles.cardTitle}>Coach&apos;s Status</Text>
              <View style={styles.coachContent}>
                <Animated.View style={{ transform: [{ scale: coachScaleAnimation }] }}><Text style={styles.coachEmoji}>{coachStatus.emoji}</Text></Animated.View>
                <Text style={styles.coachMessage}>{coachStatus.message}</Text>
                <View style={[styles.coachIndicator, { backgroundColor: coachStatus.color }]} />
              </View>
            </Animated.View>
          )}
          <View style={styles.todoCard}>
            <Text style={styles.cardTitle}>Today&apos;s To-Do</Text>
            <ScrollView style={styles.todoScrollView} showsVerticalScrollIndicator={false}>
              {loading ? <SkeletonTodoList count={3} /> : error ? <Text style={styles.emptyTodoText}>{error}</Text> : todosForSelectedDate.length > 0 ? (
                <Animated.View style={{ opacity: todoFadeAnimation }}>
                  {todosForSelectedDate.map((todo) => {
                    const todoKey = todo.id.toString();
                    const isCompleted = todoCompletion[todoKey];
                    return <AnimatedTodoItem key={todo.id} todo={todo} isCompleted={isCompleted} onToggle={() => handleTodoToggle(todo.id)} />;
                  })}
                </Animated.View>
              ) : (
                <Animated.View style={[styles.emptyTodoContainer, { opacity: todoFadeAnimation }]}><Text style={styles.emptyTodoText}>오늘의 할 일이 없습니다.</Text></Animated.View>
              )}
            </ScrollView>
          </View>
        </View>
      </ScrollView>

      <TouchableOpacity style={styles.floatingVoiceButton} onPress={handleVoiceChatOpen} activeOpacity={0.8}>
        <Text style={styles.voiceButtonIcon}>🎤</Text>
      </TouchableOpacity>

      {voiceChatVisible && (
          <VoiceChatScreen visible={voiceChatVisible} mode="plan" onClose={handleVoiceChatClose} onComplete={handleVoiceCommand} />
      )}
      {reportVoiceChatVisible && (
          <VoiceChatScreen visible={reportVoiceChatVisible} mode="report" onClose={() => setReportVoiceChatVisible(false)} onComplete={handleReportCreationComplete} />
      )}

      <Modal visible={calendarVisible} transparent={true} animationType="fade" onRequestClose={() => setCalendarVisible(false)}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <CalendarScreen />
            <TouchableOpacity style={styles.closeButton} onPress={() => setCalendarVisible(false)}><Text style={styles.closeButtonText}>닫기</Text></TouchableOpacity>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1c1c2e' },
  scrollView: { flex: 1 },
  headerArea: { paddingHorizontal: 24, paddingTop: 40, paddingBottom: 20 },
  profileHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  logoContainer: { flexDirection: 'row', alignItems: 'center' },
  logoText: { fontSize: 36, color: '#6c63ff', fontWeight: 'bold' },
  profileButton: { padding: 8 },
  profileIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#3a3a50', justifyContent: 'center', alignItems: 'center' },
  profileIconText: { fontSize: 24, color: '#a9a9c2' },
  greetingText: { fontSize: 24, fontWeight: 'bold', color: '#ffffff', marginBottom: 10, fontFamily: 'Inter' },
  goalText: { fontSize: 18, fontWeight: '600', color: '#a9a9c2', marginBottom: 20, fontFamily: 'Inter' },
  calendarScroll: { marginTop: 10 },
  calendarContainer: { paddingHorizontal: 10 },
  calendarDate: { width: 60, height: 80, borderRadius: 12, backgroundColor: '#3a3a50', justifyContent: 'center', alignItems: 'center', marginHorizontal: 5, paddingVertical: 10 },
  calendarDateToday: { backgroundColor: '#6c63ff' },
  calendarDateSelected: { borderWidth: 2, borderColor: '#6c63ff' },
  calendarDayName: { fontSize: 12, color: '#a9a9c2', fontFamily: 'Inter' },
  calendarDayNumber: { fontSize: 20, fontWeight: 'bold', color: '#ffffff', fontFamily: 'Inter' },
  calendarTextActive: { color: '#ffffff' },
  mainContent: { flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 24, paddingBottom: 40 },
  coachCard: { flex: 1, backgroundColor: '#3a3a50', borderRadius: 16, padding: 20, marginRight: 10 },
  cardTitle: { fontSize: 18, fontWeight: 'bold', color: '#ffffff', marginBottom: 15, fontFamily: 'Inter' },
  coachContent: { alignItems: 'center', justifyContent: 'center', flex: 1 },
  coachEmoji: { fontSize: 100, marginBottom: 10 },
  coachMessage: { fontSize: 16, color: '#a9a9c2', textAlign: 'center', marginBottom: 10, fontFamily: 'Inter' },
  coachIndicator: { width: 60, height: 8, borderRadius: 4 },
  todoCard: { flex: 1, backgroundColor: '#3a3a50', borderRadius: 16, padding: 20, marginLeft: 10, minHeight: 250 },
  todoScrollView: { flex: 1 },
  todoItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#4a4a60' },
  todoCheckbox: { width: 16, height: 16, borderRadius: 4, borderWidth: 2, borderColor: '#a9a9c2', marginRight: 10, justifyContent: 'center', alignItems: 'center' },
  todoCheckedBox: { backgroundColor: '#6c63ff', borderColor: '#6c63ff' },
  checkmarkText: { color: '#ffffff', fontSize: 10, fontWeight: 'bold' },
  todoText: { fontSize: 14, fontWeight: '500', color: '#ffffff', flex: 1, fontFamily: 'Inter' },
  todoTextCompleted: { textDecorationLine: 'line-through', color: '#a9a9c2' },
  emptyTodoContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyTodoText: { fontSize: 14, color: '#a9a9c2', fontFamily: 'Inter' },
  modalContainer: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#1c1c2e', borderRadius: 20, padding: 20, elevation: 5, minWidth: 350, maxWidth: '90%', maxHeight: '90%' },
  closeButton: { marginTop: 16, alignSelf: 'center', paddingVertical: 8, paddingHorizontal: 20, backgroundColor: '#6c63ff', borderRadius: 20 },
  closeButtonText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
  goalLoadingContainer: { marginBottom: 20 },
  goalSkeletonLine1: { marginBottom: 8 },
  goalSkeletonLine2: { marginBottom: 0 },
  floatingVoiceButton: { position: 'absolute', bottom: 100, right: 24, width: 64, height: 64, borderRadius: 32, backgroundColor: '#6c63ff', justifyContent: 'center', alignItems: 'center', shadowColor: '#6c63ff', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.4, shadowRadius: 12, elevation: 12 },
  voiceButtonIcon: { fontSize: 28, textAlign: 'center', lineHeight: 28 }
}) 
