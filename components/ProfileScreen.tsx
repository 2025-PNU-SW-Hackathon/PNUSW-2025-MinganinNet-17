import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { useEffect, useState } from 'react';
import { Alert, Platform, SafeAreaView, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { disableAllNotifications, enableAllNotifications, isNotificationsEnabled, sendNotification } from '../backend/notifications/notifications';
import { getCurrentUser, signOut } from '../backend/supabase/auth';
import { getActivePlan } from '../backend/supabase/habits';
import { getCompletedGoalsCount, getConsecutiveCompletionStreak, getThisWeekTodosCompletionRate } from '../backend/supabase/profile';
import { Colors } from '../constants/Colors';
import { useColorScheme } from '../hooks/useColorScheme';

interface ProfileScreenProps {
  onBackToHome?: () => void;
}

export default function ProfileScreen({ onBackToHome }: ProfileScreenProps) {
  const colorScheme = useColorScheme();
  const [streak, setStreak] = useState<number | null>(null);
  const [weeklyRate, setWeeklyRate] = useState<number | null>(null);
  const [completedGoals, setCompletedGoals] = useState<number | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [activePlanTitle, setActivePlanTitle] = useState<string | null>(null);
  const [notificationsEnabled, setNotificationsEnabled] = useState<boolean>(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        // 현재 사용자 이메일 로드
        try {
          const res = await getCurrentUser();
          if (mounted && (res as any)?.user) {
            setUserEmail((res as any).user.email ?? null);
          }
        } catch {}

        const [streakValue, weeklyRateValue, completedGoalsValue, activePlan] = await Promise.all([
          getConsecutiveCompletionStreak(),
          getThisWeekTodosCompletionRate(),
          getCompletedGoalsCount(),
          getActivePlan(),
        ]);
        if (mounted) {
          setStreak(streakValue);
          setWeeklyRate(weeklyRateValue);
          setCompletedGoals(completedGoalsValue);
          setActivePlanTitle(activePlan?.plan_title ?? null);
        }
      } catch (e) {
        if (mounted) {
          setStreak((prev) => (prev ?? 0));
          setWeeklyRate((prev) => (prev ?? 0));
          setCompletedGoals((prev) => (prev ?? 0));
          setActivePlanTitle((prev) => (prev ?? null));
        }
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // 알림 설정 초기 로드
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const enabled = await isNotificationsEnabled();
        if (mounted) setNotificationsEnabled(enabled);
      } catch {}
    })();
    return () => { mounted = false; };
  }, []);

  // 알림 테스트 함수
  const handleNotificationTest = async () => {
    try {
      const result = await sendNotification();
      if (result.success) {
        Alert.alert('테스트 성공', result.message);
      } else {
        Alert.alert('테스트 실패', result.message);
      }
    } catch (error) {
      Alert.alert('오류', '알림 테스트 중 오류가 발생했습니다.');
    }
  };

  // 백그라운드 테스트용 예약 알림 함수
  const handleScheduledNotificationTest = async () => {
    try {
      // 비활성화 시 차단
      const enabled = await isNotificationsEnabled();
      if (!enabled) {
        Alert.alert('알림 비활성화', '알림이 비활성화되어 있어 예약할 수 없습니다.');
        return;
      }

      // AsyncStorage에 알림 상태 저장 (완전 종료 상태 대비)
      await AsyncStorage.setItem('pending_notification', JSON.stringify({
        route: 'report',
        type: 'background_test',
        timestamp: Date.now()
      }));

      const result = await Notifications.scheduleNotificationAsync({
        content: {
          title: '백그라운드 테스트 알림',
          body: '5초 후 알림입니다! 터치해서 Report로 이동하세요 🎯',
          data: { 
            type: 'background_test',
            route: 'report'
          },
        },
        trigger: {
          date: new Date(Date.now() + 5000), // 5초 후
          type: 'date'
        } as Notifications.NotificationTriggerInput,
      });
      
      Alert.alert(
        '예약 완료', 
        '5초 후 알림이 옵니다!\n지금 앱을 백그라운드로 보내고 알림을 기다려주세요.',
        [{ text: '확인' }]
      );
    } catch (error) {
      Alert.alert('오류', '예약 알림 테스트 중 오류가 발생했습니다.');
    }
  };

  // 알림 토글 핸들러
  const handleNotificationToggle = async () => {
    try {
      if (notificationsEnabled) {
        const result = await disableAllNotifications();
        if (!result.success) {
          Alert.alert('오류', result.message ?? '알림 비활성화 중 문제가 발생했습니다.');
          return;
        }
        setNotificationsEnabled(false);
        Alert.alert('알림 비활성화', result.message);
      } else {
        const result = await enableAllNotifications();
        if (!result.success) {
          Alert.alert('오류', result.message ?? '알림 활성화 중 문제가 발생했습니다.');
          return;
        }
        setNotificationsEnabled(true);
        Alert.alert('알림 활성화', result.message);
      }
    } catch (error) {
      Alert.alert('오류', '알림 설정 변경 중 문제가 발생했습니다.');
    }
  };

  // 로그아웃 함수
  const handleLogout = async () => {
    if (Platform.OS === 'web') {
      // 웹용: confirm() 사용
      if (confirm('정말 로그아웃 하시겠습니까?')) {
        try {
          const { error } = await signOut();
          if (error) {
            alert('오류: ' + error.message);
          }
          // 네비게이션은 app/_layout.tsx의 onAuthStateChange에서 자동 처리됨
        } catch (error) {
          alert('오류: 로그아웃 중 문제가 발생했습니다.');
        }
      }
    } else {
      // 모바일용: Alert.alert 사용
      Alert.alert(
        '로그아웃',
        '정말 로그아웃 하시겠습니까?',
        [
          { 
            text: '취소', 
            style: 'cancel' 
          },
          {
            text: '로그아웃',
            onPress: async () => {
              try {
                const { error } = await signOut();
                if (error) {
                  Alert.alert('오류', error.message);
                }
                // 네비게이션은 app/_layout.tsx의 onAuthStateChange에서 자동 처리됨
              } catch (error) {
                Alert.alert('오류', '로그아웃 중 문제가 발생했습니다.');
              }
            }
          }
        ]
      );
    }
  };

  // Profile Header Component
  const ProfileHeader = () => (
    <View style={styles.profileHeader}>
      {/* Back to Home Button */}
      {onBackToHome && (
        <TouchableOpacity 
          style={styles.backButton}
          onPress={onBackToHome}
          activeOpacity={0.7}
        >
          <Text style={[styles.backButtonText, { color: Colors[colorScheme ?? 'light'].text }]}>
            ← 홈으로
          </Text>
        </TouchableOpacity>
      )}
      
      {/* Profile Info */}
      <TouchableOpacity style={styles.profileInfo} activeOpacity={0.7}>
        <View style={[styles.avatar, { backgroundColor: Colors[colorScheme ?? 'light'].tint }]}>
          <Text style={styles.avatarText}>👤</Text>
        </View>
        <View style={styles.profileDetails}>
          <Text style={[styles.profileName, { color: Colors[colorScheme ?? 'light'].text }]}>
            사용자 이름
          </Text>
          <Text style={[styles.profileEmail, { color: Colors[colorScheme ?? 'light'].icon }]}>
            {userEmail ?? '이메일 불러오는 중...'}
          </Text>
        </View>
        <Text style={[styles.chevron, { color: Colors[colorScheme ?? 'light'].icon }]}>
          ›
        </Text>
      </TouchableOpacity>
    </View>
  );

  // Stats Card Component
  const StatsCard = ({ icon, value, label }: { icon: string; value: string; label: string }) => (
    <TouchableOpacity 
      style={[styles.statsCard, { backgroundColor: Colors[colorScheme ?? 'light'].card }]}
      activeOpacity={0.8}
    >
      <Text style={styles.statsIcon}>{icon}</Text>
      <Text style={[styles.statsValue, { color: Colors[colorScheme ?? 'light'].text }]}>
        {value}
      </Text>
      <Text style={[styles.statsLabel, { color: Colors[colorScheme ?? 'light'].icon }]}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  // Quick Access Card Component 현재 활성 목표 포함
  const QuickAccessCard = () => (
    <TouchableOpacity 
      style={[styles.quickAccessCard, { backgroundColor: Colors[colorScheme ?? 'light'].card }]}
      activeOpacity={0.8}
    >
      <View style={styles.quickAccessContent}>
        <Text style={styles.quickAccessIcon}>🎯</Text>
        <Text style={[styles.quickAccessTitle, { color: Colors[colorScheme ?? 'light'].text }]}> {`현재 활성 목표${activePlanTitle ? `: ${activePlanTitle}` : ''}`}</Text>
        <View style={styles.statusBadge}>
          <Text style={styles.statusText}>진행중</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  // Menu Item Component
  const MenuItem = ({ icon, title, onPress, isLast = false }: { icon: string; title: string; onPress?: () => void; isLast?: boolean }) => (
    <TouchableOpacity 
      style={[
        styles.menuItem,
        !isLast && { borderBottomColor: Colors[colorScheme ?? 'light'].icon, borderBottomWidth: 0.3 }
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={styles.menuIcon}>{icon}</Text>
      <Text style={[styles.menuTitle, { color: Colors[colorScheme ?? 'light'].text }]}>
        {title}
      </Text>
      <Text style={[styles.menuChevron, { color: Colors[colorScheme ?? 'light'].icon }]}>
        ›
      </Text>
    </TouchableOpacity>
  );

  // 알림 설정 전용 Row (우측 토글 포함)
  const NotificationSettingsRow = () => (
    <View
      style={[
        styles.menuItem,
        { borderBottomColor: Colors[colorScheme ?? 'light'].icon, borderBottomWidth: 0.3 }
      ]}
    >
      <Text style={styles.menuIcon}>🔔</Text>
      <Text style={[styles.menuTitle, { color: Colors[colorScheme ?? 'light'].text }]}>알림</Text>
      <Switch
        value={notificationsEnabled}
        onValueChange={handleNotificationToggle}
        trackColor={{ false: '#C6C6C8', true: Colors[colorScheme ?? 'light'].tint }}
        thumbColor={Platform.OS === 'android' ? '#ffffff' : undefined}
      />
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: Colors[colorScheme ?? 'light'].background }]}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <ProfileHeader />

        {/* Stats Dashboard */} 
        <View style={styles.statsContainer}>
          <StatsCard icon="🔥" value={streak === null ? '—' : String(streak)} label="일 연속" />
          <StatsCard icon="🎯" value={completedGoals === null ? '—' : String(completedGoals)} label="완료된 목표" />
          <StatsCard icon="📊" value={weeklyRate === null ? '—' : `${weeklyRate}%`} label="이번 주" />
        </View>

        {/* Quick Access Card */}
        <View style={styles.quickAccessContainer}>
          <QuickAccessCard />
        </View>

        {/* Settings Menu */}
        <View style={styles.menuContainer}>
          <MenuItem icon="👤" title="로그 아웃" onPress={handleLogout} />
          <NotificationSettingsRow />
          <MenuItem icon="🧪" title="알림 테스트" onPress={handleNotificationTest} />
          <MenuItem icon="⏰" title="백그라운드 테스트" onPress={handleScheduledNotificationTest} />
          <MenuItem icon="🤖" title="AI 코치" />
          <MenuItem icon="🔒" title="개인정보 보호" />
          <MenuItem icon="❓" title="도움말 및 지원" />
          <MenuItem icon="ℹ️" title="앱 정보" isLast={true} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  
  // Profile Header Styles
  profileHeader: {
    paddingHorizontal: 24,
    paddingTop: 80,
    paddingBottom: 24,
  },
  backButton: {
    alignSelf: 'flex-start',
    marginBottom: 16,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  profileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  avatarText: {
    fontSize: 24,
  },
  profileDetails: {
    flex: 1,
  },
  profileName: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  profileEmail: {
    fontSize: 16,
  },
  chevron: {
    fontSize: 24,
    fontWeight: '300',
  },
  
  // Stats Dashboard Styles
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    marginBottom: 24,
    gap: 12,
  },
  statsCard: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    alignItems: 'center',
    minHeight: 100,
    justifyContent: 'center',
  },
  statsIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  statsValue: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statsLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
  
  // Quick Access Card Styles
  quickAccessContainer: {
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  quickAccessCard: {
    borderRadius: 16,
    padding: 20,
  },
  quickAccessContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  quickAccessIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  quickAccessTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
  },
  statusBadge: {
    backgroundColor: '#4CAF50',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  
  // Menu Styles
  menuContainer: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
  },
  menuIcon: {
    fontSize: 24,
    width: 40,
    textAlign: 'center',
  },
  menuTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 12,
  },
  menuChevron: {
    fontSize: 20,
    fontWeight: '300',
  },
}); 