// 프롬프트 관리 파일
// 이 파일은 경고 메시지 프롬프트를 관리하고 AI에게 요청을 보냅니다.

import { sendMessage } from './gemini';

// 프롬프트 텍스트를 이곳에서 관리합니다.
const PROMPTS = {
  kind: `너는 내가 만든 습관 관리 서비스에서 제한된 앱에 접근했을 때 경고 메시지를 보내는 AI야. 메시지는 친절하고 다정한 말투와 내용이어야 해. 상대방을 배려하고 응원하는 느낌으로, 부드럽고 따뜻하게 1줄만 작성해줘.`,
  aggressive: `너는 내가 만든 습관 관리 서비스에서 제한된 앱에 접근했을 때 경고 메시지를 보내는 AI야. 메시지는 공격적이고 자극적인 말투와 내용이어야 해. 자기 행동에 경각심을 가질 수 있도록, 가족을 들먹이며 부끄럽지 않냐는 뉘앙스로 1줄만 작성해줘.`
};

// 프롬프트 타입에 따라 AI에게 요청을 보내고 응답을 반환하는 함수
export const getAIResponse = async (promptType) => {
  let prompt = '';
  
  if (PROMPTS[promptType]) {
    prompt = PROMPTS[promptType];
  } else {
    // 정의되지 않은 타입이거나 직접 문자열이 전달된 경우
    prompt = promptType;
  }
  
  // AI에게 요청을 보내고 응답을 반환
  const aiResponse = await sendMessage(prompt);
  return aiResponse;
};
