import { HabitEvent } from '../supabase/habits';
import { sendMessage } from './gemini';

// 습관 입력 정보를 바탕으로 프롬프트를 생성하고, AI에게 전송해 응답을 받아오는 함수
export async function submitHabitData(habit: string, availableTime: string, difficulty: string): Promise<HabitEvent[]> {
  // 프롬프트 생성
  const prompt = `나는 '${habit}'이라는 습관을 만들고 싶어. 하루 중 '${availableTime}'에 이 습관을 할 수 있어. 습관을 만들 때 '${difficulty}' 같은 어려움이 있어. 이 정보를 바탕으로 루틴을 여러 개의 단계로 나눈 후, 각 단계를 하루 일정으로 만들고, 아래 JSON 배열 형식으로 반환해줘.
  반환 형식은 다음과 같아. 예시를 그대로 복사하지 말고 설명 없이 JSON 배열만 반환해.

  [
  {
  "startDate": "YYYY-MM-DD",
  "description": "단계 설명",
  "time": "HH:MM-HH:MM",
  "repeat": 반복 일수 (정수),
  "score": 0
  },
  ...
  ]

  각 description은 실행 여부를 명확하게 판단할 수 있게 작성하고, 전체 루틴을 순차적 단계로 분리해줘.` ;

  try {
    console.log('🤖 AI 루틴 생성 시도 중...');
    
    // AI에게 요청을 보내고 JSON 응답 받기
    const aiResponse = await sendMessage(prompt);
    console.log('AI 원본 응답:', aiResponse);

    // API 키 오류 또는 서비스 오류 감지
    if (aiResponse.includes('API 키') || aiResponse.includes('API_KEY') || aiResponse.includes('401') || aiResponse.includes('400')) {
      console.warn('🔑 API 키 오류 감지, 기본 루틴 사용');
      throw new Error('API_KEY_ERROR');
    }

    let jsonString = aiResponse;

    // 1. 마크다운 코드 블록 제거: 유연하게 ```로 시작하고 끝나는 모든 블록 제거
    const markdownMatch = jsonString.match(/```(?:json|javascript|text)?\s*([\s\S]*?)\s*```/);
    if (markdownMatch && markdownMatch[1]) {
      jsonString = markdownMatch[1].trim();
    } else {
      // 마크다운 블록이 없는 경우를 대비하여 양쪽 공백 제거
      jsonString = jsonString.trim();
    }

    // 2. JSON 배열만 정확히 추출: 첫 '['부터 마지막 ']'까지
    const arrayMatch = jsonString.match(/\[[\s\S]*\]/);
    if (arrayMatch && arrayMatch[0]) {
      jsonString = arrayMatch[0];
    } else {
      // 배열 형태가 아닐 경우, 단일 객체일 가능성을 대비
      const objectMatch = jsonString.match(/\{[\s\S]*\}/);
      if (objectMatch && objectMatch[0]) {
        jsonString = `[${objectMatch[0]}]`; // 단일 객체를 배열로 감싸서 처리
      } else {
        throw new Error('AI 응답에서 유효한 JSON 배열 또는 객체를 찾을 수 없습니다.');
      }
    }

    console.log('정제된 JSON 문자열:', jsonString);

    // AI 응답을 JSON으로 파싱하고 타입 지정
    const habitEvents = JSON.parse(jsonString) as HabitEvent[];
    console.log('파싱된 JSON:', habitEvents);

    // 파싱된 JSON 배열을 바로 반환
    return habitEvents;

  } catch (error) {
    console.error('습관 데이터 처리 중 오류 발생:', error);
    
    // API 키 오류인 경우 기본 루틴 제공
    if (error instanceof Error && error.message === 'API_KEY_ERROR') {
      console.log('🔄 기본 루틴 생성 중...');
      return createDefaultHabitEvents(habit, availableTime, difficulty);
    }
    
    const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
    console.error('오류 상세 정보:', errorMessage);
    
    // 다른 오류의 경우에도 기본 루틴 제공
    console.log('🔄 오류 발생, 기본 루틴으로 대체');
    return createDefaultHabitEvents(habit, availableTime, difficulty);
  }
}

// 기본 루틴을 생성하는 함수
function createDefaultHabitEvents(habit: string, availableTime: string, difficulty: string): HabitEvent[] {
  const today = new Date();
  const formatDate = (date: Date) => date.toISOString().split('T')[0];
  
  // 시간대에 따른 기본 시간 설정
  let defaultTime = '09:00-09:30';
  if (availableTime.includes('morning') || availableTime.includes('아침')) {
    defaultTime = '07:00-07:30';
  } else if (availableTime.includes('lunch') || availableTime.includes('점심')) {
    defaultTime = '12:00-12:30';
  } else if (availableTime.includes('evening') || availableTime.includes('저녁')) {
    defaultTime = '18:00-18:30';
  }

  const defaultEvents: HabitEvent[] = [
    {
      startDate: formatDate(today),
      description: `${habit} - 시작 단계 (5분간 가벼운 준비)`,
      time: defaultTime,
      repeat: 3,
      score: 0
    },
    {
      startDate: formatDate(new Date(today.getTime() + 4 * 24 * 60 * 60 * 1000)),
      description: `${habit} - 기본 단계 (10분간 집중 실행)`,
      time: defaultTime,
      repeat: 7,
      score: 0
    },
    {
      startDate: formatDate(new Date(today.getTime() + 11 * 24 * 60 * 60 * 1000)),
      description: `${habit} - 발전 단계 (15분간 심화 실행)`,
      time: defaultTime,
      repeat: 10,
      score: 0
    },
    {
      startDate: formatDate(new Date(today.getTime() + 21 * 24 * 60 * 60 * 1000)),
      description: `${habit} - 완성 단계 (20분간 완전한 습관 실행)`,
      time: defaultTime,
      repeat: 14,
      score: 0
    }
  ];

  console.log('✅ 기본 루틴 생성 완료:', defaultEvents);
  return defaultEvents;
}