import dotenv from 'dotenv';
import fetch from 'node-fetch';

// Load environment variables
dotenv.config();

// Gemini API 설정 파일 (Node.js 백엔드 버전)
// 이 파일은 AI와 대화하기 위한 설정을 담고 있어요

// 프롬프트 텍스트를 이곳에서 관리합니다.
const PROMPTS = {
  kind: `너는 내가 만든 습관 관리 서비스에서 제한된 앱에 접근했을 때 경고 메시지를 보내는 AI야. 메시지는 친절하고 다정한 말투와 내용이어야 해. 상대방을 배려하고 응원하는 느낌으로, 부드럽고 따뜻하게 1줄만 작성해줘.`,
  aggressive: `너는 내가 만든 습관 관리 서비스에서 제한된 앱에 접근했을 때 경고 메시지를 보내는 AI야. 메시지는 공격적이고 매우 심각한 수준의, 비속어와 욕설이 섞인 자극적이고 거친 말투와 내용이어야 해. 
  자기 행동에 경각심을 가질 수 있도록, 가족을 들먹이며 부끄럽지 않냐는 뉘앙스로 1줄만 작성해줘.`,
  boyfriend: `너는 내가 만든 습관 관리 서비스에서 제한된 앱에 접근했을 때 경고 메시지를 보내는 AI야. 메시지는 남자친구가 여자친구에게 보내는 메시지처럼 친밀하고 센스 있는 반말 말투와 내용이어야 해. 
  그러면서 약간 느끼하고 다정한 말투로 1줄만 작성해줘.`
};

// API 키를 환경변수에서 가져옵니다
const API_KEY = process.env.GEMINI_API_KEY;
console.log('--- backend/gemini.js에서 읽은 API_KEY:', API_KEY ? 'API_KEY 로드됨' : 'API_KEY 없음');

// Gemini API 엔드포인트 (작동하는 모델만 사용)
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent';

// 메시지를 보내는 함수 (Node.js 백엔드 버전)
// promptType: 'kind' | 'aggressive' | 'boyfriend' 등 프롬프트 성격 키워드만 받음
export const sendMessage = async (promptType) => {
  try {
    console.log('Gemini 1.5 Flash 모델 사용 중...');
    
    if (!API_KEY) {
      throw new Error('API_KEY가 설정되지 않았습니다. .env 파일에서 GEMINI_API_KEY를 설정해주세요.');
    }
    
    // 프롬프트 텍스트를 내부에서 선택
    const message = PROMPTS[promptType] || '';
    if (!message) {
      throw new Error('유효하지 않은 프롬프트 타입입니다.');
    }

    // API 요청 데이터 준비
    const requestData = {
      contents: [
        {
          role: "user",
          parts: [
            {
              text: message
            }
          ]
        }
      ],
      generationConfig: {
        maxOutputTokens: 100, // AI가 한 번에 최대 100글자까지 답할 수 있어요
        temperature: 1.0, // 창의성 수준 (0.0 ~ 1.0)
      }
    };

    // API 요청 보내기
    const response = await fetch(`${GEMINI_API_URL}?key=${API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestData)
    });

    // 응답 확인
    if (!response.ok) {
      const errorText = await response.text();
      console.error('API 응답 오류:', response.status, errorText);
      throw new Error(`API 요청 실패: ${response.status} - ${errorText}`);
    }

    // 응답 데이터 파싱
    const data = await response.json();
    console.log('Gemini 1.5 Flash 응답 성공!');
    
    // AI 응답 추출
    let aiResponse = '';
    if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts) {
      aiResponse = data.candidates[0].content.parts[0].text;
    } else {
      console.error('응답 형식 오류:', data);
      aiResponse = '죄송해요, 응답을 처리할 수 없어요.';
    }
    
    return aiResponse;
    
  } catch (error) {
    console.error('메시지 전송 중 오류가 발생했어요:', error);
    
    // 구체적인 오류 메시지 제공
    if (error.message.includes('API_KEY')) {
      return 'API 키가 설정되지 않았어요. .env 파일에서 GEMINI_API_KEY를 설정해주세요.';
    } else if (error.message.includes('401')) {
      return 'API 키가 유효하지 않아요. 올바른 API 키를 설정해주세요.';
    } else if (error.message.includes('429')) {
      return '요청이 너무 많아요. 잠시 후 다시 시도해주세요.';
    } else {
      return `죄송해요, 오류가 발생했어요. 인터넷 연결을 확인하고 다시 시도해주세요. (오류: ${error.message})`;
    }
  }
}; 