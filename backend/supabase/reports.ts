import { supabase } from './client';

/**
 * Supabase `reports` 테이블의 데이터를 나타내는 타입입니다.
 */
export interface ReportFromSupabase {
  id: string;
  created_at: string;
  user_id: string;
  report_date: string;
  achievement_score: number;
  ai_coach_feedback: string[];
  daily_activities: any; // jsonb 타입 - 오늘 할일 목록 데이터
}

/**
 * 현재 로그인된 사용자의 모든 리포트를 Supabase DB에서 가져옵니다.
 * 오늘의 리포트와 지난 리포트를 구분하여 반환합니다.
 */
export const fetchReports = async (): Promise<{
  todayReport: ReportFromSupabase | null;
  historicalReports: ReportFromSupabase[];
}> => {
  // 1. 현재 사용자 정보 가져오기
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    console.error('사용자가 인증되지 않았습니다.');
    return { todayReport: null, historicalReports: [] };
  }

  // 2. 현재 사용자의 모든 리포트 데이터 가져오기 (최신순으로 정렬)
  const { data, error } = await supabase
    .from('reports')
    .select('*')
    .eq('user_id', user.id)
    .order('report_date', { ascending: false });

  if (error) {
    console.error('리포트 데이터를 가져오는 중 오류가 발생했습니다:', error);
    return { todayReport: null, historicalReports: [] };
  }
  
  if (!data) {
    return { todayReport: null, historicalReports: [] };
  }

  // 3. 오늘 날짜와 비교하여 리포트 분류하기
  const todayStr = new Date().toISOString().split('T')[0];
  const todayReport = data.find(report => report.report_date === todayStr) || null;
  const historicalReports = data.filter(report => report.report_date !== todayStr);

  return { todayReport, historicalReports };
};

/**
 * 새로운 일간 리포트를 Supabase DB에 생성합니다.
 * @param reportData - 생성할 리포트의 데이터
 * @returns 생성된 리포트 데이터 또는 null
 */
export const createReport = async (reportData: {
  report_date: string;
  achievement_score: number;
  ai_coach_feedback: string[];
  daily_activities: any; // 오늘 할일 목록 데이터
}): Promise<ReportFromSupabase | null> => {
  // 1. 현재 사용자 정보 가져오기
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    console.error('사용자가 인증되지 않아 리포트를 생성할 수 없습니다.');
    return null;
  }

  // 2. 전달받은 데이터와 사용자 ID를 합쳐 새로운 리포트 객체 생성
  const newReport = {
    ...reportData,
    user_id: user.id,
  };

  console.log('Supabase에 저장을 시도하는 리포트 데이터:', newReport);

  // 3. Supabase `reports` 테이블에 데이터 삽입
  const { data, error } = await supabase
    .from('reports')
    .insert(newReport)
    .select()
    .single(); // 삽입된 데이터를 바로 반환받음

  if (error) {
    console.error('Supabase 리포트 생성 오류:', error.message);
    return null;
  }

  console.log('Supabase에 리포트가 성공적으로 저장되었습니다:', data);
  return data;
}; 