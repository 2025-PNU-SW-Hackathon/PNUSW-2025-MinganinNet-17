/**
 * 시간대 문자열을 파싱하여 할 일들을 고르게 분산시키는 유틸리티 함수
 */

/**
 * "19:00-22:00" 형태의 시간대 문자열을 파싱하여 
 * 해당 시간대 내에서 할 일들을 고르게 분산시킨 시간을 반환합니다.
 * 
 * @param availableTime - "HH:MM-HH:MM" 형태의 시간대 문자열 (예: "19:00-22:00")
 * @param index - 할 일의 인덱스 (0부터 시작)
 * @returns "HH:MM" 형태의 시간 문자열
 */
export const parseAvailableTimeToSchedule = (availableTime: string, index: number = 0): string => {
  try {
    // "19:00-22:00" 형태에서 시작시간과 종료시간 추출
    const [startTime, endTime] = availableTime.split('-');
    
    if (!startTime || !endTime) {
      console.warn('시간대 형식이 올바르지 않습니다:', availableTime);
      return "09:00"; // 파싱 실패 시 기본값
    }
    
    // 시작시간과 종료시간을 분 단위로 변환
    const [startHour, startMin] = startTime.split(':').map(Number);
    const [endHour, endMin] = endTime.split(':').map(Number);
    
    const startMinutes = startHour * 60 + startMin;
    const endMinutes = endHour * 60 + endMin;
    const totalDuration = endMinutes - startMinutes;
    
    // 시간대가 유효하지 않은 경우
    if (totalDuration <= 0) {
      console.warn('유효하지 않은 시간대입니다:', availableTime);
      return "09:00";
    }
    
    // 할 일들을 시간대 내에서 고르게 분산 (최소 30분 간격)
    const interval = Math.max(30, Math.floor(totalDuration / 4));
    const offsetMinutes = (index * interval) % totalDuration;
    
    const scheduledMinutes = startMinutes + offsetMinutes;
    const scheduledHour = Math.floor(scheduledMinutes / 60);
    const scheduledMin = scheduledMinutes % 60;
    
    return `${scheduledHour.toString().padStart(2, '0')}:${scheduledMin.toString().padStart(2, '0')}`;
    
  } catch (error) {
    console.error('시간 파싱 중 오류 발생:', availableTime, error);
    return "09:00"; // 에러 발생 시 기본값
  }
};

/**
 * 시간 문자열을 분 단위로 변환하는 헬퍼 함수
 * @param timeString - "HH:MM" 형태의 시간 문자열
 * @returns 분 단위 숫자
 */
export const timeStringToMinutes = (timeString: string): number => {
  const [hour, minute] = timeString.split(':').map(Number);
  return hour * 60 + minute;
};

/**
 * 분 단위 숫자를 시간 문자열로 변환하는 헬퍼 함수
 * @param minutes - 분 단위 숫자
 * @returns "HH:MM" 형태의 시간 문자열
 */
export const minutesToTimeString = (minutes: number): string => {
  const hour = Math.floor(minutes / 60);
  const min = minutes % 60;
  return `${hour.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;
};
