import { ReportFromSupabase } from '../../backend/supabase/reports';

/**
 * Mock daily reports for debugging and testing weekly report functionality
 * Contains 7 days of realistic Korean daily reports with various patterns
 */

// Helper function to get date string for N days ago
const getDaysAgo = (daysAgo: number): string => {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString().split('T')[0];
};

// Helper function to get ISO timestamp for N days ago
const getTimestampDaysAgo = (daysAgo: number): string => {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString();
};

export const MOCK_DAILY_REPORTS: ReportFromSupabase[] = [
  // Today (Day 0) - High performance day
  {
    id: 'mock-daily-report-001',
    created_at: getTimestampDaysAgo(0),
    user_id: '00000000-0000-0000-0000-000000000001',
    report_date: getDaysAgo(0),
    achievement_score: 9,
    ai_coach_feedback: [
      '오늘 정말 뛰어난 하루를 보내셨네요! 🎉 모든 할 일을 거의 완료하신 모습이 인상적입니다.',
      '특히 꾸준한 운동과 물 마시기를 실천하신 점이 훌륭해요. 이런 패턴을 유지하시면 큰 변화를 느끼실 거예요.',
      '내일도 오늘의 에너지를 이어가되, 너무 무리하지 마시고 컨디션 조절도 신경 써주세요. ✨'
    ],
    daily_activities: {
      todos: [
        { id: 1, description: '물 2L 마시기 (하루 종일 텀블러 들고 다니기)', completed: true },
        { id: 2, description: '30분 산책하기 (점심시간이나 퇴근 후 활용)', completed: true },
        { id: 3, description: '스마트폰 사용시간 3시간 이하로 제한하기', completed: true },
        { id: 4, description: '밤 11시 전에 잠자리 들기 (수면 패턴 개선)', completed: true },
        { id: 5, description: '비타민 D 영양제 챙겨 먹기 (아침식사 후)', completed: false }
      ]
    }
  },
  
  // Yesterday (Day 1) - Good day
  {
    id: 'mock-daily-report-002',
    created_at: getTimestampDaysAgo(1),
    user_id: '00000000-0000-0000-0000-000000000001',
    report_date: getDaysAgo(1),
    achievement_score: 7,
    ai_coach_feedback: [
      '어제도 꽤 성과적인 하루를 보내셨어요! 😊 대부분의 목표를 달성하셨네요.',
      '물 마시기와 산책은 완벽했지만, 수면 시간 관리에서 조금 아쉬웠던 것 같아요.',
      '내일은 잠자리 드는 시간을 조금 더 신경 써보시면 어떨까요? 숙면이 다음 날 컨디션에 큰 영향을 줄 거예요.'
    ],
    daily_activities: {
      todos: [
        { id: 1, description: '물 2L 마시기 (하루 종일 텀블러 들고 다니기)', completed: true },
        { id: 2, description: '30분 산책하기 (점심시간이나 퇴근 후 활용)', completed: true },
        { id: 3, description: '스마트폰 사용시간 3시간 이하로 제한하기', completed: true },
        { id: 4, description: '밤 11시 전에 잠자리 들기 (수면 패턴 개선)', completed: false },
        { id: 5, description: '비타민 D 영양제 챙겨 먹기 (아침식사 후)', completed: true }
      ]
    }
  },

  // 2 days ago - Average day
  {
    id: 'mock-daily-report-003',
    created_at: getTimestampDaysAgo(2),
    user_id: '00000000-0000-0000-0000-000000000001',
    report_date: getDaysAgo(2),
    achievement_score: 5,
    ai_coach_feedback: [
      '오늘은 평소보다 조금 힘든 하루였을 것 같아요. 😌 그래도 기본적인 목표들을 지키려고 노력하신 모습이 보여요.',
      '물 마시기는 잘 실천하셨지만, 다른 활동들이 조금 아쉬웠네요. 바쁜 일정 때문이었나요?',
      '완벽하지 않아도 괜찮아요. 내일은 작은 목표부터 차근차근 시작해보시는 건 어떨까요? 💪'
    ],
    daily_activities: {
      todos: [
        { id: 1, description: '물 2L 마시기 (하루 종일 텀블러 들고 다니기)', completed: true },
        { id: 2, description: '30분 산책하기 (점심시간이나 퇴근 후 활용)', completed: false },
        { id: 3, description: '스마트폰 사용시간 3시간 이하로 제한하기', completed: true },
        { id: 4, description: '밤 11시 전에 잠자리 들기 (수면 패턴 개선)', completed: false },
        { id: 5, description: '비타민 D 영양제 챙겨 먹기 (아침식사 후)', completed: true }
      ]
    }
  },

  // 3 days ago - Challenging day
  {
    id: 'mock-daily-report-004',
    created_at: getTimestampDaysAgo(3),
    user_id: '00000000-0000-0000-0000-000000000001',
    report_date: getDaysAgo(3),
    achievement_score: 3,
    ai_coach_feedback: [
      '오늘은 정말 힘든 하루였나 봐요. 🤗 그래도 포기하지 않고 기록을 남겨주신 것만으로도 대단해요.',
      '모든 날이 완벽할 수는 없어요. 이런 날도 성장의 과정이라고 생각해보세요.',
      '내일은 가장 쉬운 목표 하나부터 시작해보는 건 어떨까요? 작은 성취감이 큰 동력이 될 거예요. 🌱'
    ],
    daily_activities: {
      todos: [
        { id: 1, description: '물 2L 마시기 (하루 종일 텀블러 들고 다니기)', completed: false },
        { id: 2, description: '30분 산책하기 (점심시간이나 퇴근 후 활용)', completed: false },
        { id: 3, description: '스마트폰 사용시간 3시간 이하로 제한하기', completed: false },
        { id: 4, description: '밤 11시 전에 잠자리 들기 (수면 패턴 개선)', completed: false },
        { id: 5, description: '비타민 D 영양제 챙겨 먹기 (아침식사 후)', completed: true }
      ]
    }
  },

  // 4 days ago - Recovery day
  {
    id: 'mock-daily-report-005',
    created_at: getTimestampDaysAgo(4),
    user_id: '00000000-0000-0000-0000-000000000001',
    report_date: getDaysAgo(4),
    achievement_score: 6,
    ai_coach_feedback: [
      '어제보다 훨씬 나아지셨어요! 😊 다시 궤도에 올라서고 계신 모습이 보기 좋아요.',
      '물 마시기와 영양제는 꾸준히 잘 지키고 계시고, 산책도 다시 시작하셨네요.',
      '이렇게 조금씩 회복하는 패턴이 정말 중요해요. 꾸준함이 완벽함보다 더 가치 있답니다. ✨'
    ],
    daily_activities: {
      todos: [
        { id: 1, description: '물 2L 마시기 (하루 종일 텀블러 들고 다니기)', completed: true },
        { id: 2, description: '30분 산책하기 (점심시간이나 퇴근 후 활용)', completed: true },
        { id: 3, description: '스마트폰 사용시간 3시간 이하로 제한하기', completed: false },
        { id: 4, description: '밤 11시 전에 잠자리 들기 (수면 패턴 개선)', completed: true },
        { id: 5, description: '비타민 D 영양제 챙겨 먹기 (아침식사 후)', completed: true }
      ]
    }
  },

  // 5 days ago - Excellent day
  {
    id: 'mock-daily-report-006',
    created_at: getTimestampDaysAgo(5),
    user_id: '00000000-0000-0000-0000-000000000001',
    report_date: getDaysAgo(5),
    achievement_score: 8,
    ai_coach_feedback: [
      '정말 훌륭한 하루였어요! 🌟 거의 모든 목표를 달성하셨네요.',
      '특히 스마트폰 사용시간을 잘 관리하신 점이 인상적이에요. 디지털 디톡스가 잘 되고 있는 것 같아요.',
      '이런 패턴을 자주 만들어가실 수 있다면, 정말 큰 변화를 경험하게 될 거예요. 계속 화이팅! 💪'
    ],
    daily_activities: {
      todos: [
        { id: 1, description: '물 2L 마시기 (하루 종일 텀블러 들고 다니기)', completed: true },
        { id: 2, description: '30분 산책하기 (점심시간이나 퇴근 후 활용)', completed: true },
        { id: 3, description: '스마트폰 사용시간 3시간 이하로 제한하기', completed: true },
        { id: 4, description: '밤 11시 전에 잠자리 들기 (수면 패턴 개선)', completed: true },
        { id: 5, description: '비타민 D 영양제 챙겨 먹기 (아침식사 후)', completed: false }
      ]
    }
  },

  // 6 days ago - Moderate day
  {
    id: 'mock-daily-report-007',
    created_at: getTimestampDaysAgo(6),
    user_id: '00000000-0000-0000-0000-000000000001',
    report_date: getDaysAgo(6),
    achievement_score: 6,
    ai_coach_feedback: [
      '꽤 괜찮은 하루를 보내셨어요! 😌 기본적인 건강 습관들은 잘 지키고 계시네요.',
      '물 마시기와 영양제 섭취는 완벽했고, 수면 패턴도 개선되고 있는 것 같아요.',
      '산책과 스마트폰 사용량 관리에 조금 더 신경 쓰시면 더 좋은 결과를 얻으실 것 같아요. 🚶‍♂️'
    ],
    daily_activities: {
      todos: [
        { id: 1, description: '물 2L 마시기 (하루 종일 텀블러 들고 다니기)', completed: true },
        { id: 2, description: '30분 산책하기 (점심시간이나 퇴근 후 활용)', completed: false },
        { id: 3, description: '스마트폰 사용시간 3시간 이하로 제한하기', completed: false },
        { id: 4, description: '밤 11시 전에 잠자리 들기 (수면 패턴 개선)', completed: true },
        { id: 5, description: '비타민 D 영양제 챙겨 먹기 (아침식사 후)', completed: true }
      ]
    }
  }
];

/**
 * Calculate mock weekly statistics from mock daily reports
 */
export const calculateMockWeeklyStats = () => {
  const totalScore = MOCK_DAILY_REPORTS.reduce((sum, report) => sum + report.achievement_score, 0);
  const averageScore = Math.round((totalScore / 7) * 10) / 10; // 6.3 average
  const daysCompleted = MOCK_DAILY_REPORTS.length; // All 7 days have reports
  const dailyScores = MOCK_DAILY_REPORTS.map(report => report.achievement_score);
  
  return {
    averageScore,
    daysCompleted,
    dailyScores,
    totalReports: MOCK_DAILY_REPORTS.length
  };
};

/**
 * Get week date range for mock data
 */
export const getMockWeekRange = () => {
  const weekStart = getDaysAgo(6); // 6 days ago to today = 7 days
  const weekEnd = getDaysAgo(0); // today
  
  return {
    weekStart,
    weekEnd
  };
};