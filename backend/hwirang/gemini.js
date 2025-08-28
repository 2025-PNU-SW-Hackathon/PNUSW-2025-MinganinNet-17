import Constants from 'expo-constants';

// Get the API key from the app configuration
const API_KEY = Constants.expoConfig?.extra?.geminiApiKey || Constants.manifest?.extra?.geminiApiKey;

// Use the latest available Gemini models
const GEMINI_PRO_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent';
const GEMINI_FLASH_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';

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

    const response = await fetch(`${GEMINI_PRO_API_URL}?key=${API_KEY}`, {
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
 * Sends a message to the Gemini Flash model for fast responses.
 * @param {string} message The text message to send to the AI.
 * @returns {Promise<string>} The AI's text response.
 */
export const sendMessageFlash = async (message) => {
  // 1. Check for the API key before making a request
  if (!API_KEY) {
    console.error('API 키가 없습니다. .env 파일에 GEMINI_API_KEY를 설정하고 앱을 다시 시작하세요.');
    return 'API 키가 설정되지 않았습니다. 관리자에게 문의하세요.';
  }

  // 2. Check for a message
  if (!message) {
    console.error('전송할 메시지가 없습니다.');
    return '전송할 내용이 없습니다.';
  }

  try {
    console.log('Gemini 2.5 Flash 모델에 메시지 전송 중...');

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
        maxOutputTokens: 2048, // Flash 모델은 더 적은 토큰으로도 충분
        temperature: 0.3, // 더 낮은 temperature로 빠르게
      }
    };

    const response = await fetch(`${GEMINI_FLASH_API_URL}?key=${API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestData)
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Flash API 응답 오류:', response.status, errorText);
      throw new Error(`Flash API 요청 실패: ${response.status}`);
    }

    const data = await response.json();
    console.log('Gemini 2.5 Flash 응답을 받았습니다.');

    const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (aiResponse) {
      return aiResponse;
    } else {
      console.error('Flash 응답 형식 오류:', data);
      return '죄송합니다, 응답을 처리하는 데 실패했습니다.';
    }

  } catch (error) {
    console.error('Flash 메시지 전송 중 오류 발생:', error);
    return `오류가 발생했습니다. 인터넷 연결을 확인하거나 다시 시도해주세요.`;
  }
};

/**
 * 간단한 대화용 - Gemini 2.5 Flash 모델 사용
 * @param {string} message 간단한 대화 메시지
 * @returns {Promise<string>} AI 응답
 */
export const sendSimpleMessage = async (message) => {
  return await sendMessageFlash(message); // Flash 모델 사용 (빠른 응답)
};

/**
 * 일간 리포트 피드백 생성 - Gemini 2.5 Pro 모델 사용 (총결산/분석용)
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
    당신은 사용자의 성장을 돕는 따뜻하고 통찰력 있는 AI 코치입니다. 사용자가 작성한 하루 기록을 바탕으로, 내일을 더 잘 보낼 수 있도록 구체적이고 긍정적인 피드백을 생성해주세요.\n\n    **피드백 생성 규칙:**\n    1.  **공감과 격려:** 사용자의 감정에 먼저 공감하고 칭찬과 격려를 아끼지 마세요.\n    2.  **객관적 분석:** 오늘의 할 일 달성률(${achievementScore}/10)과 실제 수행 내역을 바탕으로 객관적인 분석을 포함하세요.\n    3.  **실질적인 조언:** 분석을 바탕으로, 내일을 위해 시도해볼 만한 구체적인 행동 한두 가지를 제안해주세요. 너무 추상적이거나 어려운 조언은 피해주세요.\n    4.  **따뜻한 마무리:** 희망적인 메시지로 마무리해주세요.\n    5.  **형식:** 전체 피드백은 3-4 문단으로 구성되며, 500자를 넘지 않도록 해주세요. 마크다운을 사용하여 가독성을 높여주세요. (예: **, 💡, 🌟)\n\n    ---\n\n    **사용자 기록:**\n    *   **오늘의 소감:** ${userSummary}\n    *   **달성 점수:** ${achievementScore} / 10\n    *   **할 일 목록 (${completedCount}/${totalCount} 완료):**\n        ${todoListString}\n\n    ---\n\n    이제 위의 정보를 바탕으로 따뜻하고 통찰력 있는 피드백을 작성해주세요.\n  `;

  return await sendMessage(prompt);
};

/**
 * 목표 설정 대화 응답 생성 - Gemini 2.5 Pro 모델 사용 (총결산/분석용)
 * The AI will attempt to extract goal-related information from the user's message
 * and will return both a conversational text response and a JSON object with the extracted data.
 * @param {Array<object>} conversationHistory - The history of the conversation.
 * @param {object} currentGoalData - The goal data collected so far.
 * @returns {Promise<{textResponse: string, goalData: object}>}
 */
export const generateGoalSettingResponse = async (conversationHistory, currentGoalData) => {
  const historyString = conversationHistory.map(turn => `${turn.type}: ${turn.content}`).join('\n');

  const prompt = `
    You are Routy, a friendly and professional AI coach helping a user set a goal. Your task is to have a natural, free-flowing conversation while extracting key information.\n\n    **Goal Information to Collect (as a JSON object):**\n    - goal (string): The user's specific, measurable goal.\n    - period (string): The timeframe for achieving the goal (e.g., "3 months", "end of the year").\n    - time_slot (string): When the user plans to work on the goal (e.g., "every morning", "weekends").\n    - difficulty (string): What challenges the user anticipates (e.g., "lack of motivation", "busy schedule").\n    - coaching_intensity ('high', 'medium', 'low'): The level of coaching the user wants.\n    - allDataCollected (boolean): Set to true ONLY when all other 5 fields are non-empty.\n    - confirmationStatus ('pending', 'confirmed', 'denied'): Your status for the final confirmation step.\n\n    **Current State:**\n    - Conversation History:\n    ${historyString}\n    - Data Collected So Far:\n    ${JSON.stringify(currentGoalData, null, 2)}\n\n    **Your Instructions:**\n    1.  Analyze the last user message to extract information for the JSON fields.\n    2.  If \`allDataCollected\` is false, ask a friendly, open-ended question to get the NEXT SINGLE piece of missing information.\n    3.  If \`allDataCollected\` is true, your ONLY job is to ask for final confirmation. Your \`textResponse\` MUST be a simple confirmation question like: "모든 정보가 수집되었어요! 이대로 목표를 확정할까요?"\n    4.  If the user's last message is a confirmation ("yes", "ok", "confirm"), set \`confirmationStatus\` to "confirmed".\n    5.  Your entire output MUST be a single, valid JSON object, starting with { and ending with }. Do NOT wrap it in markdown backticks or any other text.\n\n    **Response Format (MUST BE A SINGLE VALID JSON OBJECT):**\n    {\n      "textResponse": "Your conversational reply to the user. This is the ONLY part the user will see.",\n      "goalData": { ...updated goal data object... }\n    }\n  `;

  const responseText = await sendMessage(prompt); // Pro 모델 사용 (총결산/분석용)
  
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

/**
 * Sends a message to the Gemini API with streaming support.
 * @param {string} prompt The text message to send to the AI.
 * @param {AbortSignal} signal Optional abort signal for cancellation.
 * @param {function} onChunk Optional callback for streaming chunks.
 * @returns {Promise<string>} The complete AI response.
 */
export const sendMessageStream = async (prompt, signal, onChunk) => {
  // 1. Check for the API key before making a request
  if (!API_KEY) {
    console.error('API 키가 없습니다. .env 파일에 GEMINI_API_KEY를 설정하고 앱을 다시 시작하세요.');
    return 'API 키가 설정되지 않았습니다. 관리자에게 문의하세요.';
  }

  // 2. Check for a message
  if (!prompt) {
    console.error('전송할 메시지가 없습니다.');
    return '전송할 내용이 없습니다.';
  }

  try {
    console.log('Gemini 2.5 Pro 스트리밍 모델에 메시지 전송 중...');

    const requestData = {
      contents: [
        {
          role: "user",
          parts: [
            {
              text: prompt
            }
          ]
        }
      ],
      generationConfig: {
        maxOutputTokens: 8192,
        temperature: 0.5,
      }
    };

    // 일반 API 호출로 응답 받기
    const response = await fetch(`${GEMINI_API_URL}?key=${API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestData),
      signal: signal
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('API 응답 오류:', response.status, errorText);
      throw new Error(`API 요청 실패: ${response.status}`);
    }

    const data = await response.json();
    const aiResponse = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!aiResponse) {
      console.error('응답 형식 오류:', data);
      return '죄송합니다, 응답을 처리하는 데 실패했습니다.';
    }

    // 스트리밍 효과를 시뮬레이션 (더 빠르게)
    let fullResponse = '';
    const words = aiResponse.split(' ');
    
    for (let i = 0; i < words.length; i++) {
      const chunk = words[i] + (i < words.length - 1 ? ' ' : '');
      fullResponse += chunk;
      
      // 콜백이 있으면 호출
      if (onChunk) {
        onChunk(chunk, fullResponse);
      }
      
      // 더 빠른 스트리밍 효과 생성
      await new Promise(resolve => setTimeout(resolve, 20));
      
      // 취소 신호 확인
      if (signal && signal.aborted) {
        console.log('스트리밍 요청이 취소되었습니다.');
        return '';
      }
    }

    console.log('스트리밍 응답 완료');
    return fullResponse;

  } catch (error) {
    console.error('스트리밍 메시지 전송 중 오류 발생:', error);
    
    // AbortError는 취소된 것이므로 특별 처리
    if (error.name === 'AbortError') {
      console.log('스트리밍 요청이 취소되었습니다.');
      return '';
    }
    
    return `오류가 발생했습니다. 인터넷 연결을 확인하거나 다시 시도해주세요.`;
  }
};

/**
 * Extracts structured goal data from a conversation transcript.
 * @param {string} transcript The full conversation transcript.
 * @returns {Promise<object>} A JSON object with the extracted goal data.
 */
export const extractGoalFromTranscript = async (transcript) => {
  const prompt = `
    You are a data extraction specialist. Your task is to analyze the following conversation transcript between an AI coach (Routy) and a user, and extract the specified goal-setting information into a valid JSON object.\n\n    **Conversation Transcript:**\n    ---\n    ${transcript}\n    ---\n\n    **JSON fields to extract:**\n    - "habitName": (string) The user's main goal.\n    - "goalPeriod": (string) The timeframe for the goal (e.g., "3개월", "1년").\n    - "availableTime": (string) The time the user can work on the goal, in HH:mm-HH:mm format (e.g., "08:00-09:00", "21:00-22:30").\n    - "difficultyReason": (string) The main challenge the user anticipates.\n    - "intensity": (string) The coaching intensity level. Must be one of '높음', '보통', '낮음'.\n\n    **Instructions:**\n    1.  Read the entire transcript carefully to understand the context.\n    2.  Fill in each JSON field with the most relevant information provided by the user.\n    3.  If a piece of information is not mentioned, leave the field as an empty string "".\n    4.  Your entire output MUST be a single, valid JSON object, starting with { and ending with }. Do not add any explanatory text or markdown.\n\n    **Example Output:**\n    {\n      "habitName": "매일 30분씩 책 읽기",\n      "goalPeriod": "3개월",\n      "availableTime": "22:00-22:30",\n      "difficultyReason": "자꾸 잊어버림",\n      "intensity": "보통"\n    }\n  `;

  const responseText = await sendMessage(prompt); // Use Gemini Pro for quality extraction

  try {
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    throw new Error("No valid JSON object found in the AI response.");
  } catch (error) {
    console.error("Failed to parse extracted goal data as JSON:", error, "Raw response:", responseText);
    // Return a default error object or re-throw
    throw new Error('Failed to process the conversation.');
  }
};

/**
 * Generates AI coach response for daily reflection chat conversation.
 * @param {Array<object>} messages Array of conversation messages with {role, content, timestamp}.
 * @param {Array<object>} todos Today's todo items with completion status.
 * @param {number} achievementScore User's self-assessed achievement score (1-10).
 * @returns {Promise<string>} AI coach response.
 */
export const generateDailyReflectionChatResponse = async (messages, todos, achievementScore) => {
  const completedCount = todos.filter(t => t.completed).length;
  const totalCount = todos.length;
  
  const conversationHistory = messages.map(msg => 
    `${msg.role === 'user' ? '사용자' : 'AI 코치'}: ${msg.content}`
  ).join('\n');

  const todoListString = todos.map(t => 
    `- ${t.description} (${t.completed ? '완료✅' : '미완료❌'})`
  ).join('\n');

  const prompt = `
당신은 '루티(Routy)'라는 이름의 따뜻하고 공감적인 AI 코치입니다. 사용자와 자연스러운 대화를 통해 하루를 돌아보고 내일을 위한 인사이트를 제공하는 것이 목표입니다.

**대화 상황:**
- 사용자의 오늘 달성 점수: ${achievementScore}/10
- 할 일 완료 현황: ${completedCount}/${totalCount}개 완료
- 할 일 목록:
${todoListString}

**지금까지의 대화:**
${conversationHistory}

**대화 원칙:**
1. **자연스러운 대화**: 마치 친근한 코치와 대화하는 것처럼 자연스럽고 편안하게
2. **깊이 있는 질문**: 단순한 사실 수집을 넘어서 감정, 배운 점, 의미 등을 탐구
3. **공감과 격려**: 사용자의 경험과 감정에 공감하며 긍정적인 에너지 제공
4. **점진적 탐구**: 한 번에 너무 많은 것을 묻지 말고, 사용자의 답변에 따라 자연스럽게 이어가기
5. **개인화된 접근**: 할 일 완료 현황을 참고하여 구체적이고 개인화된 질문과 피드백

**탐구할 영역들 (자연스럽게 대화 중에 포함):**
- 오늘의 주요 경험과 감정
- 할 일을 완료하거나 완료하지 못한 이유와 그때의 기분
- 예상과 다르게 진행된 일들
- 배운 점이나 깨달은 점
- 어려웠던 순간과 그것을 어떻게 극복했는지
- 뿌듯했거나 기묤던 순간들
- 내일 더 잘하기 위한 아이디어나 계획

**응답 스타일:**
- 300자 이내의 간결하고 따뜻한 응답
- 이모지 적절히 사용 (🤔💭✨😊💪 등)
- 열린 질문을 통해 대화를 이어가기
- 사용자의 답변에 구체적으로 반응하기

이제 사용자의 마지막 메시지에 자연스럽고 공감적으로 응답해주세요.
  `;

  return await sendMessageFlash(prompt); // Flash 모델 사용 (빠른 응답)
};

/**
 * Detects if the daily reflection conversation is complete and ready for final analysis.
 * @param {Array<object>} messages Array of conversation messages.
 * @param {number} minimumExchanges Minimum number of user-AI exchanges required.
 * @returns {Promise<object>} {isComplete: boolean, reason: string, completionScore: number}
 */
export const evaluateDailyReflectionCompletion = async (messages, minimumExchanges = 4) => {
  const userMessages = messages.filter(msg => msg.role === 'user');
  const totalWords = userMessages.reduce((sum, msg) => sum + msg.content.split(' ').length, 0);
  
  const conversationHistory = messages.map(msg => 
    `${msg.role === 'user' ? '사용자' : 'AI 코치'}: ${msg.content}`
  ).join('\n');

  const prompt = `
당신은 대화 분석 전문가입니다. 다음 일간 성찰 대화가 충분히 완료되었는지 평가해주세요.

**대화 내용:**
${conversationHistory}

**통계:**
- 사용자 메시지 수: ${userMessages.length}
- 총 단어 수: ${totalWords}
- 최소 요구 교환 수: ${minimumExchanges}

**평가 기준:**
1. **충분한 대화량**: 최소 ${minimumExchanges}번의 사용자-AI 교환이 있었는가?
2. **감정적 깊이**: 사용자가 감정이나 느낌을 표현했는가?
3. **구체적 경험**: 오늘의 구체적인 경험이나 상황을 공유했는가?
4. **성찰의 질**: 단순한 사실 나열을 넘어서 의미나 배운 점을 언급했는가?
5. **미래 지향**: 내일이나 앞으로에 대한 생각을 언급했는가?

**응답 형식 (반드시 유효한 JSON):**
{
  "isComplete": true/false,
  "reason": "완료/미완료 이유 설명",
  "completionScore": 0-100,
  "missingAspects": ["부족한 영역들"]
}

예시:
{
  "isComplete": true,
  "reason": "사용자가 충분한 감정적 깊이와 구체적 경험을 공유했으며, 내일에 대한 계획도 언급했습니다.",
  "completionScore": 85,
  "missingAspects": []
}
  `;

  const responseText = await sendMessage(prompt);
  
  try {
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    throw new Error("No valid JSON found in response");
  } catch (error) {
    console.error("Failed to parse completion evaluation:", error);
    // Fallback evaluation based on simple metrics
    const isComplete = userMessages.length >= minimumExchanges && totalWords >= 50;
    return {
      isComplete,
      reason: isComplete ? "기본 조건 충족" : "더 많은 대화 필요",
      completionScore: Math.min(100, (userMessages.length / minimumExchanges) * 50 + (totalWords / 100) * 50),
      missingAspects: isComplete ? [] : ["더 많은 대화 필요"]
    };
  }
};

/**
 * Generates final comprehensive analysis from the daily reflection conversation.
 * @param {Array<object>} messages Array of conversation messages.
 * @param {Array<object>} todos Today's todo items.
 * @param {number} achievementScore User's self-assessed score.
 * @returns {Promise<string>} Comprehensive daily reflection summary.
 */
export const generateFinalDailyReflectionSummary = async (messages, todos, achievementScore) => {
  const completedCount = todos.filter(t => t.completed).length;
  const totalCount = todos.length;
  
  const conversationHistory = messages.map(msg => 
    `${msg.role === 'user' ? '사용자' : 'AI 코치'}: ${msg.content}`
  ).join('\n');

  const todoListString = todos.map(t => 
    `- ${t.description} (${t.completed ? '완료✅' : '미완료❌'})`
  ).join('\n');

  const prompt = `
당신은 전문적인 성장 코치입니다. 사용자와의 깊이 있는 대화를 바탕으로 종합적인 일간 성찰 분석을 제공해주세요.

**대화 전체:**
${conversationHistory}

**객관적 데이터:**
- 자체 평가 점수: ${achievementScore}/10
- 할 일 완료: ${completedCount}/${totalCount}개
- 할 일 목록:
${todoListString}

**분석 요청사항:**
1. **감정 상태 분석**: 오늘 사용자가 경험한 주요 감정들
2. **성취와 도전**: 잘한 점과 어려웠던 점 분석
3. **성장 포인트**: 대화에서 드러난 배운 점이나 깨달음
4. **내일을 위한 제안**: 구체적이고 실행 가능한 개선점 2-3가지
5. **격려 메시지**: 따뜻하고 희망적인 마무리

**응답 형식:**
마크다운 형식으로 작성하되, 전체 분석은 800자를 넘지 않도록 해주세요.
각 섹션은 2-3문장으로 간결하게 정리해주세요.
이모지를 적절히 사용하여 가독성을 높여주세요.

이제 위의 대화를 바탕으로 종합적이고 통찰력 있는 일간 성찰 분석을 작성해주세요.
  `;

  return await sendMessage(prompt); // Pro 모델 사용 (종합 분석)
};

/**
 * Parses a natural language command to modify a to-do list.
 * @param {string} command The natural language command from the user.
 * @returns {Promise<object>} A structured action object.
 */
export const parsePlanModificationCommand = async (command) => {
  const today = new Date().toISOString().split('T')[0];

  const prompt = `
    You are a command parsing AI. Your task is to convert the user's natural language request into a structured JSON object. Today is ${today}.\n\n    **Supported Actions:**\n    - "add_todo": Add a new to-do item.\n    - "complete_todo": Mark a to-do item as completed.\n    - "remove_todo": Remove a to-do item.\n    - "create_report": Initiate the daily report creation process.\n    - "unknown": If the command is unclear or not related to the above actions.\n\n    **JSON Output Structure:**\n    - For to-do actions: {"action": "<action_name>", "payload": {"date": "YYYY-MM-DD", "description": "<to-do description>"}}\n    - For report action: {"action": "create_report", "payload": {}}\n\n    **Instructions:**\n    1.  Analyze the user's command: "${command}"\n    2.  Determine the primary action.\n    3.  If the action is for a to-do, determine the target date (default to today) and extract the description.\n    4.  If the user wants to create a report (e.g., "리포트 작성"), use the "create_report" action.\n    5.  Return a single, valid JSON object. Do not add any other text.\n\n    **Examples:**\n    - Command: "내일 30분 운동 추가해줘"\n      Output: {"action": "add_todo", "payload": {"date": "<tomorrow's_date>", "description": "30분 운동"}}\n    - Command: "오늘 책 읽기 완료했어"\n      Output: {"action": "complete_todo", "payload": {"date": "${today}", "description": "책 읽기"}}\n    - Command: "리포트 작성하기"\n      Output: {"action": "create_report", "payload": {}}\n  `;

  const responseText = await sendMessage(prompt);

  try {
    const jsonMatch = responseText.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      // Replace placeholder for tomorrow's date
      let jsonString = jsonMatch[0];
      if (jsonString.includes("<tomorrow's_date>")) {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowString = tomorrow.toISOString().split('T')[0];
        jsonString = jsonString.replace("<tomorrow's_date>", tomorrowString);
      }
      return JSON.parse(jsonString);
    }
    throw new Error("No valid JSON object found in the AI response.");
  } catch (error) {
    console.error("Failed to parse command data as JSON:", error, "Raw response:", responseText);
    throw new Error('Failed to process the command.');
  }
};
