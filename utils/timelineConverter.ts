/**
 * Supabase에서 가져온 데이터를 TimelineEvent 형식으로 변환하는 유틸리티
 */

import { parseAvailableTimeToSchedule } from './timeUtils';

// TimelineEvent 인터페이스 (components/TimelineView.tsx와 동일)
export interface TimelineEvent {
  id: string;
  time: string;
  title: string;
  subtitle?: string;
  type: 'alarm' | 'scheduled' | 'general';
  completed?: boolean;
  progress?: { current: number; total: number };
  icon: string;
}

/**
 * Supabase에서 가져온 nested 구조 데이터를 TimelineEvent 배열로 변환합니다.
 * 
 * @param dbData - getTimelineEventsForDate에서 반환된 데이터 배열
 * @returns TimelineEvent 배열
 */
export const convertSupabaseDataToTimelineEvents = (dbData: any[]): TimelineEvent[] => {
  return dbData.map((row, index) => {
    // Supabase의 nested 구조에서 데이터 추출
    const milestone = row.daily_todos?.milestones;
    const plan = milestone?.plans;
    
    // 시간 분산: plan의 available_time을 사용하여 적절한 시간 할당
    const availableTime = plan?.available_time || "09:00-10:00"; // 기본값
    const scheduledTime = parseAvailableTimeToSchedule(availableTime, index);
    
    // subtitle 생성: milestone 정보가 있으면 우선 사용, 없으면 plan 정보 사용
    let subtitle = "";
    if (milestone?.title && milestone?.duration) {
      subtitle = `${milestone.title} - ${milestone.duration}`;
    } else if (plan?.plan_title && plan?.intensity) {
      subtitle = `${plan.plan_title} (${plan.intensity})`;
    } else {
      subtitle = "할 일";
    }
    
    return {
      id: row.id,
      time: scheduledTime,
      title: row.description || "제목 없음",
      subtitle: subtitle,
      type: "alarm" as const, // 요구사항에 따라 alarm으로 고정
      completed: row.is_completed || false,
      icon: "target" // 습관/목표 관련이므로 target 아이콘 사용
    };
  });
};

/**
 * 변환된 TimelineEvent 배열을 시간순으로 정렬합니다.
 * 
 * @param events - TimelineEvent 배열
 * @returns 시간순으로 정렬된 TimelineEvent 배열
 */
export const sortTimelineEventsByTime = (events: TimelineEvent[]): TimelineEvent[] => {
  return events.sort((a, b) => a.time.localeCompare(b.time));
};

/**
 * 데이터 변환과 정렬을 한 번에 수행하는 편의 함수
 * 
 * @param dbData - Supabase에서 가져온 원시 데이터
 * @returns 변환되고 정렬된 TimelineEvent 배열
 */
export const convertAndSortTimelineEvents = (dbData: any[]): TimelineEvent[] => {
  const convertedEvents = convertSupabaseDataToTimelineEvents(dbData);
  return sortTimelineEventsByTime(convertedEvents);
};

/**
 * 디버깅용: 변환된 데이터의 구조를 콘솔에 출력합니다.
 * 
 * @param events - TimelineEvent 배열
 * @param label - 로그에 표시할 라벨
 */
export const debugTimelineEvents = (events: TimelineEvent[], label: string = "Timeline Events") => {
  console.log(`📋 ${label}:`, events);
  console.log(`📊 총 ${events.length}개의 이벤트`);
  
  if (events.length > 0) {
    console.log("🕐 시간 분포:", events.map(e => `${e.time}: ${e.title}`));
    console.log("✅ 완료 상태:", events.filter(e => e.completed).length + "개 완료");
  }
};
