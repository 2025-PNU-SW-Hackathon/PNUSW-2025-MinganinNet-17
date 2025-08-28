/**
 * Supabase Edge Functions를 활용한 AI 음성 채팅 처리
 * Gemini 2.5 Flash API와 Google Cloud Speech/TTS API를 조합하여 사용
 */

import Constants from 'expo-constants';
import { createClient } from '@supabase/supabase-js';

// Supabase 설정 - .env에서 직접 읽기
const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('환경변수 확인:', {
    SUPABASE_URL: SUPABASE_URL ? '설정됨' : '설정되지 않음',
    SUPABASE_ANON_KEY: SUPABASE_ANON_KEY ? '설정됨' : '설정되지 않음',
    availableEnvVars: Object.keys(process.env).filter(key => key.includes('SUPABASE'))
  });
  throw new Error('SUPABASE_URL과 SUPABASE_ANON_KEY 환경변수가 설정되지 않았습니다.');
}

// Supabase 클라이언트 초기화
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 디버그 로그 토글
const DEBUG = true;

/**
 * Supabase Edge Functions를 통한 AI 음성 채팅 처리 클래스
 */
class SupabaseAIVoiceChat {
  constructor() {
    this.isProcessing = false;
    this.currentRequestId = null;
  }

  /**
   * 음성 파일을 Supabase Edge Function으로 전송하여 AI 응답 생성
   * @param {Blob|File} audioFile - 녹음된 음성 파일 (.m4a, .wav 등)
   * @param {string} systemInstruction - AI 시스템 프롬프트
   * @param {Function} onAudioChunk - 오디오 청크 수신 시 콜백
   * @param {Function} onComplete - 완료 시 콜백
   * @param {Function} onError - 오류 시 콜백
   */
  async processVoiceToAI(
    audioFile, 
    systemInstruction, 
    onAudioChunk, 
    onComplete, 
    onError
  ) {
    if (this.isProcessing) {
      throw new Error('이미 처리 중인 요청이 있습니다.');
    }

    this.isProcessing = true;
    
    try {
      if (DEBUG) console.log('🎤 음성 파일 AI 처리 시작...');
      
      // 1. 음성 파일을 Supabase Storage에 업로드
      const fileName = `voice_${Date.now()}_${Math.random().toString(36).substr(2, 9)}.m4a`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('voice-chat')
        .upload(fileName, audioFile);

      if (uploadError) {
        throw new Error(`음성 파일 업로드 실패: ${uploadError.message}`);
      }

      if (DEBUG) console.log('✅ 음성 파일 업로드 완료:', fileName);

      // 2. Edge Function 호출하여 AI 처리 시작
      const { data: aiResponse, error: aiError } = await supabase.functions.invoke('ai-voice-chat', {
        body: {
          audioFileName: fileName,
          systemInstruction: systemInstruction,
          requestId: this.currentRequestId = Date.now().toString()
        }
      });

      if (aiError) {
        throw new Error(`AI 처리 시작 실패: ${aiError.message}`);
      }

      if (DEBUG) console.log('🚀 AI 처리 시작됨:', aiResponse);

      // 3. 스트리밍 응답 대기
      await this.waitForStreamingResponse(
        fileName,
        onAudioChunk,
        onComplete,
        onError
      );

    } catch (error) {
      console.error('❌ 음성 처리 실패:', error);
      this.isProcessing = false;
      onError?.(error);
    }
  }

  /**
   * 스트리밍 응답을 대기하고 오디오 청크를 수신
   */
  async waitForStreamingResponse(fileName, onAudioChunk, onComplete, onError) {
    try {
      let isComplete = false;
      let audioChunks = [];
      let responseText = '';

      // 실시간 응답 모니터링 (Polling 방식)
      const pollInterval = setInterval(async () => {
        try {
          // 응답 상태 확인
          const { data: statusData, error: statusError } = await supabase
            .from('voice_chat_responses')
            .select('*')
            .eq('audio_file_name', fileName)
            .eq('request_id', this.currentRequestId)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          if (statusError && statusError.code !== 'PGRST116') {
            console.error('응답 상태 확인 실패:', statusError);
            return;
          }

          if (statusData) {
            // 새로운 오디오 청크가 있는지 확인
            if (statusData.audio_chunk && statusData.audio_chunk !== '') {
              audioChunks.push(statusData.audio_chunk);
              
              // 오디오 청크 콜백 호출
              onAudioChunk?.({
                chunk: statusData.audio_chunk,
                chunkIndex: audioChunks.length - 1,
                mimeType: statusData.mime_type || 'audio/mpeg',
                isComplete: statusData.is_complete
              });
            }

            // 응답 텍스트 업데이트
            if (statusData.response_text && statusData.response_text !== responseText) {
              responseText = statusData.response_text;
            }

            // 완료 여부 확인
            if (statusData.is_complete) {
              isComplete = true;
              clearInterval(pollInterval);
              
              if (DEBUG) console.log('✅ AI 응답 완료');
              
              // 완료 콜백 호출
              onComplete?.({
                audioChunks: audioChunks,
                responseText: responseText,
                totalChunks: audioChunks.length,
                mimeType: statusData.mime_type || 'audio/mpeg'
              });
              
              this.isProcessing = false;
            }
          }
        } catch (error) {
          console.error('응답 모니터링 중 오류:', error);
        }
      }, 200); // 200ms 간격으로 폴링

      // 타임아웃 설정 (60초)
      setTimeout(() => {
        if (!isComplete) {
          clearInterval(pollInterval);
          this.isProcessing = false;
          onError?.(new Error('응답 대기 시간이 초과되었습니다.'));
        }
      }, 60000);

    } catch (error) {
      console.error('스트리밍 응답 대기 실패:', error);
      this.isProcessing = false;
      onError?.(error);
    }
  }

  /**
   * 텍스트를 AI로 전송하여 음성 응답 생성
   * @param {string} text - 전송할 텍스트
   * @param {string} systemInstruction - AI 시스템 프롬프트
   * @param {Function} onAudioChunk - 오디오 청크 수신 시 콜백
   * @param {Function} onComplete - 완료 시 콜백
   * @param {Function} onError - 오류 시 콜백
   */
  async processTextToAI(
    text,
    systemInstruction,
    onAudioChunk,
    onComplete,
    onError
  ) {
    if (this.isProcessing) {
      throw new Error('이미 처리 중인 요청이 있습니다.');
    }

    this.isProcessing = true;
    
    try {
      if (DEBUG) console.log('💬 텍스트 AI 처리 시작...');
      
      // Edge Function 호출하여 텍스트 기반 AI 처리
      const { data: aiResponse, error: aiError } = await supabase.functions.invoke('ai-text-chat', {
        body: {
          text: text,
          systemInstruction: systemInstruction,
          requestId: this.currentRequestId = Date.now().toString()
        }
      });

      if (aiError) {
        throw new Error(`AI 처리 시작 실패: ${aiError.message}`);
      }

      if (DEBUG) console.log('🚀 AI 텍스트 처리 시작됨:', aiResponse);

      // 스트리밍 응답 대기
      await this.waitForStreamingResponse(
        `text_${this.currentRequestId}`,
        onAudioChunk,
        onComplete,
        onError
      );

    } catch (error) {
      console.error('❌ 텍스트 처리 실패:', error);
      this.isProcessing = false;
      onError?.(error);
    }
  }

  /**
   * 현재 처리 상태 확인
   */
  getProcessingStatus() {
    return {
      isProcessing: this.isProcessing,
      requestId: this.currentRequestId
    };
  }

  /**
   * 처리 중단
   */
  cancelProcessing() {
    if (this.isProcessing) {
      this.isProcessing = false;
      if (DEBUG) console.log('🛑 AI 처리 중단됨');
    }
  }
}

/**
 * 편의 함수: 음성 파일을 AI로 처리
 */
async function processVoiceToAI(
  audioFile,
  systemInstruction,
  onAudioChunk,
  onComplete,
  onError
) {
  const voiceChat = new SupabaseAIVoiceChat();
  return await voiceChat.processVoiceToAI(
    audioFile,
    systemInstruction,
    onAudioChunk,
    onComplete,
    onError
  );
}

/**
 * 편의 함수: 텍스트를 AI로 처리
 */
async function processTextToAI(
  text,
  systemInstruction,
  onAudioChunk,
  onComplete,
  onError
) {
  const voiceChat = new SupabaseAIVoiceChat();
  return await voiceChat.processTextToAI(
    text,
    systemInstruction,
    onAudioChunk,
    onComplete,
    onError
  );
}

// --- 대화형 세션 관리 ---

let conversationSession = null;

/**
 * 대화형 세션을 시작하거나 기존 세션을 가져옵니다.
 */
async function startOrGetConversationSession(systemInstruction) {
  if (conversationSession && conversationSession.isProcessing) {
    if (DEBUG) console.log('기존 AI 음성 채팅 세션을 사용합니다.');
    return conversationSession;
  }
  
  if (DEBUG) console.log('새로운 AI 음성 채팅 세션을 시작합니다.');
  conversationSession = new SupabaseAIVoiceChat();
  return conversationSession;
}

/**
 * 현재 대화 세션을 종료합니다.
 */
async function endConversationSession() {
  if (conversationSession) {
    conversationSession.cancelProcessing();
    conversationSession = null;
    if (DEBUG) console.log('AI 음성 채팅 대화 세션이 종료되었습니다.');
  }
}

export { 
  SupabaseAIVoiceChat,
  processVoiceToAI,
  processTextToAI,
  startOrGetConversationSession,
  endConversationSession
};