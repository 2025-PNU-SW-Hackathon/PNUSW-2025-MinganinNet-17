import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// 앱이 포그라운드에 있을 때 알림이 표시되도록 설정
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// 알림 초기화 함수
export const initializeNotifications = async () => {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }
};

// 알림 사용 여부 플래그 조회
export const isNotificationsEnabled = async (): Promise<boolean> => {
  try {
    const value = await AsyncStorage.getItem('notifications_enabled');
    // 저장 값이 없으면 기본적으로 활성화된 것으로 간주
    return value !== 'false';
  } catch {
    return true;
  }
};

// 현재 예약된 알림들을 저장
export const saveScheduledNotifications = async () => {
  try {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    // JSON 직렬화를 위해 Date를 string으로 보존 (getAllScheduledNotificationsAsync의 값은 직렬화 가능하나 안전하게 그대로 저장)
    await AsyncStorage.setItem('saved_notifications', JSON.stringify(scheduled));
    return { success: true, count: scheduled.length };
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : String(error) };
  }
};

// 저장된 알림을 복구 (미래 트리거만)
export const restoreSavedNotifications = async () => {
  try {
    const raw = await AsyncStorage.getItem('saved_notifications');
    if (!raw) {
      return { success: true, restored: 0 };
    }
    const saved: any[] = JSON.parse(raw);
    let restored = 0;
    const now = Date.now(); // 현재 시간을 1970년 1월 1일 00:00:00 UTC 이후 밀리초 단위로 변환

    for (const item of saved) {
      const content = item?.content;
      const trigger: any = item?.trigger;

      if (!content || !trigger) continue;

      // date 트리거만 안전하게 복구
      if (trigger?.type === 'date') {
        let triggerDate: any = trigger?.date; 
        if (typeof triggerDate === 'string' || typeof triggerDate === 'number') { // 문자열 또는 숫자 형식인 경우 날짜 객체로 변환
          triggerDate = new Date(triggerDate).getTime(); // 이후 1970년 1월 1일 00:00:00 UTC 이후 밀리초 단위로 변환
        } else if (triggerDate instanceof Date) {
          triggerDate = triggerDate.getTime();
        }
        if (typeof triggerDate === 'number' && triggerDate > now) { // 현재 시간보다 미래인 경우 알림 예약
          await Notifications.scheduleNotificationAsync({
            // Expo SDK는 identifier를 명시적으로 받지 않을 수 있음. 기존 코드와 호환 위해 존재 시 전달
            identifier: item?.identifier,
            content,
            trigger: { type: 'date', date: new Date(triggerDate) } as Notifications.NotificationTriggerInput,
          } as any);
          restored += 1;
        }
      }
    }

    // 복구 완료 후 저장 데이터는 보존 (원하면 여기서 삭제 가능)
    return { success: true, restored };
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : String(error) };
  }
};

// 모든 알림 비활성화: 예약 저장 후 전체 취소 + 플래그 false
export const disableAllNotifications = async () => {
  try {
    const saveResult = await saveScheduledNotifications();
    if (!saveResult.success) {
      return { success: false, message: saveResult.message ?? '알림 저장 실패' };
    }
    await Notifications.cancelAllScheduledNotificationsAsync();
    await AsyncStorage.setItem('notifications_enabled', 'false'); // pair 처럼 알림 활성화 여부 저장
    return { success: true, message: '모든 알림이 비활성화되었습니다.' };
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : String(error) };
  }
};

// 알림 재활성화: 플래그 true 후 저장된 알림 복구
export const enableAllNotifications = async () => {
  try {
    await AsyncStorage.setItem('notifications_enabled', 'true');
    const restoreResult = await restoreSavedNotifications();
    if (!restoreResult.success) {
      return { success: false, message: restoreResult.message ?? '알림 복구 실패' };
    }
    return { success: true, message: `${restoreResult.restored}개의 알림이 복구되었습니다.` };
  } catch (error) {
    return { success: false, message: error instanceof Error ? error.message : String(error) };
  }
};

// 알림 권한 요청 함수
export const requestNotificationPermission = async () => {
  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }
    
    if (finalStatus !== 'granted') {
      return { success: false, message: '알림 권한이 필요합니다.' };
    }
    
    return { success: true };
  } catch (error) {
    return { success: false, message: '알림 권한 요청 중 오류가 발생했습니다.' };
  }
};

// 알림 전송 함수
export const sendNotification = async () => {
  try {
    // 비활성화 시 생성 차단
    const enabled = await isNotificationsEnabled();
    if (!enabled) {
      return { success: false, message: '알림이 비활성화되어 있습니다.' };
    }

    const permissionResult = await requestNotificationPermission();
    if (!permissionResult.success) {
      return { success: false, message: permissionResult.message };
    }

    const aiResponse = '습관 관리 시간입니다! 지금 바로 시작해보세요. 🎯';
    
    // AsyncStorage에 알림 상태 저장 (완전 종료 상태 대비)
    await AsyncStorage.setItem('pending_notification', JSON.stringify({
      route: 'report',
      type: 'habit_reminder',
      timestamp: Date.now()
    }));
    
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '습관 관리 알림',
        body: aiResponse,
        data: { 
          type: 'habit_reminder',
          route: 'report'
        },
      },
      trigger: null,
    });

    return { success: true, message: '알림이 전송되었습니다!' };
  } catch (error) {
    return { success: false, message: '알림 전송 중 오류가 발생했습니다.' };
  }
};

// 루틴 알림 스케줄링 함수
export const scheduleRoutineReminder = async (routineName: string, routineTime: Date) => {
  try {
    // 비활성화 시 생성 차단
    const enabled = await isNotificationsEnabled();
    if (!enabled) {
      return { success: false, message: '알림이 비활성화되어 있습니다.' };
    }

    const permissionResult = await requestNotificationPermission();
    if (!permissionResult.success) {
      return { success: false, message: permissionResult.message };
    }

    const now = new Date(); //현재시간

    const today = new Date();
    const targetTime = new Date( //루틴시간
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
      routineTime.getHours(),
      routineTime.getMinutes()
    );

    if (targetTime.getTime() <= now.getTime()) { //루틴시간이 현재시간보다 이전이면 하루 뒤로 설정
      targetTime.setDate(targetTime.getDate() + 1);
    }

    const notificationTime = new Date(targetTime.getTime() - 12000); 
    const notificationId = `routine_${routineName.replace(/\s+/g, '_').toLowerCase()}_${Date.now()}`;

    await Notifications.scheduleNotificationAsync({
      identifier: notificationId,
      content: {
        title: `${routineName} 시작!`,
        body: '루틴 시작 시간이 다가왔습니다! 오늘도 힘차게 시작해보세요. 💪',
        data: {
          type: 'routine_reminder',
          routineName,
          scheduledTime: routineTime.toISOString(),
          route: 'report'
        },
        sound: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
        vibrate: [0, 250, 250, 250]
      },
      trigger: {
        date: notificationTime,
        type: 'date'
      } as Notifications.NotificationTriggerInput,
    });

    return { 
      success: true, 
      message: `알림이 ${routineTime.toLocaleTimeString()}에 예약되었습니다!`,
      notificationId,
      scheduledTime: routineTime
    };
  } catch (error) {
    return { 
      success: false, 
      message: '알림 예약 중 오류가 발생했습니다.',
      error: error instanceof Error ? error.message : String(error)
    };
  }
};

// 모든 예약된 알림 초기화 함수
export const clearAllScheduledNotifications = async () => {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
    return { 
      success: true, 
      message: '모든 예약된 알림이 초기화되었습니다.'
    };
  } catch (error) {
    return { 
      success: false, 
      message: '알림 초기화 중 오류가 발생했습니다.',
      error: error instanceof Error ? error.message : String(error)
    };
  }
};
