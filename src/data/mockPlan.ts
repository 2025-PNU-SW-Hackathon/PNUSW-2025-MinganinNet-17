import { Plan } from '../../types/habit';

/**
 * Rich mock data for UI testing and debug mode
 * Contains realistic Korean todos with varied completion states
 */
export const MOCK_PLAN: Plan = {
  id: 'mock-plan-debug-001',
  plan_title: '🏃‍♂️ 건강한 라이프스타일 만들기',
  status: 'in_progress',
  start_date: new Date().toISOString().split('T')[0],
  difficulty_reason: '의지 부족과 바쁜 일정으로 인한 습관 유지의 어려움',
  intensity: '보통',
  available_time: '07:00-08:00',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  habit_id: 'mock-habit-001',
  user_id: 'mock-user-001',
  milestones: [
    {
      id: 'milestone-001',
      title: '1주차: 기초 생활 습관 형성',
      duration: '1주',
      status: 'in_progress',
      plan_id: 'mock-plan-debug-001',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      daily_todos: [
        { 
          id: 1, 
          description: '물 2L 마시기 (하루 종일 텀블러 들고 다니기)', 
          is_completed: true,
          milestone_id: 'milestone-001',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        { 
          id: 2, 
          description: '30분 산책하기 (점심시간이나 퇴근 후 활용)', 
          is_completed: true,
          milestone_id: 'milestone-001',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        { 
          id: 3, 
          description: '스마트폰 사용시간 3시간 이하로 제한하기', 
          is_completed: false,
          milestone_id: 'milestone-001',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        { 
          id: 4, 
          description: '밤 11시 전에 잠자리 들기 (수면 패턴 개선)', 
          is_completed: false,
          milestone_id: 'milestone-001',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        { 
          id: 5, 
          description: '비타민 D 영양제 챙겨 먹기 (아침식사 후)', 
          is_completed: false,
          milestone_id: 'milestone-001',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ]
    },
    {
      id: 'milestone-002',
      title: '2주차: 운동 루틴 추가하기',
      duration: '1주',
      status: 'pending',
      plan_id: 'mock-plan-debug-001',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      daily_todos: [
        { 
          id: 6, 
          description: '홈트레이닝 20분 (유튜브 피트니스 영상 따라하기)', 
          is_completed: false,
          milestone_id: 'milestone-002',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        { 
          id: 7, 
          description: '계단 이용하기 (엘리베이터 대신 걸어서 올라가기)', 
          is_completed: false,
          milestone_id: 'milestone-002',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        { 
          id: 8, 
          description: '단백질 위주 식단 준비하기 (닭가슴살, 계란 등)', 
          is_completed: false,
          milestone_id: 'milestone-002',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        { 
          id: 9, 
          description: '스트레칭 10분 (잠자기 전 몸 이완)', 
          is_completed: false,
          milestone_id: 'milestone-002',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ]
    },
    {
      id: 'milestone-003',
      title: '3주차: 심화 건강 관리',
      duration: '1주',
      status: 'pending',
      plan_id: 'mock-plan-debug-001',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      daily_todos: [
        { 
          id: 10, 
          description: '명상하기 10분 (마음 챙김과 스트레스 해소)', 
          is_completed: false,
          milestone_id: 'milestone-003',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        { 
          id: 11, 
          description: '금연/금주 유지하기 (건강한 라이프스타일)', 
          is_completed: false,
          milestone_id: 'milestone-003',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        { 
          id: 12, 
          description: '체중 측정 및 기록하기 (변화 추적)', 
          is_completed: false,
          milestone_id: 'milestone-003',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ]
    }
  ]
};

/**
 * Alternative mock plan for variety in testing
 */
export const MOCK_PLAN_STUDY: Plan = {
  id: 'mock-plan-study-001',
  plan_title: '📚 효율적인 학습 습관 만들기',
  status: 'in_progress',
  start_date: new Date().toISOString().split('T')[0],
  difficulty_reason: '집중력 부족과 미루는 습관',
  intensity: '높음',
  available_time: '19:00-21:00',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  habit_id: 'mock-habit-study-001',
  user_id: 'mock-user-001',
  milestones: [
    {
      id: 'study-milestone-001',
      title: '1주차: 학습 환경 구축',
      duration: '1주',
      status: 'in_progress',
      plan_id: 'mock-plan-study-001',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      daily_todos: [
        { 
          id: 101, 
          description: '공부 시간표 작성하고 벽에 붙이기', 
          is_completed: true,
          milestone_id: 'study-milestone-001',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        { 
          id: 102, 
          description: '책상 정리하고 학습 도구 준비하기', 
          is_completed: true,
          milestone_id: 'study-milestone-001',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        { 
          id: 103, 
          description: '매일 2시간 집중 학습하기 (휴대폰 멀리두기)', 
          is_completed: false,
          milestone_id: 'study-milestone-001',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        { 
          id: 104, 
          description: '오늘 배운 내용 노트에 정리하기', 
          is_completed: false,
          milestone_id: 'study-milestone-001',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ]
    }
  ]
};

// Export both plans for different testing scenarios
export const MOCK_PLANS = {
  HEALTH: MOCK_PLAN,
  STUDY: MOCK_PLAN_STUDY,
} as const;