// Gemini API 설정 파일 (React Native 호환 버전)
// 이 파일은 AI와 대화하기 위한 설정을 담고 있어요
import Constants from 'expo-constants';

// API 키를 여기에 넣어주세요 (실제 사용할 때는 환경변수로 관리하는 것이 좋아요)
const API_KEY = Constants.expoConfig.extra.geminiApiKey // 여기에 실제 API 키를 넣어주세요

// Gemini API 엔드포인트 (작동하는 모델만 사용)
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent';

// 메시지를 보내는 함수 (React Native 호환)
// message: AI에게 전송할 메시지 문자열
export const sendMessage = async (message) => {
  try {
    console.log('Gemini 2.5 Pro 모델 사용 중...');
    
    if (!message) {
      throw new Error('전송할 메시지가 없습니다.');
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
        maxOutputTokens: 8192, // AI가 한 번에 최대 8192글자까지 답할 수 있어요
        temperature: 0.5, // 창의성 수준 (0.0 ~ 1.0)
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
    console.log('Gemini 2.5 Pro 응답 전문:', JSON.stringify(data, null, 2));
    console.log('Gemini 2.5 Pro 응답 성공!');
    
    // AI 응답 추출
    let aiResponse = '';
    if (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts && data.candidates[0].content.parts[0].text) {
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
      return 'API 키가 설정되지 않았어요. config/gemini.js 파일에서 API 키를 설정해주세요.';
    } else if (error.message.includes('401')) {
      return 'API 키가 유효하지 않아요. 올바른 API 키를 설정해주세요.';
    } else if (error.message.includes('429')) {
      return '요청이 너무 많아요. 잠시 후 다시 시도해주세요.';
    } else {
      return `죄송해요, 오류가 발생했어요. 인터넷 연결을 확인하고 다시 시도해주세요. (오류: ${error.message})`;
    }
  }
};

// 사용 예시:
// import { sendMessage } from './gemini.js';
// import { getPrompt } from './prompts.js';
//
// // 고정된 프롬프트 사용
// const kindPrompt = getPrompt('kind');
// const response1 = await sendMessage(kindPrompt);
//
// // 직접 메시지 전송
// const response2 = await sendMessage('안녕하세요!'); 