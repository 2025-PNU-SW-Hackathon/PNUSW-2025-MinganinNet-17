import { HabitEvent } from '../supabase/habits';
import { clearAllScheduledNotifications, scheduleRoutineReminder } from './notifications';

// 시간 문자열(HH:MM-HH:MM)에서 시작 시간을 Date 객체로 변환하는 유틸리티 함수
const parseRoutineTime = (timeString: string): Date => {
  const startTime = timeString.split('-')[0]; // HH:MM 형식의 시작 시간
  const [hours, minutes] = startTime.split(':').map(Number);
  
  const routineTime = new Date();
  routineTime.setHours(hours, minutes, 0, 0);
  
  return routineTime;
};

// 단일 루틴에 대한 알림 스케줄링
export const scheduleHabitRoutineReminder = async (
  habitEvent: HabitEvent
): Promise<{
  success: boolean;
  message: string;
  notificationIds?: string[];
  error?: string;
}> => {
  try {
    const routineTime = parseRoutineTime(habitEvent.time);
    const notificationIds: string[] = [];

    // repeat 일수만큼 알림 스케줄링
    for (let day = 0; day < habitEvent.repeat; day++) {
      const reminderTime = new Date(routineTime);
      reminderTime.setDate(reminderTime.getDate() + day);

      const result = await scheduleRoutineReminder(
        habitEvent.description,
        reminderTime
      );

      if (result.success && result.notificationId) {
        notificationIds.push(result.notificationId);
      } else {
        console.warn(`Day ${day} 알림 스케줄링 실패:`, result.message);
      }
    }

    return {
      success: true,
      message: `${habitEvent.repeat}일 동안의 알림이 성공적으로 예약되었습니다.`,
      notificationIds
    };
  } catch (error) {
    return {
      success: false,
      message: '루틴 알림 예약 중 오류가 발생했습니다.',
      error: error instanceof Error ? error.message : String(error)
    };
  }
};

// 여러 루틴에 대한 알림 스케줄링
export const scheduleAllHabitRoutines = async (
  habitEvents: HabitEvent[]
): Promise<{
  success: boolean;
  message: string;
  results?: Array<{
    description: string;
    success: boolean;
    notificationIds?: string[];
  }>;
  error?: string;
}> => {
  try {
    // 기존 알림 모두 초기화
    await clearAllScheduledNotifications();

    const results = [];
    
    // 각 루틴에 대해 알림 스케줄링
    for (const habitEvent of habitEvents) {
      const result = await scheduleHabitRoutineReminder(habitEvent);
      
      results.push({
        description: habitEvent.description,
        success: result.success,
        notificationIds: result.notificationIds
      });
    }

    const successCount = results.filter(r => r.success).length;
    
    return {
      success: successCount === habitEvents.length,
      message: `${successCount}/${habitEvents.length}개의 루틴 알림이 예약되었습니다.`,
      results
    };
  } catch (error) {
    return {
      success: false,
      message: '루틴 알림 예약 중 오류가 발생했습니다.',
      error: error instanceof Error ? error.message : String(error)
    };
  }
}; 