import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// 앱이 포그라운드에 있을 때 알림이 표시되도록 설정
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
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
    const permissionResult = await requestNotificationPermission();
    if (!permissionResult.success) {
      return { success: false, message: permissionResult.message };
    }

    const aiResponse = '습관 관리 시간입니다! 지금 바로 시작해보세요. 🎯';
    
    await Notifications.scheduleNotificationAsync({
      content: {
        title: '습관 관리 알림',
        body: aiResponse,
        data: { type: 'habit_reminder' },
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
