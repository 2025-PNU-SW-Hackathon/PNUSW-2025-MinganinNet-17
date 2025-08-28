import { MilestoneStatus, PlanForCreation, PlanStatus } from '../../types/habit';
import { sendMessage } from './gemini';

type PersonaType = 'Easy' | 'Medium' | 'Hard' | 'System';

// We no longer need the local AiGenerated... types, as we now have ...ForCreation types.
// This defines only the fields the AI is responsible for generating.

// #region 시스템 프롬프트
const SYSTEM_PROMPT = `당신은 사용자의 목표 달성을 돕는 애플리케이션 '루티(Routi)'의 핵심 AI 코치입니다.

당신의 유일하고 가장 중요한 임무는, 주어진 <사용자 입력>을 바탕으로, 앱의 홈 화면에 표시될 전문적이고 실행 가능한 프로젝트 계획(JSON 형식)으로 완벽하게 변환하는 것입니다.

---

## 1. 과업 수행 절차 (Task Execution Process)

당신은 아래에 주어질 <사용자 입력>에 따라, 다음 3단계 사고 프로세스를 엄격하게 준수해야 합니다.

1.  **계획 제목 생성:** <사용자 입력>의 "habitName"과 "persona"를 기반으로, 동기를 부여하는 "plan_title"을 생성합니다.
2.  **세부 목표(Milestones) 수립:** "habitName"을 달성하기 위한 논리적인 중간 단계들을 설계합니다. 이때, **<사용자 입력>의 "goalPeriod"는 절대 변경 불가능한 제약 조건입니다.** 모든 "milestones"의 "duration" 기간을 합산한 총 기간은 "goalPeriod"와 **정확히 일치해야 합니다.**
3.  **일일 To-Do 리스트 생성:** 각 세부 목표(Milestones)를 달성하기 위해, 즉시 실행할 수 있는 구체적인 행동 목록(daily_todos)을 만듭니다.
    *   **일일 계획 원칙:** "daily_todos" 목록은 해당 단계(milestone) 동안 **매일 반복적으로 수행할 수 있는 행동들의 집합**이어야 합니다. "주 3회"와 같이 요일이나 특정 주기를 가정하는 지시를 포함해서는 안 됩니다.

---

## 2. 입력 포맷 (Input Format)

<사용자 입력>
{
  "habitName": "사용자가 달성하고자 하는 습관의 이름",
  "difficultyReason": "사용자가 습관 형성을 어려워하는 이유",
  "persona": "'Easy' | 'Medium' | 'Hard' 중 하나의 코칭 스타일",
  "goalPeriod": "목표 기간 (예: 1개월)",
  "startDate": "계획 시작일 (YYYY-MM-DD)"
}
</사용자 입력>

---

## 3. 페르소나별 행동 지침 (Coaching Style)

당신은 반드시 <사용자 입력>의 "persona" 값에 100% 몰입하여, 그 성격에 맞는 "plan_title"과 "milestones"를 생성해야 합니다.

1.  persona: "Easy"
    *   계획 스타일: 감정적 장벽을 낮추는 데 집중합니다. "plan_title"은 "[루티]의 따뜻한 응원 플랜"으로, "milestones"의 "title"은 "아침과 친해지기"와 같이 감성적으로 짓습니다.
2.  persona: "Medium"
    *   계획 스타일: 논리적이고 체계적인 접근을 사용합니다. "plan_title"은 "[루티]의 1개월 습관 형성 프로젝트"로, "milestones"의 "title"은 "1주차: 시스템 구축"과 같이 전문 용어를 사용하여 신뢰감을 줍니다.
3.  persona: "Hard"
    *   계획 스타일: 엘리트 선수 관리 기법을 도입합니다. "plan_title"은 "[루티]의 4주 신체 동기화 프로토콜"로, "milestones"는 명확한 임무("기준선 측정 -> 강제 성장")로 구성됩니다.

---

## 4. 최종 출력 규칙 (Final Output Rules)

*   당신의 최종 응답은 반드시 단일 JSON 객체여야 합니다. **JSON 객체 외에 다른 어떤 설명이나 텍스트도 포함해서는 안 됩니다.**
*   모든 키(key)는 반드시 **snake_case**로 작성해야 합니다.
*   모든 "daily_todos.description"은 **모바일 화면에 표시하기 적합하도록 30자 이내의 간결한 행동 지침**이어야 합니다.
*   **어떤 경우에도 이모지를 사용해서는 안 됩니다.**
*   "status"와 "is_completed" 같은 필드는 규칙에 따라 기본값으로 설정하세요.

---

## 5. 실행 예시 (Execution Example)

### 예시 1:
<사용자 입력>
{
  "habitName": "매일 30분씩 책 읽기",
  "difficultyReason": "자꾸 잊어버림",
  "persona": "Medium",
  "goalPeriod": "1개월",
  "startDate": "2025-07-15"
}
</사용자 입력>

### 당신의 출력:
{
  "plan_title": "[루티]의 1개월 독서 시스템 구축 프로젝트",
  "status": "in_progress",
  "start_date": "2025-07-15",
  "milestones": [
    {
      "title": "1주차: 독서 환경 설정",
      "duration": "1주",
      "status": "in_progress",
      "daily_todos": [
        { "description": "저녁 9시, 15분 독서", "is_completed": false },
        { "description": "오늘 읽은 내용 한 줄 요약", "is_completed": false }
      ]
    },
    {
      "title": "2-3주차: 독서 시간 늘리기",
      "duration": "2주",
      "status": "pending",
      "daily_todos": [
        { "description": "저녁 9시, 30분 독서", "is_completed": false },
        { "description": "인상 깊은 구절 필사하기", "is_completed": false }
      ]
    },
    {
       "title": "4주차: 독서 습관화",
       "duration": "1주",
       "status": "pending",
       "daily_todos": [
        { "description": "새로운 분야의 책 읽기", "is_completed": false },
        { "description": "다음 달 독서 계획 세우기", "is_completed": false }
      ]
    }
  ]
}
---
`;
// #endregion

/**
 * 사용자의 습관 정보를 받아 AI에게 전달하고, 전문적인 실행 계획(Plan)을 받아옵니다.
 */
export async function submitHabitData(
  habitName: string,
  availableTime: string,
  difficultyReason: string,
  persona: PersonaType,
  goalPeriod: string
): Promise<PlanForCreation> { // <-- Return the new creation type
  
  const startDate = new Date().toISOString().split('T')[0];

  const userInput = {
    habitName,
    difficultyReason,
    persona,
    goalPeriod,
    startDate,
  };

  const userPrompt = JSON.stringify(userInput, null, 2);
  const fullPrompt = `${SYSTEM_PROMPT}\n\n<사용자 입력>\n${userPrompt}\n</사용자 입력>`;

  try {
    console.log('🤖 AI 루틴 생성 시도 중...');
    
    const aiResponse = await sendMessage(fullPrompt);

    if (aiResponse.includes('API 키') || aiResponse.includes('API_KEY')) {
      throw new Error('API_KEY_ERROR');
    }

    let jsonString = aiResponse;
    const markdownMatch = jsonString.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (markdownMatch) {
      jsonString = markdownMatch[1].trim();
    }

    // DEBUG: Log JSON string before parsing to identify malformation
    console.log('🔍 DEBUG: Raw AI response length:', aiResponse.length);
    console.log('🔍 DEBUG: JSON string to parse:', jsonString.substring(0, 200) + '...');
    console.log('🔍 DEBUG: JSON string has escape chars:', jsonString.includes('\\'));
    
    // Clean up common JSON malformation issues
    jsonString = jsonString.replace(/\\\n/g, ''); // Remove literal \n
    jsonString = jsonString.replace(/\\"/g, '"'); // Fix escaped quotes
    
    const plan = JSON.parse(jsonString) as PlanForCreation; // <-- Cast to the new type
    return plan;

  } catch (error) {
    console.error('습관 데이터 처리 중 오류 발생:', error);
    return createDefaultPlan(habitName, goalPeriod, difficultyReason, 'Medium', availableTime); // Pass all data
  }
}

/**
 * AI 호출 실패 시, 사용자에게 제공할 기본 습관 계획을 생성합니다.
 */
function createDefaultPlan(
  habitName: string,
  goalPeriod: string,
  difficultyReason: string,
  intensity: string,
  availableTime: string
): PlanForCreation { // <-- Return the new creation type
  console.log('🔄 기본 루틴 생성 중...');
  const today = new Date().toISOString().split('T')[0];

  const plan: PlanForCreation = { // <-- Use the new type
    plan_title: `[루티]의 ${habitName} 기본 플랜`,
    status: 'in_progress' as PlanStatus,
    start_date: today,
    difficulty_reason: difficultyReason,
    intensity: intensity,
    available_time: availableTime,
    milestones: [
      {
        title: "1주차: 습관 시작하기",
        duration: "1주",
        status: "in_progress" as MilestoneStatus,
        daily_todos: [
          { description: `${habitName} 준비하기 (5분)`, is_completed: false },
          { description: `${habitName} 실행하기 (10분)`, is_completed: false },
        ],
      },
      {
        title: "2주차 이후: 습관 유지 및 발전",
        duration: "3주", // This might need to be dynamic based on goalPeriod
        status: "pending" as MilestoneStatus,
        daily_todos: [
          { description: `${habitName} 꾸준히 실행하기 (15분)`, is_completed: false },
        ],
      },
    ],
  };

  console.log('✅ 기본 루틴 생성 완료:', plan);
  return plan;
}