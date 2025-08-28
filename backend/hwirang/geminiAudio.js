import Constants from 'expo-constants';
import { addSafetyInstructions } from './aiSafety';
import { generateNativeAudio } from './geminiLiveAudio';

// API 설정
const API_KEY = Constants.expoConfig?.extra?.geminiApiKey || Constants.manifest?.extra?.geminiApiKey;

// Gemini API 엔드포인트들 - 용도별 모델 분리
const GEMINI_PRO_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro:generateContent';
const GEMINI_FLASH_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';
const GEMINI_2_5_TTS_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-live-2.5-flash-preview:generateContent';
// Live API는 geminiLiveAudio.js에서 처리

// Google Cloud TTS API 엔드포인트
const GOOGLE_TTS_URL = 'https://texttospeech.googleapis.com/v1/text:synthesize';

// 요청 제한을 위한 변수들
let lastRequestTime = 0;
const MIN_REQUEST_INTERVAL = 100; // 0.1초 간격으로 요청 제한 (매우 빠르게)

/**
 * 요청 제한 함수 - API 할당량 초과 방지
 */
function checkRequestLimit() {
  const now = Date.now();
  if (now - lastRequestTime < MIN_REQUEST_INTERVAL) {
    const waitTime = MIN_REQUEST_INTERVAL - (now - lastRequestTime);
    console.log(`⏳ 요청 제한: ${waitTime}ms 대기 중...`);
    return new Promise(resolve => setTimeout(resolve, waitTime));
  }
  lastRequestTime = now;
  return Promise.resolve();
}

/**
 * Converts audio file to base64 string
 * @param {string} audioUri - URI of the audio file
 * @returns {Promise<string>} Base64 encoded audio data
 */
export const audioToBase64 = async (audioUri) => {
  try {
    const response = await fetch(audioUri);
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result.split(',')[1]; // Remove data:audio/wav;base64, prefix
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('Audio to base64 conversion error:', error);
    throw error;
  }
};

/**
 * Sends audio message or text to Gemini 2.5 Pro model for voice conversation
 * @param {string} audioUri - URI of the recorded audio file (optional if textInput provided)
 * @param {string} conversationContext - Context about the conversation (goal setting, report, etc.)
 * @param {string} step - Current step in the conversation
 * @param {string} textInput - Text input (optional if audioUri provided)
 * @returns {Promise<{text: string, audio?: string}>} AI response with text and optional audio
 */
export const sendAudioMessage = async (audioUri, conversationContext, step, textInput = null) => {
  if (!API_KEY) {
    console.error('API 키가 없습니다. .env 파일에 GEMINI_API_KEY를 설정하고 앱을 다시 시작하세요.');
    return {
      text: 'API 키가 설정되지 않았습니다. 관리자에게 문의하세요.',
      error: true
    };
  }

  if (!audioUri && !textInput) {
    console.error('전송할 오디오나 텍스트가 없습니다.');
    return {
      text: '음성이나 텍스트 입력이 없습니다.',
      error: true
    };
  }

  try {
    console.log('Gemini 2.5 Flash Live 모델에 메시지 전송 중...');

    // Live API를 사용하여 음성 처리
    const systemInstruction = addSafetyInstructions(getConversationPrompt(conversationContext, step));
    
    let userInput = '';
    if (textInput) {
      userInput = textInput;
    } else if (audioUri) {
      // 오디오가 있는 경우 텍스트로 변환 (음성 인식 결과 사용)
      userInput = "음성 입력이 제공되었습니다.";
    }

    // Live API를 사용하여 네이티브 오디오 생성
    const audioData = await generateNativeAudio(userInput, systemInstruction);
    
    if (audioData && audioData.text) {
      console.log('Gemini 2.5 Flash Live 응답을 받았습니다.');
      return {
        text: audioData.text,
        audioData: audioData.audioData,
        error: false
      };
    } else {
      console.error('Live API 응답 형식 오류:', audioData);
      return {
        text: '죄송합니다, 응답을 처리하는 데 실패했습니다.',
        error: true
      };
    }

  } catch (error) {
    console.error('음성 메시지 전송 중 오류 발생:', error);
    return {
      text: `오류가 발생했습니다. 인터넷 연결을 확인하거나 다시 시도해주세요.`,
      error: true
    };
  }
};

/**
 * Gets conversation prompt based on context and step
 * @param {string} context - Conversation context ('goal-setting', 'daily-report', 'weekly-report')
 * @param {string} step - Current step in the conversation
 * @returns {string} Conversation prompt
 */
const getConversationPrompt = (context, step) => {
  const basePrompt = "당신은 사용자의 습관 관리와 목표 달성을 돕는 친근하고 따뜻한 AI 코치입니다. 사용자와 자연스러운 대화를 통해 정보를 수집하고 조언을 제공해주세요. 응답은 한국어로 하며, 친근하고 격려하는 톤을 유지해주세요.";

  switch (context) {
    case 'goal-setting':
      return getGoalSettingPrompt(step);
    case 'daily-report':
      return getDailyReportPrompt(step);
    case 'weekly-report':
      return getWeeklyReportPrompt(step);
    default:
      return basePrompt;
  }
};

/**
 * Goal setting conversation prompts
 */
const getGoalSettingPrompt = (step) => {
  const prompts = {
    'step1': `
      ${getBasePrompt()}
      
      현재 사용자와 목표 설정 대화를 진행하고 있습니다. 첫 번째 단계로, 사용자가 이루고 싶은 습관이나 목표가 무엇인지 알아보려고 합니다.
      
      사용자의 음성을 듣고:
      1. 사용자가 말한 목표나 습관을 파악해주세요
      2. 구체적이지 않다면 더 명확하게 할 수 있도록 도와주세요
      3. 긍정적이고 격려하는 말투로 응답해주세요
      4. 다음 질문을 자연스럽게 유도해주세요 (시간대, 기간 등)
      
      응답 길이: 2-3문장으로 간결하게 답변해주세요.
    `,
    'step2': `
      ${getBasePrompt()}
      
      목표 설정의 두 번째 단계입니다. 사용자의 습관 실행 시간과 프로젝트 기간에 대해 알아보려고 합니다.
      
      사용자의 음성을 듣고:
      1. 언제 이 습관을 실행하고 싶은지 (시간대)
      2. 얼마나 오랫동안 진행하고 싶은지 (기간)
      3. 하루에 얼마나 시간을 투자할 수 있는지
      
      이 정보들을 자연스럽게 대화로 알아내주세요.
      
      응답 길이: 2-3문장으로 간결하게 답변해주세요.
    `,
    'step3': `
      ${getBasePrompt()}
      
      목표 설정의 세 번째 단계입니다. 사용자가 이 목표를 달성하기 어려워하는 이유나 장애물에 대해 알아보려고 합니다.
      
      사용자의 음성을 듣고:
      1. 이전에 비슷한 목표를 시도했을 때 어려웠던 점
      2. 현재 예상되는 장애물이나 어려움
      3. 동기 부족, 시간 부족, 환경적 요인 등을 파악해주세요
      
      공감하는 톤으로 응답하며, 이런 어려움은 자연스러운 것임을 알려주세요.
      
      응답 길이: 2-3문장으로 간결하게 답변해주세요.
    `,
    'summary': `
      ${getBasePrompt()}
      
      목표 설정 대화가 거의 마무리되었습니다. 지금까지 대화한 내용을 요약하고 사용자를 격려해주세요.
      
      사용자의 음성을 듣고:
      1. 최종 확인이나 추가 질문에 답변해주세요
      2. 목표 달성에 대한 긍정적인 전망을 제시해주세요
      3. AI가 함께 도와줄 것임을 약속해주세요
      
      응답 길이: 3-4문장으로 격려하는 메시지를 전달해주세요.
    `
  };

  return prompts[step] || prompts['step1'];
};

/**
 * Daily report conversation prompts
 */
const getDailyReportPrompt = (step) => {
  const prompts = {
    'reflection': `
      ${getBasePrompt()}
      
      오늘 하루를 돌아보는 일간 리포트 작성을 도와주고 있습니다.
      
      사용자의 음성을 듣고:
      1. 오늘 하루 어떻게 보냈는지
      2. 목표한 일들을 얼마나 달성했는지
      3. 기분이나 컨디션은 어땠는지
      4. 어려웠던 점이나 잘한 점은 무엇인지
      
      따뜻하고 공감하는 톤으로 사용자의 하루를 들어주세요. 판단하지 말고 먼저 들어주는 것이 중요합니다.
      
      응답 길이: 2-3문장으로 공감하며 추가 질문을 해주세요.
    `,
    'feedback': `
      ${getBasePrompt()}
      
      사용자의 하루 이야기를 들었으니, 이제 격려와 조언을 제공할 차례입니다.
      
      사용자의 음성을 듣고:
      1. 오늘의 성과를 인정하고 칭찬해주세요
      2. 어려웠던 점에 대해 공감해주세요  
      3. 내일을 위한 간단한 조언을 제공해주세요
      4. 긍정적인 마무리로 동기부여해주세요
      
      응답 길이: 3-4문장으로 따뜻한 피드백을 제공해주세요.
    `
  };

  return prompts[step] || prompts['reflection'];
};

/**
 * Weekly report conversation prompts
 */
const getWeeklyReportPrompt = (step) => {
  return `
    ${getBasePrompt()}
    
    이번 주를 돌아보는 주간 리포트 작성을 도와주고 있습니다.
    
    사용자의 음성을 듣고:
    1. 이번 주 전체적인 목표 달성도는 어땠는지
    2. 가장 잘한 일과 아쉬웠던 일
    3. 다음 주에는 어떻게 개선하고 싶은지
    4. 새로운 계획이나 조정하고 싶은 부분
    
    일주일이라는 긴 기간을 돌아보는 만큼, 더 큰 그림에서 격려와 조언을 제공해주세요.
    
    응답 길이: 3-4문장으로 따뜻하고 통찰력 있는 피드백을 제공해주세요.
  `;
};

/**
 * Base prompt for all conversations
 */
const getBasePrompt = () => {
  return `당신의 이름은 "루티(Routy)"이고, 사용자의 습관 관리와 목표 달성을 돕는 친근하고 따뜻한 여성 AI 어시스턴트입니다.

  톤과 스타일(자연스러움 우선):
  - 과장하지 말고 담백하게, 그러나 따뜻하게
  - 억양은 부드럽고 자연스럽게, 문장 끝을 살짝 올려 친근함 전달
  - 불필요한 반복과 과도한 감탄사는 지양
  - 상황에 맞는 짧은 감탄사만 가볍게 사용 (예: 좋네요, 와, 오, 음)

  말하기 가이드(사용자 불편 최소화):
  - 2~3문장으로 간결하게 말하기
  - 핵심만 또박또박 전달하고, 다음 행동을 제안
  - 위로/격려는 짧고 진심 있게 (예: 괜찮아요. 천천히 해봐요)

  발화 예시(자연스럽고 담백하게):
  - "안녕하세요, 저는 루티예요. 오늘은 어떤 걸 도와드릴까요?"
  - "좋아요. 지금 목표에 한 걸음 더 가까워졌어요. 계속 같이 가요"
  - "괜찮아요. 가끔은 쉬어가는 것도 필요해요"

  표기 규칙(ASR/전사 안전):
  - 특수문자를 남발하지 말고, 필요하면 단어로 대체 (예: 정말요?, 너무 좋아요)
  - 텍스트 기호는 결과에 꼭 필요할 때만 최소한으로 사용

  당신은 사용자의 든든한 친구이자 코치 루티입니다. 자연스럽고 편안한 음성으로, 사용자가 부담 없게 느끼도록 말해 주세요.`;
};

/**
 * Gemini 2.5 Pro 모델에서 음성 출력과 함께 응답을 생성
 * @param {string} audioUri - URI of the recorded audio file (optional if textInput provided)
 * @param {string} conversationContext - Context about the conversation
 * @param {string} step - Current step in the conversation
 * @param {string} textInput - Text input (optional if audioUri provided)
 * @param {boolean} requestAudio - Whether to request audio output from Gemini
 * @returns {Promise<{text: string, audioData?: string, audioUrl?: string}>} AI response with text and optional audio
 */
export const sendAudioMessageWithVoice = async (audioUri, conversationContext, step, textInput = null, requestAudio = true) => {
  if (!API_KEY) {
    console.error('API 키가 없습니다.');
    return {
      text: 'API 키가 설정되지 않았습니다.',
      error: true
    };
  }

  if (!audioUri && !textInput) {
    return {
      text: '음성이나 텍스트 입력이 없습니다.',
      error: true
    };
  }

  try {
    console.log('Gemini 2.5 Pro 모델에 음성 출력 요청 중...');

    const parts = [
      {
        text: addSafetyInstructions(getConversationPrompt(conversationContext, step))
      }
    ];

    // Add audio if provided
    if (audioUri) {
      const audioBase64 = await audioToBase64(audioUri);
      parts.push({
        inlineData: {
          mimeType: "audio/wav",
          data: audioBase64
        }
      });
    }

    // Add text input if provided
    if (textInput) {
      parts.push({
        text: `사용자 입력: ${textInput}`
      });
    }

    // 음성 출력 요청 추가
    if (requestAudio) {
      parts.push({
        text: "응답을 한국어 음성으로도 제공해주세요. 자연스럽고 친근한 톤으로 말해주세요."
      });
    }

    const requestData = {
      contents: [
        {
          role: "user",
          parts: parts
        }
      ],
      generationConfig: {
        maxOutputTokens: 8192,
        temperature: 0.7
      }
    };

    // Gemini 2.5 Flash Native Audio 시도 (현재 제한적 지원)
    // if (requestAudio) {
    //   requestData.generationConfig.responseModalities = ["TEXT", "AUDIO"];
    //   console.log('Gemini 2.5 Flash 네이티브 오디오 요청 중...');
    // }
    
    // 현재는 텍스트만 요청하고 Web TTS로 처리
    console.log('Gemini 2.5 Flash Live 텍스트 응답 요청 중... (오디오는 Web TTS로 처리)');

    const response = await fetch(`${GEMINI_LIVE_API_URL}?key=${API_KEY}`, {
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
    console.log('Gemini 2.5 Pro 음성 응답을 받았습니다.');

    // 텍스트 응답 추출
    const aiResponse = data.candidates?.[0]?.content?.parts?.find(part => part.text)?.text;
    
    // 오디오 응답 추출 (API 응답 구조에 따라 조정 필요)
    const audioResponse = data.candidates?.[0]?.content?.parts?.find(part => part.inlineData?.mimeType?.startsWith('audio/'));
    
    if (aiResponse) {
      const result = {
        text: aiResponse,
        error: false
      };

      // 오디오 데이터가 있으면 추가 (현재는 Gemini에서 오디오를 반환하지 않음)
      if (audioResponse?.inlineData?.data) {
        result.audioData = audioResponse.inlineData.data;
        result.audioMimeType = audioResponse.inlineData.mimeType;
        
        // 오디오 URL 생성 (웹에서 재생 가능한 형태)
        const audioBlob = base64ToBlob(audioResponse.inlineData.data, audioResponse.inlineData.mimeType);
        result.audioUrl = URL.createObjectURL(audioBlob);
      } else {
        console.log('Gemini에서 오디오 응답을 받지 못했습니다. Web TTS를 사용합니다.');
      }

      return result;
    } else {
      console.error('응답 형식 오류:', data);
      return {
        text: '죄송합니다, 응답을 처리하는 데 실패했습니다.',
        error: true
      };
    }

  } catch (error) {
    console.error('음성 메시지 전송 중 오류 발생:', error);
    return {
      text: `오류가 발생했습니다. 다시 시도해주세요.`,
      error: true
    };
  }
};

/**
 * Base64 데이터를 Blob으로 변환
 * @param {string} base64Data - Base64 encoded data
 * @param {string} mimeType - MIME type of the data
 * @returns {Blob} Blob object
 */
const base64ToBlob = (base64Data, mimeType) => {
  const byteCharacters = atob(base64Data);
  const byteNumbers = new Array(byteCharacters.length);
  
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  
  const byteArray = new Uint8Array(byteNumbers);
  return new Blob([byteArray], { type: mimeType });
};

/**
 * 웹 브라우저의 TTS API를 사용한 텍스트 음성 변환 (fallback)
 * @param {string} text - Text to convert to speech
 * @param {string} lang - Language code
 * @returns {Promise<void>} Promise that resolves when speech starts
 */
export const generateWebSpeech = async (text, lang = 'ko-KR') => {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    // 이전 음성 중지
    window.speechSynthesis.cancel();
    
    return new Promise((resolve, reject) => {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang;
      utterance.rate = 1.0; // 정상 속도 (절어서 들리는 문제 해결)
      utterance.pitch = 1.0; // 자연스러운 톤
      utterance.volume = 1;
      
      // 더 나은 음성 품질을 위한 설정
      const voices = window.speechSynthesis.getVoices();
      const koreanVoice = voices.find(voice => 
        voice.lang.includes('ko') || voice.lang.includes('KR')
      );
      
      if (koreanVoice) {
        utterance.voice = koreanVoice;
        console.log('한국어 음성 선택됨:', koreanVoice.name);
      } else {
        console.log('기본 음성 사용');
      }
      
      utterance.onstart = () => {
        console.log('고품질 TTS 시작');
        resolve();
      };
      
      utterance.onerror = (event) => {
        console.error('TTS 오류:', event.error);
        reject(new Error(`TTS 오류: ${event.error}`));
      };
      
      utterance.onend = () => {
        console.log('TTS 완료');
      };
      
      window.speechSynthesis.speak(utterance);
    });
  } else {
    throw new Error('TTS가 지원되지 않는 환경입니다.');
  }
};

/**
 * TTS 중지
 */
export const stopWebSpeech = () => {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
};

/**
 * Gemini 2.5 Pro TTS를 사용하여 고품질 음성 생성
 * @param {string} text - 음성으로 변환할 텍스트
 * @param {string} voiceName - 사용할 음성 이름 (기본: 'Aoede')
 * @returns {Promise<string|null>} Base64 인코딩된 PCM 오디오 데이터 또는 실패 시 null
 */
export async function generateNativeTTS(text, voiceName = 'Aoede') {
  if (!text) {
    console.error('TTS를 위한 텍스트가 없습니다.');
    return null;
  }
  
  // 텍스트 길이 제한 없음 - 전체 응답을 음성으로 변환
  const shortText = text;
  
  const startTime = Date.now();
  // 1) Live API 우선 (빠른 시작)
  try {
    const { generateNativeAudio } = await import('./geminiLiveAudio');
    const liveResult = await generateNativeAudio(shortText, `한국어로만 자연스럽게 말해주세요. 영어를 섞지 마세요. 내용: "${shortText}"`);
    if (liveResult && !liveResult.error && liveResult.audioData) {
      const endTime = Date.now();
      return {
        audioData: liveResult.audioData,
        // Live API는 16-bit PCM (주로 24kHz mono)
        mimeType: 'audio/pcm;rate=24000;channels=1;encoding=signed-integer;bits=16'
      };
    }
    console.warn('⚠️ Live API 응답에 오디오 데이터가 없습니다. Pro TTS로 시도');
  } catch (error) {
    console.warn('⚠️ Live API TTS 오류, Pro TTS로 시도:', error?.message);
  }

  // 2) Pro TTS 시도 (고품질)
  try {
    const proAudio = await generateProTTS(shortText, voiceName);
    if (proAudio) {
      if (typeof proAudio === 'string') {
        return { audioData: proAudio, mimeType: undefined };
      } else {
        return proAudio;
      }
    }
    console.warn('⚠️ Pro TTS에서 오디오를 받지 못했습니다. Google TTS로 시도');
  } catch (e) {
    console.warn('⚠️ Pro TTS 오류, Google TTS로 시도:', e?.message);
  }

  // 3) Google Cloud TTS 최종 fallback (가장 안정적)
  const textToUse = shortText;
  const googleAudio = await generateSpeechFromText(textToUse, 'ko-KR-Wavenet-A');
  return googleAudio ? { audioData: googleAudio, mimeType: 'audio/mpeg' } : null;
}

/**
 * Gemini 2.5 Pro TTS 함수 (Flash TTS 실패 시 fallback용)
 * @param {string} text - 음성으로 변환할 텍스트
 * @param {string} voiceName - 사용할 음성 이름
 * @returns {Promise<string|null>} Base64 인코딩된 오디오 데이터 또는 실패 시 null
 */
async function generateProTTS(text, voiceName = 'Aoede') {
  if (!text) {
    console.error('TTS를 위한 텍스트가 없습니다.');
    return null;
  }
  
  const startTime = Date.now();
  const requestBody = {
    contents: [{
      parts: [{ text: `한국어로 자연스럽고 또렷하게 읽어주세요. 영어는 사용하지 마세요. 텍스트: ${text}` }]
    }],
    generationConfig: {
      // 속도/자연스러움 튜닝
      maxOutputTokens: 4096, // 충분한 길이 허용 (전체 발화 보장 시도)
      temperature: 0.4, // 낮은 온도 → 안정적 발화
      topK: 20,
      topP: 0.8,
      responseModalities: ["AUDIO"],
      speechConfig: {
        voiceConfig: {
          prebuiltVoiceConfig: {
            voiceName: voiceName
          }
        }
      }
    }
  };

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-pro-preview-tts:generateContent?key=${API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Gemini 2.5 Pro TTS API 오류:', response.status, errorText);
      
      // 429 오류면 할당량 초과 - Google Cloud TTS로 fallback
      if (response.status === 429) {
        console.warn('⚠️ Gemini Pro TTS 할당량 초과, Google Cloud TTS로 fallback');
        return await generateSpeechFromText(text, 'ko-KR-Wavenet-A');
      }
      
      // 기타 오류는 Google Cloud TTS로 fallback
      console.warn('⚠️ Gemini Pro TTS API 오류, Google Cloud TTS로 fallback');
      return await generateSpeechFromText(text, 'ko-KR-Wavenet-A');
    }

    const data = await response.json();
    
    // Pro TTS 응답 처리
    
    let audioData = data.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    let audioMimeType = data.candidates?.[0]?.content?.parts?.[0]?.inlineData?.mimeType;
    
    // 다른 위치에서도 오디오 데이터 찾기
    if (!audioData) {
      const parts = data.candidates?.[0]?.content?.parts || [];
      for (const part of parts) {
        if (part.inlineData && part.inlineData.mimeType && part.inlineData.mimeType.includes('audio')) {
          audioData = part.inlineData.data;
          audioMimeType = part.inlineData.mimeType;
          break;
        }
      }
    }

    if (audioData && audioData.length > 0) {
      const endTime = Date.now();
      // Pro TTS 성공
      return { audioData, mimeType: audioMimeType };
    } else {
      console.warn('⚠️ Gemini 2.5 Pro TTS 응답에 오디오 데이터가 없습니다.');
      const g = await generateSpeechFromText(text, 'ko-KR-Wavenet-A');
      return g ? { audioData: g, mimeType: 'audio/mpeg' } : null;
    }
  } catch (error) {
    console.error('Gemini 2.5 Pro TTS 음성 생성 중 오류 발생:', error);
    
    // 오류 발생 시 Google Cloud TTS로 fallback
    console.log('🔄 Google Cloud TTS로 fallback...');
    const g = await generateSpeechFromText(text, 'ko-KR-Wavenet-A');
    return g ? { audioData: g, mimeType: 'audio/mpeg' } : null;
  }
}

/**
 * Web TTS Fallback 함수 - 가장 안정적인 대안
 * @param {string} text - 음성으로 변환할 텍스트
 * @returns {Promise<string|null>} Base64 인코딩된 오디오 데이터 또는 실패 시 null
 */
async function generateWebTTSFallback(text) {
  try {
    console.log('🌐 Web TTS Fallback 시작:', text);
    
    // Web Speech API 사용
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      // Web Speech API는 직접 오디오 데이터를 반환하지 않으므로
      // 성공적으로 재생되면 true 반환
      await generateWebSpeech(text, 'ko-KR');
      console.log('✅ Web TTS 재생 성공');
      return 'WEB_TTS_SUCCESS'; // 특별한 마커 반환
    } else {
      console.warn('⚠️ Web Speech API가 지원되지 않습니다.');
      return null;
    }
  } catch (error) {
    console.error('Web TTS Fallback 오류:', error);
    return null;
  }
}

/**
 * 기존 Google TTS (fallback용) - 더 안전한 오류 처리
 * @param {string} text - 음성으로 변환할 텍스트
 * @param {string} voiceName - 사용할 음성 이름 (예: 'ko-KR-Standard-A')
 * @returns {Promise<string|null>} Base64 인코딩된 오디오 데이터 또는 실패 시 null
 */
export async function generateSpeechFromText(text, voiceName = 'ko-KR-Neural2-A') {
  if (!text) {
    console.error('TTS를 위한 텍스트가 없습니다.');
    return null;
  }
  
  // 요청 제한 적용
  await checkRequestLimit();
  
  console.log(`🔊 Google Cloud TTS 요청 (${voiceName}): "${text}"`);

  // SSML로 더 자연스러운 발음
  const ssmlText = `<speak>
    <prosody rate="0.9" pitch="+2st" volume="loud">
      ${text}
    </prosody>
  </speak>`;

  const body = {
    input: {
      ssml: ssmlText, // SSML 사용으로 더 자연스러운 발음
    },
    voice: {
      languageCode: 'ko-KR',
      name: voiceName, // Neural2 또는 Wavenet 음성 사용
      ssmlGender: 'FEMALE',
    },
    audioConfig: {
      audioEncoding: 'MP3',
      speakingRate: 0.95, // 약간 느리게 (더 자연스럽게)
      pitch: 2.0, // 약간 높은 톤 (친근하게)
      volumeGainDb: 2.0, // 볼륨 조금 증가
    },
  };

  try {
    const response = await fetch(`${GOOGLE_TTS_URL}?key=${API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('Google Cloud TTS API 오류:', JSON.stringify(errorData, null, 2));
      
      // 403 오류면 서비스 비활성화 - 다른 음성으로 재시도
      if (response.status === 403) {
        console.warn('⚠️ Google Cloud TTS API가 비활성화되어 있습니다.');
        console.warn('📋 활성화 방법: https://console.developers.google.com/apis/api/texttospeech.googleapis.com/overview');
        
        // 다른 음성으로 재시도
        if (voiceName !== 'ko-KR-Standard-A') {
          console.log('🔄 다른 음성으로 재시도: ko-KR-Standard-A');
          return await generateSpeechFromText(text, 'ko-KR-Standard-A');
        } else {
          // 모든 음성이 실패하면 Web TTS로 fallback
          console.log('🔄 Web TTS로 fallback...');
          return await generateWebTTSFallback(text);
        }
      }
      
      // 기타 오류도 다른 음성으로 재시도
      console.warn('⚠️ Google Cloud TTS API 오류, 다른 음성으로 재시도');
      if (voiceName !== 'ko-KR-Standard-A') {
        return await generateSpeechFromText(text, 'ko-KR-Standard-A');
      } else {
        return await generateWebTTSFallback(text);
      }
    }

    const data = await response.json();

    if (data.audioContent) {
      console.log('✅ Google Cloud TTS 음성 생성 성공');
      return data.audioContent; // Base64-encoded MP3 audio
    } else {
      console.warn('Google TTS API 응답에 오디오 콘텐츠가 없습니다.');
      return await generateWebTTSFallback(text);
    }
  } catch (error) {
    console.error('Google Cloud TTS 음성 생성 중 오류 발생:', error);
    
    // 모든 오류에 대해 Web TTS로 fallback
    console.log('🔄 Web TTS로 fallback...');
    return await generateWebTTSFallback(text);
  }
}