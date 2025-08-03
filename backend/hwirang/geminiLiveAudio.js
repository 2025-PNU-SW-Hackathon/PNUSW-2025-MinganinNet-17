/**
 * Gemini Multimodal Live API를 사용한 실시간 네이티브 오디오 처리
 * 진짜 Google 네이티브 오디오 출력을 제공합니다!
 */

import { GoogleGenAI, Modality } from '@google/genai';
import Constants from 'expo-constants';

// API 설정 - 기존 Gemini API와 동일한 방식으로 설정
const API_KEY = Constants.expoConfig?.extra?.geminiApiKey;

if (!API_KEY) {
  throw new Error('GEMINI_API_KEY 환경변수가 설정되지 않았습니다.');
}

// Gemini Live API 클라이언트 초기화
const genAI = new GoogleGenAI({ apiKey: API_KEY });

// Live API 지원 최신 Gemini 2.5 Pro 모델들
const LIVE_MODELS = {
  FLASH_2_5: "gemini-2.5-flash",
  PRO_2_5: "gemini-2.5-pro", 
  FLASH_LIVE: "gemini-2.0-flash-live-001", // Live API 전용
  PRO_TTS: "gemini-2.5-pro-preview-tts" // TTS 전용
};

// 현재 사용할 모델 (최신 Gemini 2.5 Pro)
const CURRENT_MODEL = LIVE_MODELS.PRO_2_5;

/**
 * Gemini Live API 세션 관리 클래스
 */
class GeminiLiveSession {
  constructor() {
    this.session = null;
    this.isConnected = false;
    this.responseQueue = [];
    this.audioBuffer = [];
  }

  /**
   * Live API 세션 시작
   */
  async connect(systemInstruction = "당신은 친근하고 도움이 되는 AI 어시스턴트입니다. 한국어로 자연스럽게 대화하세요.") {
    try {
      console.log('🎤 Gemini Live API 2.5 Pro 연결 중...');
      console.log('📋 사용 모델:', CURRENT_MODEL);

      const config = {
        responseModalities: [Modality.TEXT], // 우선 텍스트만 요청
        systemInstruction: {
          parts: [{ text: systemInstruction }]
        }
      };

      this.session = await genAI.live.connect({
        model: CURRENT_MODEL,
        config: config,
        callbacks: {
          onopen: () => {
            console.log('✅ Gemini Live API 2.5 Pro 연결 성공!');
            this.isConnected = true;
          },
          onmessage: (message) => {
            console.log('📨 Live API 메시지 수신:', {
              type: message.type || 'unknown',
              hasServerContent: !!message.serverContent,
              hasTurnComplete: !!message.serverContent?.turnComplete
            });
            
            // 메시지 전체를 더 자세히 로그
            if (message.serverContent?.turnComplete) {
              console.log('🎵 Live API 응답 완료 - 전체 메시지:', JSON.stringify(message, null, 2));
            }
            
            this.responseQueue.push(message);
          },
          onerror: (error) => {
            console.error('❌ Live API 연결 오류:', error);
            this.isConnected = false;
          },
          onclose: (event) => {
            console.log('🔌 Live API 연결 종료:', event?.reason || 'Unknown reason');
            this.isConnected = false;
          }
        }
      });

      console.log('🚀 Live API 세션 설정 완료');
      return this.session;
    } catch (error) {
      console.error('❌ Live API 연결 실패:', error);
      this.isConnected = false;
      throw error;
    }
  }

  /**
   * 오디오 입력 전송 (PCM 16kHz 16-bit)
   */
  async sendAudio(audioData, mimeType = "audio/pcm;rate=16000") {
    if (!this.isConnected || !this.session) {
      throw new Error('Live API 세션이 연결되지 않았습니다.');
    }

    try {
      await this.session.sendRealtimeInput({
        audio: {
          data: audioData,
          mimeType: mimeType
        }
      });
      console.log('🎤 오디오 입력 전송 완료');
    } catch (error) {
      console.error('오디오 전송 실패:', error);
      throw error;
    }
  }

  /**
   * 텍스트 입력 전송
   */
  async sendText(text) {
    if (!this.isConnected || !this.session) {
      throw new Error('Live API 세션이 연결되지 않았습니다.');
    }

    try {
      await this.session.sendClientContent({
        turns: [{ role: 'user', parts: [{ text: text }] }],
        turnComplete: true
      });
      console.log('💬 텍스트 입력 전송:', text);
    } catch (error) {
      console.error('텍스트 전송 실패:', error);
      throw error;
    }
  }

  /**
   * 응답 대기 및 오디오 데이터 반환
   */
  async waitForResponse() {
    return new Promise((resolve) => {
      const checkInterval = setInterval(() => {
        const turnCompleteMessage = this.responseQueue.find(msg => msg.serverContent?.turnComplete);
        
        if (turnCompleteMessage) {
          clearInterval(checkInterval);
          
          let combinedText = '';
          let audioBase64 = '';

          console.log('🔍 전체 응답 구조 분석:', JSON.stringify(turnCompleteMessage, null, 2));

          // 다양한 위치에서 텍스트 추출 시도
          const serverContent = turnCompleteMessage.serverContent;
          
          // 1. modelTurn에서 텍스트 추출
          const modelTurn = serverContent?.modelTurn;
          if (modelTurn?.parts) {
            console.log('📝 modelTurn.parts 발견:', modelTurn.parts.length, '개');
            for (const part of modelTurn.parts) {
              if (part.text) {
                console.log('✅ 텍스트 부분 발견:', part.text);
                combinedText += part.text;
              } else if (part.inlineData) {
                console.log('🎵 오디오 데이터 발견:', part.inlineData.mimeType);
                audioBase64 = part.inlineData.data;
              }
            }
          }
          
          // 2. outputTranscription에서 텍스트 추출 (우선순위)
          if (serverContent?.outputTranscription?.text) {
            console.log('🎤 outputTranscription에서 텍스트 발견:', serverContent.outputTranscription.text);
            combinedText = serverContent.outputTranscription.text;
          }

          // 3. 전체 응답에서 텍스트 검색 (fallback)
          if (!combinedText) {
            console.log('⚠️ 기본 위치에서 텍스트를 찾지 못함. 전체 검색 시도...');
            this.responseQueue.forEach((msg, index) => {
              console.log(`메시지 ${index}:`, JSON.stringify(msg, null, 2));
              if (msg.serverContent?.modelTurn?.parts) {
                msg.serverContent.modelTurn.parts.forEach((part, partIndex) => {
                  if (part.text && !combinedText) {
                    console.log(`✅ 메시지 ${index}, 파트 ${partIndex}에서 텍스트 발견:`, part.text);
                    combinedText = part.text;
                  }
                });
              }
            });
          }

          // 4. 여전히 텍스트가 없으면 더 깊이 탐색
          if (!combinedText) {
            console.log('🔍 더 깊은 구조 탐색 중...');
            const searchForText = (obj, path = '') => {
              if (typeof obj === 'string' && obj.length > 10 && obj.length < 1000) {
                // 합리적인 길이의 텍스트인지 확인
                if (/[가-힣]|[a-zA-Z]/.test(obj)) {
                  console.log(`🎯 ${path}에서 텍스트 발견:`, obj);
                  return obj;
                }
              }
              if (typeof obj === 'object' && obj !== null) {
                for (const [key, value] of Object.entries(obj)) {
                  const result = searchForText(value, `${path}.${key}`);
                  if (result) return result;
                }
              }
              return null;
            };
            
            const foundText = searchForText(turnCompleteMessage);
            if (foundText) {
              combinedText = foundText;
            }
          }

          // Reset queues for the next turn
          this.responseQueue = [];

          const finalText = combinedText.trim() || '죄송해요, 응답을 처리하는 중에 문제가 발생했어요. 다시 말씀해 주시겠어요?';
          
          console.log('✅ 최종 추출된 텍스트:', finalText);
          console.log('🎵 오디오 데이터 여부:', audioBase64 ? '있음' : '없음');

          resolve({
            audioData: audioBase64,
            text: finalText,
            mimeType: "audio/pcm;rate=24000"
          });
        }
      }, 100);
      
      // 타임아웃 추가 (10초)
      setTimeout(() => {
        clearInterval(checkInterval);
        console.error('⏰ Live API 응답 타임아웃');
        resolve({
          audioData: '',
          text: '응답 시간이 초과되었어요. 다시 시도해 주세요.',
          mimeType: "audio/pcm;rate=24000"
        });
      }, 10000);
    });
  }

  /**
   * 세션 종료
   */
  async disconnect() {
    if (this.session) {
      this.session.close();
      this.session = null;
      this.isConnected = false;
      console.log('🔌 Live API 세션 종료');
    }
  }
}

// --- 대화형 세션 관리 ---

let conversationSession = null;

/**
 * 대화형 세션을 시작하거나 기존 세션을 가져옵니다.
 */
async function startOrGetConversationSession(systemInstruction) {
  if (conversationSession && conversationSession.isConnected) {
    console.log('기존 Live API 세션을 사용합니다.');
    return conversationSession;
  }
  
  console.log('새로운 Live API 세션을 시작합니다.');
  conversationSession = new GeminiLiveSession();
  await conversationSession.connect(systemInstruction);
  return conversationSession;
}

/**
 * 현재 대화 세션을 종료합니다.
 */
async function endConversationSession() {
  if (conversationSession) {
    await conversationSession.disconnect();
    conversationSession = null;
    console.log('Live API 대화 세션이 종료되었습니다.');
  }
}


/**
 * 편의 함수: 텍스트를 Gemini 2.5 Pro로 처리하고 네이티브 TTS로 음성 생성
 */
async function generateNativeAudio(text, systemInstruction) {
  try {
    // 1단계: Gemini 2.5 Pro로 텍스트 응답 생성
    console.log('🚀 Gemini 2.5 Pro에 텍스트 전송:', text);
    
    const textResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${CURRENT_MODEL}:generateContent?key=${API_KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [
              { text: systemInstruction },
              { text: text }
            ]
          }
        ],
        generationConfig: {
          maxOutputTokens: 8192,
          temperature: 0.7,
        }
      })
    });

    if (!textResponse.ok) {
      throw new Error(`Gemini 2.5 Pro API 오류: ${textResponse.status}`);
    }

    const textData = await textResponse.json();
    const aiText = textData.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!aiText) {
      throw new Error('AI 응답을 받지 못했습니다.');
    }

    console.log('✅ Gemini 2.5 Pro 텍스트 응답:', aiText);

    // 2단계: Gemini 2.5 Pro TTS로 오디오 생성
    const { generateNativeTTS } = await import('./geminiAudio');
    const audioData = await generateNativeTTS(aiText);
    
    return {
      error: false,
      audioData: audioData,
      text: aiText,
      mimeType: "audio/pcm;rate=24000",
      source: 'Gemini 2.5 Pro + Native TTS'
    };
  } catch (error) {
    console.error('Gemini 2.5 Pro 처리 실패:', error);
    
    return {
      error: true,
      text: '죄송해요, 처리 중에 문제가 발생했어요. 다시 말씀해 주시겠어요?',
      audioData: '',
      mimeType: '',
      source: 'Error'
    };
  }
}

/**
 * 편의 함수: 오디오를 오디오로 변환 (음성 대화)
 */
async function processAudioToAudio(audioData, systemInstruction, audioMimeType = "audio/pcm;rate=16000") {
  const session = new GeminiLiveSession();
  
  try {
    await session.connect(systemInstruction);
    await session.sendAudio(audioData, audioMimeType);
    const response = await session.waitForResponse();
    await session.disconnect();
    
    return {
      audioData: response.audioData,
      text: response.text,
      mimeType: response.mimeType,
      source: 'Gemini 2.5 Flash 네이티브 오디오'
    };
  } catch (error) {
    await session.disconnect();
    throw error;
  }
}

export { 
  GeminiLiveSession,
  generateNativeAudio,
  processAudioToAudio,
  startOrGetConversationSession,
  endConversationSession
};