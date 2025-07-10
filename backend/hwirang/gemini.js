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

/**
 * Generates AI feedback for a daily report.
 * @param {string} userSummary User's summary of the day.
 * @param {number} achievementScore Score from 1 to 10.
 * @param {Array<object>} todos List of todo items with { description, completed } shape.
 * @returns {Promise<string>} AI-generated feedback.
 */
export const generateDailyFeedback = async (userSummary, achievementScore, todos) => {
  const completedCount = todos.filter(t => t.completed).length;
  const totalCount = todos.length;

  const todoListString = todos.map(t => 
    `- ${t.description} (${t.completed ? '완료' : '미완료'})`
  ).join('\n');

  const prompt = `
    당신은 사용자의 성장을 돕는 따뜻하고 통찰력 있는 AI 코치입니다. 사용자가 작성한 하루 기록을 바탕으로, 내일을 더 잘 보낼 수 있도록 구체적이고 긍정적인 피드백을 생성해주세요.

    **피드백 생성 규칙:**
    1.  **공감과 격려:** 사용자의 감정에 먼저 공감하고 칭찬과 격려를 아끼지 마세요.
    2.  **객관적 분석:** 오늘의 할 일 달성률(${achievementScore}/10)과 실제 수행 내역을 바탕으로 객관적인 분석을 포함하세요.
    3.  **실질적인 조언:** 분석을 바탕으로, 내일을 위해 시도해볼 만한 구체적인 행동 한두 가지를 제안해주세요. 너무 추상적이거나 어려운 조언은 피해주세요.
    4.  **따뜻한 마무리:** 희망적인 메시지로 마무리해주세요.
    5.  **형식:** 전체 피드백은 3-4 문단으로 구성되며, 500자를 넘지 않도록 해주세요. 마크다운을 사용하여 가독성을 높여주세요. (예: **, 💡, 🌟)

    ---

    **사용자 기록:**
    *   **오늘의 소감:** ${userSummary}
    *   **달성 점수:** ${achievementScore} / 10
    *   **할 일 목록 (${completedCount}/${totalCount} 완료):**
        ${todoListString}

    ---

    이제 위의 정보를 바탕으로 따뜻하고 통찰력 있는 피드백을 작성해주세요.
  `;

  return await sendMessage(prompt);
};