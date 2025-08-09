import { supabase } from './client';
import type { ReportFromSupabase } from './reports';

/**
 * 주어진 날짜 문자열(YYYY-MM-DD)에서 하루 전 날짜 문자열을 반환합니다.
 */
function getPrevDateStr(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map((v) => parseInt(v, 10));
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() - 1);
  return dt.toISOString().split('T')[0];
}

/**
 * 보고서의 daily_activities.todos가 모두 완료되었는지 여부를 반환합니다.
 * - todos가 비어있거나 daily_activities가 없으면 false로 간주합니다.
 */
function isAllTodosCompleted(report: Pick<ReportFromSupabase, 'daily_activities'>): boolean {
  const activities = report.daily_activities as any;
  if (!activities || !Array.isArray(activities.todos)) return false;
  const todos = activities.todos as Array<{ completed?: boolean }>; 
  if (todos.length === 0) return false;
  return todos.every((t) => t.completed === true);
}

/**
 * 현재 로그인된 사용자의 "연속 일수(모든 todo 완료)"를 계산해 반환합니다.
 * 기준일은 오늘(UTC 기준)이며, 오늘부터 어제로, 그 전날로 연속해서 모든 todo가 완료된 일수를 셉니다.
 */
export async function getConsecutiveCompletionStreak(): Promise<number> {
  // 현재 사용자 확인
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return 0;

  // 오늘(UTC) 날짜 문자열
  const todayStr = new Date().toISOString().split('T')[0];

  // 사용자 리포트 가져오기 (필요 필드만 선택)
  // 연속성 판단을 위해 최근 90일 정도만 조회 (필요시 조정 가능)
  const { data, error } = await supabase
    .from('reports')
    .select('report_date,daily_activities')
    .eq('user_id', user.id)
    .lte('report_date', todayStr)
    .order('report_date', { ascending: false })
    .limit(180); // 넉넉하게 180일 조회

  if (error || !data) {
    console.warn('연속 완료 일수 계산을 위한 리포트 조회 실패:', error);
    return 0;
  }

  // 날짜별 "모든 todo 완료 여부" 맵 구성
  const dateToAllCompleted: Record<string, boolean> = {};
  for (const r of data as Pick<ReportFromSupabase, 'report_date' | 'daily_activities'>[]) {
    dateToAllCompleted[r.report_date] = isAllTodosCompleted({ daily_activities: r.daily_activities } as any);
  }

  // 오늘부터 과거로 연속성 체크
  let streak = 0;
  let cursor = todayStr;
  while (dateToAllCompleted[cursor] === true) {
    streak += 1;
    cursor = getPrevDateStr(cursor);
  }

  return streak;
}


