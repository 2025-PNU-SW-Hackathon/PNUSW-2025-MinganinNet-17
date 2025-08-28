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
    .from('daily_reports')
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


/**
 * 이번 주(월~일) 기준으로, 이번 주에 기록된 모든 리포트의 할 일(todo) 중
 * 완료된 항목의 비율(%)을 정수로 반환합니다.
 * - totalTodos가 0이면 0을 반환합니다.
 */
export async function getThisWeekTodosCompletionRate(): Promise<number> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return 0;

  // UTC 기준 이번 주 월요일 ~ 일요일 계산
  const now = new Date();
  const utcDay = now.getUTCDay(); // 0=Sun..6=Sat
  const diffToMonday = utcDay === 0 ? -6 : 1 - utcDay; // Monday-based week
  const mondayUtc = new Date(Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate() + diffToMonday,
  ));
  const sundayUtc = new Date(Date.UTC(
    mondayUtc.getUTCFullYear(),
    mondayUtc.getUTCMonth(),
    mondayUtc.getUTCDate() + 6,
  ));

  const weekStartStr = mondayUtc.toISOString().split('T')[0];
  const weekEndStr = sundayUtc.toISOString().split('T')[0];

  const { data, error } = await supabase
    .from('daily_reports')
    .select('report_date,daily_activities')
    .eq('user_id', user.id)
    .gte('report_date', weekStartStr)
    .lte('report_date', weekEndStr)
    .order('report_date', { ascending: true });

  if (error || !data) {
    console.warn('이번 주 완료 비율 계산을 위한 리포트 조회 실패:', error);
    return 0;
  }

  // 요일별(월~일)로 일일 완료율을 계산하고 평균을 내는 방식
  // 날짜 문자열 배열 생성 (UTC 월요일 ~ 일요일)
  const dateStrsOfWeek: string[] = [];
  for (let i = 0; i < 7; i += 1) {
    const d = new Date(Date.UTC(
      mondayUtc.getUTCFullYear(),
      mondayUtc.getUTCMonth(),
      mondayUtc.getUTCDate() + i,
    ));
    dateStrsOfWeek.push(d.toISOString().split('T')[0]);
  }

  // 빠른 인덱스 조회용 맵
  const dateIndexMap: Record<string, number> = {};
  dateStrsOfWeek.forEach((ds, idx) => (dateIndexMap[ds] = idx));

  // 각 요일의 total/completed 집계
  const dailyTotals: Array<{ total: number; completed: number }> = new Array(7)
    .fill(null)
    .map(() => ({ total: 0, completed: 0 }));

  for (const r of data as Pick<ReportFromSupabase, 'report_date' | 'daily_activities'>[]) {
    const idx = dateIndexMap[(r as any).report_date];
    if (idx === undefined) continue;
    const activities = (r as any).daily_activities;
    const todos = activities && Array.isArray(activities.todos) ? (activities.todos as Array<{ completed?: boolean }>) : [];
    dailyTotals[idx].total += todos.length;
    dailyTotals[idx].completed += todos.filter((t) => t.completed === true).length;
  }

  // 일일 완료율(0~1) 합산. 리포트/할일이 없는 날은 0으로 간주
  let sumDailyRates = 0; // 0~7 범위의 합(비율 합)
  for (const day of dailyTotals) {
    if (day.total > 0) {
      sumDailyRates += day.completed / day.total;
    } else {
      sumDailyRates += 0;
    }
  }

  // 7일 평균을 백분율로 변환하여 반올림
  const averageRatePercent = Math.round((sumDailyRates / 7) * 100);
  return averageRatePercent;
}


/**
 * 사용자 기준으로 완료된 목표(Plan)의 개수를 반환합니다.
 * - 정의: `plans.status = 'completed'` 인 레코드의 수
 * - 주의: "목표"를 Habit 단위로 집계하고 싶다면, DISTINCT habit_id 카운트로 조정 가능
 */
export async function getCompletedGoalsCount(): Promise<number> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return 0;

  // plans 테이블에서 현재 사용자이면서 완료 상태인 계획 수 카운트
  const { count, error } = await supabase
    .from('plans')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('status', 'completed');

  if (error) {
    console.warn('완료된 목표 수 조회 실패:', error);
    return 0;
  }

  return count ?? 0;
}

