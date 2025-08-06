import { supabase } from './client';

/**
 * daily_activities 필드에 저장되는 개별 작업 항목의 타입입니다.
 */
export interface DailyTask {
  id: number; // 실제 데이터에서는 number 타입
  description: string;
  completed: boolean;
  time?: string; // "09:00-09:30" 형식
}

/**
 * daily_activities 필드의 실제 구조 타입입니다.
 */
export interface DailyActivities {
  todos: DailyTask[];
}

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
  daily_activities: DailyActivities | null; // jsonb 타입 - {todos: [...]} 형태
}

/**
 * 주간 리포트 데이터 타입입니다. (UI의 WeeklyReportData와 일치)
 */
export interface WeeklyReportFromSupabase {
  id: string;
  created_at: string;
  user_id: string;
  week_start: string;
  week_end: string;
  average_score: number; // 7일간 평균 점수
  days_completed: number; // 완료된 일수
  insights: string[];
  daily_scores: number[]; // [M, T, W, T, F, S, S] - scores for each day of the week
}

/**
 * 주간 리포트 생성에 필요한 입력 데이터 타입입니다.
 */
export interface WeeklyReportInput {
  week_start: string;
  week_end: string;
  average_score: number;
  days_completed: number;
  insights: string[];
  daily_scores: number[];
}

/**
 * 캘린더에서 사용할 리포트 데이터 타입입니다.
 */
export interface CalendarReport {
  date: string;
  achievement_score: number;
  daily_tasks: DailyTask[];
  ai_coach_feedback: string[];
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

/**
 * 최근 7일간의 일간 리포트를 가져와서 주간 통계를 계산합니다.
 * @returns 주간 리포트 생성에 필요한 데이터 또는 null
 */
export const aggregateWeeklyReports = async (): Promise<{
  weekStart: string;
  weekEnd: string;
  averageScore: number;
  daysCompleted: number;
  dailyScores: number[];
  dailyReports: ReportFromSupabase[];
} | null> => {
  // 1. 현재 사용자 정보 가져오기
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    console.error('사용자가 인증되지 않았습니다.');
    return null;
  }

  // 2. 최근 7일간의 날짜 범위 계산
  const today = new Date();
  const weekEnd = new Date(today);
  weekEnd.setHours(23, 59, 59, 999); // 오늘의 마지막 시간
  
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - 6); // 7일 전부터
  weekStart.setHours(0, 0, 0, 0); // 시작일의 첫 시간

  const weekStartStr = weekStart.toISOString().split('T')[0];
  const weekEndStr = weekEnd.toISOString().split('T')[0];

  console.log(`주간 리포트 집계: ${weekStartStr} ~ ${weekEndStr}`);

  // 3. 해당 기간의 일간 리포트 가져오기
  const { data: dailyReports, error } = await supabase
    .from('reports')
    .select('*')
    .eq('user_id', user.id)
    .gte('report_date', weekStartStr)
    .lte('report_date', weekEndStr)
    .order('report_date', { ascending: true });

  if (error) {
    console.error('일간 리포트 데이터를 가져오는 중 오류가 발생했습니다:', error);
    return null;
  }

  if (!dailyReports || dailyReports.length === 0) {
    console.log('최근 7일간의 일간 리포트가 없습니다.');
    return null;
  }

  console.log(`가져온 일간 리포트 수: ${dailyReports.length}개`);

  // 4. 주간 통계 계산
  const weeklyStats = calculateWeeklyStats(dailyReports, weekStart, weekEnd);

  return {
    weekStart: weekStartStr,
    weekEnd: weekEndStr,
    averageScore: weeklyStats.averageScore,
    daysCompleted: weeklyStats.daysCompleted,
    dailyScores: weeklyStats.dailyScores,
    dailyReports: dailyReports
  };
};

/**
 * 일간 리포트 데이터를 기반으로 주간 통계를 계산합니다.
 * @param dailyReports - 일간 리포트 배열
 * @param weekStart - 주간 시작일
 * @param weekEnd - 주간 종료일
 * @returns 주간 통계 데이터
 */
const calculateWeeklyStats = (
  dailyReports: ReportFromSupabase[], 
  weekStart: Date, 
  weekEnd: Date
): {
  averageScore: number;
  daysCompleted: number;
  dailyScores: number[];
} => {
  // 1. 7일간의 점수 배열 초기화 (0으로 채움)
  const dailyScores: number[] = new Array(7).fill(0);
  
  // 2. 일간 리포트 데이터를 요일별로 매핑
  dailyReports.forEach(report => {
    const reportDate = new Date(report.report_date);
    const dayOfWeek = reportDate.getDay(); // 0=일요일, 1=월요일, ..., 6=토요일
    
    // 월요일부터 시작하도록 조정 (0=월요일, 1=화요일, ..., 6=일요일)
    const adjustedDayIndex = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    
    dailyScores[adjustedDayIndex] = report.achievement_score;
  });

  // 3. 통계 계산
  const validScores = dailyScores.filter(score => score > 0);
  // 전체 7일 평균 계산 (리포트가 없는 날은 0점으로 계산)
  const averageScore = Math.round((dailyScores.reduce((sum, score) => sum + score, 0) / 7) * 10) / 10;
  
  const daysCompleted = validScores.length;

  console.log('주간 통계 계산 결과:', {
    dailyScores,
    averageScore,
    daysCompleted,
    totalReports: dailyReports.length
  });

  return {
    averageScore,
    daysCompleted,
    dailyScores
  };
};

/*
 * 주간 리포트가 이미 존재하는지 확인합니다.
 * @param weekStart - 주간 시작일
 * @returns 존재 여부
 */
/*
export const checkWeeklyReportExists = async (weekStart: string): Promise<boolean> => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return false;
  }

  const { data, error } = await supabase
    .from('weekly_reports')
    .select('id')
    .eq('user_id', user.id)
    .eq('week_start', weekStart)
    .single();

  if (error && error.code !== 'PGRST116') { // PGRST116는 데이터가 없는 경우
    console.error('주간 리포트 존재 여부 확인 중 오류:', error);
    return false;
  }

  return !!data;
};
*/

/**
 * 주간 리포트를 위한 AI 인사이트를 생성합니다.
 * @param dailyReports - 일간 리포트 배열
 * @param weeklyStats - 주간 통계 데이터
 * @returns AI가 생성한 인사이트 배열
 */
export const generateWeeklyInsights = async (
  dailyReports: ReportFromSupabase[],
  weeklyStats: {
    averageScore: number;
    daysCompleted: number;
    dailyScores: number[];
  }
): Promise<string[]> => {
  try {
    // 1. 일간 리포트 데이터를 분석용 텍스트로 변환
    const dailyReportTexts = dailyReports.map(report => {
      const date = new Date(report.report_date);
      const dayName = ['일', '월', '화', '수', '목', '금', '토'][date.getDay()];
      const feedbackText = report.ai_coach_feedback.join(' ');
      
      return `${dayName}요일 (${report.report_date}): 점수 ${report.achievement_score}/10 - ${feedbackText}`;
    }).join('\n\n');

    // 2. 주간 통계 요약
    const weekSummary = `
주간 통계:
- 평균 점수: ${weeklyStats.averageScore}/10
- 완료된 일수: ${weeklyStats.daysCompleted}/7일
- 요일별 점수: [${weeklyStats.dailyScores.join(', ')}] (월~일)
    `.trim();

    // 3. AI 프롬프트 구성
    const prompt = `
당신은 사용자의 성장을 돕는 따뜻하고 통찰력 있는 AI 코치입니다. 사용자의 일주일간 활동 데이터를 바탕으로, 다음 주를 더 잘 보낼 수 있도록 구체적이고 긍정적인 주간 인사이트를 생성해주세요.

**인사이트 생성 규칙:**
1. **긍정적 관점**: 사용자의 노력과 성과를 먼저 인정하고 칭찬하세요.
2. **패턴 분석**: 일주일간의 점수 변화와 피드백을 바탕으로 패턴을 분석하세요.
3. **구체적 조언**: 다음 주에 시도해볼 만한 구체적인 행동 1-2가지를 제안하세요.
4. **동기 부여**: 희망적이고 격려하는 메시지로 마무리하세요.
5. **형식**: 3-4개의 짧은 문장으로 구성하고, 각 문장은 50자 이내로 작성하세요.

---

**사용자 일주일 데이터:**
${weekSummary}

**일별 상세 기록:**
${dailyReportTexts}

---

위의 정보를 바탕으로 따뜻하고 통찰력 있는 주간 인사이트 2개를 작성해주세요. 각 인사이트는 별도의 줄로 구분해주세요.
    `;

    // 4. AI API 호출 (기존 sendMessage 함수 사용)
    const { sendMessage } = await import('../hwirang/gemini');
    const aiResponse = await sendMessage(prompt);

    // 5. 응답을 배열로 변환
    const insights = aiResponse
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0 && !line.startsWith('---'))
      .slice(0, 4); // 최대 4개까지만

    console.log('주간 AI 인사이트 생성 완료:', insights);
    return insights;

  } catch (error) {
    console.error('주간 AI 인사이트 생성 중 오류:', error);
    
    // 오류 발생 시 기본 인사이트 반환
    return [
      '이번 주도 꾸준히 노력하신 모습이 인상적입니다.',
      '다음 주에는 더 나은 결과를 얻을 수 있을 것 같습니다.',
      '작은 진전도 큰 성장의 시작입니다. 계속해서 도전해보세요.'
    ];
  }
}; 

/**
 * 주간 리포트를 Supabase DB에 생성합니다.
 * @param reportData - 생성할 주간 리포트의 데이터
 * @returns 생성된 주간 리포트 데이터 또는 null
 */
export const createWeeklyReport = async (
  reportData: WeeklyReportInput
): Promise<WeeklyReportFromSupabase | null> => {
  // 1. 현재 사용자 정보 가져오기
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    console.error('사용자가 인증되지 않아 주간 리포트를 생성할 수 없습니다.');
    return null;
  }

  // 2. 전달받은 데이터와 사용자 ID를 합쳐 새로운 주간 리포트 객체 생성
  const newWeeklyReport = {
    ...reportData,
    user_id: user.id,
  };

  console.log('Supabase에 저장을 시도하는 주간 리포트 데이터:', newWeeklyReport);

  // 3. Supabase `weekly_reports` 테이블에 데이터 삽입
  const { data, error } = await supabase
    .from('weekly_reports')
    .insert(newWeeklyReport)
    .select()
    .single(); // 삽입된 데이터를 바로 반환받음

  if (error) {
    console.error('Supabase 주간 리포트 생성 오류:', error.message);
    return null;
  }

  console.log('Supabase에 주간 리포트가 성공적으로 저장되었습니다:', data);
  return data;
}; 