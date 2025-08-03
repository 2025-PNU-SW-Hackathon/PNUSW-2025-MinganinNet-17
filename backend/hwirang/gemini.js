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

/**
 * Generates an AI response for the goal-setting conversation.
 * The AI will attempt to extract goal-related information from the user's message
 * and will return both a conversational text response and a JSON object with the extracted data.
 * @param {Array<object>} conversationHistory - The history of the conversation.
 * @param {object} currentGoalData - The goal data collected so far.
 * @returns {Promise<{textResponse: string, goalData: object}>}
 */
export const generateGoalSettingResponse = async (conversationHistory, currentGoalData) => {
  const historyString = conversationHistory.map(turn => `${turn.type}: ${turn.content}`).join('\n');

  const prompt = `
    You are Routy, a friendly and professional AI coach helping a user set a goal. Your task is to have a natural, free-flowing conversation while extracting key information.

    **Goal Information to Collect (as a JSON object):**
    - goal (string): The user's specific, measurable goal.
    - period (string): The timeframe for achieving the goal (e.g., "3 months", "end of the year").
    - time_slot (string): When the user plans to work on the goal (e.g., "every morning", "weekends").
    - difficulty (string): What challenges the user anticipates (e.g., "lack of motivation", "busy schedule").
    - coaching_intensity ('high', 'medium', 'low'): The level of coaching the user wants.
    - allDataCollected (boolean): Set to true ONLY when all other 5 fields are non-empty.
    - confirmationStatus ('pending', 'confirmed', 'denied'): Your status for the final confirmation step.

    **Current State:**
    - Conversation History:
    ${historyString}
    - Data Collected So Far:
    ${JSON.stringify(currentGoalData, null, 2)}

    **Your Instructions:**
    1.  Analyze the last user message to extract information for the JSON fields.
    2.  If \`allDataCollected\` is false, ask a friendly, open-ended question to get the NEXT SINGLE piece of missing information.
    3.  If \`allDataCollected\` is true, your ONLY job is to ask for final confirmation. Your \`textResponse\` MUST be a simple confirmation question like: "모든 정보가 수집되었어요! 이대로 목표를 확정할까요?"
    4.  If the user's last message is a confirmation ("yes", "ok", "confirm"), set \`confirmationStatus\` to "confirmed".
    5.  Your entire output MUST be a single, valid JSON object, starting with { and ending with }. Do NOT wrap it in markdown backticks or any other text.

    **Response Format (MUST BE A SINGLE VALID JSON OBJECT):**
    {
      "textResponse": "Your conversational reply to the user. This is the ONLY part the user will see.",
      "goalData": { ...updated goal data object... }
    }
  `;

  const responseText = await sendMessage(prompt);
  
  try {
    // Defensive parsing to handle markdown or other text
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    throw new Error("No valid JSON object found in the response.");
  } catch (error) {
    console.error("Failed to parse AI response as JSON:", error, "Raw response:", responseText);
    return {
      textResponse: "죄송합니다, 답변을 처리하는 데 문제가 발생했어요. 다시 한 번 말씀해주시겠어요?",
      goalData: currentGoalData,
    };
  }
};
