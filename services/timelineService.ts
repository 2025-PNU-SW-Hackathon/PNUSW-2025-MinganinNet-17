/**
 * 타임라인 관련 비즈니스 로직을 처리하는 서비스
 * DB 조회와 데이터 변환을 조합하여 UI에서 사용할 수 있는 완성된 데이터를 제공
 */

import { supabase } from '../backend/supabase/client';
import { getTimelineEventsForDate } from '../backend/supabase/habits';
import { convertAndSortTimelineEvents, debugTimelineEvents, TimelineEvent } from '../utils/timelineConverter';

/**
 * 특정 날짜의 타임라인 이벤트를 완전히 처리된 형태로 가져옵니다.
 * 사용자 인증, DB 조회, 데이터 변환, 정렬을 모두 포함합니다.
 * 
 * @param date - 조회할 날짜 (YYYY-MM-DD 형식)
 * @returns Promise<TimelineEvent[]> - UI에서 바로 사용 가능한 타임라인 이벤트 배열
 */
export const fetchTimelineEventsForDate = async (date: string): Promise<TimelineEvent[]> => {
  try {
    console.log(`🔍 타임라인 이벤트 조회 시작: ${date}`);
    
    // 1. 현재 사용자 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.error('사용자 인증 확인 중 오류:', authError);
      return [];
    }
    
    if (!user) {
      console.warn('🔓 사용자가 로그인되지 않았습니다.');
      return [];
    }

    console.log(`👤 사용자 확인 완료: ${user.id}`);

    // 2. DB에서 원시 데이터 가져오기
    const dbData = await getTimelineEventsForDate(user.id, date);
    
    if (!dbData || dbData.length === 0) {
      console.log(`📭 ${date}에 해당하는 할 일이 없습니다.`);
      return [];
    }

    console.log(`📦 DB에서 ${dbData.length}개의 원시 데이터 조회 완료`);

    // 3. TimelineEvent 형식으로 변환 및 정렬
    const timelineEvents = convertAndSortTimelineEvents(dbData);
    
    // 4. 디버깅 정보 출력 (개발 환경에서만)
    if (__DEV__ || process.env.NODE_ENV === 'development') {
      debugTimelineEvents(timelineEvents, `${date} 타임라인`);
    }

    console.log(`✅ 타임라인 이벤트 처리 완료: ${timelineEvents.length}개`);
    return timelineEvents;
    
  } catch (error) {
    console.error('타임라인 이벤트 가져오기 실패:', error);
    
    // 사용자에게 친근한 에러 메시지와 함께 빈 배열 반환
    if (error instanceof Error) {
      console.error(`오류 상세: ${error.message}`);
    }
    
    return [];
  }
};

/**
 * 여러 날짜의 타임라인 이벤트를 일괄로 가져옵니다.
 * 주간 보기나 월간 보기에서 사용할 수 있습니다.
 * 
 * @param dates - 조회할 날짜 배열 (YYYY-MM-DD 형식)
 * @returns Promise<Record<string, TimelineEvent[]>> - 날짜별로 그룹화된 타임라인 이벤트
 */
export const fetchTimelineEventsForMultipleDates = async (dates: string[]): Promise<Record<string, TimelineEvent[]>> => {
  try {
    console.log(`🔍 다중 날짜 타임라인 조회: ${dates.length}개 날짜`);
    
    const results: Record<string, TimelineEvent[]> = {};
    
    // 병렬로 모든 날짜 처리
    const promises = dates.map(async (date) => {
      const events = await fetchTimelineEventsForDate(date);
      return { date, events };
    });
    
    const allResults = await Promise.all(promises);
    
    // 결과를 객체로 변환
    allResults.forEach(({ date, events }) => {
      results[date] = events;
    });
    
    console.log(`✅ 다중 날짜 조회 완료: ${Object.keys(results).length}개 날짜`);
    return results;
    
  } catch (error) {
    console.error('다중 날짜 타임라인 조회 실패:', error);
    return {};
  }
};

/**
 * 현재 주의 타임라인 이벤트를 가져옵니다.
 * 
 * @returns Promise<Record<string, TimelineEvent[]>> - 이번 주 7일간의 타임라인 이벤트
 */
export const fetchCurrentWeekTimelineEvents = async (): Promise<Record<string, TimelineEvent[]>> => {
  const today = new Date();
  const dates: string[] = [];
  
  // 이번 주 월요일부터 일요일까지 날짜 생성
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - today.getDay() + 1); // 월요일
  
  for (let i = 0; i < 7; i++) {
    const date = new Date(startOfWeek);
    date.setDate(startOfWeek.getDate() + i);
    dates.push(date.toISOString().split('T')[0]);
  }
  
  return await fetchTimelineEventsForMultipleDates(dates);
};

/**
 * 타임라인 이벤트의 통계 정보를 계산합니다.
 * 
 * @param events - 타임라인 이벤트 배열
 * @returns 완료율, 총 개수 등의 통계 정보
 */
export const calculateTimelineStats = (events: TimelineEvent[]) => {
  const total = events.length;
  const completed = events.filter(event => event.completed).length;
  const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
  
  return {
    total,
    completed,
    remaining: total - completed,
    completionRate
  };
};

/**
 * 특정 날짜의 타임라인 통계를 가져옵니다.
 * 
 * @param date - 조회할 날짜 (YYYY-MM-DD 형식)
 * @returns Promise - 해당 날짜의 통계 정보
 */
export const fetchTimelineStatsForDate = async (date: string) => {
  const events = await fetchTimelineEventsForDate(date);
  return calculateTimelineStats(events);
};
