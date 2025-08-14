/**
 * Gemini Multimodal Live API를 사용한 실시간 네이티브 오디오 처리
 * 진짜 Google 네이티브 오디오 출력을 제공합니다!
 */

import { GoogleGenAI, Modality } from '@google/genai';
import Constants from 'expo-constants';

// API 설정 - 기존 Gemini API와 동일한 방식으로 설정
const API_KEY = Constants.expoConfig?.extra?.geminiApiKey || Constants.manifest?.extra?.geminiApiKey;

if (!API_KEY) {
  console.error('Available Constants:', {
    expoConfig: Constants.expoConfig?.extra,
    manifest: Constants.manifest?.extra,
    executionEnvironment: Constants.executionEnvironment
  });
  throw new Error('GEMINI_API_KEY 환경변수가 설정되지 않았습니다.');
}

// Gemini Live API 클라이언트 초기화
const genAI = new GoogleGenAI({ apiKey: API_KEY });

// 로그 토글 (기본 true로 복구)
const LIVE_DEBUG = true;

// Live API 지원 최신 Gemini 2.5 모델들
const LIVE_MODELS = {
  FLASH_2_5: "gemini-2.5-flash",
  PRO_2_5: "gemini-2.5-pro", 
  FLASH_LIVE: "gemini-live-2.5-flash-preview", // 실제 Live API 모델
  PRO_TTS: "gemini-2.5-pro" // TTS 전용
};

// 음성 모드용 모델 (Gemini 2.5 Flash Live)
const CURRENT_MODEL = LIVE_MODELS.FLASH_LIVE;

/**
 * Gemini Live API 세션 관리 클래스
 */
class GeminiLiveSession {
  constructor() {
    this.session = null;
    this.isConnected = false;
    this.responseQueue = [];
    this.audioBuffer = [];
    
    // 메시지 처리 정보 수집용 변수들
    this.hasModelTurn = false;
    this.hasInputTranscription = false;
    this.hasOutputTranscription = false;
    this.turnComplete = false;
  }

  /**
   * Live API 세션 시작
   */
  async connect(systemInstruction) {
    if (!systemInstruction) {
      throw new Error('시스템 프롬프트가 제공되지 않았습니다.');
    }
    
    // 시스템 프롬프트 저장 (재연결 시 사용)
    this.lastSystemInstruction = systemInstruction;
    
    try {
      if (LIVE_DEBUG) console.log('🎤 Gemini Live API 연결 중...');
      if (LIVE_DEBUG) console.log('📝 시스템 프롬프트:', systemInstruction);

      // Live API 연결 시도 - systemInstruction을 사용하여 역할 지정
      this.session = await genAI.live.connect({
        model: CURRENT_MODEL,
        callbacks: {
          onopen: () => {
            if (LIVE_DEBUG) console.log('✅ Gemini Live API 연결 성공!');
            this.isConnected = true;
          },
          onmessage: (message) => {
            // 메시지 수신 로그 제거 (과도한 로그 방지)
            this.responseQueue.push(message);
          },
          onerror: (error) => {
            console.error('❌ Live API 연결 오류');
            this.isConnected = false;
          },
          onclose: (event) => {
            if (LIVE_DEBUG) console.log('🔌 Live API 연결 종료:', event?.reason || 'Unknown reason');
            this.isConnected = false;
          }
        },
        config: {
          systemInstruction: {
            parts: [{ text: systemInstruction }]
          },
          responseModalities: ["AUDIO"],
          speechConfig: {
            voiceConfig: { 
              prebuiltVoiceConfig: { 
                voiceName: "Aoede"
              }
            }
          },
          outputAudioTranscription: {},
          // 연결 안정성 향상을 위한 추가 설정
          maxOutputTokens: 4096,
          temperature: 0.7,
          topP: 0.8,
          topK: 40
        }
      });

      if (LIVE_DEBUG) console.log('🚀 Live API 세션 설정 완료');
      return this.session;
    } catch (error) {
      console.error('❌ Live API 연결 실패');
      this.isConnected = false;
      throw error;
    }
  }

  /**
   * 오디오 입력 전송 (PCM 16kHz 16-bit)
   */
  async sendAudio(audioData, mimeType = "audio/pcm;rate=16000") {
    if (!this.isConnected || !this.session) {
      if (LIVE_DEBUG) console.log('🔄 세션 재연결 시도...');
      await this.reconnect();
    }

    try {
      // Live API 공식 문서 기준 올바른 메서드 사용
      await this.session.sendRealtimeInput({
        audio: {
          data: audioData,
          mimeType: mimeType
        }
      });
      if (LIVE_DEBUG) console.log('🎤 오디오 입력 전송 완료');
    } catch (error) {
      console.error('오디오 전송 실패:', error);
      
      // 연결 오류인 경우 재연결 시도
      if (error.message.includes('연결') || error.message.includes('세션') || error.message.includes('Live API')) {
        if (LIVE_DEBUG) console.log('🔄 연결 오류로 인한 세션 재연결 시도...');
        await this.reconnect();
        // 재연결 후 다시 시도
        await this.session.sendRealtimeInput({
          audio: {
            data: audioData,
            mimeType: mimeType
          }
        });
        if (LIVE_DEBUG) console.log('✅ 재연결 후 오디오 데이터 전송 성공');
      } else {
        throw error;
      }
    }
  }

  /**
   * 텍스트 입력 전송 (2025년 8월 최신 API 스펙)
   */
  async sendText(text) {
    if (!this.isConnected || !this.session) {
      throw new Error('Live API 세션이 연결되지 않았습니다.');
    }

    try {
      // 2025년 8월 최신 공식 문서 기준 올바른 구조 사용
      await this.session.sendClientContent({
        turns: [{
          role: "user",
          parts: [{ text: text }]
        }],
        turnComplete: true
      });
      if (LIVE_DEBUG) console.log('💬 텍스트 입력 전송');
    } catch (error) {
      console.error('텍스트 전송 실패');
      throw error;
    }
  }

  /**
   * 응답 대기 및 오디오 데이터 반환 (최적화된 버전)
   */
  async waitForResponse() {
    return new Promise((resolve) => {
      let combinedText = '';
      let audioChunks = []; // 오디오 청크들을 배열로 수집
      let userInput = ''; // 사용자의 음성 인식 결과 저장
      let hasResponse = false;
      let messageCount = 0;

      // 스트리밍 응답 처리 (turnComplete까지 대기)
      let isComplete = false;
      
      const processMessages = () => {
        while (this.responseQueue.length > 0) {
          const message = this.responseQueue.shift();
          messageCount++;
          
          // 메시지 처리 로그 제거 (과도한 로그 방지)
          
          // 메시지 구조 정보 수집 (로그 출력 없이)
          if (message.serverContent) {
            // serverContent 정보 수집
            if (message.serverContent.modelTurn) {
              this.hasModelTurn = true;
            }
            if (message.serverContent.inputTranscription) {
              this.hasInputTranscription = true;
            }
            if (message.serverContent.outputTranscription) {
              this.hasOutputTranscription = true;
            }
            if (message.serverContent.turnComplete) {
              this.turnComplete = true;
            }
          }
          
          // 직접적인 텍스트/오디오 응답
          if (message.text) {
            combinedText += message.text;
          }
          
          // 오디오 데이터는 message.data를 통해서만 수집 (중복 방지)
          if (message.data) {
            // 오디오 데이터 수신 로그 제거 (과도한 로그 방지)
            audioChunks.push(message.data);
          }
          
          // serverContent 구조 처리
          if (message.serverContent) {
            // modelTurn에서 텍스트와 MIME 타입 추출
            if (message.serverContent.modelTurn?.parts) {
              message.serverContent.modelTurn.parts.forEach(part => {
                if (part.text) {
                  combinedText += part.text;
                }
                // 오디오 데이터는 중복되므로 추가하지 않지만, MIME 타입은 여기서 가져옴
                if (part.inlineData?.mimeType) {
                  this.lastMimeType = part.inlineData.mimeType;
                  // MIME 타입 감지 로그 제거 (과도한 로그 방지)
                }
              });
            }
            
            // 입력 전사 처리 (사용자 음성)
            if (message.serverContent.inputTranscription?.text) {
              userInput += message.serverContent.inputTranscription.text + ' ';
              // 입력 전사 로그 제거 (과도한 로그 방지)
            }
            
            // 출력 전사 처리 (AI 음성)
            if (message.serverContent.outputTranscription?.text) {
              combinedText += message.serverContent.outputTranscription.text;
            }
            
            // turnComplete 확인 - 이때만 완료 처리
            if (message.serverContent.turnComplete) {
              // 턴 완료 신호 로그 제거 (과도한 로그 방지)
              isComplete = true;
              break; 
            }
          }
        }
        
        if (isComplete) {
          const finalText = combinedText.trim() || '응답을 받았습니다.';
          const finalUserInput = userInput.trim();
          
          let combinedAudioBase64 = '';
          if (audioChunks.length > 0) {
            try {
              const binaryChunks = audioChunks.map(chunk => {
                const binaryString = atob(chunk);
                const bytes = new Uint8Array(binaryString.length);
                for (let i = 0; i < binaryString.length; i++) {
                  bytes[i] = binaryString.charCodeAt(i);
                }
                return bytes;
              });
              const totalLength = binaryChunks.reduce((sum, chunk) => sum + chunk.length, 0);
              const combinedBinary = new Uint8Array(totalLength);
              let offset = 0;
              for (const chunk of binaryChunks) {
                combinedBinary.set(chunk, offset);
                offset += chunk.length;
              }
              let binaryString = '';
              for (let i = 0; i < combinedBinary.length; i++) binaryString += String.fromCharCode(combinedBinary[i]);
              combinedAudioBase64 = btoa(binaryString);
            } catch (e) {
              combinedAudioBase64 = audioChunks[0] || '';
            }
          }
          
          if (LIVE_DEBUG) console.log('✅ 응답 처리 완료:', {
            userInput: finalUserInput,
            textLength: finalText.length,
            hasAudio: !!combinedAudioBase64,
            audioChunks: audioChunks.length,
            totalAudioSize: audioChunks.reduce((sum, chunk) => sum + chunk.length, 0),
            messageCount: messageCount,
            mimeType: this.lastMimeType || "audio/pcm;rate=24000",
            serverContent: {
              hasModelTurn: this.hasModelTurn,
              hasInputTranscription: this.hasInputTranscription,
              hasOutputTranscription: this.hasOutputTranscription,
              turnComplete: this.turnComplete
            }
          });

          resolve({
            audioData: combinedAudioBase64,
            text: finalText,
            userInput: finalUserInput,
            mimeType: combinedAudioBase64 ? (this.lastMimeType || "audio/pcm;rate=24000") : "",
            source: 'Gemini Live API'
          });
          return true; // 처리 완료
        }
        return false; // 계속 대기
      };

      const checkInterval = setInterval(() => {
        if (processMessages()) {
          clearInterval(checkInterval);
        }
      }, 100);

      const timeoutId = setTimeout(() => {
        clearInterval(checkInterval);
        console.warn('⏰ Live API 응답 타임아웃 (30초)');
        resolve({
          audioData: '',
          text: '응답 시간이 초과되었어요. 다시 시도해 주세요.',
          userInput: userInput.trim(),
          mimeType: "",
          source: 'Timeout'
        });
      }, 30000); // 15초 → 30초로 증가
      
      const originalResolve = resolve;
      resolve = (result) => {
        clearTimeout(timeoutId);
        originalResolve(result);
      };
    });
  }

  /**
   * 세션 재연결
   */
  async reconnect() {
    if (LIVE_DEBUG) console.log('🔄 Live API 세션 재연결 중...');
    
    try {
      // 기존 세션 정리
      if (this.session) {
        this.session.close();
        this.session = null;
      }
      
      this.isConnected = false;
      this.responseQueue = [];
      this.audioBuffer = [];
      
      // 새 세션 생성
      this.session = await genAI.live.connect({
        model: CURRENT_MODEL,
        callbacks: {
          onopen: () => {
            if (LIVE_DEBUG) console.log('✅ Live API 재연결 성공!');
            this.isConnected = true;
          },
          onmessage: (message) => {
            // 재연결 후 메시지 수신 로그 제거 (과도한 로그 방지)
            this.responseQueue.push(message);
          },
          onerror: (error) => {
            console.error('❌ Live API 재연결 오류');
            this.isConnected = false;
          },
          onclose: (event) => {
            if (LIVE_DEBUG) console.log('🔌 Live API 재연결 후 연결 종료');
            this.isConnected = false;
          }
        },
        config: {
          systemInstruction: {
            parts: [{ text: this.lastSystemInstruction || '당신은 루티입니다.' }]
          },
          responseModalities: ["AUDIO"],
          speechConfig: {
            voiceConfig: { 
              prebuiltVoiceConfig: { 
                voiceName: "Aoede"
              }
            }
          },
          outputAudioTranscription: {}
        }
      });
      
      if (LIVE_DEBUG) console.log('🚀 Live API 재연결 세션 설정 완료');
    } catch (error) {
      console.error('❌ Live API 재연결 실패:', error);
      throw new Error('세션 재연결에 실패했습니다.');
    }
  }

  /**
   * 세션 종료
   */
  async disconnect() {
    if (this.session) {
      this.session.close();
      this.session = null;
      this.isConnected = false;
      if (LIVE_DEBUG) console.log('🔌 Live API 세션 종료');
    }
  }

  /**
   * 시스템 프롬프트를 업데이트합니다.
   */
  async updateSystemInstruction(newSystemInstruction) {
    if (!this.session) {
      throw new Error('세션이 연결되지 않았습니다.');
    }
    this.lastSystemInstruction = newSystemInstruction;
    if (LIVE_DEBUG) console.log('시스템 프롬프트가 업데이트되었습니다.');
  }
}

// --- 대화형 세션 관리 ---

let conversationSession = null;

/**
 * 대화형 세션을 시작하거나 기존 세션을 가져옵니다.
 */
async function startOrGetConversationSession(systemInstruction) {
  if (conversationSession && conversationSession.isConnected) {
    if (LIVE_DEBUG) console.log('기존 Live API 세션을 새로운 맥락으로 업데이트합니다.');
    // 기존 세션을 새로운 시스템 프롬프트로 업데이트
    await conversationSession.updateSystemInstruction(systemInstruction);
    return conversationSession;
  }
  
  if (LIVE_DEBUG) console.log('새로운 Live API 세션을 시작합니다.');
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
    if (LIVE_DEBUG) console.log('Live API 대화 세션이 종료되었습니다.');
  }
}


/**
 * 편의 함수: 텍스트를 Live API로 처리하고 네이티브 오디오 생성
 */
async function generateNativeAudio(text, systemInstruction) {
  let session = null;
  
  try {
    if (LIVE_DEBUG) console.log('🚀 Live API 텍스트 처리 시작');
    
    // 새 세션 생성 및 연결
    session = new GeminiLiveSession();
    await session.connect(systemInstruction);
    
    // 연결 확인
    if (!session.isConnected) {
      throw new Error('Live API 세션 연결에 실패했습니다.');
    }
    
    // 텍스트 전송
    await session.sendText(text);
    
    // 응답 대기
    const response = await session.waitForResponse();
    
    if (response && (response.text || response.audioData)) {
      if (LIVE_DEBUG) console.log('✅ Live API 응답 성공:', {
        hasText: !!response.text,
        hasAudio: !!response.audioData,
        textLength: response.text?.length || 0,
        audioSize: response.audioData?.length || 0
      });
      
      return {
        error: false,
        audioData: response.audioData || '',
        text: response.text || '응답을 받았습니다.',
        mimeType: response.mimeType || "audio/pcm;rate=24000",
        source: 'Gemini Live API'
      };
    } else {
      throw new Error('Live API에서 유효한 응답을 받지 못했습니다.');
    }
  } catch (error) {
    console.error('❌ Live API 처리 실패');
    
    return {
      error: true,
      text: '죄송해요, 처리 중에 문제가 발생했어요. 다시 말씀해 주시겠어요?',
      audioData: '',
      mimeType: '',
      source: 'Error'
    };
  } finally {
    // 항상 세션 종료 (안전하게)
    if (session) {
      try {
        await session.disconnect();
      } catch (disconnectError) {
    console.warn('세션 종료 중 오류');
      }
    }
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