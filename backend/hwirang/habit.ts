import { sendMessage } from './gemini';

// AI로부터 받은 eventJson 객체를 변환하는 함수
export function transformEventJsonToHabitData(eventJson: any) {
  // description을 // 구분자로 나누어 루틴 배열 생성
  const routines = eventJson.description
    .split('//')
    .map((routine: string) => routine.trim())
    .filter((routine: string) => routine.length > 0);

  // 변환된 데이터 반환
  return {
    summary: eventJson.summary,
    routines: routines,
    start: eventJson.start,
    end: eventJson.end,
    recurrence: eventJson.recurrence
  };
}

// 습관 입력 정보를 바탕으로 프롬프트를 생성하고, AI에게 전송해 응답을 받아오는 함수
export async function submitHabitData(habit: string, availableTime: string, difficulty: string) {
  // 프롬프트 생성
  const prompt = `나는 '${habit}'이라는 습관을 만들고 싶어. 하루 중 '${availableTime}'에 이 습관을 할 수 있어. 습관을 만들 때 '${difficulty}' 같은 어려움이 있어. 이 정보를 바탕으로 구글 캘린더에 바로 추가할 수 있는 JSON 형식의 이벤트 데이터를 생성해줘. 
  
  이벤트 내용은 실행 여부를 명확히 판단할 수 있는 루틴으로 짜줘. 
  description에 그 루틴에 대한 추가 설명은 넣지마. 
  수행하는 순서에 따라 '//'으로 구분해서 순차적으로 작성해줘.
  반드시 아래의 json 형식을 사용해 예시를 복사하지 말고, 설명없이 JSON만 반환해.
  {
    "summary": "이벤트 제목",
    "description": "이벤트에 대한 상세 설명 ",
    "start":  {   "dateTime": "YYYY-MM-DDTHH:MM:SS+09:00",    "timeZone": "Asia/Seoul"  }, 
    "end":    {   "dateTime": "YYYY-MM-DDTHH:MM:SS+09:00",    "timeZone": "Asia/Seoul"  }, 
    "recurrence": [   "RRULE:FREQ=DAILY;COUNT=5"  ]
  } `;

  try {
    // AI에게 요청을 보내고 JSON 응답 받기
    const aiResponse = await sendMessage(prompt);
    // console.log('AI 원본 응답:', aiResponse);
    
    // AI 원본 응답을 별도 변수에 저장
    const originalAIResponse = aiResponse;
    
    // 마크다운 코드 블록 제거하고 순수한 JSON 추출
    let jsonString = aiResponse;
    
    // ```json으로 시작하고 ```로 끝나는 경우 제거
    if (jsonString.includes('```json')) {
      jsonString = jsonString.replace(/```json\s*/, '').replace(/\s*```$/, '');
    }
    // ```로 시작하고 ```로 끝나는 경우 제거
    else if (jsonString.includes('```')) {
      jsonString = jsonString.replace(/```\s*/, '').replace(/\s*```$/, '');
    }
    
    // JSON 객체만 추출 (중괄호로 시작하고 끝나는 부분)
    const jsonMatch = jsonString.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      jsonString = jsonMatch[0];
    }
    
    // console.log('정제된 JSON 문자열:', jsonString);
    
    // AI 응답을 JSON으로 파싱
    const eventJson = JSON.parse(jsonString);
    console.log('파싱된 JSON:', eventJson);
    
    // JSON을 습관 데이터로 변환
    const habitData = transformEventJsonToHabitData(eventJson);
    console.log('변환된 습관 데이터:', habitData);
    
    // 원본 AI 응답과 변환된 데이터를 함께 반환
    return habitData
  
  } catch (error) {
    console.error('습관 데이터 처리 중 오류 발생:', error);
    const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
    console.error('오류 상세 정보:', errorMessage);
    throw new Error(`AI 응답을 처리하는 중 오류가 발생했습니다: ${errorMessage}`);
  }
} 