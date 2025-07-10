import Constants from 'expo-constants';

// Get the API key from the app configuration
const API_KEY = Constants.expoConfig?.extra?.geminiApiKey;

// Use the latest available Gemini model
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent';

/**
 * Sends a message to the Gemini API.
 * @param {string} message The text message to send to the AI.
 * @returns {Promise<string>} The AI's text response.
 */
export const sendMessage = async (message) => {
  // 1. Check for the API key before making a request
  if (!API_KEY) {
    console.error('API 키가 없습니다. .env 파일에 GEMINI_API_KEY를 설정하고 앱을 다시 시작하세요.');
    // Return a user-friendly error message
    return 'API 키가 설정되지 않았습니다. 관리자에게 문의하세요.';
  }

  // 2. Check for a message
  if (!message) {
    console.error('전송할 메시지가 없습니다.');
    return '전송할 내용이 없습니다.';
  }

  try {
    console.log('Gemini 2.5 Pro 모델에 메시지 전송 중...');

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
        maxOutputTokens: 8192,
        temperature: 0.5,
      }
    };

    const response = await fetch(`${GEMINI_API_URL}?key=${API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestData)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API 응답 오류:', response.status, errorText);
      throw new Error(`API 요청 실패: ${response.status}`);
    }

    const data = await response.json();
    console.log('Gemini 2.5 Pro 응답을 받았습니다.');

    const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (aiResponse) {
      return aiResponse;
    } else {
      console.error('응답 형식 오류:', data);
      return '죄송합니다, 응답을 처리하는 데 실패했습니다.';
    }

  } catch (error) {
    console.error('메시지 전송 중 오류 발생:', error);
    return `오류가 발생했습니다. 인터넷 연결을 확인하거나 다시 시도해주세요.`;
  }
};