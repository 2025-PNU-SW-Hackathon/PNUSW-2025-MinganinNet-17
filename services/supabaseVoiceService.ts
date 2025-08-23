import { supabase } from '../backend/supabase/client';
import { decode } from 'base64-arraybuffer';

export interface VoiceChatResult {
  fullResponseText: string;
  audioQueue: string[];
  userText: string;
}

export type PollingCallbacks = {
  onUserText: (text: string) => void;
  onTextChunk: (textChunk: string) => void;
  onAudioChunk: (audioChunk: string) => void;
  onEnd: (result: VoiceChatResult) => void;
  onError: (error: string) => void;
};

/**
 * 음성 파일을 Supabase에 업로드하고, Edge Function을 호출한 뒤,
 * 데이터베이스 폴링을 통해 실시간으로 답변을 가져옵니다.
 * @param audio_base64 Base64로 인코딩된 오디오 파일
 * @param system_instruction 시스템 지시사항 프롬프트
 * @param callbacks 실시간 응답 처리를 위한 콜백 함수 객체
 */
export async function processVoiceWithPolling(
  audio_base64: string,
  system_instruction: string,
  callbacks: PollingCallbacks
): Promise<void> {
  const requestId = Date.now().toString();
  const audioFileName = `voice_${requestId}.m4a`;

  try {
    // 인증 상태 확인
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    console.log('[음성채팅] 인증 상태 확인:', { 
      user: user?.id ? '인증됨' : '인증 안됨', 
      userId: user?.id,
      authError: authError?.message 
    });
    // 1. Base64 음성 파일을 ArrayBuffer로 디코딩하여 Supabase Storage에 업로드합니다.
    const audioArrayBuffer = decode(audio_base64);
    
    // React Native 환경에서는 ArrayBuffer를 직접 업로드
    const { error: uploadError } = await supabase.storage
      .from('voice-chat')
      .upload(audioFileName, audioArrayBuffer, {
        contentType: 'audio/m4a',
      });

    if (uploadError) {
      throw new Error(`음성 파일 업로드 실패: ${uploadError.message}`);
    }

    // 2. Edge Function을 호출하여 AI 처리를 시작합니다.
    const { error: invokeError } = await supabase.functions.invoke('rapid-responder', {
      body: {
        audio: audio_base64,           // ✅ 'audio'로 변경
        instruction: system_instruction, // ✅ 'instruction'으로 변경
      },
    });

    if (invokeError) {
      throw new Error(`Edge Function 호출 실패: ${invokeError.message}`);
    }

    // 3. 데이터베이스 폴링을 시작합니다.
    let lastChunkIndex = -1;
    let isCompleted = false;
    let fullResponseText = '';
    let userText = '';
    const audioQueue: string[] = [];

    const pollId = setInterval(async () => {
      if (isCompleted) {
        clearInterval(pollId);
        return;
      }

      const { data, error } = await supabase
        .from('voice_chat_responses')
        .select('*')
        .eq('request_id', requestId)
        .order('chunk_index', { ascending: true });

      if (error) {
        console.error('폴링 중 DB 오류:', error);
        // 'PGRST116'는 결과가 아직 없다는 의미일 수 있으므로, 에러로 처리하지 않습니다.
        if (error.code !== 'PGRST116') {
            callbacks.onError(`데이터 조회 실패: ${error.message}`);
            clearInterval(pollId);
        }
        return;
      }

      if (data && data.length > 0) {
        // 사용자 텍스트가 설정되지 않았고, 첫 번째 응답에 텍스트가 있다면 콜백을 호출합니다.
        if (!userText && data[0].user_text) {
          userText = data[0].user_text;
          callbacks.onUserText(userText);
        }

        // 수신된 모든 행을 순회하며 새로운 청크가 있는지 확인합니다.
        for (const row of data) {
          // is_complete 플래그가 있는 마지막 행을 처리합니다.
          if (row.is_complete) {
            isCompleted = true;
            // 최종 텍스트 상태를 확인하고 마지막 텍스트 조각을 전달합니다.
            if (row.response_text && row.response_text.length > fullResponseText.length) {
              const newTextChunk = row.response_text.substring(fullResponseText.length);
              callbacks.onTextChunk(newTextChunk);
              fullResponseText = row.response_text;
            }
            callbacks.onEnd({ fullResponseText, audioQueue, userText });
            clearInterval(pollId);
            return; // 폴링 종료
          }

          // 아직 처리하지 않은 새로운 청크인 경우에만 처리합니다.
          if (row.chunk_index != null && row.chunk_index > lastChunkIndex) {
            // 오디오 청크를 큐에 추가하고 콜백을 호출합니다.
            if (row.audio_chunk) {
              callbacks.onAudioChunk(row.audio_chunk);
              audioQueue.push(row.audio_chunk);
            }
            
            // 전체 응답 텍스트에서 새로운 부분을 추출하여 콜백을 호출합니다.
            if (row.response_text && row.response_text.length > fullResponseText.length) {
              const newTextChunk = row.response_text.substring(fullResponseText.length);
              callbacks.onTextChunk(newTextChunk);
              fullResponseText = row.response_text;
            }
            lastChunkIndex = row.chunk_index;
          }
        }
      }
    }, 1500); // 1.5초 간격으로 폴링

    // 60초 후에도 완료되지 않으면 타임아웃 처리합니다.
    setTimeout(() => {
      if (!isCompleted) {
        clearInterval(pollId);
        callbacks.onError('응답 대기 시간이 초과되었습니다.');
      }
    }, 60000);

  } catch (error) {
    console.error('[processVoiceWithPolling] 처리 중 오류 발생:', error);
    callbacks.onError(error instanceof Error ? error.message : String(error));
  }
}